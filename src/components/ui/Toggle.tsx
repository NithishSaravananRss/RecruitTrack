import React, { useState } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: 'sm' | 'md';
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, size = 'md', label, disabled }: ToggleProps) {
  const track = size === 'sm'
    ? 'w-7 h-4'
    : 'w-10 h-6';
  const thumb = size === 'sm'
    ? `w-3 h-3 ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`
    : `w-4 h-4 ${checked ? 'translate-x-4' : 'translate-x-1'}`;

  return (
    <label className={`flex items-center gap-2.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} select-none`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 ${track} rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          checked ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block ${thumb} mt-[2px] rounded-full bg-white shadow-sm transform transition-transform duration-200`} />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  );
}
