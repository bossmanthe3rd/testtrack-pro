import { Request, Response } from "express";
import * as bugService from "./bug.service";
import { updateBugStatusSchema, requestRetestSchema } from './bug.validation';

export const createBug = async (req: Request, res: Response) => {
  try {
    const reportedById = (req as any).user!.id; 
    const bugData = req.body;
    const newBug = await bugService.createBug(bugData, reportedById);
    res.status(201).json({ success: true, data: newBug });
  } catch (error: any) {
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

// 🟢 NEW: Controller to fetch a single bug by ID
export const getBugById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bug = await bugService.getBugById(id as string);
    
    if (!bug) {
      return res.status(404).json({ success: false, message: "Bug not found" });
    }
    
    res.status(200).json({ success: true, data: bug });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const developerId = req.user.id; 
    
    const validatedData = updateBugStatusSchema.parse(req.body);

    const updatedBug = await bugService.updateBugStatus(
      id as string, 
      developerId, 
      validatedData.status, 
      validatedData.fixNotes, 
      validatedData.commitHash
    );

    res.status(200).json({ success: true, data: updatedBug });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyBugs = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const developerId = req.user.id;
    const filters = req.query;

    const bugs = await bugService.getBugsAssignedToMe(developerId, filters);
    res.status(200).json({ success: true, data: bugs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestBugRetest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const developerId = req.user.id;
    
    const validatedData = requestRetestSchema.parse(req.body);

    const updatedBug = await bugService.requestRetest(
      id as string, 
      developerId, 
      validatedData.fixNotes, 
      validatedData.commitHash
    );

    res.status(200).json({ success: true, data: updatedBug, message: "Retest requested successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDevelopersList = async (req: Request, res: Response) => {
  try {
    const developers = await bugService.getDevelopersList();
    res.status(200).json({ success: true, data: developers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};