Nothing required yet (FYI): preparing an evidence-based handoff for improving complex-interaction answers.

# Probe — answer quality

> **`GRAPH-BRIEF.md` is spent.** It was the intake for `answer-quality-investigation`, which shipped (PR #275). Do not kick off from it again. The next intake is `REPORT.md` (its Hand-off section).

- Date: 2026-10-07
- Question: How should the next agent integrate pending data work, compare old and new answers, isolate retrieval/prompt defects, and decide whether to retain GPT-4.1?
- Intake: `PRD/work/bigChunk/thoughts.md`
- Mode: brief (the intake requests a game plan to hand to an agent).
- What ran: repository and GitHub reads; two independent subagent probes; offline production prompt assembly with frozen vectors; corpus/snapshot comparison from base and PR Git blobs; official model documentation lookup. No live API evaluation or merge.
- Evidence: `FINDINGS-retrieval.md`, `FINDINGS-evaluation.md`, `FINDINGS-integration.md`.
- Outcome: current tester requests both omit deciding rules despite complete card/ruling delivery; historical grades are insufficient for a paired baseline; a self-contained comparison/investigation handoff is in `GRAPH-BRIEF.md`.
- Scope: only this probe directory was written; no lifecycle status, product code, PRD truth, PR, merge or deployment changed.

## Paid half — 2026-10-08/09

- Question: was a shaky answer missing evidence, badly presented, or bad model reasoning; does GPT-6 Luna beat GPT-4.1?
- What ran: runbook Phases 1, 3, 4 (Phase 2 skipped by owner decision) from `.worktrees/aq-paid` at tooling commit `da2221e2`; judge `gpt-6.1-sol`; $11.44 spent of $45 approved; every live run owner-launched.
- Record: `PAID-RUN.md` (per phase). Report: `REPORT.md` (Phase 5 hand-off). Owner reviews: `PHASE-1-BLIND-GRADING.md` (done), `PHASE-4-BLIND-REVIEW.md` (pending).
- Outcome: neither evidence nor presentation rescues; the hard failures are model reasoning. Luna at least as right, blind-preferred, ~20× cheaper, but over the 15 s production timeout on 4 of its 10 hardest answers.
