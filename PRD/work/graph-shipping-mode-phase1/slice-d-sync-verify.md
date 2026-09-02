# Slice D — Sync + integration verification

## Status: done

## Goal
Mirror the skill changes, run the quality gates, and prove end-to-end that durable
truth is written only at apply, never at propose.

## Requirements
1. Run `npm run skills:ai-sync` so canonical `.claude/skills/` and mirror
   `.agents/skills/` are identical; commit the mirror.
2. `npm run quality:check` green for touched areas.
3. End-to-end dry run: take one behaviour-preserving target through propose → gate
   decision → apply, confirming `PRD/sections/` and code change **only** at apply.

## Acceptance criteria
- [x] D1 `npm run skills:ai-sync` leaves no diff (canonical and mirror in sync).
  Ran twice; the second run produced no unstaged change. Mirror updated for all
  six reworked skills, plus the previously-unmirrored `graph-run` (prior session's
  canonical edit) and `overnight-codehealth` (never committed before).
- [x] D2 `npm run quality:check` green (exit 0; 432/432 tests, protected-write
  guard and skill-sync checks included).
- [x] D3 Dry-run observed (2026-09-01) — see `## Dry run` below.

## Dry run — 2026-09-01

The package forbids a live autonomous graph run on itself (a run must not rewrite
the skills it is executing), so this is a **contract trace plus branch-diff
observation**, not a live orchestrated run.

- **Propose writes no `PRD/sections/`.** `thejudge-refinement/SKILL.md` `## Writes`
  now states "writes **only inside `PRD/work/<slug>/`** … never edits
  `PRD/sections/`"; the proposal lands in `GATE-QUESTIONS.md`. A behaviour-preserving
  target proposes no product truth at all → no `GATE-QUESTIONS.md` → no gate.
- **Apply writes truth + code together.** `thejudge-implement`/`-all` `## Writes`
  now write the real `PRD/sections/` edits "derived **by intent** … committed
  **together with the code**", exactly once across the package.
- **Close confirms once.** `thejudge-cleanup` confirms the truth `build` applied and
  "re-writes nothing that `build` already applied".
- **Branch-diff evidence.** `git diff --stat main...HEAD -- PRD/sections/` is
  **empty** across the whole branch — the workflow rework itself wrote no product
  truth, exactly as the package's non-goal requires, and there is no
  spec-ahead-of-code write at any propose step.

The live end-to-end multi-agent measurement is folded into the fixtures' owed
re-runs (`thejudge-refinement` item 5, the new `thejudge-implement` apply fixture),
which exercise propose→gate→apply on real targets under `skill-testing.md`.

## Verification
```bash
npm run skills:ai-sync && git diff --stat
npm run quality:check
```

## Files touched
- `.agents/skills/**` (mirror, generated)

## Ship gates
- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/graph-shipping-mode-phase1/` ready to delete

## PRD promotion checklist (execution in cleanup)
- This package produces **no** `PRD/sections/` product truth (agent-workflow only).
- Durable outcomes are the edited instruction docs (`graph-workflow-contract.md`
  et al.) and the reworked `thejudge-*` / graph skills, already in their canonical
  homes — nothing to promote out of the work folder except deleting it.
- Fold the run's ledger/receipt per cleanup's contract.
