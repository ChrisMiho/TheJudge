# integrations-and-data.md

## Summary
This file captures integrations, payloads, data rules, and delivery constraints.

## Tech Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- State: React state
- Card Data: local cached Scryfall-derived metadata
- Images: image URLs, lazy-loaded
- Backend: Node.js + TypeScript
- API Framework: Express or Fastify
- Validation: request validation layer
- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers)
- Provider Access: provider SDKs are backend-only
- Storage: none for the core product

## Data Model

### TurnPhase
- `"untap" | "upkeep" | "draw" | "main_1" | "combat" | "main_2" | "end_step" | "cleanup" | "stack_resolving"`
- Combat is intentionally combined; combat sub-step details belong in the question or notes.

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
- `activePlayer?: PlayerLabel`
- `selectedZones: ZoneId[]`
- `zones?: Partial<Record<ZoneId, ZoneCardItem[]>>`
- `zones` includes only non-empty zone arrays. Empty selected zones are represented by `selectedZones`, not by empty arrays.
- `displayName` is optional UI/prompt text only. `label`, `activePlayer`, `caster`, `owner`, and player targets remain fixed `PlayerLabel` values.

### AskAiRequest
- `question: string`
- `gameContext: GameContext`

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

## AI Prompt Context Rules
The backend should include:
- final user question
- game context (player count, life totals, active player when provided, turn phase)
- selected zones
- populated zone sections
- ordered stack zone when populated
- oracle text for each card
- mana cost and mana value for each card
- mana spent per stack item (fallback to `manaValue` when omitted)
- type line with parsed supertypes/subtypes and colors
- static MTG reference block
- merged scope sentence for unselected zones and selected-but-empty zones
- instructions to explain reasoning
- instructions to state uncertainty
- instructions not to invent hidden state
- player display names in roster lines and resolved player references (`activePlayer`, caster, owner, player targets) using `Player N (Name)` when set

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

## Delivery Strategy

### Provider modes

#### `mock`
- default local provider mode
- returns a debug-friendly response using the same success contract as live answers
- validates flow, payload shape, and prompt context without model access

#### `openai`
- live answer generation through the backend provider boundary
- keeps `POST /api/ask-ai` request and response shapes unchanged
- runtime config, env vars, and local auth: `apps/backend/src/providers/README.md`
- confirmed provider rules: `DEC-020` in `sections/decisions.md`

### Mock Response Rule
- keep the same success response contract as the real backend
- return the outbound request data as a debug-friendly JSON-formatted string inside `answer`
- use this to help inspect the exact payload shape being prepared for the LLM

### Example Mock Success Response

    {
      "answer": "MOCK RESPONSE\n{\n  \"question\": \"Resolve the stack\",\n  \"gameContext\": {...}\n}"
    }

## Dependencies
- Scryfall-derived metadata
- OpenAI API access (when `ASK_AI_PROVIDER=openai`)
- frontend/backend contract stability
