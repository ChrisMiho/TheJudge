# Slice B — Ask a Question

## Status: done

## Goal

Rebuild Ask a Question in `quick-question.html`'s DOM order on the frame's layers: centred front card on a glowing stage with peeking neighbours, the two-row composer, glass plates; and retire the General rules topics panel with the locked topic pill.

Visual source: `docs/design/ui-reimagining/direction-1/quick-question.html` (stylesheets `tokens.css`, `shell.css`, `flow.css`, `ambience.css`, script `ambience.js` in the same folder). Do not redesign anything.

## Requirements

Cross-cutting: REQ-216 (one visual system) binds this slice. Gate blocks applied here: FLOW-011, REQ-124, REQ-079, REQ-070, REQ-206, REQ-167. Behaviour rules that win over the mockup: REQ-206 no duplicate neighbour at two cards, the carry, the Draft; REQ-167 cap of 10; REQ-011/REQ-134 300-character ring; REQ-212 dictation.

1. Rebuild `QuickLookupApp`, `CardStage`, `ComposerPill`, `ConversationThread` (and the follow-up row) in the element order and class names of `quick-question.html`.
2. FLOW-011: the two-row composer (text on top; In-depth chip bottom-left, mic|send pill bottom-right). REQ-206: position dots replace the `n / 10` count pill; no duplicate neighbour at two cards, the carry and the Draft keep working. REQ-167: Ask a Question's Add-card search opens before three characters (threshold read from the mockup's search; every other search keeps three). REQ-124: column takes the mockup page's width inside the 48rem cap.
3. REQ-079 retire: remove the General rules topics panel from `QuickLookupApp` (CORE_TOPICS fetch, `coreTopics`, `openTopicId` and their state) and the locked topic pill (`lockedTopic`, the draft `lockedTopic` field and its pill), with no new entry point. The no-pill composition (typed text, or the silent `Tell me about {card}.` fallback) is unchanged. The frontend topic data file and its data build stay as they are. Drop the topics wording from `PageShell.tsx` comment and `useAutoGrowTextarea.ts` comment.
4. REQ-070: helper text on the redesigned screens follows the mockup's wording and placement (code change on Ask a Question here; In-depth in slice C).
5. Apply the FLOW-011, REQ-124, REQ-079, REQ-070, REQ-206 and REQ-167 gate blocks to `PRD/sections/` by intent, once each. The REQ-079 retire's whole amendment set (the 69 disposition rows in `GATE-QUESTIONS.md`: `functional-requirements.md`, `user-flows.md`, `system-map.md`, `quick-lookup` spec, quick-lookup/README, `screen-layout.md` zero hits) is applied in this slice, together with the code that removes the panel and the pill.

Constraints (whole package): ports 5273, 3100 and 5300 are the owner's — never start, stop or reuse them; serve the build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and a copy of the mockup folder on other ports; Playwright MCP needs absolute paths; never stash; presentation only except where an accepted block says otherwise (no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline); no new dependency, no light theme, no animation library. Deliverables land under `docs/design/ui-reimagining/build-screenshots/translation/ask-question/` and `scripts/`, never under `PRD/work/`.

## Files touched

Rebuilt components (the audit's `FILES`, in mockup DOM order):

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/CardStage.tsx`
- `apps/frontend/src/components/ComposerPill.tsx`
- `apps/frontend/src/components/ComposerSubmitButton.tsx`
- `apps/frontend/src/components/DictationMicButton.tsx`
- `apps/frontend/src/components/ConversationThread.tsx`
- `apps/frontend/src/components/ConversationWorkspace.tsx`
- `apps/frontend/src/components/FollowUpComposer.tsx`
- `apps/frontend/src/components/AskAiWaitingPanel.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/components/StepEyebrow.tsx`

Also touched:

- apps/frontend/src/lib/search.ts, apps/frontend/src/hooks/useAutocompleteKeyboard.ts (Ask a Question search threshold only)
- apps/frontend/src/hooks/useAutoGrowTextarea.ts, apps/frontend/src/lib/conversationHistory/persistence.ts (drop lockedTopic)
- apps/frontend/src/index.css (added lines only, audited)
- PRD/sections/ (the six blocks above, including the REQ-079 amendment set)
- `docs/design/ui-reimagining/build-screenshots/translation/ask-question/` (pairs, masks, `DIFF-RESULTS.md`)

## Tests

- `QuickLookupApp.test.tsx`: no topics panel and no pill in any state; typed text and card-only send still work; draft without `lockedTopic` restores
- `CardStage.test.tsx`, `ComposerPill.test.tsx`, `ConversationThread.test.tsx`: new DOM order, behaviour assertions kept (cap 10, 300-char ring, dictation, dots, no duplicate neighbour)
- Search threshold test: Ask a Question opens early, other searches keep three

## Acceptance criteria

Threshold for this slice: differing fraction at most 0.02 per pair (measured maximum 0.0174 at tolerance 12; lowered from the planner's 0.04 on that evidence, never raised to or above 0.05). States to pair: default-with-cards, add-card-search, answered-follow-up.

- [x] **B1** Side-by-side pairs exist at 390x844 and 1440x900 for every state (default-with-cards, add-card-search, answered-follow-up) in docs/design/ui-reimagining/build-screenshots/translation/ask-question/, named `<state>-build-<viewport>.png` and `<state>-mockup-<viewport>.png` (plus `<state>-mask-<viewport>.json` where a mask is used), same profile and state on both sides, reduced motion emulated
- [x] **B2** `node scripts/compare-screenshot-pair.mjs --build ... --mockup ...` is run on every pair and each row (pair, mask file or none, tolerance, differing fraction, threshold) is in docs/design/ui-reimagining/build-screenshots/translation/ask-question/DIFF-RESULTS.md; every differingFraction is at or below the slice threshold 0.02 (itself below 0.05); every mask region is named with a reason
- [x] **B3** `npm run quality:check` is green
- [x] **B4** `npm --workspace apps/frontend run test` is green
- [x] **B5** `npm --workspace apps/backend run test` is green
- [x] **B6** REQ-216 audit (a1): the brief's verbatim command over this slice's rebuilt components (the `FILES` list below) prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **B7** REQ-216 audit (a2): the brief's verbatim command over every line added under `apps/frontend/src` since `BASE` prints 0; command and count recorded in DIFF-RESULTS.md
- [x] **B8** Profile-switch pair: the default-with-cards state in two different Theme colours at 390x844 is saved as `default-with-cards-profile-<name>-build-390x844.png` (two names) in docs/design/ui-reimagining/build-screenshots/translation/ask-question/, with every element recoloured and none left behind (observed)
- [x] **B9** Life Tracker table before/after pair (REQ-202) is saved at both widths under `translation/life-tracker-table/`; the owner reviews it and no pixel count blocks the slice
- [x] **B10** Cleanup evidence: the Playwright browser is closed (`browser_close`), the build server and the mockup server this slice started are stopped, their ports (never 5273, 3100 or 5300) are released (`lsof -i :<port>` empty), and the capture path docs/design/ui-reimagining/build-screenshots/translation/ask-question/ (absolute paths) is recorded in DIFF-RESULTS.md
- [x] **B11** `QuickLookupApp` shows no General rules topics panel and no locked topic pill in any state; no `CORE_TOPICS_URL` fetch is made (grep of the file is empty for `coreTopics|lockedTopic|CORE_TOPICS`)
- [x] **B12** Ask a Question's composer is two rows once the question text wraps, as the mockup draws it (single row at 1440 with short text; text on top, In-depth chip bottom-left, mic|send pill bottom-right when wrapped) and the front card is centred on the stage with neighbours peeking, observed in the browser and recorded
- [x] **B13** Position dots replace the `n / 10` pill; at two cards no duplicate neighbour renders; the 10-card cap, the 300-character ring and dictation still work (observed)
- [x] **B14** The Add-card search opens before three characters on Ask a Question and still waits for three on every other search (test names recorded)
- [x] **B15** The REQ-079 retire amendment set is applied in `PRD/sections/`: the grep `grep -rn 'REQ-079' PRD/sections` and the six quoted greps in the REQ-079 block show every 'amend' row amended and every 'retire' row retired, none left on the pre-retire wording
- [x] **B16** `PRD/sections/` carries the FLOW-011, REQ-124, REQ-070, REQ-206 and REQ-167 edits, each applied once
- [x] **B17** The helper text on Ask a Question matches the mockup's wording and placement (side-by-side read, differences listed)

## Verification

```bash
npm run quality:check
npm --workspace apps/frontend run test
npm --workspace apps/backend run test
node scripts/compare-screenshot-pair.mjs --build docs/design/ui-reimagining/build-screenshots/translation/ask-question/<state>-build-390x844.png --mockup docs/design/ui-reimagining/build-screenshots/translation/ask-question/<state>-mockup-390x844.png [--mask docs/design/ui-reimagining/build-screenshots/translation/ask-question/<state>-mask-390x844.json] [--tolerance N]
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
