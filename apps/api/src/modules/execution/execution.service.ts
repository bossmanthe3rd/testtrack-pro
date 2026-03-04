import { prisma } from '../../config/prisma';
import { ExecutionStatus } from '@prisma/client';

export const startExecution = async (testCaseId: string, executedById: string, testRunId?: string) => {
  return await prisma.execution.create({
    data: {
      testCaseId,
      executedById,
      testRunId,
      startedAt: new Date(),
    }
  });
};

export const saveExecutionStep = async (executionId: string, stepNumber: number, status: ExecutionStatus, actualResult?: string, notes?: string) => {
  return await prisma.executionStep.create({
    data: {
      executionId,
      stepNumber,
      status,
      actualResult,
      notes
    }
  });
};

export const completeExecution = async (executionId: string) => {
  // First, get all the steps recorded for this execution
  const steps = await prisma.executionStep.findMany({
    where: { executionId }
  });

  // Calculate the overall status based on the steps
  let overallStatus: ExecutionStatus = 'PASS';
  
  const hasFail = steps.some(step => step.status === 'FAIL');
  const hasBlocked = steps.some(step => step.status === 'BLOCKED');
  const hasSkipped = steps.some(step => step.status === 'SKIPPED');

  if (hasFail) {
    overallStatus = 'FAIL';
  } else if (hasBlocked) {
    overallStatus = 'BLOCKED';
  } else if (hasSkipped && steps.length > 0) {
    overallStatus = 'SKIPPED';
  } else if (steps.length === 0) {
     overallStatus = 'SKIPPED'; // If no steps were executed
  }

  // Find the original execution to calculate duration
  const execution = await prisma.execution.findUnique({ where: { id: executionId } });
  if (!execution) throw new Error("Execution not found");

  const completedAt = new Date();
  // Calculate duration in seconds
  const duration = Math.floor((completedAt.getTime() - execution.startedAt.getTime()) / 1000);

  // Update the execution record with final results
  return await prisma.execution.update({
    where: { id: executionId },
    data: {
      overallStatus,
      completedAt,
      duration
    }
  });
};

export const getExecutionHistory = async (testCaseId: string) => {
  return await prisma.execution.findMany({
    where: { testCaseId },
    include: {
      executedBy: {
        select: { name: true }
      }
    },
    orderBy: { startedAt: 'desc' }
  });
};