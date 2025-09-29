/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(100%)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        flashFade: {
          "0%": { backgroundColor: "rgb(250 204 21)" },   // yellow-400
          "100%": { backgroundColor: "rgb(5 150 105 / 0.25)" }, // emerald-600/25
        },
      },
      animation: {
        slideIn: "slideIn 0.4s ease-out",
        flashFade: "flashFade 2s ease-out forwards",
      },
    },
  },
  plugins: [require("daisyui"), require("tailwindcss-rtl")],
};
