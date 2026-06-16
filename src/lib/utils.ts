import type { CandidateStage, JobStatus, CandidatePriority } from '@/types';

// Simple class merger without external dependencies
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatSalary(min: number, max: number, currency: string): string {
  const fmt = (n: number) => {
    if (n >= 1000) return `${currency === 'USD' ? '$' : '£'}${Math.round(n / 1000)}k`;
    return `${currency === 'USD' ? '$' : '£'}${n}`;
  };
  return `${fmt(min)} - ${fmt(max)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStageLabel(stage: CandidateStage): string {
  const labels: Record<CandidateStage, string> = {
    applied: 'Applied',
    screening: 'Screening',
    technical: 'Technical Interview',
    manager: 'Hiring Manager',
    hr_round: 'HR Round',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
  };
  return labels[stage];
}

export function getStageBadgeClass(stage: CandidateStage): string {
  const classes: Record<CandidateStage, string> = {
    applied: 'bg-gray-100 text-gray-700',
    screening: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    technical: 'bg-blue-50 text-blue-700 border border-blue-200',
    manager: 'bg-purple-50 text-purple-700 border border-purple-200',
    hr_round: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    offer: 'bg-green-50 text-green-700 border border-green-200',
    hired: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
  };
  return classes[stage];
}

export function getJobStatusBadgeClass(status: JobStatus): string {
  const classes: Record<JobStatus, string> = {
    ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
    DRAFT: 'bg-gray-100 text-gray-600 border border-gray-200',
    CLOSED: 'bg-red-50 text-red-600 border border-red-200',
    PAUSED: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  };
  return classes[status];
}

export function getPriorityBadgeClass(priority: CandidatePriority): string {
  const classes: Record<CandidatePriority, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    normal: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
  };
  return classes[priority];
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-indigo-100 text-indigo-700',
    'bg-red-100 text-red-700',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? 's' : ''}`;
}

// Simple cn replacement to avoid extra dep
export { cn as classNames };

// Re-export clsx-style
export function cx(...args: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return args
    .map(a => {
      if (!a) return '';
      if (typeof a === 'string') return a;
      return Object.entries(a)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
