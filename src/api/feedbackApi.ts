import api from './axios';
import type { ApiResponse, PaginatedResponse } from './jobsApi';

export interface RatingDto {
  attribute: string;
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  interview: {
    id: string;
    applicationId: string;
    candidateName: string;
    jobTitle: string;
    stageName: string;
    status: string;
    scheduledAt: string;
    durationMinutes: number;
  };
  application: {
    id: string;
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    appliedAt: string;
  };
  interviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  recommendation: string;
  overallComments?: string;
  ratings: RatingDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmitFeedbackRequest {
  interviewId: string;
  recommendation: string;
  overallComments?: string;
  ratings: RatingDto[];
}

export interface UpdateFeedbackRequest {
  recommendation: string;
  overallComments?: string;
  ratings: RatingDto[];
}

export const feedbackApi = {
  getFeedbackByApplication: async (applicationId: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<FeedbackResponse>> => {
    const { data } = await api.get(`/applications/${applicationId}/feedback`, { params });
    return data;
  },

  getFeedbackByInterview: async (interviewId: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<FeedbackResponse>> => {
    const { data } = await api.get(`/interviews/${interviewId}/feedback`, { params });
    return data;
  },

  submitFeedback: async (request: SubmitFeedbackRequest): Promise<ApiResponse<FeedbackResponse>> => {
    const { data } = await api.post('/feedback', request);
    return data;
  },

  updateFeedback: async (id: string, request: UpdateFeedbackRequest): Promise<ApiResponse<FeedbackResponse>> => {
    const { data } = await api.put(`/feedback/${id}`, request);
    return data;
  }
};
