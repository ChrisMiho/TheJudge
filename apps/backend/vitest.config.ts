import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/eval/fixtures/**",
        "src/test-utils/**",
        "src/**/*.test.ts",
        "src/types/**"
      ],
      thresholds: {
        lines: 45,
        "src/prompt/**": { lines: 60 },
        "src/validation/**": { lines: 60 }
      }
    }
  }
});
