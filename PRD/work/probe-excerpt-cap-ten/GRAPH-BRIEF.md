# Graph-run brief — Raise the deployed System 3 rule-excerpt cap from 5 to 10

Self-contained intake for `graph-kickoff`. The investigate-first question — *does
attaching more than five rule excerpts help the answer?* — is **resolved with data
below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

Better rules answers on hard questions. When a player asks Ask AI a rules
question, the app attaches the most relevant Comprehensive Rules excerpts to the
prompt. Today it attaches at most **five**. This raises that to **ten**, so the
deciding rule reaches the model on questions where it previously fell just outside
the top five — the deployed model then answers correctly where it used to miss.

## Why (measured — do not re-derive)

The just-shipped answer-quality instrument (REQ-185–190, PR #203) measured this
directly. **Run 3** (the corrected run, `results.json` at `gitCommit b3f860f`, the
18-case worked-solution gold set, judge `gpt-5`), for **gpt-4.1 — the deployed
model**:

| Excerpt cap | Correct answers (worked-solution gold set) | Gold rule reached the prompt |
| --- | --- | --- |
| **5** (production today) | **16 / 18** | 14 / 18 |
| **10** | **18 / 18** | 16 / 18 |

- The two cases that flip to correct at cap 10 are **510.1c** and **113.7a** —
  their deciding rule only enters the prompt when the cap is ten.
- Retrieval-depth benchmark (156 questions, driver context note 2026-09-06):
  recall **top-5 89.7% → top-10 94.2%**; 9 of 156 never reach the top 10.
- **Latency is unchanged**: gpt-4.1 answers in 3.4–3.5 s at either cap.
- **No re-ranking risk**: `retrieveRulesForQueryWithDebug` already returns
  `runnerUp` as ranks 6–15 of the *same* scored list, so a cap-10 call's top 5 is
  byte-identical to the cap-5 call's and slots 6–10 come from that same list —
  proven in `preparation.test.ts` (REQ-190). Raising the cap adds excerpts; it
  never reorders the ones already shown.

## Decisions already made — do not re-litigate

- **Deployed model is `gpt-4.1`** (confirmed from the Lambda env, 2026-09-07), so
  cap 10 is a strict win — it gained two cases and regressed none for that model.
- **The cap moves 5 → 10 for every System 3 consumer** (In-Depth Question and
  Quick Question), as one shared value — not a per-surface cap.
- **No new retrieval or ranking work** — this is a one-constant change riding on
  the existing hybrid retrieval that already shipped (REQ-177–181).

## Design direction (converged)

- **Code:** flip `DEFAULT_SUPPLEMENTAL_RULE_CAP` in
  `apps/backend/src/prompt/preparation.ts:52` from `5` to `10`. The four
  production call sites (lines 247/291/336/374) already read the constant, so no
  other code path changes. Update `preparation.test.ts`'s cap assertions.
- **The bulk of the work is amending product truth** — many `PRD/sections/`
  assertions say "five excerpts". They must all move to ten, consistently
  (amendment set enumerated below).
- **Keep the eval instrument (REQ-190) intact.** Its excerpt-cap A/B still runs;
  its production-baseline leg becomes cap 10, and refinement decides what the
  comparison leg is now (e.g. 10 vs 15, to keep asking "does even more help?").

## Current-state PRD truth to amend

The "five-excerpt" assertion is cross-cutting; this is the grep-enumerated
amendment set (verify each before editing — line numbers drift). Do **not** edit
here; refinement/graph-kickoff own the write.

- `PRD/sections/functional-requirements.md`:
  - REQ-181 — "existing five-excerpt slot" / "up to 5 excerpts" (≈ lines 4180,
    4189, 4191)
  - REQ-182 — "remains capped at 5 excerpts" (≈ 4231)
  - REQ-176 seam note — "five-excerpt cap … unchanged" (≈ line 390)
  - REQ-159 prompt-shape note — "supplemental section still carries up to 5
    excerpts" (≈ 4112)
  - REQ-190 — "production stays at five" / "System 3 stays capped at five" (≈ 4444,
    4458) and the cap-baseline framing (≈ 4449)
  - the System 3 recall-harness criteria — "top-5 retrieval results" (≈ 586, 587,
    589) → top-10
- `PRD/sections/system-map/game-rules-retrieval.md` — "returns the top five
  excerpts" (≈ 73) and "capped at five supplemental excerpts per request" (≈ 121)
- `PRD/sections/system-map.md` — retrieval-report "System 3 top-5" (≈ 493);
  answer-quality "deployed five-excerpt limit … production stays at five" (≈ 500);
  combo-enrichment "capped at five" is a **different** cap (combo variants, REQ-094)
  — **do not touch** (≈ 549)
- `PRD/sections/in-depth/README.md` — "up to 5 excerpts (System 3)" (≈ 431)
- `PRD/sections/quick-lookup/README.md` — "top 5" (≈ 329)

Refinement should decide whether to add a single REQ that *owns* the cap value
(so it stops being asserted in a dozen places) or keep amending the existing
criteria in place. The decision log is retired — no new DEC; amend in place.

## Constraints (don't rediscover)

- **Smaller models regress at cap 10** (gpt-4.1-mini 17→15, gpt-5-nano 15→13 in
  run 3). We deploy gpt-4.1, so this does not bite today — but **record it**: if
  the deployed model ever changes to a smaller one, the cap decision must be
  revisited.
- **Prompt grows** by ~5 extra excerpts × ~70 tokens ≈ **+350 tokens/request**.
  Small against DEC-042's effectively-unlimited character budget, but quantify the
  token/cost delta and confirm it stays within budget.
- **End-to-end production latency was not measured here** — only model
  answer-latency (unchanged). NFR-002's 3-second target and a real prod latency
  sample are a *separate* parked follow-up. Refinement decides whether to gate the
  cap change on a prod latency sample or ship and sample after; do not fold the
  NFR-002 sampling package into this one.
- **Do not reopen the answer-quality instrument** (shipped, PR #203). This package
  consumes its measurement; it does not modify it.
- **Combo-variant cap (five) is unrelated** — REQ-094/095's five-variant retrieval
  cap is a different number; leave it alone.

## Evidence + reusable tooling

- Full status synthesis: `PRD/work/probe-combo-context-status/PROBE.md`.
- The measurement: `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md`
  (run 3 numbers) and REQ-190's measured notes in `functional-requirements.md`.
- The instrument: `npm run eval:answer-quality -- --confirm-live-calls` and
  `scripts/eval-answer-quality.mjs` — re-run to reproduce the 16/18-vs-18/18 result.

## What the graph run should produce

A DESIGN-BRIEF that treats this as a small, high-confidence change: the one-line
`DEFAULT_SUPPLEMENTAL_RULE_CAP` flip with its test update, the full `PRD/sections/`
amendment set moved 5→10 consistently, the eval instrument's baseline leg updated
to cap 10 with a refreshed comparison leg, and the smaller-model-regression and
token-cost notes recorded. Slices are likely: (A) constant + test, (B) product-truth
amendment across the enumerated files, (C) instrument baseline update. The
distraction-vs-recall question, the deployed-model decision, and the no-re-ranking
proof are already settled above — do not reopen them.

## How to hand this off

/graph-kickoff "Raise the deployed System 3 rule-excerpt cap from 5 to 10" PRD/work/probe-excerpt-cap-ten/GRAPH-BRIEF.md
