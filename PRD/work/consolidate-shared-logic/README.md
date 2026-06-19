status: active

# Consolidate Shared Logic and Remove Duplication

Codebase cleanup to eliminate accidentally duplicated constants, functions, and logic across the frontend/backend boundary and within individual modules. No behavior changes — refactor only.

> **Re-refined 2026-06-18 (fresh re-derivation against current code).** Findings below were re-checked live, not carried over from the 2026-06-09 snapshot. Since then `prompt-context-retrieval-tuning` (DEC-045/046/047) and the `prompt/preparation.ts` extraction changed the duplication surface. Material updates from the prior version: zone-order now duplicated in **five** places (a third backend copy in `prompt/context.ts`, a frontend non-stack copy in `contextFlow/flow.ts`); the player-labels array is duplicated **twice within `validation/askAiRequest.ts`** (enum + const); finding #4's "functionally identical" truncation claim is **false** (defensive guards differ); `normalization.ts` is now the 485-line prompt-assembly hub (4-way split, not 3); finding #10 is partially stale (AI orchestration already extracted to `useAskAiSubmitOrchestration.ts`). All line numbers below are verified against current code.

## Findings

Grouped by severity. Verified 2026-06-18.

---

### Significant

#### 1. Zone constants and fallback question logic duplicated across apps

| Location | Detail |
| --- | --- |
| `apps/frontend/src/lib/contextFlow/flow.ts:26-27,45-57` | `DEFAULT_STACK_QUESTION`, `DEFAULT_BOARD_QUESTION`, `resolveFallbackQuestion()` |
| `apps/backend/src/prompt/context.ts:4-5,107-117` | Same constants and same algorithm, different type annotations |

Frontend and backend can silently diverge if one side is updated. **Accepted as cross-app debt** (no shared package); each app consolidates only within its own boundary. Backend side moves its fallback constants into `constants.ts` (Slice A).

---

#### 2. Zone order defined in five places

| Location | Variant |
| --- | --- |
| `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts:7` | `CANONICAL_ZONE_ORDER` (incl. stack) |
| `apps/backend/src/prompt/normalization.ts:39` | `CANONICAL_ZONE_ORDER` (incl. stack) |
| `apps/backend/src/cardRulings.ts:38` | `NON_STACK_CANONICAL_ZONE_ORDER` (excludes stack) |
| `apps/backend/src/prompt/context.ts:7` | `NON_STACK_CANONICAL_ZONE_ORDER` (excludes stack) — **added by retrieval work** |
| `apps/frontend/src/lib/contextFlow/flow.ts:29` | `NON_STACK_ZONES_WITH_OWNER` (excludes stack) — frontend |

The original analysis listed three; two more have crept in. Backend now has the non-stack variant in **two** files. Recommendation: single backend `constants.ts`; derive the non-stack variant from the canonical one by filter. Frontend stays separate (accepted cross-app debt) but is noted for awareness.

---

#### 3. Player display formatting duplicated across apps

| Frontend | Backend |
| --- | --- |
| `apps/frontend/src/lib/playerLabels.ts:3` — `formatPlayerDisplayLabel()` | `apps/backend/src/prompt/normalization.ts:125` — `formatPlayerRef()` |
| `apps/frontend/src/lib/playerLabels.ts:12` — `buildPlayerDisplayNameMap()` | `apps/backend/src/prompt/normalization.ts:113` — `buildPlayerDisplayNameLookup()` |

Identical algorithm: trim display name, check length, fall back to label, format with parentheses. **Accepted cross-app debt.** Slice C audits frontend consumers to ensure they use `playerLabels.ts` rather than re-inlining (finding only).

---

#### 4. Truncation logic duplicated within the backend — *and not identical*

| Location | Function |
| --- | --- |
| `apps/backend/src/prompt/normalization.ts:71-78` | `truncateOracleText()` |
| `apps/backend/src/cardRulings.ts:48-64` | `truncateWithSuffix()` |

Originally flagged as "functionally identical" — **this is now false.** `truncateWithSuffix` guards `maxChars <= 0` (returns `""`) and `maxChars <= suffix.length` (returns `suffix.slice(0, maxChars)`); `truncateOracleText` lacks both and can return a string longer than `maxChars` at tiny budgets. Collapse keeps a single shared helper with the **defensive (superset) semantics**; `cardRulings.ts` imports it. Observable output is unchanged today (all `MAX_*` ≥ 100k, so the guarded branches never fire), so this is a safe-superset consolidation, not a behavior change.

---

#### 5. `EnrichmentStep.tsx` is 689 lines with mixed concerns

File mixes UI rendering, ~9 `useState` hooks, memoization, input validation, and data transformation. Embedded utilities: `parseManaSpent()` (`:47`), `formatContextTarget()` (`:54`), `hasOwnerControl()` (`:63`). Recommendation: extract utilities to `lib/enrichmentFormat.ts` and the pending-target state cluster to `hooks/useEnrichmentTargets.ts`.

---

### Moderate

#### 6. Player labels array hardcoded across backend (4 copies, 2 in one file)

| Location |
| --- |
| `apps/backend/src/validation/askAiRequest.ts:5-14` — `playerLabelSchema` (`z.enum`) |
| `apps/backend/src/validation/askAiRequest.ts:15-24` — `orderedPlayerLabels` const (**second copy, same file**) |
| `apps/backend/src/prompt/normalization.ts:20-29` — `PLAYER_LABEL_ORDER` |
| `apps/backend/src/test-utils/requestBuilders.ts:4-13` (see finding #9) |

Recommendation: define `PLAYER_LABELS` once in `constants.ts`; `playerLabelSchema = z.enum(PLAYER_LABELS)`; remove `orderedPlayerLabels`; import everywhere. One array is both the type source and the validation source.

---

#### 7. Two near-identical rulings resolution functions in `cardRulings.ts`

`resolveRulingsForPrompt()` (`:154-197`) and `resolveRulingsForPromptWithDebug()` (`:199-257`) share the same core algorithm; the debug variant is a strict superset that also collects trace. Both are exported and both are used (`prompt/preparation.ts:62` and `:90`). Recommendation: single function with an optional debug flag.

---

#### 8. `normalization.ts` (485 lines) is now the prompt-assembly hub

Mixes pure text normalization, every prompt section formatter (including the new game-rules / supplemental-rules / conversation-history formatters), prompt diagnostics, budget constants, and the `buildPromptText` orchestrator. Recommendation: 4-way split — `normalization.ts` (text helpers + budget constants), `promptFormatting.ts` (formatters), `promptDiagnostics.ts` (diagnostics), `promptAssembly.ts` (`buildPromptText`).

---

### Minor

#### 9. Player labels hardcoded a fourth time in test utilities

`apps/backend/src/test-utils/requestBuilders.ts:4-13` — another copy of the player-label array. Recommendation: import `PLAYER_LABELS` from `constants.ts`.

#### 10. `App.tsx` is 581 lines — partially addressed

AI/conversation orchestration already lives in `hooks/useAskAiSubmitOrchestration.ts:40` (used at `App.tsx:133`). Remaining bulk is game-setup state (players, life totals, display names, zones, phase). **Deferred** — lower priority and the orchestration extraction it originally called for is largely done.

#### 11. No shared types between apps

Frontend duplicates some type definitions that originate in the backend. Low urgency given the separate-package structure; noted for future maintenance.

---

## Summary Table

| # | Finding | Severity | Action this package |
|---|---------|----------|---------------------|
| 1 | Zone/question constants duplicated FE↔BE | Significant | Backend-side into `constants.ts`; cross-app debt accepted |
| 2 | Zone order in five places | Significant | Single backend definition; derive non-stack variant |
| 3 | Player formatting duplicated FE↔BE | Significant | Accepted debt; Slice C audit only |
| 4 | Truncation duplicated in backend (not identical) | Significant | Single defensive shared helper; `cardRulings` imports it |
| 5 | `EnrichmentStep.tsx` 689 lines, mixed concerns | Significant | Extract utils + pending-target hook |
| 6 | Player labels array ×4 (×2 in one file) | Moderate | `PLAYER_LABELS` in `constants.ts`; enum derives from it |
| 7 | Two near-identical rulings functions | Moderate | Single function with optional debug flag |
| 8 | `normalization.ts` is the 485-line prompt hub | Moderate | 4-way split |
| 9 | Player labels hardcoded in test utilities too | Minor | Import from `constants.ts` |
| 10 | `App.tsx` 581 lines | Minor | Deferred (orchestration already extracted) |
| 11 | No shared types between apps | Minor | Note for future |

---

## Implementation map

| Slice | Doc | Scope | Parallel? | Blocked by | Status |
| --- | --- | --- | --- | --- | --- |
| A | `slice-a-backend-constants.md` | Backend constants: `constants.ts`; consolidate `PLAYER_LABELS`, `CANONICAL_ZONE_ORDER`, derive non-stack, fallback strings; collapse truncation to defensive shared helper | Yes — parallel to C | — | planned |
| B | `slice-b-normalization-split.md` | Backend module split: `prompt/normalization.ts` → 4 files (`normalization` / `promptFormatting` / `promptDiagnostics` / `promptAssembly`) | After A; parallel to D | A | planned |
| C | `slice-c-frontend-extraction.md` | Frontend: extract `EnrichmentStep.tsx` utils → `lib/enrichmentFormat.ts` + pending-target state → `hooks/useEnrichmentTargets.ts`; audit `playerLabels.ts` usage (finding only) | Yes — parallel to A | — | planned |
| D | `slice-d-rulings-collapse.md` | Rulings collapse: merge the two resolve functions → single overload + optional debug flag | After A; parallel to B | A | planned |
| E | `slice-e-ship.md` | Ship gates; add reuse-before-create rule; quality gate; promotion prep | — | B + C + D | planned |

## Docs in this folder

| Doc | Purpose |
| --- | --- |
| `IDEA.md` | Problem, outcome, non-goals |
| `README.md` | Full findings, summary table, implementation map (this file) |
| `DESIGN-BRIEF.md` | Scope, decisions, slice decomposition |
| `GAMEPLAN.md` | Architecture, dependency DAG, execution plan — regenerated 2026-06-18 at map-out against current code |
| `slice-*.md` | Per-slice implementation docs (A–E) — regenerated 2026-06-18 at map-out; line numbers verified live |
