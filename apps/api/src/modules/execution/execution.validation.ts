import { z } from 'zod';

export const startExecutionSchema = z.object({
  body: z.object({
    testCaseId: z.string().uuid("Invalid Test Case ID"),
    testRunId: z.string().uuid().optional(),
  })
});

export const saveStepSchema = z.object({
  params: z.object({
    executionId: z.string().uuid("Invalid Execution ID"),
  }),
  body: z.object({
    stepNumber: z.number().int().positive(),
    actualResult: z.string().optional(),
    status: z.enum(['PASS', 'FAIL', 'BLOCKED', 'SKIPPED']),
    notes: z.string().optional(),
  })
});

export const completeExecutionSchema = z.object({
  params: z.object({
    executionId: z.string().uuid("Invalid Execution ID"),
  })
});

export const updateStepSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Step ID"),
  }),
  body: z.object({
    status: z.enum(['PASS', 'FAIL', 'BLOCKED', 'SKIPPED']),
    actualResult: z.string().optional(),
    notes: z.string().optional(),
  })
});