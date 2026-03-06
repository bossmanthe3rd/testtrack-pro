import { Request, Response } from 'express';
import * as userService from './user.service';

// GET /api/users/profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const profile = await userService.getUserProfile(userId);
    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: profile });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};

// PATCH /api/users/profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { name, email } = req.body;

    // Explicitly block role/id changes — belt-and-suspenders safety
    if (req.body.role || req.body.id) {
      return res.status(403).json({ success: false, message: 'You cannot change your role or ID.' });
    }

    const updated = await userService.updateUserProfile(userId, { name, email });
    res.status(200).json({ success: true, data: updated });
  } catch (error: unknown) {
    const e = error as Error;
    // Prisma unique constraint violation (email taken)
    if (e.message.includes('Unique constraint')) {
      return res.status(409).json({ success: false, message: 'Email is already in use.' });
    }
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/users/stats
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const stats = await userService.getUserStats(userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};
