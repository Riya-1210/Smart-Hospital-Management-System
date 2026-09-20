/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Role-driven primary palette (CSS variables swapped per role) ──
        // Values live in src/index.css: :root + [data-role="doctor|patient|admin|nurse"] blocks.
        primary: {
          50:   'rgb(var(--p50) / <alpha-value>)',
          100:  'rgb(var(--p100) / <alpha-value>)',
          200:  'rgb(var(--p200) / <alpha-value>)',
          300:  'rgb(var(--p300) / <alpha-value>)',
          400:  'rgb(var(--p400) / <alpha-value>)',
          435:  'rgb(var(--p435) / <alpha-value>)', // mid tone: rings, strong accents
          500:  'rgb(var(--p500) / <alpha-value>)', // readable text on light bg
          600:  'rgb(var(--p600) / <alpha-value>)', // brand base
          700:  'rgb(var(--p700) / <alpha-value>)', // hover / emphasis
          800:  'rgb(var(--p800) / <alpha-value>)',
          900:  'rgb(var(--p900) / <alpha-value>)',
        },
        // Primary Healthcare Green — full static palette (legacy: charts, semantic badges)
        success: {
          50:  '#F1F9F5',
          100: '#DCF0E7',
          200: '#B0DEC9',
          300: '#7FC9A8',
          400: '#2E8B68',
          500: '#267A5B',
          600: '#1F6A4F',
          700: '#195A43',
        },
        warning: {
          50:  '#FDF8EF',
          100: '#FAF0DC',
          200: '#F2DCB0',
          300: '#E8C57A',
          400: '#D99A3D',
          500: '#C48830',
          600: '#A87228',
          700: '#8B5D20',
        },
        critical: {
          50:  '#FDF5F4',
          100: '#FAEAEA',
          200: '#F2C9C5',
          300: '#E8A09A',
          400: '#C65A52',
          500: '#B24A42',
          600: '#953D36',
          700: '#7A312B',
        },
        teal: {
          50:  '#F0F9F9',
          100: '#DCF0F0',
          200: '#B0DCDC',
          300: '#7FC4C4',
          400: '#4AABAB',
          500: '#238B8B',
          600: '#176B6B',
          700: '#0F5151',
        },
        neutral: {
          50:  '#FFFFFF',
          100: '#F7F8F6',
          200: '#EDEEF0',
          300: '#DDE5E1',
          400: '#C4CCC8',
          500: '#9CA5A0',
          600: '#66716C',
          700: '#4A5450',
          800: '#354038',
          900: '#202522',
        },
        // ── Legacy palettes (used across many existing pages — do not remove) ──
        warm: {
          50:  '#FFFFFF',
          100: '#F7F8F6',
          200: '#EDEEF0',
          300: '#DDE5E1',
          400: '#C4CCC8',
          500: '#9CA5A0',
          600: '#66716C',
          700: '#4A5450',
          800: '#354038',
          900: '#202522',
        },
        sage: {
          50:  '#F3F8F6',
          100: '#E8F3EF',
          200: '#B8DDD3',
          300: '#7FC4B5',
          400: '#4AAB97',
          500: '#238B7A',
          600: '#176B5B',
          700: '#0F5146',
          800: '#0A3D35',
          900: '#062D27',
          1000: '#042019',
        },
        terra: {
          100: '#FDF5F4',
          200: '#FAEAEA',
          300: '#F2C9C5',
          400: '#E8A09A',
          500: '#C65A52',
          600: '#B24A42',
          700: '#953D36',
          1000: '#7A312B',
        },
        amber: {
          50:  '#FDF8EF',
          100: '#FAF0DC',
          200: '#F2DCB0',
          300: '#E8C57A',
          400: '#D99A3D',
          500: '#C48830',
          600: '#A87228',
          700: '#8B5D20',
        },
        forest: {
          700: '#0F5146',
          800: '#0A3D35',
          900: '#062D27',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        // Landing page motion
        'dash-flow': 'dashFlow 1.6s linear infinite',
        'node-pulse': 'nodePulse 2.4s ease-in-out infinite',
        'core-pulse': 'corePulse 3.2s ease-in-out infinite',
        'float-soft': 'floatSoft 7s ease-in-out infinite',
        'orbit-spin-slow': 'orbitSpin 42s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        dashFlow: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        nodePulse: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.12)' },
        },
        corePulse: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.08)' },
        },
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        orbitSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(32,37,34,0.06), 0 1px 2px rgba(32,37,34,0.04)',
        'card-md': '0 4px 6px rgba(32,37,34,0.05), 0 2px 4px rgba(32,37,34,0.03)',
        'card-lg': '0 10px 15px rgba(32,37,34,0.08), 0 4px 6px rgba(32,37,34,0.04)',
        'sidebar': '1px 0 0 #DDE5E1',
        'nav': '0 1px 0 #DDE5E1',
        // Landing hero / visual elevation
        'hero': '0 24px 60px -12px rgba(13,27,42,0.16), 0 8px 24px -8px rgba(13,27,42,0.08)',
        'panel': '0 16px 40px -12px rgba(13,27,42,0.14), 0 2px 8px rgba(13,27,42,0.06)',
        'cta': '0 12px 28px -8px rgba(var(--p600-rgb), 0.45)',
      },
    },
  },
  plugins: [],
}
