// These enums should match exactly what you have in your Prisma schema
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type Severity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
export type TestCaseStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED';

// This represents a single Test Case as it comes from our new GET endpoint
export interface TestCase {
  id: string;
  testCaseId: string; // The TC-2026-00001 format
  title: string;
  module: string;
  priority: Priority;
  severity: Severity;
  status: TestCaseStatus;
  version?: number;
  createdAt: string;
  createdBy: {
    name: string;
  };
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