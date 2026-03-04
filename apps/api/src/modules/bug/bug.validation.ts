import { z } from "zod";

export const createBugSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required"),
    stepsToReproduce: z.string().min(1, "Steps to reproduce are required"),
    expectedBehavior: z.string().min(1, "Expected behavior is required"),
    actualBehavior: z.string().min(1, "Actual behavior is required"),
    severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]),
    priority: z.enum(["P1", "P2", "P3", "P4"]),
    environment: z.string().min(1, "Environment is required"),
    affectedVersion: z.string().min(1, "Affected version is required"),
    assignedToId: z.string().uuid().optional(),
    linkedTestCaseId: z.string().uuid().optional(),
    executionStepId: z.string().uuid().optional(),
    attachments: z.array(z.string()).optional(),
  }),
});