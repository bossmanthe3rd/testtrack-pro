import { Router } from 'express';
import * as ExecutionController from './execution.controller';
import { validate } from '../../middleware/validate.middleware';
import { startExecutionSchema, saveStepSchema, completeExecutionSchema, updateStepSchema } from './execution.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// Only testers can execute tests
router.use(authMiddleware);
router.use(authorize('TESTER'));

router.post('/start', validate(startExecutionSchema), ExecutionController.startExecution);
router.post('/:executionId/steps', validate(saveStepSchema), ExecutionController.saveStep);
router.patch('/steps/:id', validate(updateStepSchema), ExecutionController.updateStep);
router.post('/:executionId/complete', validate(completeExecutionSchema), ExecutionController.completeExecution);
router.get('/history/:testCaseId', ExecutionController.getHistory);

export default router;