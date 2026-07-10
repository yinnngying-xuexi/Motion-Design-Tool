import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        ink: "#06111f",
        panel: "#0d1b2f",
        cyan: "#00e5ff",
        cobalt: "#2c5ef5"
      }
    }
  },
  plugins: []
} satisfies Config;
