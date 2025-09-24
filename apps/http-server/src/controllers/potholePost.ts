import type { Request, Response } from "express";
import { handleIssuePost } from "../utils/issueHandler.js";

export default async function potholePost(req: Request, res: Response): Promise<void> {
    await handleIssuePost(req, res, "Pothole", "pothole");
}
