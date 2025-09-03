/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sesp: {
          blue: '#003366',
          lightBlue: '#0066CC',
          gray: '#F5F7FA',
          darkGray: '#6B7280',
        }
      },
      gridTemplateRows: {
        'dashboard': '10vh 30vh 30vh 30vh',
      },
      gridTemplateColumns: {
        'dashboard': '1fr 1fr 1fr',
      }
    },
  },
  plugins: [],
}