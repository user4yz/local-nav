import { heroui } from "@heroui/theme";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slateglass: "rgba(255,255,255,0.06)"
      },
      boxShadow: {
        glass: "0 8px 24px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: [heroui()]
};