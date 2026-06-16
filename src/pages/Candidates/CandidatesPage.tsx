import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, UserPlus, FileCheck, FileClock, Download, Upload, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FilterButton } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { getStageLabel, getStageBadgeClass } from '@/lib/utils';
import { candidatesApi, CreateCandidateRequest } from '@/api/candidatesApi';
import { jobsApi } from '@/api/jobsApi';
import { applicationsApi } from '@/api/applicationsApi';
import type { CandidateStage, Candidate } from '@/types';

const STAGE_OPTIONS: { value: CandidateStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'technical', label: 'Technical' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr_round', label: 'HR Round' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const EXP_OPTIONS = ['Junior (0-2y)', 'Mid-Level (3-5y)', 'Senior (6-9y)', 'Lead (10y+)'];
const EXP_MAP: Record<string, number> = {
  'Junior (0-2y)': 0,
  'Mid-Level (3-5y)': 3,
  'Senior (6-9y)': 6,
  'Lead (10y+)': 10
};

function MatchScore({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-xs text-text-muted">—</span>;
  const color = score >= 85 ? 'text-success font-bold' : score >= 70 ? 'text-indigo font-semibold' : score >= 55 ? 'text-warning-dark font-medium' : 'text-danger font-medium';
  const bgColor = score >= 85 ? 'bg-success-light' : score >= 70 ? 'bg-indigo-light' : score >= 55 ? 'bg-warning-light' : 'bg-danger-light';
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs ${color} ${bgColor}`}>
      {score >= 85 && <span className="text-[10px]">★</span>}
      {score}%
    </div>
  );
}

function ResumeStatus({ status, url }: { status?: string; url?: string }) {
  if (!url && !status) return <span className="text-xs text-text-muted">—</span>;
  
  const content = url ? (
    <a href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
      <FileCheck size={12} /> View Resume
    </a>
  ) : (
    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-warning-dark bg-warning-light">
      <FileClock size={12} /> Pending
    </div>
  );

  return content;
}

export default function CandidatesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const qSearch = queryParams.get('q') || '';

  const [search, setSearch] = useState(qSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(qSearch);
  const [stage, setStage] = useState<CandidateStage | 'all'>('all');
  const [exp, setExp] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Candidate Form
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', experience: '', role: '', skills: '', resume: null as File | null });
  const [showBulkAction, setShowBulkAction] = useState(false);

  useEffect(() => {
    if (qSearch) {
      setSearch(qSearch);
      setDebouncedSearch(qSearch);
    }
  }, [qSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: candidatesResponse, isLoading, isError } = useQuery({
    queryKey: ['candidates', { search: debouncedSearch, stage, exp, page }],
    queryFn: () => candidatesApi.getCandidates({
      search: debouncedSearch || undefined,
      stage: stage !== 'all' ? stage : undefined,
      experience: exp ? EXP_MAP[exp] : undefined,
      page: page - 1,
      size: 20
    })
  });

  const { data: activeJobsResponse } = useQuery({
    queryKey: ['jobs', 'active-list'],
    queryFn: () => jobsApi.getJobs({ status: 'ACTIVE', size: 100 })
  });

  const activeJobs = activeJobsResponse?.data?.content || [];
  const candidates = candidatesResponse?.data?.content || [];
  const totalPages = candidatesResponse?.data?.totalPages || 1;
  const totalElements = candidatesResponse?.data?.totalElements || 0;

  const createAppMutation = useMutation({
    mutationFn: (data: { candidateId: string; jobId: string }) => applicationsApi.createApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', experience: '', role: '', skills: '', resume: null });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCandidateRequest) => candidatesApi.createCandidate(data),
    onSuccess: async (response, variables) => {
      const selectedJob = activeJobs.find(j => j.title === variables.appliedRole);
      
      // If we have a resume file, upload it before invalidating queries
      if (response.data && addForm.resume) {
        try {
          await candidatesApi.uploadResume(response.data.id, addForm.resume);
        } catch (e) {
          console.error("Resume upload failed", e);
        }
      }

      if (selectedJob && response.data) {
        createAppMutation.mutate({
          candidateId: response.data.id,
          jobId: selectedJob.id
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['candidates'] });
        setShowAddModal(false);
        setAddForm({ name: '', email: '', phone: '', experience: '', role: '', skills: '', resume: null });
      }
    }
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  
  const allSelected = candidates.length > 0 && candidates.every((c: any) => selected.has(c.id));

  const exportCSV = () => {
    if (!candidates.length) return;
    const headers = ['Name', 'Email', 'Role', 'Stage', 'Experience', 'Match Score', 'Location'];
    const rows = candidates.map((c: any) => [
      `"${c.name}"`, `"${c.email}"`, `"${c.appliedRole}"`, `"${c.currentStage}"`,
      `"${c.yearsOfExperience}y"`, `"${c.matchScore || ''}%"`, `"${c.location}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'candidates_export.csv';
    link.click();
  };

  const handleAddCandidate = () => {
    const selectedJob = activeJobs.find(j => j.title === addForm.role);
    // Even if no job selected, create candidate
    createMutation.mutate({
      name: addForm.name,
      email: addForm.email,
      phone: addForm.phone,
      yearsOfExperience: parseInt(addForm.experience) || 0,
      appliedRole: selectedJob ? selectedJob.title : addForm.role,
      appliedJobId: selectedJob?.id,
      skills: addForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      location: 'Remote',
      source: 'CAREER_SITE'
    } as any); // using as any since we might be mapping to backend fields like firstName, lastName inside createCandidate depending on api
  };

  const handleBulkReject = () => {
    console.warn("Bulk Reject must be handled in Pipeline/Applications module");
    setSelected(new Set());
    setShowBulkAction(false);
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-100">
        <h3 className="font-semibold mb-2">Error loading candidates</h3>
        <p className="text-sm">Please try refreshing the page or check your connection.</p>
      </div>
    );
  }

  const isSaving = createMutation.isPending || createAppMutation.isPending;

  return (
    <div className="max-w-[1440px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text tracking-tight">Candidates</h1>
          <p className="text-sm text-text-muted mt-0.5">
            <strong>{totalElements.toLocaleString()}</strong> total candidates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={<Download size={14} />} onClick={exportCSV} disabled={isLoading || candidates.length === 0}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" icon={<UserPlus size={14} />} onClick={() => setShowAddModal(true)}>
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Name, email, skill, location..."
            className="h-8 pl-8 pr-3 text-sm border border-border rounded-md bg-white w-60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-text-muted transition-colors"
          />
        </div>
        <FilterButton
          label="Stage"
          value={stage === 'all' ? undefined : STAGE_OPTIONS.find(s => s.value === stage)?.label}
          options={STAGE_OPTIONS.filter(s => s.value !== 'all').map(s => s.label)}
          onChange={val => {
            const found = STAGE_OPTIONS.find(s => s.label === val);
            if (found) { setStage(found.value); setPage(1); }
          }}
        />
        <FilterButton label="Experience" value={exp || undefined} options={EXP_OPTIONS} onChange={(val) => { setExp(val); setPage(1); }} />
        {(search || stage !== 'all' || exp) && (
          <button onClick={() => { setSearch(''); setStage('all'); setExp(''); setPage(1); navigate('/candidates', { replace: true }); }} className="text-xs text-primary hover:underline">
            Clear all
          </button>
        )}
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 relative">
            <span className="text-sm text-text-muted">{selected.size} selected</span>
            <Button variant="secondary" size="sm" onClick={() => setShowBulkAction(!showBulkAction)}>
              Bulk Action
            </Button>
            {showBulkAction && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-border rounded-[8px] shadow-dropdown z-50 py-1">
                <button onClick={handleBulkReject} className="w-full text-left px-3 py-2 text-sm text-text hover:bg-gray-50 hover:text-danger transition-colors">
                  Reject Selected
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-card shadow-card overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <div className="text-sm text-text-muted">Loading candidates...</div>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-border">
              <th className="px-4 py-2.5 w-9">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => {
                    if (e.target.checked) setSelected(new Set([...selected, ...candidates.map((c: any) => c.id)]));
                    else {
                      const next = new Set(selected);
                      candidates.forEach((c: any) => next.delete(c.id));
                      setSelected(next);
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Candidate</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Location</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Match</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Expected</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Skills</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Stage</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Resume</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && candidates.map((candidate: any) => (
              <tr
                key={candidate.id}
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(candidate.id); }}>
                  <input type="checkbox" checked={selected.has(candidate.id)} onChange={() => {}} className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={candidate.name || `${candidate.firstName} ${candidate.lastName}`} size="sm" />
                    <div>
                      <div className="text-[13px] font-semibold text-text group-hover:text-primary transition-colors">{candidate.name || `${candidate.firstName} ${candidate.lastName}`}</div>
                      <div className="text-[11px] text-text-muted">{candidate.level} · {candidate.currentCompany || candidate.appliedRole?.split(' ').slice(0, 2).join(' ')}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[12px] text-text">{candidate.location?.split(' (')[0] || 'Unknown'}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <MatchScore score={candidate.matchScore} />
                </td>
                <td className="px-4 py-3">
                  <div className="text-[12px] font-medium text-text">{candidate.expectedSalaryMin ? `$${candidate.expectedSalaryMin.toLocaleString()}` : '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills && candidate.skills.slice(0, 2).map((skill: string) => (
                      <span key={skill} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                        {skill.length > 9 ? skill.slice(0, 9) : skill}
                      </span>
                    ))}
                    {candidate.skills && candidate.skills.length > 2 && (
                      <span className="text-[10px] text-text-muted">+{candidate.skills.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge dot className={getStageBadgeClass(candidate.currentStage || 'applied')}>
                    {getStageLabel(candidate.currentStage || 'applied')}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <ResumeStatus status={candidate.resumeStatus} url={candidate.resumeUrl} />
                </td>
                <td className="px-4 py-3 text-[12px] text-text-muted">{candidate.lastActivity || 'Just now'}</td>
              </tr>
            ))}
            {!isLoading && candidates.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="text-sm text-text-muted mb-2">No candidates match the selected criteria.</div>
                  <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStage('all'); setExp(''); setPage(1); navigate('/candidates', { replace: true }); }}>Clear Filters</Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gray-50/30">
          <div className="text-xs text-text-muted">
            Showing <strong>{Math.min((page - 1) * 20 + 1, totalElements || 0)}</strong>–<strong>{Math.min(page * 20, totalElements)}</strong> of <strong>{totalElements}</strong> candidates
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}
              className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages || 1, 5) }, (_, i) => {
              const p = Math.max(1, page > 3 ? page - 2 + i : i + 1);
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} disabled={isLoading}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'text-text hover:bg-gray-100'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}
              className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Candidate Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Candidate" subtitle="Manually enter a new candidate into the system" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isSaving}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCandidate} disabled={!addForm.name || !addForm.email || !addForm.role} loading={isSaving}>
              {createAppMutation.isPending ? 'Creating Application...' : createMutation.isPending ? 'Creating Candidate...' : 'Add Candidate'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          {(createMutation.isError || createAppMutation.isError) && (
             <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
               Failed to create candidate or application.
             </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Full Name *</label>
              <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Email *</label>
              <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Phone Number</label>
              <input type="tel" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Years of Experience</label>
              <input type="number" value={addForm.experience} onChange={e => setAddForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. 5" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Applied Job *</label>
            <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="w-full h-9 px-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text">
              <option value="" disabled>Select a role...</option>
              {activeJobs.map(j => <option key={j.id} value={j.title}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Skills (comma separated)</label>
            <input value={addForm.skills} onChange={e => setAddForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, TypeScript, Node.js" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Resume Upload</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAddForm(f => ({ ...f, resume: e.target.files![0] }));
                  }
                }}
              />
              <label
                htmlFor="resume-upload"
                className="flex items-center gap-2 h-9 px-4 text-sm font-medium border border-border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload size={14} className="text-text-muted" />
                {addForm.resume ? addForm.resume.name : 'Choose File'}
              </label>
              {addForm.resume && (
                <button
                  type="button"
                  onClick={() => setAddForm(f => ({ ...f, resume: null }))}
                  className="text-xs text-danger hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
