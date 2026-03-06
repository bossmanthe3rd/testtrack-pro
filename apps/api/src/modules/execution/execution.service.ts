import { prisma } from '../../config/prisma';
import { ExecutionStatus } from '@prisma/client';

export const startExecution = async (testCaseId: string, executedById: string, testRunId?: string) => {
  // Fetch the test case to get its steps
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: { steps: true }
  });

  if (!testCase) throw new Error("Test case not found");

  const execution = await prisma.execution.create({
    data: {
      testCaseId,
      executedById,
      testRunId,
      startedAt: new Date(),
    }
  });

  // Pre-create execution steps based on test case steps
  if (testCase.steps && testCase.steps.length > 0) {
    const stepData = testCase.steps.map(step => ({
      executionId: execution.id,
      stepNumber: step.stepNumber,
      status: 'BLOCKED' as ExecutionStatus, // Initial status
      actualResult: '',
    }));

    await prisma.executionStep.createMany({
      data: stepData
    });
  }

  // Return the execution with its pre-created steps
  return await prisma.execution.findUnique({
    where: { id: execution.id },
    include: { steps: true }
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

export const updateExecutionStep = async (stepId: string, status: ExecutionStatus, actualResult?: string, notes?: string) => {
  return await prisma.executionStep.update({
    where: { id: stepId },
    data: {
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
    orderBy: { startedAt: 'desc' },
    take: 10, // Show only the 10 most recent executions
  });
};
