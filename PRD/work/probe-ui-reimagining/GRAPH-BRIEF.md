# Graph-run brief — Re-imagine the UI (every flow except Life Tracker)

Self-contained intake for `graph-kickoff`. **Not ready to kick off yet.** The
owner answers `OWNER-INPUT.md` in this folder first; the answered file is the
intake. Until then this brief records what is already known and the plan, so
the kickoff does not re-derive it.

## What the player gets

A player opens TheJudge on their phone at the table, or on a laptop between
games, and every screen feels like one product with a point of view: the
Menu, Quick Question, In-Depth Question and its staged game-context capture,
the answer workspace, and Trade Balancer. The awkward moments the owner has
noticed in those flows are gone. The app stops reading as a plain dark form
and starts reading as a Magic tool, with the chosen mana colour carrying
through the whole surface, not only the accent buttons.

Life Tracker keeps the look it has today. Players who use it see no change.

## What is already known (measured — do not re-derive)

- **Four destinations.** Quick Question, In-Depth Question, Life Tracker,
  Trade Balancer (`apps/frontend/src/components/portal/destinationRegistry.tsx`).
  Life Tracker is out of scope by owner decision.
- **Shared chrome is the leak path.** `PageShell`, `BrandMark`, the Menu rail
  and tray, the theme section, the mock-mode banner, the feedback modal, the
  history drawer, the View Context overlay and the card-detail popup are shared
  by every destination, Life Tracker included (`PRD/sections/shared-chrome/`).
  Any shared change reaches Life Tracker unless pinned.
- **Colour already runs on tokens.** Six palettes in WUBRGC order (White,
  Blue, Black, Red, Green, Colorless) each set four channels: `accent`,
  `accent-strong`, `accent-soft`, `accent-contrast`
  (`apps/frontend/src/lib/theme/palettes.ts`). Tailwind consumes them as
  `accent-*` utilities. The brand wordmark is a text gradient from
  `accent-soft` to `accent-strong`. Backgrounds are hard-coded zinc, so the app
  is dark-only today and the palette only tints the accent.
- **Layout has a rulebook.** `PRD/sections/screen-layout.md` fixes viewport
  bands (phone under 768px, tablet, desktop from 1024px), the shell cap
  `min(48rem, 92vw)`, the no-page-scroll fit rule, and content-sized staged
  steps (DEC-117 / DEC-145 / DEC-149). A redesign tunes rows in that catalog;
  it does not bypass it.
- **Size.** About 9.8k lines of TSX across 45 components, one 1.1k-line
  `index.css`, Tailwind 3, React 18, Vite. No component library. Small enough
  to restyle at the token-and-component level without a rewrite.
- **Motion.** `prefers-reduced-motion` is already honoured
  (`lib/motionPreference.ts`); `motion-hover`, `motion-press`, `motion-focus`
  utility classes exist.
- **Past lesson.** Refinements here went wrong when requirements were reasoned
  from code instead of the live app. The probe walks every flow in the browser
  and captures screenshots before any direction is drawn.

## Plan (three stages, each ends with an owner decision)

1. **Probe.** Walk every in-scope flow live at phone and desktop width.
   Capture "before" screenshots to `PRD/work/probe-ui-reimagining/.playwright-mcp/`.
   Merge the owner's friction list from `OWNER-INPUT.md` with what the walk
   finds into one numbered friction table with a screenshot per row. Owner
   confirms the table is the problem list.
2. **Directions.** Build two or three distinct visual directions as clickable
   HTML mockups (one page per in-scope flow, phone and desktop, real card data
   and copy). Each direction carries a Life Tracker screenshot diff showing
   what shared-token drift it would cause. Owner picks one direction, or one
   with edits. That choice is recorded in `DESIGN-BRIEF.md` at refinement.
3. **Map-out and build.** One slice per flow plus one for shared chrome and
   tokens, largest last (Trade Balancer, In-Depth Question). Every slice
   ships with a Life Tracker screenshot diff that must be empty or approved.

## Mana-symbol flare (owner asked; answer: yes, with one licensing choice)

The owner may drop one inspiration image per palette into `inspiration/`
(the five mana symbols and the colorless diamond). Two ways to use them:

- **Motif, not glyph (recommended default).** Take the colour, the shape idea
  (sun, water drop, skull, flame, tree, diamond) and the mood, and express
  them as our own gradients, background textures, iconography and empty-state
  art. No Wizards of the Coast artwork ships. Safe for any use.
- **The actual symbols.** The official glyphs are Wizards of the Coast
  property. Fan projects commonly ship them through the community "Mana" icon
  font under the Wizards Fan Content Policy, which only covers free,
  non-commercial use. If TheJudge is or may become commercial, this option is
  off the table. `OWNER-INPUT.md` slot D2 asks which applies.

Either way, the palette stops being an accent tint and becomes the theme:
background wash, surface edges, the wordmark, focus rings, the waiting panel,
and the card-detail popup all read as the chosen colour.

## Decisions already made — do not re-litigate

- Life Tracker's UI is untouched. The only open question is how "untouched"
  is enforced (slot E1).
- Mobile-first, one fluid tree, no device sniffing (DEC-117). The catalog in
  `screen-layout.md` stays authoritative for size and containment.
- The owner approves a direction from mockups before app code changes.
- The decision log is retired: design record is `DESIGN-BRIEF.md` plus
  in-place amendments to the feature specs, never a new `DEC-` entry.

## Out of scope

- Life Tracker screens and its `lib/lifeTracker/` state.
- Backend, Ask AI prompts, scan detection, price data.
- New features. A flow may be re-sequenced if slot E2 allows it, but nothing
  the app cannot do today is added.

## Files in this folder

| File | Role |
|---|---|
| `GRAPH-BRIEF.md` | This brief; the kickoff intake once `OWNER-INPUT.md` is answered |
| `OWNER-INPUT.md` | The owner's answer slots; the details the probe cannot find on its own |
| `inspiration/` | Drop folder for reference images (see its README for naming) |
