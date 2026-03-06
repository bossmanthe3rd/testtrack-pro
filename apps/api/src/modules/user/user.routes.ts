import { Router } from 'express';
import { getProfile, updateProfile, getUserStats } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// All user profile routes require authentication
router.use(authMiddleware);

// GET  /api/users/profile — fetch own profile
router.get('/profile', getProfile);

// PATCH /api/users/profile — update name / email
router.patch('/profile', updateProfile);

// GET  /api/users/stats — contribution metrics
router.get('/stats', getUserStats);

export default router;
