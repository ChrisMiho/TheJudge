status: owner-action

# semantic-rule-retrieval

Upgrade System 3 supplemental rule retrieval from lexical TF-IDF to semantic
embedding retrieval (RAG), and fix combo over-assertion. Design/build follow-on
to the `combo-context-validation` investigation (done). Starts investigate-first:
resolve the local-vs-OpenAI query-embedding question with measurement before the
DESIGN-BRIEF.

See `HANDOFF.md` (start here) and `IDEA.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/semantic-rule-retrieval

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/semantic-rule-retrieval/DESIGN-BRIEF.md`
- Findings: none (attempt 2). Attempt 1 failed on stale IDF/keyword "Built:"
  lines in `quick-lookup/README.md` and `in-depth/README.md`; both were amended
  to semantic-primary + lexical fallback + fixed query construction, added to
  the brief amendment list, and gated in `GATE-QUESTIONS.md`. Re-check confirmed
  all 9 amended units consistent and no new contradiction.
