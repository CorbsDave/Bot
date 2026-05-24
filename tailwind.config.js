/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./md-assistant.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        steel: '#1B3A5C',
        'amber-brand': '#F5A623',
        'cyan-brand': '#0EA5E9',
        'slate-brand': '#64748B',
        light: '#CBD5E1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
