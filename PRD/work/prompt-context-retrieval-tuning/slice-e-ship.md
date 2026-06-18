# Slice E — Ship gates

## Status: planned

## Goal

Verify all prior slices, run the full quality gate, and prepare the work folder for cleanup promotion.

## Requirements

1. All slice acceptance criteria for A–D satisfied.
2. `npm run quality:check` green from repo root.
3. No `AskAiRequest`, Zod schema, or frontend contract changes.
4. `MAX_PROMPT_CHAR_BUDGET` unchanged.

## Dependencies

- Slices A, B, C, D

## Acceptance criteria

- [ ] Slice A verification commands exit 0
- [ ] Slice B verification commands exit 0
- [ ] Slice C verification commands exit 0 (`test:eval` green)
- [ ] Slice D verification commands exit 0
- [ ] `npm run quality:check` exits 0
- [ ] `npm --workspace apps/backend run test:eval` exits 0
- [ ] `npm run retrieval:report` exits 0
- [ ] No changes under `apps/frontend/`
- [ ] Prompt size reduced for phase-irrelevant fixtures vs pre-change baseline (manual spot-check one `main_1` golden diff)

## Verification

```bash
npm --workspace apps/backend run test:eval
npm run retrieval:report
npm run quality:check
```

## Files touched

No new product code. Verification only.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged — no API, HTTP, or AskAiRequest shape changes
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/prompt-context-retrieval-tuning/` ready to delete

## PRD promotion checklist

_(Execution in cleanup skill)_

- [ ] `sections/decisions.md` — confirm DEC-045, DEC-046, DEC-047 entries reflect shipped behavior (Status stays `confirmed`; no catalog-style shipped flip here)
- [ ] `sections/functional-requirements.md` — REQ-022, REQ-032 acceptance criteria already amended; verify alignment
- [ ] `sections/integrations-and-data.md` — game-rules assembly bullets match selection + scoring
- [ ] `sections/non-functional-requirements.md` — note post-ship latency re-sample if not done in implement
- [ ] `sections/system-map.md` — flip relevant entries to `shipped` per promotion gate (deferred from map-out per DESIGN-BRIEF)
- [ ] `sections/open-questions.md` — Q-001 remains open if vocabulary stays manual
- [ ] Write receipt `PRD/instructions/receipts/prompt-context-retrieval-tuning-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/prompt-context-retrieval-tuning/` after receipt
