/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FDF4F4",
          100: "#FBE6E5",
          200: "#F6C7C5",
          300: "#EE9E9A",
          400: "#E36C67",
          500: "#C5453E", // Primary Brand Color
          DEFAULT: "#C5453E",
          600: "#A9322C",
          700: "#862520",
          800: "#651A16",
          950: "#380D0A",
        },
      },
    },
  },
  plugins: [],
};
