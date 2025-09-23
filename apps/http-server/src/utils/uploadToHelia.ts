
import heliaClient from "../database/helia/index.js";


export default async function uploadToHelia(email: string, type: string, content: string, fileName: string): Promise<any> {


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

    const obj = {
        email,
        type,
        content,
        fileName,
        contentType
    }

    return await heliaClient.add(obj);
}