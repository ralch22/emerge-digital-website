/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand primary
        navy: {
          DEFAULT: '#0A1F3D',
          900: '#06122A', // ink
          800: '#0A1F3D',
          700: '#152A4D',
          600: '#1F3760',
        },
        ink: '#06122A',

        // Brand accent
        teal: {
          DEFAULT: '#00C2C7',
          400: '#3DDCE3',
          500: '#00C2C7',
          600: '#00A8AD',
        },
        cyan: '#3DDCE3',

        // Surfaces and neutrals
        platinum: '#E8EEF5',
        offwhite: '#F7F9FC',
        slate: {
          DEFAULT: '#1F2A3C',
          900: '#1F2A3C',
        },
        cool: '#6B7A90',

        // Semantic
        success: '#3FCF8E',
        warning: '#FFB547',
        danger: '#E5484D',
      },
      fontFamily: {
        // Use Inter Variable for both display and body — load Inter Display
        // separately if/when a licensed cut is purchased
        display: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Brand-specific display scale
        'display-xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }], // 72px
        'display-lg': ['3rem',   { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '600' }], // 48px
        'display-md': ['2rem',   { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }], // 32px
        'lead':       ['1.25rem',{ lineHeight: '1.6',  fontWeight: '400' }],                            // 20px
        'eyebrow':    ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.15em', fontWeight: '600' }], // 13px
      },
      letterSpacing: {
        eyebrow: '0.15em',
      },
      backgroundImage: {
        'gradient-hero':
          'linear-gradient(135deg, #06122A 0%, #0A1F3D 60%, rgba(0, 194, 199, 0.08) 100%)',
        'gradient-accent':
          'linear-gradient(90deg, #00C2C7 0%, #3DDCE3 100%)',
        'gradient-data':
          'linear-gradient(180deg, #0A1F3D 0%, #00C2C7 100%)',
      },
      borderRadius: {
        card: '1.5rem', // 24px
        pill: '9999px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 194, 199, 0.4), 0 8px 32px rgba(0, 194, 199, 0.18)',
        elevated: '0 20px 60px -20px rgba(6, 18, 42, 0.45)',
      },
      maxWidth: {
        prose: '72ch',
        section: '80rem', // 1280px
      },
      spacing: {
        section: '8rem',     // 128px — desktop section padding
        'section-sm': '4rem', // 64px — mobile section padding
      },
    },
  },
  plugins: [],
};
