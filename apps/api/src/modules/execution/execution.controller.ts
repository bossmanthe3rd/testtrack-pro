import { Request, Response } from 'express';
import * as ExecutionService from './execution.service';

export const startExecution = async (req: Request, res: Response) => {
  try {
    const { testCaseId, testRunId } = req.body;
    // Assuming your auth middleware attaches the user to req.user
    const executedById = (req as any).user.id; 

    const execution = await ExecutionService.startExecution(testCaseId, executedById, testRunId);
    res.status(201).json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const saveStep = async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const { stepNumber, status, actualResult, notes } = req.body;

    const step = await ExecutionService.saveExecutionStep(executionId as string, stepNumber, status, actualResult, notes);
    res.status(201).json(step);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const completeExecution = async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;
    const finalExecution = await ExecutionService.completeExecution(executionId as string);
    res.status(200).json(finalExecution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { testCaseId } = req.params;
    const history = await ExecutionService.getExecutionHistory(testCaseId as string);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};