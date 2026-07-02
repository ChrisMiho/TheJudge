# Slice A — Build-time mock signal (vite bridge + env resolver)

## Status: planned

## Goal

Surface the single `ASK_AI_PROVIDER` source of truth to the client bundle and
resolve it to an authoritative `isMockProvider` boolean, mirroring the existing
`resolveDebugLoggingEnabled` pattern. No UI in this slice.

## Requirements

1. Add a `define` block to `apps/frontend/vite.config.ts` that bridges the build
   env into the client as `import.meta.env.VITE_ASK_AI_PROVIDER`, with a directly
   set `VITE_ASK_AI_PROVIDER` honored as an explicit override:
   `"import.meta.env.VITE_ASK_AI_PROVIDER": JSON.stringify(process.env.VITE_ASK_AI_PROVIDER ?? process.env.ASK_AI_PROVIDER ?? "")`.
2. Add `resolveIsMockProvider(rawValue: string | undefined): boolean` to
   `apps/frontend/src/lib/env.ts`: trimmed/lower-cased `"mock"` → `true`; every
   other value (`"openai"`, empty, `undefined`, unrecognized) → `false`. Does
   not throw. Does not read `DEV`/`MODE`/`NODE_ENV`/host/answer text.
3. Export a module-level constant
   `export const isMockProvider = resolveIsMockProvider(import.meta.env.VITE_ASK_AI_PROVIDER);`
   alongside the existing `apiBaseUrl` / `debugLoggingEnabled` exports.
4. Extend `apps/frontend/src/lib/env.test.ts` with `resolveIsMockProvider` cases:
   `mock` → true; `openai` → false; empty string → false; `undefined` → false;
   an unrecognized value → false; mixed-case/whitespace (` Mock `) → true. The
   override behavior is exercised at the vite layer (verified manually per
   GAMEPLAN) since `import.meta.env` substitution is build-time.

## Acceptance criteria

- [ ] `vite.config.ts` defines `import.meta.env.VITE_ASK_AI_PROVIDER` from
  `process.env.VITE_ASK_AI_PROVIDER ?? process.env.ASK_AI_PROVIDER ?? ""`
- [ ] `resolveIsMockProvider` returns `true` only for `"mock"` (case/space
  insensitive) and `false` for all other inputs, never throwing
- [ ] `isMockProvider` is exported from `env.ts` and derived solely from
  `import.meta.env.VITE_ASK_AI_PROVIDER`
- [ ] No provider-mode parsing is duplicated elsewhere; resolver lives only in
  `env.ts`
- [ ] `npm run test --workspace apps/frontend -- env.test` passes with the new
  cases

## Verification

```bash
npm run test --workspace apps/frontend -- src/lib/env.test.ts
npm run quality:check
```

## Files touched

- `apps/frontend/vite.config.ts`
- `apps/frontend/src/lib/env.ts`
- `apps/frontend/src/lib/env.test.ts`
