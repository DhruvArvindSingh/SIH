import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { postgresClient as prisma } from "../database/index.js";
import type { Request, Response } from "express";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function signin_post(req: Request, res: Response): Promise<void> {
    console.log("POST /signin received");

    try {
        const { email, password } = req.body;
        console.log("email =", email);
        console.log("password =", password);

        // Check if database is available
        if (!prisma) {
            res.status(503).json({
                success: false,
                error: "Database service unavailable. Please contact administrator.",
                code: "DATABASE_UNAVAILABLE"
            });
            return;
        }

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: "Email and password are required",
                code: "MISSING_FIELDS"
            });
            return;
        }

        // Try to find existing user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!existingUser) {
            res.status(401).json({
                success: false,
                error: "Invalid email or password",
                code: "INVALID_CREDENTIALS"
            });
            return;
        } else {
            if (existingUser.password !== password) {
                res.status(401).json({
                    success: false,
                    error: "Invalid email or password",
                    code: "INVALID_CREDENTIALS"
                });
                return;
            }
        }

        const token = jwt.sign({ email: email }, JWT_SECRET);
        console.log("token =", token);
        res.status(200).json({
            success: true,
            message: "Signin successful",
            data: {
                token: token,
                email: email
            }
        });
    } catch (e: any) {
        console.error("An error occurred during signin:", e);
        res.status(500).json({
            success: false,
            error: "Signin failed. Please try again later.",
            code: "INTERNAL_ERROR"
        });
    }
}