import { Router } from 'express';
import { 
  getDashboardSummary, 
  getExecutionReport, 
  getBugReport,
  getTesterPerformance,
  getDeveloperPerformance
} from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// Apply auth middleware to all report routes so only logged-in users can access them
router.use(authMiddleware);

// Global stats
router.get('/dashboard', getDashboardSummary);
router.get('/executions', getExecutionReport);
router.get('/bugs', getBugReport);

// Role-specific stats (Protected so only the right roles can query them!)
router.get('/tester-metrics', authorize('TESTER'), getTesterPerformance);
router.get('/developer-metrics', authorize('DEVELOPER'), getDeveloperPerformance);

export default router;