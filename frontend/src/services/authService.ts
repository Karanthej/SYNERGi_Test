import { apiClient } from '@/lib/apiClient';

export const authService = {
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  
  syncUser: async (data: any, token?: string) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await apiClient.post('/auth/sync', data, config);
    return res.data;
  }
};
