# Handoff — combo-context-validation (INVESTIGATE FIRST)

You are picking this up in a fresh session with no prior conversation. Read this
whole file and `IDEA.md` in the same folder before acting. This is an
**investigation**, not a build.

## Mission

Find out whether the context TheJudge generates is good enough for the model to
correctly resolve real multi-card **combos** — and, when it isn't, identify
**which context was missing** that led the model to the wrong answer. Produce a
findings report. Do **not** ship a feature or edit product truth; building comes
later, only if the findings justify it. The owner explicitly chose "investigate
first" over building durable tooling now.

## Why combos are the right lens

The committed Commander Spellbook combo corpus is a large, **labeled** set of
resolved multi-card interactions: each combo carries its ingredient cards plus a
documented result and steps — ground truth for "what these cards do together."
Combos always get combo-context injected into the prompt, so this specifically
probes whether the **broader** context (System 3 rules retrieval, card
metadata/rulings) is pulling its weight — not just whether combo enrichment fires.

## Method (investigate-first)

1. **Sample** combos from the corpus (see "Decide early" for N and selection).
2. For each, build the real `mode: "lookup"` request with **all** the combo's
   cards attached (the just-shipped multi-card feature) plus a natural question
   like "How do these cards combo together?"
3. Run it through the **real prompt pipeline** against the **live** provider
   (OpenAI) to get the model's actual answer.
4. **Grade** the answer against the combo's known result/steps: did it correctly
   identify and explain the combo?
5. On wrong/weak answers, **diagnose the context**: was the rule the model needed
   actually retrieved into the prompt (System 3 top-k)? Was per-card
   metadata/rulings sufficient? What was missing or misleading that caused the
   miss?
6. **Report**: a verdict per combo, the recurring themes of missing/insufficient
   context, concrete examples, and recommendations for what to build next.

`thejudge-sweep` is the natural skill for this — it is the off-graph,
investigate-and-report counterpart to graph-run: score every item in a corpus
against a question and report a verdict per item, one review at the end. Consider
invoking `/thejudge-sweep` with this file as the brief. If it doesn't fit cleanly,
run the investigation directly per the method above.

## Repo facts (verify before relying on them)

- **Combo corpus:** `apps/backend/data/commander-spellbook/` (built by
  `scripts/build-commander-spellbook-combos.mjs`, refreshed at popularity floor
  0 = full corpus). Confirm the per-combo shape (ingredient card ids/names,
  result text, steps/description, popularity) before generating cases.
- **Prompt pipeline entry:** `preparePromptInput` in `apps/backend/src/prompt/`
  is the production prompt-preparation used for every real lookup. The multi-card
  lookup request carries `cards[]` (max 5) under `mode: "lookup"`. `preparation.ts`
  builds the System 3 supplemental-retrieval query over the question + every
  attached card; `promptAssembly.ts` assembles the final text.
- **The multi-card + partial-combo feature you depend on** (REQ-167, REQ-094
  amended, REQ-095) shipped in PR #152, merged into branch
  `thejudge-auto/prompt-context-refinement-v2`. **It is NOT in `main` yet** — PR
  #151 (`…-v2` → `main`) was still open when this handoff was written. **This
  handoff branch is based off `origin/thejudge-auto/prompt-context-refinement-v2`,
  so the feature is present here.** Once #151 merges, `main` has it too and you
  may rebase onto `main` if you prefer. Confirm `cards[]` support exists on your
  base (grep `askAiRequest.ts` for the lookup `cards` schema) before starting.
- **Live provider:** `ASK_AI_PROVIDER=openai`, `OPENAI_MODEL` (default
  `gpt-4.1-mini`), secrets in `.secrets/openai-dev.env` (copy from
  `secrets-templates/openai-dev.env.example`). Verify with
  `npm run openai:verify-credentials` before any live batch. **Live calls cost
  money** — no live spend has been incurred in the project so far, so you are
  establishing the first real usage; be deliberate.
- **Precedent to reuse, do not reinvent:** `scripts/compare-combo-answer-quality.mjs`
  (REQ-146 / DEC-161) is an opt-in `--confirm-live-calls` harness that already
  spins up a configured backend, loads the combo catalog, and answers combo
  scenarios against the live provider for human review. Read it first — it shows
  how to make live calls and structure scenarios (`scripts/fixtures/combo-answer-quality-scenarios.json`).
- **Related pattern:** the just-shipped worked-solutions eval (NFR-018) at
  `apps/backend/src/eval/worked-solutions/` uses `expectedSupplementalRuleIds`
  retrieval-hit checks — a clean way to ask "did the right rule get retrieved."

## Decide early (the owner is available to answer)

1. **Sample size + selection.** How many combos and chosen how — random, by
   popularity, by ingredient count, or a deliberate spread of "attach all cards"
   (expect complete) vs. "drop one card" (expect partial)? Recommend a small
   pilot (~15–25) first to shake out the harness and cost, then scale.
2. **Grading of failures.** Automated LLM-judge that tags the missing-context
   category, human review, or both? Combo steps are player-facing prose, so
   grading is fuzzy — recommend an LLM-judge for first-pass tagging plus a human
   spot-check.
3. **What "correct" means.** Define the rubric against the combo's result/steps:
   did the answer identify the combo, explain the payoff, and get the mechanism
   right? Distinguish "wrong" from "incomplete."
4. **Spend ceiling** for the live leg.

## Constraints

- **Investigation only.** Throwaway/opt-in scripts (under a scratch dir or
  `output/`) are fine; do NOT ship durable features, edit `PRD/sections/` product
  truth, or open a feature PR. The deliverable is a report.
- **Live calls are gated and cost money.** Require an explicit confirm flag,
  print a dry-run plan and a rough token/cost estimate before any live batch, and
  respect the spend/sample ceiling.
- **Do not disturb the parked `prompt-context-refinement` run** — branch
  `thejudge-auto/prompt-context-refinement-v2`, worktree
  `.worktrees/implement-prompt-context-refinement`, PRs #151 and #152. Never
  merge or close its PRs.
- **Subagents are encouraged** (owner approved) to generate/run cases faster —
  keep each subagent's task bounded and its live-call budget explicit.
- Never commit secrets; never run `npm run data:refresh` or any Scryfall network.

## Deliverable

A gap-analysis report — write it to `PRD/work/combo-context-validation/FINDINGS.md`:
per-combo verdicts (correct / partial / wrong), the recurring themes of missing or
insufficient context, concrete failing examples with the actual assembled prompt,
and concrete recommendations for what to build. The owner decides next steps from
the report.
