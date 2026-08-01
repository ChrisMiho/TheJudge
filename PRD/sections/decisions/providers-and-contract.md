# Providers and contract decisions

Backend provider boundary, API contract shape, and response sidecars/diagnostics.

### DEC-010
- Decision: The core product uses one main product-facing backend endpoint.
- Status: confirmed
- Context: The backend should remain intentionally small.
- Impact:
  - no separate product-facing endpoints for card lookup, stack creation, or prompt generation
- Related requirements:
  - REQ-012
- Notes:

### DEC-011
- Decision: The old staged provider rollout is superseded by explicit provider modes.
- Status: superseded
- Context: Historical Phase A used mock responses before planned Bedrock integration.
- Impact:
  - frontend flow can be validated with `ASK_AI_PROVIDER=mock`
- Related requirements:
  - REQ-013
  - REQ-014
- Notes:

### DEC-012
- Decision: The core product uses a static prebuilt metadata file committed with the app.
- Status: confirmed
- Context: Runtime metadata syncing would add unnecessary complexity.
- Impact:
  - autocomplete and preview rely on bundled data
- Related requirements:
  - REQ-002
  - REQ-003
- Notes:

### DEC-014
- Decision: AI failures preserve stack, question, and previous successful response, and expose a retry button with a 13-second cooldown.
- Status: confirmed
- Context: Live gameplay requires resilience without wiping user progress.
- Impact:
  - error handling must preserve state
- Related requirements:
  - REQ-014
- Notes:

### DEC-016
- Decision: AI failure copy should use the phrase **Miho is working on it**.
- Status: confirmed
- Context: Humorous failure copy was requested and is now explicitly defined.
- Impact:
  - error-state messaging is consistent
- Related requirements:
  - REQ-014
- Notes:

### DEC-017
- Decision: Mock provider responses should return the outbound request payload as a debug-friendly JSON-formatted string inside the `answer` field.
- Status: confirmed
- Context: The mock flow should help inspect and tune the request shape before real LLM integration.
- Impact:
  - the frontend can debug request composition without changing response contracts
- Related requirements:
  - REQ-013
- Notes:

### DEC-020
- Decision: Live answer generation uses an explicit backend provider flag with OpenAI behind the existing provider interface; HTTP contracts stay frozen across provider swaps.
- Status: confirmed
- Context: The current provider model replaces the earlier mock-only path with a swappable provider boundary while preserving staged UX and request/response shapes.
- Impact:
  - `POST /api/ask-ai` request and success/error response shapes remain unchanged when switching providers
  - provider selection is explicit via `ASK_AI_PROVIDER` (`mock` default, `openai` live); do not infer provider mode from `NODE_ENV` or deploy target
  - OpenAI credentials and API keys remain backend-only (see `instructions/secrets-handling.md` and `apps/backend/src/providers/README.md`)
  - upstream provider failures map to normalized API error codes with optional `retryAfterSeconds`
  - frontend and backend remain independently deployable release units
  - stack order semantics (`stack[0]` bottom, last item top) must stay consistent across UI, API payloads, and prompt-building logic
- Related requirements:
  - REQ-006
  - REQ-012
  - REQ-013
  - REQ-014
- Notes:
  - supersedes retired provider-stage wording in `sections/integrations-and-data.md` where they conflict
  - route handlers stay contract-focused; provider SDK wiring lives only in provider/factory composition

### DEC-033
- Decision: The mock provider may return optional debug sidecar fields on `POST /api/ask-ai` success responses; the OpenAI provider and frontend contract remain `{ answer }` only.
- Status: confirmed
- Context: Prompt enrichment review today requires reading the mock `answer` blob or eval goldens that skip the full `/api/ask-ai` path. A local `npm run prompt:preview` workflow needs structured artifacts without new routes or frontend changes.
- Impact:
  - `askAiResponseSchema` accepts optional `context`, `diagnostics`, and `enrichmentDebug` on success responses
  - mock provider populates all sidecars from `preparePromptInput` plus enrichment debug collected only when `ASK_AI_PROVIDER=mock`
  - OpenAI provider continues returning `{ answer }` only
  - frontend reads `answer` only; no UI or request-shape changes
  - `enrichmentDebug` exposes supplemental retrieval scores/runner-ups, curated topic manifest snapshot, and rulings inclusion trace not present in aggregate diagnostics
  - error responses remain the existing `askAiErrorSchema` shape; preview tooling captures them per fixture for frontend-visible error review
  - DEC-020 frozen success contract for live provider is preserved; optional fields are mock-only additions
- Related requirements:
  - NFR-009
  - REQ-012
  - REQ-013
- Notes:
  - do not add `promptText` as a separate response field; parse from the stable `FULL PROMPT (SENT TO PROVIDER)` section in mock `answer`
  - `MAX_PROMPT_CHAR_BUDGET` raised to `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042 amendment to DEC-030

### DEC-049
- Decision: Live LLM response-size diagnostics are log-only statistics computed from the returned answer text; they are not prompt input, product answer text, frontend UI, or response sidecars.
- Status: confirmed
- Context: Mock mode already exposes prompt-size stats for local debugging, but the live provider path lacks lightweight visibility into how large model answers are. This makes it harder to compare real provider behavior against mock/local expectations after prompt-size and retrieval-tuning work. The debug need is response-size observability, not a product-facing contract change.
- Impact:
  - after a successful live provider invocation, backend lifecycle logs include answer-size fields derived from the final `answer` string returned to the caller
  - required fields are `answerChars`, `estimatedAnswerTokens`, and `charsPerTokenEstimate`
  - `estimatedAnswerTokens` uses the same 4-characters-per-token heuristic as the existing mock prompt stats; this remains an estimate, not provider-native token accounting
  - `POST /api/ask-ai` success responses from the OpenAI/live provider remain `{ answer }`
  - response-size stats are not appended to `answer`, not included in `context`, `diagnostics`, or `enrichmentDebug`, and not added to `conversationHistory`
  - prompt construction and prompt diagnostics remain unchanged; this decision does not add hidden prompt context or provider-response metadata to the model input
  - provider-native usage metadata, exact billing token accounting, durable analytics storage, and frontend debug displays remain out of scope unless a later decision adds them
- Related requirements:
  - REQ-033
- Notes:
  - preserves DEC-020 live provider contract stability and DEC-033's mock-only sidecar boundary

### DEC-071
- Decision: When the committed card-metadata build (`build-card-metadata.mjs`) picks the single representative printing per oracle id, it biases toward a **standard paper printing** and demotes special treatments — Secret Lair, promos, `funny`/joke sets, and special-frame treatments (borderless/extended/showcase) — applying this preference **before** the existing most-recent (`released_at`) tiebreak, and only falling back to a special printing when no standard printing exists. This refines DEC-012's representative-printing selection (the static metadata artifact); it does not change the metadata file's existence, runtime usage, or contract.
- Status: confirmed
- Context: `choosePreferredCard` selects the representative printing per oracle id by metadata-quality score, then newest `released_at`, then a deterministic key. Because newest wins the quality tie, a card whose most recent printing is a Secret Lair or special treatment surfaces that non-standard art as the typed-search representative, which users found unrepresentative of the "normal" card. The fix is a build-time preference signal layered into the existing tiebreak chain; it changes only which printing's `imageUrl`/representative fields land in `cardMetadata.json` for typed search, with no runtime, contract, or schema impact.
- Impact:
  - `choosePreferredCard` gains a standard-print preference applied after the metadata-quality score and **before** the `released_at` recency tiebreak: among equal-quality candidates, a standard paper printing beats a special-treatment printing; ties within the same standard/special class fall through to the existing recency then deterministic-key tiebreaks
  - "standard" is determined from Scryfall printing signals (e.g. `set_type` for Secret Lair/`funny`/promo classes, promo flags, and special `frame_effects`/`border_color` such as borderless/extended/showcase); the exact predicate is a build-time classification detail validated by outcome (representative images look standard), not a product open question
  - behavior stays "most recent **among standard** prints"; a special printing is chosen only when no standard printing exists for that oracle id, so cards that exist solely as special treatments still resolve
  - affects the typed-search path only (`CardMetadataItem` representative image and fields); the scan path is unaffected because DEC-070 displays the scanned printing's art directly
  - build-time only: no change to `AskAiRequest`, the metadata file format/runtime load, card search behavior beyond which printing represents a card, the provider boundary, or any product-facing endpoint; `cardMetadata.json` is regenerated by the existing `data:build` step
- Related requirements:
  - REQ-049
  - REQ-001
  - REQ-002
- Notes:
  - refines DEC-012; the static committed metadata artifact and its no-runtime-sync posture are unchanged
  - the standard-print classification is an outcome-validated build classification, not a product open question; revisit only if a class of cards surfaces an unrepresentative image

### DEC-096
- Decision: `AskAiRequest` gains a `mode` discriminator on the existing `POST /api/ask-ai` endpoint, keeping one product-facing endpoint (DEC-010). `mode: "game"` is the current staged flow and is the default when `mode` is absent (back-compat for existing clients). `mode: "card"` is single-card lookup: it carries a dedicated single-card reference and **no** `gameContext`. This is an additive amendment to the DEC-020 frozen contract (same pattern as DEC-038's optional `conversationHistory` field); success `{ answer }` and error response shapes are unchanged for both modes and both providers.
- Status: superseded
- Context: The lookup suite (card-lookup-qa, later rules-lookup) needs a lightweight Ask AI entry that asks about one card with no user-staged zones, stack, or phase. DEC-010 and the technical-design rules forbid extra product-facing endpoints, so the shape must ride the existing endpoint. A discriminated union keyed on `mode` keeps `game` untouched while giving `card` a smaller, purpose-fit payload, and leaves room to add optional lightweight context to the card branch additively in the future (Q-003) without a new endpoint or a breaking change.
- Impact:
  - `AskAiRequest` becomes a `mode`-discriminated union; `mode` is optional-with-default `"game"` so existing `{ question, gameContext, conversationHistory? }` requests remain valid unchanged
  - `mode: "card"` payload is `{ mode: "card", question, card: <single-card reference>, conversationHistory? }` with no `gameContext`; backend Zod rejects `gameContext` on card mode and rejects `card` on game mode
  - the single-card reference reuses the existing committed card identity (oracle-level `cardId`/`CardMetadataItem`); no new identity model and no printing-level identity in the prompt
  - `conversationHistory` stays optional and is validated identically in both modes (DEC-038 rules unchanged); card-mode follow-ups send the same history shape
  - the third suite mode `mode: "rules"` is reserved for `rules-lookup` and is out of scope here; this decision introduces only `"game"` and `"card"`
  - `POST /api/ask-ai` route path, provider boundary (DEC-020), and `ASK_AI_PROVIDER` selection are unchanged; mock/OpenAI providers both honor the union
  - card-mode prompt assembly is specified by DEC-097 and REQ-074; this decision governs the request contract only
- Related requirements:
  - REQ-072
  - REQ-019
  - REQ-012
- Notes:
  - amends DEC-020 contract freeze additively, exactly as DEC-038 did; no existing field changes meaning
  - future extension of card mode to carry optional lightweight game context is tracked as Q-003 and is explicitly out of v1 scope
  - superseded by DEC-106: quick-lookup refinement unifies card-lookup-qa and rules-lookup into one Quick Lookup destination with one `mode: "lookup"` branch, replacing this `mode: "card"` branch before it shipped

### DEC-098
- Decision: The DEC-096 `mode` discriminator on `POST /api/ask-ai` gains the third reserved branch `mode: "rules"` for `rules-lookup`. The `mode: "rules"` payload is `{ mode: "rules", question, conversationHistory? }` — no `gameContext` and no `card`, because rules lookup carries neither game state nor a single-card reference. This is an additive amendment to the DEC-020 / DEC-096 contract in the same pattern as DEC-096 itself; success `{ answer }` and error response shapes are unchanged for all three modes and both providers.
- Status: superseded
- Context: DEC-096 introduced the `mode` union and explicitly reserved `mode: "rules"` for `rules-lookup` as out-of-scope-there. Rules lookup asks a general rules question with no user-staged zones, stack, phase, or card, so its branch is the smallest of the three: just the question plus optional follow-up history. Riding the existing endpoint keeps DEC-010's single product-facing endpoint intact.
- Impact:
  - `AskAiRequest`'s `mode`-discriminated union adds a third variant; `mode: "rules"` payload is `{ mode: "rules", question, conversationHistory? }`
  - backend Zod rejects `gameContext` and `card` on rules mode; `question` character cap and control-character guardrails are identical across all modes
  - `conversationHistory` is optional and validated by the existing DEC-038 rules unchanged; rules-mode follow-ups send the same history shape
  - success `{ answer }` and error response shapes are unchanged for rules mode and both `ASK_AI_PROVIDER` providers; route path and provider boundary are unchanged
  - rules-mode prompt assembly and answer composition are specified by DEC-100 / REQ-077 / REQ-078; this decision governs the request contract only
  - mock provider honors the rules branch (exposes the assembled rules-mode prompt consistent with DEC-017 / DEC-033); OpenAI provider returns `{ answer }` only
- Related requirements:
  - REQ-076
  - REQ-072
  - REQ-012
- Notes:
  - amends DEC-096 / DEC-020 additively; no existing field changes meaning
  - completes the three-mode union (`game`, `card`, `rules`); no further modes are introduced here
  - superseded by DEC-106: this reserved slot is retired before shipping, replaced by the unified `mode: "lookup"` branch

### DEC-106
- Decision: `AskAiRequest` uses a `"game" | "lookup"` mode discriminator (DEC-096). `mode: "game"` (default, absent = back-compat) is unchanged from DEC-096/DEC-020. `mode: "lookup"` is the single Quick Lookup entry: `{ mode: "lookup", question, card?: <single oracle-level card reference>, conversationHistory? }`. `card` is optional — its presence or absence is what the backend branches on (DEC-107); `gameContext` is rejected on lookup mode. This replaced DEC-096's `mode: "card"` branch and retired the `mode: "rules"` slot DEC-098 reserved, since Quick Lookup (DEC-107) unifies what would have been separate card-lookup and rules-lookup destinations into one entry with one wire shape.
- Status: confirmed
- Context: card-lookup-qa and rules-lookup were originally scoped as two destinations with two wire shapes (`mode: "card"` carrying a card, `mode: "rules"` carrying only a question) before either shipped. Refining them into one Quick Lookup destination — one "optionally attach a card" ask path — makes two wire shapes for one product surface an unnecessary fork; a single `mode: "lookup"` branch with an optional `card` field matches the product shape exactly and keeps the additive-amendment pattern DEC-096/DEC-038 established.
- Impact:
  - `AskAiRequest` union is `{ mode?: "game", question, gameContext, conversationHistory? } | { mode: "lookup", question, card?: <card reference>, conversationHistory? }`
  - backend Zod rejects `gameContext` on lookup mode; `card` and `gameContext` are mutually exclusive with each other across both modes
  - the single-card reference reuses the existing committed card identity (oracle-level `cardId`/`CardMetadataItem`); no new identity model and no printing-level identity in the prompt
  - `question` character cap and control-character guardrails are identical across both modes
  - `conversationHistory` stays optional and is validated identically in both modes (DEC-038 rules unchanged)
  - success `{ answer }` and error response shapes are unchanged; `POST /api/ask-ai` route path and provider boundary are unchanged
  - card-mode-shaped and rules-mode-shaped prompt assembly are both specified by DEC-107; this decision governs the request contract only
- Related requirements:
  - REQ-072
  - REQ-019
  - REQ-012
- Notes:
  - supersedes DEC-096's `mode: "card"` branch and DEC-098's `mode: "rules"` reservation; `mode: "game"` default/back-compat behavior originally introduced by DEC-096 is restated here unchanged
  - future extension of the `card` field to carry optional lightweight game context is tracked as Q-003 and is out of v1 scope
