import { api } from '../features/auth/api';
import type { TestCaseListResponse, TestCase } from '../types/testCase';

export interface GetTestCasesFilters {
    page?: number;
    limit?: number;
    search?: string;
    priority?: string;
    status?: string;
    module?: string;
}

export const getTestCases = async (filters: GetTestCasesFilters): Promise<TestCaseListResponse> => {
    const response = await api.get('/api/test-cases', {
        params: filters
    });
    return response.data;
};

export const getTestCaseById = async (id: string): Promise<TestCase> => {
    const response = await api.get(`/api/test-cases/${id}`);
    // Backend returns the test case object directly for GET /:id
    return response.data;
};

export const updateTestCase = async (id: string, updateData: Partial<TestCase> & { changeSummary?: string }): Promise<TestCase> => {
    const response = await api.put(`/api/test-cases/${id}`, updateData);
    // Backend returns { message: "...", data: updatedCase }
    return response.data.data;
};

export const cloneTestCase = async (id: string): Promise<TestCase> => {
    const response = await api.post(`/api/test-cases/${id}/clone`, {});
    // Backend returns { message: "...", data: clonedCase }
    return response.data.data;
};

export const deleteTestCase = async (id: string): Promise<{ success: boolean }> => {
    await api.delete(`/api/test-cases/${id}`);
    return { success: true };
};

export const updateTestCaseStatus = async (id: string, status: string): Promise<TestCase> => {
    const response = await api.patch(`/api/test-cases/${id}/status`, { status });
    // Backend returns { message: "...", data: updatedCase }
    return response.data.data;
};