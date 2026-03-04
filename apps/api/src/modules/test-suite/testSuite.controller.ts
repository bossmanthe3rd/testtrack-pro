import { Request, Response } from "express";
import { testSuiteService } from "./testSuite.service";

export const createTestSuite = async (req: Request, res: Response) => {
  try {
    console.log("👉 1. REQUEST RECEIVED! Here is the data:", req.body);
    
    const suite = await testSuiteService.createTestSuite(req.body);
    
    console.log("👉 2. SUCCESS! Suite saved to database:", suite);
    res.status(201).json({ message: "Test suite created", data: suite });
    
  } catch (error: any) {
    // THIS is the magic line that will reveal the silent killer!
    console.error("🚨 3. CRASH DETECTED IN CONTROLLER:", error); 
    
    // We send a 500 back, but now we will actually see WHY in the terminal
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};
/*export const createTestSuite = async (req: Request, res: Response) => {
  try {
    const suite = await testSuiteService.createTestSuite(req.body);
    res.status(201).json({ message: "Test suite created", data: suite });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};*/

export const addTestCases = async (req: Request, res: Response) => {
  try {
    const { suiteId } = req.params;
    const { testCaseIds } = req.body;
    await testSuiteService.addTestCasesToSuite(suiteId as string, testCaseIds as string[]);
    res.json({ message: "Test cases added to suite successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeTestCase = async (req: Request, res: Response) => {
  try {
    const { suiteId, testCaseId } = req.params;
    await testSuiteService.removeTestCaseFromSuite(suiteId as string, testCaseId as string);
    res.json({ message: "Test case removed from suite" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
// NEW: Fetch all test suites
export const getTestSuites = async (req: Request, res: Response) => {
  try {
    const suites = await testSuiteService.getTestSuites();
    res.json(suites);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching test suites" });
  }
};

// NEW: Fetch a single test suite by ID
export const getTestSuite = async (req: Request, res: Response) => {
  try {
    const suite = await testSuiteService.getTestSuiteById(req.params.suiteId as string);
    if (!suite) {
      return res.status(404).json({ message: "Test suite not found" });
    }
    res.json(suite);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching test suite details" });
  }
};