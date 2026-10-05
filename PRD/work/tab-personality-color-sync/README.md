status: owner-action

# tab-personality-color-sync

See IDEA.md. Spec-forming half complete (gate-qc PASS). DESIGN-BRIEF.md and
GATE-QUESTIONS.md (REQ-219 proposed new; one blocker, Q-219) are at the gate,
awaiting the owner's verdicts and the docs-PR merge. The build half
(`graph-implement`) applies REQ-219 to `PRD/sections/` and ships the code.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/tab-personality-color-sync

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md`
- Findings: none. Attempt-1 findings 1-4 verified resolved against live PRD. (1) Token rule now cites REQ-060/REQ-200 surface roles, no retired DEC-081 clause. (2) Row-presentation authority is DEC-135 / shared-chrome "Rows render full-bleed ... the active entry keeps a check mark and quiet fill", check mark kept in acceptance. (3) Dependencies REQ-060, REQ-200, REQ-059, DEC-135, NFR-006 present; REQ-060 inventory stated as a minimum. (4) Acceptance is one shared glyph-box size for all five rows, larger than today's 28px (`shell.css` `.tray-nav-list button .glyph`). Q-219 (one active colour vs fixed per-tab colour) is a genuine owner blocker.
