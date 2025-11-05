/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background-color)',
        surface: 'var(--surface-color)',
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        danger: 'var(--danger-color)',
        'text-primary': 'var(--text-color)',
        'text-secondary': 'var(--text-secondary-color)',
        'border-color': 'var(--border-color)',
        risk: {
          low: 'var(--risk-low)',
          medium: 'var(--risk-medium)',
          high: 'var(--risk-high)',
          critical: 'var(--risk-critical)',
        }
      }
    }
  },
  plugins: [],
}
