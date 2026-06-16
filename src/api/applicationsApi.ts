import api from './axios';
import type { Application } from '@/types';
import { PaginatedResponse, ApiResponse } from './jobsApi';

export interface CreateApplicationRequest {
  candidateId: string;
  jobId: string;
}

export const applicationsApi = {
  createApplication: async (data: CreateApplicationRequest): Promise<ApiResponse<Application>> => {
    const response = await api.post('/applications', data);
    return response.data;
  },

  getApplication: async (id: string): Promise<ApiResponse<Application>> => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },

  getJobApplications: async (jobId: string, params?: { stage?: string; status?: string; page?: number; size?: number }): Promise<PaginatedResponse<Application>> => {
    const response = await api.get(`/jobs/${jobId}/applications`, { params });
    return response.data;
  },

  getCandidateApplications: async (candidateId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Application>> => {
    const response = await api.get(`/candidates/${candidateId}/applications`, { params });
    return response.data;
  },

  moveApplicationStage: async (id: string, stageId: string, note?: string): Promise<ApiResponse<Application>> => {
    const response = await api.patch(`/applications/${id}/stage`, { stageId, note });
    return response.data;
  },

  rejectApplication: async (id: string, rejectionReason?: string): Promise<ApiResponse<Application>> => {
    const response = await api.patch(`/applications/${id}/reject`, { rejectionReason });
    return response.data;
  }
};
