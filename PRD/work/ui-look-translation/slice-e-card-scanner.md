# Slice E — Card scanner

## Status: done

## Goal

Rebuild the card scanner's chrome in `card-scan.html`'s DOM order, with the mockup's hint line; scanner behaviour does not change.

Visual source: `docs/design/ui-reimagining/direction-1/card-scan.html` (stylesheets `tokens.css`, `shell.css`, `flow.css`, `ambience.css`, script `ambience.js` in the same folder). Do not redesign anything.

## Requirements

Cross-cutting: REQ-216 (one visual system) binds this slice. Gate blocks applied here: REQ-214. Behaviour rules that win over the mockup: REQ-214 holding list and close-commit; Detection, lock, ding and tuned cause-hints unchanged (DEC-052 family).

1. Rebuild `ScanCameraSurface` chrome, `ScanReviewBubble` and `ScanDebugOverlay` (exempt, behaviour untouched) in the mockup's order; no flow layer. Move `ScanCameraSurface`'s `rgba(15,23,42,0.35)` dimmed surround to a token.
2. REQ-214: the mockup's hint line (also the scanner's Chrome row in `screen-layout.md`). The holding list and close-commit stay as built. `ScanCardOutline` debug stroke stays exempt.
3. Camera-unavailable cannot be forced in a mock browser reliably: capture the mockup state as reference only, record that in DIFF-RESULTS.md, and diff only the locking-on pair.
4. Apply the REQ-214 gate block to `PRD/sections/` by intent, once.

Constraints (whole package): ports 5273, 3100 and 5300 are the owner's — never start, stop or reuse them; serve the build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and a copy of the mockup folder on other ports; Playwright MCP needs absolute paths; never stash; presentation only except where an accepted block says otherwise (no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline); no new dependency, no light theme, no animation library. Deliverables land under `docs/design/ui-reimagining/build-screenshots/translation/card-scanner/` and `scripts/`, never under `PRD/work/`.

## Files touched

Rebuilt components (the audit's `FILES`, in mockup DOM order):

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanReviewBubble.tsx`
- `apps/frontend/src/components/ScanDebugOverlay.tsx`
- `apps/frontend/src/components/ScanCardOutline.tsx`

Also touched:

- apps/frontend/src/index.css (added lines only, audited)
- PRD/sections/ (REQ-214 and the `screen-layout.md` Chrome row, by intent)
- `docs/design/ui-reimagining/build-screenshots/translation/card-scanner/` (pairs, masks, `DIFF-RESULTS.md`)

## Tests

- `ScanCameraSurface.test.tsx`, `ScanReviewBubble.test.tsx`, `ScanDebugOverlay.test.tsx`, `ScanCardOutline.test.tsx` updated for the hint line and DOM order; detection, lock and ding assertions untouched

## Acceptance criteria

Threshold for this slice: differing fraction at most 0.04 per pair (measured maximum 0.0154 at tolerance 12; kept at 0.04, never raised to or above 0.05). States to pair: locking-on, camera-unavailable.

- [x] **E1** Side-by-side pairs exist at 390x844 and 1440x900 for every state (locking-on, camera-unavailable) in docs/design/ui-reimagining/build-screenshots/translation/card-scanner/, named `<state>-build-<viewport>.png` and `<state>-mockup-<viewport>.png` (plus `<state>-mask-<viewport>.json` where a mask is used), same profile and state on both sides, reduced motion emulated
- [x] **E2** `node scripts/compare-screenshot-pair.mjs --build ... --mockup ...` is run on every pair and each row (pair, mask file or none, tolerance, differing fraction, threshold) is in docs/design/ui-reimagining/build-screenshots/translation/card-scanner/DIFF-RESULTS.md; every differingFraction is at or below the slice threshold 0.04 (itself below 0.05); every mask region is named with a reason
- [x] **E3** `npm run quality:check` is green
- [x] **E4** `npm --workspace apps/frontend run test` is green
- [x] **E5** `npm --workspace apps/backend run test` is green
- [x] **E6** REQ-216 audit (a1): the brief's verbatim command over this slice's rebuilt components (the `FILES` list below) prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **E7** REQ-216 audit (a2): the brief's verbatim command over every line added under `apps/frontend/src` since `BASE` prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **E8** Profile-switch pair: the locking-on state in two different Theme colours at 390x844 is saved as `locking-on-profile-<name>-build-390x844.png` (two names) in docs/design/ui-reimagining/build-screenshots/translation/card-scanner/, with every element recoloured and none left behind (observed)
- [x] **E9** Life Tracker table before/after pair (REQ-202) is saved at both widths under `translation/life-tracker-table/`; the owner reviews it and no pixel count blocks the slice
- [x] **E10** Cleanup evidence: the Playwright browser is closed (`browser_close`), the build server and the mockup server this slice started are stopped, their ports (never 5273, 3100 or 5300) are released (`lsof -i :<port>` empty), and the capture path docs/design/ui-reimagining/build-screenshots/translation/card-scanner/ (absolute paths) is recorded in DIFF-RESULTS.md
- [x] **E11** The hint line from `card-scan.html` renders on the scanner in the locking-on state (observed, wording matched)
- [x] **E12** `ScanCameraSurface.tsx` carries no `rgba(` literal (grep count 0) and detection, lock, stabilizer and ding code is unchanged (`git diff` shows no hunk outside chrome markup and styles)
- [x] **E13** The camera-unavailable mockup state is captured as reference only and DIFF-RESULTS.md says so
- [x] **E14** `PRD/sections/` carries the REQ-214 edit and the scanner Chrome row, applied once

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
node scripts/compare-screenshot-pair.mjs --build docs/design/ui-reimagining/build-screenshots/translation/card-scanner/<state>-build-390x844.png --mockup docs/design/ui-reimagining/build-screenshots/translation/card-scanner/<state>-mockup-390x844.png [--mask docs/design/ui-reimagining/build-screenshots/translation/card-scanner/<state>-mask-390x844.json] [--tolerance N]
# REQ-216 audit, brief's verbatim command (BASE = commit this slice started from, FILES = list above)
PAT='#[0-9a-fA-F]{3,8}\b|rgba?\( *[0-9.]|hsla?\( *[0-9.]|\b(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b|shadow-\[|box-shadow: *-?[0-9]|--[a-zA-Z][a-zA-Z0-9-]*"? *:|setProperty\('
SKIP='\.test\.tsx?$|/(tokens|shell|flow|ambience)\.css$|^apps/frontend/src/lib/theme/|^apps/frontend/src/components/AmbientScene\.tsx$|^apps/frontend/src/components/trade/TradePile\.tsx$|^apps/frontend/src/components/(ScanCardOutline|ScanDebugOverlay)\.tsx$|^apps/frontend/src/lib/cardIdentityRing\.ts$|^apps/frontend/src/components/portal/life-tracker/(PlayerLifeCard|PlayerLifeTrackerApp)\.tsx$'
# (a1) rebuilt components, whole file
printf '%s\n' $FILES | grep -vE "$SKIP" | while read -r f; do cat "$f"; done | grep -cE "$PAT"
# (a2) every added line under apps/frontend/src
git diff -U0 "$BASE"..HEAD -- apps/frontend/src \
  | SKIP="$SKIP" awk '/^\+\+\+ /{f=substr($0,7); keep=(f !~ ENVIRON["SKIP"]); next} keep && /^\+/' \
  | grep -cE "$PAT"
```

## Named deviations (recorded in `translation/card-scanner/DIFF-RESULTS.md`)

- The camera-unavailable state is reference only: the mockup's centred message is not built (the scanner's own copy is pinned, REQ-052/REQ-071).
- The count pill and caution triangle appear once a card is held (the mockup draws the triangle always).
- The mockup's debug panel and fixed lock outline are not built; the scanner's own Debug overlay and lock outline stay.
