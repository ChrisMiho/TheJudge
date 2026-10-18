import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)",
          strong: "color-mix(in srgb, var(--accent-strong) calc(<alpha-value> * 100%), transparent)",
          soft: "color-mix(in srgb, var(--accent-soft) calc(<alpha-value> * 100%), transparent)"
        }
      }
    }
  },
  // Nothing here uses Tailwind's `container` class, so it is not emitted.
  corePlugins: { container: false },
  plugins: []
};

export default config;
