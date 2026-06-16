import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, ChevronDown, Settings, LogOut, User, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { candidatesApi } from '@/api/candidatesApi';
import { jobsApi } from '@/api/jobsApi';
import { notificationsApi } from '@/api/notificationsApi';

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ candidates: any[], jobs: any[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearching(true);
      try {
        const [cRes, jRes] = await Promise.all([
          candidatesApi.getCandidates({ search: searchQuery.trim(), size: 5 }),
          jobsApi.getJobs({ search: searchQuery.trim(), size: 5 })
        ]);

        const candidates = cRes.data?.content || [];
        const jobs = jRes.data?.content || [];

        if (candidates.length > 0 && jobs.length === 0) {
          navigate(`/candidates?q=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
        } else if (jobs.length > 0 && candidates.length === 0) {
          navigate(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
        } else if (candidates.length > 0 && jobs.length > 0) {
          setSearchResults({ candidates, jobs });
        } else {
          // No matches, just go to candidates for now
          navigate(`/candidates?q=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }
  };
  const [profileOpen, setProfileOpen] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { data: notificationsResponse } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getUserNotifications({ size: 100 }),
  });
  const unreadCount = (notificationsResponse?.data?.content || []).filter(n => !n.isRead).length;

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: 'People Ops',
    phone: '+1 (555) 012-3456',
    timezone: 'UTC-5',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  return (
    <header className="fixed top-0 left-[232px] right-0 h-14 bg-white border-b border-border z-30 flex items-center px-5 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative" ref={searchRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidates, jobs, reports..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full h-8 pl-8 pr-3 text-sm bg-gray-50 border border-border rounded-md placeholder:text-text-muted text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          {isSearching && (
             <div className="absolute right-3 top-1/2 -translate-y-1/2">
               <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          )}
          {searchResults && (
            <div className="absolute top-full mt-1.5 w-[400px] bg-white border border-border rounded-[10px] shadow-dropdown z-50 py-2">
              <div className="px-3 pb-2 text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border mb-1">
                Candidates
              </div>
              {searchResults.candidates.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => { setSearchResults(null); setSearchQuery(''); navigate(`/candidates/${c.id}`); }}
                  className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text truncate">{c.firstName} {c.lastName}</div>
                    <div className="text-[11px] text-text-muted truncate">{c.currentTitle} • {c.location}</div>
                  </div>
                </button>
              ))}
              
              <div className="px-3 pt-2 pb-2 mt-1 text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-t border-border mb-1">
                Jobs
              </div>
              {searchResults.jobs.map((j: any) => (
                <button
                  key={j.id}
                  onClick={() => { setSearchResults(null); setSearchQuery(''); navigate(`/jobs`); }}
                  className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text truncate">{j.title}</div>
                    <div className="text-[11px] text-text-muted truncate">{j.department} • {j.location}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative h-8 w-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-gray-100 rounded-md transition-colors"
          title="Notifications"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-[7px] h-[7px] bg-danger rounded-full border border-white" />
          )}
        </button>

        {/* Help */}
        <button
          className="h-8 w-8 flex items-center justify-center text-text-muted hover:text-text hover:bg-gray-100 rounded-md transition-colors"
          title="Help & Documentation"
        >
          <HelpCircle size={15} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* User menu — custom dropdown, always works */}
        {user && (
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className={`flex items-center gap-2 h-8 px-2 rounded-md transition-colors ${profileOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            >
              <Avatar name={user.name} size="xs" />
              <div className="text-left hidden sm:block">
                <div className="text-[12px] font-semibold text-text leading-tight max-w-[100px] truncate">{user.name.split(' ')[0]}</div>
              </div>
              <ChevronDown size={11} className={`text-text-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-border rounded-[10px] shadow-dropdown z-50 py-1.5 overflow-hidden">
                {/* User info header */}
                <div className="px-3 py-2.5 border-b border-border mb-1">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-text truncate">{user.name}</div>
                      <div className="text-[11px] text-text-muted truncate">{user.email}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setProfileOpen(false); setShowMyProfile(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-text hover:bg-gray-50 transition-colors"
                >
                  <User size={14} className="text-text-muted flex-shrink-0" />
                  My Profile
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-text hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} className="text-text-muted flex-shrink-0" />
                  Settings
                </button>

                <div className="my-1 border-t border-border" />

                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-danger hover:bg-danger-light transition-colors"
                >
                  <LogOut size={14} className="flex-shrink-0" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showMyProfile}
        onClose={() => setShowMyProfile(false)}
        title="My Profile"
        subtitle="Manage your personal information and preferences"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMyProfile(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setShowMyProfile(false)}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <Avatar name={profileForm.name} size="xl" />
            <Button variant="secondary" size="sm">Change Photo</Button>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Full Name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Work Email</label>
            <input value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} disabled
              className="w-full h-9 px-3 text-sm border border-border rounded-md bg-gray-50 text-text-muted" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Department</label>
              <input value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Phone</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Timezone</label>
            <select value={profileForm.timezone} onChange={e => setProfileForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="UTC-8">UTC-8 (Pacific Time)</option>
              <option value="UTC-5">UTC-5 (Eastern Time)</option>
              <option value="UTC+0">UTC+0 (UTC)</option>
            </select>
          </div>
        </div>
      </Modal>
    </header>
  );
}
