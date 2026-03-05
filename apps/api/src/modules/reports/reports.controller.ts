import { Request, Response } from 'express';
import * as reportsService from './reports.service';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const data = await reportsService.getDashboardSummaryStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
  }
};

export const getExecutionReport = async (req: Request, res: Response) => {
  try {
    const data = await reportsService.getExecutionReportStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching execution report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch execution report' });
  }
};

export const getBugReport = async (req: Request, res: Response) => {
  try {
    const data = await reportsService.getBugReportStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bug report' });
  }
};
// --- NEW CONTROLLERS ---
export const getTesterPerformance = async (req: Request, res: Response) => {
  try {
    // req.user is populated by our authMiddleware!
    const userId = (req as any).user.id; 
    const data = await reportsService.getTesterPerformanceMetrics(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tester performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tester performance' });
  }
};

export const getDeveloperPerformance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await reportsService.getDeveloperPerformanceMetrics(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching developer performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch developer performance' });
  }
};