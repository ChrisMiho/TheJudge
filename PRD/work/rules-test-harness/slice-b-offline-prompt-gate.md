# Slice B — Offline prompt gate

## Status: planned

## Goal

Every pull request now fails, for free, when an attached card stops reaching the AI's prompt or when a deciding rule that used to reach it stops reaching it. No model call and no network. A card-data refresh that only changes a case's query text never fails the weekly refresh: the case is reported as awaiting a re-freeze.

## Depends on

Slice A (loader, `buildCaseRequest`, `.d.mts` declarations, stale comparison).

## Product truth applied at build (A21)

The new system-map entry `Rules test corpus gates and review`, added as `Status: partial` (the third diff in the REQ-222 slot, placed after `### Answer-quality baseline`). Re-derive it by intent against current `PRD/sections/system-map.md`. REQ-222's own functional-requirements entry is applied in slice E, because its re-freeze criterion names the staleness report. The `## Eval harness` summary edit (also in the REQ-222 slot) waits for slice F.

The build re-derives each edit by intent against current `PRD/sections/` truth, together with the code in this slice's work. `GATE-QUESTIONS.md` holds the approved diff (every verdict `accept`).

## Requirements

1. Gate tests are backend vitest tests under `apps/backend/src/eval/` (proposed home: `apps/backend/src/eval/rules-gate/`), read cases through `scripts/lib/gold-cases.mjs` and build requests through `scripts/lib/prompt-fidelity.mjs` by static import (A3). They run in `coverage:check`, hence in `quality:check`. They never call the embedder or any network (a test fails if the embedder is invoked).
2. Run every non-rejected case through the unmodified `preparePromptInput` with the inputs `prompt-fidelity.mjs` already assembles.
3. Card check (absolute): every attached card's oracle text and every committed ruling appear in the prompt (safe as absolute, M7).
4. Rule check (ratchet): a committed per-case hit/miss baseline (proposed: `apps/backend/src/eval/rules-gate/baseline.json`); the gate fails only on a hit turning into a miss; new hits are reported; an explicit command (proposed `npm run eval:rules-gate:baseline`) raises the baseline. For the 18 migrated cases it reproduces 16/18 (M6, M15). This is the same shape as REQ-177's `step1-baseline.json` and `ragRetrievalBenchmark.test.ts`.
5. Frozen query vectors built by the shipped local embedder, following REQ-181 and `npm run eval:build-frozen-query-embeddings`, written under `apps/backend/src/eval/` (never `apps/backend/data/`). Each vector stores a SHA-256 hash of the query text (`buildRetrievalQueryText`) it was embedded from. Encoding may be more compact than REQ-181's JSON if determinism holds (A4); the file must pass `format:check` (check `.prettierignore` and the encoding choice).
6. The one re-freeze check (A5): rebuilds a case's query text, hashes it, compares with the stored hash. On a mismatch the case is awaiting a re-freeze: reported, skipped by the ratchet (neither hit nor miss, whatever the baseline records), counted in the gate summary. A case with no vector at all fails the gate. Slice E's staleness command calls this same function.
7. State-fact check, only where `gameState` is set: each fact in the A15 mapping table must appear as its printed line in the assembled prompt (`owner:` on cards outside the stack, `caster:` and `Stack item N` on stack items, `targets:`, `contextNotes:`, the zone sections). A missing line fails the gate.
8. Schema check: a backend vitest test parses every non-null `gameState` in the corpus with `gameContextSchema` from `apps/backend/src/validation/askAiRequest.ts` and fails, naming the case, on any it rejects (A3, A15).
9. Confirm Lambda packaging does not pick up the vector file (Risks): record the observation.
10. Add the system-map entry named under Applies.

## Acceptance criteria

- [ ] **B1.** The gate's tests are backend vitest tests under `apps/backend/src/eval/` that read cases through `scripts/lib/gold-cases.mjs` and run in `coverage:check` (A3)
- [ ] **B2.** The gate passes on the 18 migrated cases with a committed baseline of 16 hits
- [ ] **B3.** A planted fixture case with a dropped attached card fails the card check, and a planted case that lost a deciding rule fails the ratchet (tests)
- [ ] **B4.** State-fact check: a fixture case with a `gameState` (stack of two items with a caster, a battlefield card with an owner, a controller note) passes through `buildCaseRequest` and the real `preparePromptInput`, and a unit test fails the check when one stated fact's line is missing from the prompt
- [ ] **B5.** Re-freeze test: a fixture case whose stored query-text hash differs from its rebuilt query text, and whose baseline records a hit, is reported as awaiting a re-freeze, does not fail the gate, is neither a hit nor a miss in the ratchet, and the summary prints an awaiting-re-freeze count of 1; the same case with no vector at all fails the gate
- [ ] **B6.** Schema check: every non-null `gameState` in the corpus parses under `gameContextSchema`, and a planted fixture `gameState` the schema rejects (a turn phase outside `turnPhaseSchema`) fails the gate, naming the case
- [ ] **B7.** No network or model call: the gate test fails if the embedder is invoked
- [ ] **B8.** The frozen-vector build command stores a SHA-256 of each vector's query text, and the baseline raise command exists and is covered by a test
- [ ] **B9.** Lambda packaging does not pick up the frozen-vector file (dated observation line in `slice-b.evidence.md`)
- [ ] **B10.** The system-map entry `Rules test corpus gates and review` is in `PRD/sections/system-map.md` as `Status: partial`, with its `Lives in` line naming `apps/backend/src/eval/`
- [ ] **B11.** `npm run typecheck` is green with the gate tests importing the two `.mjs` modules (A3, M17)
- [ ] **B12.** `npm run quality:check` is green

## Verification

```bash
npm --workspace apps/backend run test
npm run eval:build-frozen-query-embeddings
npm run typecheck
npm run quality:check
```

## Files touched

- apps/backend/src/eval/rules-gate/ (new: gate logic, re-freeze check, tests, baseline, frozen query vectors)
- scripts/build-frozen-query-embeddings.mjs (or a sibling build script for corpus vectors)
- package.json (script entries)
- PRD/sections/system-map.md (new entry, partial)
