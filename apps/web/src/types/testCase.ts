// These enums should match exactly what you have in your Prisma schema
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type Severity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
export type TestCaseStatus = 'DRAFT' | 'READY_FOR_REVIEW' | 'APPROVED' | 'RETIRED';

export interface TestStep {
  id: string;
  stepNumber: number;
  action: string;
  testData?: string | null;
  expectedResult: string;
}

// This represents a single Test Case as it comes from our new GET endpoint
export interface TestCase {
  id: string;
  testCaseId: string; // The TC-2026-00001 format
  title: string;
  description: string;
  module: string;
  priority: Priority;
  severity: Severity;
  status: TestCaseStatus;
  type: string;
  preConditions?: string | null;
  testDataRequirements?: string | null;
  environmentRequirements?: string | null;
  estimatedDuration?: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
  };
  steps?: TestStep[];
}

// This represents the pagination metadata the backend sends
export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// This represents the entire response object
export interface TestCaseListResponse {
  success: boolean;
  data: TestCase[];
  meta: PaginationMeta;
}