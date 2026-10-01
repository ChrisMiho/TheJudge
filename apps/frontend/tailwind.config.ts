import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // REQ-206: the Ask a Question composer's "Add in-depth details" pill text (and
      // related 480px-keyed geometry on that page) folds to glyph-only below this width.
      screens: {
        xs: "480px"
      },
      colors: {
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          strong: "rgb(var(--accent-strong) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          contrast: "rgb(var(--accent-contrast) / <alpha-value>)"
        }
      }
    }
  },
  plugins: []
};

export default config;
