# GAMEPLAN: rules-lookup

Implementation architecture for **Rules Lookup** — a lightweight Ask AI entry for
**general rules questions** carrying no game state and no card. The player asks a
rules question; the backend runs question-driven rules enrichment, the model surfaces
the relevant **verbatim** Comprehensive Rules excerpts plus an explanation, and a
free **answer-seeded second-pass** re-query recovers rules the question's wording
missed. A small committed **local core-topics** list gives a zero-cost browse
fallback. Ships as a **feature-portal** destination reusing Card Lookup's
conversation chrome under the main flow's limits.

Decisions: DEC-098 (`mode: "rules"` branch), DEC-099 (Rules Lookup feature/reuse map),
DEC-100 (rules-mode enrichment + answer-seeded second pass). Requirements:
REQ-076/077/078/079/080. Flow: FLOW-012. Consumes: DEC-096 (mode union), DEC-095
(portal, shipped), DEC-097 (Card Lookup conversation chrome), DEC-025/045/046 (rules
enrichment), DEC-038 (`conversationHistory`), DEC-012/030 (static committed artifacts),
DEC-020/010 (frozen contract, single endpoint), DEC-017/033 (mock prompt exposure).

## External prerequisites

Rules Lookup is a *reuse* feature; two sibling packages own its foundations:

1. **`feature-portal` (DEC-095) — shipped.** Portal components already exist
   (`src/components/portal/destinationRegistry.tsx`, `DestinationOutlet.tsx`,
   `src/lib/portal/types.ts`). Slice E appends one destination entry — the exact
   extension path the portal was built for. Not a blocker.
2. **`card-lookup-qa` (DEC-096 / DEC-097) — not yet shipped.** It introduces:
   - the `mode`-discriminated `AskAiRequest` union (`game` | `card`) on
     `POST /api/ask-ai` — **the union that Slice A extends with `rules`**; and
   - the generalized conversation reuse (a frozen-context-agnostic
     `useAskAiSubmitOrchestration` + a payload builder alongside `buildAskAiRequest`,
     and a portal-mounted lookup view pattern) — **which Slice E extends to the
     no-frozen-context rules case.**

   The mode contract today does **not** exist: `askAiRequestSchema`
   (`apps/backend/src/validation/askAiRequest.ts`) is still a single `.strict()`
   `{ question, gameContext, conversationHistory? }` object, and
   `useAskAiSubmitOrchestration` is still `frozenGameContext`-keyed. Per the brief and
   the lookup-suite build order, **prefer landing the mode contract (DEC-096) and Card
   Lookup's conversation reuse (DEC-097) with or before this work.** If a rules slice
   starts before its card-lookup counterpart, it must introduce the shared
   scaffolding it needs (union discriminator; frozen-context generalization) rather
   than fork a parallel copy — Slices A and E call this out inline.

## What ships

- A `rules` branch on the `mode`-discriminated `AskAiRequest`:
  `{ mode: "rules", question, conversationHistory? }` — no `gameContext`, no `card`.
- A **rules-mode backend prompt branch**: MTG reference block (DEC-025) + always-on
  core game-rules topics (DEC-045 `ALWAYS_ON_TOPIC_IDS`) + question-scored System-3
  supplemental (DEC-046), with a verbatim-fidelity guard; omits every game-state-only
  section and card rulings.
- A **query-based refactor** of the System-3 scorer so one authoritative matcher
  serves game mode (context query), rules first pass (question query), and the second
  pass (answer query) — no forked matcher.
- An **answer-seeded second-pass** re-query: after the provider returns, re-query the
  rule index with the answer text, dedup against first-pass rule IDs, cap, and append
  the recovered verbatim excerpts to the plain-text `answer`.
- A committed **frontend core-topics artifact** built from `gameRulesByTopic.json`
  (single source of truth), lazily fetched by the view.
- A **Rules Lookup** view registered as a portal destination: core-topics browse
  empty state, freeform question field, `{ mode: "rules" }` submit, and the shipped
  conversation chrome with **no frozen context**.

## Architecture

### Request contract (Slice A) — backend

Extend the DEC-096 `mode` union with a third branch:

- `rules` branch: `{ mode: "rules", question, conversationHistory? }` — `gameContext`
  and `card` both rejected. `question` cap (300) and control-char guardrails are the
  shared `boundedText`; `conversationHistory` uses the existing
  `conversationHistorySchema` unchanged (DEC-038).

`AskAiRequest` (`apps/backend/src/types/index.ts`) re-derives from the union. Because
Zod `discriminatedUnion` needs a present discriminator, the `mode`-absent default
`"game"` (a card-lookup concern) is realized by the same preprocess/normalization
step; the `rules` literal is explicit and never defaulted.

> If DEC-096's union has not landed, Slice A creates the discriminated union
> (`game` default + `rules`) so rules work is unblocked; `card` is added by
> card-lookup-qa and the branches coexist. Coordinate to avoid a merge collision on
> `askAiRequest.ts`.

### Query-based System-3 scorer (Slice B) — backend

Today `scoreIndex(context, …)` in `gameRulesRetrieval.ts` calls
`buildQueryTokens(context)`, which reads `gameContext` (turn phase, zones, stack,
zone cards) — unavailable in rules mode. Refactor so the scorer accepts a **query**,
not a context:

- Extract `buildQueryTokensFromParts({ questionText, oracleText })` (the existing
  `buildQueryParts` output) as the shared token builder; `buildQueryTokens(context)`
  becomes a thin adapter that computes parts from context and delegates.
- Add `buildQueryTokensFromText(text, source: QueryTokenSource)` for a single-provenance
  query (rules first pass = the question; second pass = the answer).
- Add `retrieveRulesForQuery(queryTokens, queryRuleIds, index, excludeRuleIds, max,
  resources)` (+ a `…WithDebug` variant) holding the scoring/sort/slice core;
  `retrieveSupplementalRules(context, …)` and `retrieveSupplementalRulesWithDebug`
  delegate to it. **Same scorer, sort, IDF weighting, question/keyword boosts, and
  exact/parent rule-ID bonuses (DEC-046)** — no behavior change for game/card mode.

### Rules-mode prompt assembly (Slice B) — backend

- **Rules PromptContext** — add `buildRulesPromptContext(request)` in
  `prompt/context.ts` (or a rules analog) carrying `{ finalQuestion, conversationHistory? }`;
  no `gameContext`.
- **Rules prompt text** — add `buildRulesPromptText(context, options)` in
  `promptAssembly.ts` reusing the shared formatters. It assembles, in order:
  `SYSTEM ROLE PREAMBLE`, `INSTRUCTIONS` (+ a **verbatim-fidelity guard** line:
  quote rule text only from the provided GAME RULES / ADDITIONAL RELEVANT RULE
  EXCERPTS sections, present the genuinely relevant excerpts verbatim with an
  explanation, never invent rule numbers or text), `MTG REFERENCE`
  (`MTG_PROMPT_REFERENCE`), `GAME RULES (reference)` (core topics),
  `ADDITIONAL RELEVANT RULE EXCERPTS` (question-scored supplemental),
  `CONVERSATION HISTORY` (when present), `QUESTION`. It **omits** `GENERAL GAME
  CONTEXT`, `PHASE GUIDANCE`, zone sections, the `SCOPE` sentence, and
  `OFFICIAL RULINGS`.
- **Preparation branch** — `preparePromptInput` (`prompt/preparation.ts`) branches on
  `request.mode === "rules"`: core topics = `allGameRulesTopics` filtered to
  `ALWAYS_ON_TOPIC_IDS` (reuse the exported constant; **not** `selectGameRulesTopics`,
  which is game-state driven); `curatedRuleIds = collectCuratedRuleIds(coreTopics)`;
  supplemental = `retrieveRulesForQuery(question tokens, index, exclude=curatedRuleIds)`;
  no rulings. It returns the first-pass rule-ID set and a `rulesMode` marker on
  `PreparedPromptInput` so the route can run the second pass and dedup.
- **Mock exposure** — `buildMockAnswer` already renders `preparedPrompt.promptText`
  and sidecars unchanged; the assembled rules-mode prompt and enrichment debug surface
  through it automatically (DEC-017 / DEC-033).

### Answer-seeded second-pass retrieval (Slice C) — backend

Add `applyRulesSecondPass(response, preparedPrompt, { gameRulesRuleIndex,
collectEnrichmentDebug })`. When `preparedPrompt.rulesMode`:

1. Build an answer query via `buildQueryTokensFromText(response.answer, "question")`
   (the answer is the strong signal; `extractRuleIds` still gives cited numbers like
   `704.5g` the +100 exact-ID bonus).
2. `retrieveRulesForQuery(answer tokens, index, exclude = firstPassRuleIds, max = 5)`
   — capped consistently with the supplemental budget; dedup means nothing already in
   the prompt repeats.
3. Format the recovered verbatim excerpts (a human-facing labeled block) and **append**
   to `response.answer`. Success `{ answer }` and error shapes are unchanged — no new
   field, key, or endpoint.

Wire it in the route (`routes/askAi.ts`) immediately after `generateAnswer`, gated on
`preparedPrompt.rulesMode`. Second-pass selections/runner-ups surface in enrichment
debug when `collectEnrichmentDebug` (mock). Single AI call; the explanation is **not**
regenerated in v1.

### Core-topics browse artifact (Slice D) — data build + frontend data

Extend `scripts/build-game-rules.mjs` to emit a committed frontend subset —
`apps/frontend/public/data/gameRulesCoreTopics.json` — selecting a small core set
(e.g. `ALWAYS_ON_TOPIC_IDS` plus a couple of high-value browse topics like combat and
layers) from the **same** `gameRulesByTopic.json` entries (`id`, `title`,
`ruleNumbers`, `excerpt`). One source of truth: the subset is derived, never
hand-authored. Build policy (which ids) is a build-time sign-off like DEC-030,
covered by a `gameRulesBuildPolicy`-style unit test.

### Rules Lookup view + entry (Slice E) — frontend

New `RulesLookupApp` registered as a portal destination. Reuse before creating:

- **Empty state / browse** — fetch `/data/gameRulesCoreTopics.json` (runtime fetch,
  same pattern as `/data/cardMetadata.json`); render a short list of topics
  (title + excerpt) readable fully client-side; an **"ask about this"** control
  pre-fills the question field (it does not call the model).
- **Question field** — freeform, 300-char cap and guardrails (REQ-011); submit blocked
  when the trimmed question is empty (rules mode has **no** fallback question).
- **Conversation** — reuse `ConversationThread`, the follow-up composer, inline
  Send-button processing (REQ-028), and start over (REQ-029). **No frozen context.**
- **Submit path** — extend the generalized `useAskAiSubmitOrchestration` to a
  no-frozen-context mode: activation keys on "has answered once" + a stored initial
  question rather than `frozenGameContext !== null`; follow-ups send
  `{ mode: "rules", question, conversationHistory }`. Add
  `buildRulesAskAiRequest(question, conversationHistory?)` in `lib/contextFlow/flow.ts`
  and a `RulesAskAiPayload` type. Start over clears the thread and returns to the
  empty state (core-topics visible).

> Extends card-lookup-qa's frozen-context generalization; if that has not merged,
> this slice performs the generalization (frozen context → optional/nullable) rather
> than forking the hook.

## Data flow

Rules mode: FE `{ mode: "rules", question }` → `POST /api/ask-ai` → Zod rules branch
→ rules-mode `preparePromptInput` (core topics + question-scored System-3, no
rulings/zone/phase/scope) → provider → `applyRulesSecondPass` re-queries with the
answer, appends recovered verbatim rules → `{ answer }` → conversation thread.
Follow-ups append `conversationHistory` (no frozen object). Game (and card) mode are
byte-for-byte unchanged.

## Reuse (before creating)

- Backend: `conversationHistorySchema`, `ALWAYS_ON_TOPIC_IDS`, `collectCuratedRuleIds`,
  `formatGameRulesSection`, `formatSupplementalRulesSection`,
  `formatConversationHistorySection`, `SYSTEM_ROLE_PREAMBLE_LINES`,
  `MTG_PROMPT_REFERENCE`, the DEC-046 scorer internals (refactored to query-based, not
  re-implemented), `getPromptDiagnostics`, `buildMockAnswer` prompt exposure.
- Frontend: `ConversationThread`, follow-up composer + inline Send animation, start
  over, `useAskAiSubmitOrchestration` (generalized), the portal registry +
  `DestinationOutlet`, the `/data/*.json` fetch pattern, `env.ts` mock resolver.
- Data: `scripts/build-game-rules.mjs` (extend with the subset output),
  `gameRulesByTopic.json` (single source of truth).

## Sequencing

- **Slice A** (rules contract) — foundational; external prereq DEC-096 union.
- **Slice B** (rules prompt + query-based System-3) — depends on A.
- **Slice C** (answer-seeded second pass) — depends on B.
- **Slice D** (core-topics artifact + build) — independent; parallel with A/B/C.
- **Slice E** (frontend view + entry — ship) — depends on A (payload shape) and D
  (browse artifact); external prereqs feature-portal (shipped) + card-lookup-qa
  conversation reuse. Buildable/unit-testable against A's types + D's artifact before
  B/C merge; a full mock-provider E2E of the answer + second pass needs B and C.

Recommended order: **A and D in parallel → B → C**, with **E** built against A + D and
finished once B + C land. E is the ship/promotion slice.

## Verification checklist

- [ ] `npm --workspace apps/backend run test` green — rules discriminator validation
      (accepts `{ mode:"rules", question, conversationHistory? }`, rejects `gameContext`
      and `card`), default-`mode` back-compat, rules-mode prompt sections
      present/omitted (core topics + supplemental + MTG ref + verbatim guard present;
      general context / phase / zones / scope / rulings absent), query-based scorer
      parity for game mode, second-pass dedup + append, mock rules-mode prompt exposure
- [ ] `npm run test:eval` green — no game/card golden drift; a rules-mode fixture
      asserts core-topic presence, question-driven supplemental recall, and
      answer-seeded second-pass recovery of a rule the raw question missed (REQ-032 /
      DEC-047 extension)
- [ ] `npm run data:build` regenerates `gameRulesCoreTopics.json` from
      `gameRulesByTopic.json` with graceful degradation; the subset matches the curated
      excerpts (no drift)
- [ ] `npm --workspace apps/frontend run test` green — Rules Lookup destination
      registered; empty-state core-topics browse; "ask about this" pre-fill; blank-question
      submit blocked; `{ mode:"rules" }` payload shape; conversation reuse (assistant-first,
      hidden initial question, follow-up history, inline Send, start over → empty state);
      no frozen-context / zone / card controls
- [ ] `npm --workspace apps/frontend run typecheck` clean; `npm run quality:check`
      green for touched areas; `npm run lint` / `npm run format:check` clean
- [ ] Manual (`ASK_AI_PROVIDER=mock`): from the portal open Rules Lookup, read a core
      topic, "ask about this", submit, receive an answer, send a follow-up, start over —
      the assistant bubble shows the assembled rules-mode prompt and the appended
      recovered rules
- [ ] Contract stability: existing `{ question, gameContext }` (game) and
      `{ mode:"card", … }` requests validate and behave unchanged; success `{ answer }` /
      error shapes unchanged for both providers
