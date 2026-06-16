import api from './axios';
import type { ApiResponse, PaginatedResponse } from './jobsApi';

export interface UserSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export type DocumentType = 'RESUME' | 'COVER_LETTER' | 'CERTIFICATE' | 'OTHER' | 'OTHER' | 'OTHER';

export interface CandidateDocumentSummaryResponse {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentType: DocumentType;
  isLatestResume: boolean;
  createdAt: string;
}

export interface CandidateDocumentResponse extends CandidateDocumentSummaryResponse {
  candidateId: string;
  fileUrl: string;
  uploadedBy: UserSummaryDto;
  updatedAt: string;
}

export interface UploadDocumentRequest {
  candidateId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  documentType: DocumentType;
  isLatestResume?: boolean;
}

export const documentsApi = {
  getCandidateDocuments: async (candidateId: string, params?: { page?: number; size?: number; sort?: string }): Promise<PaginatedResponse<CandidateDocumentSummaryResponse>> => {
    const { data } = await api.get(`/candidates/${candidateId}/documents`, { params });
    return data;
  },

  getDocument: async (documentId: string): Promise<ApiResponse<CandidateDocumentResponse>> => {
    const { data } = await api.get(`/documents/${documentId}`);
    return data;
  },

  uploadDocument: async (request: UploadDocumentRequest): Promise<ApiResponse<CandidateDocumentResponse>> => {
    const { data } = await api.post('/documents/upload', request);
    return data;
  },

  deleteDocument: async (documentId: string): Promise<ApiResponse<void>> => {
    const { data } = await api.delete(`/documents/${documentId}`);
    return data;
  }
};
