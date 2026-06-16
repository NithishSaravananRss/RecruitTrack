import api from './axios';
import type { ApiResponse, PaginatedResponse } from './jobsApi';

export interface NotificationResponse {
  id: string;
  message: string;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export const notificationsApi = {
  getUserNotifications: async (params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<NotificationResponse>> => {
    const { data } = await api.get('/notifications', { params });
    return data;
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<NotificationResponse>> => {
    const { data } = await api.patch(`/notifications/${notificationId}/read`);
    return data;
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  }
};
