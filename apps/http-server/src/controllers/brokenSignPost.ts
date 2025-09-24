import type { Request, Response } from "express";
import { handleIssuePost } from "../utils/issueHandler.js";
import dotenv from "dotenv";
// import uploadToStoracha from "../utils/uploadToStoracha.js";
dotenv.config();

export default async function brokenSignPost(req: Request, res: Response): Promise<void> {
    await handleIssuePost(req, res, "BrokenSign", "brokenSign");
}