/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // ← это ключевое — Tailwind ищет классы во всех файлах src
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',  // твой основной синий
      },
    },
  },
  plugins: [],
}