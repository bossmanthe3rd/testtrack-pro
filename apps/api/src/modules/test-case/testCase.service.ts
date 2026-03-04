import { string } from 'zod';
import { CreateTestCaseInput } from './testCase.validation';
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();
// Helper to generate IDs like TC-2026-00001
async function generateTestCaseId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await prisma.testCase.count();
    const nextNumber = count + 1;
    const formattedNumber = String(nextNumber).padStart(5, '0');
    return `TC-${currentYear}-${formattedNumber}`;
}

export async function createTestCase(userId: string, data: CreateTestCaseInput) {
    const generatedId = await generateTestCaseId();

    // Create the Test Case and its Steps simultaneously
    const newTestCase = await prisma.testCase.create({
        data: {
            testCaseId: generatedId,
            title: data.title,
            description: data.description,
            module: data.module,
            priority: data.priority,
            severity: data.severity,
            type: data.type,
            status: data.status,
            preConditions: data.preConditions,
            testDataRequirements: data.testDataRequirements,
            environmentRequirements: data.environmentRequirements,
            estimatedDuration: data.estimatedDuration,
            version: 1, // Start at version 1

            // Relations
            createdById: userId,
            projectId: data.projectId,

            // Insert the steps array into the database
            steps: {
                create: data.steps.map((step, index) => ({
                    stepNumber: index + 1, // Auto-number 1, 2, 3...
                    action: step.action,
                    testData: step.testData || null,
                    expectedResult: step.expectedResult,
                })),
            },
        },
        include: {
            steps: true, // Return the newly created steps in the response
        },
    });

    return newTestCase;
}

// Define an interface so TypeScript knows what filters to expect
interface ListFilters {
  page: number;
  limit: number;
  priority?: any; 
  status?: any;
  module?: string;
  search?: string;
  createdBy?: string;
}

export const listTestCases = async (filters: ListFilters) => {
  const { page, limit, priority, status, module, search, createdBy } = filters;

  // Calculate how many records to skip based on the current page
  // E.g., Page 1 skips 0. Page 2 skips 10.
  const skip = (page - 1) * limit;

  // 1. Build the dynamic 'where' object
  // We ALWAYS want to exclude soft-deleted items
  const where: Prisma.TestCaseWhereInput = {
    deletedAt: null, 
  };

  // Only add filter conditions if the user actually requested them
  if (priority) where.priority = priority;
  if (status) where.status = status;
  if (module) where.module = module;
  if (createdBy) where.createdById = createdBy;

  // Search logic: Look in BOTH the title OR the description.
  // mode: 'insensitive' means "Login" and "login" will both match.
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 2. Fetch data and count total simultaneously for performance
  // Promise.all runs both database queries at the exact same time.
  const [data, totalCount] = await Promise.all([
    prisma.testCase.findMany({
      where,
      skip,
      take: limit, // How many to fetch
      orderBy: { createdAt: 'desc' }, // Newest first
      
      // OPTIMIZATION: We use 'select' to grab ONLY the fields we need for the table.
      // We do NOT select the large "steps" array, which keeps our API blazing fast.
      select: { 
        id: true,
        testCaseId: true,
        title: true,
        module: true,
        priority: true,
        severity: true,
        status: true,
        createdAt: true,
        createdBy: { 
          select: { name: true } // Joins the User table to get the creator's name
        }
      }
    }),
    
    // We need the total count of ALL matching records to calculate total pages
    prisma.testCase.count({ where })
  ]);

  // 3. Return the payload structured nicely for the frontend
  return {
    data,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  };
};
// ==========================================
// DAY 7: EDIT TEST CASE FUNCTIONS
// ==========================================

// 1. Fetch a single test case to pre-fill the edit form
export const getTestCaseById = async (id: string) => {
  return await prisma.testCase.findUnique({
    where: { 
      id: id, 
      deletedAt: null // Ensure we don't fetch soft-deleted cases
    },
    // Include the steps so the user can see what they are editing
    include: { 
      steps: { 
        orderBy: { stepNumber: 'asc' } 
      } 
    }
  });
};

// 2. The update logic using a Database Transaction
export const updateTestCase = async (id: string, userId: string, updateData: any) => {
  // We extract 'steps' and 'changeSummary' from the incoming data, 
  // keeping the rest of the details in 'caseDetails'
  const { steps, changeSummary, ...caseDetails } = updateData;

  // $transaction ensures all operations inside succeed, or NONE of them do.
  return await prisma.$transaction(async (tx) => {
    
    // Step A: Get the current test case to find its current version
    const currentCase = await tx.testCase.findUnique({
      where: { id }
    });

    if (!currentCase) {
      throw new Error("Test case not found");
    }

    // Step B: Delete all existing steps for this specific test case
    // We completely replace them rather than trying to figure out which ones changed.
    await tx.testStep.deleteMany({
      where: { testCaseId: id }
    });

    // Step C: Update the main test case record
    const updatedCase = await tx.testCase.update({
      where: { id },
      data: {
        ...caseDetails,
        version: currentCase.version + 1, // Automatically increment the version!
        updatedAt: new Date(),
      }
    });

    // Step D: Insert the new steps sent from the frontend
    if (steps && steps.length > 0) {
      const stepsToInsert = steps.map((step: any, index: number) => ({
        testCaseId: id,
        stepNumber: index + 1, // Automatically number them 1, 2, 3...
        action: step.action,
        testData: step.testData,
        expectedResult: step.expectedResult
      }));

      await tx.testStep.createMany({
        data: stepsToInsert
      });
    }

    // Return the updated case back to the controller
    return updatedCase;
  });
};
export const cloneTestCase = async (originalId: string, userId: string) => {
    // 1. Fetch the original test case AND its steps
    const originalCase = await prisma.testCase.findUnique({
      where: { id: originalId, deletedAt: null },
      include: { steps: true }
    });

    if (!originalCase) {
      throw new Error("Original test case not found or has been deleted");
    }

    // 2. Generate a new custom TestCase ID
    const newTestCaseId = await generateTestCaseId();

    // 3. Create the new cloned test case
    const clonedCase = await prisma.testCase.create({
      data: {
        // Copy these exact fields from the original
        title: `[CLONE] ${originalCase.title}`, // Add a prefix to make it obvious
        description: originalCase.description,
        module: originalCase.module,
        priority: originalCase.priority,
        severity: originalCase.severity,
        type: originalCase.type,
        preConditions: originalCase.preConditions,
        testDataRequirements: originalCase.testDataRequirements,
        environmentRequirements: originalCase.environmentRequirements,
        estimatedDuration: originalCase.estimatedDuration,
        projectId: originalCase.projectId,
        
        // Overwrite these fields for the new clone
        testCaseId: newTestCaseId,
        status: "DRAFT",
        version: 1,
        createdById: userId, // The user who clicked 'clone' owns this new one

        // Prisma allows us to create the steps at the same exact time!
        steps: {
          create: originalCase.steps.map(step => ({
            stepNumber: step.stepNumber,
            action: step.action,
            testData: step.testData,
            expectedResult: step.expectedResult
          }))
        }
      }
    });

    return clonedCase;
  }
  // ... existing methods (create, getById, update, clone) ...

export const softDeleteTestCase = async (id: string, userId: string) => {
    // 1. Check if it actually exists and isn't already deleted
    const existingCase = await prisma.testCase.findUnique({
      where: { id, deletedAt: null }
    });

    if (!existingCase) {
      throw new Error("Test case not found or already deleted");
    }

    // 2. Perform the Soft Delete (It's actually an UPDATE operation!)
    const deletedCase = await prisma.testCase.update({
      where: { id },
      data: {
        deletedAt: new Date(), // This hides it from the UI
        updatedAt: new Date(),
      }
    });

    return deletedCase;
  }