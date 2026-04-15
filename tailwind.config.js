/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft':    '0 2px 15px -3px rgba(0,0,0,.07), 0 10px 20px -2px rgba(0,0,0,.04)',
        'glow':    '0 0 20px rgba(37,99,235,.25)',
        'glow-lg': '0 0 40px rgba(37,99,235,.3)',
        'card':    '0 1px 3px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,.04), 0 20px 40px rgba(0,0,0,.10)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
        'grid-lines': 'linear-gradient(rgba(100,116,139,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
        'grid-lines': '40px 40px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out',
        'scale-in': 'scale-in .2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
