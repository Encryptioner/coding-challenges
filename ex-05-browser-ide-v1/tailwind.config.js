/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1e1e1e',
        'sidebar-bg': '#252526',
        'statusbar-bg': '#007acc',
        'tab-bg': '#2d2d2d',
        'border': '#3e3e3e',
      },
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
