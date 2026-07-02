import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1A17",
        paper: "#F6EFE2",
        brass: "#B8792F",
        moss: "#596a3d",
        ember: "#C85A3A",
        "night-ink": "#0B1020",
        "deep-navy": "#111827",
        "warm-paper": "#F6EFE2",
        "soft-card": "#FFF8EA",
        "lantern-gold": "#D9A441",
        "aged-brass": "#B8792F",
        "tide-teal": "#2F8F8B",
        "sea-glass": "#A7C7BA",
        "twilight-blue": "#3F5C8A",
        "primary-dark": "#1B1A17",
        "muted-light": "#6F675A",
        "primary-light": "#F6EFE2",
        "muted-dark": "#C9C0AE",
        bloodwick: {
          obsidian: "#120507",
          red: "#E50914",
          white: "#F2F1ED",
          steel: "#6B7078",
          copper: "#B87333",
          panel: "#17070A",
          plum: "#1B080C"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(11, 16, 32, 0.22)",
        "bloodwick-soft": "0 18px 60px rgba(0, 0, 0, 0.36)",
        "bloodwick-red": "0 18px 42px rgba(229, 9, 20, 0.24)"
      },
      borderRadius: {
        bloodwick: "1.25rem",
        "bloodwick-sm": "0.8rem",
        "bloodwick-lg": "1.75rem"
      },
      spacing: {
        "bloodwick-1": "0.375rem",
        "bloodwick-2": "0.75rem",
        "bloodwick-3": "1rem",
        "bloodwick-4": "1.5rem",
        "bloodwick-5": "2rem",
        "bloodwick-6": "3rem"
      }
    }
  },
  plugins: []
};

export default config;
