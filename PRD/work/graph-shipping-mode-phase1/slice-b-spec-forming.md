# Slice B — Spec-forming side (refinement proposes; gate reads the proposal)

## Status: blocked

### Handoff
Blocked by session permission profile, not by the work. This session was launched
with `.claude/graph-profile.json`, which denies `Edit(.claude/skills/thejudge-*/**)`
and `Edit(.agents/skills/thejudge-*/**)` for the whole session. Slices B and C edit
`thejudge-*` skills, so they must be done in a **plain `claude` session** (no
`--settings .claude/graph-profile.json`).

Done here (allowed — graph-side, not `thejudge-*`):
- `graph-run/SKILL.md`: the post-`define` gate reads `GATE-QUESTIONS.md` presence
  (refinement authors it), not a live `PRD/sections/` diff; run-one publish/park
  language updated to "proposal", no `PRD/sections/` published at run one.

Remaining for the plain session (this slice):
- `thejudge-refinement/SKILL.md`: Goal/Writes/Gates → propose-only. Author
  `GATE-QUESTIONS.md` (plain-language blocks + proposed diff per stable id +
  accept/edit/reject slots); do NOT edit `PRD/sections/`; intake line 60-61 →
  "surfacing the resulting proposed change in GATE-QUESTIONS.md".
- `graph-gate-review/SKILL.md` (editable, but do with the set): apply verdicts to
  the proposed diff **inside `GATE-QUESTIONS.md`**, not to `PRD/sections/`.
- Update refinement/gate skill fixtures.

## Goal
Make refinement write proposals to the work folder only, and make the gate decide
from the proposal instead of a live `PRD/sections/` diff.

## Requirements
1. `thejudge-refinement` (canonical `.claude/skills/`): its `## Writes` and gates
   stop instructing durable `PRD/sections/` edits during define. Instead it records
   the proposed product-truth changes as the exact diff in `GATE-QUESTIONS.md`
   (per stable id) and the intent in `DESIGN-BRIEF.md`. New stable ids are still
   *named/reserved* in the proposal but not written into live section files.
2. `graph-run`'s post-`define` step: replace "diff `PRD/sections/`" with "is there
   a proposed product-truth change in `GATE-QUESTIONS.md`?" as the gate trigger.
3. `graph-gate-review`: apply accept/edit/reject verdicts to the proposed diff
   inside `GATE-QUESTIONS.md` (finalize the proposal), not to live `PRD/sections/`.
4. Update the refinement and gate skill fixtures to the new behaviour.
5. Mirror to `.agents/skills/` via `skills:ai-sync` (verified in slice D).

## Acceptance criteria
- [ ] B1 `thejudge-refinement` no longer instructs writing durable `PRD/sections/`
  during define; it records the proposed diff in `GATE-QUESTIONS.md`.
- [ ] B2 `graph-run`'s gate trigger reads `GATE-QUESTIONS.md` presence/contents,
  not a live `PRD/sections/` diff.
- [ ] B3 `graph-gate-review` finalizes verdicts inside the work-folder proposal,
  not `PRD/sections/`.
- [ ] B4 Updated refinement/gate skill fixtures pass per `PRD/instructions/skill-testing.md`.

## Verification
```bash
grep -n "GATE-QUESTIONS\|PRD/sections" .claude/skills/thejudge-refinement/SKILL.md
grep -n "GATE-QUESTIONS\|diff .*PRD/sections" .claude/skills/graph-run/SKILL.md
npm run test:scripts
```

## Files touched
- `.claude/skills/thejudge-refinement/SKILL.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-gate-review/SKILL.md`
- `PRD/instructions/skill-fixtures/` (refinement, gate-review scenarios)
