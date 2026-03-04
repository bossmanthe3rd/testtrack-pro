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

// 4. Bug Listing Types (These were missing and causing your errors!)
export interface UserRef {
  id: string;
  name: string;
}

export interface Bug {
  id: string;
  bugId: string;
  title: string;
  severity: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedTo?: UserRef | null;
  reportedBy: UserRef;
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

// 5. Get Bugs Function
export const getBugs = async (filters?: Record<string, string | number>) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  const response = await api.get(`${API_URL}/bugs?${params.toString()}`);
  
  // FIX: We add .data here to bypass the backend's { success: true, data: ... } wrapper
  return response.data.data as BugListResponse; 
};