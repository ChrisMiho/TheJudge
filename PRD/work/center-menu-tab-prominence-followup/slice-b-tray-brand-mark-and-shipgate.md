# Slice B — Tray brand mark, PRD promotion, ship gates

## Status: planned

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

- [ ] `npx vitest run FeaturePortalMenu` passes, including a new case
      asserting the decorative mark renders inside the drawer, is
      `aria-hidden`, and is not a `menuitem`/doesn't affect
      `getAllByRole("menuitem")` results.
- [ ] Manual check: on a destination with a short entries list (or narrow
      viewport height), the mark shows quietly in the leftover lower tray
      space without overlapping or crowding entries/Theme controls.
- [ ] Manual check: on a shell too short to host the mark cleanly (e.g. very
      short viewport height with the full entries+Theme list), the mark is
      absent/clipped rather than overlapping content.
- [ ] Manual check: clicking near the mark's area never triggers a spurious
      selection — it has no interactive affordance.
- [ ] Full manual pass repeats all five package-level verification steps from
      `DESIGN-BRIEF.md` / `GAMEPLAN.md` (standard short shell, standard
      tall/scrolled shell, Life Tracker, short-shell mark omission,
      destination/Theme/History/reduced-motion parity).
- [ ] `npm run quality:check` green.
- [ ] Public contract (Ask AI / provider / prompt-assembly / registry / Theme
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

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
