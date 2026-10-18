# Findings — shared UI pieces, colour personalities, frontend patterns

- Probe: codebase-health-pass, subagent 2 of 3 (read-only)
- Date: 2026-10-17
- Scope: `apps/frontend/src` — components, hooks, `lib/theme`, styles, `App*`
- Method: code reading plus scripted sweeps (unused CSS classes, selectors defined in more than one stylesheet, exports with no production importer). `knip` and `ts-prune` are not installed, so the export sweep is a hand-rolled script. No dev server was run. Findings marked "verify live" are code-read and should be checked in a browser before anyone builds on them.

## What a player would notice

Most of the shared kit really is shared. Every pop-up except one goes through the same sheet. One card-detail popup serves every tool. One ring helper colours every card edge. And one theme switch recolours the whole suite, favicon and tab tint included.

The visible problems are where a tool page built its own copy of something:

- **Escape closes two pop-ups at once.** In Life Tracker's Game setup, tap Reset, then press Escape. The "are you sure?" sheet closes, and so does Game setup behind it. Question History's delete confirm does the same.
- **The In-Depth scanner's ✕ sits on top of the caution triangle.** The other two scanners moved their ✕ into a header row to avoid exactly that. Verify live.
- **The card search box works differently on each page.** Arrow keys pick a card in In-Depth and Quick Question but not in Trade Balancer. Only Quick Question shows card thumbnails. Escape behaves three different ways.
- **If the card list fails to download, In-Depth says nothing.** Quick Question and Trade Balancer tell the player. In-Depth only reports "No matching card found".
- **Some card pictures have no colour-identity ring, or the wrong one.** The printing picker always draws the grey colourless ring, even for a red card. Quick Question's search thumbnails and In-Depth's selected-card preview have no ring. Dragging a shelf card adds a theme-coloured edge around it.

## Findings

### U-01 — Escape closes every open sheet, not just the top one
- Severity: **High** (a real bug a player can hit)
- Evidence:
  - `components/SheetShell.tsx:124-134` — each open sheet adds its own `document` keydown listener and calls `onClose` on Escape. Nothing checks which sheet is on top, and nothing stops the key reaching the next listener.
  - `hooks/useOutsideDismiss.ts:11,47` — outside-click already solves this with a module-level `dismissStack`, so only the top surface closes. Escape has no equivalent.
  - Real stacked cases today:
    - Life Tracker: `GameSetupPanel.tsx:318-340` renders two `ConfirmSheet`s while the Game setup `SheetShell` (`PlayerLifeTrackerApp.tsx:31`) is still open.
    - Question History: `ConversationHistoryDrawer.tsx:403` opens the delete `ConfirmSheet` while the drawer's own `SheetShell` (`:226`) stays open.
  - The Menu tray adds a third `document` Escape listener of its own (`components/portal/FeaturePortalMenu.tsx:193-208`).
  - Tests cover Escape on one sheet at a time (`SheetShell.test.tsx:96`, `ConversationHistoryDrawer.test.tsx:293`). Only outside-click has a nested-surface test (`useOutsideDismiss.test.ts:111`).
  - Reproduction was attempted with a scratch test but could not load from outside the repo. This finding rests on code reading, and the code path is unambiguous.
- Fix: give Escape the same "top-most surface only" rule that outside-click has. Either move Escape into `useOutsideDismiss`'s stack, or add a sibling `useEscapeDismiss` that shares the stack. Then adopt it in `SheetShell`, the Menu tray, and the View Context dialog. Add a nested-sheet Escape test.
- ROUTE: `graph` — it changes what Escape does (a bug fix with an obvious right answer; one shared hook, about three adopters).

### U-02 — The scanner panel is rebuilt by each host, and In-Depth's ✕ covers the caution triangle
- Severity: **High** (visible inconsistency; overlap needs a live check)
- Evidence:
  - In-Depth: `components/ZoneCardPicker.tsx:279-288`. The Exit ✕ is `icon-round absolute right-3 top-3 z-10`, inside the same `relative` box as `ScanReviewBubble` (`:289`). That box draws `.vf-top-right` at `right: 0.75rem; top: 0.6rem; z-index: 3` (`index.css:4189-4197`; `ScanReviewBubble.tsx:46`). So the ✕ (40 px) lands on the caution triangle (44 px). The test pins this placement (`ZoneCardPicker.test.tsx:176-184`).
  - Trade Balancer: `components/trade/TradeSide.tsx:245-259`. The ✕ sits in a `.scan-head` row above the camera. Its comment says it is there so that it "never sits on top of … the always-shown experimental-scan caution triangle".
  - Quick Question: `components/portal/quick-lookup/QuickLookupApp.tsx:549-554`. The ✕ is a different control, `.scan-exit`: a 44 px rounded square (`index.css:3949`), not the 40 px circle `.icon-round` (`styles/shell.css:262`).
  - Other drift between the three copies:
    - Loading text: `ZoneCardPicker.tsx:266` uses Tailwind `px-3 py-2 text-sm`; `TradeSide.tsx:262` uses `.tb-note`; `QuickLookupApp.tsx:557` uses `.aq-note`.
    - Error: `ZoneCardPicker.tsx:300-303` and `TradeSide.tsx:287` use `role="alert"`; `QuickLookupApp.tsx:581` does not.
    - The held-entries mapping into `ScanReviewBubble` is copied word for word three times (`ZoneCardPicker.tsx:289-296`, `TradeSide.tsx:275-283`, `QuickLookupApp.tsx:570-578`).
  - The scan engine underneath is shared: `ScanCameraSurface`, `ScanReviewBubble`, and `useScanCapture` (Trade wraps it in `useTradeScan.ts:90`). Only the host panel is copied.
- Fix: one `ScanPanel` component that owns the head row (title + ✕), loading, error and the bubble mapping. Each host passes only its title, destination label and handlers. Pick one exit control (`.icon-round` in the head row, like Trade) and one error style.
- ROUTE: `graph` — it moves a visible control on one tool and touches three hosts. Check In-Depth's corner live first.

### U-03 — Three card search boxes, three behaviours
- Severity: **High** (visible inconsistency)
- Evidence:
  - The same `.search-pop` / `.search-row` / `⌕` / `.search-results` markup is written three times:
    - In-Depth: `ZoneCardPicker.tsx:193-228`
    - Quick Question: `QuickLookupApp.tsx:641-690`
    - Trade Balancer: `TradeSide.tsx:294-345`
  - Keyboard:
    - In-Depth and Quick Question use the shared `useAutocompleteKeyboard` (arrow keys + Enter). Trade does not; its input only handles Escape (`TradeSide.tsx:305-308`).
    - Escape works three ways. In-Depth: the first press closes the list, the second closes the search (`ZoneCollectionStep.tsx:418-427`). Quick Question: one press closes everything (`QuickLookupApp.tsx:652-657`). Trade: one press closes the search, and it has no list keyboard at all. All three comments claim "parity with Ask a Question".
  - Results:
    - Only Quick Question shows card thumbnails (`QuickLookupApp.tsx:81-87, 684`). In-Depth and Trade show names only.
    - Only Quick Question sets `autoComplete="off"` (`QuickLookupApp.tsx:662`). On the other two, the browser's own autofill list can sit over the suggestions.
    - Loading text differs: "Loading cards..." in `ZoneCardPicker.tsx:210` and `QuickLookupApp.tsx:669`, but "Loading card list…" in `TradeBalancer.tsx:519` and the Trade placeholder.
  - Ranking engines differ too: `lib/search.ts` for two pages, `components/trade/oracleSearch.ts` for Trade. A comment at `lib/search.ts:109` says one "mirrors" the other. The data probe covers the engine side.
- Fix: one `CardSearchPop` component (input, list, keyboard, thumbnail row, loading/no-match/error notes) with a `renderResult` or `showThumbs` option. Settle one Escape rule. Trade's printing step (pending card → `PrintingPicker`) stays a slot.
- ROUTE: `graph` — the owner has to pick the one Escape rule and decide whether thumbnails show everywhere.

### U-04 — The card-list download effect is copied three times; In-Depth swallows failure
- Severity: **High** (player-visible on failure)
- Evidence:
  - The same `loadCardMetadata()` + `isMounted` effect appears in:
    - `components/portal/MtgAssistantApp.tsx:290-305`
    - `QuickLookupApp.tsx:255-275`
    - `components/trade/TradeBalancer.tsx:140-162`
  - On failure they behave differently:
    - In-Depth only calls `console.error` (`MtgAssistantApp.tsx:299`), so the player sees "No matching card found" for every search.
    - Quick Question shows "Card search is unavailable…" (`QuickLookupApp.tsx:265, 692`).
    - Trade shows its own copy plus the raw reason (`TradeBalancer.tsx:151-152, 520-522`).
- Fix: a `useCardMetadata()` hook returning `{ cards, isLoading, error }`, with one failure message every page shows. This overlaps the data-and-clients probe; merge the two findings when clustering.
- ROUTE: `graph` — In-Depth gains a visible error message.

### U-05 — Card-ring rule gaps: missing rings, a wrong ring, and a theme-coloured edge
- Severity: **High** (breaks the owner's ring rule: every card tile keeps its colour-identity ring, and the theme owns the glow behind a card, never its edge)
- Evidence:
  - Wrong ring: `components/trade/PrintingPicker.tsx:124` always passes `getCardIdentityRingStyle(undefined)`. So every printing of a red or green card shows the silver colourless ring, while the same card's trade row shows its real colour (`TradeEntryRow.tsx:75-76`). The colours are available to the caller as `meta?.colors` (`TradeEntryRow.tsx:179`, `TradeSide.tsx:323`).
  - Missing ring:
    - Quick Question's search-result thumbnail `<span className="thumb">` (`QuickLookupApp.tsx:81-87`). Its chat-card thumbnails on the same page do carry the ring (`:626-627`).
    - In-Depth's selected-card preview: `CardPresentation` (`components/CardPresentation.tsx:304-320`, used via `CardSelectionPreview.tsx:31`) renders the card image with no `card-identity-ring`.
  - Theme on the edge: `.shelf .card.dragging` uses `box-shadow: var(--idq-shadow-9)` (`index.css:1593-1597`). That shadow is defined as `0 22px 40px -14px #000, 0 0 0 2px var(--accent-soft)` (`lib/theme/glows.css:31`): a solid 2 px theme-coloured band around the dragged card's edge, outside its identity ring.
  - Healthy for contrast: every other tile goes through `getCardIdentityRingStyle` (12 files). The front-card glow (`styles/flow.css:94-99`) is a blurred glow behind the card, not an edge.
- Fix:
  - Pass the card's colours into `PrintingPicker`.
  - Add `card-identity-ring` + style to the two missing surfaces.
  - Change the drag shadow's 2 px accent spread to a blurred glow (or drop it).
- ROUTE: `graph` — visible on three surfaces. It is small, so it can share one kickoff.

### U-06 — View Context is a forked overlay, not a `SheetShell`
- Severity: **Medium** (duplicated logic already drifted; visibly different look)
- Evidence:
  - `components/AdaptiveContextDialog.tsx:18-25` copies `SheetShell`'s `FOCUSABLE_SELECTOR`. `:61-93` re-implements the focus trap and Escape.
  - Behaviour drift from `SheetShell`:
    - Escape only works while focus is inside the dialog (React `onKeyDown` on the section). `SheetShell` listens on `document`.
    - First focus goes to the ✕ (`:42-46`). `SheetShell` focuses `[data-autofocus]` or the first control (`SheetShell.tsx:113-116`).
  - Look: its own `.adaptive-context-overlay/-surface` CSS, defined twice in `index.css` (`:830-856` and again at `:2618-2628`). It is an opaque bottom sheet on phones and a right-hand drawer on wide screens. Every other pop-up is the glass centred card.
  - REQ-216 says a screen gets a sheet "only through the shared components (`SheetShell`, …); a variant extends the shared one with a modifier and never forks a local copy". This is the one remaining fork. Its 75dvh cap is REQ-135, so the look may be deliberate.
- Fix: host View Context on `SheetShell` with a `panelClassName` variant (for example `context-panel`) if the side-drawer look must stay. This also brings it under the U-01 Escape fix.
- ROUTE: `graph` — the owner decides whether View Context keeps its side-drawer look.

### U-07 — `index.css` re-declares rules owned by the ported layers, and the copies have drifted
- Severity: **Medium**
- Evidence: a selector sweep found about 15 selectors defined both in a ported layer and in `index.css`. Examples:
  - `.card-identity-ring` and `::before`: `index.css:2630-2650` vs `styles/flow.css:338-346`
  - `.flow-head`: `index.css:3945` vs `flow.css:26`
  - `.ring`, `.send-pair`, `.send-pair button`, `.send-wrap`, `.msg.you`, `.q-box .deep`: `index.css:338-372` vs `flow.css`
  - `.menu-tray`, `.fb-pill`, `.drawer-panel .overlay-close`: `index.css:61-97` vs `shell.css`
  - `.page-content`, `.shelf`, `.ctx-art .hero`

  `index.css` loads last (`main.tsx:4-10`), so its copy silently wins. One concrete drift: `flow.css:341` draws the ring at `padding: var(--ring-w, 1px)`, and `flow.css:87` sets `--ring-w: 2px` for the front carousel card. But `index.css:2639` re-declares `padding: 1px`. So the front card's 2 px ring renders at 1 px, and `--ring-w` (also set at `glows.css:72`) does nothing. REQ-216: "a screen's own selector may use what those layers set but may not redefine it".
- Fix: per selector, keep one definition in the owning layer and delete or merge the `index.css` copy. Decide the ring width on purpose: restore 2 px or delete `--ring-w`.
- ROUTE: `graph` for the ring width (visible). The identical-value duplicates can then go as `codehealth` cleanup.

### U-08 — The "＋ Add card / ▣ Scan" chip row is copied on three pages
- Severity: **Medium** (near-copies, already slightly drifted)
- Evidence:
  - In-Depth: `ZoneCollectionStep.tsx:320-348` (adds `motion-focus` and `aria-controls`)
  - Quick Question: `QuickLookupApp.tsx:588-616` (has `aria-controls`, no `motion-focus`; Scan disables at the card cap)
  - Trade: `TradeSide.tsx:202-230` (no `aria-controls`, no `motion-focus`; both disabled while input is disabled)
  - Each carries the same "✕ Close search" flip and a comment saying it "mirrors" another.
- Fix: one `AttachChips` component (`isSearchOpen`, labels, `controlsId`, disabled flags, `onToggleSearch`, `onScan`), keeping each page's current props, so nothing changes on screen.
- ROUTE: `codehealth` — the extraction keeps each page's current behaviour. Aligning the `motion-focus`/`aria-controls` drift is a separate, visible choice.

### U-09 — Oversized components mix flow state, persistence and markup
- Severity: **Medium**
- Evidence (non-test line counts):
  - `components/portal/MtgAssistantApp.tsx` — 1,165 lines, 23 `useState`. One file holds the whole In-Depth flow: steps, roster, counters, drafts and the game-context markup.
  - `components/EnrichmentStep.tsx` — 946 lines. Two whole screens in one component (two `PageShell` returns, `:653` and `:739`).
  - `QuickLookupApp.tsx` — 733 lines. Two screens, the scan panel, the search pop and local thumbnail helpers (`:65-87`).
  - `ZoneCollectionStep.tsx` 582, `TradeBalancer.tsx` 579, `ScanCameraSurface.tsx` 549, `CounterPanel.tsx` 487, `ZoneCardPicker.tsx` 445, `ConversationHistoryDrawer.tsx` 416.
  - `AmbientScene.tsx` (704) is a ported canvas renderer and fine as one file.
- Fix: U-02, U-03, U-04 and U-08 already remove much of the bulk from the three tool pages. After that, split `MtgAssistantApp` (a flow-state hook plus step views) and `EnrichmentStep` (one component per screen).
- ROUTE: `graph` — a multi-file refactor that needs a decision on how to split.

### U-10 — Viewport and motion checks are hand-rolled per component
- Severity: **Low**
- Evidence:
  - Wide-sheet check: `ConversationHistoryDrawer.tsx:30-33,147-160` (`innerWidth` + `resize`, `SHEET_WIDE_BREAKPOINT_PX = 600`)
  - Hint tiers: `ComposerPill.tsx:21-31,151-170` (`matchMedia` 600/401 + its own listeners)
  - Phone check: `AmbientScene.tsx:21,113` (`innerWidth < 768`, read once)
  - The 600 px value also lives in CSS as `--sheet-breakpoint` (`index.css:2672`).
  - Reduced motion: `AmbientScene.tsx:25,47-49` re-implements `lib/motionPreference.ts:1-3`.
  - Doc drift: `SheetShell.tsx:60-61` says the sheet floats "from 600px". Its own test title says "from 768px" (`SheetShell.test.tsx:153`).
- Fix: one `useMediaQuery(query)` hook plus shared breakpoint constants (600 / 768). Reuse `prefersReducedMotion` in AmbientScene. Correct whichever doc line is wrong.
- ROUTE: `codehealth`.

### U-11 — Personality plumbing carries unused fields and parallel signals
- Severity: **Low**
- Evidence:
  - Unused fields: `Palette` has `ground`, `groundWash`, `panel`, `panelEdge` and `focusRing` (`lib/theme/palettes.ts:20-24`, filled at `:52-117`). No production code reads them; only `palettes.tokens.test.ts` reads `ground`/`focusRing`. The live surface values are in `styles/tokens.css:123-138`.
  - The same channel-triple → hex helper is written twice: `applyPalette.ts:6-12` (`triplet`) and `themeBand.ts:4-9` (`channelsToHex`), plus a test copy.
  - `applyPalette.ts:51-53` sets `data-theme`, `data-theme-motif` and `data-profile`, and `data-theme` equals `data-profile`. Only tests read `data-theme`.
  - `BrandMark.tsx:19` calls `useActiveThemeMotif()` only to re-render, but the orb is painted by CSS `var(--motif)`, so the call does nothing useful.
  - `AmbientScene` ignores its `motif` prop for drawing. It restarts from `data-profile` via its own observer (`AmbientScene.tsx:550-553, 622-623`); the prop only fills `data-motif`. `FeaturePortalMenu.tsx:187` derives the tray's motif a second way.
- Fix:
  - Drop the unused `Palette` fields (or keep them only if the parity test needs them).
  - Export one `channelsToHex` from `palettes.ts`.
  - Drop `data-theme` after updating the tests that read it.
  - Remove BrandMark's no-op subscription.
- ROUTE: `codehealth`.

### U-12 — Dead component, exports and CSS
- Severity: **Low**
- Evidence:
  - `components/StepEyebrow.tsx` has no production importer, only its test. Its CSS is `.step-eyebrow` (`index.css:562`). `ChatCardThumb` (`QuickLookupApp.tsx:77-79`) is a pass-through wrapper. `LOW_CONFIDENCE_ESCALATION_COUNT` (`hooks/useScanCapture.ts:28`) is used only by a test.
  - About 28 CSS classes are never used by any TS/TSX file. Each was confirmed with `git grep` (zero production hits). Most are leftovers from the mockup port:
    - `shell.css`: `demo-bar`, `demo-toggle`, `before-after` (`:952-1042`), `overlay-backdrop`, `overlay-panel` (`:765-797`), `foot-note`
    - `flow.css`: `thinking`, `wait-line(s)`, `wait-time`, `wait-foot` (`:324-365`), `summon` (`:72, 374`), `flow-hint`
    - `index.css`: `msg-judge*` (`:843-870`), `tile-tools` (`:4944-4961`), `roster-more`, `drop-before`/`-after` (`:1475-1488`), `panel-inner`, `scroll-cap-4-enrichment`, `header-side`, `life-note`, `place-more`
    - `tokens.css`: `surface-wash`, `btn-accent`, `accent-text`, `tap-target` (`:81-117`)
  - Excluded because the class name is built at runtime: `wait-stage-*`, `ghost`, `motion-exit`, `pulse`, `err`.
- Fix: delete them in one sweep. First check the mockup-parity tests (some `*.test.ts` read stylesheets by text), and keep anything a test asserts.
- ROUTE: `codehealth`.

### U-13 — A few literal colours bypass existing tokens
- Severity: **Low**
- Evidence:
  - `components/portal/DestinationOutlet.tsx:17` uses `text-zinc-400`, which equals `--text-muted` (#a1a1aa). REQ-200/216 bar fixed Tailwind palette colours outside the named exemptions, and this file is not one of them.
  - `index.css:395-396` uses `#ff8fa3`, which is the `--status-error` token (`glows.css:24`), and `#ffd1da`.
  - `index.css:2720` uses `#e2e8f0`, which is `--text-primary`.
- Fix: swap each for its token. Same values, so pixels don't change. `#ffd1da` needs a token or a `color-mix` from `--status-error`.
- ROUTE: `codehealth`.

## Healthy — already shared (don't "fix")

- **Sheets:** `SheetShell` hosts ten pop-ups: card detail, Question History, printing picker, feedback, confirm, the zone card menu, More details, Life Tracker setup and counters, and Trade's New-trade confirm. `ConfirmSheet` is the one "are you sure?".
- **Close and dismiss:** `OverlayCloseButton` is the only ✕ for overlays. `useOutsideDismiss` already handles stacked surfaces correctly.
- **Card detail:** `CardDetailPopup` is the one card-detail popup, used by seven hosts.
- **Ring colours:** `lib/cardIdentityRing.ts` is the only source of ring colours. Every ring goes through `getCardIdentityRingStyle`, apart from the gaps in U-05.
- **Shared Ask flow:** `ComposerPill`, `FollowUpComposer`, `ConversationWorkspace`, `ConversationThread` and `AskAiWaitingPanel` are shared by In-Depth and Quick Question.
- **Scan engine:** `ScanCameraSurface`, `ScanReviewBubble` and `useScanCapture` are shared by all three scanners (Trade wraps the hook).
- **Search hooks:** `useAutocompleteSuggestions` (with its debounce) and `useAutocompleteKeyboard` are shared by the two searches that use them.
- **Page chrome:** `PageShell` + `StagedStepHeader` serve every tool page. The exception is Life Tracker, which builds its own header on purpose: no brand-tap count (`App.brand-tap-egg.test.tsx:94-107`, REQ-203).
- **Theme switching:** `styles/tokens.css` switches all six profiles in one place. `palettes.ts` mirrors the accent values, and `palettes.tokens.test.ts` checks the two stay equal (REQ-216 asks for exactly that).
- **Tab chrome:** the favicon and `theme-color` come from the active palette in one function (`applyPalette.ts:19-38`). The favicon art reuses `MOTIF_SYMBOLS`, the same glyphs as the Theme band.
- **Named colour exemptions (REQ-216), not violations:**
  - `AmbientScene.tsx` canvas colours (copied from the mockup and keyed by profile; they repeat palette values by design)
  - `TradePile.tsx` gold and gem
  - `ScanDebugOverlay` and `ScanCardOutline` debug colours
  - Life Tracker's Tailwind `rose`/`amber`/`zinc` classes (`PlayerLifeCard.tsx`, `PlayerLifeTrackerApp.tsx`; pixel-frozen by REQ-202)
- **Saved preferences:** each domain keeps its own small prefs module in `lib/` (theme, scan audio, history, life tracker, active destination). The try/catch wrappers repeat, but the duplication is tiny and isolated; it isn't worth a shared helper.
