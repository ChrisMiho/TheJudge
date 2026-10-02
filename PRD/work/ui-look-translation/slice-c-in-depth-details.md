# Slice C — In-depth details

## Status: planned

## Goal

Rebuild the In-depth flow (Game, Zones, Cards, Placing, Context, Review, Ruling) in `in-depth-question.html`'s DOM order on the frame's layers, with the ruling's Edit chip returning to the review.

Visual source: `docs/design/ui-reimagining/direction-1/in-depth-question.html` (stylesheets `tokens.css`, `shell.css`, `flow.css`, `ambience.css`, script `ambience.js` in the same folder). Do not redesign anything.

## Requirements

Cross-cutting: REQ-216 (one visual system) binds this slice. Gate blocks applied here: REQ-209. Behaviour rules that win over the mockup: REQ-018 every zone one tap away; REQ-209 stations and guardrails; REQ-210 Mana spent on every zone; REQ-211 Copies; REQ-058 identity ring on every enrichment row; REQ-070 and REQ-124 (their blocks are applied in slice B; this slice applies the code where they touch In-depth).

1. Rebuild `MtgAssistantApp`, `StationsRail`, `ZoneCollectionStep`, `ZoneCardPicker`, `ZoneCardMenu`, `ZoneConfirmStep`, `EnrichmentStep` and the chat in the mockup's order; plates, shelf and pills come from `flow.css`.
2. REQ-209: the ruling's pencil Edit chip renders and returns to the review with everything kept; the answered thread leaves the page already saved to Question History; the next send starts a new conversation (reading A16).
3. Helper text follows the mockup (REQ-070) and the column takes the mockup width (REQ-124) on In-depth; the truth edits are applied once in slice B.
4. Replace `EnrichmentStep.tsx`'s inline `#e2e8f0` with the primary-text token. Keep REQ-018, REQ-210, REQ-211 and the REQ-058 identity ring unchanged.
5. Apply the REQ-209 gate block to `PRD/sections/` by intent, once.

Constraints (whole package): ports 5273, 3100 and 5300 are the owner's — never start, stop or reuse them; serve the build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and a copy of the mockup folder on other ports; Playwright MCP needs absolute paths; never stash; presentation only except where an accepted block says otherwise (no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline); no new dependency, no light theme, no animation library. Deliverables land under `docs/design/ui-reimagining/build-screenshots/translation/in-depth/` and `scripts/`, never under `PRD/work/`.

## Files touched

Rebuilt components (the audit's `FILES`, in mockup DOM order):

- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/StationsRail.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/ZoneCardMenu.tsx`
- `apps/frontend/src/components/ZoneConfirmStep.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/FrozenGameContextDetails.tsx`
- `apps/frontend/src/components/PlayerRosterEditor.tsx`
- `apps/frontend/src/components/AdaptiveContextDialog.tsx`

Also touched:

- apps/frontend/src/index.css (added lines only, audited)
- PRD/sections/ (REQ-209 by intent)
- `docs/design/ui-reimagining/build-screenshots/translation/in-depth/` (pairs, masks, `DIFF-RESULTS.md`)

## Tests

- `MtgAssistantApp.carry-placement.test.tsx`, `MtgAssistantApp.player-counters.test.tsx`, `StationsRail`, `Zone*`, `EnrichmentStep*` tests updated for DOM order, behaviour assertions kept
- New test: the ruling's Edit chip renders and returns to the review with state kept, history saved first

## Acceptance criteria

Threshold for this slice: differing fraction at most 0.04 per pair (initial; measure first, lower it only with evidence, never raise it to or above 0.05). States to pair: game, zones, cards, placing, context, review, ruling.

- [ ] **C1** Side-by-side pairs exist at 390x844 and 1440x900 for every state (game, zones, cards, placing, context, review, ruling) in docs/design/ui-reimagining/build-screenshots/translation/in-depth/, named `<state>-build-<viewport>.png` and `<state>-mockup-<viewport>.png` (plus `<state>-mask-<viewport>.json` where a mask is used), same profile and state on both sides, reduced motion emulated
- [ ] **C2** `node scripts/compare-screenshot-pair.mjs --build ... --mockup ...` is run on every pair and each row (pair, mask file or none, tolerance, differing fraction, threshold) is in docs/design/ui-reimagining/build-screenshots/translation/in-depth/DIFF-RESULTS.md; every differingFraction is at or below the slice threshold 0.04 (itself below 0.05); every mask region is named with a reason
- [ ] **C3** `npm run quality:check` is green
- [ ] **C4** `npm --workspace apps/frontend run test` is green
- [ ] **C5** `npm --workspace apps/backend run test` is green
- [ ] **C6** REQ-216 audit (a1): the brief's verbatim command over this slice's rebuilt components (the `FILES` list below) prints 0; command and count recorded in DIFF-RESULTS.md
- [ ] **C7** REQ-216 audit (a2): the brief's verbatim command over every line added under `apps/frontend/src` since `BASE` prints 0; command and count recorded in DIFF-RESULTS.md
- [ ] **C8** Profile-switch pair: the cards state in two different Theme colours at 390x844 is saved as `cards-profile-<name>-build-390x844.png` (two names) in docs/design/ui-reimagining/build-screenshots/translation/in-depth/, with every element recoloured and none left behind (observed)
- [ ] **C9** Life Tracker table before/after pair (REQ-202) is saved at both widths under `translation/life-tracker-table/`; the owner reviews it and no pixel count blocks the slice
- [ ] **C10** Cleanup evidence: the Playwright browser is closed (`browser_close`), the build server and the mockup server this slice started are stopped, their ports (never 5273, 3100 or 5300) are released (`lsof -i :<port>` empty), and the capture path docs/design/ui-reimagining/build-screenshots/translation/in-depth/ (absolute paths) is recorded in DIFF-RESULTS.md
- [ ] **C11** The ruling shows a pencil Edit chip that returns to the review with every input kept, and the conversation is saved to Question History first (test plus observation)
- [ ] **C12** Each of the seven states (Game, Zones, Cards with 6 cards in 3 zones, Placing with carried cards, Context with a target, Review with filter pills, Ruling) renders in mockup DOM order and every zone stays one tap away (REQ-018)
- [ ] **C13** `EnrichmentStep.tsx` no longer carries `#e2e8f0` (grep count 0)
- [ ] **C14** REQ-058 identity rings still render on every enrichment row (existing tests pass; observed in the Review pair)
- [ ] **C15** `PRD/sections/` carries the REQ-209 edit, applied once

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
node scripts/compare-screenshot-pair.mjs --build docs/design/ui-reimagining/build-screenshots/translation/in-depth/<state>-build-390x844.png --mockup docs/design/ui-reimagining/build-screenshots/translation/in-depth/<state>-mockup-390x844.png [--mask docs/design/ui-reimagining/build-screenshots/translation/in-depth/<state>-mask-390x844.json] [--tolerance N]
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
