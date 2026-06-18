# Design Brief: prd-doc-traceability

## Status

refined

## Problem

The PRD promotes decisions into the `sections/` truth layer during planning, before or without implementation. The `Status:` field tracks decision lifecycle (`confirmed`/`superseded`), not whether code shipped. So the truth layer mixes "decided" with "built," and answering "is this real / how does it work / where does it live?" forces a code-reading journey. The dominant pain is **answerability without code-diving**, of which shipped-vs-planned status is only one half — behavior and location are the other half.

## Core decision

Consolidate status **and** answerability into a single durable artifact rather than a per-entry status field. See `DEC-044`.

**Deliverable: `sections/system-map.md`** — a feature/subsystem catalog, two levels (subsystems with features grouped under each), where each entry records:

- `Status`: `shipped` | `planned` | `partial`
- one-line behavior summary
- coarse file/module location (subsystem level, not per-line)
- backing `DEC`/`REQ` IDs

Example shape:

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

## Scope

1. **Catalog (`sections/system-map.md`).** Single file to start; both levels via headings (subsystem) and sub-entries (feature). Populated for current shipped subsystems/features.
2. **Lightweight promotion gate.** A catalog entry is marked `shipped` only when code and a cleanup receipt exist; enforced at cleanup. Documented in `instructions/doc-lifecycle.md` (and referenced by `thejudge-cleanup`).
3. **Commit-message convention (conventional-commits-lite).** `docs(prd):` for doc/plan-only changes; `feat:`/`fix:` for changes that ship product behavior. Documented in `instructions/agent-working-rules.md`.
4. **Drift reconciliation (non-destructive, last).** After the catalog is validated: fix the stale `PRD/README.md` work-package table, add a Section Inventory pointer to the catalog, and represent `DEC-043`/`REQ-031` (`gameStateNotes`) as `planned` in the catalog. Note: this is *not* an edit to `DEC-043`'s `Status:` field — `Status: confirmed` correctly records the decision lifecycle; the shipped-vs-planned signal lives in the catalog only (see `DEC-044`).

## Sequencing — additive-first

Build and validate the catalog against real questions **before** touching existing status conventions or reconciling stale navigation. Nothing is torn down until the catalog has earned its place.

1. Build the catalog for current shipped subsystems/features → validate it answers "is it real / how / where."
2. Add the promotion gate + commit convention to `instructions/`.
3. Reconcile drift (`PRD/README.md` table, inventory pointer, and a `planned` catalog entry for `DEC-043`/`REQ-031` — no `Status:` field edits).

## Decisions referenced

- `DEC-044` — adopt the `sections/system-map.md` catalog; shipped-vs-planned signal lives in the catalog (not a per-entry field); existing `Status:` semantics unchanged; deep behavior prose deferred.

## Non-goals

- No per-decision → code-line links (explicit maintenance-burden rejection preserved).
- No teardown or restructure of the PRD folder layout.
- No new tooling — a documentation + instruction-file convention suffices.
- No deep per-subsystem behavior prose here — deferred to `PRD/work/system-map-detail/` (covers prompt assembly + System 2 / System 3 mechanics that `prompt-context-retrieval-tuning` will rewrite).
- No product API/UI/prompt behavior change; documentation and process only.
- Existing `Status: confirmed/superseded` semantics are not overloaded or changed.

## Open considerations (not blocking)

- Whether to split the catalog into per-subsystem files is deferred until the per-subsystem detail (from `system-map-detail`) lands and individual subsystems grow large enough to warrant their own files. Start single-file.

## Related work

- `system-map-detail` — deep per-subsystem behavior prose, split out of this package; do after `prompt-context-retrieval-tuning` lands so the volatile retrieval detail is written once.
- `prompt-context-retrieval-tuning` — rewrites prompt-assembly + retrieval modules; should land before `consolidate-shared-logic`.
- `consolidate-shared-logic` — code refactor; re-derive after retrieval work lands (per its own README note).
