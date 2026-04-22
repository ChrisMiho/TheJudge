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
- AI Provider: Amazon Bedrock
- Bedrock Access: AWS SDK
- Storage: none for MVP1

## Data Model

### StackItem
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
- `caster: "Player 1" | "Player 2" | "Player 3" | "Player 4"`
- `targets: StackTarget[]` where each target is one of:
  - `{ kind: "stack", targetCardId: string, targetCardName: string }`
  - `{ kind: "battlefield", targetPermanent: string }`
  - `{ kind: "player", targetPlayer: "Player 1" | "Player 2" | "Player 3" | "Player 4" }`
  - `{ kind: "none" }`
- `contextNotes?: string`
- `manaSpent?: number` (prompt-facing fallback uses `manaValue` when omitted)

### GameContext
- `playerCount: number`
- `players: Array<{ label: "Player 1" | "Player 2" | "Player 3" | "Player 4"; lifeTotal: number }>`

### BattlefieldContextItem
- `name: string`
- `details?: string`
- `targets?: StackTarget[]`

### AskAiRequest
- `question: string`
- `stack: StackItem[]`
- `gameContext: GameContext`
- `battlefieldContext: BattlefieldContextItem[]`

### AskAiResponse
- `answer: string`

### AskAiError
- `error: string`
- `retryAfterSeconds?: number`

## Stack Ordering Rule
- `stack[0]` represents the bottom of the stack
- the last item in the array represents the top of the stack
- each newly added card is appended to the end of the array
- stack details UI displays cards bottom-to-top
- prompt builder must preserve this same order

## API Design

### Endpoint: `POST /api/ask-ai`
Purpose:
- accept the final question, ordered stack payload, and captured context payload fields
- validate input
- build the Bedrock prompt
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
      "stack": [
        {
          "cardId": "string",
          "name": "string",
          "oracleText": "string",
          "imageUrl": "string",
          "manaCost": "string",
          "manaValue": 0,
          "typeLine": "string",
          "colors": ["W", "U"],
          "supertypes": ["Legendary"],
          "subtypes": ["Wizard"],
          "caster": "Player 1",
          "targets": [
            { "kind": "player", "targetPlayer": "Player 3" },
            { "kind": "none" }
          ],
          "contextNotes": "optional freeform context",
          "manaSpent": 5
        }
      ],
      "gameContext": {
        "playerCount": 4,
        "players": [
          { "label": "Player 1", "lifeTotal": 40 },
          { "label": "Player 2", "lifeTotal": 37 },
          { "label": "Player 3", "lifeTotal": 22 },
          { "label": "Player 4", "lifeTotal": 18 }
        ]
      },
      "battlefieldContext": [
        {
          "name": "Rhystic Study",
          "details": "Tax effect relevant to stack decisions",
          "targets": [{ "kind": "none" }]
        }
      ]
    }

### Success Response

    {
      "answer": "string"
    }

### Error Response

    {
      "error": "string",
      "retryAfterSeconds": 13
    }

## Metadata Strategy
- use a static prebuilt metadata file committed with the app
- local metadata powers autocomplete and preview
- filter source records to english, paper-playable, non-digital cards with a non-empty name
- dedupe by normalized card name with deterministic tie-breaks (higher metadata completeness, then later release date, then stable ID)
- do not implement runtime sync/refresh in MVP1
- do not cache all card images in MVP1
- load images on demand

## AI Prompt Context Rules
The backend should include:
- final user question
- pre-stack game context (player count + life totals)
- optional battlefield context entries
- ordered stack
- oracle text for each card
- mana cost and mana value for each card
- mana spent per stack item (fallback to `manaValue` when omitted)
- type line with parsed supertypes/subtypes and colors
- instructions to explain reasoning
- instructions to state uncertainty
- instructions not to invent hidden state

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

### Phase A
- implement full frontend flow
- use a mock backend response
- validate search/add/stack/question/response UX

### Phase A Mock Response Rule
- keep the same success response contract as the real backend
- return the outbound request data as a debug-friendly JSON-formatted string inside `answer`
- use this to help inspect the exact payload shape being prepared for the LLM

### Example Mock Success Response

    {
      "answer": "MOCK RESPONSE\n{\n  \"question\": \"Resolve the stack\",\n  \"stack\": [...]\n}"
    }

### Phase B
- keep same contracts
- replace mock with real backend + Bedrock integration

## Dependencies
- Scryfall-derived metadata
- AWS Bedrock access
- AWS SDK credentials/config
- frontend/backend contract stability
