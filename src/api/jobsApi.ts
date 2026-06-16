import api from './axios';
import type { Job, JobStatus, PipelineStageResponse } from '@/types';

export interface PaginatedResponse<T> {
  data: {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface CreateJobRequest {
  title: string;
  department: string;
  location: string;
  remote: boolean;
  openings: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description?: string;
  status?: string;
  hiringManagerId?: string;
}

export interface UpdateJobRequest extends CreateJobRequest {}

export const jobsApi = {
  getJobs: async (params?: { search?: string; department?: string; location?: string; status?: string; page?: number; size?: number }): Promise<PaginatedResponse<Job>> => {
    const { data } = await api.get('/jobs', { params });
    return data;
  },

  getJob: async (id: string): Promise<ApiResponse<Job>> => {
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },

  createJob: async (jobData: CreateJobRequest): Promise<ApiResponse<Job>> => {
    const { data } = await api.post('/jobs', jobData);
    return data;
  },

  updateJob: async (id: string, jobData: UpdateJobRequest): Promise<ApiResponse<Job>> => {
    const { data } = await api.put(`/jobs/${id}`, jobData);
    return data;
  },

  updateJobStatus: async (id: string, status: JobStatus): Promise<ApiResponse<void>> => {
    const { data } = await api.patch(`/jobs/${id}/status`, { status });
    return data;
  },
  
  archiveJob: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await api.patch(`/jobs/${id}/status`, { status: 'CLOSED' });
    return data;
  },

  getJobStages: async (id: string): Promise<ApiResponse<PipelineStageResponse[]>> => {
    const { data } = await api.get(`/jobs/${id}/pipeline-stages`);
    return data;
  },

  updateJobStagesOrder: async (id: string, stageIds: string[]): Promise<ApiResponse<void>> => {
    const { data } = await api.put(`/jobs/${id}/pipeline-stages/reorder`, { stageIds });
    return data;
  }
};
