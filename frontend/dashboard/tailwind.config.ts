import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: '#0A0F1C',
        surface: {
          DEFAULT: '#0E1525',
          2: '#131929',
          3: '#1A2235',
        },
        // Text
        text: {
          DEFAULT: '#E5E7EB',
          2: '#94A3B8',
          3: '#4B5A72',
        },
        // Accent (slate/silver)
        accent: {
          DEFAULT: '#8B9DB5',
          dim: 'rgba(139,157,181,0.08)',
          border: 'rgba(139,157,181,0.22)',
        },
        // Semantic
        teal: {
          DEFAULT: '#00C2A8',
          dim: 'rgba(0,194,168,0.08)',
          border: 'rgba(0,194,168,0.25)',
        },
        green: {
          DEFAULT: '#22C55E',
          dim: 'rgba(34,197,94,0.07)',
          border: 'rgba(34,197,94,0.2)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245,158,11,0.07)',
          border: 'rgba(245,158,11,0.25)',
        },
        red: {
          DEFAULT: '#EF4444',
          dim: 'rgba(239,68,68,0.07)',
          border: 'rgba(239,68,68,0.2)',
        },
        // Borders
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          md: 'rgba(255,255,255,0.10)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['9px', { lineHeight: '1.4' }],
        '3xs': ['8px', { lineHeight: '1.3' }],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #8B9DB5, #6B7F9A)',
        'mark-gradient': 'linear-gradient(135deg, #1C2A45, #253452)',
      },
    },
  },
  plugins: [],
}

export default config