# Slice G — Phase 0 run, findings, runbook, and product-truth apply

## Status: done

## Dependencies

Slices A to F

## Goal

Run the free offline half of the investigation, commit findings and the paid-phase runbook, and apply the finalized product-truth proposal to the PRD together with the code.

## Requirements

1. Phase 0 (brief section 5): create base (`3e973ced`) and head (`07cc3ab6`) worktrees with the tooling commits applied on top and record both SHAs; run the evidence trace from each and compare; run `eval:rules-staleness` and `eval:rules-coverage` on both; list the ten re-snapshotted cases and their review provenance; generate manifests; build arms A to D offline for every diagnostic case, record the observations that fix arm B, freeze B's revision; dry-run every paid phase for call counts and dollar estimates. If worktree setup (npm ci, embedding cache) is unavailable offline or denied, run the trace from this build checkout, label it, and write the base/head setup as owner runbook step 0; never fetch data or call a paid API.
2. Commit `docs/eval/answer-quality-investigation/OFFLINE-FINDINGS.md` and `RUNBOOK.md` (Phases 1 to 5, call counts, dry-run dollar estimates with rate check dates, caps and judge model left as owner inputs, decisions D0 to D5 preserved). Never run Phases 1 to 5.
3. **This is the one slice that applies the finalized proposal to `PRD/sections/`.** Apply by intent against current truth (not a blind patch replay) using `GATE-QUESTIONS.md` and the brief: new REQ-226 to REQ-230; amend REQ-185 to REQ-189 and NFR-018; the REQ-226 block carries the `system-map.md` edit; update `apps/backend/src/eval/worked-solutions/README.md`. Honour the two owner edits (REQ-226: no cross-checkout import, `--expect-commit`, regrade; REQ-188: SDK default timeout and retries, no production-timeout criterion). REQ-220/221 stay reserved; no `DEC-###`; no ID beyond REQ-226 to REQ-230.
4. Regression guard: `eval:answer-quality`, `:compare` and the trace commands appear in no gate script (`quality:check`, CI workflow).
5. Final slice carries the PRD promotion checklist (execution happens in cleanup) and Ship gates.

## Acceptance criteria

- [x] G1: `OFFLINE-FINDINGS.md` exists and records the commits measured, per-rule and complete-procedure coverage for the Academy Manufactor/Esix and Necropotence cases, the unchanged-input stratum size, the ten re-snapshotted cases with review provenance, and the staleness and coverage results
- [x] G2: The evidence trace run from the baseline-writing revision (or, if unavailable, this checkout with the reason stated) reproduces `baseline.json` hit and miss, recorded in the findings
- [x] G3: `npm run eval:rules-staleness` and `npm run eval:rules-coverage` have been run and their results recorded in the findings
- [x] G4: Both manifests are committed and arm B's revision id is frozen with its recorded observations
- [x] G5: Every paid phase was dry-run (no key, no network) and `RUNBOOK.md` records call counts and dollar estimates with each rate's check date
- [x] G6: `RUNBOOK.md` exists, covers Phases 1 to 5 with owner inputs (cap per phase, judge model) and decisions D0 to D5, and states no paid phase was run in the build
- [x] G7: REQ-226 to REQ-230 are present in `PRD/sections/functional-requirements.md` and REQ-185 to REQ-189 and NFR-018 are amended as the finalized proposal says, with both owner edits honoured
- [x] G8: The `system-map.md` answer-quality summary no longer says results are only merged per case, and `worked-solutions/README.md` describes experiment runs, trace, arms and manifests
- [x] G9: A grep over `PRD/sections/` finds no `--subject`, no new `DEC-` id, and no REQ id above REQ-230 added by this package
- [x] G10: A test or grep shows no gate script or CI workflow invokes `eval:answer-quality`, its compare command, or the trace commands
- [x] G11: `npm run quality:check` passes
- [x] G12: Backend tests pass
- [x] G13: A dated observation confirms no live OpenAI call, data refresh, or Scryfall fetch occurred during the build

## Verification

```bash
npm run eval:evidence-trace
npm run eval:rules-(staleness|coverage)
npm run eval:answer-quality
grep
npm run quality:check
npm --workspace apps/backend run test
```

No live OpenAI call; fake clients and stored fixtures only.

## Files touched

- `docs/eval/answer-quality-investigation/OFFLINE-FINDINGS.md (new)`
- `docs/eval/answer-quality-investigation/RUNBOOK.md (new)`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/system-map.md`
- `apps/backend/src/eval/worked-solutions/README.md`
- `scripts/ (regression guard test)`

## PRD promotion checklist

(Execution happens in cleanup; the apply already happened in this slice.)

- [ ] REQ-226 to REQ-230 live in `functional-requirements.md`; REQ-185 to REQ-189 amended
- [ ] NFR-018 amended in `non-functional-requirements.md`
- [ ] `system-map.md` answer-quality summary updated
- [ ] Findings and runbook live in `docs/eval/answer-quality-investigation/` (outside the work folder)
- [ ] Receipt records the owner inputs still needed before the paid phases

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/answer-quality-investigation/` ready to delete
- `PRD/sections/functional-requirements.md` also carries the REQ-185 to REQ-189 amendments and REQ-226 to REQ-230; `scripts/answer-quality-no-gate.test.mjs (new)` is the regression guard (G10)
- Build notes (by-intent differences from the shared proposal text, all recorded in the applied requirements): the arms live in `scripts/lib/diagnostic-arms.mjs`, not under `apps/backend/src/eval/answer-quality/`; the reference-answer test asks that no arm *adds* the answer, because arm A's own prompt already quotes rule text that equals many tier 1 and 2 answers; the compare report refuses on a reference-hash mismatch (the design brief and slice F1) instead of excluding the case; a judge failure is `undetermined` (REQ-186), only an answer failure is an `error` record; the evidence trace and compare gained `--manifest`, `--case`, written summaries and compare files so the applied text matches the code
- Phase 0 ran from the build checkout only (no second worktree); step 0 of `RUNBOOK.md` sets up the base and head worktrees
