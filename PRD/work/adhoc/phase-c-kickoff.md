# Kickoff — docs-refactor Phase C (retire the decision log)

Paste the prompt below into a **fresh session on an up-to-date `main`**
(`git checkout main && git pull` first, so it sees PRs #124–#126).

Phase C is **not** a `/graph-run` and **not** a sweep — it edits `thejudge-*`
skills, which automated runs may not touch. It is an ordinary interactive
session, and it is the one irreversible step in the refactor, so it is
deliberately plan-first: let it show you the plan (which decisions delete, which
citations move) before it edits anything.

## The prompt

```
Phase C of the docs-refactor — retire the decision log. This is an ordinary
interactive session, NOT a graph run and NOT a sweep (it edits thejudge-* skills,
which automated runs may not touch).

Read first, in order:
- PRD/work/adhoc/refactor-gameplan.md — Phase C ("retire") plus the "Binding
  constraints" section; every constraint there is a settled ruling, do not
  relitigate it.
- PRD/work/adhoc/PROGRESS.md — current state (Phase A + B done, C next).
- PRD/work/sweep-decision-audit/DISPOSITION.md and ROLLUP.md — the Phase B audit
  verdicts and dispositions. This is the deletion map.

Then plan before touching anything (this deletes ~149 decision entries and edits
5 skills — brainstorm/plan it, show me the plan, and wait for my approval).

What Phase C does:
- Flip precedence: the 7 specs stop being drafts and become truth; the decision
  log drops to #2. Remove the draft markers.
- Delete the decisions the audit proved absorbed (the `absorbed` verdicts plus
  the applied fix-spec/fix-doc rows).
- Retire the 3 obsolete decisions (DEC-067, DEC-121, DEC-089).
- KEEP the 2 Lambda decisions (DEC-084, DEC-169) — their content isn't captured
  anywhere durable yet; deleting would lose it.
- Rewrite the decision-writing step in the 5 thejudge-* skills, replace the
  decision template, point the define gate at REQ IDs, update the 21 remaining
  citations.

Hard guardrails (from the gameplan):
- Never renumber an ID. Requirement IDs survive even though decision IDs retire —
  they become the gate's unit of review.
- Every measured bound travels with the row it belongs to; rejected-alternatives
  and measured-bounds fields are preserved.
- PR to main, never push — I merge.

When the verdicts have been consumed, close out PRD/work/sweep-decision-audit/
(receipt + delete) as part of the cleanup.
```

## Why plain, not a graph run

The graph lifecycle and the `thejudge-*` skills implement product features; a run
may not edit the skills themselves. Phase C rewrites the decision-writing step in
five of those skills and replaces the decision template, so it has to be driven
by hand. See the gameplan's Phase C note: "Must be an ordinary interactive
session."
