# Quality check — answer-quality-investigation (attempt 2, re-grade after owner verdicts)

Verdict: FAIL
Checked artifact: `PRD/work/answer-quality-investigation/DESIGN-BRIEF.md` (with the finalized `GATE-QUESTIONS.md` as the product-truth proposal)
Date: 2026-10-07 (graph run graph-20261007-134015, node 4 gate-qc, attempt 2)

## What passed

- All 11 blocks (REQ-226 to REQ-230, REQ-185 to REQ-189, NFR-018) open with What this decides / In plain terms / What happens if you say no, carry a complete diff, and have a filled `- Verdict:` slot (9 accept, 2 edit: REQ-226, REQ-188). The proposal is correctly not yet applied to `PRD/sections/`.
- REQ-226 edit is applied consistently: no `--subject` import in REQ-226, commit-recorded identity, `--expect-commit`, regrade mode with its refusals and tests; brief 4.1, 4.2, A6 match.
- REQ-188 edit is applied consistently: combo-catalog parity, experiment-mode selection, reasoning tokens, unpriced kept; no production timeout/retry criterion; brief 2, 4.8, A9 and REQ-228's slower-than-15-seconds count agree.
- Vocabulary, stack order, technical-design rules, screen-layout (no player-visible change), assumptions A1-A23, slices: unchanged from the attempt-1 PASS.

## Findings

1. **FAIL — the owner's rejection of cross-checkout code import survives in REQ-229 and the brief.** The owner's REQ-226 edit says a run "records the commit it executes from" and an older revision is measured "by running the tooling from that revision's own worktree", never by importing code across checkouts. But accepted REQ-229 (`GATE-QUESTIONS.md`, diff, acceptance criteria) still defines `npm run eval:evidence-trace -- ... [--subject <path>] [--subject-b <path>]`, prepares each case with "the subject's unmodified `preparePromptInput`", and compares "the two subjects' prompts". `--subject <path>` can only mean loading another checkout's code, the exact import the owner dropped. The brief repeats it: §4.5 ("With `--subject-b` it also reports per-case prompt-hash equality between two revisions"), Phase 0 step 2 ("on both revisions with `--subject-b`"). That contradicts §4.1 and A6 ("no cross-checkout import"). A build agent following REQ-229 would build the import REQ-226 forbids.
2. **FAIL — the term "subject" has no definition left.** It was defined by the dropped REQ-226 `--subject` text. It is still used in REQ-228 (production timeout "of the subject"), REQ-229, REQ-230 (arm A "the subject's production prompt", "arm A of the changed subject", "the subject that wrote the rules gate baseline"), and brief §4.4 to §4.6. The re-grade note in `GRAPH-RUN.md` flagged this and deferred it to this check. It is an undefined term in accepted requirements, not just wording.

## Required correction (return to refinement)

Re-propose REQ-229 (and the "subject" wording in REQ-228 and REQ-230) in `GATE-QUESTIONS.md` so the trace and arms run against the checkout they execute from: drop `--subject` and `--subject-b`; replace the two-revision comparison with an offline compare of two trace output folders (each produced from its own worktree); reword "subject" to "the checkout the command runs from" (or define it once as that); update brief §4.4 to §4.6, Phase 0 step 2, and the parity-test wording to match. These are small edits but touch accepted IDs, so they need a fresh owner verdict on REQ-228, REQ-229, REQ-230 (accept or edit), not a silent rewrite.
