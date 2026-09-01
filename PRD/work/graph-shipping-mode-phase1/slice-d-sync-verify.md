# Slice D — Sync + integration verification

## Status: planned

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
- [ ] D1 `npm run skills:ai-sync` leaves no diff (canonical and mirror in sync).
- [ ] D2 `npm run quality:check` green.
- [ ] D3 Dry-run observed: propose step produced no `PRD/sections/` change; apply
  step produced the durable truth + code together (dated observation).

## Verification
```bash
npm run skills:ai-sync && git diff --stat
npm run quality:check
```

## Files touched
- `.agents/skills/**` (mirror, generated)

## Ship gates
- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/graph-shipping-mode-phase1/` ready to delete

## PRD promotion checklist (execution in cleanup)
- This package produces **no** `PRD/sections/` product truth (agent-workflow only).
- Durable outcomes are the edited instruction docs (`graph-workflow-contract.md`
  et al.) and the reworked `thejudge-*` / graph skills, already in their canonical
  homes — nothing to promote out of the work folder except deleting it.
- Fold the run's ledger/receipt per cleanup's contract.
