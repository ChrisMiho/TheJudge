status: refined

# answer-quality-investigation

Reproducible before/after answer evaluation for PR #273, isolation of retrieval versus prompt-organization failures, and a GPT-4.1 versus GPT-6 Luna comparison, before any product fix is chosen.

- Idea: `IDEA.md`
- Design brief: `DESIGN-BRIEF.md` (comparison tooling, the free offline Phase 0 run at build, and the runbook for owner-capped paid Phases 1–5)
- Proposed product truth: `GATE-QUESTIONS.md` (new REQ-226 to REQ-230; amends REQ-185 to REQ-189 and NFR-018; REQ-220/221 stay reserved by draft PR #266)
- Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`, cites `PRD/work/probe-answer-quality/FINDINGS-{integration,retrieval,evaluation}.md` in the launch checkout (not read here)
- Graph ledger: `GRAPH-RUN.md`

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/answer-quality-investigation/DESIGN-BRIEF.md`
- Findings: (attempt 2, 2026-10-07, re-grade after the owner's verdicts — full text in `QUALITY-CHECK.md`) (1) accepted REQ-229 still defines `eval:evidence-trace [--subject <path>] [--subject-b <path>]`, prepares cases with "the subject's unmodified `preparePromptInput`" and compares "the two subjects' prompts" — the cross-checkout code import the owner dropped in the REQ-226 edit; brief §4.5 and Phase 0 step 2 ("on both revisions with `--subject-b`") repeat it and contradict §4.1 / A6; (2) the term "subject" has no definition left (it was defined by the dropped REQ-226 text) yet is still used in REQ-228, REQ-229, REQ-230 and brief §4.4–4.6. Required correction: re-propose REQ-229 and the "subject" wording in REQ-228/REQ-230, drop `--subject`/`--subject-b`, compare two revisions by diffing two trace output folders each produced from its own worktree, reword "subject" to the checkout the command runs from, and update brief §4.4–4.6, Phase 0 step 2 and the parity test to match.
