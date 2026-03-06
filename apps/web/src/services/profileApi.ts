import { api } from '../features/auth/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'TESTER' | 'DEVELOPER' | 'ADMIN';
  createdAt: string;
}

export interface UserStats {
  bugsReported: number;
  testCasesAuthored: number;
  bugsAssigned: number;
  bugsFixed: number;
  executionsRun: number;
}

export const getMyProfile = async (): Promise<UserProfile> => {
  const res = await api.get('/api/users/profile');
  return res.data.data as UserProfile;
};

export const updateMyProfile = async (data: { name?: string; email?: string }): Promise<UserProfile> => {
  const res = await api.patch('/api/users/profile', data);
  return res.data.data as UserProfile;
};

export const getMyStats = async (): Promise<UserStats> => {
  const res = await api.get('/api/users/stats');
  return res.data.data as UserStats;
};
