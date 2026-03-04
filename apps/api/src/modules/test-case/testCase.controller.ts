import { Request, Response } from 'express';
import { createTestCaseSchema, listTestCaseSchema, editTestCaseSchema } from './testCase.validation';
import * as testCaseService from './testCase.service';

export async function handleCreateTestCase(req: Request, res: Response) {
    try {
        // 1. Validate the incoming body
        const validatedData = createTestCaseSchema.parse(req.body);

        // 2. Extract the user ID attached by your auth middleware
        // Note: If TypeScript complains about `req.user`, we use `as any` or cast it to your custom type.
        const userId = (req as any).user.id;

        // 3. Call the service to save it
        const testCase = await testCaseService.createTestCase(userId, validatedData);

        // ... truncated same parts ...

        // 4. Send a successful response
        res.status(201).json({
            message: "Test case created successfully",
            data: testCase
        });

    } catch (error: any) {
        // Catch Zod validation errors or Prisma errors
        console.error("Create Test Case Error:", error);
        res.status(400).json({ error: error.issues || error.message });
    }
}

export const getTestCases = async (req: Request, res: Response) => {
    try {
        // 1. Validate the incoming query parameters from the URL
        // req.query contains everything after the '?' in the URL
        const validatedQuery = listTestCaseSchema.parse({
            query: req.query
        });

        // 2. Pass the validated data to our Service (the Chef)
        // This will fetch the paginated, filtered data from Postgres
        const result = await testCaseService.listTestCases({
            page: validatedQuery.query.page,
            limit: validatedQuery.query.limit,
            priority: validatedQuery.query.priority,
            status: validatedQuery.query.status,
            module: validatedQuery.query.module,
            search: validatedQuery.query.search,
            createdBy: validatedQuery.query.createdBy,
        });

        // 3. Send the successful response back to the client
        res.status(200).json({
            success: true,
            data: result.data,
            meta: result.meta,
        });

    } catch (error: any) {
        // ... truncated same parts ...
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid filter parameters',
                errors: error.errors
            });
        }

        console.error('Error fetching test cases:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test cases'
        });
    }
};
export const getTestCase = async (req: Request, res: Response) => {
  try {
    const testCase = await testCaseService.getTestCaseById(req.params.id as string);
    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }
    res.json(testCase);
  } catch (error) {
    res.status(500).json({ message: "Error fetching test case" });
  }
};

export const updateTestCase = async (req: Request, res: Response) => {
  try {
    const testCaseId = req.params.id;
    const userId = (req as any).user.id; // Assuming authMiddleware attaches user to req

    // Validate the incoming body against editTestCaseSchema
    const validatedData = editTestCaseSchema.parse({ body: req.body });

    const updatedTestCase = await testCaseService.updateTestCase(
      testCaseId as string, 
      userId, 
      validatedData.body
    );

    res.json({
      message: "Test case updated successfully",
      data: updatedTestCase
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(400).json({ message: error.message || "Error updating test case" });
  }
};
// ... your existing controllers ...

export const cloneTestCase = async (req: Request, res: Response) => {
  try {
    const originalId = req.params.id as string;
    const userId = (req as any).user.id; // From your authMiddleware

    const clonedTestCase = await testCaseService.cloneTestCase(originalId, userId);

    res.status(201).json({
      message: "Test case cloned successfully",
      data: clonedTestCase
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error cloning test case" });
  }
};
// ... existing controllers ...

export const deleteTestCase = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id; // From authMiddleware

    await testCaseService.softDeleteTestCase(id, userId);

    res.json({
      message: "Test case deleted successfully"
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Error deleting test case" });
  }
};