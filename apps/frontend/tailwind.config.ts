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
          DEFAULT: "color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)",
          strong: "color-mix(in srgb, var(--accent-strong) calc(<alpha-value> * 100%), transparent)",
          soft: "color-mix(in srgb, var(--accent-soft) calc(<alpha-value> * 100%), transparent)",
          contrast: "color-mix(in srgb, var(--accent-contrast) calc(<alpha-value> * 100%), transparent)"
        }
      }
    }
  },
  plugins: []
};

export default config;
