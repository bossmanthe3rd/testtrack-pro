import { z } from "zod";

export const createTestSuiteSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Suite name must be at least 3 characters"),
    description: z.string().optional(),
    // We removed .uuid() so it accepts Prisma's CUIDs too!
    projectId: z.string().min(5, "Project ID is required"), 
  })
});

export const addTestCasesSchema = z.object({
  body: z.object({
    // We removed .uuid() here as well!
    testCaseIds: z.array(z.string().min(5, "Invalid Test Case ID")).min(1, "Provide at least one test case ID")
  })
});