# Quick Lookup — current-state feature spec

- Status: current-state feature spec — precedence #1 and Read-First #1 for what
  this feature does today. Decision bodies are retired: `PRD/sections/decisions.md`
  is now precedence #2, a historical index that resolves a cited `DEC` ID to a
  one-line summary, no longer an override. The cited `REQ`/`FLOW` remain the
  granular backing; keep this file correct in step with them as behavior changes,
  editing in place — never by recording a new decision.
- Backed by: DEC-020, DEC-025, DEC-029, DEC-042, DEC-045, DEC-046, DEC-095,
  DEC-106, DEC-107, DEC-108, DEC-112, DEC-113, DEC-114, DEC-116, DEC-118,
  DEC-017, DEC-033, DEC-053, DEC-160, DEC-096, DEC-097, DEC-098, DEC-099,
  DEC-100, DEC-116, DEC-131, DEC-146, DEC-153, REQ-072, REQ-073, REQ-074,
  REQ-075, REQ-079, REQ-091, REQ-092, REQ-094, REQ-095, REQ-097, REQ-098,
  REQ-011, REQ-022, REQ-024, REQ-030, REQ-105, REQ-109, REQ-110, REQ-121,
  REQ-129, REQ-132, REQ-134, REQ-141, REQ-167, REQ-178, REQ-179, REQ-180,
  REQ-181, REQ-182, REQ-184, REQ-206, FLOW-006, FLOW-011, FLOW-023, NFR-001,
  REQ-220

## What it is

A feature-portal destination for the short ask, now the Menu's single
**Ask a Question** door (REQ-206): the player either has one or more cards in
mind or doesn't, and wants a fast Magic rules answer without staging a whole
game. They optionally attach up to 10 cards — each by typed search or camera
scan — then type a question, and get
a plain-text answer in the same conversation chrome the main MTG Assistant flow
uses. Behind that one screen runs the entire Ask AI backend: the request rides
the shared `POST /api/ask-ai` endpoint on a `mode: "lookup"` branch, the
backend assembles one prompt that always retrieves rules from the question and
layers in every attached card's rulings and metadata (REQ-167), and the same
provider boundary (mock by default, OpenAI live; canonical rule: `integrations-and-data.md`) generates the answer.
"How do these cards combo" explains a complete combo across the attached set
or names the missing piece for a partial one. Off-domain questions get an
in-character "I couldn't find that in the rules" reply rather than a chatbot
answer. It carries no zones, stack, phase, or other game-state setup, and it is
not a full rules browser or a judge authority (canonical rule: `goals-and-non-goals.md` Scope Notes).

## How it works

### Entry and pre-submit layout

- Built: Quick Lookup is the **Ask a Question** page — the Menu's single
  question destination (`quick-lookup`, route `/quick-lookup`, DEC-095) — and
  opens as a frontend-only view switch with no reload; it ships no navigation
  menu of its own. Its **Add in-depth details** pill carries the attached
  cards and the typed question into In-depth details (`/in-depth`), switching
  the active destination there. (DEC-107, REQ-073, REQ-206, FLOW-011)
- Built: the pre-submit view is laid out top to bottom as the title row (**Add
  card** and **Scan** beside it), the card stage when any card is attached,
  the two-row Question box. (REQ-073, DEC-112, REQ-206)
- Built: the card stage renders when any card is attached — the front card
  full size on a lit panel, with the one other card peeking at each side (two
  cards peek on one side only, so the same card never renders twice); ←/›
  arrows and a tap on a neighbour turn the ring; ✕ Remove and ⓘ Details
  straddle the front card's top corners; a row of position dots lights the front
  card's place in the ring.
  With no card attached there is no stage. (REQ-206)
- Built: card input is optional and bounded to at most 10 cards (REQ-167 as
  amended). The player adds each card by typed autocomplete search
  (REQ-001/REQ-002 behavior), which places it on the stage immediately, or by
  camera scan (the shared FLOW-006 engine), which holds it in the scanner's
  own holding list until the scanner closes, when every held card joins the
  stage in hold order (REQ-214); either way each add resolves to one
  oracle-level `CardMetadataItem`, with its name, image, and color ring shown
  once on the stage. Its descriptive block (oracle text and full metadata)
  loads on demand by oracle id (REQ-174, REQ-175, FLOW-024) behind a brief
  loading state before submit, and can be removed from the stage's front
  position. An add — typed or scanned — attempted past the cap, or of a card
  already attached or already held, is blocked and a stated limit message is
  shown to the player immediately, mirroring the existing bounded-add UX
  pattern (`ScanAddOutcome`, the In-Depth zone-collection strip). With zero or
  one card attached, behavior is unchanged in shape from before REQ-167.
  There are no zones, stack, phase, or per-card enrichment-editing controls.
  (DEC-107, REQ-073, REQ-167, REQ-206, REQ-214, FLOW-006, FLOW-011)
- Built: scan here resolves to exactly one card per scan and is
  presentation-only at the printing level — the scanned printing's art never
  reaches the request, prompt, or rulings; identity stays oracle-level. A
  held-but-uncommitted scanned card is not yet one of the attached cards and
  is not sent if the player submits without closing the scanner first — the
  scanner's own Exit scan box is the only commit path (REQ-214). (DEC-053,
  REQ-073, REQ-214)

### General rules topics browse (retired)

- Retired by `ui-look-translation` (2026-10-02) on the owner's gate verdict:
  Ask a Question no longer shows the "General rules topics" panel — the
  direction-1 mockup was made without it on purpose. A topic row was the
  locked topic pill's only entry point, so the pill no longer appears and
  nothing replaces it. (REQ-079 retired, REQ-091 as amended)

### Composing and submitting the question

- Built: the freeform textarea stays editable at all times. Submit is enabled
  whenever at least one card is attached or the textarea has non-empty trimmed
  text. (REQ-091, DEC-112)
- Built: on submit the wire `question` string is composed client-side — the
  trimmed textarea text when it is non-empty; or, when the textarea is empty
  but one or more cards are attached,
  the silent fallback `Tell me about {Card Name}.` for a single card or
  `Tell me about {Card A}, {Card B} and {Card C}.` for several (never shown to
  the user). (REQ-091, REQ-167, FLOW-011)
- Built: the ring, the screen-reader remaining count, the textarea `maxLength`, and the submit gate all
  measure the raw editable textarea content, not the composed string, so an
  empty field with a card attached has 300 characters remaining and a full
  300-character question stays submittable. (REQ-091 as amended by REQ-134,
  REQ-011)
- Built: the Question box has two rows — the text on top, the Add in-depth
  details chip at the bottom-left and the round mic|send pill at the
  bottom-right; the character budget is the ring round the pill, with no visible numeric count (a visually-hidden polite live region announces the remaining characters). The box
  rests at its natural top position directly under the cards in the anchored
  Ask-screen frame (REQ-218). One line of text is one row; typed content grows
  the box **downward**, until it must leave room for its own chip + mic|send
  control row and, on a phone, the on-screen keyboard — the page never scrolls —
  past which the text area scrolls inside itself — the only element that scrolls. (DEC-146, DEC-131,
  REQ-110, REQ-121, REQ-206, REQ-218)
- Built: the 300-character budget is drawn as a ring traced round the send
  pill's edge, starting at the top of the pill's split and running clockwise,
  brighter in the last 30 characters, closed at 300; at 0 characters no ring
  is drawn, and no numeric count is shown at any fill. (REQ-011, REQ-134, REQ-206)
- Built: the initial submit control is the round send pill inside the
  question box, with no visible text label (its accessible name keeps Ask
  semantics); the answered-view follow-up composer keeps its own compact
  arrow/icon-only send control. (DEC-153, REQ-132, REQ-206)

### Initial submit wait

- Built: while the initial submit is in flight and no answer has arrived, the
  Question form (label, textarea, counter, submit button) is hidden and
  the existing `AskAiWaitingPanel` (live elapsed timer, threshold messages,
  REQ-023) renders in its place. The Optional card section stays visible and
  interactive throughout. (DEC-114, REQ-092)
- Built: on error the Question form reappears alongside the retry affordance; on
  success the pre-submit view swaps to the shared conversation workspace.
  (DEC-114, REQ-092)

### Answered conversation workspace

- Built: on the first successful answer the surface renders the same shared
  chat-first `ConversationWorkspace` as In-Depth Question — message log, docked
  follow-up composer, inline processing animation, retry/error placement, New
  response affordance, and Start Over — under the same conversation limits as the
  main flow; Quick Lookup defines no separate limit policy. (REQ-075, DEC-118,
  REQ-097, REQ-098)
- Built: the thread opens with the player's question as sent (the fallback
  when the box was blank) as a right-aligned bubble, then the assistant's
  answer; the question also rides in `conversationHistory`. Follow-ups are
  text-only and send `{ mode: "lookup", question, cards: frozen (the full
  attached set, when any were attached), conversationHistory }`. (REQ-025,
  REQ-075, REQ-167, FLOW-011, FLOW-023)
- Built: when one or more cards were attached, every one of them is frozen for
  the conversation and shown behind a compact adaptive context trigger — a
  bottom sheet below 768px or a right-side drawer at 768px+; the trigger label
  names the single card or states the count (`"N cards"`) for several. A card
  name in the judge's message that exactly matches an attached card renders as
  a tappable chip opening that card's detail directly in the thread. Without a
  card, no empty context trigger or container renders. **✎ Edit cards** (beside
  the title) returns to the pre-submit page with the cards and question kept;
  **↺ Start over** clears the thread, the cards, the question and any locked
  pill and returns to the empty pre-ask state. (REQ-075, REQ-167, REQ-206,
  DEC-118)

## The full backend path (request → assembly → retrieval → provider → response)

Quick Lookup is the first spec whose subject runs the entire Ask AI backend, not
a frontend-only surface. The path below is one branch of the shared
`POST /api/ask-ai` endpoint (the main product-facing endpoint; canonical rule: NFR-004); success
`{ answer }` and error response shapes are unchanged from the game mode and from
both providers. (DEC-020, REQ-072)

### Request validation (`mode: "lookup"` branch)

- Built: `askAiRequestSchema` is a `mode`-discriminated union
  (`"game" | "lookup"`). A payload with no `mode` key defaults to `"game"` for
  back-compat; `mode: "lookup"` is a required literal. The lookup branch is
  `{ mode: "lookup", question, cards?, conversationHistory? }`, `.strict()`, so
  a `gameContext` field is rejected as an unrecognized key — `cards` and
  `gameContext` are mutually exclusive across modes. (DEC-106, REQ-072,
  REQ-167)
- Built: `cards` is an optional bounded list of at most 10 entries (REQ-167 as
  amended, amending DEC-106's single optional `card`); an 11th entry is
  rejected by validation. Each entry carries only `cardId` (oracle id), `name`, and
  `imageUrl` (rendering only, not read by the prompt assembler) and carries no
  zone, caster, owner, targets, or context-notes fields; the descriptive block
  (`oracleText`/`manaCost`/`manaValue`/`typeLine`/`colors`/`supertypes`/
  `subtypes`) is no longer sent, because the backend resolves the
  card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json.br`
  (REQ-175, REQ-176). Zero cards and exactly one card behave identically to the
  prior single-card shape. (DEC-106, DEC-053, REQ-072, REQ-167, REQ-176)
- Built: `conversationHistory` is optional and validated identically to the game
  mode (1–20 turns, first `user`, last `assistant`, strictly alternating,
  per-message cap). The `question` character bound and control-character
  guardrails are identical across modes. (REQ-072)

### Branching prompt assembly

- Built: `preparePromptInput` routes `mode: "lookup"` to a single lookup
  assembly path (`prepareLookupPromptInput` → `buildLookupPromptText`), never
  forking by how many cards are attached — the bounded card set (REQ-167) is a
  loop inside one path, not a second implementation. (DEC-107, REQ-074,
  REQ-167)
- Built: three things always run regardless of the attached card set. The
  static `MTG REFERENCE` block (DEC-025), the always-on core game-rules topics
  (DEC-045 core set), and question-scored System 3 supplemental rules
  (DEC-046 / REQ-022). (DEC-107, REQ-074)
- Built: when one or more cards are attached, per-card enrichment layers in for
  every attached card — each card's full metadata including oracle text using
  the same per-card formatting as populated-zone cards (DEC-042 / REQ-030),
  each card's WotC rulings under one `CARD (looked up)` / `OFFICIAL RULINGS`
  heading per section, and System 3 additionally scored against a compact
  signal for every attached card — its name, type line, and keywords — not its
  full oracle text, which was measured to collapse supplemental recall
  (REQ-178). With no cards attached, the rulings section and card section are
  empty and System 3 scores on the question alone. (DEC-107, REQ-074, REQ-167,
  REQ-178)
- Built: game-state-only sections are always omitted — zone sections, `PHASE
  GUIDANCE` (REQ-024), System 2 game-state topic gating (DEC-045), and the merged
  zone scope sentence (DEC-025) — because lookup mode never carries game state.
  These are structurally absent: the lookup assembler does not call the
  game-context, phase-guidance, or zone-section builders at all. (DEC-107,
  REQ-074)
- Built: the prompt instructs the model to quote rule text only from the
  provided rule-excerpt sections and to present the relevant ones verbatim with
  an explanation. The user `QUESTION` and, when present, the conversation history
  section are placed by the existing rules. (REQ-074)

### Combo enrichment

- Built: `prepareLookupPromptInput` also calls `resolveLookupComboCandidates`,
  which — when a Commander Spellbook catalog is loaded — calls
  `selectComboCandidates` in `mode: "lookup"` with every attached card (REQ-167,
  up to 5) as match instances and the explicit-intent detector run over the
  question text. Retrieval requires **both** explicit combo intent and at
  least one attached card; a lookup question with no card, or with cards but no
  combo intent, retrieves no combo catalog data. A candidate qualifies by
  containing at least one attached card as an exact ingredient or authoritative
  template match (qualify-on-any-one), and candidates covering more of the
  attached cards rank ahead of those covering fewer (attached-card coverage),
  before popularity. A candidate is complete when every ingredient slot is
  filled somewhere in the attached set and partial when it qualifies but a slot
  is unmatched; the answer explains a complete combo or names each missing
  ingredient's own identity/template from the catalog for a partial one — never
  a card recommendation. With exactly one card attached this is identical to
  the prior single-card rule. (DEC-116, REQ-094 amended by REQ-167, REQ-095,
  REQ-167)
- Built: when at least one variant is selected, prompt assembly adds a bounded
  `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` section (shared
  format with game mode) after card/rules/rulings enrichment and before
  conversation history and the question; no selected variants means no combo
  section at all. (REQ-095)

### Off-domain guardrail

- Built: common Magic-adjacent community phrasing (combo, infinite combo,
  aggro, control, ramp, tempo, stax, wheel, mill, blink, sacrifice outlet, and
  similar terms) is carved out as in-domain and answered, ahead of the
  off-domain refusal — see `PRD/sections/system-map/lookup-phrasing-glossary.md`
  for the maintained category list and what each phrase means. (REQ-168)
- Built: the lookup-mode prompt instructs the model to treat unrecognized or
  off-domain terms as "not found in the rules corpus," ask the user to check
  spelling or rephrase toward a Magic term, and never answer the off-domain
  question directly — the "confused rules lookup" persona, applied identically
  whether zero, one, or several cards (REQ-167) are attached. (DEC-108,
  REQ-074, REQ-167)
- Built: this is prompt-instruction-only. There is no separate classifier,
  validator, detection branch, or debug/log signal for off-domain input anywhere
  in the request path — the persona lives entirely as an instruction line in the
  assembled prompt. (DEC-108)

### Retrieval

- Built: System 3 supplemental rules retrieval (DEC-046) is hybrid-ranked when
  the embedding-provider seam is active (REQ-182) — the query embedding is
  cosine-ranked against the committed per-rule embeddings and blended with the
  IDF keyword score, both normalised per query, with the exact-rule-id boost
  merged into the blended score — over a rule index with the source document's
  table of contents and heading-only entries stripped (REQ-179), excluding
  exactly the curated rule numbers the selected curated topics already carry,
  and returning a small capped set of the best-ranked rules. IDF-scored
  keyword retrieval alone is retained as the mock/offline default and the
  fallback on any embedding failure, so those settings are never worse than the
  prior lexical behaviour. The blend exists for exactly this screen's query
  shape: semantic-only ranking measured better overall but worse on a card
  name, type line, and one keyword with no combat context, where three of eight
  labelled fixtures lost their expected rule from the top five (REQ-181,
  REQ-182). For lookup the query is built from the question tokens always, plus
  each attached card's name, type line, and keywords — not its oracle text
  (REQ-167, REQ-178). (DEC-046, REQ-022, REQ-178, REQ-179, REQ-181, REQ-182,
  DEC-107, REQ-167)
- Built: the always-on core game-rules topics are a fixed curated set
  (stack-and-priority, targets, zones, triggered-ability basics), not the
  state-gated selector the game flow uses — lookup carries no game state to gate
  on. One topic is added on card wording: when two or more attached cards say
  "instead" or "prevent" (replacement or prevention effects), the prompt also
  carries the replacement-effect interaction rules (CR 614.1a, 616.1, 616.1a–g,
  616.2), so a question about two such cards — Academy Manufactor with Esix,
  Fractal Bloom, say — gets the rule that the player chooses the order. (DEC-045,
  REQ-074, REQ-220)

### Provider boundary

- Built: assembly produces one `PreparedPromptInput` and hands it to the same
  `AskAiProvider.generateAnswer` the game mode uses; the provider consumes the
  assembled prompt text and never inspects `mode`. Quick Lookup adds no
  provider-boundary behavior of its own — the only difference from game mode is
  the prompt text assembled before the boundary. (DEC-020, REQ-074)
- Built: provider selection is explicit via `ASK_AI_PROVIDER` — mock is the
  default (canonical rule: `integrations-and-data.md`) and returns the assembled prompt text as its `answer` for inspection
  (DEC-017 / DEC-033); `openai` is the live path behind the same interface.
  HTTP contracts stay frozen across the swap and upstream failures map to the
  normalized error shape (the "Miho is working on it" copy). (DEC-020, DEC-017,
  DEC-033)
- Built: regression is pinned by golden fixtures under
  `apps/backend/src/eval/fixtures/quick-lookup-*` — single-card, no-card,
  multi-card, and off-domain scenarios, each with a request fixture plus a
  context golden and a prompt golden; the off-domain prompt golden pins the
  guardrail instruction wording verbatim. (DEC-108, REQ-167)
- Built: combo enrichment on the lookup path is pinned by dedicated fixtures —
  `commander-spellbook-lookup-attached-intent` and `-unrelated` (single
  attached card) plus `-multi-card-complete` and `-multi-card-partial`
  (bounded multi-card set) — under
  `apps/backend/src/eval/fixtures/commander-spellbook-lookup-*`. (REQ-095,
  REQ-167)

## Measured bounds

Bounds travel with a surface only while that surface still exists in code.
Retrieval and topic-set figures are outcome-validated calibration recorded here
as the current shipped configuration, not product truth.

- Wire question bound: `questionSchema` accepts up to 600 characters (min 0).
  This carries the composed string — the raw textarea is capped at the product
  300 by the frontend, and 600 covers the silent `Tell me about {Card Name}.`
  fallback the client composes (the locked-pill prefix it was also sized for is
  retired with REQ-079). (REQ-134,
  REQ-091, `askAiRequest.ts`)
- Frontend display cap: the budget ring, the screen-reader remaining-count live
  region, textarea `maxLength`, and submit gate measure the raw editable textarea
  at 300 characters (REQ-011); no visible numeric counter is drawn; the
  composed wire value may exceed 300, accepted against DEC-042's
  1,000,000-char prompt budget. (REQ-091 as amended by REQ-134)
- Conversation limits: 1–20 turns, alternating roles starting with user and
  ending with assistant, per-message cap — shared with the main flow, not a
  Quick-Lookup-specific policy. (REQ-072, REQ-075)
- Retrieval: System 3 returns a small capped best-ranked set (top 10), curated
  core-topic rule numbers excluded by exact number; ranking is a hybrid blend of
  normalised cosine over the committed per-rule embeddings and normalised
  lexical IDF overlap, with the exact-rule-id boost merged into the blended
  score, and lexical scoring alone retained as the mock/offline default and
  failure fallback (REQ-181, REQ-182); the query is the question tokens always,
  plus each attached card's name, type line, and keywords (REQ-167, REQ-178).
  (DEC-046, REQ-022, REQ-178, REQ-181, REQ-182, REQ-167)
- Card attach cap: the card stage accepts at most 10 cards (REQ-167 as
  amended); an add attempted past the cap is blocked with a stated limit
  message. (REQ-167, `QuickLookupApp.tsx`)
- Always-on core topics: a fixed four-topic core set (stack-and-priority,
  targets, zones, triggered-ability basics); the static MTG reference block is a
  bounded ≤2500-char constant. (DEC-045, DEC-025)
- Pre-submit card stage: the front card is the only full-size image; the one
  other card peeks and the rest are off-stage, so the stage's height does not
  grow with the card count. The send pill stays in the first viewport at every
  card count up to the cap and at every typed length because the screen is a
  `100dvh` anchored frame (REQ-218): the composer rests under the card
  stage and its growth is capped above its control row. The former per-image `25dvh` /
  `42dvh` stacked cap (ui-review, 2026-08-30) retires with the stacked list it
  bounded. (REQ-129, REQ-141, REQ-167, REQ-206, REQ-218, `screen-layout.md`)
- Layout/fit: mobile-first and touch-friendly; the pre-submit view is a `100dvh`
  anchored frame (REQ-218) — card stage at its natural height that never scrolls (the card image is
  capped at about 55% / 48% / 40% of the frame height by breakpoint (about 18% smaller again on a max-width 480px, max-height 700px phone), yielding to
  the box's readable minimum), the question box resting directly under it, only
  its text area scrolling. The pre-submit view and the answered workspace both follow
  the shared shell width and region-scroll rules of `screen-layout.md`'s "Quick
  Question — pre-submit" and "— answered workspace" rows. (NFR-001, REQ-218,
  `screen-layout.md`)

## Rejected alternatives and deferred scope

- **Two separate destinations — Card Lookup (DEC-097) and Rules Lookup
  (DEC-099) — closed door.** Both were refined and confirmed as their own
  feature-portal destinations, each with its own wire mode and its own forked
  backend enrichment path, before either shipped. Quick-lookup refinement
  reconciled them into one destination because the value proposition — skip
  staging game state, get a fast answer in the shared chrome — is identical
  whether or not the player has a card in mind; two destinations and two forked
  prompt-assembly implementations duplicated surface area for no product benefit
  and risked the two implementations drifting apart. (DEC-107, framed by its
  Context)
- **Two wire modes — `mode: "card"` (DEC-096) and the reserved `mode: "rules"`
  (DEC-098) — closed door.** DEC-106 replaced the `card` branch and retired the
  reserved `rules` slot with one `mode: "lookup"` branch carrying an optional
  `card`, matching the one-ask-path product shape exactly. (DEC-106)
- **Forked-by-mode backend enrichment — closed door.** DEC-107 ships one
  branching (not forked) assembly path: enrichment is a conditional card layer
  inside a single implementation, reusing the same rulings/metadata/System-3
  helpers the game flow uses, not a second copy. (DEC-107)
- **"Ask about this" pre-filling a freely editable textarea (original REQ-079)
  — closed door.** DEC-112/REQ-091 replaced it with the locked non-editable pill
  so a topic choice always reaches the submitted question and cannot be
  accidentally edited away. (DEC-112, REQ-091)
- **Cap and counter measured against the composed question string (original
  REQ-091/DEC-112) — closed door.** Live measurement found that rule produced an
  empty field reading `22/300`, a counter that rose on backspace-to-empty, and an
  unreachable `323/300` submit state; REQ-134 moved the cap and counter to the
  raw editable text. This bound no longer attaches to the composed string. (REQ-134)
- **Standalone guidance paragraph under the header — closed door.** DEC-113
  folded the copy inline onto the "Optional card" label; the wording and layout
  order are unchanged. (DEC-113)
- **Answer-seeded second-pass retrieval (DEC-100, former REQ-078) — deferred,
  not carried into v1.** DEC-100 specified re-querying the rule index with the
  model's first answer for rules-mode; Quick Lookup ships without it so it can get
  its own tuning pass as a dedicated future feature. The model still surfaces
  relevant verbatim rules from the first-pass provided set. Tracked as Q-004;
  open, not decided here.
- **Optional lightweight game context on the `card` field — deferred.** The
  DEC-106 union was shaped so a small amount of surrounding game context could be
  added to the card branch additively later; v1 keeps the card branch strictly
  single-card with no `gameContext`. Tracked as Q-003; open, not decided here.
- **General rules topics panel on Ask a Question (REQ-079) — closed door.**
  Retired by the owner's `ui-look-translation` gate verdict (2026-10-02): the
  direction-1 mockup was made without it on purpose. Its locked topic pill
  (REQ-091) went with it, since a topic row was the pill's only entry point.
- **Deferred, not cut:** mid-conversation card/zone-context editing —
  follow-ups are text-only in v1 with the attached card, if any, frozen for the
  conversation.

## Where it lives

The frontend destination and lookup-local UI live under
`apps/frontend/src/components/portal/quick-lookup/` (`QuickLookupApp.tsx`),
registered in `apps/frontend/src/components/portal/destinationRegistry.tsx`; it
reuses the shared `apps/frontend/src/components/{ConversationWorkspace,AdaptiveContextDialog}.tsx`,
and the submit orchestration hook `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`.
The committed core-topics browse artifact
`apps/frontend/public/data/gameRulesCoreTopics.json` is still written by the data
build but no longer read by the page (REQ-079 retired). The full backend path runs
through `apps/backend/src/validation/askAiRequest.ts` (the `mode: "lookup"`
branch), `apps/backend/src/prompt/` (`preparation.ts`, `promptAssembly.ts`,
`context.ts`, `mtgReference.ts`, `phaseGuidance.ts`),
`apps/backend/src/gameRulesRetrieval.ts` (System 3),
`apps/backend/src/commanderSpellbook/` (`catalog.ts`, `intent.ts`,
`matcher.ts`, `zones.ts`, `formatting.ts` — combo enrichment, DEC-116), and
`apps/backend/src/providers/` (`askAiProvider.ts`, `createAskAiProvider.ts`,
`mockAskAiProvider.ts`, `openAiResponsesProvider.ts`); regression goldens live
under `apps/backend/src/eval/fixtures/quick-lookup-*` and
`commander-spellbook-lookup-*`, and the core-topics
artifact is emitted by `scripts/build-game-rules.mjs`. See
`PRD/sections/system-map.md`'s `## Quick Lookup` block for the full file list,
`PRD/sections/screen-layout.md`'s `#### Quick Question — pre-submit` and
`#### Quick Question — answered workspace` rows for the layout bands,
`PRD/sections/system-map/prompt-layout-spec.md` for every section the lookup
prompt is built from, in assembly order, and which appear with/without a
card attached (REQ-169), and `apps/backend/src/providers/README.md` for the
provider-boundary config detail.
