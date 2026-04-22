# TheJudge

TheJudge is an MVP card-stack interaction assistant for Magic gameplay questions.
It helps players build an ordered stack of cards, ask a question, and receive an AI-generated explanation through a backend API.

## Start Here

- Product planning and story source of truth: `PRD/README.md`
- This root README is for fast onboarding, setup, and implementation status.
- If you are using coding agents, point them to `PRD/README.md` first.

## MVP1 Goal

Validate the end-to-end user flow before full Bedrock integration:

- search and preview cards from local metadata
- build an ordered stack bottom-to-top
- submit an optional question (with fallback behavior)
- receive a mock AI answer via backend contract-compatible endpoint
- preserve user state on failure with controlled retry UX

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Zod validation
- Testing: Vitest (frontend and backend)
- Data: Scryfall-derived local metadata transform pipeline
- Architecture: npm workspaces monorepo (`apps/frontend`, `apps/backend`)

## Repository Layout

- `PRD/`
  - `README.md` control plane for product docs and read order
  - `sections/` product truth (requirements, decisions, flows, constraints)
  - `instructions/` generation and editing rules
  - `stories/` implementation slices and Definition of Done
- `apps/frontend/` MVP client app
- `apps/backend/` API app (`POST /api/ask-ai`, `GET /api/health`)
- `scripts/` shared dev/data scripts (including metadata build)

## Local Setup

1. Install dependencies from repo root:
   - `npm install`
2. Prepare card metadata source file:
   - place Scryfall bulk file at `apps/frontend/data/scryfall/default-cards.json`
3. Build trimmed metadata:
   - `npm run data:build`
4. Start both apps:
   - `npm run dev`
5. Optional checks:
   - frontend: `http://localhost:5173`
   - backend health: `http://localhost:3000/api/health`

## Useful Commands

- `npm run dev` - run frontend + backend together
- `npm run dev:frontend` - run frontend only
- `npm run dev:backend` - run backend only
- `npm run build` - build both apps
- `npm --workspace apps/frontend run test` - run frontend tests
- `npm --workspace apps/backend run test` - run backend tests
- `npm --workspace apps/backend run test:eval` - run backend eval harness test
- stop running processes with `Ctrl + C`

## Current Feature Status

Implemented flow and platform pieces:

- [x] search input with threshold and no-match behavior
- [x] card preview before add
- [x] stack add/remove and stack details
- [x] duplicate blocking (MVP simplification) and stack cap of 10
- [x] optional question with fallback `Resolve the stack`
- [x] backend request validation and mock `POST /api/ask-ai`
- [x] failure state with retry cooldown behavior
- [x] metadata transform pipeline + runtime metadata loading from `public/data/cardMetadata.json`
- [x] backend prompt context builder, normalization, and fixture-based eval harness

## Story Checklist (Track Progress Here)

Context and prompt quality:

- [x] `STORY-001` context contract and builder
- [x] `STORY-002` context normalization and guardrails
- [x] `STORY-003` context evaluation harness
- [x] `STORY-004` explicit stack-order signaling

Pending implementation backlog:

- [ ] `STORY-010` tune metadata filtering and dedupe policy
- [ ] `STORY-005` add metadata transform contract tests and broader search scenarios
- [ ] `STORY-006` add UI-focused frontend coverage for search/add/decrypt
- [ ] `STORY-007` add API base URL environment config and deployment targets
- [ ] `STORY-008` replace empty-state emoji with bundled cat-wizard asset (after approval)
- [ ] `STORY-009` improve mock answer ergonomics for clearer prompt/context debugging

## Documentation Notes

- Keep product truth and planning detail in `PRD/`.
- Keep this root README concise and onboarding-focused.
- Update the checklist above as stories move from planned to implemented.
