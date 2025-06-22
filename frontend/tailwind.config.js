/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        skin: {
          text: 'var(--color-text)',
          'text-muted': 'var(--color-text-muted)',
          bg: 'var(--color-bg)',
          'bg-accent': 'var(--color-bg-accent)',
          border: 'var(--color-border)',
          'btn-primary': 'var(--color-btn-primary)',
          'btn-primary-text': 'var(--color-btn-primary-text)',
          accent: 'var(--color-accent)',
          'accent-light': 'var(--color-accent-light)',
          'accent-dark': 'var(--color-accent-dark)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} 