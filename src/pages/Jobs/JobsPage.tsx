import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Eye, Edit, Archive, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { FilterButton } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { getJobStatusBadgeClass, formatDate } from '@/lib/utils';
import { jobsApi, CreateJobRequest } from '@/api/jobsApi';
import type { JobStatus } from '@/types';

import { notificationsApi } from '@/api/notificationsApi';
import { useAuth } from '@/contexts/AuthContext';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Operations', 'Marketing', 'Analytics'];
const LOCATIONS = ['San Francisco, CA', 'Remote', 'New York, NY', 'London, UK', 'Austin, TX', 'Seattle, WA', 'Chicago, IL'];
const STATUSES: JobStatus[] = ['ACTIVE', 'DRAFT', 'CLOSED', 'PAUSED'];

const STATUS_LABELS: Record<JobStatus, string> = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  CLOSED: 'Closed',
  PAUSED: 'Paused',
};

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  description: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function JobsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dept, setDept] = useState('all');
  const [loc, setLoc] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: { department: 'Engineering' }
  });

  const { data: jobsResponse, isLoading, isError } = useQuery({
    queryKey: ['jobs', { dept, loc, status, page }],
    queryFn: () => jobsApi.getJobs({
      department: dept !== 'all' ? dept : undefined,
      location: loc !== 'all' ? loc : undefined,
      status: status !== 'all' ? status : undefined,
      page: page - 1,
      size: 10,
    })
  });

  const { data: notificationsResponse } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getUserNotifications({ size: 5 }),
  });
  const recentActivity = notificationsResponse?.data?.content || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateJobRequest) => jobsApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setShowAddModal(false);
      reset();
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string, newStatus: JobStatus }) => jobsApi.updateJobStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });
  const { user } = useAuth();

  const onSubmitJob = (data: JobFormData) => {
    createMutation.mutate({
      title: data.title,
      department: data.department,
      location: data.location,
      remote: data.location.toLowerCase().includes('remote'),
      openings: 1,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryCurrency: 'USD',
      status: 'ACTIVE',
      description: data.description,
      hiringManagerId: user?.id,
    });
  };

  const jobs = jobsResponse?.data?.content || [];
  const totalPages = jobsResponse?.data?.totalPages || 1;
  const totalElements = jobsResponse?.data?.totalElements || 0;

  const exportCSV = () => {
    if (!jobs.length) return;
    const headers = ['Req ID', 'Title', 'Department', 'Location', 'Status', 'Applicants', 'Hiring Manager'];
    const rows = jobs.map(j => [
      `"${j.reqId}"`, `"${j.title}"`, `"${j.department}"`, `"${j.location}"`,
      `"${STATUS_LABELS[j.status]}"`, `"${j.applicantCount}"`, `"${j.hiringManagerName}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jobs_export.csv';
    link.click();
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg border border-red-100">
        <h3 className="font-semibold mb-2">Error loading jobs</h3>
        <p className="text-sm">Please try refreshing the page or check your connection.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-text">Jobs</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage your active job postings and recruitment pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={<Download size={14} />} onClick={exportCSV} disabled={isLoading || jobs.length === 0}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" icon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>
            Add Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <FilterButton label="Department" value={dept} options={DEPARTMENTS} onChange={setDept} />
        <FilterButton label="Location" value={loc} options={LOCATIONS} onChange={setLoc} />
        <FilterButton label="Status" value={status} options={STATUSES.map(s => STATUS_LABELS[s])} onChange={setStatus} />
        {(dept !== 'all' || loc !== 'all' || status !== 'all') && (
          <button
            onClick={() => { setDept('all'); setLoc('all'); setStatus('all'); setPage(1); }}
            className="text-xs text-primary hover:underline ml-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-[10px] shadow-card mb-4 overflow-hidden relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <div className="text-sm text-text-muted">Loading jobs...</div>
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Job Title</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Department</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Location</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Applicants</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Hiring Manager</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted uppercase tracking-wide">Created</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {!isLoading && jobs.map(job => (
              <tr
                key={job.id}
                className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors group"
              >
                <td className="px-5 py-3.5">
                  <div
                    className="font-medium text-sm text-text cursor-pointer hover:text-primary transition-colors"
                    onClick={() => navigate(`/pipeline?job=${job.id}`)}
                  >
                    {job.title}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5 font-mono">{job.reqId}</div>
                </td>
                <td className="px-4 py-3.5 text-sm text-text">{job.department}</td>
                <td className="px-4 py-3.5 text-sm text-text">{job.location}</td>
                <td className="px-4 py-3.5">
                  <Badge className={getJobStatusBadgeClass(job.status)}>
                    {STATUS_LABELS[job.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-sm font-semibold text-text">{job.applicantCount}</span>
                </td>
                <td className="px-4 py-3.5 text-sm text-text">{job.hiringManagerName}</td>
                <td className="px-4 py-3.5 text-sm text-text-muted">{formatDate(job.createdAt)}</td>
                <td className="px-4 py-3.5">
                  <Dropdown
                    trigger={
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-100 text-text-muted transition-all">
                        <MoreVertical size={15} />
                      </button>
                    }
                    items={[
                      { label: 'View Pipeline', icon: <Eye size={14} />, onClick: () => navigate(`/pipeline?job=${job.id}`) },
                      { label: 'Mark as Closed', icon: <Archive size={14} />, onClick: () => statusMutation.mutate({ id: job.id, newStatus: 'CLOSED' }) },
                    ]}
                    width={160}
                  />
                </td>
              </tr>
            ))}
            {!isLoading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="text-sm text-text-muted mb-2">No jobs found matching the selected filters.</div>
                  <Button variant="secondary" size="sm" onClick={() => { setDept('all'); setLoc('all'); setStatus('all'); }}>Clear Filters</Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-gray-50/30">
          <div className="text-xs text-text-muted">
            Showing {Math.min((page - 1) * 10 + 1, totalElements)} to {Math.min(page * 10, totalElements)} of {totalElements} jobs
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={isLoading}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page ? 'bg-primary text-white' : 'text-text hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || isLoading}
              className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Chart + Activity */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7 !p-5">
          <div className="text-[15px] font-semibold text-text mb-4">Recruitment Velocity</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'Week 1', velocity: 12 },
                { name: 'Week 2', velocity: 15 },
                { name: 'Week 3', velocity: 22 },
                { name: 'Week 4', velocity: 19 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                <Line type="monotone" dataKey="velocity" name="New Candidates" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#FFF' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-5 !p-5">
          <div className="text-[15px] font-semibold text-text mb-4">Recent Activity</div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-4">No recent activity</div>
            ) : (
              recentActivity.map((n: any) => (
                <div key={n.id} onClick={() => n.referenceId && navigate(`/candidates/${n.referenceId}`)} className="flex items-start gap-2.5 hover:bg-gray-50 p-2 -mx-2 rounded-lg cursor-pointer transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-primary'}`} />
                  <div>
                    <div className="text-sm text-text line-clamp-2">{n.message}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Add Job Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Job"
        subtitle="Fill in the details to post a new job opening"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={createMutation.isPending}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmitJob)} loading={createMutation.isPending}>Create Job</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text mb-1.5">Job Title</label>
              <input {...register('title')} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Senior Software Engineer" />
              {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Department</label>
              <select {...register('department')} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Location</label>
              <input {...register('location')} className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="City, State or Remote" />
              {errors.location && <span className="text-xs text-red-500 mt-1">{errors.location.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Min Salary (USD)</label>
              <input {...register('salaryMin')} type="number" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="120000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Max Salary (USD)</label>
              <input {...register('salaryMax')} type="number" className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="160000" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text mb-1.5">Job Description</label>
              <textarea {...register('description')} className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={4} placeholder="Describe the role, responsibilities, and requirements..." />
            </div>
          </div>
          {createMutation.isError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
              Failed to create job. Please ensure you have the correct permissions.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
