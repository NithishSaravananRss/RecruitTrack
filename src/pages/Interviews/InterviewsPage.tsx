import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Phone, Users, Clock, ExternalLink, ChevronLeft, ChevronRight, Plus, X, Download } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import type { InterviewType, FeedbackStatus } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/api/interviewsApi';
import { Loader2 } from 'lucide-react';
const TYPE_ICON: Record<InterviewType, React.ReactNode> = {
  phone: <Phone size={12} />,
  video: <Video size={12} />,
  technical: <Calendar size={12} />,
  behavioral: <Users size={12} />,
  panel: <Users size={12} />,
};

const TYPE_LABEL: Record<InterviewType, string> = {
  phone: 'Phone Screen',
  video: 'Video Call',
  technical: 'Technical',
  behavioral: 'Behavioral',
  panel: 'Panel',
};

const TYPE_COLORS: Record<InterviewType, string> = {
  phone: '#D97706',
  video: '#2563EB',
  technical: '#7C3AED',
  behavioral: '#0F766E',
  panel: '#DC2626',
};

function FeedbackBadge({ status }: { status: FeedbackStatus }) {
  if (status === 'submitted') return <Badge className="bg-success-light text-success border border-success/20 text-[10px]" dot>Submitted</Badge>;
  if (status === 'pending') return <Badge className="bg-warning-light text-warning-dark border border-warning/20 text-[10px]" dot>Pending</Badge>;
  return <Badge className="bg-gray-100 text-gray-500 text-[10px]">Waived</Badge>;
}

// ── Calendar helpers ────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18];

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// ScheduleModal removed as scheduling is now done per application from Candidate Profile

export default function InterviewsPage() {
  const navigate = useNavigate();
  // Start on the week of June 3, 2026
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const weekDays = getWeekDays(currentDate);

  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => interviewsApi.getAllInterviews(),
  });

  const allInterviews = data?.data?.content || [];

  const getInterviewsForDay = (date: Date) =>
    allInterviews.filter((i: any) => {
      const d = new Date(i.scheduledAt);
      return d.toDateString() === date.toDateString();
    });

  const todayStr = new Date().toDateString(); // June 3, 2026

  const exportCSV = () => {
    const headers = ['Candidate', 'Job', 'Type', 'Scheduled At', 'Duration (min)', 'Status'];
    const rows = allInterviews.map((i: any) => [
      `"${i.application.candidate ? `${i.application.candidate.firstName || ''} ${i.application.candidate.lastName || ''}`.trim() : 'Unknown Candidate'}"`, `"${i.application.job.title}"`, `"${TYPE_LABEL[i.type as InterviewType] || 'Interview'}"`,
      `"${new Date(i.scheduledAt).toLocaleString()}"`, `"${i.durationMinutes}"`, `"${i.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'interviews_export.csv';
    link.click();
  };

  return (
    <div className="max-w-[1440px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text tracking-tight">Interviews</h1>
          <p className="text-sm text-text-muted mt-0.5">{allInterviews.length} interviews scheduled</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={<Download size={14} />} onClick={exportCSV}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={14} />}
            onClick={() => alert('Please navigate to a Candidate Profile to schedule an interview for their application.')}
          >
            Schedule Interview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Calendar */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
            {/* Nav bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={15} className="text-text-muted" />
                </button>
                <h2 className="text-[14px] font-bold text-text">
                  {MONTH_NAMES[weekDays[0].getMonth()]} {weekDays[0].getDate()}–{weekDays[6].getDate()}, {weekDays[6].getFullYear()}
                </h2>
                <button
                  onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={15} className="text-text-muted" />
                </button>
              </div>
              <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold text-primary hover:text-primary-hover">
                Today
              </button>
            </div>

            {/* Day headers */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              <div className="border-r border-border" />
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === todayStr;
                const count = getInterviewsForDay(day).length;
                return (
                  <div key={i} className="py-2.5 text-center border-r border-border last:border-0">
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{DAY_NAMES[day.getDay()]}</div>
                    <div className={`text-[15px] font-bold mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors ${
                      isToday ? 'bg-primary text-white' : 'text-text'
                    }`}>
                      {day.getDate()}
                    </div>
                    {count > 0 && (
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <div key={j} className="w-1 h-1 rounded-full bg-primary/60" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-gray-50 last:border-0" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
                  <div className="py-3 px-2 text-[10px] text-text-muted text-right border-r border-border leading-none font-medium">
                    {hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`}
                  </div>
                  {weekDays.map((day, di) => {
                    const interviews = getInterviewsForDay(day).filter((i: any) => new Date(i.scheduledAt).getHours() === hour);
                    return (
                      <div key={di} className="min-h-[56px] border-r border-border/40 last:border-0 p-0.5 relative">
                        {interviews.map((interview: any) => (
                          <div
                            key={interview.id}
                            onClick={() => navigate(`/candidates/${interview.application.candidate.id}`)}
                            className="absolute inset-x-0.5 top-0.5 rounded-[5px] px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity text-white"
                            style={{
                              background: TYPE_COLORS[interview.type as InterviewType] || '#D97706',
                              minHeight: 44,
                            }}
                          >
                            <div className="text-[10px] font-bold leading-tight truncate">{interview.application.candidate?.firstName || 'Unknown'}</div>
                            <div className="text-[9px] opacity-80 leading-tight">{TYPE_LABEL[interview.type as InterviewType] || 'Interview'}</div>
                            <div className="text-[9px] opacity-70">{interview.durationMinutes}min</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — all upcoming */}
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader title="Scheduled Interviews" subtitle="All Upcoming" />
            <div className="space-y-3 mt-2">
              {allInterviews.map((interview: any) => (
                <div
                  key={interview.id}
                  onClick={() => navigate(`/candidates/${interview.application.candidate.id}`)}
                  className="p-3 border border-border rounded-[8px] hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <Avatar name={interview.application.candidate ? `${interview.application.candidate.firstName || ''} ${interview.application.candidate.lastName || ''}`.trim() : 'Unknown'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-text group-hover:text-primary transition-colors truncate">
                        {interview.application.candidate ? `${interview.application.candidate.firstName || ''} ${interview.application.candidate.lastName || ''}`.trim() : 'Unknown Candidate'}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">{interview.application.job.title}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                      <span style={{ color: TYPE_COLORS[interview.type as InterviewType] || '#D97706' }}>{TYPE_ICON[interview.type as InterviewType] || <Calendar size={12} />}</span>
                      {TYPE_LABEL[interview.type as InterviewType] || 'Interview'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                      <Clock size={11} className="flex-shrink-0" />
                      {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                      {new Date(interview.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' '}· {interview.durationMinutes}min
                    </div>
                    {interview.meetingLink && (
                      <div className="flex items-center gap-1.5 text-[11px] text-primary">
                        <ExternalLink size={10} />
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="hover:underline truncate"
                        >
                          {interview.meetingLink.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <Badge className={interview.status === 'SCHEDULED' ? 'bg-indigo-light text-indigo' : 'bg-gray-100 text-text-muted'}>
                      {interview.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {!isLoading && allInterviews.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-sm text-text-muted mb-2">No interviews found in the selected date range.</div>
                  <Button variant="secondary" size="sm" onClick={() => { navigate('/interviews', { replace: true }); }}>Clear Filters</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
