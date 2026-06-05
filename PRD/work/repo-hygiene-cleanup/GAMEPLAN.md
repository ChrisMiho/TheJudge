# Gameplan — Repo hygiene & test coverage

## Overview

TheJudge is a flow-validation MTG stack assistant (UX Wave 2 in progress). This package cleans up empty scaffolds, orphaned MVP1 UI, organizational drift, and adds Vitest coverage gates — without changing API contracts or prompt semantics.

**Human decisions:**

| Topic | Choice |
|-------|--------|
| Legacy cleanup | Delete zero-impact items first; aggressive-but-sensible strategy for remainder |
| Backend layout | Reorganize from flat `src/*.ts` into layered folders |
| Coverage | Vitest coverage + conservative CI thresholds (~50% lines; higher on prompt/validation) |
| Flow navigation | Unify step ID to `game-context`; wire `getNextStep` / `getPreviousStep` in App |

## Non-goals

- `AskAiRequest` / Zod schema changes
- New HTTP routes or rules-engine behavior
- E2E / Playwright
- `scripts/*.mjs` coverage (except existing metadata policy test)
- Other `PRD/work/` packages

---

## Baseline (Slice 0 — 2026-06-04)

| Check | Result |
|-------|--------|
| `npm run quality:check` | **PASS** (typecheck, lint, format, 144 frontend + 67 backend tests) |
| Frontend test files | 12 |
| Backend test files | 8 |
| Coverage tooling | `@vitest/coverage-v8@2.1.9`; frontend **94.18%** lines, backend **92.2%** lines (threshold floor 45%) |

### Backend module line counts (pre-reorg)

| Cluster | Files | ~Lines |
|---------|-------|--------|
| prompt | promptContext, promptNormalization, promptPreparation, promptMtgReference | ~703 |
| app | app.ts | 189 |
| validation | validation.ts | 221 |
| providers | askAiProvider, mock/openai/create | ~122 |
| config + bootstrap | config, index | ~162 |

### Legacy remainder matrix

| Asset | Status | Depends on | Delete risk |
|-------|--------|------------|-------------|
| Orphan components | unused | each other | **low** — delete in Slice 1 |
| Empty scaffold dirs | empty | none | **low** |
| `stackState.ts` body | test-only | `stackState.test.ts`, constants in `zoneCards` | **medium** — keep constants |
| Legacy `types.ts` block | comment-marked | orphan components + stackState | **medium** — Slice 4 |
| `syncZonesToLegacyStackAndBattlefield` | test-only | `zoneCards.test.ts` | **low** — Slice 4 |
| `contextFlow/steps.ts` dead exports | partially unused | App navigation | **medium** — unify + wire Slice 4 |
| `mockAskAi.ts` | active | mockAskAiProvider | **do not delete** |

---

## Target layouts

### Backend

```
apps/backend/src/
  index.ts
  app/createApp.ts, app/errorHandler.ts
  routes/health.ts, routes/askAi.ts
  config/index.ts
  types/index.ts
  validation/askAiRequest.ts
  prompt/context.ts, normalization.ts, preparation.ts, mtgReference.ts
  providers/
  eval/
  errors.ts, logging.ts, mockAskAi.ts
  test-utils/
```

### Frontend

```
apps/frontend/src/
  components/     # active zone-flow only
  hooks/          # useAutocomplete*, useAskAiSubmitOrchestration
  lib/contextFlow/, search.ts, zoneCards.ts, zoneLabels.ts, ...
  types.ts        # zone contract only (post Slice 4)
  test/setup.ts
```

**Data paths (documented, not `src/data/`):**

- Runtime metadata: `public/data/cardMetadata.json`
- Scryfall raw input (gitignored): `apps/frontend/data/scryfall/default-cards.json`

---

## Slice checklist

### Slice 1 — Zero-risk cleanup

- [x] Delete empty dirs: `backend/src/{routes,services,types,validation}`, `frontend/src/{hooks,utils,data}`
- [x] Delete orphan components: StackBuilderStep, BattlefieldStep, TargetEditor
- [x] Remove `public/.gitkeep` if redundant
- [x] Fix README empty-state asset line → `cats-homescreen.png`

**Verify:** `npm run quality:check`

### Slice 2 — Backend reorganization

- [x] Move modules per target layout; preserve ESM `.js` suffixes
- [x] Extract routes + error handler from monolithic `app.ts`
- [x] Colocate tests with modules
- [x] Update `providers/README.md` import paths

**Verify:** `npm run quality:check` + `npm --workspace apps/backend run test:eval`

### Slice 3 — Frontend organization

- [x] Create `hooks/`; move `use*.ts` + tests from `lib/`
- [x] Update imports in App + components

**Verify:** `npm run quality:check`

### Slice 4 — Legacy remainder

- [x] Rename `game-setup` → `game-context` in contextFlow
- [x] Wire App to `FlowStepId`, `getNextStep`, `getPreviousStep`
- [x] Trim `stackState.ts` to constants only (`stackLimits.ts`)
- [x] Remove legacy types block from `types.ts`
- [x] Remove `syncZonesToLegacyStackAndBattlefield`
- [x] Rename `App.story-074.test.tsx` → `App.zoneFlow.test.tsx`
- [x] Add `steps.test.ts`

**Verify:** `npm run quality:check` + manual `npm run dev` smoke

### Slice 5 — Coverage tooling

- [x] Add `@vitest/coverage-v8` to both workspaces
- [x] `test:coverage` scripts + root `coverage:check`
- [x] Fold coverage into `quality:check`
- [x] Conservative thresholds: workspace floor max(45%, baseline-2%); prompt+validation max(60%, local-2%)
- [x] Gap-fill: validation, errors, openAi provider, useAutocompleteKeyboard, zoneLabels

**Verify:** `npm run quality:check`

### Slice 6 — Closeout

- [x] Update root README repository layout
- [x] Update backend providers README if needed
- [x] Retain this work folder as implementation record

---

## Coverage policy

**Excludes:** `eval/fixtures/**`, `test/**`, `test-utils/**`, `*.d.ts`

**Thresholds (conservative):** measure after Slices 1–4; set floors at baseline − 2%, min 45% per workspace; backend `prompt/` + `validation/` min 60%.

**Gap-fill priority:** validation → errors → openAiResponsesProvider → useAutocompleteKeyboard → zoneLabels → components only if needed for floor.

---

## Risks & rollback

- Revert per-slice commits if quality gate fails
- Eval goldens: update only with `UPDATE_CONTEXT_EVAL_FIXTURES=1` for intentional prompt changes
- Backend import path churn: run full `quality:check` after each slice

---

## Commands

```bash
npm run quality:check
npm --workspace apps/backend run test:eval
npm run dev
npm run coverage:check
```
