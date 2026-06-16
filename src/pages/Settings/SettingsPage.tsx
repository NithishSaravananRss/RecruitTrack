import React, { useState, useMemo } from 'react';
import {
  Users, Bell, Lock, Database, Webhook, CreditCard, Building2,
  Search, Plus, Edit2, Check, X, ChevronRight, Key, Globe, Shield,
  Calendar, Video, CheckCircle2, AlertCircle, Clock,
  RefreshCw, Download, Copy,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';

// ─── Types ───────────────────────────────────────────
type SettingsSection =
  | 'workspace'
  | 'team'
  | 'notifications'
  | 'security'
  | 'integrations'
  | 'webhooks'
  | 'billing';

interface TeamMember {
  id: string; name: string; email: string;
  role: 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER'; department: string; joinedAt: string;
}

// ─── Mock Team Data ───────────────────────────────────
const initialTeam: TeamMember[] = [
  { id: 'u1', name: 'Jane Doe', email: 'jane.doe@recruittrack.io', role: 'RECRUITER', department: 'People Ops', joinedAt: 'Jan 12, 2026' },
  { id: 'u2', name: 'Marcus Chen', email: 'marcus.chen@recruittrack.io', role: 'HIRING_MANAGER', department: 'Engineering', joinedAt: 'Feb 3, 2026' },
  { id: 'u3', name: 'Sarah Johnson', email: 's.johnson@recruittrack.io', role: 'RECRUITER', department: 'People Ops', joinedAt: 'Mar 8, 2026' },
  { id: 'u4', name: 'Admin User', email: 'admin@recruittrack.io', role: 'ADMIN', department: 'Operations', joinedAt: 'Jan 2, 2026' },
  { id: 'u5', name: 'Priya Mehta', email: 'p.mehta@recruittrack.io', role: 'HIRING_MANAGER', department: 'Design', joinedAt: 'Apr 15, 2026' },
  { id: 'u6', name: 'Tom Bradley', email: 't.bradley@recruittrack.io', role: 'RECRUITER', department: 'People Ops', joinedAt: 'May 1, 2026' },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator', recruiter: 'Recruiter', hiring_manager: 'Hiring Manager',
};
const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-light text-purple border border-purple/20',
  recruiter: 'bg-primary-light text-primary border border-primary/20',
  hiring_manager: 'bg-teal-light text-teal border border-teal/20',
};

// ─── Sidebar nav ────────────────────────────────────────
const NAV: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
  { id: 'workspace', label: 'Workspace', icon: <Building2 size={15} /> },
  { id: 'team', label: 'Team Members', icon: <Users size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'security', label: 'Security & SSO', icon: <Lock size={15} /> },
  { id: 'integrations', label: 'Integrations', icon: <Database size={15} /> },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={15} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
];

// ─── Section: Workspace ────────────────────────────────
function WorkspaceSection() {
  const [form, setForm] = useState({
    workspace: 'RecruitTrack Demo', company: 'RecruitTrack Inc',
    domain: 'recruittrack.io', timezone: 'UTC-5 (Eastern Time)', currency: 'USD',
  });
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[16px] font-bold text-text">Workspace Settings</h2>
        <p className="text-sm text-text-muted mt-0.5">Configure your organization's workspace preferences</p>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-5">
          {[
            { key: 'workspace', label: 'Workspace Name' },
            { key: 'company', label: 'Company Name' },
            { key: 'domain', label: 'Company Domain' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text"
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Timezone</label>
            <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-text">
              <option>UTC-8 (Pacific Time)</option>
              <option>UTC-7 (Mountain Time)</option>
              <option>UTC-6 (Central Time)</option>
              <option>UTC-5 (Eastern Time)</option>
              <option>UTC+0 (UTC)</option>
              <option>UTC+5:30 (IST)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Default Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-text">
              <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>CAD</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Plan</label>
            <div className="h-9 px-3 flex items-center gap-2 text-sm font-semibold text-success bg-success-light border border-success/20 rounded-md">
              <CheckCircle2 size={14} /> Enterprise Premium · 20 seats
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button variant="primary" onClick={save}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Team Members ──────────────────────────────
function TeamSection() {
  const [team, setTeam] = useState(initialTeam);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<TeamMember | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'RECRUITER' as TeamMember['role'] });
  const [editRole, setEditRole] = useState<TeamMember['role']>('RECRUITER');

  const filtered = team.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const saveEdit = () => {
    if (!editUser) return;
    setTeam(prev => prev.map(m => m.id === editUser.id ? { ...m, role: editRole } : m));
    setEditUser(null);
  };

  const sendInvite = () => {
    if (!inviteForm.name || !inviteForm.email) return;
    const newMember: TeamMember = {
      id: `u${Date.now()}`, name: inviteForm.name, email: inviteForm.email,
      role: inviteForm.role, department: 'Pending', joinedAt: 'Jun 3, 2026',
    };
    setTeam(prev => [...prev, newMember]);
    setInviteForm({ name: '', email: '', role: 'RECRUITER' });
    setShowInvite(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-text">Team Members</h2>
          <p className="text-sm text-text-muted mt-0.5">{team.length} members in your workspace</p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={13} />} onClick={() => setShowInvite(true)}>
          Invite User
        </Button>
      </div>

      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team members..."
          className="w-full h-9 pl-8 pr-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-5 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">Joined</th>
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => (
              <tr key={member.id} className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={member.name} size="sm" />
                    <div>
                      <div className="text-[13px] font-semibold text-text">{member.name}</div>
                      <div className="text-[11px] text-text-muted">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={ROLE_BADGE[member.role]}>{ROLE_LABEL[member.role]}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-text">{member.department}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{member.joinedAt}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setEditUser(member); setEditRole(member.role); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-100 text-text-muted transition-all">
                    <Edit2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit Team Member"
        subtitle="Update role and permissions for this member" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveEdit}>Save Changes</Button>
          </>
        }
      >
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[8px]">
              <Avatar name={editUser.name} size="md" />
              <div>
                <div className="text-sm font-semibold text-text">{editUser.name}</div>
                <div className="text-xs text-text-muted">{editUser.email}</div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Role</label>
              <div className="space-y-2">
                {(['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] as const).map(role => (
                  <label key={role} className={`flex items-center gap-3 p-3 border rounded-[8px] cursor-pointer transition-colors ${
                    editRole === role ? 'border-primary bg-primary-light' : 'border-border hover:bg-gray-50'
                  }`}>
                    <input type="radio" checked={editRole === role} onChange={() => setEditRole(role)} className="text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-text">{ROLE_LABEL[role]}</div>
                      <div className="text-xs text-text-muted">
                        {role === 'ADMIN' && 'Full access to all features and settings'}
                        {role === 'RECRUITER' && 'Can manage candidates, jobs, and interviews'}
                        {role === 'HIRING_MANAGER' && 'Can review candidates and submit feedback'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Team Member"
        subtitle="Send an invitation to join your workspace" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button variant="primary" onClick={sendInvite}>Send Invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Full Name</label>
            <input value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe"
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Work Email</label>
            <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@company.com"
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Role</label>
            <div className="space-y-2">
              {(['RECRUITER', 'HIRING_MANAGER', 'ADMIN'] as const).map(role => (
                <label key={role} className={`flex items-center gap-2.5 p-2.5 border rounded-[7px] cursor-pointer ${
                  inviteForm.role === role ? 'border-primary bg-primary-light' : 'border-border hover:bg-gray-50'
                }`}>
                  <input type="radio" checked={inviteForm.role === role} onChange={() => setInviteForm(f => ({ ...f, role }))} className="text-primary" />
                  <span className="text-sm font-medium text-text">{ROLE_LABEL[role]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Section: Notifications ─────────────────────────────
function NotificationsSection() {
  const [email, setEmail] = useState({
    newApp: true, interviewScheduled: true, feedbackSubmitted: true,
    offerAccepted: true, candidateRejected: false,
  });
  const [inApp, setInApp] = useState({ desktop: true, sound: false });
  const [digest, setDigest] = useState('daily');
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-bold text-text">Notification Preferences</h2>
        <p className="text-sm text-text-muted mt-0.5">Control when and how you receive alerts</p>
      </div>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-light rounded-md flex items-center justify-center">
            <Bell size={12} className="text-primary" />
          </div>
          Email Notifications
        </div>
        <div className="space-y-3">
          {[
            { key: 'newApp', label: 'New Application', desc: 'When a candidate applies to any open role' },
            { key: 'interviewScheduled', label: 'Interview Scheduled', desc: 'When an interview is booked' },
            { key: 'feedbackSubmitted', label: 'Feedback Submitted', desc: 'When an interviewer submits a scorecard' },
            { key: 'offerAccepted', label: 'Offer Accepted', desc: "When a candidate accepts your offer" },
            { key: 'candidateRejected', label: 'Candidate Rejected', desc: 'When a candidate is moved to rejected' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
              <div>
                <div className="text-sm font-medium text-text">{label}</div>
                <div className="text-[11px] text-text-muted">{desc}</div>
              </div>
              <Toggle checked={email[key as keyof typeof email]} onChange={v => setEmail(e => ({ ...e, [key]: v }))} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-light rounded-md flex items-center justify-center">
            <Bell size={12} className="text-indigo" />
          </div>
          In-App Notifications
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/60">
            <div>
              <div className="text-sm font-medium text-text">Enable Desktop Alerts</div>
              <div className="text-[11px] text-text-muted">Push notifications via your browser</div>
            </div>
            <Toggle checked={inApp.desktop} onChange={v => setInApp(e => ({ ...e, desktop: v }))} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-text">Enable Sound</div>
              <div className="text-[11px] text-text-muted">Play a sound when new notifications arrive</div>
            </div>
            <Toggle checked={inApp.sound} onChange={v => setInApp(e => ({ ...e, sound: v }))} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-[13px] font-bold text-text mb-3">Email Digest</div>
        <div className="flex items-center gap-3">
          {['realtime', 'daily', 'weekly'].map(v => (
            <label key={v} className={`flex items-center gap-2 px-3 py-2 border rounded-[7px] cursor-pointer capitalize text-sm transition-colors ${
              digest === v ? 'border-primary bg-primary-light text-primary font-medium' : 'border-border text-text hover:bg-gray-50'
            }`}>
              <input type="radio" checked={digest === v} onChange={() => setDigest(v)} className="hidden" />
              {v}
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? '✓ Saved!' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Security ───────────────────────────────────
function SecuritySection() {
  const [tfa, setTfa] = useState(false);
  const [minLen, setMinLen] = useState(12);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saved, setSaved] = useState(false);
  const [ssoConnected, setSsoConnected] = useState<Record<string, boolean>>({ google: false, microsoft: false, okta: false });

  const SSO_PROVIDERS = [
    { id: 'google', label: 'Google Workspace', icon: '🔵', desc: 'Sign in with Google accounts' },
    { id: 'microsoft', label: 'Microsoft Azure AD', icon: '🟦', desc: 'Sign in with Microsoft 365' },
    { id: 'okta', label: 'Okta', icon: '🔷', desc: 'SAML 2.0 / OIDC provider' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-bold text-text">Security & SSO</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage authentication, access control, and identity providers</p>
      </div>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-warning-light rounded-md flex items-center justify-center">
            <Shield size={12} className="text-warning-dark" />
          </div>
          Two-Factor Authentication
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[8px]">
          <div>
            <div className="text-sm font-semibold text-text">Require 2FA for all members</div>
            <div className="text-xs text-text-muted">Members will be prompted to set up an authenticator app</div>
          </div>
          <Toggle checked={tfa} onChange={setTfa} />
        </div>
        {tfa && (
          <div className="mt-3 p-3 bg-warning-light border border-warning/20 rounded-[8px] text-xs text-warning-dark flex items-start gap-2">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            Members without 2FA will be locked out on next login and prompted to configure.
          </div>
        )}
      </Card>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4">Password Policy</div>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Minimum Length: <span className="text-primary">{minLen} characters</span>
            </label>
            <input type="range" min={8} max={32} value={minLen} onChange={e => setMinLen(Number(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] text-text-muted mt-1"><span>8</span><span>32</span></div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Session Timeout</label>
            <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
              className="w-48 h-9 px-3 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text">
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="240">4 Hours</option>
              <option value="480">8 Hours</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-success-light rounded-md flex items-center justify-center">
            <Key size={12} className="text-success" />
          </div>
          Single Sign-On (SSO)
        </div>
        <div className="space-y-3">
          {SSO_PROVIDERS.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-[8px] hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-text">{p.label}</div>
                  <div className="text-xs text-text-muted">{p.desc}</div>
                </div>
              </div>
              {ssoConnected[p.id] ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-success-light text-success border border-success/20 text-[10px]">Connected</Badge>
                  <button onClick={() => setSsoConnected(s => ({ ...s, [p.id]: false }))}
                    className="text-xs text-danger hover:underline">Disconnect</button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setSsoConnected(s => ({ ...s, [p.id]: true }))}>
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? '✓ Saved!' : 'Save Security Settings'}
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Integrations ──────────────────────────────
function IntegrationsSection() {
  const [connections, setConnections] = useState<Record<string, boolean>>({
    linkedin: true, gcal: false, outlook: false, zoom: false, slack: true, greenhouse: false, lever: false,
  });

  const INTEGRATIONS = [
    { id: 'linkedin', name: 'LinkedIn Recruiter', desc: 'Source and import candidates from LinkedIn', icon: '🔗', category: 'Sourcing' },
    { id: 'gcal', name: 'Google Calendar', desc: 'Sync interviews to Google Calendar', icon: '📅', category: 'Scheduling' },
    { id: 'outlook', name: 'Microsoft Outlook', desc: 'Sync interviews to Outlook Calendar', icon: '📧', category: 'Scheduling' },
    { id: 'zoom', name: 'Zoom', desc: 'Auto-generate Zoom links for video interviews', icon: '📹', category: 'Video' },
    { id: 'slack', name: 'Slack', desc: 'Receive hiring updates in your Slack workspace', icon: '💬', category: 'Notifications' },
    { id: 'greenhouse', name: 'Greenhouse Import', desc: 'Migrate jobs and candidates from Greenhouse', icon: '🌿', category: 'Migration', comingSoon: true },
    { id: 'lever', name: 'Lever Import', desc: 'Migrate data from Lever ATS', icon: '⚙️', category: 'Migration', comingSoon: true },
  ] as const;

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-text">Integrations</h2>
          <p className="text-sm text-text-muted mt-0.5">{Object.values(connections).filter(Boolean).length} connected integrations</p>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">{cat}</div>
          <div className="space-y-2">
            {INTEGRATIONS.filter(i => i.category === cat).map(int => (
              <div key={int.id} className="flex items-center justify-between p-4 bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 border border-border rounded-[8px] flex items-center justify-center text-xl flex-shrink-0">
                    {int.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">{int.name}</span>
                      {'comingSoon' in int && int.comingSoon && (
                        <Badge className="bg-gray-100 text-gray-500 text-[9px] px-1.5">Coming Soon</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted">{int.desc}</div>
                  </div>
                </div>
                {'comingSoon' in int && int.comingSoon ? (
                  <button disabled className="px-3 py-1.5 text-xs font-medium text-text-muted border border-border rounded-md cursor-not-allowed">
                    Coming Soon
                  </button>
                ) : connections[int.id] ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                      <CheckCircle2 size={12} /> Connected
                    </div>
                    <button onClick={() => setConnections(c => ({ ...c, [int.id]: false }))}
                      className="text-xs text-text-muted hover:text-danger transition-colors px-2 py-1 rounded hover:bg-danger-light">
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setConnections(c => ({ ...c, [int.id]: true }))}>
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section: Webhooks ───────────────────────────────────
function WebhooksSection() {
  const [url, setUrl] = useState('https://company.com/webhook/recruittrack');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState({
    candidateCreated: true, candidateHired: true,
    interviewScheduled: true, offerSent: false, feedbackSubmitted: false,
  });
  const [saved, setSaved] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const s = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setSecret(`whsec_${s}`);
    setSecretVisible(true);
  };

  const EVENT_LIST = [
    { key: 'candidateCreated', label: 'candidate.created', desc: 'Fires when a new candidate is added' },
    { key: 'candidateHired', label: 'candidate.hired', desc: 'Fires when a candidate is marked as Hired' },
    { key: 'interviewScheduled', label: 'interview.scheduled', desc: 'Fires when an interview is booked' },
    { key: 'offerSent', label: 'offer.sent', desc: 'Fires when an offer letter is sent' },
    { key: 'feedbackSubmitted', label: 'feedback.submitted', desc: 'Fires when interview feedback is submitted' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-bold text-text">Webhooks</h2>
        <p className="text-sm text-text-muted mt-0.5">Send real-time events to your backend systems</p>
      </div>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4">Endpoint URL</div>
        <input value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://your-domain.com/webhook"
          className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-text" />
        <p className="text-[11px] text-text-muted mt-2">We'll POST JSON payloads to this URL for selected events.</p>
      </Card>

      <Card>
        <div className="text-[13px] font-bold text-text mb-3">Signing Secret</div>
        {secret ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-9 px-3 flex items-center bg-gray-50 border border-border rounded-md font-mono text-xs text-text">
              {secretVisible ? secret : '•'.repeat(secret.length)}
            </div>
            <button onClick={() => setSecretVisible(v => !v)} className="px-3 h-9 text-xs border border-border rounded-md hover:bg-gray-50 text-text-muted">
              {secretVisible ? 'Hide' : 'Reveal'}
            </button>
            <button onClick={() => navigator.clipboard?.writeText(secret)} className="p-2.5 border border-border rounded-md hover:bg-gray-50">
              <Copy size={13} className="text-text-muted" />
            </button>
          </div>
        ) : (
          <Button variant="secondary" size="md" icon={<Key size={13} />} onClick={generateSecret}>
            Generate Secret
          </Button>
        )}
        <p className="text-[11px] text-text-muted mt-2">Use this to verify webhook payloads from RecruitTrack.</p>
      </Card>

      <Card>
        <div className="text-[13px] font-bold text-text mb-4">Events</div>
        <div className="space-y-3">
          {EVENT_LIST.map(({ key, label, desc }) => (
            <div key={key} className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0">
              <input type="checkbox" checked={events[key as keyof typeof events]}
                onChange={e => setEvents(ev => ({ ...ev, [key]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary accent-primary" />
              <div>
                <div className="text-sm font-mono font-semibold text-text">{label}</div>
                <div className="text-[11px] text-text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" icon={<RefreshCw size={13} />}>Test Webhook</Button>
        <Button variant="primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? '✓ Saved!' : 'Save Webhook'}
        </Button>
      </div>
    </div>
  );
}

// ─── Section: Billing ────────────────────────────────────
function BillingSection() {
  const INVOICES = [
    { date: 'Jun 1, 2026', amount: '$299.00', status: 'paid' },
    { date: 'May 1, 2026', amount: '$299.00', status: 'paid' },
    { date: 'Apr 1, 2026', amount: '$249.00', status: 'paid' },
    { date: 'Mar 1, 2026', amount: '$249.00', status: 'paid' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[16px] font-bold text-text">Billing & Subscription</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage your plan, seats, and invoices</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Current Plan</div>
          <div className="text-[20px] font-bold text-text mb-1">Enterprise Premium</div>
          <Badge className="bg-success-light text-success border border-success/20">Active</Badge>
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="secondary" size="sm" className="w-full">Manage Subscription</Button>
          </div>
        </Card>

        <div className="space-y-3">
          {[
            { label: 'Seats Used', value: '6 / 20', sub: '14 seats available' },
            { label: 'Billing Cycle', value: 'Monthly', sub: 'Renews Jul 1, 2026' },
            { label: 'Next Invoice', value: '$299.00', sub: 'Due Jul 1, 2026' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white border border-border rounded-card p-3 shadow-card">
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{label}</div>
              <div className="text-[16px] font-bold text-text mt-1">{value}</div>
              <div className="text-[11px] text-text-muted">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seat usage bar */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] font-bold text-text">Seat Usage</div>
          <div className="text-sm text-text-muted">6 of 20 seats used</div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: '30%' }} />
        </div>
        <div className="text-[11px] text-text-muted mt-1.5">30% capacity · 14 seats remaining</div>
      </Card>

      {/* Invoice history */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-bold text-text">Invoice History</div>
          <Button variant="ghost" size="sm" icon={<Download size={12} />}>Download All</Button>
        </div>
        <div className="space-y-0">
          {INVOICES.map((inv, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-medium text-text">{inv.date}</div>
                <div className="text-[11px] text-text-muted">Enterprise Premium · Monthly</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text">{inv.amount}</span>
                <Badge className="bg-success-light text-success border border-success/20 text-[10px]">Paid</Badge>
                <button className="text-xs text-primary hover:underline">Download</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────
export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>('workspace');

  const SECTION_CONTENT: Record<SettingsSection, React.ReactNode> = {
    workspace: <WorkspaceSection />,
    team: <TeamSection />,
    notifications: <NotificationsSection />,
    security: <SecuritySection />,
    integrations: <IntegrationsSection />,
    webhooks: <WebhooksSection />,
    billing: <BillingSection />,
  };

  return (
    <div className="max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-text tracking-tight">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage workspace, team, and configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <aside className="w-48 flex-shrink-0">
          <nav className="space-y-0.5 sticky top-20">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] text-[13px] font-medium transition-colors text-left ${
                  active === item.id
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-text'
                }`}
              >
                <span className={active === item.id ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
                {active === item.id && <ChevronRight size={12} className="ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {SECTION_CONTENT[active]}
        </div>
      </div>
    </div>
  );
}
