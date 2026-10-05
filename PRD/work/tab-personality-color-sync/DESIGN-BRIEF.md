# Design brief — tab-personality-color-sync

## What a player sees

A player opens the ☰ Menu and the navigation list stops looking like a flat
column of grey text rows. Each row — **Ask a Question, Question History, Life
Tracker, Trade Balancer, Send feedback** — now carries a bolder, more
characterful identity mark and a livelier hover/press feel, and the whole list
visibly wears the MTG colour the player has chosen in Theme: pick Red and the
tabs glow in Red's light, pick Green and they shift to Green. The current screen
still reads clearly as current. Nothing about *what* the tabs do changes — they
still switch destinations in the same order.

That is the recommended shape. There is one real fork the owner must settle
first (see Blocker), because the owner's words — "sync up with its **respective**
colour profile" — could instead mean each tab wears its own fixed Magic colour,
which is a different and larger feature.

## The request

Owner, verbatim: *"i noticed the tabs for the app are kinda plain and boring, can
we bring some personality to the tab? can we have it sync up with its respective
color profile even?"*

Two asks: (1) the tabs look plain — give them personality; (2) have them sync
with "its respective color profile."

## What the "tabs" actually are (verified)

The app has no tab bar. Its one navigation affordance is the ☰ Menu button that
opens a left tray; the tray's destination rows are the "tabs" the owner means.
This is the current-state truth in `PRD/sections/shared-chrome/README.md`
("The Menu corner rail and tray") and matches the code.

Verified **from code** (not run live this node — the premises below are
structural facts from the source and the authoritative current-state spec, not a
guess at the look; the owner's "plain and boring" is their own live observation):

- Rows render in `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
  (`.tray-nav-list`, lines 247–305). Every row is the same
  `<button role="menuitem">` grid, by design — "rendered identically in array
  order" (DEC-104).
- The only per-row visual difference today is a single mono-colour glyph:
  `ROW_GLYPHS` (lines 37–42) gives Ask-a-Question a card silhouette SVG, Life
  Tracker `♥`, Trade Balancer `⚖`; Question History is `◷`, Send feedback `✎`.
  In-Depth has no Menu row of its own (filtered in `App.tsx`; it reads as current
  under "Ask a Question", REQ-067/REQ-206).
- Styling in `apps/frontend/src/styles/shell.css` (lines 486–540): the glyph is
  `color: var(--accent-soft)`, the current row gets an `--accent` fill plus a lit
  `--accent-soft` bar with a glow. So the rows **already** tint to the one active
  theme accent. They are not monochrome — they are a flat list in a single
  colour, with small generic glyphs.

## The colour system (verified from code)

- Six globally-shared MTG profiles — White, Blue, Black, Red, Green, Colorless —
  in `apps/frontend/src/lib/theme/palettes.ts`. Each supplies four accent tokens
  (`accent` / `accentStrong` / `accentSoft` / `accentContrast`), REQ-200 surface
  roles, and one `motif` element (beams / runes / fog / embers / leaves /
  geometry). Blue is the default.
- Exactly **one** profile is active at a time, applied app-wide via
  `data-profile` + `--accent*` CSS variables (`useThemePalette.ts`,
  `applyPalette.ts`). The whole app — ground, wash, ambient scene, accents — wears
  that one colour; the colour reads as a faint wash over a neutral majority
  (REQ-200). The tray even plays the active colour's element at a whisper already
  (`AmbientScene variant="tray"`, the `.tray-flair`).
- A **separate** colour-identity vocabulary exists for cards:
  `apps/frontend/src/lib/cardIdentityRing.ts` maps a card's `colors` to a ring —
  one WUBRG hue for mono, a WUBRG-ordered gradient for multi, silver-grey when
  empty/unknown (DEC-078/REQ-058). These ring hues are not the same values as the
  six theme profiles.
- **No destination/feature has an assigned colour anywhere.** Exhaustive grep
  found no `signature`/`featureColor`/`destinationColor` concept. Per-tab colour
  would be net-new.

## The one real fork (see Blocker question)

"Sync up with its respective colour profile" has two materially different
readings:

- **A — tabs reflect the one active profile (recommended default).** Strengthen
  the tabs' personality and keep them synced to whichever Theme colour the player
  wears. Consistent with the whole one-profile-app-wide model; reuses existing
  tokens and motion; low risk. Caveat: the colour-sync half is *already largely
  true* (glyphs and the current row are accent-tinted), so A mostly delivers the
  "personality" half.
- **B — each tab wears its own fixed Magic colour.** A new per-destination colour
  mapping, independent of the active Theme, so the five tabs show five different
  colours at once. This is the literal reading of "respective" and delivers the
  most distinct per-tab personality, but it is net-new, departs from the
  one-active-profile model (five accents fighting REQ-200's neutral-majority
  wash), and needs an invented tab→colour mapping.

This brief and the proposed REQ-219 are written for **A**. B would reshape the
REQ. The owner settles this at the gate (Blocker question Q-219).

## Decided with rationale (assumption ladder)

- **Which tabs.** All rows in the Menu tray's nav list: Ask a Question, Question
  History, Life Tracker, Trade Balancer, and the Send feedback action row. The
  Theme band stays out of scope — its six cells already show per-profile colour
  (`ThemeSection.tsx` / `themeOrbStyle`). Rationale: ladder #3 (the tray rows are
  the "tabs"; the Theme band is a different, already-coloured control).
- **What "personality" means, concretely.** Keep the existing per-destination
  glyph vocabulary (card / ♥ / ⚖ / ◷ / ✎) and make it the carrier of character —
  a bolder, consistently-sized identity mark per row — plus a restrained
  ambient-accent treatment (rest → hover/`focus-visible` → current) and the
  app-wide decorative-motion micro-interaction on hover/press. Rationale: ladder
  #1/#3 — reuse the shipped ambient-accent pattern (DEC-081, the View-Context
  trigger and composer already do exactly this) and the CSS-only motion baseline
  (DEC-079/REQ-059), so no new primitive is invented.
- **No new token roles.** All colour comes from the existing four palette tokens;
  no palette-tinted page background beyond what REQ-200 already allows. Rationale:
  ladder #6 and DEC-081's explicit "no new token roles."
- **Honour reduced motion and touch/keyboard parity.** Motion is `auto` under
  `prefers-reduced-motion`; hover is never the sole carrier of state (NFR-006;
  the DEC-081 pattern already requires this). Touch targets stay ≥44px
  (NFR-001) — the current rows are 48px.
- **No new screen-layout row.** This restyles existing tray chrome; it adds no
  user-visible screen or major overlay, so DEC-149/REQ-126 needs no catalog row.
  Rationale: ladder #5 (preserve layout; the tray already exists).
- **Order, routing, selection, state preservation unchanged.** Ladder #5 — this
  is presentation only; it touches no `PortalEntry` contract, no registry field,
  no routing.
- **"Identical rows" (DEC-104) is refined, not broken.** Rows keep the same
  structure, order, grid, and 48px height; they gain per-destination identity and
  profile-synced accent within that frame. REQ-219 records this refinement.

## Non-goals

- No per-destination fixed colour mapping (that is fork B, deferred to the
  owner's answer).
- No change to the Theme band, the six profiles, or the card-identity ring.
- No change to navigation order, routing, labels, or what a tab does.
- No new palette tokens, no animation library, no new screen/overlay.
- No change to In-Depth's lack of its own Menu row (REQ-067/REQ-206).

## Proposed product truth

One new requirement, **REQ-219** — the Menu tray's tabs carry per-destination
personality and stay synced to the active colour profile. Full diff and
accept/edit/reject in `GATE-QUESTIONS.md`. One Blocker question, **Q-219** — the
A-vs-B fork above.

## Affected code (for map-out later, not decided here)

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` — row glyph/identity
  rendering.
- `apps/frontend/src/styles/shell.css` — `.tray-nav-list` row, glyph, hover/current
  treatment and motion.
- Possibly `apps/frontend/src/lib/theme/motifSymbols.ts` / `AmbientScene` if the
  active row borrows the profile element (kept minimal).

## Verification note

Premises verified from source and the current-state `shared-chrome` spec (cited
above with file paths and line numbers). The live UI was not run at this define
node; the build/review nodes verify the look in the browser against the owner's
"plain and boring" starting point.
