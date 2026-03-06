import { Router } from 'express';
import { handleCreateTestCase, getTestCases, getTestCase, updateTestCase, updateTestCaseStatus, cloneTestCase, deleteTestCase } from './testCase.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// Protect the route: Must be logged in AND must be a TESTER
router.post('/', authMiddleware, authorize('TESTER', 'DEVELOPER', 'ADMIN'), handleCreateTestCase);
// NEW: Add the GET route for listing test cases
// Notice we use router.get() instead of router.post()
// Both TESTER and DEVELOPER can read the full repository
router.get(
    '/',
    authMiddleware,
    authorize('TESTER', 'DEVELOPER', 'ADMIN'),
    getTestCases
);
router.get("/:id", authMiddleware, getTestCase);

// Update a test case (Only TESTER and ADMIN can edit)
router.put(
  "/:id", 
  authMiddleware, 
  authorize("TESTER", "ADMIN"), 
  updateTestCase
);

// NEW: Update status ONLY (Authorized for TESTER and ADMIN)
router.patch(
  "/:id/status",
  authMiddleware,
  authorize("TESTER", "ADMIN"),
  updateTestCaseStatus
);
router.post(
  "/:id/clone", 
  authMiddleware, 
  authorize("TESTER", "ADMIN"), 
  cloneTestCase
);
// ... existing routes ...

// Soft Delete a test case (Only TESTER and ADMIN can delete)
router.delete(
  "/:id", 
  authMiddleware, 
  authorize("TESTER", "ADMIN"), 
  deleteTestCase
);

export default router;