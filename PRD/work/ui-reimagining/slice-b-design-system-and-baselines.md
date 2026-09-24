# Slice B — design-system-and-baselines

## Status: planned

## Goal

One authoritative CSS token/motif source that every per-flow mockup page
(slices C-F) imports — no duplicated colour constants, no per-page palette
drift — implementing `REQ-200`'s surface-role system and `REQ-201`'s
per-colour motif language. Alongside it, capture "before" screenshots of
today's **live** app for every in-scope destination plus Life Tracker, at
phone (390x844) and desktop (1440x900) widths, as committed deliverable
images the owner reviews paired against each mockup.

## Requirements

1. `docs/design/ui-reimagining/direction-1/tokens.css` defines CSS custom
   properties for each of the six
   profiles (White, Blue, Black, Red, Green, Colorless) covering at least the
   `REQ-200` role list: page ground, colour wash, raised panel fill, panel
   edge, focus ring, primary text, muted text, and the filled-accent text
   pairing carried over from `REQ-099`. One selector per profile (for
   example `[data-profile="red"]`), switched by a `data-profile` attribute so
   every mockup page can demo all six from one file.
2. Contrast floors hold in every profile, checked against the darkest wash
   point: primary text >= 14.37:1, accent text (`accent-soft` role) >= 6.19:1,
   filled-accent text >= 5.42:1 — today's own measured worst cases from
   `DESIGN-BRIEF.md`, not new targets. Colorless's custom-RGB path stays
   exempt, as it is today.
3. No profile's wash goes darker than the measured `#09090B` floor.
4. `docs/design/ui-reimagining/direction-1/motifs/` holds one original,
   local, static asset per colour
   (SVG and/or CSS gradient/texture) expressing the six languages named in
   `REQ-201` (White gilded authority, Blue charged energy, Black decay with
   one hot glow, Red heat in darkness, Green forest at dusk, Colorless bone-
   and-brass artifact) — no official Wizards of the Coast mana glyph, icon
   font, logo, or card art anywhere.
5. `docs/design/ui-reimagining/direction-1/shell.css` (or an included HTML
   partial) defines the reusable chrome skeleton — menu rail, brand mark
   slot, page shell — that slices C-F and the Life Tracker composite all
   include rather than re-declaring.
6. `docs/design/ui-reimagining/README.md` names direction 1 and what each
   file in the tree is (mirroring `docs/design/tab-icon/README.md`'s shape),
   explains how to open the mockup pages (plain `file://` HTML, no build
   step), and how to switch the `data-profile` attribute to preview each of
   the six colours.
7. Using `npm run dev` (mock provider) in this checkout, capture "before"
   screenshots at 390x844 and 1440x900 for: the Menu with the Theme section
   open; Quick Question pre-submit with 2 cards attached; In-Depth
   game-context step; In-Depth zone collection with a filled zone; Trade
   Balancer with both sides empty; and Player Life Tracker. Save each under
   `docs/design/ui-reimagining/before/<destination>-<viewport>.png` (12
   files: 6 destinations x 2 viewports).

## Acceptance criteria

- [ ] B1 — `docs/design/ui-reimagining/direction-1/tokens.css` defines all
      eight named surface roles for each of the six profiles.
- [ ] B2 (manual) — computed contrast (via the browser's rendering, not
      arithmetic alone) for primary text, accent text, and filled-accent text
      meets or exceeds 14.37:1 / 6.19:1 / 5.42:1 respectively in every
      profile against that profile's darkest wash point; recorded per
      profile in the evidence log.
- [ ] B3 (manual) — no profile's wash renders darker than `#09090B` at any
      point.
- [ ] B4 (manual) — a rendered swatch page shows neutral ground/panel fill as
      the visual majority of the frame in every profile, at both 390x844 and
      1440x900.
- [ ] B5 — `docs/design/ui-reimagining/direction-1/motifs/` contains one
      original asset per colour, each a local static file with no external
      font/CDN/art request, and none of the six visually reproduces an
      official Wizards of the Coast mana glyph, icon font, logo, or card art
      (manual visual audit).
- [ ] B6 — `docs/design/ui-reimagining/direction-1/shell.css` (or an
      included partial) exists and is the single source of the chrome
      skeleton; no per-page duplicate of the same rules exists in any of the
      per-flow pages (checked once C-F land, recorded here as the contract
      they must follow).
- [ ] B7 — all 12 "before" screenshots (6 destinations x 2 viewports) exist
      under `docs/design/ui-reimagining/before/`, captured from the live
      `npm run dev` app in this checkout, matching the scenarios in
      Requirement 7.
- [ ] B8 — cleanup evidence: `browser_close` called after the last capture;
      the dev server this slice started is stopped and its port released;
      the capture path (`docs/design/ui-reimagining/before/` for the
      committed deliverables, `PRD/work/ui-reimagining/.playwright-mcp/` for
      any raw session captures) is recorded in this slice's evidence log.

## Verification

```bash
ls docs/design/ui-reimagining/direction-1/tokens.css docs/design/ui-reimagining/direction-1/shell.css
ls docs/design/ui-reimagining/direction-1/motifs/
ls docs/design/ui-reimagining/before/
```

## Files touched

- `docs/design/ui-reimagining/direction-1/tokens.css` (new)
- `docs/design/ui-reimagining/direction-1/motifs/*` (new)
- `docs/design/ui-reimagining/direction-1/shell.css` (new)
- `docs/design/ui-reimagining/README.md` (new)
- `docs/design/ui-reimagining/before/*.png` (new, 12 files)
