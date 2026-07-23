import { apiClient } from '@/lib/apiClient';

export interface ChatNotificationResponse {
  uuid?: string;
  messageUuid?: string;
  roomUuid: string;
  startupUuid: string;
  startupName: string;
  startupLogo?: string;
  conversationName?: string;
  senderName: string;
  senderAvatar?: string;
  roleBadge?: string;
  notificationType: string;
  content: string;
  actionData?: string;
  createdAt: string;
  isRead: boolean;
}

export const notificationService = {
  getNotifications: async (): Promise<ChatNotificationResponse[]> => {
    const response = await apiClient.get('/chat/notifications');
    return response.data || [];
  },

  markAsRead: async (uuid: string): Promise<void> => {
    await apiClient.put(`/chat/notifications/${uuid}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/chat/notifications/read-all');
  },

  deleteNotification: async (uuid: string): Promise<void> => {
    await apiClient.delete(`/chat/notifications/${uuid}`);
  }
};
