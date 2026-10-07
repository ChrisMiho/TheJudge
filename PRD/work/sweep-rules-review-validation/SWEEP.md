# Sweep — rules-review-validation

- Date: 2026-10-06
- Corpus: output/rules-review/batch-001.md … batch-015.md (15 sections, 375 items; gitignored owner review renders of the draft rules-test cases)
- Question: Is each case's reference answer and short answer actually correct under the committed Comprehensive Rules and card oracle text / rulings, does the question match the attached cards and the ruling it cites, and does the verdict already written in the slot (approve / edit / reject, pre-screen of 2026-10-06) hold?
- Verdicts: confirmed / wrong-verdict / wrong-answer / wrong-question / unverifiable
  - confirmed — answer correct, question matches the cards, slot verdict holds
  - wrong-verdict — answer and question are fine but the slot verdict should change (say to what)
  - wrong-answer — the reference or short answer is wrong under the committed rules (quote the rule)
  - wrong-question — the question misstates a card, the ruling, or drops a premise the answer needs
  - unverifiable — the data needed is not in the repo (say what is missing)
- Scored against: apps/backend/data/cr/source.txt (Comprehensive Rules effective 2026-08-07), gameRulesRuleIndex.json, cardDetailByOracleId.json.br (oracle text), cardRulingsByOracleId.json.br (rulings), apps/backend/src/eval/worked-solutions/*.case.json, output/rules-review/ANSWERS.md + TRIAGE.md (the pre-screen reasoning)
- Cost plan: worker opus/high, 1 section per agent, 15 agents, synthesis opus
- Workflow runId: wf_07019f4f-c72

## Batches
One batch file per agent: batch-001 … batch-015.
