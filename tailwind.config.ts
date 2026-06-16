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
        "muted-dark": "#C9C0AE"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(11, 16, 32, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
