import api from './axios';
import type { ApiResponse, PaginatedResponse } from './jobsApi';

export interface UserSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface CandidateNoteResponse {
  id: string;
  candidateId: string;
  content: string;
  isPrivate: boolean;
  createdBy: UserSummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  candidateId: string;
  content: string;
  isPrivate?: boolean;
}

export interface UpdateNoteRequest {
  content: string;
  isPrivate?: boolean;
}

export const notesApi = {
  createNote: async (request: CreateNoteRequest): Promise<ApiResponse<CandidateNoteResponse>> => {
    const { data } = await api.post('/notes', request);
    return data;
  },

  getCandidateNotes: async (candidateId: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<CandidateNoteResponse>> => {
    const { data } = await api.get(`/candidates/${candidateId}/notes`, { params });
    return data;
  },

  updateNote: async (noteId: string, request: UpdateNoteRequest): Promise<ApiResponse<CandidateNoteResponse>> => {
    const { data } = await api.put(`/notes/${noteId}`, request);
    return data;
  },

  deleteNote: async (noteId: string): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/notes/${noteId}`);
    return data;
  }
};
