import type { Request, Response } from "express";
import { handleIssuePost } from "../utils/issueHandler.js";
import dotenv from "dotenv";
dotenv.config();

export default async function garbagePost(req: Request, res: Response): Promise<void> {
    await handleIssuePost(req, res, "Garbage", "garbage");
}