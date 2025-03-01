/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            light: '#4da6ff',
            DEFAULT: '#0080ff',
            dark: '#0066cc',
          },
          secondary: {
            light: '#f8f9fa',
            DEFAULT: '#e9ecef',
            dark: '#dee2e6',
          }
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        }
      },
    },
    plugins: [],
  }