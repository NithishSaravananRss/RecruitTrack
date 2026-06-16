import api from './axios';
import type { ApiResponse } from './jobsApi';

export interface AnalyticsMetricResponse {
  label: string;
  value: number;
}

export interface DashboardSummaryResponse {
  totalJobs: number;
  activeJobs: number;
  closedJobs: number;
  totalCandidates: number;
  totalApplications: number;
  activeApplications: number;
  scheduledInterviews: number;
  completedInterviews: number;
  totalOffers: number;
  totalHires: number;
  totalRejections: number;
}

export interface HiringFunnelResponse {
  stageName: string;
  count: number;
  conversionPercentage: number;
  dropOffPercentage: number;
}

export interface JobAnalyticsResponse {
  activeJobs: number;
  closedJobs: number;
  topJobsByApplications: AnalyticsMetricResponse[];
  jobsWithNoApplications: string[];
  applicationsPerJob: AnalyticsMetricResponse[];
}

export interface PipelineAnalyticsResponse {
  stageName: string;
  count: number;
}

export const analyticsApi = {
  getDashboardSummary: async () => {
    return api.get<ApiResponse<DashboardSummaryResponse>>('/analytics/dashboard');
  },
  getPipelineAnalytics: async () => {
    return api.get<ApiResponse<PipelineAnalyticsResponse[]>>('/analytics/pipeline');
  },
  getHiringFunnel: async () => {
    return api.get<ApiResponse<HiringFunnelResponse[]>>('/analytics/hiring-funnel');
  },
  getJobAnalytics: async () => {
    return api.get<ApiResponse<JobAnalyticsResponse>>('/analytics/jobs');
  },
};
