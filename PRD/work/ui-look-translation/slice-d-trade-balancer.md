# Slice D — Trade Balancer

## Status: planned

## Goal

Rebuild the Trade Balancer in `trade-balancer.html`'s DOM order on the frame's layers, with the same printing added twice merging into one row with a quantity.

Visual source: `docs/design/ui-reimagining/direction-1/trade-balancer.html` (stylesheets `tokens.css`, `shell.css`, `flow.css`, `ambience.css`, script `ambience.js` in the same folder). Do not redesign anything.

## Requirements

Cross-cutting: REQ-216 (one visual system) binds this slice. Gate blocks applied here: REQ-215. Behaviour rules that win over the mockup: REQ-064/REQ-065 totals and pricing unchanged; REQ-215 tiers and verdict bands; REQ-207 glass panel (frame).

1. Rebuild `TradeBalancer`, `TradeSide`, `TradeEntryRow`, `TradePile` and `PrintingPicker` in the mockup's order on plates and pills from `flow.css`. `TradePile`'s gold, bronze and gem artwork stays exempt and unchanged.
2. REQ-215: two rows merge only when card, printing and finish all match (reading A14); the existing quantity stepper carries the count. Totals and pricing (REQ-064/REQ-065) are unchanged.
3. Apply the REQ-215 gate block to `PRD/sections/` by intent, once.

Constraints (whole package): ports 5273, 3100 and 5300 are the owner's — never start, stop or reuse them; serve the build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and a copy of the mockup folder on other ports; Playwright MCP needs absolute paths; never stash; presentation only except where an accepted block says otherwise (no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline); no new dependency, no light theme, no animation library. Deliverables land under `docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/` and `scripts/`, never under `PRD/work/`.

## Files touched

Rebuilt components (the audit's `FILES`, in mockup DOM order):

- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/trade/TradeSide.tsx`
- `apps/frontend/src/components/trade/TradeEntryRow.tsx`
- `apps/frontend/src/components/trade/TradePile.tsx`
- `apps/frontend/src/components/trade/PrintingPicker.tsx`

Also touched:

- apps/frontend/src/components/trade/useTradeScan.ts (only if the merge needs it)
- apps/frontend/src/index.css (added lines only, audited)
- PRD/sections/ (REQ-215 by intent)
- `docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/` (pairs, masks, `DIFF-RESULTS.md`)

## Tests

- `TradeBalancer.test.tsx`, `TradeSide.test.tsx`, `PrintingPicker.test.tsx`, `TradeBalancer.scan.test.tsx` updated for DOM order, behaviour kept
- New test: adding the same printing and finish twice yields one row, quantity 2; a different finish or printing yields a second row; totals unchanged

## Acceptance criteria

Threshold for this slice: differing fraction at most 0.04 per pair (initial; measure first, lower it only with evidence, never raise it to or above 0.05). States to pair: default-trade, printing-picker.

- [ ] **D1** Side-by-side pairs exist at 390x844 and 1440x900 for every state (default-trade, printing-picker) in docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/, named `<state>-build-<viewport>.png` and `<state>-mockup-<viewport>.png` (plus `<state>-mask-<viewport>.json` where a mask is used), same profile and state on both sides, reduced motion emulated
- [ ] **D2** `node scripts/compare-screenshot-pair.mjs --build ... --mockup ...` is run on every pair and each row (pair, mask file or none, tolerance, differing fraction, threshold) is in docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/DIFF-RESULTS.md; every differingFraction is at or below the slice threshold 0.04 (itself below 0.05); every mask region is named with a reason
- [ ] **D3** `npm run quality:check` is green
- [ ] **D4** `npm --workspace apps/frontend run test` is green
- [ ] **D5** `npm --workspace apps/backend run test` is green
- [ ] **D6** REQ-216 audit (a1): the brief's verbatim command over this slice's rebuilt components (the `FILES` list below) prints 0; command and count recorded in DIFF-RESULTS.md
- [ ] **D7** REQ-216 audit (a2): the brief's verbatim command over every line added under `apps/frontend/src` since `BASE` prints 0; command and count recorded in DIFF-RESULTS.md
- [ ] **D8** Profile-switch pair: the default-trade state in two different Theme colours at 390x844 is saved as `default-trade-profile-<name>-build-390x844.png` (two names) in docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/, with every element recoloured and none left behind (observed)
- [ ] **D9** Life Tracker table before/after pair (REQ-202) is saved at both widths under `translation/life-tracker-table/`; the owner reviews it and no pixel count blocks the slice
- [ ] **D10** Cleanup evidence: the Playwright browser is closed (`browser_close`), the build server and the mockup server this slice started are stopped, their ports (never 5273, 3100 or 5300) are released (`lsof -i :<port>` empty), and the capture path docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/ (absolute paths) is recorded in DIFF-RESULTS.md
- [ ] **D11** Adding the same printing and finish twice shows one row with quantity 2, a different printing or finish a separate row, and both side totals match the unmerged sum (test plus observation)
- [ ] **D12** Both sides of the default trade and the printing picker render in mockup DOM order with REQ-215 tiers and verdict bands
- [ ] **D13** `PRD/sections/` carries the REQ-215 edit, applied once

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
node scripts/compare-screenshot-pair.mjs --build docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/<state>-build-390x844.png --mockup docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/<state>-mockup-390x844.png [--mask docs/design/ui-reimagining/build-screenshots/translation/trade-balancer/<state>-mask-390x844.json] [--tolerance N]
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
