---
document_type: eval_strategy_canonical
eval_strategy_id: EVAL-CTX-FLOW-001
parsable_version: 1
title: "Context capture rework — evaluation strategy"
project: TheJudge
scope: "Frontend assembly → enrichment → review → submit for MTG stack assistant"
canonical_path: PRD/analysis/EVAL-STRATEGY-context-flow-rework.md
increment_docs_root: PRD/analysis/
related_product_spec_section: 6
---

# Evaluation strategy — Context capture rework (TheJudge)

This file is the **canonical** evaluation strategy for the context-flow rework. A parser or skill may split it by **`eval_strategy_id`**, section anchors, and row **`id`** fields in tables.

**Recommended placement:** Keep this file as the phase artifact. Avoid adding child docs unless a slice needs a current, maintained artifact.

---

## Agent instructions

**Audience:** AI engineer implementing **one slice** of this strategy (tests, fixtures, milestones, or monitoring hooks).

### Read order (follow in this order)

1. [Scope and hard stops](#scope-and-hard-stops) — do not violate out-of-scope items.
2. [Execution order](#execution-order) — implement dependencies before dependents.
3. [Failure modes](#1-critical-failure-modes-spec-grounded) — map your task to `FM-*` IDs.
4. [Minimum bar for ship](#minimum-bar-for-ship) — know which `FM-*` / `D-*` are blocking.
5. [Epics → eval focus](#2-epics--eval-focus) — align with `EP-*` if your slice is epic-scoped.
6. [CI / regression commands](#3-ci--regression-commands) — commands you must run before claiming done.
7. [Eval dimensions with rubrics](#4-eval-dimensions-with-rubrics) — acceptance language for `D-*`.
8. [Guardrails](#5-guardrails) — product `GR-P-*` and technical `GR-T-*`.
9. [Production monitoring](#6-production-monitoring) — `MON-*` when touching `logFrontendDebug` or ops docs.
10. [Reference dataset / fixtures](#7-reference-dataset--fixtures) and [Tooling](#8-tooling) — when adding scenarios or tests.

### Definition of done

- **Code or docs change** for the slice is complete **and** the relevant automated checks pass (`npm test`, and `npm --workspace apps/backend run test:eval` when backend prompt path or goldens are touched).
- If the assigned slice is **ambiguous** (unclear file target, unclear “deep-equal” normalization, unclear which step is “assembly” vs “enrichment” in UI): **stop**, list assumptions you would need, and ask for refinement **before** implementing.
- **Golden / fixture updates:** only with intentional behavior change, using `UPDATE_CONTEXT_EVAL_FIXTURES=1` (see [§3](#3-ci--regression-commands)) and PR justification — not to silence failures.

### Parser / child-doc hints

- Tables include an **`id`** column where stable references are required (`FM-*`, `D-*`, `EP-*`, `GR-*`, `MON-*`, `SCN-*`, `TL-*`).
- Cross-reference increments with `eval_strategy_id: EVAL-CTX-FLOW-001` and a list of `covers_ids: [...]` in front matter or body (see [Increment documentation contract](#increment-documentation-contract)).

---

## Scope and hard stops

**In scope:** Frontend assembly → enrichment → review → submit for MTG stack assistant.

**Out of scope for this phase (evals and implementation):** Changing `AskAiRequest`, Zod schemas, or backend prompt structure (per product spec section 6).

### STOP — escalate before implementing

If the correct fix appears to require **any** of the following, **do not implement** without explicit product/ADR approval and an update to this canonical strategy:

- Changing **`AskAiRequest`** shape or Zod schemas.
- Changing **backend prompt assembly** (`buildPromptContext`, `buildPromptText`, checklist semantics) except **fixtures/goldens** to match unchanged contract behavior.
- **Relaxing** `MAX_PROMPT_CHAR_BUDGET` or bypassing prompt diagnostics to “make tests pass.”

---

## Execution order

Recommended order for agents (dependencies first):

1. **Emit correct `AskAiRequest` from the UI** (assembly + enrichment state) — underpins `FM-01`, `FM-02`, `D-01`, `D-02`.
2. **Request-builder / serialization tests** — lock `FM-02`, parts of `FM-01`.
3. **Review vs submit parity (automated)** — `FM-04`, `D-04`.
4. **Gating and pickers (RTL)** — `FM-03`, `D-03`, `EP-C`, `EP-F` / F2.
5. **Navigation / state** — `FM-05`, `D-05` (integration, Playwright, or `App.test.tsx`).
6. **Backend prompt regression harness** — `FM-06`, `D-07`, `D-08` (stay green).
7. **`logFrontendDebug` milestones** — `EP-A` / A3, `MON-F-01`; use [Placeholder A3 milestone keys](#placeholder-a3-milestone-keys-stable-strings) until product renames.
8. **Docs** — Keep the eval strategy and PRD trackers current; avoid separate checklist files unless they are actively maintained.

---

## Increment documentation contract

**Canonical source:** This file (`eval_strategy_id: EVAL-CTX-FLOW-001`).

**Increment docs:** Prefer **`PRD/README.md`** and the relevant active story file as the tracker for each shippable slice (see [Story IDs promoted from parallel plan](#story-ids-promoted-from-parallel-plan)). Each increment or story entry **must**:

- Link back to this file path and quote `eval_strategy_id: EVAL-CTX-FLOW-001`.
- List **`covers_ids`**: the `FM-*`, `D-*`, `EP-*`, `SCN-*`, `MON-*`, or `GR-*` rows addressed (use table `id` values).
- State **definition of done** for that slice: files touched, tests run, and expected green result.
- **Not** contradict scope in [Scope and hard stops](#scope-and-hard-stops); if scope must change, update **this** canonical file first, then increments.

**Sums-to-whole:** Over the phase, promoted **`STORY-069`–`STORY-078`** tracker entries should collectively cover every **`FM-*` minimum bar** row and every **`D-*`** with priority Critical / High in the [Appendix — priority tags](#appendix--priority-tags), unless explicitly deferred with reason (see `STORY-078` for `D-09`).

**Manual QA (F3):** Keep manual QA notes in this file or the active story tracker. The ship criterion in `MON-F-01` requires F3 / ops listing of milestone keys.

---

## 1. Critical failure modes (spec-grounded)

| id | Failure mode | Why it matters | Primary signal |
|----|--------------|----------------|----------------|
| FM-01 | **Wrong stack order in payload** | Resolution narrative depends on bottom→top semantics (`stack[0]` bottom, last entry top per `promptNormalization.ts` / harness). | `orderedStack` / `cardId` sequence in `AskAiRequest`; golden `*.context.golden.json` |
| FM-02 | **Broken stack↔battlefield references** | Targets point at names/ids not present in assembled lists → misleading prompts or user confusion. | `targets[].kind` + `targetCardId` / `targetPermanent` consistency with stack/battlefield rows |
| FM-03 | **Gating / picker bugs** | Empty stack still allows stack-kind targets, or pickers show stale/off-list options (“dead-end references” per spec §3.2). | Epic F2 component tests + manual Epic F3 sign-off before release |
| FM-04 | **Review ≠ actual submit** | User trusts review summary but `buildAskAiRequest` sends different data → trust/regression risk. | **Ship gate:** automated test — deep-equal or snapshot of review source vs serialized `AskAiRequest`. Debug log diffs are diagnostic only, not a release criterion. |
| FM-05 | **State loss on back navigation** | Assembly/enrichment data dropped between steps. | Automated integration / Playwright / `App.test.tsx` covering back/forward (see [Minimum bar for ship](#minimum-bar-for-ship)) |
| FM-06 | **Regression on unchanged prompt path** | Frontend still emits valid `AskAiRequest`; backend `buildPromptContext` / `buildPromptText` / checklist must stay green. | `contextEvaluationHarness.test.ts` + golden fixtures |

### Minimum bar for ship

- **FM-01, FM-02, FM-04, FM-06:** automated coverage in CI ([§3](#3-ci--regression-commands)).
- **FM-03:** automated Epic F2 tests **and** manual Epic F3 sign-off before release.
- **FM-05:** at least one automated test (integration, Playwright, or `App.test.tsx`) that exercises back/forward across assembly, enrichment, and review with no data loss; manual F3 only supplements gaps explicitly listed in this file or the active story tracker until automation covers them.

---

## 2. Epics → eval focus

| id | Epic | Eval focus |
|----|------|------------|
| EP-A | **A** (flow architecture) | Correct step transitions; single source of truth for `gameContext`, `battlefieldContext`, `stack`, question; updated `logFrontendDebug` milestones match real user path (A3). |
| EP-B | **B** (assembly) | Add/remove/reorder stack; battlefield rows optional (empty allowed B5); skeleton `StackItem` / battlefield rows match `buildStackItemFromMetadata` / types. |
| EP-C | **C** (enrichment) | Cross-list pickers only surface assembled ids; gating when `stack.length === 0` (C5); labels align with backend `formatTargets` expectations. |
| EP-D | **D** (review/submit) | Review bullets match serialized `AskAiRequest`; validation unchanged (non-empty stack, game context); retry (D3). |
| EP-E | **E** (decomposition) | `TargetEditor` contract (`availableStackItems`, `availableBattlefieldRows`) — contract/unit tests, no prop drift. |
| EP-F | **F** (quality) | `App.test.tsx` paths; picker/gating component tests (F2); manual checklist (F3) for release sign-off. |

---

## 3. CI / regression commands

Run from repo root:

| id | Command | When |
|----|---------|------|
| CMD-01 | `npm test` | Default gate for every change touching frontend/shared logic. |
| CMD-02 | `npm --workspace apps/backend run test:eval` | Backend prompt regression (golden + checklist). |
| CMD-03 | `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval` | Only when prompt/context behavior **intentionally** changes; rare this phase. |

```bash
npm test
```

```bash
npm --workspace apps/backend run test:eval
```

```bash
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval
```

---

## 4. Eval dimensions with rubrics

**Legend:** **Auto** = deterministic test/code; **Human** = rubric for QA or spot review; **LLM-J** = LLM-as-judge (optional; only for *answer* quality given fixed context — not required to ship this UI phase).

| id | Dimension | Definition | Pass | Partial | Fail | Measurement |
|----|-----------|------------|------|---------|------|-------------|
| D-01 | **Payload stack order** | Bottom-to-top `stack` array matches user assembly and backend expectations. | `cardId` order identical end-to-end; harness `stack-order-preserved` passes. | Order correct but UI labels “top/bottom” wording confusing only. | Order inverted or reordered after enrichment/review. | **Auto** (`contextEvaluationHarness`, frontend unit test on serialized payload). |
| D-02 | **Cross-list target integrity** | Every target references an assembled stack card or battlefield row (per product rules for free-text). | All structured targets resolve to list members; prompt `formatTargets` strings match chosen labels. | One edge case (e.g. truncated long name) still uniquely resolvable. | Orphan `targetCardId`, wrong spell targeted, or picker showed off-list card. | **Auto** (request builder tests); **Human** for free-text policy (open product choice §8). |
| D-03 | **Gating & empty stack** | Stack-kind targets disabled when stack empty; clear copy. | Disabled + helper text; no stack target saved. | Gated but copy missing/unclear. | User can assign stack target with `stack.length === 0`. | **Auto** (component tests F2); **Human** (F3). |
| D-04 | **Review fidelity** | Review screen reflects exact data passed to `buildAskAiRequest`. | Byte-for-byte or deep-equal match between review source and submit payload. | Minor display-only omission (e.g. omits optional note) but payload complete. | Summary contradicts payload (order, targets, or names). | **Auto** (snapshot/deep-equal test — same ship gate as FM-04); **Human** F3 for residual display edge cases only. |
| D-05 | **Navigation & state** | Back/forward between assembly, enrichment, review preserves in-memory model. | No data loss; submit still valid. | Cosmetic scroll position reset only. | Missing cards, cleared targets, or duplicate rows after navigation. | **Auto** (integration); **Human** F3. |
| D-06 | **Task completion (submit)** | User can complete Decrypt Stack with same validation rules as today. | Happy path + retry path succeed; orchestration logs success. | Retry requires extra click but works. | Submit blocked incorrectly or sends malformed body. | **Auto** (`App.test.tsx`, orchestration tests). |
| D-07 | **Backend prompt regression** | Unchanged contract: prompt sections, guardrail lines, ordering checks stay green. | All harness checks pass; goldens match. | N/A (binary). | Any checklist failure or golden drift without approved update. | **Auto** (`contextEvaluationHarness.test.ts`). |
| D-08 | **Safety / policy (output)** | Answers must not read as official rulings; use provided context. | System preamble + instruction lines unchanged in shipped prompts (`SYSTEM_ROLE_PREAMBLE_LINES`, `REQUIRED_GUARDRAIL_LINES`). | N/A | Preamble/guardrails removed or contradicted in production prompt path. | **Auto** (existing harness checks + `promptNormalization.test.ts`). |
| D-09 | **Answer quality given improved context** *(optional)* | If context is richer, answers stay grounded. | No new unsupported board claims; cites stack order. | Minor verbosity. | Fabricates zones/cards not in context. | **LLM-J** (calibrated rubric on held-out scenarios); **Human** adjudication for calibration only. |

---

## 5. Guardrails

### 5.1 Product guardrails

| id | Rule |
|----|------|
| GR-P-01 | **No “official ruling” positioning:** System copy must retain `Do not present output as an official tournament ruling.` (`apps/backend/src/promptNormalization.ts` — `SYSTEM_ROLE_PREAMBLE_LINES`). **Do not** add UI copy that implies Wizards/DCI/competitive authority. |
| GR-P-02 | **Context grounding:** Keep “use only provided context” / “do not invent hidden state” semantics visible in the prompt path the backend builds (already enforced in eval harness `required-guardrails-present`). |
| GR-P-03 | **Honest review:** Review screen is a **read-only mirror** of submit payload, not a separate narrative. |

### 5.2 Technical guardrails

| id | Guardrail | Type | Enforcement |
|----|-----------|------|-------------|
| GR-T-01 | **API shape frozen** | Online / release | No Zod/`AskAiRequest` changes this phase; code review + typecheck CI. |
| GR-T-02 | **Prompt char budget** | Online (server) | `MAX_PROMPT_CHAR_BUDGET` (12000) + `getPromptDiagnostics` — existing reject/warn in `apps/backend/src/app.ts`. Extend **fixtures** if new UI sends longer notes, don’t relax budget silently. |
| GR-T-03 | **PII / sensitive free text** | Online (policy) | Question + notes fields: don’t log raw text at INFO in production; keep correlation ids only in `logFrontendDebug` payloads where possible. |
| GR-T-04 | **Misleading targets** | Online (UX) | Block or disable illegal cross-references (gating); validate before submit. |
| GR-T-05 | **Golden drift** | Offline flywheel | Any change to `buildPromptText` / `buildPromptContext` must include intentional golden update + PR justification. |

---

## 6. Production monitoring

### 6.1 Frontend (`logFrontendDebug`)

| id | Requirement |
|----|-------------|
| MON-F-01 | **Ship criterion (A3):** New-flow milestones exist as stable `logFrontendDebug` string keys (see [Placeholder A3 milestone keys](#placeholder-a3-milestone-keys-stable-strings)), fire on the golden path (assembly → enrichment → review → submit), and are listed in this eval strategy or active story tracker so funnels/dashboards do not depend on ad hoc log archaeology. |

After Epic A3, align milestones with new flow and monitor **counts and funnels**:

- **Assembly / enrichment entry and completion** — use placeholder keys below until renamed in implementation; **keep keys stable** after release.
- Existing: `game_context.confirmed`, `ask_ai.submit_attempted`, `ask_ai.request_succeeded`, `ask_ai.request_failed` (`useAskAiSubmitOrchestration.ts`).

**Dashboard ideas:** rate of `request_failed` / `submit_attempted`; drop-off between assembly start and submit.

#### Placeholder A3 milestone keys (stable strings)

Use these **or** rename once in a single PR that also updates this table. Agents should implement logging with **one** agreed set of keys.

| id | `logFrontendDebug` milestone key (placeholder) | Fires when (golden-path contract) |
|----|--------------------------------------------------|-------------------------------------|
| M-A3-01 | `context_flow.assembly_entered` | User enters assembly step |
| M-A3-02 | `context_flow.assembly_completed` | User leaves assembly with valid in-memory model |
| M-A3-03 | `context_flow.enrichment_entered` | User enters enrichment |
| M-A3-04 | `context_flow.enrichment_completed` | User leaves enrichment |
| M-A3-05 | `context_flow.review_entered` | User enters review |
| M-A3-06 | `context_flow.review_completed` | User leaves review toward submit |

### 6.2 Backend (ask endpoint)

| id | Signal |
|----|--------|
| MON-B-01 | **HTTP 4xx/5xx rate** on ask route; latency p50/p95. |
| MON-B-02 | **Prompt diagnostics** (logged in `app.ts`): `promptChars`, `promptBudgetChars`, `promptUtilizationPercent`; **alert** when `nearLimit` or `exceedsBudget` spikes (suggests UI sending heavier context). |
| MON-B-03 | **Validation errors** (payload rejects) — spike may indicate frontend regression. |

### 6.3 Sampling

| id | Note |
|----|------|
| MON-S-01 | Smart sample sessions with: `ask_ai.request_failed`, prompt near limit, or unusually large `playerCount` / stack depth. |

---

## 7. Reference dataset / fixtures

### 7.1 Size and composition

- **Minimum:** 10 **frontend** scenarios (state machine + serialization) + **existing** 7 backend fixtures (extend to 10+ over time).
- **Composition:** critical path (assembly → enrich → review → submit), cross-targets both directions, empty battlefield, reorder-after-enrichment, near prompt budget.
- **Labeling:** expected `AskAiRequest` JSON as **ground truth** for UI tests; backend goldens as **prompt ground truth**.

### 7.2 Extend `apps/backend/src/eval/`

Add new `*.fixture.json` + run `test:eval` whenever UI starts emitting new target shapes **within the same schema** (e.g. more battlefield rows). Keep `checklist-report.golden.txt` authoritative.

### 7.3 Scenario IDs (minimal shapes)

| id | scenario_key | Intent | Minimal fixture notes |
|----|--------------|--------|------------------------|
| SCN-01 | `ctx-bf-targets-stack` | Battlefield row targets stack spell | `battlefieldContext[].targets`: `{ kind: "stack", targetCardId, targetCardName }` matching bottom/mid stack `cardId` |
| SCN-02 | `ctx-stack-targets-bf` | Stack spell targets battlefield permanent | `stack[].targets`: `{ kind: "battlefield", targetPermanent }` string matches assembled row |
| SCN-03 | `ctx-empty-battlefield` | Valid question with `battlefieldContext: []` | Non-empty `stack`; mirrors `battlefield-skip.fixture.json` intent |
| SCN-04 | `ctx-reorder-after-enrich` | Order locked after user reorders in assembly | Same cards, permuted `stack` order; goldens prove `orderedStack` match |
| SCN-05 | `ctx-near-prompt-budget` | Regression on truncation/budget | Long `oracleText` / notes; align with `near-cap-stack.fixture.json` pattern |

**Minimal row shape:** reuse fields from existing fixtures (`multi-step-stack.fixture.json`): `gameContext` with 2–3 players, `battlefieldContext` entries with `{ name, details?, targets[] }`, `stack[]` with `cardId`, `name`, `oracleText`, `caster`, `targets`, mana fields as today.

---

## 8. Tooling

| id | Layer | Tool | Role |
|----|-------|------|------|
| TL-01 | Backend prompt | **Vitest** + `contextEvaluationHarness.test.ts` | Golden `*.context.golden.json`, `*.prompt.golden.txt`, checklist |
| TL-02 | Frontend flow | **Vitest** + `App.test.tsx` | Milestones, main user journeys |
| TL-03 | Pickers / gating | **Vitest** (RTL) on `TargetEditor` / assembly components | Epic F2 |
| TL-04 | E2E (optional) | **Playwright** | Full browser flow if RTL cannot cover focus/scroll; use if Epic C6 a11y risk |
| TL-05 | Release | **Manual QA** | Manual QA notes in this file or active story tracker: cross-list picks, empty stack gating, review accuracy, retry |

**No new eval SaaS required** for this phase; repo shows no Langfuse/Phoenix/RAGAS wiring — stay on Vitest + goldens unless product later adds online LLM tracing.

---

## Appendix — priority tags

| id | Priority |
|----|----------|
| D-01, D-02, D-04, D-07 | **Critical** |
| D-03, D-06, D-08 | **High** |
| D-05 | **High** (Medium if strong integration tests exist) |
| D-09 | **Medium** (optional) |

---

## Story IDs promoted from parallel plan

Promoted global backlog IDs (see `PRD/README.md` — Context flow eval execution). Wave matches recommended execution; `covers_ids` are eval row ids.

| story_id | wave | execution mode | covers_ids (primary) |
|----------|------|------------------|----------------------|
| STORY-069 | 0 | parallel-ready | `MON-F-01`, `TL-05`, docs scaffold |
| STORY-070 | 1 | parallel-ready | `FM-01`, `D-01` |
| STORY-071 | 1 | parallel-ready | `FM-02`, `D-02` |
| STORY-072 | 1 | parallel-ready | `SCN-01`–`SCN-05`, `FM-06`, `D-07`, `D-08` |
| STORY-073 | 2 | sequential | `FM-04`, `D-04`, `GR-P-03` |
| STORY-074 | 2 | parallel-ready | `FM-03`, `D-03`, `EP-C`, `EP-F` |
| STORY-075 | 3 | sequential | `FM-05`, `D-05`, `EP-A` |
| STORY-076 | 4 | sequential | `MON-F-01`, `EP-A`, `M-A3-01`–`M-A3-06` |
| STORY-077 | 2 | parallel-ready | `D-06`, `EP-D` |
| STORY-078 | 99 | parallel-ready (defer) | `D-09` |

**Sequential edges:** `STORY-073` after `STORY-070` (and ideally `STORY-071`); `STORY-075` after `STORY-070`; `STORY-076` after `STORY-075`.
