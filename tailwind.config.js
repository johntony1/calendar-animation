/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "2.5": "2.5px",
      },
      boxShadow: {
        card: "0px 4px 8px -2px rgba(51,51,51,0.06), 0px 2px 4px 0px rgba(51,51,51,0.04), 0px 1px 2px 0px rgba(51,51,51,0.04), 0px 0px 0px 1px #f5f5f5",
        "card-inner": "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)",
        checkbox: "0px 2px 2px 0px rgba(27,28,29,0.12)",
      },
    },
  },
  plugins: [],
};
