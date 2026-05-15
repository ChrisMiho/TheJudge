# Context capture rework — product and technical spec

## 1. Purpose

This document captures **nuance, intent, and feature slices** for reworking how TheJudge collects user context before “Decrypt Stack.” It exists so you can **split work into parallel agent stories** with clear boundaries and dependencies.

**Non-goals for this document:** implementation code, API contract changes (unless a story explicitly requires them).

---

## 2. Problem nuance (why the current flow fails)

### 2.1 Current behavior (reference)

- The app uses a **linear staged flow**: game context → battlefield context → stack builder (`FlowStep` in `apps/frontend/src/App.tsx`).
- **Battlefield** entries can include **targets** that reference the **stack** (e.g. `kind: "stack"` with `targetCardId` / `targetCardName`).
- **Stack** is often **empty or incomplete** while the user is still on the battlefield step, so cross-references are **ambiguous or impossible** to pick accurately.
- Users may fall back to **manual** stack name/id style entry for battlefield stack targets, which is error-prone and does not match the real stack the user will build later.
- **Stack** entry context (caster, targets, notes, mana) is collected **at add time** and in a **stack details** surface; battlefield permanents are not always visible as first-class choices in the same mental model.

### 2.2 Core insight

**Correct relational context** (who targets what on the board vs on the stack) often requires **both** of these to be defined:

1. The set of **battlefield-relevant context objects** (cards/permanents + optional free text).
2. The **ordered stack** (spells/abilities on the stack).

Until both lists exist, **enrichment** (targets, notes, cross-links) is under-specified.

---

## 3. Vision (target experience)

### 3.1 Phased mental model

1. **Establish game context** (players, life totals) — largely unchanged in intent; may be same screen or first step.
2. **Assemble two cooperating lists** (card-first / object-first):
   - **Battlefield context list** — rows users care about for this question (not necessarily the whole board).
   - **Stack list** — ordered bottom-to-top (same semantics as today for resolution order).
   - This phase prioritizes **identity and membership + stack order**, not every optional field.
3. **Enrichment pass** (“final layer”):
   - Fill **caster, targets, context notes, mana spent** for stack items.
   - Fill **details and targets** for battlefield rows where needed.
   - **Pickers and validation** must draw options from **both** assembled lists so stack↔battlefield references are **real**, not guessed ahead of time.
4. **Review** (optional but recommended):
   - Human-readable summary of what will be sent to the backend (aligned with `AskAiRequest` / prompt sections).
   - Question text and submit (“Decrypt Stack”), retry behavior unchanged in spirit.

### 3.2 UX principles

- **No dead-end references**: Do not require or prominently encourage stack targets for battlefield rows until the stack contains the referenced objects (or show clear gating/copy).
- **Single source of truth**: Stack order and card identity come from one list; battlefield rows reference stable labels/ids consistent with UI.
- **Back navigation** without losing in-memory state between phases.
- **Defaults**: Sensible defaults for optional fields (empty targets, default caster) to keep assembly fast.

---

## 4. Feature catalog (story-sized)

Each item is written so an agent can own it with minimal collision. **Dependencies** are noted inline.

### Epic A — Flow architecture

| ID | Feature | Notes | Depends on |
|----|---------|-------|------------|
| A1 | **Replace linear `battlefield` → `stack` gate** with a flow that includes **assembly → enrichment → (review) → submit** | Introduce new `FlowStep` (or equivalent) values and transitions in `App.tsx` | — |
| A2 | **Centralize route-level state** so assembly/enrichment/review read/write the same `gameContext`, `battlefieldContext`, `stack`, question | May extract a hook later; first story can keep state in `App.tsx` | A1 |
| A3 | **Debug / analytics parity** | Update `logFrontendDebug` milestones to match new steps (`App.test.tsx` expectations today assert some of these) | A1 |

### Epic B — Assembly (two lists, minimal fields)

| ID | Feature | Notes | Depends on |
|----|---------|-------|------------|
| B1 | **Combined assembly surface** | User can add/remove/reorder stack and add/remove battlefield rows without leaving a “battlefield-only” silo | A1 |
| B2 | **Skeleton stack items** | Adding a card creates a `StackItem` with metadata + defaults (`buildStackItemFromMetadata` with empty context) | B1 |
| B3 | **Skeleton battlefield rows** | Rows with name (+ optional details) and initially empty or partial `targets` | B1 |
| B4 | **Stack ordering** | Preserve order semantics used by backend (`orderedStack`, bottom/top roles computed server-side) | B2 |
| B5 | **Empty battlefield allowed** | Skip is not a separate “mode”; empty list is valid | B3 |

### Epic C — Enrichment (cross-list aware)

| ID | Feature | Notes | Depends on |
|----|---------|-------|------------|
| C1 | **Stack target picker** lists **current stack cards** by stable `cardId` / display name | Reuse patterns from `addEntryTarget` / stack details | B2 |
| C2 | **Battlefield target picker** lists **assembled battlefield row identifiers** (e.g. by name or index) | Ensure labels match `formatTargets` / prompt output | B3 |
| C3 | **Battlefield → stack target** | When user picks a stack target for a battlefield row, choices = assembled stack only | B1, C1 |
| C4 | **Stack → battlefield target** | Battlefield permanents from assembled list, not only free-typed (product choice: allow free text fallback or not) | B1, C2 |
| C5 | **Gating and copy** | If `stack.length === 0`, stack-kind targets disabled with helper text | C3 |
| C6 | **Per-row editors** | Either tabbed “Stack cards” / “Battlefield” or a combined scroll; accessibility for keyboard | C1–C4 |

### Epic D — Review and submit

| ID | Feature | Notes | Depends on |
|----|---------|-------|------------|
| D1 | **Review screen** | Renders summary: players/life, battlefield bullets, stack order with key fields | A2, Epic B/C data |
| D2 | **Question + Decrypt** | Same validation as today (`gameContext`, non-empty stack); `buildAskAiRequest` unchanged | D1 |
| D3 | **Retry path** | Still works from review or post-answer state | D2 |

### Epic E — Decomposition / cleanup of existing UI

| ID | Feature | Notes | Depends on |
|----|---------|-------|------------|
| E1 | **Retire or shrink `BattlefieldStep` as full-page step** | Logic moves into assembly/enrichment components | B1, C6 |
| E2 | **Split `StackBuilderStep` responsibilities** | Search/add vs enrichment vs answer display; avoid one large component doing everything | Parallel after B1 sketch |
| E3 | **`TargetEditor` props contract** | Pass `availableStackItems` and `availableBattlefieldRows` (or similar) so stories C1–C4 share one API | C1, C2 |

### Epic F — Quality

| ID | Feature | Notes | Depends on |
|----|---------|-------|------------|
| F1 | **Update `App.test.tsx`** | New user paths, milestone logs | A3, D2 |
| F2 | **Component tests** | Target pickers, gating when stack empty | C5 |
| F3 | **Manual test script** | Short checklist in story or QA doc | D1 |

---

## 5. Parallelization map (suggested)

**Wave 1 (sequential spine):** A1 → A2 → B1 (one agent owns the spine).

**Wave 2 (parallel after B1 exists):** B2, B3, B4, B5 (can often be one agent); E3 design-only can start early.

**Wave 3 (parallel after assembly MVP):** C1–C6 (could split: one agent stack-side pickers, one agent battlefield-side, one agent gating/copy).

**Wave 4:** D1–D3, E1–E2 refactor, F1–F3.

**Critical path:** A1 → B1 → C3/C4 → D2.

---

## 6. Out of scope (unless explicitly added later)

- Changing `AskAiRequest` / Zod schemas / backend prompt structure.
- Persisting drafts to localStorage or server.
- Mobile-specific layouts beyond existing responsive patterns.

---

## 7. File pointers for implementing agents

| Concern | Location |
|---------|----------|
| Flow and state | `apps/frontend/src/App.tsx` |
| Battlefield UI (current) | `apps/frontend/src/components/BattlefieldStep.tsx` |
| Stack UI (current) | `apps/frontend/src/components/StackBuilderStep.tsx` |
| Targets UI | `apps/frontend/src/components/TargetEditor.tsx` |
| Request builder | `apps/frontend/src/lib/stackState.ts` |
| Types | `apps/frontend/src/types.ts` |
| Prompt assembly (unchanged) | `apps/backend/src/promptContext.ts`, `apps/backend/src/promptNormalization.ts` |
| Tests | `apps/frontend/src/App.test.tsx` |

---

## 8. Open product choices (assign per-story owner)

1. **Review mandatory or skippable?** (“Continue without review” vs forced review.)
2. **Free-text battlefield targets** when a permanent is not in the assembled list — allowed or disallowed after enrichment exists.
3. **Game context placement** — always before assembly vs same screen as assembly header.
