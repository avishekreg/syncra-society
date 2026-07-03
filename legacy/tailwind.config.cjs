/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        syncra: {
          bg: '#FFFFFF',
          surface: '#F4F5F7',
          'surface-alt': '#FAFBFC',
          primary: '#1A365D',
          blue: '#0052CC',
          accent: '#00B4D8',
          action: '#FF8C00',
          'action-alt': '#FF6B6B',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'accent-glow': '0 0 20px rgba(0, 180, 216, 0.12)',
      },
    },
  },
}
