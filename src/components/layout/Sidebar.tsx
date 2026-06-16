import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Briefcase, Users, GitPullRequest,
  Calendar, BarChart3, Bell, Settings, LogOut, UserCheck, ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

import { jobsApi } from '@/api/jobsApi';
import { candidatesApi } from '@/api/candidatesApi';
import { notificationsApi } from '@/api/notificationsApi';
import { interviewsApi } from '@/api/interviewsApi';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: UserRole[];
  count?: number;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
};

function NavCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-text-muted min-w-[18px] text-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch active jobs count via API
  const { data: jobsResponse } = useQuery({
    queryKey: ['jobs-count', 'ACTIVE'],
    queryFn: () => jobsApi.getJobs({ status: 'ACTIVE', size: 1 }),
  });
  
  const { data: candidatesResponse } = useQuery({
    queryKey: ['candidates-count'],
    queryFn: () => candidatesApi.getCandidates({ size: 1 })
  });

  const openJobs = jobsResponse?.data?.totalElements || 0;
  const totalCandidates = candidatesResponse?.data?.totalElements || 0;

  const { data: todayInterviewsResponse } = useQuery({
    queryKey: ['interviews', 'today'],
    // Use dummy filter or just general endpoint since backend does not filter by today
    queryFn: () => interviewsApi.getAllInterviews({ size: 20 }),
  });

  const allInterviews = todayInterviewsResponse?.data?.content || [];
  const todayInterviewsCount = allInterviews.filter(i => {
    const d = new Date(i.scheduledAt);
    const today = new Date(); // or specific date
    return d.toDateString() === today.toDateString();
  }).length;
  
  const { data: notificationsResponse } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getUserNotifications({ size: 100 }), // Get up to 100 to calculate unread
  });
  
  const unreadNotifications = (notificationsResponse?.data?.content || []).filter(n => !n.isRead).length;

  const navItems: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={15} />, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { label: 'Jobs', to: '/jobs', icon: <Briefcase size={15} />, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'], count: openJobs },
    { label: 'Candidates', to: '/candidates', icon: <Users size={15} />, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'], count: totalCandidates },
    { label: 'Pipeline', to: '/pipeline', icon: <GitPullRequest size={15} />, roles: ['ADMIN', 'RECRUITER'] },
    { label: 'Interviews', to: '/interviews', icon: <Calendar size={18} />, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'], count: todayInterviewsCount },
    { label: 'Analytics', to: '/analytics', icon: <BarChart3 size={15} />, roles: ['ADMIN', 'RECRUITER'] },
    { label: 'Notifications', to: '/notifications', icon: <Bell size={15} />, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'], count: unreadNotifications },
    { label: 'Audit Log', to: '/audit-logs', icon: <ClipboardList size={15} />, roles: ['ADMIN'] },
    { label: 'Settings', to: '/settings', icon: <Settings size={15} />, roles: ['ADMIN'] },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[232px] bg-white border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border flex-shrink-0">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}>
          <UserCheck size={14} className="text-white" />
        </div>
        <div>
          <div className="text-[14px] font-bold text-text tracking-tight leading-tight">RecruitTrack</div>
          <div className="text-[9px] text-text-muted leading-none tracking-widest font-medium uppercase mt-0.5">Hiring Ops</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {/* Section label */}
        <div className="px-2.5 pt-2 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted/60">
          Main
        </div>

        <div className="space-y-0.5">
          {filteredItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-[7px] rounded-[6px] text-[13px] font-medium transition-all duration-100 group ${
                  isActive
                    ? 'bg-primary/8 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'} transition-colors flex-shrink-0`}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-text-muted'
                    }`}>
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {filteredItems.length > 5 && (
          <>
            <div className="px-2.5 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted/60">
              Insights
            </div>
            <div className="space-y-0.5">
              {filteredItems.slice(5).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-[7px] rounded-[6px] text-[13px] font-medium transition-all duration-100 group ${
                      isActive
                        ? 'bg-primary/8 text-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-text'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'} transition-colors flex-shrink-0`}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                          isActive ? 'bg-primary/15 text-primary' : 'bg-red-100 text-red-600'
                        }`}>
                          {item.count > 99 ? '99+' : item.count}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User area */}
      {user && (
        <div className="border-t border-border p-2.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 p-2 rounded-[6px] hover:bg-gray-50 cursor-pointer group transition-colors">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-text truncate leading-tight">{user.name}</div>
              <div className="text-[11px] text-text-muted leading-tight">{ROLE_LABELS[user.role]}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1 rounded"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
