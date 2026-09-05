# integrations-and-data.md

## Summary
This file captures integrations, payloads, data rules, and delivery constraints.

## Tech Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- State: React state
- Card Data: local cached Scryfall-derived metadata
- Card Rulings: static Scryfall-derived WotC rulings artifact for backend prompt enrichment
- Images: image URLs, lazy-loaded
- Backend: Node.js + TypeScript
- API Framework: Express or Fastify
- Validation: request validation layer
- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers). **Canonical rule — mock-first local default:** local development defaults to the mock provider; the live OpenAI provider is opt-in via `ASK_AI_PROVIDER=openai` and is what production runs. This is the single authoritative statement; echoed in `overview.md`, `goals-and-non-goals.md`, `instructions/technical-design-rules.md`, `in-depth/README.md`, `quick-lookup/README.md`, `PRD/README.md`, and root `README.md` (enumerate by grep before amending — see `instructions/writing-rules.md`, grep-before-amend).
- Embedding Provider: backend embedding boundary for System 3 semantic rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical retrieval only and no embedding at all, `local` → bundled `all-MiniLM-L6-v2` run in-process, `openai` → OpenAI embeddings API, live mode only). Mirrors the `ASK_AI_PROVIDER` seam above and inherits its mock-first default: `mock` and `local` make no per-request external call (REQ-181).
- Provider Access: provider SDKs are backend-only
- Storage: none for the core product

## Data Model

### TurnPhase
- `"untap" | "upkeep" | "draw" | "main_1" | "combat" | "main_2" | "end_step" | "cleanup"`
- `stack_resolving` is removed; it was not a real MTG phase (DEC-034).
- Combat is one combined phase; sub-step precision is captured via the structured `CombatStep` field (DEC-037).

### CombatStep
- `"beginning_of_combat" | "declare_attackers" | "declare_blockers" | "combat_damage" | "end_of_combat"`
- Optional field on `GameContext`; present only when `turnPhase === "combat"`.
- Frontend default is `declare_blockers` (DEC-037).

### ZoneId
- `"stack" | "battlefield" | "hand" | "graveyard" | "exile" | "library" | "command"`

### ContextTarget
- one of:
  - `{ kind: "player"; targetPlayer: PlayerLabel }`
  - `{ kind: "card"; zone: ZoneId; cardId: string; cardName: string }`
  - `{ kind: "none" }`
  - `{ kind: "other"; targetDescription: string }`

### ZoneCardItem
- `cardId: string` — oracle id; the backend resolves this card's descriptive block server-side from it (REQ-176)
- `name: string`
- `imageUrl?: string` — local rendering only, not read by the prompt assembler; still sent on the wire (harmless, unused bytes) exactly as before this change
- `colors?: string[]` — local rendering only (the identity ring, REQ-058/DEC-078); not card-intrinsic prompt data, so it is stripped from the wire request the same as the descriptive block below, even though it stays on the frontend object
- `caster?: PlayerLabel`
- `targets?: ContextTarget[]`
- `contextNotes?: string`
- `manaSpent?: number` (prompt-facing fallback uses the server-resolved `manaValue` when omitted)
- the descriptive block (`oracleText`, `manaCost`, `manaValue`, `typeLine`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields by `cardId` from `cardDetailByOracleId.json` (REQ-175, REQ-176)

### GameContext
- `playerCount: number`
- `players: Array<{ label: PlayerLabel; lifeTotal: number; displayName?: string }>`
- `turnPhase: TurnPhase`
- `combatStep?: CombatStep` — present only when `turnPhase === "combat"`; ignored otherwise
- `activePlayer?: PlayerLabel`
- `selectedZones: ZoneId[]`
- `zones?: Partial<Record<ZoneId, ZoneCardItem[]>>`
- `gameStateNotes?: string` — optional freeform annotation for cross-card, transient game-state context not inferrable from submitted card oracle text (e.g. priority holder, active replacement/continuous effects, pending delayed triggers, casting restrictions). Omitted when blank; capped at 2000 characters. (DEC-043)
- `zones` includes only non-empty zone arrays. Empty selected zones are represented by `selectedZones`, not by empty arrays.
- `displayName` is optional UI/prompt text only. `label`, `activePlayer`, `caster`, `owner`, and player targets remain fixed `PlayerLabel` values.

### ConversationTurn
- `role: "user" | "assistant"`
- `content: string`

### CardPrintingPrice (Trade Balancer, frontend-only)
- `printingId: string` — Scryfall printing id
- `oracleId: string` — oracle identity the printing belongs to
- `name: string`
- `set: string` — set code
- `setName: string`
- `collectorNumber: string`
- `imageUrl: string`
- `usd: number | null` — non-foil USD market price (null when unavailable)
- `usdFoil: number | null` — foil USD market price (null when unavailable)
- committed static artifact (DEC-088); not part of `AskAiRequest` or any prompt/response contract. A trade entry references one `CardPrintingPrice` plus a `foil: boolean` and `quantity: number` (≥ 1).

### AskAiRequest
- `question: string`
- `gameContext: GameContext`
- `conversationHistory?: ConversationTurn[]` — omitted on first decrypt; present on follow-up turns (DEC-038)

#### `conversationHistory` validation (when present)
- non-empty array
- max 20 turns
- max 2000 chars per message
- same control-character guardrails as `question`
- must start with `role: "user"` and alternate user/assistant
- last entry must be `role: "assistant"` (the prior assistant answer being continued)

#### History semantics by turn

| Turn | `question` | `gameContext` | `conversationHistory` |
| --- | --- | --- | --- |
| First decrypt | User question or zone-aware fallback | Live context | Omitted |
| Follow-up N | Current follow-up text | Frozen snapshot from first decrypt | Full prior exchange including hidden initial question |

The hidden initial user question (including fallback) is captured at first decrypt and included as the first entry in `conversationHistory` on follow-up turns; it is not shown in the UI thread.

### AskAiResponse
- `answer: string`

### AskAiError (failure JSON body)

Machine-readable codes and a human-readable message; optional metadata for tracing. Source of truth: `apps/backend/src/validation.ts` (`askAiErrorSchema`) and `apps/backend/src/errors.ts`.

- `code`: `VALIDATION_ERROR` | `PROVIDER_UNAVAILABLE` | `PROVIDER_TIMEOUT` | `UNEXPECTED_ERROR`
- `message`: human-readable string (user-facing copy may include product phrases such as failure handling in `DEC-016`)
- `metadata?`: optional object (strict keys only when present)
  - `correlationId?`: echoed request correlation id when available
  - `details?`: diagnostic string; only included when the server runs in a mode that exposes safe diagnostics (typically development)
- `retryAfterSeconds?`: positive integer seconds hint for retryable provider failures (e.g. availability / timeout)

HTTP status mapping (baseline):

- `400` with `code: VALIDATION_ERROR`
- `503` with `code: PROVIDER_UNAVAILABLE`
- `504` with `code: PROVIDER_TIMEOUT`
- `500` with `code: UNEXPECTED_ERROR`

Response header:

- `X-Correlation-Id` is set on ask-ai responses when correlation id resolution is used

## Zone and Stack Ordering Rules
- `stack[0]` represents the bottom of the stack
- the last item in the array represents the top of the stack
- each newly added card is appended to the end of the array
- stack details UI displays cards bottom-to-top
- prompt builder must preserve this same order
- non-stack zones are serialized in canonical order: battlefield, hand, graveyard, exile, library, command
- `gameContext.zones` omits selected zones that contain no cards

## API Design

### Endpoint: `POST /api/ask-ai`
Purpose:
- accept the final question and captured `gameContext`
- validate input
- build the AI prompt
- invoke the model
- return the response

### Endpoint: `GET /api/cards/:oracleId`
Purpose:
- serve one card's descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`) by Scryfall `oracle_id`, read-only, from the committed `cardDetailByOracleId.json` artifact (REQ-175)
- back the card-detail popup and Quick Lookup pre-submit preview's on-demand fetch (FLOW-024); a known id returns the block, an unknown id returns a not-found response
- the product's second product-facing endpoint (D5), permitted alongside `POST /api/ask-ai` by the one-endpoint rule (canonical: NFR-004)

### Optional Endpoint: `GET /api/health`
Purpose:
- local development checks
- deployment health checks
- uptime verification

## API Contracts

### Request

    {
      "question": "string",
      "gameContext": {
        "playerCount": 4,
        "players": [
          { "label": "Player 1", "lifeTotal": 40 },
          { "label": "Player 2", "lifeTotal": 37 },
          { "label": "Player 3", "lifeTotal": 22 },
          { "label": "Player 4", "lifeTotal": 18 }
        ],
        "turnPhase": "main_1",
        "activePlayer": "Player 1",
        "selectedZones": ["stack", "battlefield", "hand"],
        "zones": {
          "stack": [
            {
              "cardId": "counterspell-oracle-id",
              "name": "Counterspell",
              "imageUrl": "https://example.invalid/counterspell.jpg",
              "caster": "Player 2",
              "targets": [
                { "kind": "card", "zone": "stack", "cardId": "bottom-spell", "cardName": "Lightning Bolt" }
              ],
              "contextNotes": "Cast in response to Lightning Bolt",
              "manaSpent": 2
            }
          ],
          "battlefield": [
            {
              "cardId": "rhystic-study",
              "name": "Rhystic Study",
              "imageUrl": "",
              "targets": [{ "kind": "none" }],
              "contextNotes": "Tax effect relevant to stack decisions"
            }
          ]
        }
      }
    }

### Success Response

    {
      "answer": "string"
    }

### Error Response

    {
      "code": "PROVIDER_UNAVAILABLE",
      "message": "Miho is working on it",
      "metadata": {
        "correlationId": "uuid-or-opaque-id"
      },
      "retryAfterSeconds": 13
    }

## Metadata Strategy
- use a static prebuilt metadata file committed with the app
- the committed frontend metadata artifact carries only the up-front tile fields — `cardId` (oracle id), `name`, `imageUrl`, `colors` — and no descriptive block (REQ-174); descriptive fields are fetched on demand per card from the `GET /api/cards/:oracleId` endpoint (REQ-175, D5), on first card-detail open
- local metadata powers autocomplete and the tile (name, image, color ring); the card-detail popup and Quick Lookup pre-submit preview fetch the descriptive block from the endpoint on open (FLOW-024)
- filter source records to english, paper-playable, non-digital cards with a non-empty name
- dedupe by normalized card name with deterministic tie-breaks (higher metadata completeness, then later release date, then stable ID)
- do not implement runtime sync/refresh in the core product
- do not cache all card images in the core product
- load images on demand

## Rulings Data Strategy
- WotC rulings enrichment uses Scryfall bulk type `rulings`
- raw Scryfall rulings bulk data is gitignored and must not be committed
- Scryfall download or refresh requires explicit human approval before the command runs
- the committed backend artifact is `apps/backend/data/cardRulingsByOracleId.json`, a trimmed map keyed by Scryfall `oracle_id`
- the trimmed artifact includes only rows where `source === "wotc"` and the `oracle_id` exists in the committed card metadata `cardId` set
- `npm run data:build` rebuilds card metadata, card rulings, and game rules from local inputs
- `npm run data:refresh` downloads Scryfall bulk data and WotC CR source, then rebuilds local artifacts; agent-run refreshes require explicit human approval before any download command
- the backend loads the committed artifact at startup and omits rulings enrichment if the artifact is missing or has no matches
- runtime Scryfall fetches are out of scope for the core product

## Card Detail Data Strategy
- the card descriptive block is committed as a trimmed map keyed by Scryfall `oracle_id`, built by one builder from the same Scryfall bulk every other builder trims from; raw bulk stays gitignored and must not be committed
- each value carries `oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`
- the map is committed once, backend-only, under `apps/backend/data/cardDetailByOracleId.json`; there is no frontend copy
- the frontend fetches one card's block on demand from `GET /api/cards/:oracleId` (FLOW-024) and caches per card for the session; ask-ai reads the same backend map internally for server-side resolution (REQ-176)
- the backend map additionally carries each card's Scryfall `keywords` array, used only to build the System 3 retrieval query's keyword signal; it is not part of the on-demand card block the frontend fetches and adds nothing to the up-front payload (REQ-180)
- `GET /api/cards/:oracleId` is the product's second product-facing endpoint, authorized by D5 — the one-endpoint rule (canonical: NFR-004)
- `npm run data:build` rebuilds the map alongside card metadata, rulings, and game rules
- runtime Scryfall fetches are out of scope for the core product

## Game Rules Data Strategy
- general game-rules enrichment uses WotC Comprehensive Rules TXT from [magic.wizards.com/en/rules](https://magic.wizards.com/en/rules)
- Scryfall does not host Comprehensive Rules; cards and per-card rulings remain Scryfall-sourced
- raw CR source is gitignored at `apps/backend/data/cr/source.txt` and must not be committed
- WotC CR download or refresh requires explicit human approval before the command runs (same policy as Scryfall refresh)
- the committed topic manifest is `apps/backend/data/gameRulesTopicManifest.json`
- the committed backend artifacts are `apps/backend/data/gameRulesByTopic.json` (curated topic list) and `apps/backend/data/gameRulesRuleIndex.json` (flat rule index for supplemental retrieval); `build-game-rules.mjs` emits both in a single dual-output build
- topic rule numbers and excerpts are curated and human-signed-off during implementation; the manifest drives `build-game-rules.mjs` extraction
- `gameRulesRuleIndex.json` contains every individual rule entry with `ruleId`, `sectionTitle`, `text`, `searchText`, and `parentRuleIds`; it is used for signal-based supplemental rule retrieval and is excluded from git LFS requirements (JSON, not binary)
- `npm run data:build` rebuilds card metadata, card rulings, and game rules (topic JSON + rule index) from local inputs
- `npm run data:refresh` downloads Scryfall bulk data and WotC CR source, then rebuilds local artifacts; agent-run refreshes require explicit human approval before any download command
- build scripts degrade gracefully: missing CR source or failed extract keeps the prior committed artifacts and exits 0
- the backend loads both committed artifacts at startup and omits game-rules enrichment if the artifacts are missing or empty
- the rule index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule content and no rule id appears twice; a build test asserts both and fails when a CR refresh reintroduces either (REQ-179)
- System 3 semantic retrieval adds a committed per-rule embeddings artifact under `apps/backend/data/` holding one 384-dimension vector per entry in `gameRulesRuleIndex.json`, produced offline by a quantised `all-MiniLM-L6-v2`. There is no vector database — the vectors are loaded in-process and cosine-searched (REQ-181)
- the embeddings artifact is built by an offline step alongside `build-game-rules.mjs`, runs in the same `npm run data:build` / `data:refresh` chain, rebuilds only on CR refresh (skipped when a hash of the current rule index matches the hash the committed artifact was built from, so an unrelated `data:build` run doesn't re-embed for nothing), and degrades gracefully: a missing or malformed artifact, or one whose rule ids don't match the current rule index, disables the semantic path and System 3 falls back to lexical retrieval with one diagnostic warning
- the raw local embedding model download is gitignored (`apps/backend/data/models/`) and must not be committed; the deploy packaging script warms it once at build time and copies it into the deployment artifact so it ships with no per-request network dependency
- query embedding at request time is selected by `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, default `mock`); `mock` and `local` make no per-request external call, so System 3 keeps its no-per-request-external-call posture and the mock default runs with no model access; `openai` is seam-selectable for live mode only (REQ-181)
- runtime CR fetches are out of scope for the core product

## Commander Spellbook Combo Data Strategy

Commander Spellbook combo enrichment (DEC-116) is a backend-only prompt source layered onto the existing game and lookup modes; it does not add a product-facing endpoint or change `AskAiRequest`.

- source reads use Commander Spellbook's public **bulk export** (`variants.json.gz`), not its paginated REST API — the export supplies all ~106,000 reviewed variants in one unthrottled request, while a sustained cursor walk is rate-limited by upstream's load balancer with a bodiless `429` (DEC-162); only reviewed `OK` variants enter the corpus — upstream returns null steps, prerequisites, mana needed, notes, and every per-zone card-state field for `EXAMPLE` variants, so they cannot carry the context this enrichment depends on
- cards join on Commander Spellbook `oracleId` → TheJudge `cardId` (Scryfall `oracle_id`); printing identity is excluded
- network refresh is an explicit human-approved operation; invoking `data:refresh` is that approval, so the combo download runs in that chain beside the Scryfall and Comprehensive Rules refreshes (DEC-162). The raw bulk export and template-expansion responses stay gitignored under `apps/backend/data/commander-spellbook/`
- the committed backend artifacts are gzipped: `apps/backend/data/commanderSpellbookCombos.json.gz` (trimmed variant detail + source manifest, stored as concatenated individually-gzipped per-variant records) and `apps/backend/data/commanderSpellbookComboIndex.json.gz` (inverse oracle membership, template expansions, unresolved-template metadata, and a `variantId` → byte offset/length directory into the detail artifact). They measure 76.9 MB + 4.8 MB as committed, so no variant is dropped for size. The index is parsed once at first use; a detail lookup reads only that variant's byte range and gunzips only that slice, keeping resident memory bounded — which is the constraint that mattered, not load time or repository footprint (DEC-162)
- retained variant detail includes exact/template ingredients, quantities, starting zones, per-ingredient zone-scoped card state, per-ingredient `mustBeCommander`, produced effects, description/steps, mana needed, prerequisites, notes, popularity, and stable Commander Spellbook reference; price, image, bracket, and unrelated site payload fields are omitted
- card state is stored zone-scoped rather than as one string: upstream exposes separate battlefield, exile, graveyard, and library state, an ingredient may permit several starting zones simultaneously, and the hand and command zones carry no state at all
- upstream renders **camelCase** on the wire (`oracleId`, `zoneLocations`, `mustBeCommander`, `*CardState`): Django REST Framework applies `CamelCaseJSONRenderer` above the serializer, so the snake_case field names declared in upstream's Python models never reach a client. An earlier version of this line claimed the opposite; the build followed it and matched nothing against real data, so schema claims here must be verified against a real upstream response rather than against serializer source (DEC-162)
- query-backed templates are expanded during refresh through the authoritative Scryfall API URL supplied by Commander Spellbook; authoritative explicit replacements are used when exposed; templates with neither remain unresolved
- TheJudge does not parse Scryfall query syntax and does not maintain a manual template-replacement fork
- the build is deterministic and fail-safe: failed/partial refreshes do not replace a valid committed snapshot, and a build without fresh raw inputs preserves a valid prior artifact
- runtime matching is local, quantity-aware, instance-aware, and zone-aware; runtime never calls Commander Spellbook or Scryfall
- missing/invalid artifacts disable only combo enrichment and emit one diagnostic warning; the normal Ask AI path continues
- Commander Spellbook content is labeled community-sourced in the prompt and never overrides official card text, WotC rulings, or Comprehensive Rules
- mana, `mustBeCommander`, and card state are surfaced to the model but never deterministically checked; the submitted request carries no tapped, counter, control, or commander-designation data, so no candidate is ever rendered as "complete" (DEC-116, REQ-095)
- whether this enrichment actually improves answers is measured by an opt-in, confirmation-gated, human-reviewed A/B against the live provider — informational only, never a build gate (DEC-161, REQ-146)

## Card Scanning Data Strategy

Card scanning (DEC-050) is an optional, frontend-only, on-device input path; it does not
involve the backend, `POST /api/ask-ai`, or any prompt assembly.

- identification is by perceptual hash of the card artwork; matching runs entirely in the frontend with no network calls (DEC-051)
- the resize + perceptual-hash "recipe" has a single authoritative TypeScript definition, imported by both the on-device scanner and the offline library builder (no FE↔build duplication)
- the shipped fingerprint library is `apps/frontend/public/data/cardhashes.bin` — a little-endian binary file (`CARDHSH1` v1): per entry a UTF-8 id and a 96-byte hash (`R[32] || G[32] || B[32]`, packed MSB-first); the live bin holds 97,311 entries and does **not** include a `_card_back` reference (no canonical card-back asset; card-back detection is descoped — DEC-055); canonical card geometry is 745×1040 and Region A is `(30,105,715,520)`
- a companion `cardScanMap` bridge artifact (and a manifest) ship under `apps/frontend/public/data/`; the bridge maps Scryfall printing id → oracle id so matches resolve to existing `CardMetadataItem` records (DEC-053)
- scan artifacts are lazy-loaded only when the user first scans; users who never scan pay no startup cost (NFR-010)
- art-only matching returns a ranked candidate list; duplicate oracle ids collapse to one candidate by best distance; unresolvable candidates are dropped; resolved candidates feed the existing picker preview/add path and produce the same `ZoneCardItem` output as manual add
- printing-level identity is never pushed into `ZoneCardItem`, prompt context, or rulings lookup; gameplay/prompt identity stays oracle-level (`cardId`)
- `cardhashes.bin`, `cardScanMap`, and the manifest are generated offline from Scryfall card images using the same TS recipe; the build hashes Region A without auto-levels and excludes non-gameplay layouts (art_series, planar, scheme, vanguard, oversized, memorabilia, substitute/checklist, minigame)
- raw downloaded card images are gitignored and must not be committed; card-image download/refresh requires explicit human approval before the command runs (same policy as Scryfall/CR refresh)
- TheJudge owns and refreshes the library via the data pipeline; there is no runtime Scryfall fetch, no runtime library sync, and no dependence on an externally prebuilt database
- query-side processing applies auto-levels to the captured image only (never to database images); both 0°/180° orientations are hashed and the better match is chosen; the engine has no card-back detector — the previously-dormant `isCardBack()` method was removed as dead code — while the constructor still excludes the `_card_back` id from the searchable set; re-enabling card-back detection now requires reimplementing the detector in addition to supplying a `_card_back` reference asset (DEC-055)
- the live scanner converges via a temporal lock-in control layer (vote top-1 oracle identity across a rolling window, confidence + margin gated) that pauses auto-scan on lock and presents one confident card for one-tap Add; convergence knobs live in `apps/frontend/src/lib/scan/tuning.ts` (DEC-055)

## Trade Balancer Data Strategy

The Trade Balancer (DEC-087) is an optional, standalone, frontend-only, ephemeral feature; it does not involve the backend, `POST /api/ask-ai`, or any prompt assembly.

- pricing uses a committed, printing-level static price artifact under `apps/frontend/public/data/` (e.g. `cardPrintingPrices.json`), built offline from the Scryfall bulk source by a new build script alongside `data:build` / `data:refresh` (DEC-088, REQ-066)
- per printing the artifact carries at least: printing id, oracle id, card name, set code, set name, collector number, image url, `usd` (non-foil), and `usd_foil`; entries are indexable by oracle id (list a card's printings for the manual picker) and by printing id (a scanned printing prices directly)
- missing `usd`/`usd_foil` values are stored as null/absent and consumed as a $0 contribution with a distinct color and caution-triangle indicator in the UI (REQ-065)
- the artifact records a snapshot date; prices are a static build-time snapshot with **no runtime price fetch and no runtime sync** — refreshed only via the human-approved `data:refresh` then `data:build` (DEC-012 posture, NFR-013)
- the artifact is lazy-loaded only when the Trade Balancer is first opened; users who never open it pay no startup cost (NFR-013)
- raw downloaded bulk data remains gitignored; only the trimmed price artifact is committed
- a side total is `Σ qty × (foil ? usd_foil : usd)`; USD only (EUR/tix/etched-foil and grading/condition out of scope for v1)
- input reuses the existing scan resolver (DEC-053, REQ-036) and manual card search (DEC-012); the chosen printing is a pricing/display layer only and is never pushed into prompt context, rulings lookup, or the Decrypt-Stack request payload

## Feedback Delivery Strategy

Feedback & Bug Report (DEC-105) is a frontend-only feature; it does not involve the backend, `POST /api/ask-ai`, any prompt assembly, or any server-side state.

- delivery uses **Formspree** at `https://formspree.io/f/<id>`, where `<id>` is a **public, non-secret** form id read from `VITE_FEEDBACK_FORMSPREE_ID`; there is no backend route, no SES, and no secret
- `VITE_FEEDBACK_FORMSPREE_ID` is documented in `apps/frontend/.env.example` and may be committed and shipped in the client bundle (it is configuration, not a credential); when empty/unset (local/mock baseline) submit is a graceful no-op (disabled with a hint) and never throws (REQ-088)
- the client POSTs a JSON body: `category` (`"bug" | "suggestion" | "other"`), `message` (required freeform string), `email` (optional reply address; omitted/blank = anonymous), and `appState` — a single **JSON-stringified** field carrying the disclosed app-state snapshot
- the `appState` snapshot (built by a pure builder from a lazy `getFeedbackContext()` callback) includes: current screen/step, in-progress game context + typed question, zones/cards/enrichment, conversation history (if any), provider mode (mock/live), active portal destination, and environment (user-agent, viewport, route, timestamp, build/version)
- the snapshot is read-only presentation of existing app state; building or sending it never mutates app state, and the same content is shown to the user via the modal's expandable summary (REQ-087)
- submit distinguishes success, network error, and rate-limit; the draft is preserved on error for retry
- v1 sends no screenshots/file uploads (deferred) and performs no persistence, auth, in-app history, or analytics
- **owner setup (out-of-band, not code):** the product owner creates a Formspree account and a form directly on formspree.io — this is where the recipient email is registered, and it never enters the codebase, bundle, or any secret store — then supplies the resulting form id as `VITE_FEEDBACK_FORMSPREE_ID` (local `.env`, and the equivalent build-time env var in the prod deploy). Implementation ships complete and functional in the graceful-no-op state without this step; the owner's onboarding + id handoff is what turns delivery on, not an engineering task

## AI Prompt Context Rules

### Conversation history prompt section
When `conversationHistory` is present, backend prompt assembly inserts a `CONVERSATION HISTORY` section before `QUESTION`:
- formats each turn as `User: <content>` / `Assistant: <content>` in order
- history chars are capped at `MAX_CONVERSATION_HISTORY_CHARS` (`EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` per DEC-042 amendment; revisit after latency/cost sampling); oldest turns truncated first
- an `INSTRUCTIONS` line is added when history is present: treat follow-ups as refinements or clarifications against the frozen game state and prior answers
- history contribution is included in `getPromptDiagnostics`

The backend should include:
- final user question
- game context (player count, life totals, active player when provided, turn phase, combat sub-step when present)
- `ADDITIONAL GAME STATE` section containing `gameStateNotes` content, positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE`; omitted entirely when `gameStateNotes` is absent or blank after trim (DEC-043)
- phase-specific guidance block (`PHASE GUIDANCE`) positioned between `GENERAL GAME CONTEXT` (and `ADDITIONAL GAME STATE` when present) and zone sections; always present for a valid phase submission; combat guidance varies by `combatStep` when present (DEC-036)
- selected zones
- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; the card-intrinsic fields are resolved server-side by `cardId` from `cardDetailByOracleId.json` (REQ-176), targets and context notes come from the request; empty oracle emits `(none) — no oracle text recorded for this card`
- ordered stack zone when populated; stack section additionally includes stack role, caster, and mana spent per item
- non-stack sections use owner and zone item labels (`Hand 1`, `Battlefield 1`, etc.); `caster` is omitted for non-stack items
- mana spent per stack item (fallback to `manaValue` when omitted)
- published WotC Oracle rulings for submitted cards when available from the static backend artifact
- verbatim WotC Comprehensive Rules excerpts for curated general game-rules topics selected per DEC-045 (always-on core plus game-state-gated expansion) from the static backend artifact
- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked semantic-first against the committed per-rule embeddings with the exact-rule-id boost merged and lexical IDF scoring retained as the mock/offline default and failure fallback (DEC-046, REQ-181), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
- up to 5 eligible community-sourced Commander Spellbook variants: complete identity, quantity, and compatible-zone matches in game context, or labeled partial candidates for explicit combo questions; each ingredient carries the card state applicable to its matched zone plus `mustBeCommander`, with an instruction to check that state against the submitted board before calling a combo live; omit combo context otherwise and keep official Wizards card, rules, and rulings sources authoritative (DEC-116, REQ-094, REQ-095)
- static MTG reference block
- merged scope sentence for unselected zones and selected-but-empty zones
- instructions to explain reasoning
- instructions to state uncertainty
- instructions not to invent hidden state
- player display names in roster lines and resolved player references (`activePlayer`, caster, owner, player targets) using `Player N (Name)` when set
- official WotC rulings only as reference context; they do not override the user's submitted stack order, zones, targets, notes, or stated game state
- general game rules only as reference vocabulary; they do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text

The backend mock/debug response should:
- include explicit stack-order metadata (`stackOrderConvention`, `stackIndex`, `stackRole`)
- omit `imageUrl` from LLM-facing debug payload output

The backend may include:
- assume a Magic game with 2 or more players
- assume the cards are legal plays for the interaction being discussed

The backend must not add:
- format rules
- commander-specific validation
- legality engine logic
- board-state simulation logic
  (canonical rule: `goals-and-non-goals.md` Scope Notes)

WotC rulings prompt enrichment must:
- be omitted entirely when no submitted card has matching WotC rulings
- include only cards present in the submitted `gameContext`
- look up submitted cards by `cardId`, which corresponds to Scryfall `oracle_id` in the metadata pipeline
- preserve submitted card ordering, including bottom-to-top stack order
- avoid printing `cardId` or `oracle_id` in the model-facing prompt text
- use per-card and whole-section caps so `MAX_PROMPT_CHAR_BUDGET` remains authoritative
- appear after populated zone sections and before `SCOPE` and `QUESTION`

Game rules prompt enrichment must:
- include curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) from the committed artifact
- render selected topics in stable manifest `id` order with verbatim WotC CR prose only
- appear after populated zone sections and before `OFFICIAL RULINGS`, then `SCOPE` and `QUESTION`
- be omitted only when the artifact is missing or empty
- respect `MAX_PROMPT_CHAR_BUDGET` (`EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` per DEC-042 amendment; revisit after latency/cost sampling)

## Delivery Strategy

### Provider modes

#### `mock`
- default local provider mode
- returns a debug-friendly response using the same success contract as live answers, plus optional mock-only debug sidecars (DEC-033)
- validates flow, payload shape, prompt context, and enrichment trace without model access
- for post-decrypt chat, every mock response is still a normal `{ answer }` success response so the frontend preserves and appends to the visible conversation thread
- mock success response may include optional `context`, `diagnostics`, and `enrichmentDebug` alongside required `answer`
- frontend and OpenAI provider continue using `{ answer }` only

#### `openai`
- live answer generation through the backend provider boundary
- keeps `POST /api/ask-ai` request and response shapes unchanged
- successful live answers emit log-only response-size diagnostics (`answerChars`, `estimatedAnswerTokens`, `charsPerTokenEstimate`) per DEC-049 / REQ-033
- runtime config, env vars, and local auth: `apps/backend/src/providers/README.md`
- confirmed provider rules: `DEC-020` in `sections/decisions.md`

### Live Response Size Diagnostics
- response-size diagnostics are computed from the final `answer` string returned by the provider boundary after provider text extraction
- diagnostics are emitted only through backend lifecycle logs, correlated by `X-Correlation-Id`
- diagnostics use the same 4-characters-per-token estimate convention as mock prompt stats
- diagnostics are not included in `AskAiResponse`, prompt text, assistant answer text, frontend UI, prompt preview artifacts, or conversation history
- provider-native usage metadata and exact billing token accounting are out of scope for this diagnostic surface

### Mock Response Rule
- keep the same required success field as live answers: `answer` (string)
- embed the exact LLM prompt in `answer` under the stable `FULL PROMPT (SENT TO PROVIDER)` section, preceded by prompt budget stats
- for follow-up turns, the embedded prompt is the prompt assembled for that current user message and includes `CONVERSATION HISTORY`, the frozen first-decrypt `gameContext`, and all applicable prompt sections such as `PHASE GUIDANCE`
- optionally attach mock-only sidecars for developer review: `context`, `diagnostics`, `enrichmentDebug` (DEC-033)
- collect enrichment debug only when `ASK_AI_PROVIDER=mock`
- use `npm run prompt:preview` to materialize per-fixture review files under gitignored `output/prompt-preview/` (NFR-009)

### Example Mock Success Response

    {
      "answer": "MOCK RESPONSE\n...\nFULL PROMPT (SENT TO PROVIDER)\n\n<assembled prompt text>",
      "context": { "...": "normalized PromptContext" },
      "diagnostics": { "promptChars": 12345, "promptBudgetChars": 1000000, "...": "..." },
      "enrichmentDebug": { "supplemental": { "...": "..." }, "...": "..." }
    }

### Prompt preview developer workflow

- `npm run prompt:preview` — default curated success fixtures
- `npm run prompt:preview:all` — all eval fixtures including expected API error paths
- each fixture writes a separate directory with labeled files (`production.prompt.txt`, sidecar JSON, or `api-error.json` for non-2xx)
- see `apps/backend/src/eval/fixtures/README.md` and NFR-009

## Dependencies
- Scryfall-derived metadata
- OpenAI API access (when `ASK_AI_PROVIDER=openai`)
- frontend/backend contract stability
