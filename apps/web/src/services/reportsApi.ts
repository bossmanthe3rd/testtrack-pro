import { api } from './api';

export interface DashboardSummary {
  totalTestCases: number;
  totalExecutions: number;
  passRate: number;
  failedTests: number;
  openBugs: number;
  bugsBySeverity: Record<string, number>;
}

export interface ExecutionReport {
  totalExecuted: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
}

// 1. NEW: Interface for Tester Performance (FR-RPT-004)
export interface TesterPerformance {
  testCasesExecuted: number;
  bugsReported: number;
  bugDetectionRate: number;
  executionEfficiencySeconds: number;
  coverageMetrics: number;
}

// 2. NEW: Interface for Developer Performance (FR-RPT-003)
export interface DeveloperPerformance {
  bugsAssigned: number;
  bugsResolved: number;
  reopenRate: number;
  averageResolutionHours: number;
  fixQualityScore: number;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get('/api/reports/dashboard');
  return response.data.data;
};

export const getExecutionReport = async (): Promise<ExecutionReport> => {
  const response = await api.get('/api/reports/executions');
  return response.data.data;
};

// 3. NEW: Fetch Tester metrics
export const getTesterMetrics = async (): Promise<TesterPerformance> => {
  const response = await api.get('/api/reports/tester-metrics');
  return response.data.data;
};

// 4. NEW: Fetch Developer metrics
export const getDeveloperMetrics = async (): Promise<DeveloperPerformance> => {
  const response = await api.get('/api/reports/developer-metrics');
  return response.data.data;
};