# Slice L — manual evidence

2026-10-02 L10 — captured the REQ-202 Life Tracker before/after pair at 390×844 and
1440×900, saved to `docs/design/ui-reimagining/build-screenshots/l/`
(`life-tracker-before-390x844.png`, `life-tracker-after-390x844.png`,
`life-tracker-before-1440x900.png`, `life-tracker-after-1440x900.png`). "Before"
captured against the pre-slice-L tree (`git stash push -- apps/frontend/src`, Vite
HMR picked up the reverted tree live against the already-running dev server);
"after" captured against the slice's working tree, then the stash was restored with
`git stash apply` (never `pop`/`drop`, per the boundary list — the stash entry
stays in the list, harmless). The four player life cards, the seat layout, and the
Day/Night and settings controls render pixel-identical between before/after at
both widths — Life Tracker's own counters and layout are untouched. The shared
chrome around them changed exactly as the slice intends: the header gained the
gradient background, the breathing orb, and the tagline; the mock-mode strip
gained its accent-tinted fill and hairline border in place of the old flat
accent-strong bar.

2026-10-02 L11/L12 — mockup served from `docs/design/ui-reimagining/direction-1/`
on port 4611 (`python3 -m http.server 4611 --directory docs/design/ui-reimagining/direction-1`);
build served in mock mode on ports 3121/5301
(`VITE_ASK_AI_PROVIDER=mock PORT=3121 FRONTEND_PORT=5301 node scripts/dev.mjs`).
Both driven with Playwright to Blue (`?profile=blue` on the mockup; the build's
own default), captured at 390×844 and 1440×900, 20 files under
`docs/design/ui-reimagining/build-screenshots/l/`:

- `chrome-{build,mockup}-{390x844,1440x900}.png` — page at rest on `/quick-lookup`.
- `chrome-menu-{build,mockup}-{390x844,1440x900}.png` — Menu open.
- `chrome-feedback-{build,mockup}-{390x844,1440x900}.png` — Send feedback open.
- `chrome-history-{build,mockup}-{390x844,1440x900}.png` — Question History open.
- `card-detail-sheet-{build,mockup}-{390x844,1440x900}.png` — card detail open
  (Lightning Bolt, searched and attached first).

Compared side by side against every `### Differences` bullet under
`LOOK-GAPS.md`'s `## Frame, Menu, Theme band and shared sheets`:

- Frame/header/brand/mock-strip/ambient scene (the five bullets under "Frame"
  and "Colour scene and motion"): closed. The build shows the full-bleed sticky
  `.app-header` with the radial+linear gradient, the 38px breathing orb, the
  gradient wordmark, the uppercase tagline, the 50px ☰, and the mock-mode strip
  directly under the header. The ambient scene's dust/haze is visible behind the
  content in every capture (previously invisible — the single biggest gap LOOK-GAPS
  named).
- Menu bullets: closed, plus one additional bug the side-by-side surfaced that
  LOOK-GAPS had already flagged but attributed to the old card frame — the
  Question History row's clock icon had no sized CSS class at all
  (`.portal-menu-drawer-row-icon` was referenced in `FeaturePortalMenu.tsx` but
  never defined), so it rendered ~100px tall before this slice's `index.css` fix
  (28px, matching the mockup's glyph column). The tray is now a full-height left
  drawer with the gradient surface, the backdrop dim/blur layer, the foot-of-tray
  glow, the divider before Send feedback, and the aria-current row's left accent
  bar — confirmed in both captures. Fixing "full height" also required raising
  `.page-content`/`.page-shell-bleed` to a `100vh` floor: `ShellBounds`'s clip box
  (REQ-113) is sized to its host box, and a short destination's own content (Ask a
  Question's empty state) previously clipped the tray partway down the screen —
  the same symptom LOOK-GAPS blamed on the old card, now traced to its real cause
  and fixed structurally rather than by removing the card alone.
- Theme band: closed (pill container, 46px-tall cells, rounded end caps).
- Shared sheets bullets (grab handle, backdrop blur, glass surface, close button
  shape): closed for all three sheets captured. Send feedback: closed (glyph
  pills, outlined/glowing selected state, one dashed snapshot row with a leading
  icon and a trailing chevron toggle). Question History: closed (muted "— N of
  20" count, mode chip, trailing chevron, foot note) — captured against an empty
  list (`0 of 20`, fresh session, no seeded entries); the row-content shape
  (fan/chevron/chip) is visible only once an entry exists, left as a structural,
  not a captured-pixel, confirmation here. Card detail: closed — the art-crop
  hero, the type line with the colour-identity dot (reusing `getCardIdentityRing`,
  the same source the card tile's own ring reads — no new colour mapping), the
  oracle box, and the three fact chips (Mana value, Subtypes, Price) all render;
  Price shows a real value ($13.84 for Lightning Bolt) from the same
  `GET /api/cards/:oracleId/prices` endpoint Trade Balancer and the scanner
  already call.
- One conflict with an accepted requirement LOOK-GAPS' own research missed (its
  Frame section says "None found on this screen"): the mockup's close button is
  flat white on zinc glass, which would retire DEC-159/REQ-142 ("color comes from
  the active palette's accent tokens … so it stays legible and visibly changes
  across all six fixed palettes" — asserted by `OverlayCloseButton.test.tsx`).
  Resolved per `DESIGN-BRIEF.md`'s "the requirement wins on behaviour" rule:
  `OverlayCloseButton` keeps its accent-derived colour and takes only the
  mockup's silhouette (`rounded-lg`, a rounded square, in place of a full circle).
  This is a resolved conflict, not an open owner question — the rule already
  decides it unambiguously.

2026-10-02 L13 — browser scenario: with the build launched exactly as
`VITE_ASK_AI_PROVIDER=mock PORT=3121 FRONTEND_PORT=5301 node scripts/dev.mjs`
(`scripts/dev.mjs` never sets `VITE_ASK_AI_PROVIDER` on its own — confirmed by
reading the script before this pass), the mock-mode strip rendered directly under
the header, styled per `shell.css:325-332` (0.72rem, accent-tinted fill, hairline
bottom border), on every one of the 390×844 and 1440×900 captures above.

2026-10-02 L14 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). Both dev-server instances (the mockup's
`python3 -m http.server` on port 4611, and the build's `node scripts/dev.mjs` on
ports 3121/5301) were started by this session as tracked background tasks and
stopped via `TaskStop`; `lsof -i :3121 -i :5301 -i :4611` returned no listeners
after both stops. Disposable captures, this slice's own ports, under
`PRD/work/ui-reimagining-build/.playwright-mcp/` (created for this pass; empty —
every capture in this slice was saved straight to its reviewable
`docs/design/ui-reimagining/build-screenshots/l/` destination via an absolute
`filename`, so none landed here). The Playwright MCP server also wrote its own
console/snapshot logs to the launch checkout's root `.playwright-mcp/` (its own
cwd, not parameterized by this session) during this pass; those were identified
by their `2026-10-02` timestamp and deleted afterward, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to its
one pre-existing line (`M scripts/lib/boundary-rules.mjs`).

## Deviations from the slice doc's "Files touched" list

Restyling `StagedStepHeader.tsx`, `PageShell.tsx` and `FeaturePortalMenu.tsx` to
the mockup's actual full-bleed/sticky header and full-height tray required
touching files the slice doc did not list, plus their tests, because the
mockup's look genuinely depends on behaviour those files own (the header's
placement relative to `.page-content`'s width cap; the Menu tray's clip box).
Touched beyond the listed set, each for a reason tied directly to a numbered
requirement or a LOOK-GAPS bullet above: `OverlayCloseButton.tsx` (the glass
shell's close control, requirement #9), `ConversationHistoryDrawer.tsx` (the
mode chip/chevron/foot-note/muted-count bullets), `apps/frontend/src/lib/cardImage.ts`
(+ its test) for the art-crop URL helper requirement #10 needs, and the test
files `responsiveSurfaceHooks.test.tsx`, `portal/DestinationOutlet.test.tsx`,
`portal/FeaturePortalMenu.test.tsx`, `portal/ThemeSection.test.tsx` (updated, not
loosened, to assert the new look in place of the retired one) plus a new
`PageShell.test.tsx` (none existed). No slice A–K doc, criteria file, or
`PRD/sections/` path was touched.

## Not closed — not added as an owner question (LOOK-GAPS named none on this screen)

- Per-destination Menu row icons (Ask a Question / Life Tracker / Trade Balancer):
  the mockup draws a distinct glyph per row; this slice does not invent new icon
  assets with no cited source (the mockup's own icons are plain Unicode glyphs
  embedded in its demo markup, not cited by file:line the way every other value
  in this slice is). Only the already-built History glyph keeps/gets its 28px
  column.
- The Menu tray's canvas-drawn foot flair (`ambience.js`'s falling shapes) —
  explicitly out of scope per `DESIGN-BRIEF.md`'s non-goal A1 (script/canvas
  animation); the static CSS glow it sits over is built.

### Review 1 fix (2026-10-02)

Review loop 1 (`REVIEW-1.md`) returned two findings against this slice.

- Finding 2 (Critical, L8/L12): with the Menu open, `.app-header`
  (`z-index: 20`) painted over `.portal-menu-drawer` (`z-index: 2`), because
  `.portal-shell-bounds` — the clip box the drawer and its backdrop portal
  into — had `z-index: auto`, so its contents were compared against the
  header in the header's own stacking context and always lost. Fixed by
  giving `.portal-shell-bounds` `z-index: 21` (`apps/frontend/src/index.css`),
  one above the header, so the whole portaled subtree now paints on top.
  Verified live: "Ask a Question" and "Question History" are fully visible
  and tappable with the tray open at both 390×844 and 1440×900 (recaptured
  `l/chrome-menu-build-{390x844,1440x900}.png`).
  - Same finding also named the Theme band's ‹ › arrows and a clipped sixth
    cell inside the 320px tray. Root cause: the `hidden` attribute on the
    scroll-arrow buttons (`ThemeSection.tsx`) did nothing, because Tailwind's
    `grid` utility class (an author rule) sits later in the generated
    stylesheet than preflight's `[hidden] { display: none }` at the same
    specificity, so the arrows stayed painted and sized even with nothing to
    scroll — stealing width from the track and causing the real overflow the
    reviewer saw. Fixed with an inline `style={{ display: ... }}` on both
    arrows (inline styles always win), plus tightening the track's gap from
    4px to the mockup's 2px (`gap-[2px]`) now that the arrows genuinely stop
    taking space when hidden. Verified live: all six cells fit with no
    arrows at 320–390px and at 1440px.
- Finding 6 (Important, L12): Send feedback still had sentence-case labels, a
  tall two-part snapshot block with a separate "Show/Hide app-state details"
  button, and started high on the screen. Fixed in `FeedbackModal.tsx`:
  "What happened?" and "Reply email (optional)" now use the uppercase-eyebrow
  style `Feedback type` already had; the snapshot row is now one truncated
  line (`min-w-0 truncate`) with the toggle shrunk to a bare chevron (its
  "Show/Hide app-state details" accessible name kept as an `sr-only` span, so
  no behaviour or test-facing name changed); the textarea dropped from 5 to 4
  rows to match the mockup. The sheet is now visibly content-sized at both
  widths (recaptured `l/chrome-feedback-build-{390x844,1440x900}.png`) —
  centred and compact on desktop, starting well down the screen on phone,
  rather than the prior tall block.

Both findings closed. `FollowUpComposer.test.tsx`-style scrutiny doesn't apply
here, but `ThemeSection.test.tsx` and `FeedbackModal.test.tsx` stay green
unchanged (same accessible names, same behaviour) — see `npm --workspace
apps/frontend run test` in the node's terminal report.
