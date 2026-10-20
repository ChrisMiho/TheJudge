import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      ".worktrees/**",
      // Git-ignored local output (the browser smoke check builds the site here): never product code.
      ".tmp/**",
      "**/.claude/worktrees/**",
      // Git-ignored local output (the model-training Python environment, scoring results): never product code.
      "output/**",
      // Product docs plus probe/work-package scratch tooling, never product
      // code; prettier already ignores it (.prettierignore).
      "PRD/**",
      // Static design mockups (plain browser scripts, no build): kept design
      // art the owner clicks through, never product code. Prettier ignores
      // them too (.prettierignore).
      "docs/design/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Core rules that had zero hits repo-wide when switched on, so the clean state stays clean.
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-else-return": "error",
      "object-shorthand": "error",
      "no-implicit-coercion": "error",
      "no-useless-return": "error",
      "no-unneeded-ternary": "error",
      "no-lonely-if": "error"
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "preserve-caught-error": "off"
    }
  },
  {
    files: ["apps/frontend/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // React Compiler rules (react-hooks v7) that had zero hits on apps/frontend/src.
      "react-hooks/static-components": "error",
      "react-hooks/use-memo": "error",
      "react-hooks/void-use-memo": "error",
      "react-hooks/preserve-manual-memoization": "error",
      "react-hooks/incompatible-library": "error",
      "react-hooks/globals": "error",
      "react-hooks/error-boundaries": "error",
      "react-hooks/purity": "error",
      "react-hooks/set-state-in-render": "error",
      "react-hooks/unsupported-syntax": "error",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
    }
  },
  {
    files: ["apps/backend/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    languageOptions: {
      globals: globals.vitest
    }
  },
  eslintConfigPrettier
)
