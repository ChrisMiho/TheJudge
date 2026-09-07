---
status: refined
---

# ai-answer-quality-baseline

Repeatable, human-reviewable answer-quality baseline for Ask AI, seeded from
the six worked-solution cases in `apps/backend/src/eval/worked-solutions/`
that carry published correct answers.

Captured by `thejudge-kickoff` under `graph is controlling` (run
`graph-20260906-092312`), unparking `PRD/ideasForLater/ai-answer-quality-baseline/`
after the hybrid-rule-retrieval shipment (PRs #197, #199). See `IDEA.md` for
the framing, prior-run receipts, and non-goals, and `intake/` for the staged
idea and the driver's measurement context note this package was seeded from.

Refined 2026-09-06 under `graph is controlling` (node 3, `define`). The design
record is `DESIGN-BRIEF.md`; the proposed product truth is `GATE-QUESTIONS.md`
(ten blocks: REQ-185 through REQ-190 new, NFR-018 / REQ-146 /
`system-map.md` `## Eval harness` / `goals-and-non-goals.md` amended; no blocker
questions). Nothing was written to `PRD/sections/` — implementation applies the
approved proposal alongside the code.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ai-answer-quality-baseline/DESIGN-BRIEF.md`
- Findings: none (attempt 1, 2026-09-06: 4 of 4 `Current:` excerpts byte-identical to live `PRD/sections/`; REQ-185–190 unused and the next free numbers after REQ-184; heading hygiene clean — 11 top-level headings, ten stable-id blocks plus `## Blocker questions`, the `## Eval harness` excerpts fenced; amendment-set re-grep leaves no uncovered live assertion; offline measurements reproduced: 6 worked-solution cases, 31 fixtures / 10 labelled / 0 with an answer key, four hard-coded cap-of-5 call sites in `preparation.ts`, `eval:worked-solutions` 6/6 under `EMBEDDING_PROVIDER=local`; cost figure labelled an estimate with no numeric target; no screen change; package state `refined`).
