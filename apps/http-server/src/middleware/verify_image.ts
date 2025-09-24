import hash from '../utils/hash.js';
import type { Request, Response, NextFunction } from 'express';
import { postgresClient as prisma } from '../database/index.js';

export default async function verify_image(req: Request, res: Response, next: NextFunction) {
    const image = req.body.content;
    const imageHash = await hash(image);
    try {
        const response = await prisma?.images.create({
            data: {
                imageHash: imageHash
            }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: "Image with this content already exists",
                code: "IMAGE_EXISTS"
            });
        }
        return res.status(500).json({
            success: false,
            error: "Failed to process image",
            code: "INTERNAL_ERROR"
        });
    }
    next();
}