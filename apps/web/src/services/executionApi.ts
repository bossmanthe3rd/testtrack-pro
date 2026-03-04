import api from '../features/auth/api';

export const executionApi = {
  // Starts a new execution and returns the execution details (including the ID)
  startExecution: async (testCaseId: string) => {
    // Added /api/ to the path
    const response = await api.post('/api/executions/start', { testCaseId });
    return response.data;
  },

  // Saves the result of a single step
  saveStepResult: async (
    executionId: string, 
    stepNumber: number, 
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED', 
    actualResult?: string, 
    notes?: string
  ) => {
    // Added /api/ to the path
    const response = await api.post(`/api/executions/${executionId}/steps`, {
      stepNumber,
      status,
      actualResult,
      notes,
    });
    return response.data;
  },

  // Completes the entire execution, calculates the final pass/fail, and stops the clock
  completeExecution: async (executionId: string) => {
    // Added /api/ to the path
    const response = await api.post(`/api/executions/${executionId}/complete`);
    return response.data;
  },

  // Fetches the history of previous runs for a specific test case
  getExecutionHistory: async (testCaseId: string) => {
    // Added /api/ to the path
    const response = await api.get(`/api/executions/history/${testCaseId}`);
    return response.data;
  }
};
