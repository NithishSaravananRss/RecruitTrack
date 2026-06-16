import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: number;
}

export function Dropdown({ trigger, items, align = 'right', width = 180 }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(v => !v)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{ width }}
            className={`absolute z-50 mt-1 bg-white border border-border rounded-[8px] shadow-dropdown py-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {items.map((item, i) => (
              item.divider
                ? <div key={i} className="my-1 border-t border-border" />
                : (
                  <button
                    key={i}
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                      item.danger
                        ? 'text-danger hover:bg-danger hover:text-white'
                        : 'text-text hover:bg-gray-50'
                    }`}
                  >
                    {item.icon && <span className="w-4 h-4 flex items-center text-current opacity-70">{item.icon}</span>}
                    {item.label}
                  </button>
                )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple select-style filter button
interface FilterButtonProps {
  label: string;
  value?: string;
  options: string[];
  onChange: (val: string) => void;
}

export function FilterButton({ label, value, options, onChange }: FilterButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const display = value && value !== 'all' ? `${label}: ${value}` : label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium text-text border border-border bg-white rounded-md hover:bg-gray-50 transition-colors"
      >
        {display}
        <ChevronDown size={13} className="text-text-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 mt-1 left-0 min-w-[160px] bg-white border border-border rounded-[8px] shadow-dropdown py-1"
          >
            <button
              onClick={() => { onChange('all'); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${!value || value === 'all' ? 'text-primary font-medium' : 'text-text'}`}
            >
              All
            </button>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${value === opt ? 'text-primary font-medium' : 'text-text'}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
