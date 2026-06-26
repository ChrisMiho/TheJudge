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

