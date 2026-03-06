import { api } from '../features/auth/api';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  _count?: {
    testCases: number;
    bugs: number;
    testSuites: number;
  };
}

export interface ProjectListItem {
  id: string;
  name: string;
}

// Lightweight list — only id + name, used in dropdowns
export const getProjectDropdownList = async (): Promise<ProjectListItem[]> => {
  const response = await api.get('/api/projects/list');
  return response.data.data as ProjectListItem[];
};

// Full list with stats for the Projects page
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/api/projects');
  return response.data.data as Project[];
};

// Single project (with counts)
export const getProjectById = async (id: string): Promise<Project> => {
  const response = await api.get(`/api/projects/${id}`);
  return response.data.data as Project;
};

// Create a new project
export const createProject = async (data: { name: string; description?: string }): Promise<Project> => {
  const response = await api.post('/api/projects', data);
  return response.data.data as Project;
};

export interface ProjectTestCase {
  id: string;
  testCaseId: string;
  title: string;
  status: string;
  priority: string;
  severity: string;
  createdAt: string;
}

export interface ProjectBug {
  id: string;
  bugId: string;
  title: string;
  status: string;
  priority: string;
  severity: string;
  createdAt: string;
}

export interface ProjectContent {
  testCases: ProjectTestCase[];
  bugs: ProjectBug[];
}

// Test cases + bugs for the project detail page
export const getProjectContent = async (id: string): Promise<ProjectContent> => {
  const response = await api.get(`/api/projects/${id}/content`);
  return response.data.data as ProjectContent;
};

