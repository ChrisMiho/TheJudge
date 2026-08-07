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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.split("\\").join("/");

          if (
            moduleId.endsWith("/node_modules/react/jsx-runtime.js") ||
            moduleId.includes("/node_modules/react/") ||
            moduleId.includes("/node_modules/react-dom/") ||
            moduleId.includes("/node_modules/react-router/")
          ) {
            return "vendor";
          }

          if (
            moduleId.includes("/src/lib/scan/") ||
            moduleId.endsWith("/src/hooks/useScanCapture.ts") ||
            moduleId.endsWith("/src/components/ScanCameraSurface.tsx") ||
            moduleId.endsWith("/src/components/ScanCardOutline.tsx") ||
            moduleId.endsWith("/src/components/ScanDebugOverlay.tsx")
          ) {
            return "scan";
          }

          return undefined;
        }
      }
    }
  },
  server: {
    port: Number(process.env.FRONTEND_PORT ?? 5173),
    // Fail fast on a collision instead of silently migrating to another port,
    // so thejudge-implement-fanout's preflighted port assignment is trustworthy.
    strictPort: true
  },
  test: {
    // jsdom stays the default, so an unlisted or newly added test file is never
    // silently DOM-less. Files opt *out* below, and only where a full green run
    // proved they need no DOM (DEC-155).
    environment: "jsdom",
    // First match wins. Per DEC-155 these are proven globs, not a blanket
    // directory or extension rule: the jsdom pins below are measured
    // counter-examples that still need a DOM, and every `node` entry either
    // names a file or names a directory whose every test file passed under
    // `node`.
    environmentMatchGlobs: [
      ["src/lib/lifeTracker/useLifeTracker.test.ts", "jsdom"],
      ["src/lib/feedback/FeedbackContextProvider.test.tsx", "jsdom"],
      ["src/lib/portal/seedContext.test.tsx", "jsdom"],
      // Applies a palette to `document`, so it is DOM-bound despite its siblings.
      ["src/lib/theme/applyPalette.test.ts", "jsdom"],

      // Wholly DOM-free directories.
      ["src/lib/scan/**", "node"],
      ["src/lib/contextFlow/**", "node"],
      ["src/lib/conversationHistory/**", "node"],
      ["src/lib/trade/**", "node"],

      // Mixed directories: named files only.
      ["src/lib/feedback/buildFeedbackContext.test.ts", "node"],
      ["src/lib/feedback/submitFeedback.test.ts", "node"],
      ["src/lib/feedback/summarizeFeedbackContext.test.ts", "node"],
      ["src/lib/lifeTracker/persistence.test.ts", "node"],
      ["src/lib/lifeTracker/seatArrangement.test.ts", "node"],
      ["src/lib/lifeTracker/seed.test.ts", "node"],
      ["src/lib/lifeTracker/state.test.ts", "node"],
      ["src/lib/theme/palettes.test.ts", "node"],
      ["src/lib/theme/themePrefs.test.ts", "node"],
      ["src/lib/portal/activeDestinationPrefs.test.ts", "node"],
      ["src/components/trade/oracleSearch.test.ts", "node"],
      ["src/lib/askAiWaitStages.test.ts", "node"],
      ["src/lib/cardIdentityRing.test.ts", "node"],
      ["src/lib/cardRulingsTransformPolicy.test.ts", "node"],
      ["src/lib/deploymentPipeline.test.ts", "node"],
      ["src/lib/env.test.ts", "node"],
      ["src/lib/gameRulesBuildPolicy.test.ts", "node"],
      ["src/lib/metadataTransformPolicy.test.ts", "node"],
      ["src/lib/playerLabels.test.ts", "node"],
      ["src/lib/scryfallRefreshPolicy.test.ts", "node"],
      ["src/lib/search.test.ts", "node"],
      ["src/lib/zoneCards.test.ts", "node"],
      ["src/lib/zoneLabels.test.ts", "node"]
    ],
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
