# Gate questions — tab-personality-color-sync

Proposed product truth for the `define` gate. One `## <STABLE-ID>` block per
stable id, each with its plain-language block, the complete proposed
`PRD/sections/` diff, and an accept/edit/reject slot. Blocker questions follow.

Nothing here is written to `PRD/sections/` — implementation applies the accepted
proposal later.

> **Correction pass (2026-10-04).** The owner clarified the request is the
> **browser tab** (Chrome/Firefox), not the in-app ☰ Menu tray. REQ-219 is the
> same stable id but its content is fully replaced for the browser-tab surface,
> and the earlier blocker Q-219 (one active colour vs fixed per-tab colour) is
> dropped — a single-page app lives in one browser tab, so the tab follows the
> one active profile.

---

## REQ-219 — give the browser tab personality and keep it in the chosen colour

**What this decides:** whether the browser tab TheJudge opens in — its icon, its
title text, and (on mobile) the browser's top-bar colour — gets TheJudge's own
character and visibly wears whichever Magic colour the player has chosen in
Theme.

**In plain terms:** today the browser tab is plain. Its little icon is the
browser's blank default page icon (the app ships no favicon at all); the tab
text is the bare word "TheJudge"; and on a phone the browser's top bar/address
bar uses the browser's own default colour (the app sets no `theme-color`). This
change gives the tab a proper **favicon** — TheJudge's own mark, carrying the
character of the active profile's element (the same motif art the app already
draws for each colour, REQ-201/REQ-207), drawn in the active colour; a tab
**title** with a touch of personality (the wordmark paired with the app's own
persona line, not a bare placeholder); and a **`theme-color`** so the mobile
browser bar is tinted to the active colour. Because the app runs in one browser
tab and wears exactly one colour profile at a time (applied once through
`applyPalette`), switching Theme to Red re-skins the tab icon — and, on mobile,
the browser bar — to Red, Green shifts them green, and so on. All tab colour
comes from the one token source the app already uses (REQ-216); no second copy
of any profile colour, no icon-font or CDN art (REQ-201 requires local static
art), no animated icon, and no change to anything inside the app's pages.

**What happens if you say no:** the browser tab stays plain — the browser's
default blank icon, a bare one-word title, and an untinted mobile browser bar —
and the personality and colour-sync the owner asked for are not built.

### Proposed diff

**1. `PRD/sections/functional-requirements.md` — new entry (append after REQ-217):**

```diff
+### REQ-219
+- Title: The browser tab carries personality and stays synced to the active colour profile
+- Priority: medium
+- Description: The browser tab the app opens in — the Chrome/Firefox tab, not any
+  in-app navigation — must read as characterful and must visibly wear the active
+  MTG colour profile, across the three things the browser paints for a page: the
+  favicon (the tab icon), the document title shown on the tab, and the
+  `theme-color` meta that tints the mobile/PWA browser chrome (the top
+  bar / address bar). The app ships a favicon that carries TheJudge's own mark
+  with the active profile's element — reusing the shipped per-profile motif/brand
+  art (REQ-201/REQ-207), drawn so its colour is the active profile's accent — in
+  place of the browser's default blank page icon. The document title carries a
+  light touch of personality: a single defined branded string pairing the
+  wordmark with the app's own persona line, in place of a bare placeholder. A
+  `theme-color` meta is set so the mobile browser bar is tinted to the active
+  profile's accent colour. Because exactly one profile is active at a time and is
+  applied app-wide through the single theme apply point
+  (`apps/frontend/src/lib/theme/applyPalette.ts`, which sets `data-profile` and,
+  for a custom colour, the `--accent*` variables), switching the Theme colour
+  re-skins the tab's favicon and the `theme-color` to match — Red glows red,
+  Green shifts green, and so on — including a custom Colorless colour (REQ-099).
+  Presentation/browser-chrome only: no change to in-app screens, the ☰ Menu tray,
+  routing, request contracts, the six profiles, or the card identity ring.
+- Acceptance Criteria:
+  - the served page declares a favicon (`<link rel="icon">`) that renders
+    TheJudge's own mark carrying the active profile's motif/element (reusing the
+    REQ-201 motif / REQ-207 brand art), not the browser's default blank page icon;
+    the favicon is a local static asset or an inline data URI, with no runtime
+    request to an icon font, CDN, or external art source (REQ-201)
+  - the favicon's colour is the active profile's accent: selecting each of the six
+    Theme profiles re-skins the favicon to that profile's colour, and a custom
+    Colorless colour (REQ-099) re-skins it to the resolved custom colour; the
+    favicon colour is never a per-profile hex hard-coded outside the token layer
+    (REQ-216) — it derives from the active profile's token-layer accent value
+  - the document title shown on the tab is a single defined branded string that is
+    not the bare default (it pairs the wordmark with the app's persona line);
+    asserted by an exact-string test against the served `<title>` / `document.title`
+  - a `<meta name="theme-color">` is present and its `content` equals the active
+    profile's accent colour taken from the one token source; switching profile
+    updates it across all six profiles (and to the resolved colour for a custom
+    Colorless), with no second hard-coded copy of a profile colour (REQ-216)
+  - the favicon and `theme-color` update through the existing single theme apply
+    point (`applyPalette`) on mount and on every profile change; the tab needs no
+    page reload to re-sync
+  - no animated favicon; the icon changes only when the profile changes, so no
+    decorative-motion loop is introduced (NFR-006 is not engaged)
+  - no change to in-app screens, the ☰ Menu tray and its rows, navigation,
+    routing, request contracts, the six profiles, or the card identity ring
+- Constraints:
+  - pure frontend/browser-chrome; no backend, no `AskAiRequest`/`GameContext`, no
+    routing or registry contract change
+  - all tab colour (favicon fill, `theme-color` content) derives from the active
+    profile's token-layer value through `applyPalette` (which REQ-216 names as part
+    of the token layer); no second table of per-profile hex strings lives in the
+    tab code, and no colour value is hard-coded outside the token layer (REQ-216)
+  - favicon art is local static art or an inline data URI built from the shipped
+    motif/brand art; no icon font, no CDN, no external art source (REQ-201)
+  - no web app manifest, no service worker, no installable PWA in scope; the
+    `theme-color` meta alone tints the mobile browser bar
+  - browser chrome only: adds no in-app screen or major overlay, so no new
+    `screen-layout.md` row is required (REQ-126)
+- Dependencies:
+  - REQ-200
+  - REQ-201
+  - REQ-207
+  - REQ-216
+  - REQ-099
+- Notes:
+  - the "tab" is the browser (Chrome/Firefox) tab, not the in-app ☰ Menu. Today
+    `apps/frontend/index.html` has no `<link rel="icon">` and no
+    `<meta name="theme-color">`, ships no favicon file under
+    `apps/frontend/public/`, and sets a static `<title>TheJudge</title>` with no
+    runtime `document.title`; there is no web app manifest
+  - the active profile is applied once through
+    `apps/frontend/src/lib/theme/applyPalette.ts` (sets `data-profile`; converts an
+    `"R G B"` triple to hex via its `triplet()` helper), driven by
+    `apps/frontend/src/hooks/useThemePalette.ts` on mount and on every change; the
+    per-profile motif art is `apps/frontend/src/lib/theme/motifSymbols.ts`
+    (`MOTIF_SYMBOLS`, drawn in `currentColor`) and the brand orb is
+    `apps/frontend/src/components/BrandMark.tsx`; the six profiles' colours live in
+    `apps/frontend/src/styles/tokens.css` under `[data-profile]` (REQ-216)
+  - reserved and proposed by the `tab-personality-color-sync` package. The owner
+    clarified the request is the browser tab, not the in-app hamburger menu; this
+    id's earlier (Menu-tray) content and its A/B blocker are superseded
```

**2. `PRD/sections/shared-chrome/README.md` — amend "The Menu corner rail and tray" (add one bullet after the "Built: the tray lists …" bullet, which currently ends "The no-stored-preference default is still `quick-lookup`. (REQ-067, REQ-206, REQ-213, DEC-135, DEC-104, DEC-095)"):**

```diff
   Question History is a fixed row, not a registry entry, opening the active
   destination's own history trigger (REQ-213). Rows render full-bleed, separated
   by rules that meet the tray's left wall; the active entry keeps a check mark and
   quiet fill. The no-stored-preference default is still `quick-lookup`. (REQ-067,
   REQ-206, REQ-213, DEC-135, DEC-104, DEC-095)
+- Built: the browser tab itself carries personality and stays synced to the active
+  colour profile. The app ships a favicon carrying TheJudge's own mark with the
+  active profile's element (reusing the REQ-201 motif / REQ-207 brand art, local
+  static art, no CDN), drawn in the active profile's accent in place of the
+  browser's default blank icon; the document title on the tab is a single branded
+  string with a touch of personality rather than a bare placeholder; and a
+  `theme-color` meta tints the mobile browser bar to the active accent. All of it
+  updates through the single theme apply point (`applyPalette`) on mount and on
+  every profile change, so switching Theme re-skins the tab (including a custom
+  Colorless colour, REQ-099) with no page reload; all tab colour derives from the
+  one token source with no hard-coded per-profile hex (REQ-216), and there is no
+  web app manifest or animated icon. (REQ-219, REQ-200, REQ-201, REQ-207, REQ-216,
+  REQ-099)
```

- Verdict:
- Reason:

---

## Blocker questions

None. The app is a single-page app that lives in one browser tab and wears
exactly one colour profile at a time, so "sync up with its respective colour
profile" has one reading for the browser tab: the tab follows the one active
profile. The earlier A/B fork (one active colour vs a fixed colour per tab) does
not arise for the browser tab and is dropped.
