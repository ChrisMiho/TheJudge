# Slice C — Playwright MCP verify and ship gates

## Status: planned

## Goal

Re-run the slice A Playwright MCP path after the fix, prove horizontal overflow
is gone, spot-check desktop composition, and leave the package ship-ready for
cleanup.

## Requirements

1. Using `plugin-playwright-playwright` again at ~390×844:
   - In-Depth → expand **Players in game** → expand secondary details
   - screenshot the fixed state
   - assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
   - assert expanded player cards' right edges are within the viewport
2. Record results in `PRD/work/mobile-player-details-overflow/evidence/verify.md`
   (before/after references to slice A evidence).
3. Spot-check a width ≥768px (or `sm+`): scalar counters still compose as a
   three-column row unless a shared wrap was intentionally applied — note which.
4. Run `npm run quality:check` (or the minimal quality gate for touched areas if
   the full monorepo gate is blocked for unrelated reasons; prefer full gate).
5. Mark slices A–C done in their docs and update package README status toward
   ship-ready when implement marks the last slice complete (implement skill owns
   `STATUS.ship-ready`).

## Acceptance criteria

- [ ] Playwright MCP verification performed after the fix (not claim-only)
- [ ] No document horizontal overflow at ~390×844 with secondary details expanded
- [ ] Expanded cards fully visible in post-fix screenshot
- [ ] `sm+` spot-check recorded
- [ ] Quality gate green for the change
- [ ] Durable PRD already contains DEC-128 / REQ-106 (promote only if implement
      discovered drift); ephemeral package ready for cleanup after ship-ready

## Verification

```text
Playwright MCP: same path as slice A → evidence/verify.md with
scrollWidth <= clientWidth and screenshots
```

```bash
npm run quality:check
```

## Files touched

- `PRD/work/mobile-player-details-overflow/evidence/verify.md` (new)
- optional tiny follow-up tweaks to the same frontend files as slice B

## Dependencies

- sequential: slice B — fix must land before verification

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/mobile-player-details-overflow/` ready to delete

## PRD promotion checklist (cleanup executes)

- [ ] DEC-128 / REQ-106 / FLOW-001 already in `PRD/sections/` (done at refinement)
- [ ] Router index line for DEC-128 present in `decisions.md`
- [ ] Delete `PRD/work/mobile-player-details-overflow/` after ship-ready cleanup
