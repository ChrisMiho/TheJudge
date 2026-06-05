# Slice D — Eval goldens, latency spike, and closeout

## Status: planned

## Goal

Lock prompt behavior with eval goldens and checklist checks, record manual latency/accuracy samples against the NFR-002 product risk, and complete ship gates for cleanup.

## Requirements

1. [REQ-022](../../sections/functional-requirements.md) — eval fixtures assert full GAME RULES block and remain under 35k cap (including `zero-cards`).
2. [NFR-002](../../sections/non-functional-requirements.md) — manual p50/p95 latency sampling recorded after integration.
3. [DEC-030](../../sections/decisions.md) — prompt section order includes game rules before OFFICIAL RULINGS.
4. Update eval harness checklist for game-rules presence and ordering.
5. Regenerate all context eval golden files intentionally.

## Acceptance criteria

- [ ] `contextEvaluationHarness.ts` adds checks: `game-rules-section-present`, `game-rules-before-rulings`, `prompt-under-budget` (35k).
- [ ] Every fixture `.prompt.golden.txt` includes full GAME RULES block with all curated topics.
- [ ] `zero-cards` fixture prompt length `< 35000` chars.
- [ ] `near-cap-stack` fixture prompt length `< 35000` chars.
- [ ] `npm --workspace apps/backend run test:eval` passes.
- [ ] `npm run quality:check` passes.
- [ ] Manual latency table filled below (5–10 live OpenAI scenarios via `npm run dev:openai`).
- [ ] Informal accuracy notes recorded (2–3 sentences per scenario or summary).
- [ ] Product-risk readout: latency acceptable / at risk / mitigation needed (context-driven selection).

## Verification

```bash
# Regenerate goldens after harness + prompt changes
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval

# Verify determinism
npm --workspace apps/backend run test:eval

# Full repo gate
npm run quality:check
```

Manual latency spike (`npm run dev:openai`):

| Scenario | Prompt chars | Latency (ms) | Notes |
|----------|-------------|--------------|-------|
| zero-cards (priority question) | | | |
| simple-interaction | | | |
| multi-step-stack | | | |
| near-cap-stack | | | |
| multi-zone | | | |
| _(add 0–5 more)_ | | | |

Record **p50** and **p95** across scenarios in the Status note when complete.

## Files touched

- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/eval/fixtures/*.prompt.golden.txt` (all)
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt`
- `apps/backend/src/eval/fixtures/README.md` (document new checklist IDs if needed)
- `PRD/work/general-game-rules-prompt/slice-d-eval-latency-closeout.md` (latency table + readout)

## Tests

- Harness unit tests for new checklist functions.
- Full eval golden suite via `test:eval`.

## PRD promotion checklist (for `thejudge-cleanup`)

Refinement already promoted durable PRD entries. On cleanup, verify — do not duplicate:

- [x] DEC-030 in `sections/decisions.md`
- [x] REQ-022 in `sections/functional-requirements.md`
- [x] Game Rules Data Strategy in `sections/integrations-and-data.md`
- [x] NFR-002 product-risk note in `sections/non-functional-requirements.md`
- [ ] Receipt at `PRD/instructions/receipts/general-game-rules-prompt-<YYYY-MM-DD>.md` with latency readout summary
- [ ] Delete `PRD/work/general-game-rules-prompt/` after receipt

## Ship gates

- [ ] Slice A–D acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green
- [ ] Public contract unchanged (`AskAiRequest`, API response, frontend)
- [ ] No secrets committed (`cr/source.txt`, `.env`, API keys)
- [ ] Durable outcomes confirmed in `sections/`; work folder ready for cleanup receipt

## Notes

- Golden diffs will be large — review that only GAME RULES insertion and budget change are intentional.
- If p95 exceeds NFR-002 3s target, document as **at risk**; do not implement context-driven selection in this work — note as deferred mitigation per DEC-030.
