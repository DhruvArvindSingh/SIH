import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../database/s3/index.js";
import dotenv from "dotenv";
import { retryApiCall } from "./apiRetry.js";


dotenv.config();

const BUCKET = process.env.S3_BUCKET;

export default async function uploadToS3(email: string, type: string, content: string, fileName: string) {


    let fileBuffer: Buffer;
    if (typeof content === 'string') {
        // Handle base64 content
        if (content.startsWith('data:')) {
            // Remove data URL prefix
            const base64Data = content.replace(/^data:.*?;base64,/, '');
            fileBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // Assume it's already base64
            fileBuffer = Buffer.from(content, 'base64');
        }
    } else if (Buffer.isBuffer(content)) {
        fileBuffer = content;
    } else {
        fileBuffer = Buffer.from(content);
    }

    console.log("File buffer size:", fileBuffer.length, "bytes");

    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
        const ext = filename.toLowerCase().split('.').pop();
        const contentTypes: { [key: string]: string } = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon'
        };
        return contentTypes[ext || ''] || 'image/png';
    };

    const contentType = getContentType(fileName);

    const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${type}/${email}/${fileName}`,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000' // Cache for 1 year
    });

    await retryApiCall(
        () => s3.send(uploadCommand),
        {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 5000
        }
    );
    return `https://sih-2.s3.ap-south-1.amazonaws.com/${type}/${email}/${fileName}`;
}