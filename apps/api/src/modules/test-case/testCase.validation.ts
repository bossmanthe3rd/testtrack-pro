import { z } from 'zod';

const testStepSchema = z.object({
    action: z.string().min(1, "Action is required"),
    testData: z.string().optional(),
    expectedResult: z.string().min(1, "Expected result is required"),
});

export const createTestCaseSchema = z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(10),
    module: z.string().min(1),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']),
    severity: z.enum(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL']),
    type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'INTEGRATION', 'UAT', 'PERFORMANCE', 'SECURITY', 'USABILITY']),
    status: z.enum(['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'RETIRED']).default('DRAFT'),
    preConditions: z.string().optional(),
    testDataRequirements: z.string().optional(),
    environmentRequirements: z.string().optional(),
    estimatedDuration: z.coerce.number().int().optional(),
    steps: z.array(testStepSchema).min(1, "At least one step is required"),

    // We need to know which project this test case belongs to!
    // For now, the frontend should send this, or you can hardcode a seeded project ID for testing.
    projectId: z.string().uuid("Invalid Project ID"),
});
// Add this below your existing createTestCaseSchema

export const listTestCaseSchema = z.object({
  query: z.object({
    // We receive strings from the URL, so we transform them into numbers.
    // If they aren't provided, we default to page 1 and limit 10.
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
    
    // Optional filters. They must exactly match your Prisma Enums if provided.
    priority: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['P1', 'P2', 'P3', 'P4']).optional()),
    status: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'RETIRED']).optional()),
    module: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    
    // The search string for our global search feature
    search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
    
    // UUID validation ensures it's a valid user ID format
    createdBy: z.preprocess((val) => (val === '' ? undefined : val), z.string().uuid().optional()),
  })
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;

export const editTestCaseSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    module: z.string().optional(),
    priority: z.enum(["P1", "P2", "P3", "P4"]).optional(),
    severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]).optional(),
    type: z.string().optional(),
    status: z.enum(["DRAFT", "READY_FOR_REVIEW", "APPROVED", "RETIRED"]).optional(),
    preConditions: z.string().optional(),
    testDataRequirements: z.string().optional(),
    environmentRequirements: z.string().optional(),
    estimatedDuration: z.number().optional(),
    changeSummary: z.string().min(5, "Change summary is required for auditing"),
    steps: z.array(
      z.object({
        action: z.string().min(1),
        testData: z.string().optional(),
        expectedResult: z.string().min(1),
      })
    ).min(1, "At least one step is required"),
  })
});

export const updateTestCaseStatusSchema = z.object({
  status: z.enum(['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'RETIRED'])
});

export type UpdateTestCaseStatusInput = z.infer<typeof updateTestCaseStatusSchema>;