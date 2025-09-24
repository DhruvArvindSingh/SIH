import express from "express";
import dotenv from "dotenv";
import {
    healthGet,
    signinPost,
    signupPost,
    potholePost,
    streetLightPost,
    garbagePost,
    brokenSignPost,
    fallenTreePost,
    graffitiPost,
    dashboardGet
} from "./controllers/index.js";
import hash_pass from "./middleware/hash_pass.js";
import verify from "./middleware/verify.js";
import verify_image from "./middleware/verify_image.js";
import cors from "cors";


dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Increase payload size limits for image uploads (base64 images can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

app.get('/health', healthGet);


// Auth Endpoints
app.post('/api/v1/auth/signin', hash_pass, signinPost);
app.post('/api/v1/auth/signup', hash_pass, signupPost);
app.post('/api/v1/auth/verify', verify, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Token verified",
        data: {
            email: req.body.email
        }
    });
});

// Complaint Endpoints
app.post('/api/v1/pothole', verify, verify_image, potholePost);
app.post('/api/v1/street-light', verify, verify_image, streetLightPost);
app.post('/api/v1/garbage', verify, verify_image, garbagePost);
app.post('/api/v1/broken-sign', verify, verify_image, brokenSignPost);
app.post('/api/v1/fallen-tree', verify, verify_image, fallenTreePost);
app.post('/api/v1/graffiti', verify, verify_image, graffitiPost);

// Dashboard Endpoint
app.post('/api/v1/dashboard', verify, dashboardGet);


// Add error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

// Graceful shutdown handler
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Graceful shutdown...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});