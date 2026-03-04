import { Router } from 'express';
import * as ExecutionController from './execution.controller';
import { validate } from '../../middleware/validate.middleware';
import { startExecutionSchema, saveStepSchema, completeExecutionSchema } from './execution.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// Only testers can execute tests
router.use(authMiddleware);
router.use(authorize('TESTER'));

router.post('/start', validate(startExecutionSchema), ExecutionController.startExecution);
router.post('/:executionId/steps', validate(saveStepSchema), ExecutionController.saveStep);
router.post('/:executionId/complete', validate(completeExecutionSchema), ExecutionController.completeExecution);
router.get('/history/:testCaseId', ExecutionController.getHistory);

export default router;