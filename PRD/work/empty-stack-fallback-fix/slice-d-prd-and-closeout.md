# Slice D — PRD promotion and closeout

## Status: planned

## Goal

Record durable product decisions, update user-flow docs, verify the reported walkthrough is fixed, and remove this ephemeral work folder.

## Depends on

- Slices A, B, C complete

## Requirements

### `PRD/sections/user-flows.md` — FLOW-001 edge cases

Update the blank-question edge case from:

> if the question is blank after trimming, use the fallback question **Resolve the stack**

To zone-aware wording, e.g.:

> if the question is blank after trimming, use a zone-aware fallback: **Resolve the stack** when the stack zone has cards; otherwise **Explain the interaction with the provided game state** when other selected zones have cards

Add edge case (if not present):

> if stack is selected but has no cards and another selected zone has cards, submit remains allowed; enrichment shows what will be sent before decrypt

### `PRD/sections/decisions.md`

Add **DEC-###** (next available ID) covering at minimum:

- Blank-question fallback is zone-aware (stack populated → resolve stack; else board-state wording)
- Skipping targets does not affect stack payload; `targets: (none)` means unspecified, not empty stack
- Submit is not blocked for empty stack when other zones have cards
- Optional UX: enrichment summary + zone-collection nudge for selected-but-empty stack

### `PRD/sections/functional-requirements.md`

Optional new REQ or note under existing submit/question reqs if a natural home exists — only if promoted behavior needs traceability beyond FLOW-001.

### Verification

Run full quality gate:

```bash
npm run quality:check
```

Manual walkthrough (same as [GAMEPLAN.md § Verification checklist](GAMEPLAN.md#verification-checklist)):

1. `main_1`, battlefield-only, skip targets, blank question
2. Confirm summary, payload question, and AI answer align

### Closeout per `doc-lifecycle.md`

1. Confirm all slice docs marked **complete** with date
2. Update [README.md](README.md) slice table — all **complete**
3. **Delete** entire folder `PRD/work/empty-stack-fallback-fix/`
4. Do **not** add this folder to `PRD/README.md` unless navigation guidance changed (default: no link)

## Acceptance criteria

- [ ] FLOW-001 updated with zone-aware fallback
- [ ] DEC-### merged in `decisions.md`
- [ ] Walkthrough repro passes (manual or automated)
- [ ] `quality:check` green
- [ ] Work folder deleted
- [ ] No stale references to this package in code (optional grep)

## Files

- [`PRD/sections/user-flows.md`](../../sections/user-flows.md)
- [`PRD/sections/decisions.md`](../../sections/decisions.md)
- [`PRD/sections/functional-requirements.md`](../../sections/functional-requirements.md) (optional)
- This work package (delete when done)
