/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50', // Green for health
        secondary: '#FF9800', // Orange for energy
        accent: '#03A9F4', // Blue for calmness
        background: '#F3F4F6', // Light gray for a clean look
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};