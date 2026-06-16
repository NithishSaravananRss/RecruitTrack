// Core entity types

export type UserRole = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER';

export type JobStatus = 'ACTIVE' | 'DRAFT' | 'CLOSED' | 'PAUSED';

export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'technical'
  | 'manager'
  | 'hr_round'
  | 'offer'
  | 'hired'
  | 'rejected';

export type InterviewType = 'phone' | 'video' | 'technical' | 'behavioral' | 'panel';

export type FeedbackStatus = 'pending' | 'submitted' | 'waived';

export type CandidatePriority = 'critical' | 'high' | 'normal' | 'low';

export type CandidateSource =
  | 'LINKEDIN'
  | 'REFERRAL'
  | 'JOB_PORTAL'
  | 'CAREER_SITE'
  | 'AGENCY'
  | 'OTHER'
  | 'OTHER'
  | 'OTHER';

export type NotificationType =
  | 'new_application'
  | 'stage_change'
  | 'interview_scheduled'
  | 'feedback_submitted'
  | 'offer_accepted'
  | 'offer_declined';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  initials: string;
  department?: string;
  title?: string;
}

export interface Job {
  id: string;
  reqId: string;
  title: string;
  department: string;
  location: string;
  status: JobStatus;
  applicantCount: number;
  hiringManagerId: string;
  hiringManagerName: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  salary?: { min: number; max: number; currency: string };
  remote: boolean;
  openings: number;
  closedAt?: string;
}

export interface Candidate {
  id: string;
  candidateId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  location: string;
  resumeUrl?: string;
  linkedin?: string;
  skills: string[];
  yearsOfExperience: number;
  level: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Principal' | 'Staff';
  currentStage: CandidateStage;
  appliedRole: string;
  appliedJobId: string;
  source: CandidateSource;
  expectedSalaryMin?: number; expectedSalaryMax?: number;
  noticePeriod: string;
  lastActivity: string;
  appliedAt: string;
  tags: string[];
  rating: number;
  priority: CandidatePriority;
  hasNotes: boolean;
  hasAttachments: boolean;
  referredBy?: string;
  currentCompany?: string;
  experience: WorkExperience[];
  matchScore?: number; // 0-100, AI match percentage
  resumeStatus?: 'new' | 'pending' | 'reviewed'; // resume review state
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface PipelineStageResponse {
  id: string;
  name: string;
  stageType: string;
  position: number;
}

export interface ApplicationCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
}

export interface ApplicationJob {
  id: string;
  title: string;
  reqId: string;
  department: string;
  status?: string;
}

export interface Application {
  id: string;
  candidate: ApplicationCandidate;
  job: ApplicationJob;
  currentStage: PipelineStageResponse;
  status: string;
  matchScore?: number;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  interviewCount?: number;
  pendingFeedbackCount?: number;
  appliedAt: string;
  lastStageChangedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string;
  duration: number; // minutes
  interviewers: string[];
  meetingLink?: string;
  feedbackStatus: FeedbackStatus;
  notes?: string;
  location?: string;
}

export interface Feedback {
  id: string;
  interviewId: string;
  candidateId: string;
  submittedBy: string;
  submittedAt: string;
  overallRating: number;
  recommendation: 'strong_yes' | 'yes' | 'no' | 'strong_no';
  scores: {
    technicalDepth: number;
    communication: number;
    problemSolving: number;
    cultureFit: number;
  };
  notes: string;
  strengths: string[];
  improvements: string[];
}

export interface ActivityItem {
  id: string;
  type: 'applied' | 'stage_change' | 'interview' | 'feedback' | 'note' | 'email' | 'review';
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  candidateName?: string;
  jobTitle?: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  openJobs: number;
  openJobsDelta: number;
  activeCandidates: number;
  activeCandidatesDelta: number;
  interviewsToday: number;
  interviewsTodayDelta: number;
  offersSent: number;
  offersSentDelta: number;
  avgTimeToHire: number;
  avgTimeToHireDelta: number;
  hiringVelocity: number;
  hiringVelocityDelta: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  conversion?: number;
}
