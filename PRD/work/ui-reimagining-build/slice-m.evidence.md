# Slice M — manual evidence

2026-10-02 M10/M13 — mockup served from `docs/design/ui-reimagining/direction-1/`
on port 4631 (`python3 -m http.server 4631 --directory docs/design/ui-reimagining/direction-1`);
build served in mock mode on ports 3131/5321
(`VITE_ASK_AI_PROVIDER=mock PORT=3131 FRONTEND_PORT=5321 node scripts/dev.mjs`,
backend log confirmed `askAiProvider: "mock"`). Both driven with Playwright to
Blue (`?profile=blue` on the mockup; the build's own default), captured at
390×844 and 1440×900, 12 files under
`docs/design/ui-reimagining/build-screenshots/m/`:

- `ask-question-{build,mockup}-{390x844,1440x900}.png` — empty question, five
  cards attached (Lightning Bolt, Sol Ring, Llanowar Elves, Swords to
  Plowshares, Counterspell attached in that order; Lightning Bolt in front).
- `ask-question-search-{build,mockup}-{390x844,1440x900}.png` — Add card
  search open (mockup: nothing typed, its own ready list; build: "Lig" typed,
  the 3-character minimum kept per the owner question below).
- `ask-question-answered-{build,mockup}-{390x844,1440x900}.png` — answered
  (mockup: its own demo answer, `quickly` wait; build: the same question sent
  and answered by the mock provider, mock-mode echo per LOOK-GAPS's own note —
  not a ruling).

Compared side by side against every `### Differences` bullet under
`LOOK-GAPS.md`'s `## Ask a Question`:

- Layout and spacing (three things, not four): closed. `QuickLookupApp.tsx`
  collapses to the stage, the composer (search opens from its own "＋ Add
  card" chip, closed by default), and the ruling view — the permanent "Search
  to add another card" panel is gone, and the "General rules topics"
  disclosure keeps its own placement after the composer unchanged (A6).
  Stage size at both widths tracks the mockup's measured box closely (196px
  front card phone / 280px desktop, `flow.css:52-99`'s step/padding carried
  over verbatim).
- Type (page title): closed. The gradient uppercase eyebrow is replaced by a
  plain `<h1>Ask a Question</h1>` styled to `flow.css:26-33` (`.flow-head
  h1`): 1.15rem/700 phone, 1.35rem desktop, `#e2e8f0`. The chat-head's h1
  carries the same styling.
- Colour and surfaces (stage, composer): closed. `.aq-stage` uses the
  suite's `--panel`/`--panel-edge` tokens (this codebase's established
  surface-panel/surface-edge mapping, carried over unchanged from slice L's
  own card-detail work) with `flow.css:52-61`'s radius/shadow; `.q-box` uses
  `flow.css:190-196`'s radius (1.6rem)/border/shadow.
- Components present/absent (front card + ring, arrows, search, send pill):
  closed. Front card and neighbours (196px/280px wide, `--step` 100px/160px,
  the neighbour transform/opacity/blur formula from `flow.css:82-91`,
  front-card glow `0 0 28px -10px` accent 45%) all port directly in
  `CardStage.tsx`. Arrows are 40px round buttons (`.aq-arrow`,
  `flow.css:135-146`). ＋ Add card / ▣ Scan are `.icon-chip`
  (`flow.css:35-46`) in the flow-head, as the mockup's own `.attach` row has
  them (not literally inside `.composer` — the slice doc's "composer's head
  row" phrasing described the row *above* the composer, which the build
  already had in this position before this slice; only its styling changed).
  Search (opened from ＋ Add card) is `flow.css:169-182`'s `.search-pop`,
  `.search-row`, `.search-results`, rendered independent of the submit state
  (same `.composer` wrapper as the question box) so searching for another
  card stays available while an answer is loading, exactly as the always-
  visible panel it replaces did. Position indicator is the dots pill
  (`flow.css:148-155` `.dots`) — see the owner question below on what it
  counts. Send is the split mic/send pill (`flow.css:224-260`
  `.send-pair`/`.send-wrap`/`.send-ring`), the 300-character budget drawn as
  a capsule ring traced round the pill's own edge in place of the circle
  round the old round send button. **Resolved conflict** (DESIGN-BRIEF.md:
  "the requirement wins on behaviour"): the mockup's pill halves are 40px
  each; REQ-205's 44px touch floor wins, so each half is 44px and the pill is
  88px wide rather than the mockup's literal 80px — the ring geometry in
  `ComposerPill.tsx` is scaled accordingly (documented in the component's own
  comment). This is the same kind of resolved conflict slice L's evidence
  recorded for `OverlayCloseButton` (silhouette ported, accent colour kept).
- Answered view (CARDS strip, bubbles, Edit cards/↺): closed.
  `ConversationThread.tsx`'s judge message renders `.msg-judge`/
  `.msg-judge-bubble`/`.msg-judge-seal` (`flow.css:360-368`) — the seal reuses
  `MotifGlyph` (the Theme band's own per-profile glyph), the same "no new
  asset" approach `BrandMark`'s orb already uses, since no motif image asset
  exists in this codebase (ported, not invented). The user message is
  `.msg-you` (`flow.css:357-359`). `QuickLookupApp.tsx`'s answered branch adds
  the CARDS thumbnail strip (`flow.css:348-351` `.chat-cards`), each
  thumbnail opening the same corner `CardDetailPopup` the stage and search
  results use (`View <name>` button). The "VIEW CONTEXT · N cards" panel is
  retired here (requirement 11) — it belongs to In-depth details only (slice
  N). "✎ Edit cards" is the chat-head's own `.icon-chip`; the round ↺
  (`.chat-icon-round`) replaces the old separate "Start Over" text button
  under the follow-up box — `ConversationWorkspace`'s own bottom Start Over
  button is suppressed for this screen only (`showStartOver={false}`),
  leaving the round ↺ as the one Start Over control.
- Motifs and motion (card summon animation, stage glow): the front-card glow
  is built (`flow.css:94-99`). The summon animation (`.card.summon`,
  `flow.css:100-104`) is not built — out of scope for a look-only pass with
  no new per-card mount/unmount choreography named in the slice's
  requirements; not a `### Differences` bullet LOOK-GAPS raised either.

### Owner questions — carried verbatim, not resolved

Both of LOOK-GAPS's `## Ask a Question` conflicts are followed per the slice
doc's stated interim reading, and remain open:

- "The count shown on the stage." Interim: the dots pill shows the REQ-167
  attached/cap count (`n / cap`, e.g. "5 / 10"), with the mockup's dots
  *styling* only — not a position-within-stage reading.
- "Searching before typing." Interim: the 3-character minimum stays; typing
  "Lig" opens `.search-pop`'s result rows styled per the mockup.

### Deviations from the slice doc's "Files touched" list

- `PageShell.tsx` — added a `"narrow"` variant (`.page-content-narrow`,
  `max-width: min(36rem, 92vw)`) so Ask a Question's column matches
  `quick-question.html:17`'s override instead of the suite's default 48rem
  cap. Reused as-is by slice N (`in-depth-question.html:14` names the same
  36rem cap).
- `DictationMicButton.tsx` — added a `variant="flat"` so the mic half of the
  split send pill has no border/background of its own (the pill supplies
  it), leaving the existing `EnrichmentStep` usage on `variant="standalone"`
  (default) untouched.
- `index.css` — the bulk of this slice's look is new CSS classes
  (`.flow-head`, `.icon-chip`, `.aq-stage`/`.aq-ring`/`.aq-card`/
  `.aq-card-widget`/`.aq-arrow`/`.aq-dots`, `.search-pop`/`.search-row`/
  `.search-results`, `.composer`/`.q-box`/`.send-pair`/`.send-wrap`/
  `.send-ring`, `.chat-head`/`.chat-icon-round`/`.chat-cards`, `.msg-you`/
  `.msg-judge*`) — not called out as its own "file touched" in the slice doc
  but necessarily part of every component restyle above.
- `CardSelectionPreview.tsx` — **not** touched, despite the slice doc listing
  it. It is no longer called anywhere on Ask a Question after this slice (the
  "VIEW CONTEXT" dialog that used it is retired, requirement 11); its
  full-card-art shape does not fit the mockup's compact 28×39 search-result
  thumbnail, so the search rows use a new small `CardThumbImage`/
  `SearchResultThumb` helper in `QuickLookupApp.tsx` instead. No other screen
  depends on this file changing.
- `FollowUpComposer.tsx` — **not** touched. Requirement 10's closing clause
  ("the follow-up box reuses the same split send pill") is deferred: no M8
  capture state exercises the follow-up composer (the three states are
  empty-question, search-open, and freshly-answered), and the component is
  shared with In-depth's own review-step composer (slice N). Carried forward
  as a known gap, not an owner question — a future slice can apply the same
  `.send-pair` treatment here with no requirement conflict to resolve.
- `apps/frontend/src/App.*.test.tsx` and
  `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx` — updated
  (not listed in the slice doc, which only named `QuickLookupApp.test.tsx`
  and the four component test files) because requirement 1's "search opens
  from ＋ Add card" is a real behaviour-of-the-control change: several
  integration tests used the previously-permanent "Card search" textbox as
  their proxy for "Ask a Question is the active destination," and one
  (`App.ui-flare-chat-motion.test.tsx`) exercised the retired "VIEW CONTEXT"
  trigger and Quick Question's old text "Start Over" button. Each was updated
  to open search first (or to the new accessible names) rather than loosened.

2026-10-02 M10 — browser scenario at 390×844 and 1440×900: attached five
cards via search one at a time, confirmed the front card (Lightning Bolt
throughout — adding a card never moves focus) and dimmed/scaled neighbours
render per requirement 3, and the dots pill reads "5 / 10"; tapped ＋ Add
card, typed "Lig" (3 characters), confirmed `.search-pop` opened inside the
composer with thumbnail/name result rows; submitted the question "How do
Lightning Bolt and Counterspell interact on the stack?" and confirmed the
ruling view's CARDS strip (5 thumbnails, each opening the card-detail popup)
and bubbles (accent question bubble, sealed judge bubble labelled "TheJudge")
render per requirement 10, at both widths.

2026-10-02 M11 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). Both dev-server instances (the mockup's
`python3 -m http.server` on port 4631, and the build's `node scripts/dev.mjs`
on ports 3131/5321) were started by this session as tracked background tasks
and stopped via `TaskStop`; `lsof -i :3131 -i :5321 -i :4631` returned no
listeners after both stops. Disposable captures: none landed under
`PRD/work/ui-reimagining-build/.playwright-mcp/` — every capture in this
slice was saved straight to its reviewable
`docs/design/ui-reimagining/build-screenshots/m/` destination via an
absolute `filename`. The Playwright MCP server wrote its own console/snapshot
logs to the launch checkout's root `.playwright-mcp/` (its own cwd) during
this pass; those were identified by their `2026-10-02` timestamp and deleted
afterward, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
its one pre-existing line (`M scripts/lib/boundary-rules.mjs`).
