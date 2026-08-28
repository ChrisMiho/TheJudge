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
  DEC-100, DEC-131, DEC-146, DEC-153, REQ-072, REQ-073, REQ-074, REQ-075,
  REQ-079, REQ-091, REQ-092, REQ-094, REQ-095, REQ-097, REQ-098, REQ-011,
  REQ-022, REQ-024, REQ-030, REQ-105, REQ-109, REQ-110, REQ-121, REQ-129,
  REQ-132, REQ-134, REQ-141, FLOW-006, FLOW-011, NFR-001

## What it is

A feature-portal destination for the short ask: the player either has one card
in mind or doesn't, and wants a fast Magic rules answer without staging a whole
game. They optionally attach a single card — by typed search or camera scan —
then type a question (or pick a rules topic), and get a plain-text answer in the
same conversation chrome the main MTG Assistant flow uses. Behind that one
screen runs the entire Ask AI backend: the request rides the shared
`POST /api/ask-ai` endpoint on a `mode: "lookup"` branch, the backend assembles
one prompt that always retrieves rules from the question and layers in the
card's rulings and metadata only when a card is attached, and the same provider
boundary (mock by default, OpenAI live) generates the answer. Off-domain
questions get an in-character "I couldn't find that in the rules" reply rather
than a chatbot answer. It carries no zones, stack, phase, or multi-card
setup, and it is not a full rules browser or a judge authority.

## How it works

### Entry and pre-submit layout

- Built: Quick Lookup is registered as one feature-portal destination
  (`quick-lookup`, DEC-095) and opens as a frontend-only view switch with no
  reload; it ships no navigation menu of its own. (DEC-107, REQ-073, FLOW-011)
- Built: the pre-submit view is laid out top to bottom as an optional
  card-attach control, then the Question field, then the "General rules topics"
  outer disclosure. (REQ-073, DEC-112)
- Built: the card-attach control's label carries the guidance copy inline after
  an em dash — "OPTIONAL CARD — Add a card for context or ask any Magic related
  question." — rather than as a standalone paragraph under the header. (DEC-113,
  REQ-073)
- Built: card input is optional and single. The player resolves one card by
  typed autocomplete search (REQ-001/REQ-002 behavior) or by camera scan (the
  shared FLOW-006 engine), each resolving to one oracle-level `CardMetadataItem`;
  the resolved card shows its name, image when available, and oracle text with
  full metadata before submit, and can be removed or replaced. Only one card is
  active at a time; there are no zones, stack, phase, or per-card
  enrichment-editing controls. (DEC-107, REQ-073, FLOW-006, FLOW-011)
- Built: scan here resolves to exactly one card and is presentation-only at the
  printing level — the scanned printing's art never reaches the request, prompt,
  or rulings; identity stays oracle-level. (DEC-053, REQ-073)

### General rules topics browse

- Built: below the Question field sits a collapsed-by-default "General rules
  topics" outer disclosure whose summary stays visible in every pre-submit state
  — attaching a card or typing into the Question field does not hide it.
  Expanding it reveals a short set of core rules topics (the stack & priority,
  targeting, combat, layers) built from the same curated `gameRulesByTopic`
  excerpts the prompt uses — one source of truth, no hand-authored second copy.
  (REQ-079, DEC-112)
- Built: topic rows are collapsed by default, each showing its title, a "Use
  this topic" button, and an expand/collapse toggle without expanding the row;
  expanding one row reveals its rule numbers and excerpt and auto-collapses any
  other open topic (accordion — at most one excerpt visible at a time). Reading a
  topic is fully client-side with no AI call. (REQ-079, DEC-112)
- Built: "Use this topic" locks that topic's fixed phrase (`Tell me about
  {Topic}.`) into a non-editable pill inline with the Question field's label,
  with its own remove control; only one pill may be locked at a time and picking
  a different topic swaps it without touching text already typed. It also
  smooth-scrolls to the Question field and focuses the textarea. (REQ-091,
  DEC-112)

### Composing and submitting the question

- Built: the freeform textarea stays independently editable at all times as
  optional supplementary context; locking, swapping, or removing a pill never
  overwrites it. Submit is enabled whenever a pill is locked, a card is attached,
  or the textarea has non-empty trimmed text. (REQ-091, DEC-112)
- Built: on submit the wire `question` string is composed client-side with no
  request-shape change — the pill phrase plus trimmed textarea text
  (space-joined) when both are present; the pill phrase alone; the textarea
  alone when no pill is locked; or, when no pill is locked and the textarea is
  empty but a card is attached, the silent fallback `Tell me about {Card Name}.`
  (never shown to the user). (REQ-091, FLOW-011)
- Built: the visible counter, the textarea `maxLength`, and the submit gate all
  measure the raw editable textarea content, not the composed string, so an
  empty field with a card or topic attached reads `0/300` and a full
  300-character question stays submittable. (REQ-091 as amended by REQ-134,
  REQ-011)
- Built: the composer row gives the Question textarea the full row width with
  an inline character counter, replacing a wide labelled submit button with a
  compact circular submit control at narrow viewports where a labelled button
  would starve the field; wider viewports may keep a labelled control so long
  as the field keeps the dominant share of the row. (DEC-146, REQ-121)
- Built: the Question textarea grows with typed content up to the space
  available before bottom chrome, capped so the page itself never scrolls from
  field growth — growth stops when further expansion would push chrome below
  the composer (submit row or equivalent) off-screen, not merely when the
  field's own bottom reaches the viewport bottom while lower chrome is lost.
  (DEC-131, REQ-110)
- Built: the initial submit control shows the visible label **Send Request**
  (accessible name may keep Ask/Decrypt semantics); the answered-view
  follow-up composer keeps its separate compact arrow/icon-only send control.
  (DEC-153, REQ-132, DEC-146)

### Initial submit wait

- Built: while the initial submit is in flight and no answer has arrived, the
  Question form (label, pill, textarea, counter, submit button) is hidden and
  the existing `AskAiWaitingPanel` (live elapsed timer, threshold messages,
  REQ-023) renders in its place. The Optional card section and the General rules
  topics disclosure stay visible and interactive throughout. (DEC-114, REQ-092)
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
- Built: the first visible bubble is the assistant's answer; the initial user
  question rides in `conversationHistory` but is not shown as a visible bubble.
  Follow-ups are text-only and send `{ mode: "lookup", question, card: frozen
  (when one was attached), conversationHistory }`. (REQ-075, FLOW-011)
- Built: when a card was attached it is frozen for the conversation and shown
  behind a compact adaptive context trigger — a bottom sheet below 768px or a
  right-side drawer at 768px+; without a card, no empty context trigger or
  container renders. Start Over clears the thread and any locked pill and
  returns to the pre-ask state. (REQ-075, DEC-118)

## The full backend path (request → assembly → retrieval → provider → response)

Quick Lookup is the first spec whose subject runs the entire Ask AI backend, not
a frontend-only surface. The path below is one branch of the shared
`POST /api/ask-ai` endpoint (DEC-010's single product-facing endpoint); success
`{ answer }` and error response shapes are unchanged from the game mode and from
both providers. (DEC-020, REQ-072)

### Request validation (`mode: "lookup"` branch)

- Built: `askAiRequestSchema` is a `mode`-discriminated union
  (`"game" | "lookup"`). A payload with no `mode` key defaults to `"game"` for
  back-compat; `mode: "lookup"` is a required literal. The lookup branch is
  `{ mode: "lookup", question, card?, conversationHistory? }`, `.strict()`, so a
  `gameContext` field is rejected as an unrecognized key — `card` and
  `gameContext` are mutually exclusive across modes. (DEC-106, REQ-072)
- Built: `card` is optional and its presence or absence is what the backend
  branches on. The lookup card reference is oracle-level (`cardId`, `name`,
  `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/
  `supertypes`/`subtypes` optional) and carries no zone, caster, owner, targets,
  or context-notes fields. (DEC-106, DEC-053, REQ-072)
- Built: `conversationHistory` is optional and validated identically to the game
  mode (1–20 turns, first `user`, last `assistant`, strictly alternating,
  per-message cap). The `question` character bound and control-character
  guardrails are identical across modes. (REQ-072)

### Branching prompt assembly

- Built: `preparePromptInput` routes `mode: "lookup"` to a single lookup
  assembly path (`prepareLookupPromptInput` → `buildLookupPromptText`), never
  forking by whether a card is attached — the card is a conditional layer inside
  one path, not a second implementation. (DEC-107, REQ-074)
- Built: three things always run regardless of a card. The static `MTG
  REFERENCE` block (DEC-025), the always-on core game-rules topics (DEC-045 core
  set), and question-scored System 3 supplemental rules (DEC-046 / REQ-022).
  (DEC-107, REQ-074)
- Built: when a card is attached, per-card enrichment layers in — the card's
  full metadata including oracle text using the same per-card formatting as
  populated-zone cards (DEC-042 / REQ-030), the card's WotC rulings (DEC-029),
  and System 3 additionally scored against the card's oracle text and type line,
  not only the question. With no card, the rulings section and card section are
  empty and System 3 scores on the question alone. (DEC-107, REQ-074)
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
  `selectComboCandidates` in `mode: "lookup"` with the attached card (if any)
  as the sole match instance and the explicit-intent detector run over the
  question text. Retrieval requires **both** explicit combo intent and an
  attached card; a lookup question with no card, or with a card but no combo
  intent, retrieves no combo catalog data. Every candidate must contain the
  attached card as an exact ingredient or an authoritative template match.
  (DEC-116, REQ-094)
- Built: when at least one variant is selected, prompt assembly adds a bounded
  `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` section (shared
  format with game mode) after card/rules/rulings enrichment and before
  conversation history and the question; no selected variants means no combo
  section at all. (REQ-095)

### Off-domain guardrail

- Built: the lookup-mode prompt instructs the model to treat unrecognized or
  off-domain terms as "not found in the rules corpus," ask the user to check
  spelling or rephrase toward a Magic term, and never answer the off-domain
  question directly — the "confused rules lookup" persona, applied identically
  whether or not a card is attached. (DEC-108, REQ-074)
- Built: this is prompt-instruction-only. There is no separate classifier,
  validator, detection branch, or debug/log signal for off-domain input anywhere
  in the request path — the persona lives entirely as an instruction line in the
  assembled prompt. (DEC-108)

### Retrieval

- Built: System 3 supplemental rules retrieval (DEC-046) is IDF-scored keyword
  retrieval over the loaded rule index, excluding the curated rule numbers the
  always-on core topics already carry, returning a small capped set of the
  best-scoring rules. For lookup the query is built from the question tokens
  always, plus the attached card's oracle text and type line when one is
  present. (DEC-046, REQ-022, DEC-107)
- Built: the always-on core game-rules topics are a fixed curated set
  (stack-and-priority, targets, zones, triggered-ability basics), not the
  state-gated selector the game flow uses — lookup carries no game state to gate
  on. (DEC-045, REQ-074)

### Provider boundary

- Built: assembly produces one `PreparedPromptInput` and hands it to the same
  `AskAiProvider.generateAnswer` the game mode uses; the provider consumes the
  assembled prompt text and never inspects `mode`. Quick Lookup adds no
  provider-boundary behavior of its own — the only difference from game mode is
  the prompt text assembled before the boundary. (DEC-020, REQ-074)
- Built: provider selection is explicit via `ASK_AI_PROVIDER` — mock is the
  default and returns the assembled prompt text as its `answer` for inspection
  (DEC-017 / DEC-033); `openai` is the live path behind the same interface.
  HTTP contracts stay frozen across the swap and upstream failures map to the
  normalized error shape (the "Miho is working on it" copy). (DEC-020, DEC-017,
  DEC-033)
- Built: regression is pinned by golden fixtures under
  `apps/backend/src/eval/fixtures/quick-lookup-*` — card, no-card, and off-domain
  scenarios, each with a request fixture plus a context golden and a prompt
  golden; the off-domain prompt golden pins the guardrail instruction wording
  verbatim. (DEC-108)
- Built: combo enrichment on the lookup path is pinned by dedicated fixtures —
  `commander-spellbook-lookup-attached-intent` (attached card, explicit combo
  intent) and `commander-spellbook-lookup-unrelated` (attached card, ordinary
  rules question, no combo intent) — under
  `apps/backend/src/eval/fixtures/commander-spellbook-lookup-*`. (REQ-095)

## Measured bounds

Bounds travel with a surface only while that surface still exists in code.
Retrieval and topic-set figures are outcome-validated calibration recorded here
as the current shipped configuration, not product truth.

- Wire question bound: `questionSchema` accepts up to 600 characters (min 0).
  This carries the composed string — the raw textarea is capped at the product
  300 by the frontend, and 600 covers the locked-pill prefix or the silent
  `Tell me about {Card Name}.` fallback the client composes on top. (REQ-134,
  REQ-091, `askAiRequest.ts`)
- Frontend display cap: the visible counter, textarea `maxLength`, and submit
  gate measure the raw editable textarea at 300 characters (REQ-011); the
  composed wire value may exceed 300 by the prefix, accepted against DEC-042's
  1,000,000-char prompt budget. (REQ-091 as amended by REQ-134)
- Conversation limits: 1–20 turns, alternating roles starting with user and
  ending with assistant, per-message cap — shared with the main flow, not a
  Quick-Lookup-specific policy. (REQ-072, REQ-075)
- Retrieval: System 3 returns a small capped best-scoring set (top 5), curated
  core-topic rule numbers excluded; question tokens always score, card
  oracle/type tokens added only when a card is attached. (DEC-046, REQ-022)
- Always-on core topics: a fixed four-topic core set (stack-and-priority,
  targets, zones, triggered-ability basics); the static MTG reference block is a
  bounded ≤2500-char constant. (DEC-045, DEC-025)
- Pre-submit card image fit: the shared card-shell image is capped at
  `max-height: 25dvh` below 768px and `42dvh` at 768px+ so **Send Request** stays
  in the first viewport with no page scroll — REQ-129's no-scroll fit binds
  before REQ-141's "clear majority," so at 390×844 the image is ~45% of content
  width, which REQ-141 is not met on and DEC-160 anticipates. (DEC-160, REQ-129,
  REQ-141, `screen-layout.md`)
- Layout/fit: mobile-first and touch-friendly; the pre-submit stack and the
  answered workspace follow the shared shell width and region-scroll rules of
  `screen-layout.md`'s "Quick Question — pre-submit" and "— answered workspace"
  rows. (NFR-001, `screen-layout.md`)

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
- **Deferred, not cut:** mid-conversation card/zone-context editing —
  follow-ups are text-only in v1 with the attached card, if any, frozen for the
  conversation.

## Where it lives

The frontend destination and lookup-local UI live under
`apps/frontend/src/components/portal/quick-lookup/` (`QuickLookupApp.tsx`),
registered in `apps/frontend/src/components/portal/destinationRegistry.tsx`; it
reuses the shared `apps/frontend/src/components/{ConversationWorkspace,AdaptiveContextDialog}.tsx`,
the submit orchestration hook `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`,
and the committed core-topics browse artifact
`apps/frontend/public/data/gameRulesCoreTopics.json`. The full backend path runs
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
`#### Quick Question — answered workspace` rows for the layout bands, and
`apps/backend/src/providers/README.md` for the provider-boundary config detail.
