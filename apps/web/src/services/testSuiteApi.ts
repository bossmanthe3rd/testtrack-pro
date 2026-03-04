import { api } from '../features/auth/api';

export const testSuiteApi = {
  // Get all suites
  getSuites: async () => {
    const response = await api.get('/api/test-suites');
    return response.data;
  },

  // Get a single suite (includes its test cases)
  getSuiteById: async (id: string) => {
    const response = await api.get(`/api/test-suites/${id}`);
    return response.data;
  },

  // Create a new suite
  createSuite: async (data: { name: string; description?: string; projectId: string }) => {
    const response = await api.post('/api/test-suites', data);
    return response.data;
  },

  // Add test cases to a suite
  addTestCases: async (suiteId: string, testCaseIds: string[]) => {
    const response = await api.post(`/api/test-suites/${suiteId}/test-cases`, { testCaseIds });
    return response.data;
  },

  // Remove a test case from a suite
  removeTestCase: async (suiteId: string, testCaseId: string) => {
    const response = await api.delete(`/api/test-suites/${suiteId}/test-cases/${testCaseId}`);
    return response.data;
  }
};