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
    graffitiPost
} from "./controllers/index.js";
import hash_pass from "./middleware/hash_pass.js";
import verify from "./middleware/verify.js";
import cors from "cors";


dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.post('/api/v1/pothole', verify, potholePost);
app.post('/api/v1/street-light', verify, streetLightPost);
app.post('/api/v1/garbage', verify, garbagePost);
app.post('/api/v1/broken-sign', verify, brokenSignPost);
app.post('/api/v1/fallen-tree', verify, fallenTreePost);
app.post('/api/v1/graffiti', verify, graffitiPost);



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