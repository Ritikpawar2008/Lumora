/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090909",
        surface: "#171717",
        primary: "#C46A32",
        secondary: "#D4AF37",
      },
    },
  },
  plugins: [],
};