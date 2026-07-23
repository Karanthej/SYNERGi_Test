import { apiClient } from '@/lib/apiClient';

export const fileService = {
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`/files/upload`, formData);
    return res.data.data.url;
  }
};
