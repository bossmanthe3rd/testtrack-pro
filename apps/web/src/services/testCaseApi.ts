import { api } from '../features/auth/api'; // This is your existing Axios instance from Day 4
import type { TestCaseListResponse, TestCase } from '../types/testCase';

// We define an interface for the filters we might send
export interface GetTestCasesFilters {
    page?: number;
    limit?: number;
    search?: string;
    priority?: string;
    status?: string;
    module?: string;
}

// ------------------------------------------------------------------
// DAY 6: LISTING TEST CASES
// ------------------------------------------------------------------

// This function makes the GET request to our backend
export const getTestCases = async (filters: GetTestCasesFilters): Promise<TestCaseListResponse> => {
    // Axios allows us to pass query parameters in a clean object format using the 'params' key.
    // Axios will automatically turn this into: /api/test-cases?page=1&limit=10
    const response = await api.get('/api/test-cases', {
        params: filters
    });

    // Return the data exactly as our TypeScript interface expects it
    return response.data;
};

// NEW: Fetch a single test case by its ID (for the Edit page to pre-fill the form)
export const getTestCaseById = async (id: string) => {
    // We pass the dynamic 'id' directly into the URL path
    // Example: if id is "123", this calls GET /api/test-cases/123
    const response = await api.get(`/api/test-cases/${id}`);
    
    // We return the raw data so our React component can use it to set the form's default values
    return response.data;
};

// NEW: Update an existing test case (The PUT request)
export const updateTestCase = async (id: string, updateData: Partial<TestCase> & { changeSummary?: string }) => {
    // We use api.put for updates. 
    // Argument 1: The URL with the dynamic ID
    // Argument 2: The payload (the new data including the changeSummary and new steps)
    const response = await api.put(`/api/test-cases/${id}`, updateData);
    
    return response.data;
};

// NEW: Clone an existing test case
export const cloneTestCase = async (id: string) => {
    // We use api.post for this. 
    // Argument 1: The URL
    // Argument 2: The body (empty {} because the backend already knows what to do based on the ID)
    const response = await api.post(`/api/test-cases/${id}/clone`, {});
    
    return response.data;
};