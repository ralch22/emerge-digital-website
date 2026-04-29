/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      opacity: {
        '8': '0.08',
        '15': '0.15',
      },
      colors: {
        navy: {
          DEFAULT: '#0A1F3D',
          900: '#06122A',
          800: '#0A1F3D',
          700: '#152A4D',
          600: '#1F3760',
        },
        ink: {
          DEFAULT: '#06122A',
          deep: '#03081A',
        },
        teal: {
          DEFAULT: '#00C2C7',
          400: '#3DDCE3',
          500: '#00C2C7',
          600: '#00A8AD',
        },
        cyan: '#3DDCE3',
        platinum: '#E8EEF5',
        offwhite: '#F7F9FC',
        slate: {
          DEFAULT: '#1F2A3C',
          900: '#1F2A3C',
        },
        cool: '#6B7A90',
        success: '#3FCF8E',
        warning: '#FFB547',
        danger: '#E5484D',
      },
      fontFamily: {
        display: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(3.5rem, 8.5vw, 6.75rem)', { lineHeight: '0.95', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-xl':  ['clamp(2.75rem, 6vw, 4.75rem)', { lineHeight: '1.02', letterSpacing: '-0.03em',  fontWeight: '600' }],
        'display-lg':  ['clamp(2rem, 4vw, 3.25rem)',    { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-md':  ['clamp(1.5rem, 2.4vw, 2.125rem)', { lineHeight: '1.18', letterSpacing: '-0.015em', fontWeight: '600' }],
        'lead':        ['1.2rem',  { lineHeight: '1.6',  fontWeight: '400' }],
        'eyebrow':     ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.18em', fontWeight: '600' }],
      },
      letterSpacing: {
        eyebrow: '0.18em',
        tightest: '-0.04em',
      },
      backgroundImage: {
        'gradient-hero':
          'radial-gradient(ellipse 90% 70% at 80% 0%, rgba(0, 194, 199, 0.18), transparent 60%), radial-gradient(ellipse 70% 60% at 10% 90%, rgba(61, 220, 227, 0.10), transparent 65%), linear-gradient(160deg, #06122A 0%, #0A1F3D 55%, #06122A 100%)',
        'gradient-accent':
          'linear-gradient(90deg, #00C2C7 0%, #3DDCE3 100%)',
        'gradient-data':
          'linear-gradient(180deg, #0A1F3D 0%, #00C2C7 100%)',
        'gradient-ink':
          'linear-gradient(180deg, #06122A 0%, #03081A 100%)',
        'gradient-mesh':
          'radial-gradient(at 20% 0%, rgba(0,194,199,0.16) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(61,220,227,0.10) 0px, transparent 50%)',
      },
      borderRadius: {
        card: '1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 194, 199, 0.4), 0 8px 32px rgba(0, 194, 199, 0.18)',
        'glow-lg': '0 0 0 1px rgba(0, 194, 199, 0.5), 0 24px 80px rgba(0, 194, 199, 0.32)',
        elevated: '0 30px 80px -30px rgba(0, 194, 199, 0.18), 0 20px 60px -20px rgba(6, 18, 42, 0.55)',
        ring: '0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      maxWidth: {
        prose: '72ch',
        section: '80rem',
        wide: '90rem',
      },
      spacing: {
        section: '8rem',
        'section-sm': '4rem',
        'section-lg': '12rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.85' },
          '50%': { transform: 'translate3d(2%, -3%, 0) scale(1.06)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'data-flow': {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 1s ease-out both',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'aurora-drift': 'aurora-drift 22s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'data-flow': 'data-flow 4s linear infinite',
      },
    },
  },
  plugins: [],
};
