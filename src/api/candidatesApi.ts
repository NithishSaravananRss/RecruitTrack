import api from './axios';
import type { Candidate, CandidateStage } from '@/types';
import { PaginatedResponse, ApiResponse } from './jobsApi';

export interface CreateCandidateRequest {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  skills: string[];
  experienceYears: number;
  appliedRole: string;
  appliedJobId: string;
  source?: string;
  expectedSalary?: string;
  noticePeriod?: string;
}

export interface UpdateCandidateRequest extends Partial<CreateCandidateRequest> {
  currentStage?: CandidateStage;
  rating?: number;
}

export const candidatesApi = {
  getCandidates: async (params?: { 
    search?: string; 
    stage?: string; 
    experience?: number; 
    page?: number; 
    size?: number 
  }): Promise<PaginatedResponse<Candidate>> => {
    const { data } = await api.get('/candidates', { params });
    return data;
  },

  getCandidate: async (id: string): Promise<ApiResponse<Candidate>> => {
    const { data } = await api.get(`/candidates/${id}`);
    return data;
  },

  createCandidate: async (candidateData: any): Promise<ApiResponse<Candidate>> => {
    // Map frontend-only 'name' to backend's 'firstName' and 'lastName'
    const nameParts = (candidateData.name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';
    
    const backendPayload = {
      firstName,
      lastName,
      email: candidateData.email,
      phone: candidateData.phone || '',
      location: candidateData.location || '',
      yearsOfExperience: candidateData.experienceYears || 0,
      skills: candidateData.skills || [],
      source: candidateData.source || 'CAREER_SITE'
    };
    
    const { data } = await api.post('/candidates', backendPayload);
    // Attach appliedRole back to response variables so the mutation onSuccess can use it
    if (data && candidateData.appliedRole) {
      data._appliedRole = candidateData.appliedRole;
      data._appliedJobId = candidateData.appliedJobId;
    }
    return data;
  },

  updateCandidate: async (id: string, candidateData: UpdateCandidateRequest): Promise<ApiResponse<Candidate>> => {
    const { data } = await api.put(`/candidates/${id}`, candidateData);
    return data;
  },

  uploadResume: async (id: string, file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/candidates/${id}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};
