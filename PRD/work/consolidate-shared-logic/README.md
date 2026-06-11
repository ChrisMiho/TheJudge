status: active

# Consolidate Shared Logic and Remove Duplication

Codebase cleanup to eliminate accidentally duplicated constants, functions, and logic across the frontend/backend boundary and within individual modules. No behavior changes — refactor only.

## Findings

Produced by a full codebase analysis on 2026-06-09. Grouped by severity.

---

### Significant

#### 1. Zone constants and fallback question logic duplicated across apps

| Location | Detail |
| --- | --- |
| `apps/frontend/src/lib/contextFlow/flow.ts:26–57` | `DEFAULT_STACK_QUESTION`, `DEFAULT_BOARD_QUESTION`, `resolveFallbackQuestion()` |
| `apps/backend/src/prompt/context.ts:4–109` | Same constants and same algorithm, different type annotations |

Frontend and backend can silently diverge if one side is updated. Recommendation: single constants file; backend imports from it or a shared location.

---

#### 2. `CANONICAL_ZONE_ORDER` defined in three places

| Location | Variant |
| --- | --- |
| `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts:7` | Includes stack |
| `apps/backend/src/prompt/normalization.ts:38` | Includes stack |
| `apps/backend/src/cardRulings.ts:38` | Excludes stack (`NON_STACK_CANONICAL_ZONE_ORDER`) |

Three definitions means three places to update if zone order ever changes; the stack-inclusion inconsistency is a latent bug. Recommendation: single backend constants module; derive the non-stack variant from the canonical one.

---

#### 3. Player display formatting duplicated across apps

| Frontend | Backend |
| --- | --- |
| `apps/frontend/src/lib/playerLabels.ts:3` — `formatPlayerDisplayLabel()` | `apps/backend/src/prompt/normalization.ts:124` — `formatPlayerRef()` |
| `apps/frontend/src/lib/playerLabels.ts:12` — `buildPlayerDisplayNameMap()` | `apps/backend/src/prompt/normalization.ts:112` — `buildPlayerDisplayNameLookup()` |

Identical algorithm: trim display name, check length, fall back to label, format with parentheses. Different names make the duplication invisible. Recommendation: backend imports or mirrors a shared constants location rather than re-implementing.

---

#### 4. Truncation logic duplicated within the backend

| Location | Function |
| --- | --- |
| `apps/backend/src/prompt/normalization.ts:70–77` | `truncateOracleText()` |
| `apps/backend/src/cardRulings.ts:48–64` | `truncateWithSuffix()` |

Functionally identical. Bug fixes or behavior changes must be applied to both. Recommendation: `cardRulings.ts` imports `truncateOracleText` from `normalization.ts`, or both import from a shared util.

---

#### 5. `EnrichmentStep.tsx` is 689 lines with mixed concerns

File mixes UI rendering, 10+ `useState` hooks, memoization, input validation, and data transformation. `parseManaSpent()` (line 47) and `formatContextTarget()` (line 54) are embedded utilities. Recommendation: extract utility functions to a separate file and state/target management to a custom hook; break into sub-components if feasible after extraction.

---

### Moderate

#### 6. `orderedPlayerLabels` hardcoded in two backend files

| Location |
| --- |
| `apps/backend/src/validation/askAiRequest.ts:15–24` |
| `apps/backend/src/prompt/normalization.ts:19–28` |

Identical array. Recommendation: define once in a backend constants file; import in both.

---

#### 7. Two near-identical rulings resolution functions in `cardRulings.ts`

`resolveRulingsForPrompt()` (lines 154–197) and `resolveRulingsForPromptWithDebug()` (lines 199–257) share the same core algorithm; they differ only in debug info collection. Recommendation: single function with optional debug flag, or extract shared core to a helper.

---

#### 8. `normalization.ts` (470 lines) mixes three concerns

Normalization (lines 66–100), display formatting (lines 112–255), and diagnostics (lines 308–391) are all in one file. Changes to any concern require understanding the full file. Recommendation: split into `normalization.ts` (normalization only), `promptFormatting.ts` (display), `promptDiagnostics.ts` (diagnostics).

---

### Minor

#### 9. Player labels hardcoded a third time in test utilities

`apps/backend/src/test-utils/requestBuilders.ts:4–13` — third copy of the player label array. Recommendation: import from validation schema or a constants file.

#### 10. `App.tsx` is 581 lines with orchestration logic

Game context management, API calls, flow state, and metadata loading are all co-located. Recommendation: extract orchestration to custom hooks as a follow-on once higher-priority items are resolved.

#### 11. No shared types between apps

Frontend duplicates some type definitions that originate in the backend. Low urgency given the separate-package structure, but worth noting for future maintenance.

---

## Summary Table

| # | Finding | Severity | Recommended action |
|---|---------|----------|--------------------|
| 1 | Zone/question constants duplicated frontend ↔ backend | Significant | Single constants source |
| 2 | `CANONICAL_ZONE_ORDER` in three places | Significant | Single definition; derive non-stack variant |
| 3 | Player formatting logic duplicated frontend ↔ backend | Significant | Backend imports shared source |
| 4 | Truncation logic duplicated within backend | Significant | `cardRulings.ts` imports from `normalization.ts` |
| 5 | `EnrichmentStep.tsx` 689 lines, mixed concerns | Significant | Extract utils + hook; split sub-components |
| 6 | `orderedPlayerLabels` hardcoded twice in backend | Moderate | Backend constants file |
| 7 | Two near-identical rulings resolution functions | Moderate | Single function with optional debug flag |
| 8 | `normalization.ts` mixes normalization/formatting/diagnostics | Moderate | Split into three modules |
| 9 | Player labels hardcoded in test utilities too | Minor | Import from constants |
| 10 | `App.tsx` 581 lines, orchestration mixed in | Minor | Extract to custom hooks |
| 11 | No shared types between apps | Minor | Note for future |

---

## Implementation map

| Slice | Scope | Parallel? | Blocked by | Status |
| --- | --- | --- | --- | --- |
| A | Backend constants: create `constants.ts`; consolidate `orderedPlayerLabels`, `CANONICAL_ZONE_ORDER`; fix truncation import | Yes — parallel to C | — | planned |
| B | Backend module split: `normalization.ts` → 3 files | Yes — parallel to D | A | planned |
| C | Frontend: extract `EnrichmentStep.tsx` utilities + hook; audit `playerLabels.ts` usage | Yes — parallel to A | — | planned |
| D | Rulings function collapse: merge `resolveRulingsForPrompt` + `resolveRulingsForPromptWithDebug` | Yes — parallel to B | A | planned |
| E | Ship gates; verify quality gate; prepare for cleanup | — | B + C + D | planned |

## Docs in this folder

| Doc | Purpose |
| --- | --- |
| `IDEA.md` | Problem, outcome, non-goals |
| `README.md` | Full findings, summary table, implementation map |
| `DESIGN-BRIEF.md` | Scope, decisions, slice decomposition |
| `GAMEPLAN.md` | Architecture, data flow, parallel execution plan, verification checklist |
| `slice-a-backend-constants.md` | Backend constants module |
| `slice-b-normalization-split.md` | Backend module split |
| `slice-c-frontend-extraction.md` | Frontend EnrichmentStep extraction |
| `slice-d-rulings-collapse.md` | Rulings function collapse |
| `slice-e-ship.md` | Ship gates and PRD promotion checklist |
