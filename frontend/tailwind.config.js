/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          700: '#B91C2C', // Primary red
          900: '#7F1D1D', // Burgundy
        }
      }
    },
  },
  plugins: [],
}
