import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, ChevronDown, Mail, Phone, MapPin, Link2 as Linkedin,
  ArrowRight, X, Calendar, FileText, MessageSquare,
  Tag, Download, Building2, Clock, Plus, CheckCircle2, ExternalLink,
  Users, Video, Star, Loader2, Edit2, Info,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { StarRating } from '@/components/ui/StarRating';
import { Modal } from '@/components/ui/Modal';
import { getStageLabel, getStageBadgeClass } from '@/lib/utils';
import { candidatesApi } from '@/api/candidatesApi';
import { feedbackApi } from '@/api/feedbackApi';
import { documentsApi, type DocumentType } from '@/api/documentsApi';
import { notesApi } from '@/api/notesApi';
import { applicationsApi } from '@/api/applicationsApi';
import { jobsApi } from '@/api/jobsApi';
import { interviewsApi } from '@/api/interviewsApi';
import { useAuth } from '@/contexts/AuthContext';
import { formatBytes } from '@/lib/utils';
import type { InterviewType, PipelineStageResponse } from '@/types';


function ScoreBar({ score, max = 5, label }: { score: number; max?: number; label: string }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? '#16A34A' : pct >= 60 ? '#4F46E5' : '#D97706';
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs text-text-muted w-28 flex-shrink-0">{label}</div>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs font-semibold w-14 text-right" style={{ color }}>
        {score.toFixed(1)} / {max}
      </div>
    </div>
  );
}

function calculateOverallScore(ratings: { rating: number }[]) {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / ratings.length).toFixed(1));
}

// Inline Stage Dropdown
function StageDropdown({ currentStageId, stages, onChange }: { currentStageId: string; stages: PipelineStageResponse[]; onChange: (stageId: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const currentStage = stages.find(s => s.id === currentStageId) || stages[0];

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  if (!currentStage) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${getStageBadgeClass(currentStage.stageType.toLowerCase() as any)}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {currentStage.name}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white border border-border rounded-[10px] shadow-dropdown z-50 py-1.5 min-w-[160px]">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border mb-1">Move to Stage</div>
          {stages.map(s => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-[13px] transition-colors ${
                s.id === currentStageId ? 'bg-primary-light text-primary font-semibold' : 'text-text hover:bg-gray-50'
              }`}
            >
              {s.id === currentStageId && <CheckCircle2 size={12} className="text-primary" />}
              {s.id !== currentStageId && <div className="w-3 h-3" />}
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Schedule Interview Modal
function ScheduleInterviewModal({
  open, onClose, candidateName, onSave,
}: { open: boolean; onClose: () => void; candidateName: string; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    type: 'technical' as InterviewType,
    date: '2026-06-05',
    time: '14:00',
    duration: '60',
    interviewers: '',
    link: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSave = () => {
    if (!form.date || !form.time) return;
    setSubmitting(true);
    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
    
    onSave({
      type: form.type,
      scheduledAt,
      durationMinutes: parseInt(form.duration, 10),
      interviewerIds: user?.id ? [user.id] : [],
      location: '',
      meetingLink: form.link,
      instructions: form.notes
    });
  };

  const TYPE_OPTIONS: { value: InterviewType; label: string }[] = [
    { value: 'phone', label: 'Phone Screen' },
    { value: 'video', label: 'Video Interview' },
    { value: 'technical', label: 'Technical Interview' },
    { value: 'behavioral', label: 'Behavioral Interview' },
    { value: 'panel', label: 'Panel Interview' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Schedule Interview"
      subtitle={`Book an interview session with ${candidateName}`} size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            {submitting ? '✓ Scheduled!' : 'Schedule Interview'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Interview Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(t => (
              <label key={t.value} className={`flex items-center gap-2 px-3 py-2.5 border rounded-[8px] cursor-pointer transition-colors ${
                form.type === t.value ? 'border-primary bg-primary-light' : 'border-border hover:bg-gray-50'
              }`}>
                <input type="radio" checked={form.type === t.value} onChange={() => setForm(f => ({ ...f, type: t.value }))} className="hidden" />
                <span className={`text-[12px] font-medium ${form.type === t.value ? 'text-primary' : 'text-text'}`}>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={form.date} min="2026-06-01"
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Time</label>
            <input type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Duration</label>
            <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Interviewers</label>
          <input value={form.interviewers} onChange={e => setForm(f => ({ ...f, interviewers: e.target.value }))}
            placeholder="e.g. Marcus Chen, Sarah Johnson"
            className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Meeting Link</label>
          <input type="url" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            placeholder="https://meet.google.com/..."
            className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Notes for Interviewers</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Topics to cover, focus areas, or specific questions..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3} />
        </div>
      </div>
    </Modal>
  );
}

function SubmitFeedbackModal({
  open, onClose, interview, onSave, submitting
}: { open: boolean; onClose: () => void; interview: any; onSave: (data: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    recommendation: 'yes',
    overallComments: '',
    ratings: [
      { attribute: 'Technical Depth', rating: 0 },
      { attribute: 'Communication', rating: 0 },
      { attribute: 'Problem Solving', rating: 0 },
      { attribute: 'Culture Fit', rating: 0 }
    ]
  });

  const handleRatingChange = (idx: number, rating: number) => {
    const newRatings = [...form.ratings];
    newRatings[idx].rating = rating;
    setForm({ ...form, ratings: newRatings });
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit Feedback" subtitle={`Feedback for ${interview?.stage?.name || 'Interview'}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(form)} loading={submitting}>Submit Feedback</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Recommendation</label>
          <select value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })}
            className="w-full h-9 px-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value="strong_yes">Strong Yes</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="strong_no">Strong No</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Ratings (0-5)</label>
          <div className="space-y-2">
            {form.ratings.map((r, i) => (
              <div key={r.attribute} className="flex items-center justify-between">
                <span className="text-sm text-text">{r.attribute}</span>
                <input type="number" min="0" max="5" value={r.rating} onChange={e => handleRatingChange(i, Number(e.target.value))}
                  className="w-16 h-8 px-2 text-sm border border-border rounded-md text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Overall Comments</label>
          <textarea value={form.overallComments} onChange={e => setForm({ ...form, overallComments: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" rows={4} />
        </div>
      </div>
    </Modal>
  );
}

function UploadDocumentModal({
  open, onClose, onSave, submitting
}: { open: boolean; onClose: () => void; onSave: (data: any) => void; submitting: boolean }) {
  const [form, setForm] = useState({
    fileName: '',
    fileUrl: '',
    documentType: 'RESUME' as DocumentType,
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    isLatestResume: false
  });

  return (
    <Modal open={open} onClose={onClose} title="Upload Document" subtitle="Add a new file to this candidate's profile"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(form)} loading={submitting} disabled={!form.fileName || !form.fileUrl}>Upload</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">File Name</label>
          <input value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="e.g. Resume_2026.pdf"
            className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">File URL (S3 / Storage Link)</label>
          <input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..."
            className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Document Type</label>
            <select value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value as DocumentType })}
              className="w-full h-9 px-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="RESUME">Resume</option>
              <option value="COVER_LETTER">Cover Letter</option>
              <option value="PORTFOLIO">Portfolio</option>
              <option value="OFFER_LETTER">Offer Letter</option>
              <option value="CONTRACT">Contract</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Size (bytes)</label>
            <input type="number" value={form.fileSizeBytes} onChange={e => setForm({ ...form, fileSizeBytes: Number(e.target.value) })}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        {form.documentType === 'RESUME' && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={form.isLatestResume} onChange={e => setForm({ ...form, isLatestResume: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary/20" />
            <span className="text-sm text-text">Mark as latest resume</span>
          </label>
        )}
      </div>
    </Modal>
  );
}

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [feedbackInterviewId, setFeedbackInterviewId] = useState<string | null>(null);
  const [extraActivity, setExtraActivity] = useState<{ title: string; desc: string; ts: string; type: string }[]>([]);

  const { data: candidateResponse, isLoading: isLoadingCandidate, isError: isErrorCandidate } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => candidatesApi.getCandidate(id!),
    enabled: !!id,
  });

  const { data: applicationsResponse, isLoading: isLoadingApps } = useQuery({
    queryKey: ['candidates', id, 'applications'],
    queryFn: () => applicationsApi.getCandidateApplications(id!),
    enabled: !!id,
  });

  const applications = applicationsResponse?.data?.content || [];
  const urlAppId = searchParams.get('applicationId');
  const application = urlAppId 
    ? applications.find((a: any) => a.id === urlAppId) 
    : applications[0];

  const { data: stagesResponse } = useQuery({
    queryKey: ['jobs', application?.job?.id, 'stages'],
    queryFn: () => jobsApi.getJobStages(application!.job.id),
    enabled: !!application?.job?.id,
  });
  const pipelineStages = stagesResponse?.data || [];

  const { data: interviewsResponse } = useQuery({
    queryKey: ['applications', application?.id, 'interviews'],
    queryFn: () => interviewsApi.getInterviewsByApplication(application!.id),
    enabled: !!application?.id,
  });
  const activeInterviews = interviewsResponse?.data?.content || [];

  const { data: feedbackResponse } = useQuery({
    queryKey: ['applications', application?.id, 'feedback'],
    queryFn: () => feedbackApi.getFeedbackByApplication(application!.id),
    enabled: !!application?.id,
  });
  const feedback = feedbackResponse?.data?.content || [];

  const { data: documentsResponse } = useQuery({
    queryKey: ['candidates', id, 'documents'],
    queryFn: () => documentsApi.getCandidateDocuments(id!),
    enabled: !!id,
  });
  const docs = documentsResponse?.data?.content || [];

  const { data: notesResponse } = useQuery({
    queryKey: ['candidates', id, 'notes'],
    queryFn: () => notesApi.getCandidateNotes(id!),
    enabled: !!id,
  });
  const notesList = notesResponse?.data?.content || [];

  const updateCandidateMutation = useMutation({
    mutationFn: (data: any) => candidatesApi.updateCandidate(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
      setShowEditModal(false);
    }
  });

  const moveStageMutation = useMutation({
    mutationFn: (stageId: string) => applicationsApi.moveApplicationStage(application!.id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'applications'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.rejectApplication(application!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'applications'] });
    }
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: (data: any) => interviewsApi.scheduleInterview({
      applicationId: application!.id,
      stageId: application!.currentStage.id,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', application?.id, 'interviews'] });
      setShowScheduleModal(false);
    }
  });

  const completeInterviewMutation = useMutation({
    mutationFn: (interviewId: string) => interviewsApi.completeInterview(interviewId, 'Completed from Candidate Profile'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', application?.id, 'interviews'] });
      setExtraActivity(prev => [{ title: 'Interview Completed', desc: 'An interview was marked as completed.', ts: 'Just now', type: 'system' }, ...prev]);
    }
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: any) => feedbackApi.submitFeedback({
      interviewId: feedbackInterviewId!,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', application?.id, 'feedback'] });
      setFeedbackInterviewId(null);
      setExtraActivity(prev => [{ title: 'Feedback Submitted', desc: 'Interview feedback was added.', ts: 'Just now', type: 'system' }, ...prev]);
    }
  });

  const cancelInterviewMutation = useMutation({
    mutationFn: (interviewId: string) => interviewsApi.cancelInterview(interviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', application?.id, 'interviews'] });
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: (data: any) => documentsApi.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'documents'] });
      setExtraActivity(prev => [{ title: 'Document Uploaded', desc: 'A new document was added.', ts: 'Just now', type: 'system' }, ...prev]);
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'documents'] });
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: any) => notesApi.createNote({ candidateId: id!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'notes'] });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: any }) => notesApi.updateNote(noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'notes'] });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', id, 'notes'] });
    }
  });

  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', experience: '', skills: '' });
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteIsPrivate, setNewNoteIsPrivate] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteIsPrivate, setEditNoteIsPrivate] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  useEffect(() => {
    if (candidateResponse?.data) {
      setEditForm({
        firstName: candidateResponse.data.firstName || candidateResponse.data.name?.split(' ')[0] || '',
        lastName: candidateResponse.data.lastName || candidateResponse.data.name?.split(' ').slice(1).join(' ') || '',
        email: candidateResponse.data.email || '',
        phone: candidateResponse.data.phone || '',
        experience: candidateResponse.data.yearsOfExperience?.toString() || '',
        skills: candidateResponse.data.skills?.join(', ') || ''
      });
    }
  }, [candidateResponse?.data]);

  const candidate = candidateResponse?.data;

  if (isLoadingCandidate || isLoadingApps) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-text-muted">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <div className="text-sm">Loading profile...</div>
      </div>
    );
  }

  if (isErrorCandidate || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-text-muted">
        <div className="text-lg font-medium mb-2">Candidate not found</div>
        <Button variant="secondary" onClick={() => navigate('/candidates')}>Back to Candidates</Button>
      </div>
    );
  }

  // Limited Activity View based on available data
  const baseActivity = application ? [
    { 
      title: `Moved to ${application.currentStage?.name || 'Current Stage'}`, 
      desc: 'Application stage was updated', 
      ts: new Date(application.createdAt || application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), 
      type: 'stage_change' 
    },
    { 
      title: 'Application Received', 
      desc: `Applied for ${application.job?.title || 'Job'}`, 
      ts: new Date(application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), 
      type: 'applied' 
    }
  ] : [];
  const activity = [...extraActivity, ...baseActivity];

  

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'resume', label: 'Resume' },
    { id: 'feedback', label: 'Interview Feedback', count: feedback.length },
    { id: 'activity', label: 'Activity', count: activity.length },
    { id: 'documents', label: 'Documents', count: docs.length },
    { id: 'notes', label: 'Notes', count: notesList.length },
  ];

  const handleScheduled = (data: any) => {
    scheduleInterviewMutation.mutate(data);
  };

  const handleStageChange = (stageId: string) => {
    moveStageMutation.mutate(stageId);
  };

  const TYPE_ICON: Record<string, React.ReactNode> = {
    interview: <Calendar size={10} className="text-teal" />,
    review: <Star size={10} className="text-warning" />,
    stage_change: <ArrowRight size={10} className="text-indigo" />,
    applied: <Building2 size={10} className="text-text-muted" />,
    hire: <CheckCircle2 size={10} className="text-success" />,
    offer: <FileText size={10} className="text-primary" />,
    note: <MessageSquare size={10} className="text-text-muted" />,
    rejected: <X size={10} className="text-danger" />,
    system: <Info size={10} className="text-text-muted" />,
  };

  const candidateName = candidate.name || (candidate.firstName ? `${candidate.firstName} ${candidate.lastName || ''}`.trim() : 'Unknown Candidate');

  return (
    <div className="max-w-[1300px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-muted mb-4">
        <Link to="/candidates" className="hover:text-text transition-colors">Candidates</Link>
        <ChevronRight size={13} />
        <span className="text-text font-medium">{candidateName}</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-border rounded-card shadow-card p-5 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar name={candidateName} size="xl" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-[20px] font-bold text-text tracking-tight">{candidateName}</h1>
              {/* Inline stage dropdown */}
              {application && <StageDropdown currentStageId={application.currentStage?.id} stages={pipelineStages} onChange={handleStageChange} />}
              {application?.status === 'REJECTED' && (
                <Badge className={getStageBadgeClass('rejected')}>REJECTED</Badge>
              )}
              {application?.matchScore && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  application.matchScore >= 85 ? 'bg-success-light text-success' :
                  application.matchScore >= 70 ? 'bg-indigo-light text-indigo' : 'bg-warning-light text-warning-dark'
                }`}>
                  <Star size={10} className="fill-current" /> {application.matchScore}% Match
                </span>
              )}
            </div>
            <div className="text-sm text-text-muted">
              {application?.job?.title && <span>Applied for <span className="font-semibold text-text">{application.job.title}</span></span>}
              {candidate.currentCompany && ` · Currently at ${candidate.currentCompany}`}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
              <span className="flex items-center gap-1"><MapPin size={11} />{candidate.location || 'Unknown'}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{candidate.noticePeriod || 'Immediate'} notice</span>
              <span className="flex items-center gap-1"><Building2 size={11} />{candidate.yearsOfExperience}y experience</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {candidate.skills && candidate.skills.map((skill: string) => (
                <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">
                  <Tag size={8} /> {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Button variant="primary" size="md" icon={<Calendar size={13} />} onClick={() => setShowScheduleModal(true)}>
              Schedule Interview
            </Button>
            <Button variant="secondary" size="md" icon={<Edit2 size={13} />} onClick={() => setShowEditModal(true)}>
              Edit
            </Button>
            <Button variant="secondary" size="md" icon={<Mail size={13} />}>
              Email
            </Button>
            {application && application.status !== 'REJECTED' && (
              <Button variant="secondary" size="md"
                className="text-danger border-danger/30 hover:bg-danger-light hover:border-danger"
                icon={<X size={13} />}
                onClick={() => rejectMutation.mutate()}
                loading={rejectMutation.isPending}
              >
                Reject
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Applications Selector */}
      {applications.length > 1 && (
        <div className="mb-4 bg-gray-50 p-3 rounded-[8px] border border-border flex items-center gap-3">
          <span className="text-sm font-medium text-text">Applications:</span>
          <div className="flex gap-2">
            {applications.map((app: any) => (
              <button
                key={app.id}
                onClick={() => setSearchParams({ applicationId: app.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  app.id === (application?.id) 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-white text-text border border-border hover:bg-gray-100'
                }`}
              >
                {app.job?.title || 'Unknown Job'} 
                <span className="opacity-75 ml-1">({app.status})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Main */}
        <div className="col-span-12 lg:col-span-8">

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <div className="text-[13px] font-bold text-text mb-3">Contact Information</div>
                  <div className="space-y-2.5">
                    {[
                      { icon: <Mail size={13} />, label: 'Email', val: <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">{candidate.email}</a> },
                      { icon: <Phone size={13} />, label: 'Phone', val: candidate.phone || '-' },
                      { icon: <MapPin size={13} />, label: 'Location', val: candidate.location || 'Unknown' },
                      ...(candidate.linkedin ? [{ icon: <Linkedin size={13} />, label: 'LINKEDIN', val: <a href={`https://${candidate.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{candidate.linkedin} <ExternalLink size={10} /></a> }] : []),
                    ].map(({ icon, label, val }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <span className="text-text-muted mt-0.5 flex-shrink-0">{icon}</span>
                        <div>
                          <div className="text-[9px] text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
                          <div className="text-sm text-text">{val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="text-[13px] font-bold text-text mb-3">Application Details</div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Source', value: candidate.source || 'Direct' },
                      { label: 'Notice Period', value: candidate.noticePeriod || 'Immediate' },
                      { label: 'Expected Salary', value: candidate.expectedSalaryMin || '-' },
                      { label: 'Applied', value: application ? new Date(application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-' },
                      { label: 'Experience Level', value: `${candidate.level || 'Mid-Level'} (${candidate.yearsOfExperience}y)` },
                      ...(candidate.referredBy ? [{ label: 'Referred By', value: candidate.referredBy }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{label}</span>
                        <span className="text-[13px] font-semibold text-text">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Card>
                <div className="text-[13px] font-bold text-text mb-3">Skills & Expertise</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills && candidate.skills.map((skill: string) => (
                    <span key={skill} className="px-2.5 py-1 bg-indigo-light text-indigo border border-indigo/20 rounded-md text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                  {(!candidate.skills || candidate.skills.length === 0) && (
                    <span className="text-sm text-text-muted">No skills listed.</span>
                  )}
                </div>
              </Card>

              <Card>
                <div className="text-[13px] font-bold text-text mb-4">Work Experience</div>
                <div className="space-y-5">
                  {candidate.experience && candidate.experience.map((exp: any, i: number) => (
                    <div key={exp.id || i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${exp.current ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`} />
                        {i < candidate.experience.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[13px] font-bold text-text">{exp.title}</div>
                            <div className="text-sm text-primary">{exp.company}</div>
                          </div>
                          <div className="text-xs text-text-muted flex-shrink-0 ml-4">
                            {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                          </div>
                        </div>
                        <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!candidate.experience || candidate.experience.length === 0) && <p className="text-sm text-text-muted">No experience details available.</p>}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'resume' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13px] font-bold text-text">Resume Preview</div>
                {docs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{docs[0].fileName} ({formatBytes(docs[0].fileSizeBytes)})</span>
                    <Button variant="secondary" size="sm" icon={<Download size={12} />}>Download</Button>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 border border-border rounded-[8px] p-8 min-h-[500px] flex flex-col items-center justify-center">
                {candidate.resumeUrl ? (
                  <iframe src={candidate.resumeUrl} className="w-full h-[600px] rounded" title="Resume" />
                ) : docs.length > 0 ? (
                  <>
                    <div className="w-full max-w-md space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mx-auto" />
                      <div className="my-4 border-t border-gray-200" />
                      {[100, 85, 90, 70, 95, 80, 75, 88].map((w, i) => (
                        <div key={i} className="h-2.5 bg-gray-200 rounded animate-pulse" style={{ width: `${w}%` }} />
                      ))}
                      <div className="my-3 border-t border-gray-200" />
                      {[80, 75, 90, 65, 85].map((w, i) => (
                        <div key={i} className="h-2.5 bg-gray-200 rounded animate-pulse" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <Button variant="secondary" size="md" className="mt-8" icon={<FileText size={14} />}>View Full Screen</Button>
                  </>
                ) : (
                  <div className="text-sm text-text-muted">No resume uploaded yet.</div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedback.length === 0 && (
                <Card><div className="text-center py-10 text-sm text-text-muted">No feedback submitted yet for this candidate.</div></Card>
              )}
              {feedback.map((fb: any) => (
                <Card key={fb.id}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${fb.interviewer.firstName} ${fb.interviewer.lastName}`} size="sm" />
                      <div>
                        <div className="text-[13px] font-bold text-text">{`${fb.interviewer.firstName} ${fb.interviewer.lastName}`}</div>
                        <div className="text-xs text-text-muted">{new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={calculateOverallScore(fb.ratings)} />
                      <Badge className={
                        fb.recommendation.toLowerCase().includes('strong') ? 'bg-success-light text-success border border-success/20' :
                        fb.recommendation.toLowerCase().includes('yes') || fb.recommendation.toLowerCase().includes('hire') ? 'bg-indigo-light text-indigo border border-indigo/20' :
                        'bg-danger-light text-danger border border-danger/20'
                      }>
                        {fb.recommendation.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {fb.ratings?.map((r: any) => (
                      <ScoreBar key={r.attribute} score={r.rating} label={r.attribute} />
                    ))}
                  </div>
                  {fb.overallComments && <blockquote className="border-l-2 border-primary/30 pl-3 text-sm text-text-muted italic">"{fb.overallComments}"</blockquote>}
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <Card>
              <div className="text-[13px] font-bold text-text mb-4">Limited Activity View</div>
              <div className="space-y-4">
                {activity.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-gray-50 border border-border flex items-center justify-center flex-shrink-0">
                        {TYPE_ICON[item.type] || <Clock size={10} className="text-text-muted" />}
                      </div>
                      {idx < activity.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-semibold text-text">{item.title}</div>
                        <div className="text-xs text-text-muted">{item.ts}</div>
                      </div>
                      <div className="text-sm text-text-muted mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13px] font-bold text-text">Documents ({docs.length})</div>
                <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={() => setShowUploadModal(true)}>Upload</Button>
              </div>
              <div className="space-y-0">
                {docs.length === 0 && (
                  <div className="text-center py-8 text-sm text-text-muted">No documents uploaded yet.</div>
                )}
                {docs.map((doc: any) => {
                  const canDelete = user?.role === 'ADMIN' || doc.uploadedBy?.id === user?.id;
                  return (
                    <div key={doc.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                      <div className="w-9 h-9 bg-indigo-light rounded-[6px] flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-indigo" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-text">{doc.fileName}</div>
                        <div className="text-xs text-text-muted">
                          {doc.documentType} · {formatBytes(doc.fileSizeBytes)} · Uploaded {new Date(doc.createdAt).toLocaleDateString('en-US')}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" icon={<Download size={12} />}>Download</Button>
                      {canDelete && (
                        <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger-light" 
                          icon={<X size={12} />} 
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          loading={deleteDocumentMutation.isPending && deleteDocumentMutation.variables === doc.id}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <Card>
                <div className="text-[13px] font-bold text-text mb-4">Add Note</div>
                <textarea 
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full border border-border rounded-md p-3 text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-muted"
                  rows={3} 
                  placeholder="Add internal notes about this candidate..." 
                />
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newNoteIsPrivate} onChange={e => setNewNoteIsPrivate(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                    <span className="text-sm text-text">Private Note (Only you and Admins)</span>
                  </label>
                  <Button 
                    variant="primary" 
                    size="md" 
                    onClick={() => {
                      createNoteMutation.mutate({ content: newNoteContent, isPrivate: newNoteIsPrivate });
                      setNewNoteContent('');
                      setNewNoteIsPrivate(false);
                    }}
                    loading={createNoteMutation.isPending}
                    disabled={!newNoteContent.trim()}
                  >
                    Save Note
                  </Button>
                </div>
              </Card>

              <div className="space-y-3">
                {notesList.map((note: any) => {
                  const canEdit = user?.role === 'ADMIN' || note.createdBy?.id === user?.id;
                  const isEditing = editingNoteId === note.id;

                  return (
                    <Card key={note.id}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={`${note.createdBy?.firstName} ${note.createdBy?.lastName}`} size="sm" />
                          <div>
                            <div className="text-[13px] font-bold text-text flex items-center gap-2">
                              {`${note.createdBy?.firstName} ${note.createdBy?.lastName}`}
                              {note.isPrivate && <Badge className="bg-gray-100 text-text-muted text-[9px] py-0 border border-border">Private</Badge>}
                            </div>
                            <div className="text-xs text-text-muted">
                              {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              {note.updatedAt !== note.createdAt && ' (edited)'}
                            </div>
                          </div>
                        </div>
                        {canEdit && !isEditing && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" icon={<Edit2 size={12} />} onClick={() => {
                              setEditingNoteId(note.id);
                              setEditNoteContent(note.content);
                              setEditNoteIsPrivate(note.isPrivate);
                            }} />
                            <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-light hover:text-danger" icon={<X size={12} />} 
                              onClick={() => deleteNoteMutation.mutate(note.id)} 
                              loading={deleteNoteMutation.isPending && deleteNoteMutation.variables === note.id} 
                            />
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-3">
                          <textarea 
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            className="w-full border border-border rounded-md p-3 text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            rows={3} 
                          />
                          <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={editNoteIsPrivate} onChange={e => setEditNoteIsPrivate(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                              <span className="text-sm text-text">Private Note</span>
                            </label>
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                              <Button variant="primary" size="sm" 
                                onClick={() => {
                                  updateNoteMutation.mutate({ noteId: note.id, data: { content: editNoteContent, isPrivate: editNoteIsPrivate } });
                                  setEditingNoteId(null);
                                }}
                                disabled={!editNoteContent.trim()}
                                loading={updateNoteMutation.isPending && updateNoteMutation.variables?.noteId === note.id}
                              >Save</Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{note.content}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Current stage pipeline */}
          <Card>
            <div className="text-[13px] font-bold text-text mb-3">Pipeline Progress</div>
            <div className="space-y-1.5">
              {pipelineStages.map((s: PipelineStageResponse, idx: number) => {
                const stageIdx = pipelineStages.findIndex((ps: PipelineStageResponse) => ps.id === application?.currentStage?.id);
                const thisIdx = idx;
                const isPast = thisIdx < stageIdx;
                const isCurrent = thisIdx === stageIdx;
                return (
                  <div key={s.id} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${isCurrent ? 'bg-primary-light' : ''}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? 'bg-primary' : isPast ? 'bg-success' : 'bg-gray-200'
                    }`}>
                      {isPast && <CheckCircle2 size={10} className="text-white" />}
                      {isCurrent && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-[12px] font-medium ${isCurrent ? 'text-primary' : isPast ? 'text-success' : 'text-text-muted'}`}>
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Latest scorecard */}
          {feedback.length > 0 && (
            <Card>
              <div className="text-[13px] font-bold text-text mb-3">Latest Scorecard</div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Overall</div>
                  <div className="text-2xl font-bold text-text">{calculateOverallScore(feedback[0].ratings)} <span className="text-sm text-text-muted font-normal">/ 5</span></div>
                </div>
                <StarRating rating={calculateOverallScore(feedback[0].ratings)} />
              </div>
              {feedback[0].ratings?.map((r: any) => (
                <ScoreBar key={r.attribute} score={r.rating} label={r.attribute} />
              ))}
            </Card>
          )}

          {/* Active Interviews */}
          {activeInterviews.length > 0 && (
            <Card>
              <div className="text-[13px] font-bold text-text mb-3">Upcoming Interviews</div>
              <div className="space-y-3">
                {activeInterviews.map((interview: any) => (
                  <div key={interview.id} className="p-3 bg-gray-50 border border-border rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[13px] font-bold text-text">{interview.stage.name}</div>
                      <Badge className={interview.status === 'SCHEDULED' ? 'bg-indigo-light text-indigo' : 'bg-gray-100 text-text-muted'}>
                        {interview.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-text-muted flex items-center gap-1.5 mb-1">
                      <Calendar size={11} /> 
                      {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(interview.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                      <Clock size={11} /> {interview.durationMinutes} min
                    </div>
                    {interview.meetingLink && (
                      <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline mt-2 inline-flex items-center gap-1">
                        <Video size={11} /> Join Meeting
                      </a>
                    )}
                    {interview.status === 'SCHEDULED' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1 text-[10px] h-7"
                          onClick={() => cancelInterviewMutation.mutate(interview.id)}
                          loading={cancelInterviewMutation.isPending && cancelInterviewMutation.variables === interview.id}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-1 text-[10px] h-7"
                          onClick={() => completeInterviewMutation.mutate(interview.id)}
                          loading={completeInterviewMutation.isPending && completeInterviewMutation.variables === interview.id}
                        >
                          Complete
                        </Button>
                      </div>
                    )}
                    {interview.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full text-[10px] h-7"
                          onClick={() => setFeedbackInterviewId(interview.id)}
                        >
                          Add Feedback
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Activity mini */}
          <Card>
            <div className="text-[13px] font-bold text-text mb-3">Recent Activity</div>
            <div className="space-y-2.5">
              {activity.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded bg-gray-50 border border-border flex items-center justify-center flex-shrink-0">
                    {TYPE_ICON[item.type] || <Clock size={10} />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text">{item.title}</div>
                    <div className="text-[11px] text-text-muted">{item.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tags */}
          <Card>
            <div className="text-[13px] font-bold text-text mb-3">Internal Tags</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {candidate.tags && candidate.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 border border-dashed border-gray-300 text-xs text-text-muted rounded-md">{tag}</span>
              ))}
              {(!candidate.tags || candidate.tags.length === 0) && <span className="text-xs text-text-muted">No tags yet</span>}
            </div>
            <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors">
              <Tag size={11} /> Add Tag
            </button>
          </Card>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleInterviewModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          candidateName={candidateName}
          onSave={(data) => {
            scheduleInterviewMutation.mutate({
              applicationId: application!.id,
              stageId: application!.currentStage.id,
              ...data
            });
          }}
        />
      )}

      {feedbackInterviewId && (
        <SubmitFeedbackModal
          open={!!feedbackInterviewId}
          onClose={() => setFeedbackInterviewId(null)}
          interview={activeInterviews.find((i: any) => i.id === feedbackInterviewId)}
          onSave={(data) => submitFeedbackMutation.mutate(data)}
          submitting={submitFeedbackMutation.isPending}
        />
      )}

      {showUploadModal && (
        <UploadDocumentModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSave={(data) => {
            uploadDocumentMutation.mutate({ ...data, candidateId: id });
            setShowUploadModal(false);
          }}
          submitting={uploadDocumentMutation.isPending}
        />
      )}

      {/* Edit Candidate Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Candidate" subtitle="Update candidate details" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={updateCandidateMutation.isPending}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              updateCandidateMutation.mutate({
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                email: editForm.email,
                phone: editForm.phone,
                experienceYears: parseInt(editForm.experience) || 0,
                skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean)
              });
            }} disabled={!editForm.firstName || !editForm.lastName || !editForm.email} loading={updateCandidateMutation.isPending}>Save Changes</Button>
          </>
        }>
        <div className="space-y-4">
          {updateCandidateMutation.isError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">Failed to update candidate.</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">First Name *</label>
              <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Last Name *</label>
              <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Email *</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Phone Number</label>
              <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Years of Experience</label>
              <input type="number" value={editForm.experience} onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Skills (comma separated)</label>
            <input value={editForm.skills} onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
