# Slice C evidence

## Baseline (tip after slice B, 2026-10-18)

- `npm run typecheck`, `npm run lint`, `npm run format:check` all exit 0. `eslint` reports 0 warnings, 0 errors.
- `npm ls pngjs @types/pngjs @types/node`: `pngjs@7.0.0` and `@types/pngjs@6.0.5` (root only), `@types/node@22.20.1` (backend, frontend via vite). Saved before/after in the scratch folder.
- Frontend production build exits 0. Hash of `find apps/frontend/dist -type f | sort | xargs shasum | shasum`: `ef7bf6511afb9de9d5eb05ec36dec621b4a38b0f`. A copy of `dist` was kept for `diff -r`.

## Changes and per-flag results

- T-06: `apps/frontend/src/types/build-card-metadata.d.ts` deleted; typecheck still exits 0.
- T-07: each flag was tried alone against both projects (`tsc -p ... --noEmit <flag>`) before being added. Hit counts: `noImplicitReturns` 0, `noFallthroughCasesInSwitch` 0, `noImplicitOverride` 0, `isolatedModules` 0, `noUncheckedSideEffectImports` 0, `allowUnreachableCode: false` 0, `allowUnusedLabels: false` 0. All seven are in `tsconfig.base.json`. `verbatimModuleSyntax` not added. `tsconfig.node.json` not touched (none exists).
- T-08: all rules enabled together; the JSON report of `eslint .` lists hits per rule id: none. Enabled: `react-hooks/{static-components,use-memo,void-use-memo,preserve-manual-memoization,incompatible-library,globals,error-boundaries,purity,set-state-in-render,unsupported-syntax}` as errors (frontend source block), `eqeqeq` (null ignored), `no-else-return`, `object-shorthand`, `no-implicit-coercion`, `no-useless-return`, `no-unneeded-ternary`, `no-lonely-if`, `@typescript-eslint/no-import-type-side-effects`. No rule left off. `lint` is now `eslint . --max-warnings 0`. The no-op `apps/frontend/data/scryfall/default-cards.json` ignore entry is removed.
- T-09: `"semi": false` removed from `.prettierrc.json`; `format:check` exits 0; no code reformatted.
- T-16: `apps/frontend/package.json` devDependencies gain `@types/node` `^22.10.2` (same range as the backend), `@types/pngjs` `^6.0.5`, `pngjs` `^7.0.0` (same ranges as the root). `npm install --package-lock-only --offline` changed `package-lock.json` by exactly those three workspace entries. `npm ci` succeeds; `npm ls pngjs @types/pngjs @types/node` resolves the same versions (the only difference is that the frontend now lists them as deduped).

## After

- `npm run typecheck`, `npm run lint`, `npm run format:check` exit 0. `node --test scripts/ci-workflow-parity.test.mjs`: 5 passed.
- Production build exits 0; `diff -r` of `dist` before and after printed nothing; hash `ef7bf6511afb9de9d5eb05ec36dec621b4a38b0f` (unchanged). The build prints two CSS-syntax warnings both before and after; they belong to slice J.
- This slice's change set (`git diff --stat HEAD` before commit) is: `.prettierrc.json`, `apps/frontend/package.json`, the deleted `.d.ts`, `eslint.config.mjs`, `package-lock.json`, `package.json`, `tsconfig.base.json`. No `.ts`/`.tsx` product file changed.

## Dated observations (manual criteria)

2026-10-18 C9 — frontend production bundle byte-identical: `diff -r` of the pre-change `dist` copy against the rebuilt `apps/frontend/dist` printed nothing; both hash to `ef7bf6511afb9de9d5eb05ec36dec621b4a38b0f`.

## Reverted findings

None.
