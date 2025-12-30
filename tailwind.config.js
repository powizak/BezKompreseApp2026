/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FFD600', // Bez Komprese Yellow
          dark: '#E5C000',
          contrast: '#111111', // Text color on brand bg
        }
      }
    },
  },
  plugins: [],
}
