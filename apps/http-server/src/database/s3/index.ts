import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const REGION = process.env.S3_REGION;
const ACCESS_KEY = process.env.S3_ACCESS_KEY;
const SECRET_KEY = process.env.S3_SECRET_KEY;

const s3 = new S3Client({
    region: REGION as string,
    credentials: {
        accessKeyId: ACCESS_KEY as string,
        secretAccessKey: SECRET_KEY as string,
    } as {
        accessKeyId: string;
        secretAccessKey: string;
    },
});

export default s3;