# Slice A evidence

## A5 — superpowers:writing-skills cycle (RED baseline)

2026-09-01 A5 — Ran the fixture's no-skill control (skill `codehealth` did not yet
exist) as one general-purpose subagent on `overnight-behavior-preserving-loop.md`.

**Result: the control PASSED the discipline dimensions (GREEN, not RED).** It picked
the genuinely dead target (`formatLegacyDate`), added a sound public-API caveat,
**parked** the dynamic-dispatch trap (`isCardBack`) with the correct grep-dead≠inert
reasoning, and **refused to merge** overnight — explicitly citing the repo's standing
"trunk is reached only by a PR you merge" rule.

**Finding (shapes the skill's scope):** per `superpowers:writing-skills` ("if the
control already behaves correctly, do not author guidance for it") and
`skill-testing.md`, the loop's *discipline* (never-merge, park behavior-changers) is
already enforced by the repo's CLAUDE.md + auto-memory and by baseline competence, so
the skill does **not** carry a heavy rationalization apparatus to force it — only a
concise charter (Hard rules) plus the two *technique-specific* judgment prompts a
fresh agent could still miss (grep-dead≠inert; green-tests≠behavior-preserved). The
skill's core value is the **loop mechanics** (standalone preflight that sidesteps
graph-preflight, the dedup exclusion set, the classification rubric, the post-build
assertion, the ledger/digest, ceilings, and pacing) — the parts the control had no
way to know.

**Caveats on this baseline (limits its strength; full validation is owner-gated per
GAMEPLAN decision 3):**
- The scenario telegraphed the trap ("the scanner wires checks through a lookup
  table"). A fairer run would not name the mechanism.
- The merge-refusal leaned on repo memory already loaded into the session, not on
  anything the skill adds.

A full multi-rep RED→GREEN validation with a non-telegraphed trap is the owner-gated
pre-merge step.
