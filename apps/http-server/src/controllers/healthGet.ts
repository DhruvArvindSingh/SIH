import type { Request, Response } from "express";

export default async function healthGet(req: Request, res: Response) {
    res.status(200).json({ message: "OK" });
}