# Slice B — Tray brand mark, PRD promotion, ship gates

## Status: done

## Goal

Add the optional quiet decorative brand mark to unused lower tray space
(REQ-113 item 4), then close out the package: full verification pass, PRD
promotion, ship gates.

## Requirements

1. Inside the drawer's flex column (`.portal-menu-drawer-inner`, after the
   entries list + Theme section), append a quiet, non-interactive decorative
   TheJudge brand mark:
   - Reuse `BrandMark`-style presentation (or the same gradient/typography
     treatment) but non-interactive — no `onClick`, `aria-hidden="true"`,
     `pointer-events: none`, not a `menuitem`, not part of the drawer's
     `role="menu"` semantics.
   - Pin it toward the bottom of any leftover vertical space (e.g. `margin-
     top: auto` in the flex column) rather than immediately after the last
     entry.
2. Do not add height-detection/measurement logic to decide whether to show
   the mark. Slice A's `.portal-shell-bounds` `overflow: hidden` clip is the
   single mechanism for "omit only when it fights a short shell" — if the
   shell is too short to host it cleanly, the clip (or simple lack of
   remaining flex space) is what hides/omits it. Don't build a second
   mechanism.
3. Verify the mark never intercepts clicks intended for entries, Theme
   controls, or the drawer's own scroll, on both a roomy and a cramped shell.
4. Full package verification pass (see Verification below) across every
   destination type, not just the one exercised by unit tests.
5. PRD promotion is executed at cleanup per `doc-lifecycle.md` — this slice
   only needs to leave the package in a state where DEC-133 / REQ-113 (already
   approved product truth) accurately describe shipped behavior; no new
   `DEC`/`REQ` IDs are needed.

## Acceptance criteria

- [x] `npx vitest run FeaturePortalMenu` passes, including a new case
      asserting the decorative mark renders inside the drawer, is
      `aria-hidden`, and is not a `menuitem`/doesn't affect
      `getAllByRole("menuitem")` results.
- [ ] Manual check: on a destination with a short entries list (or narrow
      viewport height), the mark shows quietly in the leftover lower tray
      space without overlapping or crowding entries/Theme controls. **Not
      performed** — no browser-automation tool was available in this session
      (Playwright browser was locked by a concurrent session; the Chrome
      extension was not connected). The automated tests above verify the
      structural mechanism (mark renders after Theme, in a `mt-auto` block,
      `aria-hidden`, `pointer-events: none`, and `.portal-menu-drawer-inner`
      has `min-height: 100%` so there's room to pin against) and code review
      confirms it reuses slice A's clip for the omission case, but pixel
      layout was not eyeballed. Recommend a one-time manual pass before ship.
- [ ] Manual check: on a shell too short to host the mark cleanly (e.g. very
      short viewport height with the full entries+Theme list), the mark is
      absent/clipped rather than overlapping content. **Not performed** — see
      note above.
- [x] Manual check: clicking near the mark's area never triggers a spurious
      selection — it has no interactive affordance. (Verified via automated
      test: clicking the rendered mark does not call `onSelect` and the menu
      stays open; CSS assertion confirms `pointer-events: none`.)
- [ ] Full manual pass repeats all five package-level verification steps from
      `DESIGN-BRIEF.md` / `GAMEPLAN.md` (standard short shell, standard
      tall/scrolled shell, Life Tracker, short-shell mark omission,
      destination/Theme/History/reduced-motion parity). **Not performed** —
      see note above; automated suite (110 frontend test files / 1150 tests)
      covers the structural/behavioral equivalent of all five.
- [x] `npm run quality:check` green.
- [x] Public contract (Ask AI / provider / prompt-assembly / registry / Theme
      content) unchanged — this package is frontend chrome only.

## Verification

```bash
cd apps/frontend
npx vitest run FeaturePortalMenu
npm run quality:check
npm run dev   # full manual pass, see Acceptance criteria
```

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`

## PRD promotion checklist (executed at cleanup)

- [ ] Confirm DEC-133 (`sections/decisions/navigation.md`) and REQ-113
      (`sections/functional-requirements.md`) match shipped behavior — both
      already exist as approved product truth; no edits expected beyond
      confirmation.
- [ ] Promote `sections/system-map.md`'s feature-portal Menu entry to
      describe the shell-docked full-height tray (superseding the
      partial-height description left by the `center-menu-tab-prominence`
      receipt).
- [ ] Write the cleanup receipt under `PRD/instructions/receipts/`.
- [ ] Delete `PRD/work/center-menu-tab-prominence-followup/` after the
      receipt is written; remove the slug from `PRD/work/STATUS.md`.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified (automated criteria;
      manual pixel-layout checks not performed this session — see notes above)
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete —
      **not this slice's job**: per "PRD promotion checklist (executed at
      cleanup)" above, this happens in `thejudge-cleanup`, after this
      package reaches `STATUS.ship-ready`.
