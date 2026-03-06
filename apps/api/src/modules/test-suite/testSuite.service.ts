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
    const linksToCreate = testCaseIds.map((testCaseId, index) => ({
      suiteId: suiteId,
      testCaseId: testCaseId,
      order: index + 1
    }));

    return await prisma.suiteTestCase.createMany({
      data: linksToCreate,
      skipDuplicates: true
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
        testCases: { 
          include: {
            testCase: {
              include: { steps: true }
            } 
          },
          orderBy: { order: 'asc' } // Ensure sequential order is preserved
        }
      }
    });
  },

  // 5. Get all test suites
  async getTestSuites() {
    return await prisma.testSuite.findMany();
  },

  // --- NEW: FR-TS-002 SUITE EXECUTION ---

  // 6. Start a Suite Execution (Creates a TestRun)
  async startSuiteExecution(suiteId: string, userId: string) {
    // Grab the suite and its ordered test cases
    const suite = await this.getTestSuiteById(suiteId);
    if (!suite) throw new Error("Test Suite not found");
    if (suite.testCases.length === 0) throw new Error("Cannot execute an empty suite");

    // Create a container for this execution batch
    const testRun = await prisma.testRun.create({
      data: {
        name: `Suite Run: ${suite.name} - ${new Date().toLocaleString()}`,
        projectId: suite.projectId,
        createdById: userId,
        startDate: new Date(),
      }
    });

    // We return the Run ID, plus the ordered list of test cases the frontend needs to execute
    return {
      testRunId: testRun.id,
      testCases: suite.testCases.map(stc => stc.testCase)
    };
  },

  // 7. Get Suite-Level Reporting (FR-TS-002)
  async getSuiteRunReport(testRunId: string) {
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        executions: {
          include: { testCase: true }
        }
      }
    });

    if (!testRun) throw new Error("Test Run not found");

    // Calculate consolidated metrics
    const total = testRun.executions.length;
    const passed = testRun.executions.filter(e => e.overallStatus === 'PASS').length;
    const failed = testRun.executions.filter(e => e.overallStatus === 'FAIL').length;
    const blocked = testRun.executions.filter(e => e.overallStatus === 'BLOCKED').length;
    const skipped = testRun.executions.filter(e => e.overallStatus === 'SKIPPED').length;

    return {
      testRunName: testRun.name,
      startDate: testRun.startDate,
      metrics: { total, passed, failed, blocked, skipped },
      executions: testRun.executions
    };
  }
};