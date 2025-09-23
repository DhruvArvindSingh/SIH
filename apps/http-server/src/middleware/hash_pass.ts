
import hash from '../utils/hash.js';
import type { Request, Response, NextFunction } from 'express';

export default async function hash_pass(req: Request, res: Response, next: NextFunction) {
    console.log("hash_pass called");
    console.log("req.body =", req.body);
    if (!req.body.password) {
        return res.status(400).json({
            success: false,
            error: "Password is required",
            code: "MISSING_FIELDS"
        });
    } else {
        req.body.password = await hash(req.body.password);
    }
    next();
}