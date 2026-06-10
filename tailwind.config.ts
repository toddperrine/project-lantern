import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171412",
        paper: "#fffaf2",
        brass: "#9b6b2f",
        moss: "#596a3d",
        ember: "#bb5a3c"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(41, 29, 18, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
