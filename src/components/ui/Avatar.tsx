import React from 'react';

// 10 distinct, professional, non-blue-dominated palette
const AVATAR_PALETTES = [
  { bg: '#F3E8FF', text: '#7C3AED', border: '#E9D5FF' },   // violet
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },   // amber
  { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },   // emerald
  { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' },   // pink
  { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },   // sky
  { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },   // red
  { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },   // green
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },   // blue
  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },   // orange
  { bg: '#F0F9FF', text: '#0F766E', border: '#99F6E4' },   // teal
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs:  { wh: 'w-5 h-5',  text: 'text-[9px]',  ring: 'ring-1' },
  sm:  { wh: 'w-7 h-7',  text: 'text-[11px]', ring: 'ring-1' },
  md:  { wh: 'w-9 h-9',  text: 'text-[13px]', ring: 'ring-2' },
  lg:  { wh: 'w-11 h-11',text: 'text-[15px]', ring: 'ring-2' },
  xl:  { wh: 'w-14 h-14',text: 'text-[19px]', ring: 'ring-2' },
};

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const palette = getPalette(name);
  const { wh, text, ring } = SIZE_MAP[size];
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${wh} rounded-full object-cover flex-shrink-0 ${ring} ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${wh} rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${text} ${ring} ring-white select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.border} 100%)`,
        color: palette.text,
        border: `1.5px solid ${palette.border}`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
