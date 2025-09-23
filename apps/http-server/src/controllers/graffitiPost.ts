import dotenv from "dotenv";
import { postgresClient as prisma } from "../database/index.js";
import type { Request, Response } from "express";
import uploadToS3 from "../utils/uploadToS3.js";
import uploadToHelia from "../utils/uploadToHelia.js";
dotenv.config();

export default async function graffitiPost(req: Request, res: Response): Promise<void> {
    const { email, content, city, coordinates, district } = req.body;
    const fileName = `${email}-${Date.now()}`;
    let imageURL: string | null = null;
    let imageDID: string | any = null;
    try {
        imageURL = await uploadToS3(email, 'Graffiti', content, fileName);
        if (imageURL === null) {
            console.error("Error uploading image to S3");
        }
    } catch (error) {
        console.error("Error uploading image to S3:", error);
    }
    try {
        imageDID = uploadToHelia(content, email, city, fileName);
        if (imageDID === null) {
            console.error("Error uploading image to Helia");
        }
    } catch (error) {
        console.error("Error uploading image to Helia:", error);
    }
    if (imageURL !== null && imageDID !== null) {
        const graffiti = await prisma?.graffiti.create({
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
        if (graffiti) {
            res.status(200).json({
                success: true,
                message: "Graffiti posted successfully",
            });
        }
    }
}