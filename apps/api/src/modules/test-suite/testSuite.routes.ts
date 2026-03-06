import { Router } from "express";
import { createTestSuite, addTestCases, removeTestCase, getTestSuites, getTestSuite } from "./testSuite.controller";    
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createTestSuiteSchema, addTestCasesSchema } from "./testSuite.validation";
import { startSuiteRun, getSuiteReport } from './testSuite.controller';


const router = Router();

// Only testers can manage test suites
router.use(authMiddleware);
router.use(authorize("TESTER"));
// Get all suites
router.get("/", getTestSuites);

// Get a single suite
router.get("/:suiteId", getTestSuite);
// Create a suite
router.post("/", validate(createTestSuiteSchema), createTestSuite);

// Add test cases to a suite
router.post("/:suiteId/test-cases", validate(addTestCasesSchema), addTestCases);
// NEW: Suite Execution Routes
router.post('/:id/execute', authorize('TESTER'), startSuiteRun);
router.get('/run/:runId/report', getSuiteReport);
// Remove a specific test case from a suite
router.delete("/:suiteId/test-cases/:testCaseId", removeTestCase);

export default router;