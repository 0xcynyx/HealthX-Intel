import type { Config } from 'tailwindcss';

// Design tokens mirror the A1C platform-frontend dark theme so HealthX-Intel
// feels like part of the same family.
//   display = Chillax (Fontshare)        — titles, headers
//   sans    = Clash Grotesk (Fontshare)  — body, descriptions
//   mono    = Source Code Pro (Google)   — metrics, IDs, pills

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#08080B',
        panel: '#0F0F14',
        panel2: '#141419',
        panelhi: '#1A1A22',
        inset: '#090A0D',
        sidebar: '#0B0B0F',
        border: 'rgba(255,255,255,0.10)',
        line: 'rgba(255,255,255,0.11)',
        linesoft: 'rgba(255,255,255,0.06)',
        muted: '#9CA0C4',
        ink: '#EAEDFF',
        faint: '#61658C',
        brand: {
          DEFAULT: '#0e46f3',
          hover: '#2F5BFF',
          soft: 'rgba(99,121,255,0.14)',
          deep: '#0a37c5',
        },
        neon: '#6379FF',
        indigo: '#6F8DFF',
        amber: '#F5C04E',
        accent: '#e8ff9c',
        success: '#4ade80',
        warn: '#fbbf24',
        danger: '#f87171',
        teal: '#2dd4bf',
      },
      fontFamily: {
        display: ['"Chillax"', '"Chillax Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Clash Grotesk"', '"Clash Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Source Code Pro"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,121,255,0.25), 0 12px 40px -12px rgba(14,70,243,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 50px -28px rgba(0,0,0,0.9)',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.16,1,0.3,1) both',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        spinSlow: 'spinSlow 1s linear infinite',
      },
    },
  },
} satisfies Config;
