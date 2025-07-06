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
      screens: {
        'xs': '475px',
        'touch': {'raw': '(hover: none) and (pointer: coarse)'},
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
} 