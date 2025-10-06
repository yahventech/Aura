/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5faff",
          100: "#e0f2ff",
          200: "#b8e0ff",
          300: "#7fc6ff",
          400: "#3fa9ff",
          500: "#1e90ff",
          600: "#1874d1",
          700: "#125aa3",
          800: "#0c4075",
          900: "#062647",
        },
      },
    },
  },
  plugins: [],
}
