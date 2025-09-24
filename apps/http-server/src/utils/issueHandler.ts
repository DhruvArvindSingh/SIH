import type { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import uploadToS3 from "./uploadToS3.js";
import uploadToHelia from "./uploadToHelia.js";
import { sendToML, checkMLServerHealth } from "./sendToML.js";
import { postgresClient as prisma } from "../database/index.js";

interface LocationDetails {
    city: string;
    district: string;
    roadName: string;
    state: string;
    country: string;
    postalCode: string;
    neighborhood: string;
    landmark: string;
    placeId: string;
    formattedAddress: string;
    addressComponents: Array<{
        longName: string;
        shortName: string;
        types: string[];
    }>;
    placeTypes: string[];
}

interface IssueData {
    email: string;
    content: string;
    city: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    district: string;
    locationDetails?: LocationDetails;
}

export async function handleIssuePost(
    req: Request,
    res: Response,
    issueType: string,
    tableName: string
): Promise<void> {
    const { email, content, city, coordinates, district, locationDetails }: IssueData = req.body;
    console.log(
        "request body =", req.body
    )

    // Validate required fields
    if (!email || !content || !city || !coordinates || !district) {
        res.status(400).json({
            success: false,
            message: "Missing required fields",
            error: "VALIDATION_ERROR"
        });
        return;
    }

    // Determine file extension from content type
    let fileExtension = '.png'; // default
    if (typeof content === 'string' && content.startsWith('data:')) {
        const mimeMatch = content.match(/data:image\/([^;]+);/);
        if (mimeMatch) {
            const mimeType = mimeMatch[1];
            fileExtension = mimeType === 'jpeg' ? '.jpg' : `.${mimeType}`;
        }
    }

    const fileName = `${email}-${Date.now()}-${uuidv4()}${fileExtension}`;
    let imageURL: string | null = null;
    let imageDID: string | any = null;
    let mlDetectionResults: any = null;

    try {
        imageURL = await uploadToS3(email, issueType, content, fileName);
        if (imageURL === null) {
            console.error("Error uploading image to S3");
            res.status(500).json({
                success: false,
                message: "Failed to upload image to S3",
                error: "UPLOAD_ERROR"
            });
            return;
        }
    } catch (error) {
        console.error("Error uploading image to S3:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload image to S3",
            error: "UPLOAD_ERROR"
        });
        return;
    }

    // Upload to Helia (optional, don't fail if it doesn't work)
    try {
        imageDID = await uploadToHelia(content, email, city, fileName);
        console.log("imageDID", imageDID);
        if (imageDID === null) {
            console.error("Error uploading image to Helia");
        }
    } catch (error) {
        console.error("Error uploading image to Helia:", error);
        // Don't fail the request if Helia upload fails, continue with S3 URL
    }

    // Send to ML server for detection (optional, don't fail if ML server is down)
    let mlResult: any = null;
    let annotatedImageURL: string | null = null;

    try {
        console.log(`Sending ${issueType} image to ML server for detection...`);
        mlResult = await sendToML(content, issueType, fileName);

        if (mlResult.success && mlResult.data) {
            mlDetectionResults = mlResult.data;
            console.log(`ML Detection completed for ${issueType}:`, {
                detections: mlDetectionResults.total_detections,
                priority: mlDetectionResults.priority
            });

            // Upload annotated image if available
            const annotatedImageContent = mlResult.data?.annotated_image;
            if (annotatedImageContent && typeof annotatedImageContent === 'string' && annotatedImageContent.startsWith('data:')) {
                console.log('Uploading annotated image to S3...');

                // Determine file extension for annotated image
                let annotatedFileExtension = '.png'; // default
                const mimeMatch = annotatedImageContent.match(/data:image\/([^;]+);/);
                if (mimeMatch) {
                    const mimeType = mimeMatch[1];
                    annotatedFileExtension = mimeType === 'jpeg' ? '.jpg' : `.${mimeType}`;
                }

                const annotatedFileName = `${email}-${Date.now()}-${uuidv4()}-annotated${annotatedFileExtension}`;

                try {
                    annotatedImageURL = await uploadToS3(email, `${issueType}_Annotated`, annotatedImageContent, annotatedFileName);
                    if (annotatedImageURL) {
                        console.log('Annotated image uploaded successfully:', annotatedFileName);
                    } else {
                        console.error("Failed to upload annotated image to S3");
                    }
                } catch (error) {
                    console.error("Error uploading annotated image to S3:", error);
                    // Don't fail the main request if annotated image upload fails
                }
            } else {
                console.warn('No annotated image received from ML server or invalid format');
            }
        } else {
            console.warn(`ML Detection failed for ${issueType}:`, mlResult.error);
        }
    } catch (error) {
        console.error("Error sending to ML server:", error);
        // Don't fail the request if ML detection fails, continue without it
    }

    try {
        if (!prisma) {
            res.status(500).json({
                success: false,
                message: "Database connection not available",
                error: "DATABASE_ERROR"
            });
            return;
        }

        const table = (prisma as any)[tableName];

        // Prepare the base data
        const baseData = {
            email,
            originalS3URL: imageURL,
            finalS3URL: annotatedImageURL || imageURL, // Use annotated image if available, otherwise original
            heliaDID: imageDID ? imageDID.toString() : null,
            city,
            district,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Add extended location details if available
        let extendedData = locationDetails ? {
            ...baseData,
            roadName: locationDetails.roadName || null,
            state: locationDetails.state || null,
            country: locationDetails.country || null,
            postalCode: locationDetails.postalCode || null,
            neighborhood: locationDetails.neighborhood || null,
            landmark: locationDetails.landmark || null,
            placeId: locationDetails.placeId || null,
            formattedAddress: locationDetails.formattedAddress || null,
            placeTypes: locationDetails.placeTypes ? JSON.stringify(locationDetails.placeTypes) : null,
        } : baseData;

        // Add ML detection results if available
        if (mlDetectionResults) {
            const avgConfidence = mlDetectionResults.detections.length > 0
                ? mlDetectionResults.detections.reduce((sum: number, det: any) => sum + det.confidence, 0) / mlDetectionResults.detections.length
                : null;

            (extendedData as any).mlDetections = JSON.stringify(mlDetectionResults.detections);
            (extendedData as any).mlPriority = mlDetectionResults.priority;
            (extendedData as any).mlConfidence = avgConfidence;
            (extendedData as any).totalDetections = mlDetectionResults.total_detections;
        }

        const record = await table.create({
            data: extendedData
        });

        if (record) {
            const responseData: any = {
                Id: record.id,  // Issue ID as 'Id'
                imageUrl: imageURL  // Original S3 image URL as 'imageUrl'
            };

            // Add annotated image URL if available
            if (annotatedImageURL) {
                responseData.annotatedImageUrl = annotatedImageURL;
            }

            // Include ML detection results in response if available
            if (mlDetectionResults) {
                responseData.mlDetection = {
                    detections: mlDetectionResults.detections,
                    priority: mlDetectionResults.priority,
                    totalDetections: mlDetectionResults.total_detections,
                    avgConfidence: mlDetectionResults.detections.length > 0
                        ? mlDetectionResults.detections.reduce((sum: number, det: any) => sum + det.confidence, 0) / mlDetectionResults.detections.length
                        : null
                };
            }

            res.status(200).json({
                success: true,
                message: `${issueType} posted successfully${mlDetectionResults ? ' with ML analysis' : ''}`,
                data: responseData
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to save record to database",
                error: "DATABASE_ERROR"
            });
        }
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save record to database",
            error: "DATABASE_ERROR"
        });
    }
}
