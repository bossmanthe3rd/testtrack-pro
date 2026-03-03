import { Router } from 'express';
import { handleCreateTestCase, getTestCases, updateTestCase, cloneTestCase } from './testCase.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// Protect the route: Must be logged in AND must be a TESTER
router.post('/', authMiddleware, authorize('TESTER', 'DEVELOPER'), handleCreateTestCase);
// NEW: Add the GET route for listing test cases
// Notice we use router.get() instead of router.post()
// Both TESTER and DEVELOPER can read the full repository
router.get(
    '/',
    authMiddleware,
    authorize('TESTER', 'DEVELOPER'),
    getTestCases
);
router.get("/:id", authMiddleware, getTestCases);

// Update a test case (Only TESTER can edit)
router.put(
  "/:id", 
  authMiddleware, 
  authorize("TESTER"), 
  updateTestCase
);
router.post(
  "/:id/clone", 
  authMiddleware, 
  authorize("TESTER"), 
  cloneTestCase
);
export default router;