import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        sans:    ['"DM Sans"', "sans-serif"],
        mono:    ['"DM Mono"', "monospace"],
      },
      colors: {
        page:        "var(--color-page)",
        grid:        "var(--color-grid)",
        card:        "var(--color-card)",
        "card-light":"var(--color-card-light)",
        ink:         "var(--color-ink)",
        muted:       "var(--color-muted)",
        terracotta:  "var(--color-terracotta)",
        rule:        "var(--color-rule)",
        "badge-border": "var(--color-badge-border)",
        dashed:      "var(--color-dashed)",
      },
    },
  },
  plugins: [],
};

export default config;
