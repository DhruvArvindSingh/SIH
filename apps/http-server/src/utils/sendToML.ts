import fetch from 'node-fetch';
import FormData from 'form-data';

interface MLDetectionResult {
    detections: Array<{
        class: string;
        confidence: number;
        bbox: number[];
    }>;
    priority: string;
    total_detections: number;
    annotated_image?: string;
}

interface MLResponse {
    success: boolean;
    data?: MLDetectionResult;
    error?: string;
}

/**
 * Sends image content to FastAPI ML server for detection
 * @param content - Base64 encoded image data or file buffer
 * @param issueType - Type of issue to detect (pothole, garbage, etc.)
 * @param fileName - Name of the file
 * @returns Promise with ML detection results
 */
export async function sendToML(
    content: string | Buffer,
    issueType: string,
    fileName: string
): Promise<MLResponse> {
    try {
        const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

        // Map issue types to ML endpoints
        const endpointMap: { [key: string]: string } = {
            'Pothole': 'pothole',
            'Garbage': 'garbage',
            'FallenTree': 'fallentree',
            'BrokenSign': 'brokensignage',
            'StreetLight': 'streetlight',
            'Graffiti': 'garbage' // Use garbage detection for graffiti as fallback
        };

        console.log(`sendToML called with issueType: ${issueType}`);
        const endpoint = endpointMap[issueType];
        if (!endpoint) {
            console.log(`Available endpoints:`, Object.keys(endpointMap));
            return {
                success: false,
                error: `Unsupported issue type: ${issueType}`
            };
        }
        console.log(`Using endpoint: ${endpoint}`);

        // Convert base64 to buffer if needed
        let imageBuffer: Buffer;
        if (typeof content === 'string') {
            // Remove data URL prefix if present
            const base64Data = content.replace(/^data:image\/[a-z]+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            imageBuffer = content;
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: fileName,
            contentType: 'image/jpeg'
        });

        // Send to ML server
        const response = await fetch(`${ML_SERVER_URL}/${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            timeout: 30000 // 30 second timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`ML server error (${response.status}):`, errorText);
            return {
                success: false,
                error: `ML server error: ${response.status} - ${errorText}`
            };
        }

        const result = await response.json() as any;
        console.log('result', result)

        // Map response to our format
        const mappedResult: MLDetectionResult = {
            detections: result.detections || [],
            priority: result[Object.keys(result).find(key => key.includes('priority')) || 'priority'] || 'low',
            total_detections: result.total_detections || 0,
            annotated_image: result.annotated_image
        };

        console.log(`ML Detection Results for ${issueType}:`, {
            total_detections: mappedResult.total_detections,
            priority: mappedResult.priority,
            detections_summary: mappedResult.detections.map(d => `${d.class} (${d.confidence.toFixed(3)})`)
        });

        return {
            success: true,
            data: mappedResult,
        };

    } catch (error) {
        console.error('Error sending to ML server:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Batch send multiple images to ML server
 * @param images - Array of image data with metadata
 * @returns Promise with array of ML detection results
 */
export async function sendBatchToML(
    images: Array<{
        content: string | Buffer;
        issueType: string;
        fileName: string;
        id?: string;
    }>
): Promise<Array<MLResponse & { id?: string }>> {
    const promises = images.map(async (image) => {
        const result = await sendToML(image.content, image.issueType, image.fileName);
        return {
            ...result,
            ...(image.id !== undefined && { id: image.id })
        };
    });

    return Promise.all(promises);
}

/**
 * Check if ML server is available
 * @returns Promise<boolean> - true if ML server is responding
 */
export async function checkMLServerHealth(): Promise<boolean> {
    try {
        const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';
        const response = await fetch(`${ML_SERVER_URL}/`, {
            method: 'GET',
            timeout: 5000
        });
        return response.ok;
    } catch (error) {
        console.warn('ML server health check failed:', error);
        return false;
    }
}

export default sendToML;
