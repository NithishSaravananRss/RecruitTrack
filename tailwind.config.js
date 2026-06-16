/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'IBM Plex Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          muted: '#BFDBFE',
        },
        background: '#F9FAFB',
        card: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          DEFAULT: '#111827',
          muted: '#6B7280',
          light: '#9CA3AF',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#F0FDF4',
          muted: '#86EFAC',
          dark: '#15803D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          muted: '#FCD34D',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
          muted: '#FCA5A5',
          dark: '#B91C1C',
        },
        purple: {
          DEFAULT: '#7C3AED',
          light: '#F5F3FF',
          muted: '#C4B5FD',
        },
        teal: {
          DEFAULT: '#0F766E',
          light: '#F0FDFA',
          muted: '#5EEAD4',
        },
        indigo: {
          DEFAULT: '#4F46E5',
          light: '#EEF2FF',
          muted: '#A5B4FC',
        },
        sidebar: {
          bg: '#FFFFFF',
          border: '#E5E7EB',
          text: '#374151',
          active: '#EFF6FF',
          activeText: '#2563EB',
          hover: '#F9FAFB',
        },
      },
      borderRadius: {
        card: '12px',
        'card-sm': '8px',
      },
      fontSize: {
        'page-title': ['22px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.02em' }],
        'section-title': ['15px', { lineHeight: '1.3', fontWeight: '600' }],
        'table-header': ['11px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0.06em' }],
        'body': ['14px', { lineHeight: '1.5' }],
        'body-sm': ['13px', { lineHeight: '1.5' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.05)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.08)',
        modal: '0 24px 64px -12px rgba(0,0,0,0.22)',
        dropdown: '0 4px 20px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
