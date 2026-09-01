import type { Config } from "tailwindcss";

// Palette extracted from the existing site's compiled CSS (Framer export) —
// left unchanged per the "don't touch palette/typography" constraint.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f9f9f9",
        "paper-soft": "#fafaf9",
        "paper-muted": "#f5f4f3",
        ink: "#090909",
        "ink-soft": "#1e1e1e",
        "ink-muted": "#29292b",
        accent: "#ff462e",
        "accent-tint": "#f9d3cd",
        "accent-pale": "#f7e3df",
        stone: "#63615e",
        "stone-light": "#7f7f80",
        line: "#eaeaea",
        "line-strong": "#d9d9d9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
