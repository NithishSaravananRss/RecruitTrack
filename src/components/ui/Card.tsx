import React from 'react';
import { cx } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function Card({ children, className = '', padding = true, hover = false }: CardProps) {
  return (
    <div className={cx(
      'bg-white border border-border rounded-[10px]',
      padding && 'p-4',
      hover && 'hover:shadow-card-hover transition-shadow duration-150 cursor-pointer',
      'shadow-card',
      className,
    )}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={cx('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-[15px] font-semibold text-text leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
