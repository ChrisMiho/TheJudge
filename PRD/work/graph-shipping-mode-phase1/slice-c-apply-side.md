# Slice C — Apply side (implement applies truth + code; cleanup promotes once)

## Status: blocked

### Handoff
Blocked by the same session permission profile as slice B — all files it touches
(`thejudge-implement-all`, `thejudge-implement`, `thejudge-cleanup`) are
`thejudge-*` skills denied in a graph-profile session. Do in a **plain `claude`
session**. Slice D's `skills:ai-sync` also writes `.agents/skills/thejudge-*/**`,
so it too must run in the plain session.

## Goal
Make implementation write the durable `PRD/sections/` truth (by intent) alongside
the code in one PR, and reconcile cleanup so promotion happens exactly once.

## Requirements
1. `thejudge-implement-all` and `thejudge-implement`: the apply step reads the
   approved `GATE-QUESTIONS.md` diff + `DESIGN-BRIEF.md` intent and writes the real
   `PRD/sections/` edits **by intent against current truth** (re-derive; do not
   blind-replay a frozen patch), together with the code, in the slice's PR.
2. `thejudge-cleanup`: promotion of durable truth now happens at apply/close only —
   remove any assumption that refinement already wrote `PRD/sections/`; ensure no
   double-promotion and no missed promotion.
3. Update the implement and cleanup skill fixtures to the new behaviour.
4. Mirror to `.agents/skills/` via `skills:ai-sync` (verified in slice D).

## Acceptance criteria
- [ ] C1 `thejudge-implement-all`/`thejudge-implement` apply durable `PRD/sections/`
  truth by intent + code together, sourced from the approved proposal.
- [ ] C2 `thejudge-cleanup` promotes durable truth exactly once (at apply/close),
  with no step assuming refinement pre-wrote `PRD/sections/`.
- [ ] C3 Updated implement/cleanup skill fixtures pass per `PRD/instructions/skill-testing.md`.
- [ ] C4 `npm run test:scripts` green.

## Verification
```bash
grep -n "PRD/sections\|by intent\|GATE-QUESTIONS" .claude/skills/thejudge-implement-all/SKILL.md
grep -n "PRD/sections\|promote" .claude/skills/thejudge-cleanup/SKILL.md
npm run test:scripts
```

## Files touched
- `.claude/skills/thejudge-implement-all/SKILL.md`
- `.claude/skills/thejudge-implement/SKILL.md`
- `.claude/skills/thejudge-cleanup/SKILL.md`
- `PRD/instructions/skill-fixtures/` (implement, cleanup scenarios)
