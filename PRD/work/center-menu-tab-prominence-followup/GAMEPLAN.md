# GAMEPLAN — center-menu-tab-prominence-followup

Implements DEC-133 / REQ-113 (amending DEC-122 / REQ-067 / REQ-089): the open
feature-portal Menu tray becomes a full-height left side of the outer app
shell instead of a partial-height floating panel.

## Current state

- `.portal-menu-drawer` (`apps/frontend/src/index.css`) is
  `position: absolute; left: 0; top: 0;` relative to `.portal-slot-tab` — the
  small header-slot container `FeaturePortalMenu` portals the rail + drawer
  into. Its height is `max-height: 90dvh` with `overflow-y: auto`, unrelated
  to `.page-card`'s actual box. No bottom radius is set (square bottom
  corners), and it isn't clipped to or aware of the outer shell at all.
- `PageShell` (`apps/frontend/src/components/PageShell.tsx`) wraps standard
  destinations in `<section className="page-card">` but renders full-bleed
  destinations' children with **no wrapping element at all** — Life Tracker
  has no shell node to size or clip against today.
- `.page-card` has no explicit `position`, so it isn't currently a
  positioning/clipping anchor for anything.

## Target mechanism

One shared "shell bounds" concept, owned by `PageShell`, serves both shell
types (`.page-card` and Life Tracker's full-bleed shell) so REQ-113's full
height / visible-bounds / matching-radius requirements are satisfied by a
single piece of plumbing rather than per-destination special-casing:

1. **`PageShell` always wraps its children in a shell element** — `.page-card`
   for `variant="standard"` (unchanged tag, new CSS), and a new
   `.page-shell-bleed` pass-through wrapper for `variant="full-bleed"` (today
   full-bleed renders children directly with no wrapper). Both variants render
   a new `<ShellBounds />` marker as a child of that shell element.

2. **`ShellBounds`** (`apps/frontend/src/components/portal/ShellBounds.tsx`,
   new) is a `PortalSlot`-shaped component: it registers its own DOM node
   into context on mount, unregisters on unmount. It carries no visible
   content of its own.

3. **Context plumbing** — `PortalSlotContextValue`
   (`apps/frontend/src/lib/portal/slotContext.tsx`) gains
   `registerShellBounds` / `unregisterShellBounds` alongside the existing
   `registerSlot` / `unregisterSlot`. Same provider (`FeaturePortalMenu`),
   same reason `PortalSlot` already uses imperative registration instead of
   plain context reads: `FeaturePortalMenu` is a tree **ancestor** of
   `PageShell`/`ShellBounds`, so the child must report its node upward rather
   than read a value downward.

4. **`FeaturePortalMenu` tracks registered shell-bounds nodes** the same way
   it already tracks `slotEntries` — `DestinationOutlet` keeps visited
   destinations mounted-but-hidden, so more than one shell-bounds node can be
   registered at once; resolve the visible one with the same
   `.closest("[hidden]") === null` check already used for `visibleSlotEntry`.
   Portal **only the drawer** (`isOpen && (...)`) into the resolved node via
   `createPortal`; the rail trigger keeps portaling into the header's
   `<PortalSlot />` exactly as today — unrelated concerns, don't conflate them.
   **When no shell-bounds node is registered** (isolated component tests, a
   hypothetical headerless/shell-less destination), the drawer renders in
   place exactly as it does today. This fallback must stay behavior-identical
   to current shipped output so existing `FeaturePortalMenu.test.tsx` cases
   that don't render a `PageShell`/`ShellBounds` ancestor keep passing
   unmodified.

5. **CSS geometry**:
   - `.page-card` gains `position: relative` (its border-radius, width, and
     padding are unchanged).
   - New `.page-shell-bleed`: `display: block; width: 100%; position:
     relative;` — no visual chrome of its own (no border, no radius, no
     padding), so Life Tracker's existing internal layout is pixel-identical
     to today; it exists purely as a positioning/clipping anchor.
   - New `.portal-shell-bounds` (rendered by `ShellBounds`): `position:
     absolute; inset: 0; overflow: hidden; border-radius: inherit;
     pointer-events: none;`. `inset: 0` sizes it to the shell's real
     content-box height without inflating that height (absolute elements are
     out of flow). `border-radius: inherit` means the clip follows whatever
     radius the ancestor shell actually has — `.page-card`'s `1.5rem` on
     every corner, or `.page-shell-bleed`'s unset/`0` — with no per-variant
     hardcoding, and is what produces the "matching bottom-left radius"
     requirement for free.
   - The drawer, portaled inside `.portal-shell-bounds`, becomes `position:
     sticky; top: 0;` with a tall height (viewport-scale, e.g. capped at
     `100dvh`) instead of today's `position: absolute` + `max-height: 90dvh`.
     Sticky confines itself to its containing block (`.portal-shell-bounds`,
     which matches the shell's real box) while tracking scroll — this is what
     makes a tall/scrollable destination show the tray flush with the
     **on-screen** top/bottom of the shell (visible-bounds) instead of a
     mile-tall panel spanning the full scrollable document. On a *short*
     shell, the same `.portal-shell-bounds` `overflow: hidden` clips the
     sticky drawer's excess height at the shell's real (shorter) bottom edge
     — this is what makes the tray never exceed a short shell and is the same
     mechanism that produces the matching bottom-left radius.
   - `.portal-shell-bounds` re-enables `pointer-events: auto` on its actual
     interactive children (the drawer) since the bounds box itself must not
     intercept clicks on real shell content around/behind it.

6. **Decorative brand mark** (slice B, REQ-113 item 4): appended inside the
   drawer's own flex column after the entries/Theme content, pinned toward
   any leftover space. Because the drawer is clipped by
   `.portal-shell-bounds`'s `overflow: hidden`, a shell too short to host the
   mark cleanly clips or naturally omits it without extra height-detection
   logic — reuse the same clip, don't build a second mechanism.

## Why this shape

- Reuses the exact registration pattern (`PortalSlotContext`,
  `.closest("[hidden]")` visibility resolution) `FeaturePortalMenu` already
  has for `PortalSlot`, instead of inventing a second architecture.
- Only `PlayerLifeTrackerApp` uses `variant="full-bleed"` today (confirmed:
  `TradeBalancer`, `QuickLookupApp`, `MtgAssistantApp`, `ZoneConfirmStep`,
  `ZoneCollectionStep`, `EnrichmentStep` all use the `standard` `.page-card`
  variant) — so the full-bleed wrapper change is low-blast-radius.
- `.page-card` is consumed from exactly one place (`PageShell.tsx`), so its
  new `position: relative` and the shell-bounds clip box are centrally
  controlled — no per-destination CSS changes needed.
- The no-shell-bounds-registered fallback keeps today's DOM/CSS output
  unchanged for every existing isolated test, so slice A is additive rather
  than a rewrite of shipped behavior.

## Verification checklist (package-level, mirrors DESIGN-BRIEF)

Automated (`apps/frontend`):
- `npm run quality:check` (typecheck, lint, format:check, coverage:check) green.
- `FeaturePortalMenu.test.tsx`: existing cases pass unmodified (no-shell-bounds
  fallback parity); new cases cover shell-bounds registration/visibility
  resolution and drawer portaling into the resolved node.
- CSS assertions (same `appCss` string-matching pattern already used in this
  file) for `.page-card { position: relative }`, `.portal-shell-bounds`
  (`position: absolute`, `overflow: hidden`, `border-radius: inherit`), and
  the drawer's `position: sticky`.
- `PlayerLifeTrackerApp` test coverage confirms the full-bleed wrapper renders
  and existing layout/behavior is unchanged.

Manual (dev server, per standard UI-change verification):
1. Standard `.page-card` destination, short content: open Menu — tray fills
   top→bottom of the card; bottom-left radius matches the card; no square
   corner poking past the curve.
2. Standard destination, tall/scrolled content: open Menu — tray tracks the
   **visible** card side as you scroll, not a mile-tall panel; stays flush
   with on-screen top/bottom.
3. Life Tracker (full-bleed): same full left-side + bottom-left radius
   treatment as a standard destination.
4. Short shell: unused lower tray area shows the quiet decorative brand mark,
   or is cleanly omitted rather than overlapping/cramping entries (slice B).
5. Destination select / Theme / History mutual exclusivity / reduced-motion
   slide all unchanged from shipped DEC-122/DEC-125/DEC-126 behavior.

## Slices

| Slice | Goal | Depends on |
| --- | --- | --- |
| A | Shell-bounds architecture: full-height + visible-bounds sizing + matching corner radius, for both `.page-card` and Life Tracker full-bleed | — |
| B | Quiet decorative brand mark in unused lower tray space; final verification, PRD promotion checklist, ship gates | A |

Sequential — B's brand mark attaches to the drawer/shell-bounds structure A
builds, and both touch overlapping files (`index.css`, `FeaturePortalMenu.tsx`).

## Implementation map

- `apps/frontend/src/components/PageShell.tsx`
- `apps/frontend/src/components/portal/ShellBounds.tsx` (new)
- `apps/frontend/src/lib/portal/slotContext.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/index.css`
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.test.tsx`
- `apps/frontend/src/components/BrandMark.tsx` (slice B, reused decoratively)

## PRD promotion (executed at cleanup, per doc-lifecycle.md)

- Confirm DEC-133 / REQ-113 (`sections/decisions/navigation.md`,
  `sections/functional-requirements.md`) match shipped behavior — both
  already exist as approved product truth from refinement; no new IDs needed.
- Promote `sections/system-map.md`'s feature-portal Menu entry to reflect the
  shell-docked full-height tray.
- Write the cleanup receipt; delete `PRD/work/center-menu-tab-prominence-followup/`.
