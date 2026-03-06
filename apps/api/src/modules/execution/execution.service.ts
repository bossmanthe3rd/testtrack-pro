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

// 🟢 CHANGED: Added durationOverride parameter
export const completeExecution = async (executionId: string, durationOverride?: number) => {
  const steps = await prisma.executionStep.findMany({
    where: { executionId }
  });

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
     overallStatus = 'SKIPPED'; 
  }

  const execution = await prisma.execution.findUnique({ where: { id: executionId } });
  if (!execution) throw new Error("Execution not found");

  const completedAt = new Date();
  
  // 🟢 CHANGED: Use the paused time from frontend if available, else fallback to raw math
  let duration = durationOverride;
  if (duration === undefined) {
    duration = Math.floor((completedAt.getTime() - execution.startedAt.getTime()) / 1000);
  }

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