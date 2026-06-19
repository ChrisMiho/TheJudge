# Design Brief — Consolidate Shared Logic and Remove Duplication

> **Re-refined 2026-06-18 (fresh re-derivation).** All findings were re-checked against current code, not the 2026-06-09 snapshot. The retrieval work (`prompt-context-retrieval-tuning`, DEC-045/046/047) and the `preparation.ts` extraction changed the duplication surface: a third zone-order copy appeared in `prompt/context.ts`, a frontend non-stack copy in `contextFlow/flow.ts`, and `normalization.ts` grew into the prompt-assembly hub (485 lines). One prior "functionally identical" claim (finding #4) is now false. Line numbers below are verified live.

## Scope

Pure refactor. Zero behavior changes. Zero API or prompt contract changes. No new product features. Re-derived findings are consolidated **within each app's boundary**; cross-app FE↔BE mirroring stays accepted debt (no shared npm package).

## Decisions referenced

- DEC-013 — backend must not implement legality validation or rules simulation; scope stays narrow
- DEC-020 — HTTP contract frozen; request/response shapes unchanged
- DEC-021 — `GameContext` model unchanged
- DEC-042 — `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` exported from `prompt/normalization.ts`; budget/diagnostic infrastructure preserved (this brief keeps that export point intact)
- `technical-design-rules.md` — keep backend intentionally small; no extra endpoints; no shared npm package; **reuse-before-create** (new bullet added by this work package)

## Non-goals

- No new product features or behavior changes
- No changes to prompt content, API contracts, or request/response shapes
- No creation of a shared npm package between frontend and backend
- No frontend/backend unification of normalization strategies (search vs. prompt building serve different purposes)
- No changes to test coverage thresholds beyond what cleanup naturally produces
- Cross-app FE↔BE duplication (fallback-question constants, player display formatting) — accepted debt; each app consolidates only within its own boundary
- `App.tsx` orchestration extraction (finding #10) — deferred; AI/conversation orchestration already lives in `hooks/useAskAiSubmitOrchestration.ts`, and the remaining bulk is game-setup state

## Design decisions

### Reuse-before-create rule (instructions update)

Add one bullet to `instructions/technical-design-rules.md` under a behavior heading:

> **Reuse before creating.** Before writing a new constant, helper, or type, search for an existing one and reuse or extend it rather than re-implementing. Shared logic must have a single authoritative definition imported wherever needed — duplicated constants/functions across files or the FE↔BE boundary are a defect, not a style preference.

Rationale: the *behavior* (search/reuse/extend first) is the cause; the *single-definition invariant* is the checkable effect. Stating both gives agents an action and reviewers a check. This is the rule whose absence let the zone-order constant re-duplicate into five places.

### Backend constants module (Slice A)

Create `apps/backend/src/constants.ts` as a **dependency-free leaf module** — no `zod`, no `prompt/` imports — so validation, prompt, and rulings layers can all consume it without coupling.

Consolidate into it:
- `PLAYER_LABELS` — readonly tuple (`Player 1`…`Player 8`); **the** single source of truth. Currently duplicated across `validation/askAiRequest.ts:5-14` (the `playerLabelSchema` enum) **and** `:15-24` (the `orderedPlayerLabels` const — second copy in the same file), `prompt/normalization.ts:20-29` (`PLAYER_LABEL_ORDER`), and `test-utils/requestBuilders.ts:4-13`.
- `CANONICAL_ZONE_ORDER` — 7 zones incl. stack; currently `prompt/normalization.ts:39` (and mirrored frontend-side at `phaseZoneDefaults.ts:7`).
- `NON_STACK_CANONICAL_ZONE_ORDER` — **derived** via `CANONICAL_ZONE_ORDER.filter(z => z !== "stack")`, not re-listed; currently duplicated at `cardRulings.ts:38` **and** `prompt/context.ts:7` (the latter added by the retrieval work).
- `DEFAULT_STACK_QUESTION`, `DEFAULT_BOARD_QUESTION` — backend fallback strings; currently `prompt/context.ts:4-5`.

Rewire consumers:
- `validation/askAiRequest.ts` → `playerLabelSchema = z.enum(PLAYER_LABELS)`; delete the `orderedPlayerLabels` const and use `PLAYER_LABELS`. Type and runtime validation both derive from the one array.
- `prompt/normalization.ts` → import `CANONICAL_ZONE_ORDER`, `PLAYER_LABELS`.
- `cardRulings.ts` → import `NON_STACK_CANONICAL_ZONE_ORDER`.
- `prompt/context.ts` → import `NON_STACK_CANONICAL_ZONE_ORDER`, `DEFAULT_STACK_QUESTION`, `DEFAULT_BOARD_QUESTION`.
- `test-utils/requestBuilders.ts` → import `PLAYER_LABELS`.

**Truncation collapse (corrected).** `truncateOracleText` (`normalization.ts:71`) and `truncateWithSuffix` (`cardRulings.ts:48`) are **not** functionally identical: `truncateWithSuffix` guards `maxChars <= 0` (returns `""`) and `maxChars <= suffix.length` (returns `suffix.slice(0, maxChars)`); `truncateOracleText` lacks both and can return a string longer than `maxChars` at tiny budgets. The collapse keeps a single shared helper carrying the **defensive (superset) semantics**, and `cardRulings.ts` imports it from `normalization.ts`. After the Slice B split, `normalization.ts` is a pure leaf (no `cardRulings` runtime dependency), so this import introduces no cycle. Observable output is unchanged today — all `MAX_*` are ≥ 100,000, so the guarded branches never trigger — and this is documented as a deliberate safe-superset consolidation, not a product behavior change.

### Backend module split (Slice B)

Split `prompt/normalization.ts` (485 lines, now the prompt-assembly hub) into four cohesive files within `apps/backend/src/prompt/`:

| File | Responsibility |
|------|---------------|
| `normalization.ts` | Pure text/normalization helpers (`normalizeWhitespace`, `truncateOracleText`, `normalizeQuestion`, `normalizeCardText`, `truncateConversationHistory`) **plus** the `MAX_*` / `EFFECTIVELY_UNLIMITED_CHARS` / `PROMPT_BUDGET_NEAR_LIMIT_BUFFER` budget constants — stays the export point so DEC-042 and `technical-design-rules.md` references remain valid |
| `promptFormatting.ts` | All section formatters: `formatPlayerRef`, `buildPlayerDisplayNameLookup`, `formatTargets`, `formatGameContext`, `formatZoneCardMetadataLines`, `formatStackSection`, `formatNonStackZoneSections`, `formatOfficialRulingsSection`, `formatSupplementalRulesSection`, `formatConversationHistorySection`, `buildZoneScopeSentence`, `SYSTEM_ROLE_PREAMBLE_LINES`, zone label maps |
| `promptDiagnostics.ts` | `PromptDiagnostics` type, `GetPromptDiagnosticsOptions`, `getPromptDiagnostics`, `estimatePromptChars` |
| `promptAssembly.ts` | `buildPromptText` orchestrator + `BuildPromptTextOptions` |

Dependency DAG (no cycles): `constants.ts` ← `normalization.ts` ← `promptFormatting.ts` / `promptDiagnostics.ts` ← `promptAssembly.ts`. All backend source and test imports update to the new paths.

### Rulings function collapse (Slice D)

`cardRulings.ts`: collapse `resolveRulingsForPrompt()` (`:154-197`) and `resolveRulingsForPromptWithDebug()` (`:199-257`) into a single function with an optional debug flag (the debug variant is the strict superset). Callers in `prompt/preparation.ts:62` and `:90` updated; the debug branch only collects trace when requested.

### Frontend EnrichmentStep.tsx extraction (Slice C)

Extract from `EnrichmentStep.tsx` (689 lines):
- Embedded utilities `parseManaSpent()` (`:47`), `formatContextTarget()` (`:54`), `hasOwnerControl()` (`:63`) → new `apps/frontend/src/lib/enrichmentFormat.ts`
- Pending-target state cluster (`pendingKindByKey`, `pendingPlayerByKey`, `pendingCardIdByKey`, `pendingOtherByKey` + getter/add/remove handlers) → new `apps/frontend/src/hooks/useEnrichmentTargets.ts`

Audit all frontend code that displays player names to check whether it imports `lib/playerLabels.ts` or inlines the algorithm. **Finding-only** audit — document any inline usages; no fixes in scope for this work package.

### Cross-app duplication (accepted trade-off)

Frontend fallback-question constants (`contextFlow/flow.ts:26-27`, `resolveFallbackQuestion` `:45-57`) and player display formatting (`lib/playerLabels.ts`) mirror backend implementations (`prompt/context.ts`, `prompt/normalization.ts` `formatPlayerRef`). Given the no-shared-package constraint and that each side serves a different rendering context (UI vs. prompt assembly), this duplication is accepted technical debt. Each app independently consolidates within its own boundary per this work package; no cross-app action is taken.

## Slice decomposition

| Slice | Scope | Parallel? |
|-------|-------|-----------|
| A | Backend constants: create `constants.ts`; consolidate `PLAYER_LABELS`, `CANONICAL_ZONE_ORDER`, derive `NON_STACK_CANONICAL_ZONE_ORDER`, fallback-question strings; collapse truncation to the defensive shared helper | Yes — parallel to C |
| B | Backend module split: `normalization.ts` → 4 files (`normalization` / `promptFormatting` / `promptDiagnostics` / `promptAssembly`) | After A; parallel to D |
| C | Frontend: extract `EnrichmentStep.tsx` utils → `lib/enrichmentFormat.ts` and pending-target state → `hooks/useEnrichmentTargets.ts`; audit `playerLabels.ts` usage (finding only) | Yes — parallel to A |
| D | Rulings collapse: `resolveRulingsForPrompt` + `resolveRulingsForPromptWithDebug` → single function with optional debug flag | After A; parallel to B |
| E | Ship gates; promote durable outcomes; delete work folder | After B + C + D |

## REQ/FLOW/DEC changes

None. This work package is entirely within existing confirmed decisions. The only `instructions/` change is the reuse-before-create bullet added to `technical-design-rules.md` (above). No `sections/` REQ/FLOW/DEC entries are added or modified.
