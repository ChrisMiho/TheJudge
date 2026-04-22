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

### AskAiRequest
- `question: string`
- `stack: StackItem[]`

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
- accept the final question and ordered stack payload
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
          "subtypes": ["Wizard"]
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
- ordered stack
- oracle text for each card
- mana cost and mana value for each card
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
