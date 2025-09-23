import dotenv from "dotenv";
import { postgresClient as prisma } from "../database/index.js";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import uploadToS3 from "../utils/uploadToS3.js";
import uploadToHelia from "../utils/uploadToHelia.js";
dotenv.config();

export default async function potholePost(req: Request, res: Response): Promise<void> {
    const { email, content, city, coordinates, district } = req.body;
    const fileName = `${email}-${Date.now()}-${uuidv4()}`;
    let imageURL: string | null = null;
    let imageDID: string | any = null;
    try {
        imageURL = await uploadToS3(email, 'Pothole', content, fileName);
        if (imageURL === null) {
            console.error("Error uploading image to S3");
        }
    } catch (error) {
        console.error("Error uploading image to S3:", error);
    }
    try {
        imageDID = await uploadToHelia(content, email, city, fileName);
        console.log("imageDID", imageDID);
        if (imageDID === null) {
            console.error("Error uploading image to Helia");
        }
    } catch (error) {
        console.error("Error uploading image to Helia:", error);
    }
    if (imageURL !== null) {
        const pothole = await prisma?.pothole.create({
            data: {
                email,
                originalS3URL: imageURL,
                finalS3URL: imageURL,
                heliaDID: imageDID.toString(),
                city,
                district,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                status: 'Pending',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        if (pothole) {
            res.status(200).json({
                success: true,
                message: "Pothole posted successfully",
            });
        }
    }
}