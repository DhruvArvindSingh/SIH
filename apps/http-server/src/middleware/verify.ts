import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

// Extend the Express Request interface to include custom properties
declare global {
    namespace Express {
        interface Request {
            userEmail?: string;
        }
    }
}

interface JWTPayload {
    email: string;
    iat: number;
}

const JWT_SECRET: string = process.env.JWT_SECRET as string;

export default function verify(req: Request, res: Response, next: NextFunction): void {
    const token = req.body.token;

    console.log(`token = ${token}`);
    if (token) {
        jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
            if (err) {
                console.error("JWT verification error:", err);
                res.status(401).json({
                    success: false,
                    message: "Invalid token",
                    error: "UNAUTHORIZED"
                });
            } else {
                const payload = decoded as JWTPayload;
                // Add email to both req and req.body for backward compatibility
                req.userEmail = payload.email;
                req.body.email = payload.email;
                console.log("JWT verified for user:", payload.email);
                next();
            }
        });
    } else {
        console.error("No token provided");
        res.status(401).json({
            success: false,
            message: "No token provided",
            error: "UNAUTHORIZED"
        });
    }
}