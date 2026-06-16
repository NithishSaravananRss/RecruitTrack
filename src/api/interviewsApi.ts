import api from './axios';
import type { ApiResponse, PaginatedResponse } from './jobsApi';
import type { InterviewType } from '@/types';

export interface UserSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface InterviewResponse {
  id: string;
  application: {
    id: string;
    candidate: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      fullName?: string;
    };
    job: {
      id: string;
      reqId?: string;
      title?: string;
      department?: string;
    };
    appliedAt: string;
  };
  stage: {
    id: string;
    name: string;
    stageType: string;
    position: number;
  };
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  instructions?: string;
  interviewers: UserSummaryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInterviewRequest {
  applicationId: string;
  stageId: string;
  scheduledAt: string; // ISO-8601 UTC string
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  instructions?: string;
  interviewerIds: string[];
}

export interface UpdateInterviewRequest {
  stageId: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  instructions?: string;
  interviewerIds: string[];
}

export const interviewsApi = {
  getAllInterviews: async (params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<InterviewResponse>> => {
    const { data } = await api.get('/interviews', { params });
    return data;
  },

  getInterview: async (id: string): Promise<ApiResponse<InterviewResponse>> => {
    const { data } = await api.get(`/interviews/${id}`);
    return data;
  },

  scheduleInterview: async (request: ScheduleInterviewRequest): Promise<ApiResponse<InterviewResponse>> => {
    const { data } = await api.post('/interviews', request);
    return data;
  },

  updateInterview: async (id: string, request: UpdateInterviewRequest): Promise<ApiResponse<InterviewResponse>> => {
    const { data } = await api.put(`/interviews/${id}`, request);
    return data;
  },

  cancelInterview: async (id: string, reason?: string): Promise<ApiResponse<InterviewResponse>> => {
    const { data } = await api.patch(`/interviews/${id}/cancel`, { reason });
    return data;
  },

  completeInterview: async (id: string, notes?: string): Promise<ApiResponse<InterviewResponse>> => {
    const { data } = await api.patch(`/interviews/${id}/complete`, { notes });
    return data;
  },
  
  getInterviewsByApplication: async (applicationId: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<InterviewResponse>> => {
    const { data } = await api.get(`/applications/${applicationId}/interviews`, { params });
    return data;
  }
};
