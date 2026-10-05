# Design brief — tab-personality-color-sync

> **Correction pass (2026-10-04).** The first pass shaped the wrong surface — it
> described the in-app ☰ Menu tray rows. The owner corrected this, verbatim:
> *"i think theres been a misunderstanding, im talking about the chrome or
> mozilla tab, not the hamburger menu."* The feature is the **actual browser
> tab** — what Chrome/Firefox shows for the page — not any in-app navigation.
> This brief and `GATE-QUESTIONS.md` are rewritten for that surface. REQ-219 is
> reused as the stable id but its whole content is replaced.

## What a player sees

A player looking at their browser's row of tabs sees TheJudge stand out. The
tab's little **icon** (the favicon) is no longer the blank default page sheet —
it shows TheJudge's own mark drawn in the Magic colour the player has chosen,
and it carries the character of that colour's element. The **title** on the tab
reads as TheJudge rather than a bare placeholder. On a phone, the **browser's
top bar / address-bar tint** picks up the chosen colour too. Switch the Theme
from Blue to Red and the tab's icon — and, on mobile, the browser bar — re-skin
to Red; switch to Green and they shift to Green. Nothing inside the app's pages
changes; this is only the tab the browser paints around the page.

There is no open fork: the app is a single-page app that lives in one browser
tab, so the tab follows the **one** colour profile the player has active. The
earlier A/B question (one active colour vs a fixed colour per tab) does not
arise for the browser tab and is dropped.

## The request

Owner, verbatim: *"i noticed the tabs for the app are kinda plain and boring, can
we bring some personality to the tab? can we have it sync up with its respective
color profile even?"*

Clarified by the owner to mean the browser/Chrome/Firefox tab, not the in-app
hamburger menu. Two asks: (1) the tab looks plain — give it personality;
(2) have it sync with the active colour profile.

## What the browser tab is made of, today (verified)

The browser paints three things for a page, and TheJudge sets almost none of
them. Verified **from code** at this node (static source facts, cited with file
and line); the live-browser confirmation is noted at the end.

- **The favicon (the tab's icon).** `apps/frontend/index.html` (lines 1–12) has
  **no** `<link rel="icon">`, and `apps/frontend/public/` contains **no**
  favicon file (`favicon.ico` / icon SVG / icon PNG — directory listing: only
  `.well-known/`, `assets/`, `data/`, `fonts/`, `robots.txt`). So the browser
  shows its own generic default page icon. Verified from code and the public
  directory listing.
- **The document title shown on the tab.** `apps/frontend/index.html:6` is a
  static `<title>TheJudge</title>`. Nothing sets `document.title` at runtime — a
  repo-wide grep for `document.title` found only test/manifest noise, no
  assignment. So the tab text is the fixed word "TheJudge". Verified from code.
- **The mobile/PWA theme-color (the browser-chrome / address-bar tint).**
  `index.html` has **no** `<meta name="theme-color">`, and there is **no** web
  app manifest anywhere under `apps/frontend` (no `manifest.json` /
  `manifest.webmanifest` / `site.webmanifest`; no `VitePWA` in
  `apps/frontend/vite.config.ts`). So on mobile the browser bar uses its own
  default colour. Verified from code and an exhaustive find.

Reference art that is **not** wired in: `docs/design/tab-icon/` holds three
generated favicon candidate PNGs plus a `README.md` that states "None is wired
into the app yet — the shipped app has no favicon work package." Evidence only,
not product truth, and not a committed app asset.

**Net: the browser tab is entirely plain today — default icon, fixed one-word
title, default browser-bar colour.** The owner's "plain and boring" is their own
live observation of exactly this.

## The colour system this syncs to (verified from code)

- Six globally-shared MTG profiles — White, Blue, Black, Red, Green, Colorless —
  in `apps/frontend/src/lib/theme/palettes.ts`. Blue is the default
  (`DEFAULT_PALETTE_ID = "blue"`). Each profile supplies accent tokens
  (`accent` / `accentStrong` / `accentSoft` / `accentContrast`, as `"R G B"`
  triples), REQ-200 surface roles, a `swatch` preview hex, and one `motif`
  (`beams` / `runes` / `fog` / `embers` / `leaves` / `geometry`).
- Exactly **one** profile is active at a time. `apps/frontend/src/lib/theme/applyPalette.ts`
  is the single apply point: it sets `data-profile` (plus `data-theme`,
  `data-theme-motif`, `data-accent`) on `document.documentElement` and, for a
  custom Colorless colour, writes the `--accent*` CSS variables inline. The six
  built-in profiles' colour values live once in `apps/frontend/src/styles/tokens.css`
  under `[data-profile="<id>"]` (REQ-216: one token source). `applyPalette`
  already owns a `triplet()` helper that converts an `"R G B"` triple to a
  `#rrggbb` hex.
- `apps/frontend/src/hooks/useThemePalette.ts` owns the active palette in React:
  it calls `applyPalette` on mount (restoring the saved profile) and again on
  every `setPalette` / custom-Colorless change. **This is the one place that
  already runs on exactly the events the tab must react to** — so the tab's
  icon/title/theme-color sync hangs off the same apply point, with no new state
  channel invented.
- **Personality art already exists per profile.** `apps/frontend/src/lib/theme/motifSymbols.ts`
  (`MOTIF_SYMBOLS`, REQ-201) holds the six profiles' motif glyphs, each drawn in
  a 100×100 box in `currentColor`; the in-app brand mark
  (`apps/frontend/src/components/BrandMark.tsx`, REQ-201/REQ-207) already paints
  a "breathing orb holding the colour's badge". The favicon reuses this shipped,
  local, `currentColor`-driven art rather than inventing a new mark.

## Decided with rationale (assumption ladder)

- **Scope is all three tab surfaces.** Favicon, document title, and the
  `theme-color` meta — the three things the browser paints for the tab, and the
  three the owner confirmed. Rationale: owner-confirmed scope.
- **Favicon = the active profile's mark, recoloured to the active accent.** Ship
  a small **SVG** favicon wired into `index.html` (`<link rel="icon" type="image/svg+xml">`)
  whose artwork reuses the shipped per-profile motif/brand art
  (`MOTIF_SYMBOLS` / BrandMark orb, drawn in `currentColor`, REQ-201) and whose
  colour is the active profile's accent. On a profile change `applyPalette`
  updates the icon (swap the `href` to a data-URI SVG recoloured and re-mothed
  for the new profile). "Personality" = it carries the profile's element and
  TheJudge's own mark, not a blank sheet; "sync" = it is drawn in the active
  accent. Rationale: ladder #1/#3 — reuse REQ-201 motif art and the REQ-207 brand
  orb; hang the swap off the existing single apply point (`applyPalette`); no new
  art invented, no CDN (REQ-201 requires local static art).
- **Favicon is static per profile (no animation).** It recolours/re-moths only
  when the profile changes. Rationale: ladder #4/#5 — smallest reversible scope,
  preserve behaviour; an animated favicon is a bigger, unrequested idea, so it is
  out of scope and NFR-006 motion is not engaged.
- **theme-color = the active profile's accent hex, from the token layer.** Add a
  `<meta name="theme-color">` to `index.html`; `applyPalette` keeps its `content`
  equal to the active profile's `--accent` value (via the existing `triplet()`
  conversion for a custom Colorless colour, or the token-layer value for a
  built-in). Rationale: ladder #1/#6 — the accent is the profile's identity
  colour and the value the player already sees; it comes from the one token
  source (REQ-216), never a second hard-coded copy.
- **Document title carries a light touch of personality.** Replace the bare
  `<title>TheJudge</title>` with a single defined branded string that pairs the
  wordmark with the app's own persona line (the brand already carries "MTG
  Assistant", REQ-207) — e.g. `TheJudge · MTG Assistant`. One fixed string, not
  per-profile and not per-destination. Rationale: owner said the title "may carry
  a touch of personality"; ladder #4 — smallest reversible scope keeps it a
  single string and avoids coupling the tab title to routing.
- **Colour comes from shared tokens, defined once; no hard-coded per-profile
  hex.** All tab colour (favicon fill, theme-color content) derives from the
  active profile's token-layer value through `applyPalette`, with no second
  table of six hex strings living in the tab code. Rationale: REQ-216 bars a
  colour value outside the token layer; `applyPalette` is named by REQ-216 as
  belonging to that token layer.
- **Custom Colorless is honoured.** When the player sets a custom Colorless
  colour (REQ-099), the favicon and theme-color follow the resolved custom
  colour, the same way `applyPalette` already derives the inline `--accent*`.
  Rationale: ladder #1 — REQ-099 is live truth; the apply point already handles
  this case.
- **No new in-app screen or overlay.** The browser tab is browser chrome, not an
  app screen/overlay, so REQ-126 (the screen-layout catalog) needs no
  `screen-layout.md` row.
  Rationale: ladder #5.
- **No PWA/manifest build.** The `theme-color` meta tints the mobile browser bar
  on its own; a full web app manifest / installable-PWA is a separate, larger
  feature the owner did not ask for. Rationale: ladder #6 — no new artifact
  without authoritative scope.

## Non-goals

- No installable PWA, no web app manifest, no service worker.
- No per-destination or per-screen tab icon/title (the title does not change as
  the player navigates).
- No animated favicon.
- No change to the in-app ☰ Menu tray, its rows, the six profiles, the card
  identity ring, or any in-page surface.
- No new palette tokens, no second copy of any profile colour, no icon-font or
  CDN art.

## Proposed product truth

One requirement, **REQ-219** (reused stable id, content fully replaced) — the
browser tab carries personality and stays synced to the active colour profile
across the favicon, the document title, and the `theme-color` meta. Full diff and
accept/edit/reject in `GATE-QUESTIONS.md`. **No blocker question** — the
single-tab / one-active-profile model resolves the earlier A/B fork.

## Dependencies (each verified live in PRD/sections)

- **REQ-200** — the token set / surface roles; source of the accent colour.
- **REQ-201** — the per-colour motif kit (local static art, no CDN); the
  favicon's personality art.
- **REQ-207** — shared chrome; the in-app brand mark that holds the colour's
  element, the tab's in-app analogue.
- **REQ-216** — one token layer; colours defined once and the theme code
  (`apps/frontend/src/lib/theme/`) belongs to it; bars a hard-coded per-profile
  hex outside the token layer.
- **REQ-099** — the remembered, resettable custom Colorless colour the tab must
  follow.

## Affected code (for map-out later, not decided here)

- `apps/frontend/index.html` — add `<link rel="icon" type="image/svg+xml">`,
  `<meta name="theme-color">`, and the branded `<title>` string.
- `apps/frontend/src/lib/theme/applyPalette.ts` — on each apply, recolour/swap
  the favicon and set the theme-color `content` from the active profile (reusing
  the existing `triplet()` helper and the motif art).
- `apps/frontend/src/lib/theme/motifSymbols.ts` / `BrandMark.tsx` — source of the
  reused favicon artwork (read-only reuse).
- possibly a small favicon-art helper under `apps/frontend/src/lib/theme/` that
  builds the per-profile SVG data URI.

## Verification note

Current-state premises (no favicon link, static one-word title, no theme-color
meta, no manifest, no runtime `document.title`) were verified **from code** at
this node, cited above with file paths and line numbers (and directory listings
for the absences). The colour-system premises were verified **from code**
(`applyPalette.ts`, `useThemePalette.ts`, `palettes.ts`, `tokens.css`,
`motifSymbols.ts`). The live browser tab was **not** opened at this define node;
the build/review nodes confirm in a real browser that the tab icon, title, and
mobile browser-bar tint change across the six profiles against the owner's
"plain and boring" starting point.
