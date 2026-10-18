status: owner-action

# codebase-cleanup-pass

A behavior-preserving health pass over the code: clearer structure, faster and cleaner tests, dead code and dead styles removed. Players see no change.

- Idea: `IDEA.md`
- Intake (evidence only, 13 files from the 2026-10-18 and 2026-10-17 probes): `intake/`
- Start with `intake/HEALTH-REPORT-2026-10-18.md` and `intake/HEALTH-REPORT.md`.
- Design brief: `DESIGN-BRIEF.md` — ten behavior-preserving slices (A–J), a disposition for every Q-, C-, K-, T- finding, follow-ups. No product-truth change, so no `GATE-QUESTIONS.md`.
- Quality check: `QUALITY-CHECK.md` — PASS, five advisory findings.
- Next step: the owner reviews the docs PR and merges it; `graph-implement` builds it.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/codebase-cleanup-pass

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/codebase-cleanup-pass/DESIGN-BRIEF.md`
- Findings: none blocking. Advisory: (1) T-11 drops the `master` push trigger but `PRD/instructions/ci.md:6` says the gate runs on pushes to main/master — add a `ci.md` line edit to slice D at map-out, or keep the trigger; (2) the disposition table counts 36 built + 11 built-in-part, not 27 + 20 (totals 47 and 68 hold); (3) "same timing" should read "same timing, except In-Depth combo matching gets faster" (slice E); (4) probe line numbers and bare file names need a builder re-read, which the brief already requires; (5) slice J's PR should state that the Life Tracker table's styles are in the computed-style dump (REQ-202).
