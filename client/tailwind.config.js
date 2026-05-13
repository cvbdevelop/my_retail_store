/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This links the "font-khmer" class in your code to the Google Font
        khmer: ['"Kantumruy Pro"', 'sans-serif'], 
      }
    },
  },
  plugins: [],
}