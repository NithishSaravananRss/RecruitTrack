import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, GitPullRequest, Calendar, MessageSquare, CheckCircle, Filter, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notificationsApi';
import type { NotificationType } from '@/types';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  new_application: { icon: <UserPlus size={14} />, color: 'text-primary bg-primary-light' },
  stage_change: { icon: <GitPullRequest size={14} />, color: 'text-purple-700 bg-purple-50' },
  interview_scheduled: { icon: <Calendar size={14} />, color: 'text-blue-700 bg-blue-50' },
  feedback_submitted: { icon: <MessageSquare size={14} />, color: 'text-teal-700 bg-teal-50' },
  offer_accepted: { icon: <CheckCircle size={14} />, color: 'text-success bg-success-light' },
  offer_declined: { icon: <CheckCircle size={14} />, color: 'text-danger bg-danger-light' },
};

const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  new_application: 'Application',
  stage_change: 'Stage Change',
  interview_scheduled: 'Interview',
  feedback_submitted: 'Feedback',
  offer_accepted: 'Offer',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notificationsResponse } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getUserNotifications({ size: 100 }),
  });
  
  const notifications = notificationsResponse?.data?.content || [];
  const displayed = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllRead = () => markAllReadMutation.mutate();
  const markRead = (id: string) => markReadMutation.mutate(id);

  return (
    <div className="max-w-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-[22px] font-semibold text-text">Notifications</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-md">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${filter === 'all' ? 'bg-white text-text shadow-sm border border-border' : 'text-text-muted'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${filter === 'unread' ? 'bg-white text-text shadow-sm border border-border' : 'text-text-muted'}`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <Button variant="secondary" size="md" icon={<CheckCheck size={14} />} onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      </div>

      {/* Notification list */}
      <div className="bg-white border border-border rounded-[10px] shadow-card overflow-hidden">
        <AnimatePresence initial={false}>
          {displayed.length === 0 ? (
            <div className="py-20 text-center">
              <Bell size={32} className="text-gray-300 mx-auto mb-3" />
              <div className="text-sm font-medium text-text-muted">No {filter === 'unread' ? 'unread' : ''} notifications</div>
              <div className="text-xs text-text-muted mt-1">You're all caught up!</div>
            </div>
          ) : (
            displayed.map((notif: any, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.referenceId) navigate(`/candidates/${notif.referenceId}`);
                }}
                className={`flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 cursor-pointer transition-colors group ${
                  !notif.isRead ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700`}>
                  <Bell size={14} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text">{notif.referenceType?.replace('_', ' ') || 'Notification'}</span>
                        {notif.referenceType && (
                          <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5 uppercase">{notif.referenceType}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-muted mt-0.5">{notif.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-auto mt-1.5" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
