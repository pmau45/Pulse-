/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pulse-bg': '#0A0A0F',
        'pulse-surface': '#14141F',
        'pulse-primary': '#00F0FF',
        'pulse-accent': '#FF2E9E',
        'pulse-live': '#39FF14',
        'pulse-text': '#F0F4FF',
        'pulse-text-muted': '#A0A8C0',
        'pulse-timer': '#FF9500',
      },
      boxShadow: {
        'pulse-glow': '0 0 25px -5px rgb(0 240 255)',
        'pulse-heat': '0 0 25px -5px rgb(255 46 158)',
      },
    },
  },
  plugins: [],
};
