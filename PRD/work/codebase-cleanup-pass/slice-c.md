# Slice C — Checks that already pass are switched on

## Status: planned

Depends on: none. Findings: T-06, T-07, T-08, T-09, T-16.

## Goal

Type and lint checks that already pass on the base are switched on, so the clean state stays clean. No product code is edited to satisfy a check.

## Requirements

1. Before editing, record on the base: `npm run typecheck`, `npm run lint`, `npm run format:check` all exit 0; `npm ls pngjs @types/pngjs @types/node` output; a hash of the frontend production bundle (`npm --workspace apps/frontend run build`, then `find apps/frontend/dist -type f | sort | xargs shasum | shasum` or a copy of `dist` to the scratchpad for diffing). Write to `slice-c.evidence.md`.
2. **T-06.** Delete `apps/frontend/src/types/build-card-metadata.d.ts` (a `declare module "*.mjs"` wildcard that `allowJs` makes dead). Confirm typecheck still exits 0.
3. **T-07.** Add to `tsconfig.base.json`: `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `isolatedModules`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`. Add them one at a time; run `npm run typecheck` after each. **A flag that reports even one hit is left off and noted in the evidence log** (rule 8). `verbatimModuleSyntax` is not added.
4. **T-08.** Add `--max-warnings 0` to the `lint` script. Enable the zero-hit rules the probe listed: the ten react-hooks v7 rules; `eqeqeq` with null ignored, `no-else-return`, `object-shorthand`, `no-implicit-coercion`, `no-useless-return`, `no-unneeded-ternary`, `no-lonely-if`, `@typescript-eslint/no-import-type-side-effects`. Enable one at a time; any rule that reports a hit stays off and is noted. Drop the no-op JSON ignore entry (`eslint.config.mjs`, about `:24`).
5. **T-09.** Remove `"semi": false` from `.prettierrc.json`. Do not format any code.
6. **T-16.** Declare `pngjs`, `@types/pngjs` and `@types/node` as `apps/frontend` devDependencies at the versions the lockfile already resolves (read them from `npm ls`). No other version may move; `package-lock.json` changes only by the workspace's declared-dependency entries.
7. Do not touch `tsconfig.node.json`.

## Acceptance criteria

- [ ] C1. `apps/frontend/src/types/build-card-metadata.d.ts` is deleted and typecheck exits 0.
- [ ] C2. Every T-07 flag that reports zero hits is in `tsconfig.base.json`; any flag left off is listed with its hit count in the evidence log.
- [ ] C3. `lint` runs with `--max-warnings 0`; every T-08 rule with zero hits is enabled; any rule left off is listed with its hit count; the no-op JSON ignore is gone.
- [ ] C4. `.prettierrc.json` has no `semi` key.
- [ ] C5. `apps/frontend/package.json` declares `pngjs`, `@types/pngjs` and `@types/node` as devDependencies; `npm ls pngjs @types/pngjs @types/node` shows the same resolved versions as the base.
- [ ] C6. `npm run typecheck` exits 0.
- [ ] C7. `npm run lint` exits 0.
- [ ] C8. `npm run format:check` exits 0.
- [ ] C9. The frontend production bundle is byte-identical before and after (`diff -r` of `apps/frontend/dist`, result in the evidence log).
- [ ] C10. `node --test scripts/ci-workflow-parity.test.mjs` is green.
- [ ] C11. No file outside config, `package.json`/lockfile, and the deleted `.d.ts` changed: `git diff --stat origin/main` lists no `.ts`/`.tsx` product file.

## Verification

```bash
npm run typecheck
npm run lint
npm run format:check
npm ls pngjs @types/pngjs @types/node
npm --workspace apps/frontend run build
node --test scripts/ci-workflow-parity.test.mjs
git diff --stat origin/main
```

## Reverted findings

None yet. Flags and rules left off for a hit go here.

## Files touched

- `apps/frontend/src/types/build-card-metadata.d.ts` (delete)
- `tsconfig.base.json`
- `package.json` (lint script) and/or `apps/frontend/package.json`
- `eslint.config.mjs`
- `.prettierrc.json`
- `package-lock.json`
