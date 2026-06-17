/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      opacity: {
        '3':  '0.03',
        '4':  '0.04',
        '6':  '0.06',
        '8':  '0.08',
        '12': '0.12',
        '15': '0.15',
      },
      colors: {
        navy: {
          DEFAULT: '#0A1F3D',
          950: '#04091A',
          900: '#06122A',
          800: '#0A1F3D',
          700: '#152A4D',
          600: '#1F3760',
          500: '#2A4A7F',
        },
        ink: {
          DEFAULT: '#06122A',
          deep:    '#03081A',
          surface: '#040D1F',
        },
        teal: {
          DEFAULT: '#00C2C7',
          50:  '#E6FAFB',
          100: '#C0F3F5',
          200: '#7EEEF0',
          300: '#3DDCE3',
          400: '#1ACFCE',
          500: '#00C2C7',
          600: '#00A8AD',
          700: '#008A8E',
          glow: '#00F5FF',
        },
        cyan: {
          DEFAULT: '#3DDCE3',
          bright:  '#00F5FF',
        },
        platinum: {
          DEFAULT: '#E8EEF5',
          50: '#F7F9FC',
        },
        offwhite: '#F7F9FC',
        slate: {
          DEFAULT: '#1F2A3C',
          900: '#1F2A3C',
          800: '#2A3650',
          700: '#374563',
        },
        cool: {
          DEFAULT: '#7E8CA3',
          400: '#8596AB',
          300: '#9FAFC2',
        },
        success: '#3FCF8E',
        warning: '#FFB547',
        danger:  '#E5484D',
      },

      fontFamily: {
        display: ['"Lexend Variable"', 'Lexend', 'system-ui', 'sans-serif'],
        sans:    ['"Lexend Variable"', 'Lexend', 'system-ui', 'sans-serif'],
        wide:    ['"Lexend Zetta"', '"Lexend Variable"', 'system-ui', 'sans-serif'],
        label:   ['"Prompt"', '"Lexend Variable"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        'display-2xl': ['clamp(3.5rem, 8.5vw, 6.75rem)',   { lineHeight: '0.95', letterSpacing: '-0.035em', fontWeight: '700' }],
        'display-xl':  ['clamp(2.75rem, 6vw, 4.75rem)',    { lineHeight: '1.02', letterSpacing: '-0.03em',  fontWeight: '700' }],
        'display-lg':  ['clamp(2rem, 4vw, 3.25rem)',       { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md':  ['clamp(1.5rem, 2.4vw, 2.125rem)',  { lineHeight: '1.18', letterSpacing: '-0.018em', fontWeight: '600' }],
        'display-sm':  ['clamp(1.15rem, 1.6vw, 1.45rem)',  { lineHeight: '1.3',  letterSpacing: '-0.012em', fontWeight: '600' }],
        'lead':        ['1.2rem',  { lineHeight: '1.65', fontWeight: '400' }],
        'lead-sm':     ['1.05rem', { lineHeight: '1.6',  fontWeight: '400' }],
        'eyebrow':     ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.18em', fontWeight: '600' }],
      },

      letterSpacing: {
        eyebrow:  '0.18em',
        tightest: '-0.04em',
        wide:     '0.08em',
      },

      backgroundImage: {
        /* ─── Hero ─── */
        'gradient-hero':
          'radial-gradient(ellipse 90% 70% at 80% 0%, rgba(0,194,199,0.18), transparent 60%), radial-gradient(ellipse 70% 60% at 10% 90%, rgba(61,220,227,0.10), transparent 65%), linear-gradient(160deg, #06122A 0%, #0A1F3D 55%, #06122A 100%)',
        'gradient-hero-premium':
          'radial-gradient(ellipse 140% 80% at 78% -8%, rgba(0,194,199,0.24), transparent 52%), radial-gradient(ellipse 100% 70% at 0% 110%, rgba(61,220,227,0.16), transparent 55%), radial-gradient(ellipse 50% 40% at 50% 45%, rgba(0,194,199,0.05), transparent 70%), linear-gradient(168deg, #03081A 0%, #06122A 32%, #0A1F3D 62%, #06122A 100%)',

        /* ─── Accent ─── */
        'gradient-accent':          'linear-gradient(90deg, #00C2C7 0%, #3DDCE3 100%)',
        'gradient-accent-diagonal': 'linear-gradient(135deg, #00C2C7 0%, #3DDCE3 100%)',
        'gradient-accent-vertical': 'linear-gradient(180deg, #3DDCE3 0%, #00C2C7 100%)',
        'gradient-accent-glow':     'linear-gradient(90deg, #00C2C7 0%, #3DDCE3 50%, #00F5FF 100%)',

        /* ─── Surfaces ─── */
        'gradient-data':  'linear-gradient(180deg, #0A1F3D 0%, #00C2C7 100%)',
        'gradient-ink':   'linear-gradient(180deg, #06122A 0%, #03081A 100%)',
        'gradient-navy':  'linear-gradient(180deg, #0A1F3D 0%, #06122A 100%)',
        'gradient-mesh':
          'radial-gradient(at 20% 0%, rgba(0,194,199,0.16) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(61,220,227,0.10) 0px, transparent 50%)',

        /* ─── Card effects ─── */
        'gradient-card-glow':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,194,199,0.14), transparent 80%)',
        'gradient-card-inner':
          'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',

        /* ─── Utilities ─── */
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'gradient-shimmer':   'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
        'gradient-teal-fade': 'linear-gradient(180deg, rgba(0,194,199,0.15) 0%, transparent 100%)',
        'gradient-border-teal':
          'linear-gradient(135deg, rgba(0,194,199,0.7) 0%, rgba(61,220,227,0.2) 40%, rgba(0,194,199,0.05) 70%, rgba(61,220,227,0.35) 100%)',
      },

      borderRadius: {
        card:     '1.25rem',
        'card-lg': '1.75rem',
        pill:     '9999px',
        xl:       '1rem',
        '2xl':    '1.25rem',
        '3xl':    '1.75rem',
      },

      boxShadow: {
        glow:         '0 0 0 1px rgba(0,194,199,0.4), 0 8px 32px rgba(0,194,199,0.18)',
        'glow-sm':    '0 0 0 1px rgba(0,194,199,0.3), 0 4px 16px rgba(0,194,199,0.12)',
        'glow-lg':    '0 0 0 1px rgba(0,194,199,0.5), 0 24px 80px rgba(0,194,199,0.32)',
        'glow-xl':    '0 0 60px rgba(0,194,199,0.3), 0 0 120px rgba(0,194,199,0.15)',
        elevated:     '0 30px 80px -30px rgba(0,194,199,0.18), 0 20px 60px -20px rgba(6,18,42,0.55)',
        'elevated-lg':'0 40px 100px -30px rgba(0,194,199,0.22), 0 30px 80px -20px rgba(6,18,42,0.65)',
        ring:         '0 0 0 1px rgba(255,255,255,0.06)',
        'ring-teal':  '0 0 0 1px rgba(0,194,199,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.12)',
        'card-hover': '0 0 0 1px rgba(0,194,199,0.35), 0 20px 60px rgba(0,194,199,0.14), 0 40px 80px rgba(3,8,26,0.5)',
      },

      maxWidth: {
        prose:   '72ch',
        section: '80rem',
        wide:    '90rem',
      },

      spacing: {
        section:     '8rem',
        'section-sm': '4rem',
        'section-lg': '12rem',
      },

      transitionTimingFunction: {
        'out-expo':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint':   'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-back':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out-quart':'cubic-bezier(0.76, 0, 0.24, 1)',
        'spring':      'cubic-bezier(0.43, 0.195, 0.02, 1)',
      },

      backdropBlur: {
        xs:   '4px',
        '4xl':'80px',
      },

      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.85' },
          '50%':      { transform: 'translate3d(2%,-3%,0) scale(1.06)', opacity: '1' },
        },
        'aurora-drift-alt': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.7' },
          '33%':      { transform: 'translate3d(-2%,2%,0) scale(1.04)', opacity: '0.9' },
          '66%':      { transform: 'translate3d(1%,-1%,0) scale(0.97)', opacity: '0.75' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'data-flow': {
          '0%':   { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
        'data-flow-loop': {
          '0%':   { strokeDashoffset: '600', opacity: '0' },
          '8%':   { opacity: '0.7' },
          '90%':  { opacity: '0.7' },
          '100%': { strokeDashoffset: '0', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'neural-pulse': {
          '0%, 100%': { opacity: '0.25', transform: 'scale(1)' },
          '50%':      { opacity: '0.9',  transform: 'scale(1.5)' },
        },
        'beam-sweep': {
          '0%':         { transform: 'translateX(-120%) skewX(-10deg)', opacity: '0' },
          '5%':         { opacity: '1' },
          '92%':        { opacity: '0.6' },
          '100%':       { transform: 'translateX(120%) skewX(-10deg)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'btn-shimmer': {
          '0%':         { left: '-100%' },
          '40%, 100%':  { left: '200%' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'ping-slow': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.75' },
          '50%':      { transform: 'scale(1.6)', opacity: '0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'line-draw': {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'counter-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'border-glow-cycle': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
      },

      animation: {
        'fade-up':           'fade-up 0.9s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':           'fade-in 1s ease-out both',
        'scale-in':          'scale-in 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'glow-pulse':        'glow-pulse 3s ease-in-out infinite',
        'aurora-drift':      'aurora-drift 22s ease-in-out infinite',
        'aurora-drift-alt':  'aurora-drift-alt 18s ease-in-out infinite',
        marquee:             'marquee 40s linear infinite',
        'data-flow':         'data-flow 4s linear infinite',
        'data-flow-loop':    'data-flow-loop 7s ease-in-out infinite',
        float:               'float 6s ease-in-out infinite',
        'neural-pulse':      'neural-pulse 3s ease-in-out infinite',
        'beam-sweep':        'beam-sweep 14s ease-in-out 2s infinite',
        shimmer:             'shimmer 3s linear infinite',
        'spin-slow':         'spin-slow 20s linear infinite',
        'ping-slow':         'ping-slow 3s cubic-bezier(0,0,0.2,1) infinite',
        'gradient-x':        'gradient-x 8s ease infinite',
        'line-draw':         'line-draw 2s ease-out forwards',
        'counter-in':        'counter-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'border-glow-cycle': 'border-glow-cycle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
