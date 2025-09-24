import type { Request, Response } from "express";
import { handleIssuePost } from "../utils/issueHandler.js";

export default async function fallenTreePost(req: Request, res: Response): Promise<void> {
    await handleIssuePost(req, res, "FallenTree", "fallenTree");
}