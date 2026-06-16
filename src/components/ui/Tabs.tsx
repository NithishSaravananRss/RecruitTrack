import React, { useState } from 'react';
import { cx } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={cx('flex border-b border-border', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'text-primary border-primary'
              : 'text-text-muted border-transparent hover:text-text hover:border-gray-300',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cx(
              'ml-1 px-1.5 py-0.5 rounded text-xs font-medium',
              activeTab === tab.id ? 'bg-primary-light text-primary' : 'bg-gray-100 text-text-muted',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Pill-style tabs (for compact use)
export function PillTabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={cx('flex items-center gap-1 p-1 bg-gray-100 rounded-md', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all',
            activeTab === tab.id
              ? 'bg-white text-text shadow-sm border border-border'
              : 'text-text-muted hover:text-text',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
