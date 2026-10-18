# Graph-run brief — Pop-ups close one at a time

Self-contained intake for `graph-kickoff`. Measured by the 2026-10-17 code health
probe; refinement can go straight to a DESIGN-BRIEF.

## What the player gets

- Pressing Escape closes only the top pop-up. Today, in Life Tracker's Game setup,
  tap Reset and press Escape: the "are you sure?" sheet closes **and** Game setup
  behind it closes too. Question History's delete confirm does the same.
- View Context behaves like every other pop-up (Escape works wherever focus is,
  first focus lands where every other sheet puts it).

## Why (measured — do not re-derive)

1. `apps/frontend/src/components/SheetShell.tsx:124-134` — each open sheet adds its
   own `document` keydown listener and calls `onClose` on Escape. Nothing checks
   which sheet is on top, and nothing stops the key reaching the next listener.
   (Verified by the driver.)
2. Outside-click already solves this: `hooks/useOutsideDismiss.ts:11,47` keeps a
   module-level `dismissStack`, so only the top surface closes; it has a nested test
   (`useOutsideDismiss.test.ts:111`). Escape has no equivalent and no nested test.
3. Stacked cases today: `GameSetupPanel.tsx:318-340` renders two `ConfirmSheet`s while
   the Game setup `SheetShell` (`PlayerLifeTrackerApp.tsx:31`) is open;
   `ConversationHistoryDrawer.tsx:403` opens the delete `ConfirmSheet` over the
   drawer's own `SheetShell` (`:226`).
4. Two surfaces still handle Escape themselves (the remainder of the August audit's
   F-01, which `SheetShell` otherwise fixed in #239):
   - The Menu tray, `portal/FeaturePortalMenu.tsx:193-208` — its own `document`
     listener, no `preventDefault()`.
   - View Context, `AdaptiveContextDialog.tsx` — copies `SheetShell`'s
     `FOCUSABLE_SELECTOR` (`:18-25`) and re-implements the focus trap and Escape
     (`:61-93`). Escape only works while focus is inside the dialog (React
     `onKeyDown`); first focus goes to the ✕ (`:42-46`) rather than
     `[data-autofocus]`/first control (`SheetShell.tsx:113-116`). Its CSS
     (`.adaptive-context-overlay/-surface`) is defined twice in `index.css`
     (`:830-856`, `:2618-2628`). It is an opaque bottom sheet on phones and a
     right-hand drawer on wide screens; every other pop-up is the glass centred card.
5. REQ-216 says a screen gets a sheet only through the shared components and a variant
   "never forks a local copy" — View Context is the one remaining fork. Its 75dvh cap
   is REQ-135 (`PRD/sections/screen-layout.md:130`), so its shape may be deliberate.

## Decisions already made — do not re-litigate

- Escape should close the top-most surface only — the same rule outside-click
  already follows. This is a bug fix with one right answer.

## Open decisions for the define gate

1. Does View Context keep its own look (bottom sheet on phones, side drawer on wide
   screens) as a `SheetShell` variant, or become the standard centred glass card?
   Recommendation: keep the look as a `SheetShell` `panelClassName` variant, so only
   the behaviour changes.

## Design direction (converged)

- One dismiss stack shared by outside-click and Escape: move Escape into
  `useOutsideDismiss`'s stack, or add a sibling `useEscapeDismiss` sharing it.
- Adopt it in `SheetShell`, the Menu tray, and View Context.
- Host View Context on `SheetShell` (variant per the decision above); delete the
  duplicated `index.css` blocks.
- Add a nested-sheet Escape test (Game setup + Reset confirm).

## Current-state PRD truth to amend

- `PRD/sections/shared-chrome/README.md` — sheet dismissal: Escape closes the top
  surface only; View Context on the shared sheet.
- REQ-216 (functional-requirements.md) only if the View Context variant needs naming.
- `PRD/sections/screen-layout.md` View Context row, only if its look changes.

## Constraints (don't rediscover)

- REQ-135's ≤75dvh cap with a ≥25% scrim at 390×844 must hold for View Context.
- Life Tracker is pixel-frozen by REQ-202; this changes dismiss behaviour only.

## Evidence + reusable tooling

`PRD/work/probe-codebase-health-pass/FINDINGS-ui-and-personalities.md` (U-01, U-06)
and `FINDINGS-backend-scripts-and-august-audit.md` (Part B, F-01).

## What the graph run should produce

A DESIGN-BRIEF, one gate question (View Context's look), the shared-chrome amendment,
and slices: the shared Escape stack with its nested test first, then the Menu tray,
then View Context on `SheetShell`.

## How to hand this off

/graph-kickoff "Escape closes only the top pop-up, and View Context uses the shared sheet" PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-popups.md
