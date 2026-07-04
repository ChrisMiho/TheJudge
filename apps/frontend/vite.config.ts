import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Bridge the single ASK_AI_PROVIDER source of truth into the client bundle.
    // vite only auto-injects VITE_-prefixed vars from .env files, not from
    // process.env, so we forward it explicitly. A directly set
    // VITE_ASK_AI_PROVIDER is honored as an override.
    "import.meta.env.VITE_ASK_AI_PROVIDER": JSON.stringify(
      process.env.VITE_ASK_AI_PROVIDER ?? process.env.ASK_AI_PROVIDER ?? ""
    )
  },
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.test.{ts,tsx}", "src/types/**"],
      thresholds: {
        lines: 45
      }
    }
  }
});
