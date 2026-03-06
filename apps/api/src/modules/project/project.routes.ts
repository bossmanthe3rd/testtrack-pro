import { Router } from 'express';
import {
  getProjectList,
  getProjects,
  getProject,
  getProjectContent,
  createProject,
  updateProject,
} from './project.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

// ── Specific routes first (must be before /:id) ──────────────────────────────

// GET /api/projects/list — lightweight {id,name} list for dropdowns (all roles)
router.get('/list', getProjectList);

// GET /api/projects — full list with stats (all roles)
router.get('/', getProjects);

// POST /api/projects — create (TESTER + ADMIN only)
router.post('/', authorize('TESTER', 'ADMIN'), createProject);

// ── Dynamic ID routes ─────────────────────────────────────────────────────────

// GET /api/projects/:id
router.get('/:id', getProject);

// GET /api/projects/:id/content — test cases & bugs for detail page
router.get('/:id/content', getProjectContent);

// PATCH /api/projects/:id — edit (TESTER + ADMIN only)
router.patch('/:id', authorize('TESTER', 'ADMIN'), updateProject);

export default router;
