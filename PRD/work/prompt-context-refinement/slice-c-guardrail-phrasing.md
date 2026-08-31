# Slice C — Guardrail wording + phrasing glossary

## Status: done

## Goal

The lookup off-domain guardrail stops refusing common valid Magic phrasing
("combo," "aggro," etc.) while still refusing genuinely non-Magic input, and a
maintained glossary doc explains what each phrasing category means so the
owner can read and extend it without guessing.

## Requirements

REQ-168.

1. `promptAssembly.ts` (~line 142) — reword the off-domain guardrail
   instruction line so common Magic-adjacent phrasing (combo, infinite combo,
   aggro, control, ramp, tempo, stax, wheel, mill, blink, sacrifice outlet,
   and similar community terms) is treated as in-domain and answered; the
   "not found in the rules corpus" persona is reserved for input that is
   genuinely not about Magic. Stays a single instruction line — no
   classifier, validator, detection branch, or log signal.
2. New durable glossary doc (recommend
   `PRD/sections/system-map/lookup-phrasing-glossary.md`) — each phrasing
   category names its example phrases **and** a plain-language explanation of
   what the phrase means in Magic, so the doc reads standalone (per the
   owner's gate edit). The reworded prompt instruction reflects this
   guidance.
3. Eval fixtures — the existing off-domain golden keeps refusing genuinely
   non-Magic input; a new fixture pins that a common Magic-adjacent phrase
   (e.g. "how do these combo") is answered rather than refused.

## Acceptance criteria

- [x] C1 — The lookup-mode guardrail instruction line answers questions using
  common non-official-but-valid Magic phrasing and reserves the "not found in
  the rules corpus" persona for input genuinely unrelated to Magic.
- [x] C2 — A new durable glossary doc exists with each phrasing category's
  example phrases and a plain-language explanation of what the phrase means in
  Magic; it is discoverable from `promptAssembly.ts` or its adjacent
  documentation.
- [x] C3 — A question about "a combo," with or without cards attached, is
  answered as a Magic question in the eval harness, not refused as "not a
  mechanic."
- [x] C4 — The off-domain golden fixture (`quick-lookup-off-domain`) still
  refuses a genuinely non-Magic input; a new fixture pins the reworded
  behavior for a common Magic-adjacent phrase.
- [x] C5 — No classifier, validator, detection branch, or off-domain log
  signal is added; the guardrail stays one instruction line in the assembled
  prompt. See `slice-c.evidence.md` (2026-08-30).

## Verification

```bash
npm --workspace apps/backend run test
npm --workspace apps/backend run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/prompt/promptAssembly.ts`, `promptAssembly.test.ts`
- `PRD/sections/system-map/lookup-phrasing-glossary.md` (new)
- `apps/backend/src/eval/fixtures/quick-lookup-off-domain.*` (verified
  unchanged), plus a new common-phrasing-answered fixture set
