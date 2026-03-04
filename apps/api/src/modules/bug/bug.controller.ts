import { Request, Response } from "express";
import * as bugService from "./bug.service";


export const createBug = async (req: Request, res: Response) => {
  try {
    // req.user comes from your auth middleware
    const reportedById = (req as any).user!.id; 
    const bugData = req.body;

    const newBug = await bugService.createBug(bugData, reportedById);
    res.status(201).json({ success: true, data: newBug });
  } catch (error: any) {
    console.error("🚨 500 ERROR IN CREATE BUG CONTROLLER:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBugs = async (req: Request, res: Response) => {
  try {
    const filters = req.query;
    const bugs = await bugService.getBugs(filters);
    res.status(200).json({ success: true, data: bugs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};