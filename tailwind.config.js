/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e5799',
        urgent: '#ef4444',
        normal: '#f59e0b',
        low: '#22c55e',
        panel: {
          bg: '#fff8dc',
          border: '#1e5799',
        }
      }
    },
  },
  plugins: [],
}
