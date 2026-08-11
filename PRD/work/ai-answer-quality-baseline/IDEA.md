# ai-answer-quality-baseline

TheJudge's backend eval harness (`apps/backend/src/eval/`) scores prompt and context *structure* — `buildPromptContext()` and `buildPromptText()` goldens, plus optional labeled System 2 / System 3 retrieval relevance (DEC-047, REQ-032). Nothing measures the quality of the answer the model actually returns. That gap matters now because the next tier of work is enrichment (`commander-spellbook-combos`, WotC rulings tuning, Q-004 second-pass rules retrieval), and each of those changes is justified by "the answer gets better" with no instrument that can confirm or refute it.

Outcome: a repeatable, human-reviewable answer-quality baseline over the existing fixture corpus, so a prompt or enrichment change can be shown to help, hurt, or do nothing. The likely shape is a scored rubric run against real provider answers for a curated fixture subset, recorded as a comparable artifact rather than a pass/fail golden — model answers are non-deterministic, so this must not become a brittle exact-match gate wired into `npm run quality:check`.

Non-goals: not a replacement for the existing structural context/prompt goldens; not an automated CI gate that blocks PRs on model output; no new product surface, endpoint, or `AskAiRequest` contract change; no swap of provider or model as part of this work; not a general-purpose LLM eval framework beyond what TheJudge's own fixtures need.

## Open shaping questions (for refinement)

- **Judge mechanism:** LLM-as-judge against a rubric, human review pass, or assertion-style checks per fixture — each has different cost and trust characteristics.
- **Cost and cadence:** running real provider answers costs money and time; is this an on-demand command (like `npm run prompt:preview`) or something scheduled?
- **Scoring dimensions:** candidate axes are rules correctness, use of supplied context, citation of WotC rulings/CR when relevant, hedging vs. overconfidence, and length/readability.
- **Fixture subset:** the full corpus is ~15 scenarios; the baseline may want a smaller curated set plus targeted cases for each enrichment source.
- **Sequencing vs. enrichment:** whether this must land before `commander-spellbook-combos` implementation or can run alongside it.
