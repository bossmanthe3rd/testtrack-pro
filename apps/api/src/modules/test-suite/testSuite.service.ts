import { prisma } from "../../config/prisma";

export const testSuiteService = {
  // 1. Create a new empty suite
  async createTestSuite(data: { name: string; description?: string; projectId: string }) {
    return await prisma.testSuite.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
      }
    });
  },

  // 2. Link existing test cases to the suite
  async addTestCasesToSuite(suiteId: string, testCaseIds: string[]) {
    // We map through the array of IDs and create the link records
    const linksToCreate = testCaseIds.map((testCaseId, index) => ({
      suiteId: suiteId,
      testCaseId: testCaseId,
      order: index + 1 // Keeps track of what order they should be executed in
    }));

    // Create many links at once! (Prisma ignores duplicates if setup right, but we use createMany)
    return await prisma.suiteTestCase.createMany({
      data: linksToCreate,
      skipDuplicates: true // Prevents crashing if a test case is already in the suite
    });
  },

  // 3. Remove a test case from a suite
  async removeTestCaseFromSuite(suiteId: string, testCaseId: string) {
    return await prisma.suiteTestCase.deleteMany({
      where: {
        suiteId: suiteId,
        testCaseId: testCaseId
      }
    });
  },

  // 4. Get a suite and all its connected test cases
  async getTestSuiteById(suiteId: string) {
    return await prisma.testSuite.findUnique({
      where: { id: suiteId },
      include: {
        testCases: { // This looks through the junction table!
          include: {
            testCase: true // Grabs the actual test case details
          },
          orderBy: { order: 'asc' }
        }
      }
    });
  },
  // NEW: 5. Get all test suites
  async getTestSuites() {
    return await prisma.testSuite.findMany();
  }
};