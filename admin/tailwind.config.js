/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B7B78',
          dark: '#0A4F4D',
          light: '#33C7C9',
          accent: '#FF9800',
          50: '#EEF7F6',
          100: '#D6ECEA',
          600: '#0B7B78',
          700: '#0A6361',
          800: '#0A4F4D',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 53, 52, 0.04), 0 1px 3px rgba(10, 53, 52, 0.06)',
        'card-hover':
          '0 4px 12px rgba(10, 53, 52, 0.08), 0 2px 6px rgba(10, 53, 52, 0.06)',
        soft: '0 10px 30px -12px rgba(10, 53, 52, 0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
