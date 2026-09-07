# Probe — combo-context-validation status & the 18/18 confusion

**Question (owner, 2026-09-07):** combo-context-validation "needs to be
completed." Recent RAG work raised rules 5→10 but a recent test wasn't 18/18 as
thought. What's implemented, what works, what isn't, and is this work still
needed — goal is to tune the generated context to push rules-resolution success.

**Mode:** answer. Read-only synthesis of existing artifacts; nothing built.

## What was read
- `PRD/ideasForLater/combo-context-validation/` — IDEA, README, FINDINGS, HANDOFF (investigation complete 2026-08-31).
- `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md` — the shipped answer-quality instrument (PR #203) + run 3 numbers.
- `PRD/sections/functional-requirements.md` — REQ-177..181 (RAG, shipped/live), REQ-185..190 (answer-quality instrument), REQ-190 + REQ-181/182 (excerpt cap stays 5 in prod).
- `git`/`gh` — no open PRs, `PRD/work/` empty, no cap-5→10 or over-assertion package in flight.

## Findings (evidence)

1. **combo-context-validation is a *complete investigation*, not unfinished work.**
   It answered its own question: context is sufficient (488/500 = 97.6%, zero
   missing-context gaps). It surfaced two levers.
   - Lever 1, RAG rule retrieval → **SHIPPED and live** (REQ-177..181; PRs
     #191/#192/#197/#199; prod embedder fixed #204, #205).
   - Lever 2, combo over-assertion fix → **NOT built.** Lives only as FINDINGS
     recommendation #2. Measured 2/50 false-combo on deliberately unrelated cards.

2. **The 5→10 the owner means is the System-3 *excerpt cap*, and it is NOT the RAG
   ship.** RAG (semantic retrieval) shipped separately. Production still caps rule
   excerpts at **5** (REQ-181/182/190). The answer-quality instrument made the cap
   a *run parameter* to A/B 5 vs 10 — production unchanged.

3. **18/18 vs 16/18 — resolved.** Answer-quality run 3 (the corrected run, after
   two instrument bugs fixed), deployed model **gpt-4.1**:
   - cap **5** (what production runs today): **16/18** correct.
   - cap **10**: **18/18** correct.
   The two flipping cases (510.1c, 113.7a) only reach the prompt at cap 10.
   Retrieval-only measure `goldRuleInPrompt`: 14/18 @ cap5, 16/18 @ cap10.
   The owner's remembered "18/18" was the cap-10 number; live is 16/18.
   Nuance: cap 10 *helped* gpt-4.1 (deployed) but *regressed* the smaller models
   (gpt-4.1-mini 17→15, gpt-5-nano 15→13); latency ~unchanged (3.4–3.5s).

## Bottom line
Don't "complete" combo-context-validation — it delivered. The concrete, already-
measured lever to push rules-resolution success is **raise the deployed excerpt
cap 5→10** (16/18 → 18/18 for the deployed model). Second lever: the combo
over-assertion prompt fix (player-trust). Both are new small packages, not a
reopening of this investigation.
