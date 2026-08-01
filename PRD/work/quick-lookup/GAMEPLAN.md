# GAMEPLAN: quick-lookup

Implementation architecture for **Quick Lookup** — one reuse-first Ask AI entry
where the player optionally attaches a single card (typed search or camera scan)
and asks a question, or asks a freeform Magic question with no card. The backend
runs **one branching** prompt-assembly path: question-driven rules retrieval
always runs; per-card enrichment (rulings, full metadata incl. oracle text,
card-scored System 3) layers in only when a card is attached. Off-domain
questions get a "confused rules lookup" persona response. Ships on the existing
`POST /api/ask-ai` via a `mode: "lookup"` branch, reached through the feature
portal. Supersedes the never-shipped `card-lookup-qa` / `rules-lookup` packages
(`prior/` in this folder) — this GAMEPLAN reconciles their architecture into one
unified path rather than two forks.

Decisions: DEC-106 (`mode` discriminator), DEC-107 (Quick Lookup unification),
DEC-108 (off-domain guardrail). Requirements: REQ-072/073/074/075/079. Flow:
FLOW-011. Out of scope: Q-003 (optional lightweight game context on the card
branch), Q-004 (answer-seeded second-pass retrieval, deferred to its own future
feature — do **not** build it here).

## External prerequisites

- **`feature-portal` (DEC-095) — shipped.** `apps/frontend/src/components/portal/destinationRegistry.tsx`,
  `DestinationOutlet.tsx`, and `lib/portal/types.ts` already exist; `MtgAssistantApp`
  is registered as a destination. Slice D appends one entry — the exact extension
  path the portal was built for. Not a blocker.
- **Neither `card-lookup-qa` nor `rules-lookup` ever shipped.** Verified against
  current code: `askAiRequestSchema` (`apps/backend/src/validation/askAiRequest.ts`)
  is still a single `.strict()` `{ question, gameContext, conversationHistory? }`
  object with no `mode` field, and `useAskAiSubmitOrchestration`
  (`apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`) is still hard-typed
  to `frozenGameContext: GameContext | null` and `ZoneAskAiPayload`. This work is
  **greenfield** on both fronts — Slice A is not "extending" a prior mode union,
  it is introducing one from scratch, in its final unified shape (`"game" | "lookup"`,
  never `"card"` / `"rules"`).

## What ships

- A `mode`-discriminated `AskAiRequest`: `mode: "game"` (default, unchanged) vs
  `mode: "lookup"` (`{ mode, question, card?, conversationHistory? }`), `card`
  optional and mutually exclusive with `gameContext`.
- A lookup-mode backend prompt branch: always-on question-driven rules retrieval
  (MTG reference block, always-on core game-rules topics, question-scored System 3)
  that additionally layers in per-card enrichment (WotC rulings, full card
  metadata incl. oracle text, card-scored System 3) when `card` is present; every
  game-state-only section is always omitted; an off-domain "confused rules
  lookup" persona instruction is always active.
- A query-based refactor of the System-3 scorer so **one** authoritative matcher
  serves game mode (context query), lookup mode with no card (question-only
  query), and lookup mode with a card (question + card-oracle query) — no forked
  matcher.
- A committed frontend core-topics artifact derived from `gameRulesByTopic.json`.
- A **Quick Lookup** frontend view registered as a portal destination: optional
  single-card input via the existing typed search **and** the existing scanner,
  card presentation, question field, core-topics empty-state fallback, and the
  shipped conversation chrome with the card (if any) frozen.

## Architecture

### Request contract (Slice A) — backend

Today `askAiRequestSchema` is a single `.strict()` object. It becomes a
`mode`-discriminated union:

- `game` branch: `{ mode?: "game", question, gameContext, conversationHistory? }`
  — today's rules (REQ-019) unchanged; `card` rejected.
- `lookup` branch: `{ mode: "lookup", question, card?, conversationHistory? }` —
  `gameContext` rejected; `card` is optional and, when present, a single
  oracle-level reference resolvable to a committed `CardMetadataItem`.

`mode` is optional-with-default `"game"` so existing clients validate unchanged.
Because Zod `discriminatedUnion` needs a present discriminator, realize the
default with a `z.preprocess` step that stamps `mode: "game"` when absent, then
discriminates. `question` cap (300) and control-character guardrails stay the
shared `boundedText` helper across both branches; `conversationHistory` reuses
`conversationHistorySchema` unchanged (DEC-038).

The `card` reference is a new `lookupCardReferenceSchema` — a single-card analog
of `zoneCardItemSchema` carrying only the fields the prompt needs (`cardId`,
`name`, `oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`,
`supertypes`, `subtypes`), with **no** `targets`, `caster`, `owner`,
`contextNotes`, or `manaSpent` — those are game-state annotations a lookup card
never carries. `AskAiRequest` (`apps/backend/src/types/index.ts`) is re-derived
from the union.

### Lookup-mode prompt assembly + query-based scorer (Slice B) — backend

`buildPromptContext` (`prompt/context.ts`) and `buildPromptText`
(`prompt/promptAssembly.ts`) today assume `payload.gameContext`. Add a lookup
path rather than branching the existing game functions internally:

- **`buildLookupPromptContext(request)`** in `prompt/context.ts` (or a sibling
  file) produces a small context shape — `{ finalQuestion, card?, conversationHistory? }`
  — reusing `normalizeQuestion` / `normalizeCardText` / the existing per-field
  normalizers; no `gameContext`, no zones, no stack.
- **`buildLookupPromptText(context, options)`** in `promptAssembly.ts` assembles,
  in order: `SYSTEM ROLE PREAMBLE` (shared `SYSTEM_ROLE_PREAMBLE_LINES` +
  `INSTRUCTIONS`, gaining the DEC-108 off-domain guardrail line — treat
  unrecognized/off-domain terms as "not found in the rules corpus," ask the user
  to check spelling or rephrase, never answer directly — plus the existing
  verbatim-fidelity guard: quote rule text only from the provided sections,
  present the genuinely relevant excerpts verbatim with an explanation), `MTG
  REFERENCE` (`MTG_PROMPT_REFERENCE`), `GAME RULES (reference)` (always-on core
  topics), `ADDITIONAL RELEVANT RULE EXCERPTS` (question-and-card-scored System
  3), a **single-card section** when `card` is present (reusing
  `formatZoneCardMetadataLines` from `promptFormatting.ts` — the same per-card
  formatter populated-zone cards use, REQ-030 — wrapped in a new lightweight
  label, not a `ZONE:` header, since a lookup card has no zone), `OFFICIAL
  RULINGS` when `card` is present, `CONVERSATION HISTORY` when present, `QUESTION`.
  It **omits** `GENERAL GAME CONTEXT`, `PHASE GUIDANCE`, all zone sections, and
  the `SCOPE` sentence unconditionally — lookup mode never carries game state,
  card or no card.
- **`preparePromptInput`** (`prompt/preparation.ts`) branches on
  `request.mode === "lookup"`: core topics = `allGameRulesTopics` filtered to
  `ALWAYS_ON_TOPIC_IDS` (`gameRulesTopicSelection.ts`'s exported constant — reuse
  it directly; **not** `selectGameRulesTopics`, which is game-state-driven);
  `curatedRuleIds = collectCuratedRuleIds(coreTopics)`; rulings = `card` present
  ? `resolveRulingsForPrompt([{ cardId: card.cardId, name: card.name }], index, limits)`
  (no `collectCardsForRulings` needed — build the one-item array directly) : the
  existing empty-rulings shape; supplemental = the new query-based retrieval,
  scored on the question plus (when present) the card's oracle text/type line,
  excluding `curatedRuleIds`.
- **Query-based scorer refactor** in `gameRulesRetrieval.ts`: extract
  `buildQueryTokensFromParts({ questionText, oracleText })` as the shared token
  builder (the existing `buildQueryParts` output); `buildQueryTokens(context)`
  becomes a thin adapter that computes parts from a `PromptContext` and
  delegates. Add `retrieveRulesForQuery(queryTokens, queryRuleIds, index,
  excludeRuleIds, max, resources)` (+ a `…WithDebug` variant) holding the
  scoring/sort/slice core; `retrieveSupplementalRules(context, …)` and
  `retrieveSupplementalRulesWithDebug` delegate to it. **Same IDF weighting,
  question/keyword boosts, exact/parent rule-ID bonuses, and tie-break** — no
  behavior change for game mode (existing eval goldens must not drift).
- Mock provider exposure is automatic: `buildMockAnswer` already renders
  `preparedPrompt.promptText` and sidecars unchanged (DEC-017 / DEC-033), so the
  assembled lookup-mode prompt and enrichment debug surface through it once
  `preparePromptInput` branches correctly.
- `routes/askAi.ts` needs no branching of its own — it already calls
  `preparePromptInput(parsed.data, options)` generically; the mode branch lives
  entirely inside `preparePromptInput` / `buildLookupPromptContext` /
  `buildLookupPromptText`.

### Core-topics browse artifact (Slice C) — data build

Extend `scripts/build-game-rules.mjs` to emit a second committed output —
`apps/frontend/public/data/gameRulesCoreTopics.json` — selecting a small core set
(`ALWAYS_ON_TOPIC_IDS` plus a couple of high-value browse topics, e.g.
`combat-phase-structure` and `layers-order`) from the **same**
`gameRulesByTopic.json` entries (`id`, `title`, `ruleNumbers`, `excerpt`). One
source of truth: the subset is derived, never hand-authored. Build policy (which
ids) is a build-time sign-off like DEC-030, covered by a unit test asserting the
subset matches the curated source with no drift.

### Quick Lookup view + entry (Slice D) — frontend

New `QuickLookupApp` registered as a portal destination
(`destinationRegistry.tsx`). Reuse, in order of preference, before creating:

- **Single-card input** — typed search reuses `useAutocompleteSuggestions`
  (`hooks/useAutocompleteSuggestions.ts`) + `getSuggestions` (`lib/search.ts`,
  REQ-001/002 behavior, `NO_MATCH_COPY` on no match); scan reuses
  `ScanCameraSurface` + `useScanCapture` + `resolveScanCandidates`
  (`lib/scan/resolveScanCandidates.ts`, FLOW-006 engine). Both resolve to one
  `CardMetadataItem`. `ZoneCardPicker` composes search+scan+`CardSelectionPreview`
  for a zone but owns no state itself (state lives in `ZoneCollectionStep`) — do
  not reuse `ZoneCardPicker` wholesale (it is zone/add-semantics shaped); instead
  drive `CardSelectionPreview`, `ScanCameraSurface`, and the two hooks directly in
  single-card mode, mirroring `ZoneCollectionStep`'s state wiring pattern rather
  than its zone-add UI.
- **Card presentation** — `CardSelectionPreview` / `CardPresentation` show name,
  image, oracle text + full metadata before the user asks (REQ-073); user can
  remove/replace before submitting.
- **Empty state** — fetch `/data/gameRulesCoreTopics.json` (runtime fetch, same
  pattern as `/data/cardMetadata.json` via `lib/env.ts`'s base-path resolver);
  render core topics (title + excerpt) readable fully client-side; an "ask about
  this" control pre-fills the question field without calling the model. Shown
  whenever no card is attached and no question has been submitted yet; attaching
  a card or typing a question both replace it.
- **Question field** — freeform, same 300-char cap and guardrails as the main
  flow (REQ-011); submit blocked when the trimmed question is empty.

### Quick Lookup conversation thread + submit orchestration (Slice E) — frontend, ship slice

`useAskAiSubmitOrchestration` is hard-typed to `frozenGameContext: GameContext |
null` and `ZoneAskAiPayload`. Per the reuse-first / no-forked-implementations
principle (DEC-107), **generalize this one hook** rather than fork a parallel
lookup copy:

- Broaden the payload type to `ZoneAskAiPayload | LookupAskAiPayload` and the
  frozen-context state to a small discriminated shape (`{ kind: "game";
  gameContext: GameContext } | { kind: "lookup"; card: CardMetadataItem | null }
  | null`) so `isConversationActive` / follow-up composition work for: game mode
  (frozen `GameContext`), lookup-with-card (frozen `card`), and lookup-with-no-card
  (no frozen object at all, activation keyed on "has answered once" instead of a
  non-null frozen context).
- Add `buildLookupAskAiRequest(question, card?, conversationHistory?)` alongside
  `buildAskAiRequest` in `lib/contextFlow/flow.ts` (or a `lib/lookupFlow.ts`
  sibling if colocating cleanly is awkward) and a `LookupAskAiPayload` type.
  Follow-ups send `{ mode: "lookup", question, card: frozen (if any),
  conversationHistory }`.
- Frozen-context summary: reuse `CardSelectionPreview` for the card-attached case
  instead of `FrozenContextSummary` (which is `GameContext`-specific); no summary
  at all when there is no card.
- Wire `ConversationThread`, the follow-up composer, inline Send-button
  processing (REQ-028), and start over (REQ-029) into `QuickLookupApp` (Slice D's
  shell). Initial user question is included in `conversationHistory` sent to the
  API but never shown as a visible bubble (REQ-075), exactly as game mode does.
  Start over clears the thread and returns to the pre-ask state — looked-up card
  preserved if one was attached, core-topics fallback visible if not.
- This is the **ship slice**: promotion checklist + Ship gates live here.

## Data flow

Lookup mode: FE resolves an optional `CardMetadataItem` →
`{ mode: "lookup", question, card? }` → `POST /api/ask-ai` → Zod lookup branch →
lookup-mode `preparePromptInput` (always-on core + question[+card]-scored System
3; rulings + full metadata only when `card` present; no zone/phase/scope) →
provider → `{ answer }` → conversation thread. Follow-ups append
`conversationHistory` (frozen card, if any, unchanged). Game mode is
byte-for-byte unchanged throughout.

## Reuse (before creating)

- Backend: `conversationHistorySchema`, `boundedText`, `zoneCardItemSchema`
  (field subset reference for the new lookup card schema), `resolveRulingsForPrompt`,
  `formatZoneCardMetadataLines`, `SYSTEM_ROLE_PREAMBLE_LINES`,
  `MTG_PROMPT_REFERENCE`, `ALWAYS_ON_TOPIC_IDS`, `collectCuratedRuleIds`,
  `formatGameRulesSection`, `formatSupplementalRulesSection`,
  `formatConversationHistorySection`, the DEC-046 scorer internals (refactored to
  query-based, not re-implemented), `getPromptDiagnostics`, `buildMockAnswer`
  prompt exposure.
- Frontend: `ScanCameraSurface`, `useScanCapture`, `resolveScanCandidates`,
  `useAutocompleteSuggestions`, `getSuggestions` / `NO_MATCH_COPY`,
  `CardSelectionPreview` / `CardPresentation`, `ConversationThread`, the
  follow-up composer + inline Send animation, `useAskAiSubmitOrchestration`
  (generalized), the portal registry + `DestinationOutlet`, the `/data/*.json`
  runtime-fetch pattern, `lib/env.ts`.
- Data: `scripts/build-game-rules.mjs` (extend), `gameRulesByTopic.json` (single
  source of truth).

## Sequencing

- **Slice A** (contract) — no dependency. Foundational; blocks B, D, E's payload shape.
- **Slice B** (lookup prompt + query-based scorer) — depends on A.
- **Slice C** (core-topics artifact + build) — independent; parallel with A/B/D.
- **Slice D** (frontend view + entry) — depends on A (card/payload shape) and C
  (empty-state artifact). Buildable/unit-testable against A's types + C's
  artifact before B merges; a full mock-provider E2E needs B.
- **Slice E** (conversation thread + submit orchestration — ship) — depends on A, B, D.

Recommended order: **A and C in parallel → B and D in parallel → E**.

## Verification checklist

- [ ] `npm --workspace apps/backend run test` green — game/lookup discriminator
      validation, cross-field rejection (`gameContext` on lookup, `card` on
      game), default-`mode` back-compat, lookup-mode prompt sections
      present/omitted (MTG reference + always-on core + supplemental +
      off-domain guardrail always present; single-card section + rulings present
      only when `card` given; general context/phase/zones/scope always absent),
      query-based scorer parity for game mode (no behavior change), mock
      lookup-mode prompt exposure
- [ ] `npm --workspace apps/backend run test:eval` green — no game-mode golden
      drift; new lookup-mode fixtures (no card, card attached, off-domain
      question) assert section presence/absence and supplemental recall
- [ ] `npm run data:build` regenerates `gameRulesCoreTopics.json` from
      `gameRulesByTopic.json` with graceful degradation; subset matches the
      curated source with no drift
- [ ] `npm --workspace apps/frontend run test` green — single-card search + scan
      resolve to one card, card presentation, empty-state core-topics browse +
      "ask about this" pre-fill, blank-question submit blocked, `{ mode: "lookup" }`
      payload shape (with and without `card`), conversation reuse
      (assistant-first, hidden initial question, follow-up history, inline Send,
      start over → card preserved or core-topics visible), portal destination
      registered
- [ ] `npm run typecheck` clean; `npm run quality:check` green for touched
      areas; `npm run lint` / `npm run format:check` clean
- [ ] Manual (`ASK_AI_PROVIDER=mock`): from the portal, open Quick Lookup; read a
      core topic and "ask about this"; resolve a card by typing and by scanning,
      ask a question, receive an answer with rulings/metadata reflected in the
      assembled prompt; ask with no card attached; ask an off-domain question and
      confirm the "confused rules lookup" persona response; send a follow-up;
      start over
- [ ] Contract stability: existing `{ question, gameContext }` requests validate
      and behave unchanged; success `{ answer }` / error shapes unchanged for
      both providers
