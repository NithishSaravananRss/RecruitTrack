import React from 'react';
import { Clock, UserCheck, Calendar, FileText, Star, ArrowRight, Shield } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
  timestamp: string;
  type: 'stage_change' | 'interview' | 'feedback' | 'permission' | 'offer' | 'hire' | 'note';
}

const EVENT_CONFIG: Record<AuditEvent['type'], { icon: React.ReactNode; color: string; bg: string }> = {
  stage_change: { icon: <ArrowRight size={12} />, color: '#4F46E5', bg: '#EEF2FF' },
  interview: { icon: <Calendar size={12} />, color: '#0F766E', bg: '#F0FDFA' },
  feedback: { icon: <Star size={12} />, color: '#D97706', bg: '#FFFBEB' },
  permission: { icon: <Shield size={12} />, color: '#7C3AED', bg: '#F5F3FF' },
  offer: { icon: <FileText size={12} />, color: '#2563EB', bg: '#EFF6FF' },
  hire: { icon: <UserCheck size={12} />, color: '#16A34A', bg: '#F0FDF4' },
  note: { icon: <FileText size={12} />, color: '#6B7280', bg: '#F9FAFB' },
};

const AUDIT_LOG: { date: string; events: AuditEvent[] }[] = [
  {
    date: 'Today — June 3, 2026',
    events: [
      { id: 'al1', actor: 'Sarah Johnson', action: 'moved', target: 'Alex Rivera', detail: 'Screening → Technical Interview', timestamp: '7:42 PM', type: 'stage_change' },
      { id: 'al2', actor: 'Sarah Johnson', action: 'scheduled interview', target: 'Alex Rivera', detail: 'Technical · Jun 4, 10:15 AM · 60 min', timestamp: '7:41 PM', type: 'interview' },
      { id: 'al3', actor: 'Priya Mehta', action: 'submitted feedback', target: 'Sarah Chen', detail: 'Recommendation: Yes · 4.0/5 overall', timestamp: '2:30 PM', type: 'feedback' },
      { id: 'al4', actor: 'Sarah Johnson', action: 'submitted feedback', target: 'Marcus Thompson', detail: 'Recommendation: Strong Yes · 5.0/5', timestamp: '9:30 AM', type: 'feedback' },
    ],
  },
  {
    date: 'Yesterday — June 2, 2026',
    events: [
      { id: 'al5', actor: 'Admin User', action: 'changed role', target: 'Tom Bradley', detail: 'Hiring Manager → Recruiter', timestamp: '4:15 PM', type: 'permission' },
      { id: 'al6', actor: 'Sarah Johnson', action: 'moved', target: 'Priya Sharma', detail: 'Technical Interview → HR Round', timestamp: '3:00 PM', type: 'stage_change' },
      { id: 'al7', actor: 'Marcus Chen', action: 'generated offer', target: 'Sarah Chen', detail: 'Senior UX Designer · $120,000/year', timestamp: '11:00 AM', type: 'offer' },
    ],
  },
  {
    date: 'June 1, 2026',
    events: [
      { id: 'al8', actor: 'Admin User', action: 'marked hired', target: 'David Kim', detail: 'Senior Software Engineer · Start: Jul 14, 2026', timestamp: '5:45 PM', type: 'hire' },
      { id: 'al9', actor: 'Sarah Johnson', action: 'moved', target: 'David Kim', detail: 'Offer → Hired', timestamp: '5:44 PM', type: 'stage_change' },
      { id: 'al10', actor: 'Sarah Johnson', action: 'scheduled interview', target: 'Elena Vance', detail: 'Panel · Jun 5, 11:00 AM · 90 min', timestamp: '2:00 PM', type: 'interview' },
      { id: 'al11', actor: 'Admin User', action: 'updated security settings', detail: '2FA policy changed to: Required', timestamp: '10:30 AM', type: 'permission' },
    ],
  },
  {
    date: 'May 30, 2026',
    events: [
      { id: 'al12', actor: 'Jane Doe', action: 'moved', target: 'Alex Rivera', detail: 'Applied → Screening', timestamp: '3:20 PM', type: 'stage_change' },
      { id: 'al13', actor: 'Jane Doe', action: 'added note', target: 'Alex Rivera', detail: 'Strong referral from Sarah J. Prioritize.', timestamp: '3:18 PM', type: 'note' },
      { id: 'al14', actor: 'Sarah Johnson', action: 'invited team member', target: 'Tom Bradley', detail: 'Role: Recruiter · People Ops', timestamp: '10:00 AM', type: 'permission' },
    ],
  },
];

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = React.useState('All Actions');
  const [memberFilter, setMemberFilter] = React.useState('All Members');
  const [dateFilter, setDateFilter] = React.useState('Last 7 days');

  const isFilteredEmpty = actionFilter !== 'All Actions' || memberFilter !== 'All Members' || dateFilter !== 'Last 7 days';

  return (
    <div className="max-w-[800px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-text tracking-tight">Audit Log</h1>
        <p className="text-sm text-text-muted mt-0.5">
          A complete, immutable history of all actions taken in your workspace
        </p>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-6">
        <select 
          value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="h-8 px-3 text-sm border border-border rounded-md bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>All Actions</option>
          <option>Stage Changes</option>
          <option>Interviews</option>
          <option>Feedback</option>
          <option>Permissions</option>
          <option>Offers & Hires</option>
        </select>
        <select 
          value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}
          className="h-8 px-3 text-sm border border-border rounded-md bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>All Members</option>
          <option>Jane Doe</option>
          <option>Marcus Chen</option>
          <option>Sarah Johnson</option>
          <option>Admin User</option>
          <option>Priya Mehta</option>
        </select>
        <select 
          value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="h-8 px-3 text-sm border border-border rounded-md bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
        {isFilteredEmpty && (
          <button 
            onClick={() => { setActionFilter('All Actions'); setMemberFilter('All Members'); setDateFilter('Last 7 days'); }}
            className="text-xs text-primary hover:underline ml-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {isFilteredEmpty ? (
          <div className="py-20 text-center bg-white border border-border rounded-card">
            <div className="text-sm text-text-muted mb-2">No audit records found for the selected filters.</div>
          </div>
        ) : (
          AUDIT_LOG.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{group.date}</div>
                <div className="flex-1 h-px bg-border" />
                <div className="text-[10px] font-semibold text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">{group.events.length} events</div>
              </div>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {group.events.map(event => {
                    const cfg = EVENT_CONFIG[event.type];
                    return (
                      <div key={event.id} className="flex gap-4 group">
                        {/* Icon */}
                        <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                          style={{ background: cfg.bg }}>
                          <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 bg-white border border-border rounded-card p-3.5 shadow-card hover:shadow-card-hover transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Avatar name={event.actor} size="xs" />
                              <span className="text-[13px] font-semibold text-text">{event.actor}</span>
                              <span className="text-[13px] text-text-muted">{event.action}</span>
                              {event.target && (
                                <span className="text-[13px] font-semibold text-primary">{event.target}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 text-[11px] text-text-muted">
                              <Clock size={10} />
                              {event.timestamp}
                            </div>
                          </div>
                          {event.detail && (
                            <div className="mt-1.5 text-[12px] text-text-muted pl-7">{event.detail}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {!isFilteredEmpty && (
        <div className="text-center mt-8">
          <button className="text-sm text-text-muted hover:text-text border border-border px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
            Load older events
          </button>
        </div>
      )}
    </div>
  );
}
