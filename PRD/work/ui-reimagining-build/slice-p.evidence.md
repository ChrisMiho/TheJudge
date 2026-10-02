# Slice P — manual evidence

2026-10-02 P9/P7 — mockup served from `docs/design/ui-reimagining/direction-1/`
on port 4671 (`python3 -m http.server 4671 --directory docs/design/ui-reimagining/direction-1`);
build served in mock mode on ports 3171/5371
(`VITE_ASK_AI_PROVIDER=mock PORT=3171 FRONTEND_PORT=5371 node scripts/dev.mjs`,
backend log confirmed `askAiProvider: "mock"`). Both driven with Playwright to
Blue (`?profile=blue` on the mockup; the build's own default), captured at
390×844 and 1440×900. 6 files under `docs/design/ui-reimagining/build-screenshots/p/`:

- `card-scan-{build,mockup}-{390x844,1440x900}.png` — the "locking on" state
  reached from Ask a Question's own "Scan a card" chip (the build's headless
  test browser has no camera, so its viewfinder is black; the mockup's own
  default state is "locking" with its demo Lightning Bolt still-frame).
- `card-scan-camera-error-mockup-{390x844,1440x900}.png` — carried forward
  unchanged (copied, not re-captured) from
  `docs/design/ui-reimagining/build-screenshots/look-gaps/`, per the slice
  doc: the camera-unavailable state has no build partner in a headless
  browser with no camera.

Measured before capturing, both widths: `window.innerHeight` equals
`document.documentElement.scrollHeight` exactly (390×844: 844/844; 1440×900:
900/900) — the page does not scroll. At 1440×900 this took two fixes beyond
the slice doc's own file list (see Deviations): a new `PageShell`
`"narrow-fit"` variant (the scan state's viewport-fit, previously only
Trade Balancer's wide-fit existed) and a desktop width formula on
`.cs-viewfinder` solved backwards from the phone clamp's own height budget,
because the literal mockup value (31.5rem) does not fit this app's own
(taller) header+title chrome — confirmed by `elementFromPoint` landing on
the foot row's own shutter/mute/Debug buttons at both sizes (not on the page
background), so they are genuinely reachable, not just visually present.

Compared side by side against every `### Differences` bullet under
LOOK-GAPS.md's `## Card scanner`:

- Frame — **closed**: the header and mock-mode strip stay visible (confirmed
  in both captures — previously only ☰ showed); one panel, no nested frames
  (`.cs-viewfinder`, replacing the old ~358px/~333px double-rounded-box);
  "Scan a card" `h1` plus a 44px `.cs-scan-exit` ✕ at the header row's right,
  replacing the old ✕-only top bar.
- Components present or absent — **closed**: the blank status dot is gone,
  replaced by the "Locking on <card>" indicator top-left (unchanged
  text/aria contract, confirmed by the full existing
  `ScanCameraSurface.test.tsx` suite passing, 49/49); corner-ticked guide
  with a marching dashed lock outline (`stroke-dasharray: 10 6`, the `march`
  keyframe, accent-soft token in place of the fixed `#34d399`); a foot row
  (mute pill, 54px round shutter, Debug pill) replaces the full-width
  rectangular Capture button; the credit moved under the panel in place of
  its old anchor inside the guide; the "✓ N" holding-count pill and the ⚠
  caution button (slice H, requirement 6) are unchanged in position and
  behaviour — only the caution pop-up's own content was restyled (icon +
  heading + two lines, `card-scan.html`'s `.caution-panel` shape).

### Owner question — carried verbatim, not resolved; one correction to the premise

LOOK-GAPS.md's one `## Card scanner` conflict is carried as instructed, with
one factual correction found while implementing it:

- "When a scanned card joins (REQ-214)." The slice doc's interim reading says
  "this slice ... leaves the hint text exactly as slice H wrote it — it does
  not adopt the mockup's wording." Checked against the actual code: **no such
  hint text exists anywhere in the build** (grepped `ScanCameraSurface.tsx`,
  every scan hook, and the three hosts) — slice H never wrote one. The "✓ N"
  pill, the caution button, and the holding-list behaviour (REQ-214) are all
  present and unchanged; only the premise that a hint line exists to leave
  alone was wrong. Since the mockup's own wording ("a confident match adds
  the card and keeps scanning") describes the pre-REQ-214 behaviour this
  slice must not imply, and no alternative wording was specified, this slice
  adds no hint line rather than inventing one unreviewed. The owner's
  question stays open and should be re-asked against this corrected premise:
  does the owner want a hint line added at all, and if so, what should it
  say now that scanned cards hold rather than auto-join?

2026-10-02 P9 — browser scenario at 390×844 and 1440×900: opened the scanner
from Ask a Question's own "Scan a card" chip; confirmed the header
(brand/☰/mock-mode strip) stayed mounted and visible (previously hidden);
confirmed the guide (corner ticks) and the lock-outline SVG path render
(structurally — the headless browser has no camera to drive a real lock, so
`convergence.phase` never reaches "locking" in this manual pass; the
lock-outline's render path, its dash pattern, and its colour token are
covered instead by `ScanCardOutline.test.tsx`'s own unit tests, which do
exercise it); clicked into the foot row and confirmed, via
`document.elementFromPoint`, that the mute, shutter, and Debug buttons are
the hit-tested elements at their own coordinates (not clipped behind the
page background) at both widths; confirmed `document.documentElement.scrollHeight
=== window.innerHeight` at both widths (measured above). Closed the scanner
via the new header-row ✕ ("Exit scan", unchanged accessible name) and
confirmed the "Ask a Question" title/Add-card/Scan row returns.

2026-10-02 P10 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). Both dev-server instances (the mockup's `python3
-m http.server` on port 4671, and the build's `node scripts/dev.mjs` on
ports 3171/5371) were started by this session as tracked background tasks
and stopped via `TaskStop`; `lsof -nP -iTCP:4671,3171,5371 -sTCP:LISTEN`
returned no listeners after both stops. Disposable captures: none landed
under `PRD/work/ui-reimagining-build/.playwright-mcp/` (not created this
session) — every capture in this slice was saved straight to its reviewable
`docs/design/ui-reimagining/build-screenshots/p/` destination via an
absolute `filename` (the two camera-error references were copied, not
captured). The Playwright MCP server wrote its own console/snapshot logs to
the launch checkout's root `.playwright-mcp/` (its own cwd) during this
pass; the 12 files it wrote this session were identified by their
`2026-10-02` timestamp and deleted afterward, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
its one pre-existing line (`M scripts/lib/boundary-rules.mjs`).

## Deviations from the slice doc's "Files touched" list

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` —
  touched (not listed): requirement 1 ("keep the header and mock-mode strip
  visible — they are hidden today") could not be satisfied inside
  `ScanCameraSurface.tsx` alone. The header-hiding was this *host's* own
  conditional (`{!scanCapture.isOpen && (<StagedStepHeader/>…)}`), the only
  one of the three hosts (Ask a Question, Trade Balancer's `TradeSide`,
  In-depth's `ZoneCardPicker`) that did this — confirmed by reading all
  three before changing anything, and matching the slice doc's own State
  line ("Build: Scan from Ask a Question"), the exact repro LOOK-GAPS used.
  Changed to always render `StagedStepHeader`, swapping the row under it
  between "Ask a Question" (+Add card/Scan) and "Scan a card" (+ the new
  `.cs-scan-exit`) by `scanCapture.isOpen`. Also moved the old inline
  "Exit scan" button (absolute over the camera's corner) into that header
  row, preserving its exact accessible name. No test in
  `QuickLookupApp.test.tsx` (18/18 green, unmodified) asserted the header's
  absence during scanning.
- `apps/frontend/src/components/PageShell.tsx` and `apps/frontend/src/index.css`
  — touched (not listed): requirement 7 ("the viewfinder fits the viewport")
  needed the scan state to stop using the "narrow" variant's `min-height:
  100vh` floor (the same floor slice O's Trade Balancer `"wide-fit"` variant
  already overrides, for the same reason — a `.page-shell`/`.page-content`
  padding-stack that adds scroll even when content is shorter than the
  viewport). Added `"narrow-fit"`: `.page-shell-fit` (already shared with
  "wide-fit") at the narrow 36rem width. `QuickLookupApp` passes it only
  while `scanCapture.isOpen`; its non-scanning state is unaffected (still
  plain `"narrow"`, still scrolls by design e.g. with topics open).
  `PageShell.test.tsx` (4/4) is unaffected — it does not enumerate variants
  exhaustively.
- `.cs-viewfinder`'s desktop sizing is not the mockup's literal `31.5rem`
  (`card-scan.html:19-20`): at that width, this app's own (taller)
  header+title-row+page-padding chrome pushed the foot row below the fold
  (confirmed by `elementFromPoint` landing on the page background, not a
  button). The video inside derives its height from this element's width
  via a test-pinned `aspect-ratio` class I cannot change
  (`md:aspect-[3/4] md:h-auto` — asserted verbatim by
  `ScanCameraSurface.test.tsx`), so the fix is solved backwards from the
  same `clamp(20rem, calc(100dvh - Nrem), 42rem)` shape the phone clamp
  already uses on the video directly, times 3/4 for width, capped at the
  mockup's own 31.5rem as a ceiling. Documented at the declaration in
  index.css.
- `apps/frontend/src/components/ScanReviewBubble.tsx` (+ `.test.tsx`) —
  restyling its caution pop-up (in the slice doc's own files-touched list)
  split the old one-sentence paragraph into a heading + two paragraphs
  (`card-scan.html`'s `.caution-panel` shape); the one test asserting the
  old combined sentence was updated to assert the heading and body
  separately, not loosened.
- `apps/frontend/src/components/ScanCardOutline.tsx` (+ `.test.tsx`) — in
  the slice doc's own files-touched list; its test's literal `"#34d399"`
  stroke assertion was updated to the new `"rgb(var(--accent-soft))"` value,
  and a new test added for the marching-dash attributes (requirement 3).
- `apps/frontend/src/components/ScanCameraSurface.test.tsx` — in the slice
  doc's own "Tests" section; two tests whose entire premise was the old
  geometry (Debug absolutely centered at the bottom; mute/credit anchored
  inside the guide) were rewritten to assert the new foot-row placement
  instead of being deleted, since the underlying behaviour (Debug reachable,
  mute reachable, the credit visible) still needs a regression guard.

### Review 1 fix (2026-10-02)

Review loop 1 (`REVIEW-1.md`) returned finding 1 (Critical, shared with slice
O): at 1440×900 the scanner's full-bleed header and ☰ were clipped. Same
root cause as slice O: `.page-content-narrow-fit` set `overflow: hidden` on
a column narrower (36rem) than the viewport, clipping the header's
full-bleed breakout to that column's own edges. Fixed by removing
`overflow: hidden` from `.page-content-narrow-fit` in
`apps/frontend/src/index.css` — `.page-shell-fit` (shared with slice O)
still clips at `<main>`'s own viewport-wide edges, so the no-page-scroll fit
(P9) is unchanged.

Verified live at 1440×900: "Scan a card" header, ☰, and the 44px ✕ exit all
render full-bleed and reachable, with the viewfinder panel fitting the
viewport exactly as before. Recaptured
`p/card-scan-build-{390x844,1440x900}.png` (390×844 was already correct per
the reviewer and is unchanged by this fix; recaptured anyway for a
consistent pair). P3 and P9 re-verified true by the recapture.

Finding closed.
