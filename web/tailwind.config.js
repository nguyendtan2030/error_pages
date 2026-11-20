/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0b13',
        surface: 'rgba(22, 19, 32, 0.72)',
        text: '#f8fafc',
        muted: '#a3b0c2',
        teal: '#2dd4bf',
        violet: '#8b5cf6',
        'violet-text': '#a78bfa',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
