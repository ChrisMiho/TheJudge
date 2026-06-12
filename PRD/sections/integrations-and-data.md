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
- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers)
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
- `cardId: string`
- `name: string`
- `oracleText: string`
- `imageUrl: string`
- `manaCost: string`
- `manaValue: number`
- `typeLine: string`
- `colors: string[]`
- `supertypes: string[]`
- `subtypes: string[]`
- `caster?: PlayerLabel`
- `targets?: ContextTarget[]`
- `contextNotes?: string`
- `manaSpent?: number` (prompt-facing fallback uses `manaValue` when omitted)

### GameContext
- `playerCount: number`
- `players: Array<{ label: PlayerLabel; lifeTotal: number; displayName?: string }>`
- `turnPhase: TurnPhase`
- `combatStep?: CombatStep` — present only when `turnPhase === "combat"`; ignored otherwise
- `activePlayer?: PlayerLabel`
- `selectedZones: ZoneId[]`
- `zones?: Partial<Record<ZoneId, ZoneCardItem[]>>`
- `gameStateNotes?: string` — optional freeform annotation for cross-card, transient game-state context not inferrable from submitted card oracle text (e.g. priority holder, active replacement/continuous effects, pending delayed triggers, casting restrictions). Omitted when blank. (DEC-043)
- `zones` includes only non-empty zone arrays. Empty selected zones are represented by `selectedZones`, not by empty arrays.
- `displayName` is optional UI/prompt text only. `label`, `activePlayer`, `caster`, `owner`, and player targets remain fixed `PlayerLabel` values.

### ConversationTurn
- `role: "user" | "assistant"`
- `content: string`

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
              "cardId": "uuid-or-stable-card-id",
              "name": "Counterspell",
              "oracleText": "Counter target spell.",
              "imageUrl": "https://example.invalid/counterspell.jpg",
              "manaCost": "{U}{U}",
              "manaValue": 2,
              "typeLine": "Instant",
              "colors": ["U"],
              "supertypes": [],
              "subtypes": [],
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
              "oracleText": "Whenever an opponent casts a spell, you may draw a card unless that player pays {1}.",
              "imageUrl": "",
              "manaCost": "{2}{U}",
              "manaValue": 3,
              "typeLine": "Enchantment",
              "colors": ["U"],
              "supertypes": [],
              "subtypes": [],
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
- local metadata powers autocomplete and preview
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
- runtime CR fetches are out of scope for the core product

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
- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; empty oracle emits `(none) — no oracle text recorded for this card`
- ordered stack zone when populated; stack section additionally includes stack role, caster, and mana spent per item
- non-stack sections use owner and zone item labels (`Hand 1`, `Battlefield 1`, etc.); `caster` is omitted for non-stack items
- mana spent per stack item (fallback to `manaValue` when omitted)
- published WotC Oracle rulings for submitted cards when available from the static backend artifact
- verbatim WotC Comprehensive Rules excerpts for all curated general game-rules topics from the static backend artifact
- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, scored against the request context and deduplicated against the curated baseline
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

WotC rulings prompt enrichment must:
- be omitted entirely when no submitted card has matching WotC rulings
- include only cards present in the submitted `gameContext`
- look up submitted cards by `cardId`, which corresponds to Scryfall `oracle_id` in the metadata pipeline
- preserve submitted card ordering, including bottom-to-top stack order
- avoid printing `cardId` or `oracle_id` in the model-facing prompt text
- use per-card and whole-section caps so `MAX_PROMPT_CHAR_BUDGET` remains authoritative
- appear after populated zone sections and before `SCOPE` and `QUESTION`

Game rules prompt enrichment must:
- include all curated topics from the committed artifact on every request in current scope
- render topics in stable manifest `id` order with verbatim WotC CR prose only
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
- runtime config, env vars, and local auth: `apps/backend/src/providers/README.md`
- confirmed provider rules: `DEC-020` in `sections/decisions.md`

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
