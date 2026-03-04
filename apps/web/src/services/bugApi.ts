import api from '../features/auth/api';

// Assuming your backend runs on port 3000 locally
const API_URL = '/api';

// 1. Upload Attachment
export const uploadAttachment = async (file: File) => {
  const formData = new FormData();
  formData.append('attachment', file);

  const response = await api.post(`${API_URL}/uploads`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.url; 
};

// 2. Create Bug Payload Type
export interface CreateBugPayload {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "TRIVIAL";
  priority: "P1" | "P2" | "P3" | "P4";
  environment: string;
  affectedVersion: string;
  assignedToId?: string;
  linkedTestCaseId?: string;
  executionStepId?: string;
  attachments?: string[];
}

// 3. Create Bug Function
export const createBug = async (bugData: CreateBugPayload) => {
  const response = await api.post(`${API_URL}/bugs`, bugData);
  return response.data;
};

// 4. User References
export interface UserRef {
  id: string;
  name: string;
}

// 5. Updated Bug Interface
// We expanded this to include the detailed fields needed for Day 10.
// The '?' makes them optional so your existing listing code doesn't break.
export interface Bug {
  id: string;
  bugId: string;
  title: string;
  severity: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: UserRef | null;
  assignedToId?: string;
  reportedBy: UserRef;
  
  // Detailed fields (Optional for lists, required for details)
  description?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  environment?: string;
  affectedVersion?: string;
  linkedTestCaseId?: string;
  fixNotes?: string;
  commitHash?: string;
}

export interface BugListResponse {
  data: Bug[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

// 6. Get Bugs Function (For the general Bug List)
export const getBugs = async (filters?: Record<string, string | number>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  const response = await api.get(`${API_URL}/bugs?${params.toString()}`);
  return response.data.data as BugListResponse; 
};

// ==========================================
// NEW DAY 10 CODE: DEVELOPER WORKFLOW
// ==========================================

// 7. Update Bug Status Payload Type
export interface UpdateBugStatusPayload {
  status: string; // "NEW" | "OPEN" | "IN_PROGRESS" | "FIXED" etc.
  fixNotes?: string;
  commitHash?: string;
}

// 8. Get Bugs Assigned to Logged-in Developer
export const getMyBugs = async (filters?: { status?: string; priority?: string }) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);

  const response = await api.get(`${API_URL}/bugs/my?${params.toString()}`);
  return response.data.data as Bug[];
};

// 9. Get Single Bug Details
export const getBugById = async (id: string) => {
  const response = await api.get(`${API_URL}/bugs/${id}`);
  return response.data.data as Bug;
};

// 10. Update Bug Status (State Machine transition)
export const updateBugStatus = async (id: string, payload: UpdateBugStatusPayload) => {
  const response = await api.patch(`${API_URL}/bugs/${id}/status`, payload);
  return response.data.data as Bug;
};

// 11. Request Retest (Developer to QA)
export const requestRetest = async (id: string, fixNotes: string, commitHash?: string) => {
  const response = await api.post(`${API_URL}/bugs/${id}/request-retest`, { fixNotes, commitHash });
  return response.data.data as Bug;
};