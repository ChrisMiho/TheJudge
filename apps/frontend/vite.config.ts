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
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    // Fail fast on a collision instead of silently migrating to another port,
    // so thejudge-implement-fanout's preflighted port assignment is trustworthy.
    strictPort: true
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    // Pinned so a developer's local .env cannot decide test outcomes. env.ts reads
    // this at module scope, so a real value there makes the "feedback delivery is
    // unconfigured" assertions fail locally while passing in CI. Tests that need a
    // configured id should stub it explicitly rather than inherit one.
    env: {
      VITE_FEEDBACK_FORMSPREE_ID: ""
    },
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
