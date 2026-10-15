/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        garamond: ['"EB Garamond"', "serif"],
        gwendolyn: ['"Gwendolyn"', "cursive"],
      },
    },
  },
  plugins: [],
};