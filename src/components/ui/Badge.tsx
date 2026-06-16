import React from 'react';
import { cx } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, className = '', dot = false }: BadgeProps) {
  return (
    <span className={cx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
      className,
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
