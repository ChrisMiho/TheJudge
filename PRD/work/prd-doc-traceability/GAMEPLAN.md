# GAMEPLAN: prd-doc-traceability

## Objective

Make the PRD truth layer answer "is this real / how does it behave / where does it live?" in one read, without a code-diving journey. Deliver a durable feature/subsystem catalog (`sections/system-map.md`), add lightweight process guardrails (promotion gate + commit convention) to `instructions/`, and reconcile current navigation drift — all additive-first, documentation and process only (`DEC-044`).

This is a **documentation + instruction-file** package. No product code, no `POST /api/ask-ai` request/response change, no UI or prompt-assembly change.

## Authoritative inputs

- `DESIGN-BRIEF.md` (this folder) — scope, sequencing, non-goals
- `DEC-044` (`sections/decisions.md`) — the catalog decision and its constraints
- `instructions/doc-lifecycle.md` — durable vs ephemeral rules (catalog is durable)
- `instructions/workflow-reference.md` — slice template, ship gates, receipt convention

## Core design

### The catalog (`sections/system-map.md`)

A two-level feature/subsystem catalog of the **product**:

- **Subsystem** = `##` heading (e.g. "Prompt assembly", "Game rules retrieval")
- **Feature** = `###` sub-entry grouped under its subsystem

Each entry records exactly four things:

| Field | Values / shape |
|-------|----------------|
| `Status` | `shipped` \| `planned` \| `partial` |
| `Summary` | one-line behavior statement |
| `Lives in` | coarse file/module location (directory or 1–3 key files, **not** per-line) |
| `Backed by` | `DEC`/`REQ` IDs |

Entry shape (from the brief):

```markdown
## Prompt assembly
- Status: shipped
- Summary: Builds the LLM prompt from game context, zones, phase guidance, rules, rulings.
- Lives in: apps/backend/src/prompt/ (preparation.ts, normalization.ts)
- Backed by: DEC-021, DEC-025, DEC-042

### Phase guidance block
- Status: shipped
- Summary: Phase/combat-step reasoning hints injected per turn phase.
- Lives in: apps/backend/src/prompt/phaseGuidance.ts
- Backed by: DEC-036, DEC-037, REQ-024
```

### Key invariants (do not violate)

1. **The shipped-vs-planned signal lives in the catalog only.** Do **not** edit any `DEC`/`REQ` `Status:` field. `Status: confirmed/superseded` records decision lifecycle and stays unchanged (`DEC-044`).
2. **`gameStateNotes` / `ADDITIONAL GAME STATE` (`DEC-043`/`REQ-031`) is `planned`** — confirmed docs-only; zero code under `apps/`. It gets a `planned` catalog entry, not a `Status:` edit.
3. **`DEC-044` itself starts `planned` in the catalog** (a meta-entry for the catalog/traceability feature) and is flipped to `shipped` at cleanup once code+receipt exist (the promotion gate, applied to itself).
4. **Coarse location only** — no per-decision → code-line links (explicit non-goal).
5. **Additive-first** — the catalog is built and validated before any instruction change or navigation reconciliation.

## Subsystem source-of-truth for the catalog author

The shipped inventory below was derived from the current codebase ([map shipped subsystems](d060d73e-7111-4355-9576-a6386887645a)). All are `shipped` unless marked otherwise. The catalog author should verify each path still exists at implementation time and adjust wording, but this is the intended catalog skeleton.

| Subsystem | Key features | Coarse location | Backing IDs (representative) |
|-----------|--------------|-----------------|------------------------------|
| Prompt assembly | preparation pipeline, context normalization, prompt-text builder, MTG reference block, phase/combat guidance, conversation-history block, budget & diagnostics; **`gameStateNotes` (planned)** | `apps/backend/src/prompt/` (`preparation.ts`, `context.ts`, `normalization.ts`, `mtgReference.ts`, `phaseGuidance.ts`) | DEC-021, DEC-025, DEC-036, DEC-037, DEC-042; **DEC-043/REQ-031 (planned)** |
| Game rules retrieval | card rulings (DEC-029), curated game rules (DEC-030), supplemental retrieval (DEC-032) | `apps/backend/src/cardRulings.ts`, `gameRules.ts`, `gameRulesRetrieval.ts` | DEC-029, DEC-030, DEC-032, REQ-022 |
| Provider boundary | factory, mock provider, OpenAI provider, provider interface | `apps/backend/src/providers/` | DEC-011, DEC-017, DEC-020, DEC-033 |
| Backend API & validation | `POST /api/ask-ai`, Zod request schemas, error taxonomy, health route, logging, enrichment-debug sidecar | `apps/backend/src/routes/askAi.ts`, `validation/askAiRequest.ts`, `errors.ts` | DEC-010, DEC-013, DEC-020, DEC-038, DEC-033 |
| Frontend staged context flow | flow state machine, game-context step, phase zone defaults, zone confirm, zone collection, enrichment step, payload builder, stack limits | `apps/frontend/src/lib/contextFlow/`, `apps/frontend/src/components/`, `App.tsx` | DEC-021, DEC-023, DEC-024, DEC-028, DEC-034, DEC-035, DEC-037 |
| Card search & metadata | runtime metadata fetch, fuzzy autocomplete, zone-card construction | `apps/frontend/src/lib/search.ts`, `lib/zoneCards.ts` | DEC-012, REQ-002, REQ-003 |
| Follow-up chat | submit orchestration (context freeze + history), conversation thread UI, retry/cooldown | `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`, `components/ConversationThread.tsx` | DEC-038, DEC-039, DEC-040, DEC-041, REQ-027 |
| Decrypt waiting panel | waiting panel UI, staged elapsed-time messages | `apps/frontend/src/components/AskAiWaitingPanel.tsx`, `lib/askAiWaitStages.ts` | DEC-031, REQ-023 |
| Data pipeline | Scryfall + CR refresh, card metadata build, card rulings build, game rules build, prompt preview | `scripts/` (`refresh-scryfall-data.mjs`, `build-card-metadata.mjs`, `build-card-rulings.mjs`, `build-game-rules.mjs`, `prompt-preview.mjs`) | DEC-012, DEC-029, DEC-030, DEC-032 |
| Eval harness | context evaluation harness, fixtures, golden comparisons | `apps/backend/src/eval/` | DEC-025, DEC-030, DEC-032 |
| PRD doc traceability (meta) | the `system-map.md` catalog + promotion gate + commit convention | `PRD/sections/system-map.md`, `PRD/instructions/` | **DEC-044 (planned until cleanup)** |

Backing-ID columns are a starting point; the author should pin the most directly relevant IDs per entry from `sections/decisions.md` and `sections/functional-requirements.md`.

## Process guardrails (Slice B)

- **Promotion gate** (`instructions/doc-lifecycle.md`): a catalog entry flips to `shipped` only when code **and** a cleanup receipt exist; enforced at cleanup time. Referenced by `thejudge-cleanup`.
- **Commit convention** (`instructions/agent-working-rules.md`, conventional-commits-lite): `docs(prd):` for doc/plan-only changes; `feat:`/`fix:` for changes that ship product behavior.

## Drift reconciliation (Slice C, non-destructive, last)

- Fix the stale `PRD/README.md` "Active work packages" table (dead link to already-shipped `supplemental-game-rules-retrieval`, wrong statuses).
- Add a `sections/system-map.md` pointer to the `PRD/README.md` Section Inventory.
- Represent `DEC-043`/`REQ-031` as `planned` in the catalog (no `Status:` edit).

## Slice sequencing

Sequential by design — the additive-first directive in the brief is the stated blocker: build and validate the catalog **before** touching status conventions or reconciling navigation.

```
A (build + validate catalog) → B (instructions guardrails) → C (drift reconciliation, final)
```

| Slice | Objective | Depends on |
|-------|-----------|------------|
| A | Create and validate `sections/system-map.md` | — |
| B | Add promotion gate + commit convention to `instructions/` | A |
| C | Reconcile drift (README table, inventory pointer, `planned` entry) | A, B |

## Verification checklist (whole package)

- [ ] `sections/system-map.md` exists with two-level structure; every entry has all four fields.
- [ ] All currently-shipped subsystems above are present and marked `shipped` with coarse (not per-line) locations.
- [ ] `gameStateNotes`/`ADDITIONAL GAME STATE` appears as `planned`; `DEC-044` meta-entry appears as `planned`.
- [ ] No `DEC`/`REQ` `Status:` field was edited (diff of `sections/decisions.md` shows no `Status:` changes).
- [ ] The catalog answers the validation question set (Slice A) from the catalog text alone.
- [ ] `instructions/doc-lifecycle.md` documents the promotion gate; `instructions/agent-working-rules.md` documents the commit convention.
- [ ] `PRD/README.md` work-package table is accurate; Section Inventory points to `system-map.md`.
- [ ] No product code, API, UI, or prompt change in the diff (paths limited to `PRD/`).
- [ ] `npm run skills:ai-sync` only required if a `thejudge-*` skill was edited (Slice B touches the cleanup skill reference — see slice note).

## Out of scope (deferred)

- Deep per-subsystem behavior prose → `PRD/work/system-map-detail/` (after `prompt-context-retrieval-tuning` lands).
- Per-decision → code-line links. PRD folder teardown. Splitting the catalog into per-subsystem files.
