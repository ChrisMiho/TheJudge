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
   - or refresh automatically with `npm run data:refresh`
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
- `npm run data:refresh` - download latest Scryfall `default_cards` and rebuild trimmed metadata
- stop running processes with `Ctrl + C`

## Environment Configuration

Local defaults work out of the box, but deployment targets should set explicit values.

- Frontend (`apps/frontend/.env`):
  - `VITE_API_URL` - absolute backend origin used by the browser app (default: `http://localhost:3000`)
- Backend (`apps/backend/.env`):
  - `PORT` - backend server port (default: `3000`)
  - `FRONTEND_ORIGIN` - optional CORS allow-origin for frontend deployments (example: `https://preview.thejudge.dev`)

Reference templates:

- `apps/frontend/.env.example`
- `apps/backend/.env.example`

## Deployment Targets

- Local:
  - frontend `VITE_API_URL=http://localhost:3000`
  - backend `PORT=3000`, optional `FRONTEND_ORIGIN=http://localhost:5173`
- Preview:
  - frontend `VITE_API_URL=<preview-backend-origin>`
  - backend `PORT=<platform-port>`, `FRONTEND_ORIGIN=<preview-frontend-origin>`
- Production:
  - frontend `VITE_API_URL=<production-backend-origin>`
  - backend `PORT=<platform-port>`, `FRONTEND_ORIGIN=<production-frontend-origin>`

Both frontend and backend fail fast on invalid URL/port configuration to surface misconfiguration early.

## Current Feature Status

Implemented flow and platform pieces:

- [x] search input with threshold and no-match behavior
- [x] card preview before add with in-panel metadata context and improved image quality
- [x] stack add/remove and stack details
- [x] duplicate blocking (MVP simplification) and stack cap of 10
- [x] optional question with fallback `Resolve the stack`
- [x] backend request validation and mock `POST /api/ask-ai` with explicit stack-order markers
- [x] failure state with retry cooldown behavior
- [x] metadata transform pipeline + runtime metadata loading from `public/data/cardMetadata.json` with deterministic latest-printing dedupe
- [x] automatic Scryfall refresh script (`npm run data:refresh`) to fetch `default_cards` and rebuild metadata
- [x] enriched stack context fields in request/prompt pipeline (`manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`)
- [x] suggestion list capped to 3 items to keep search UI compact
- [x] backend prompt context builder, normalization, and fixture-based eval harness
- [x] environment-driven API origin and backend runtime config with fail-fast validation (`VITE_API_URL`, `PORT`, `FRONTEND_ORIGIN`)
- [x] frontend integration coverage for search/add/decrypt, stack details/count, duplicate/cap guardrails, and failure/retry resilience
- [x] backend provider boundary to isolate Phase A mock from route/controller logic
- [x] deterministic, structured mock answer output for prompt/context debugging
- [x] empty-state cat-wizard visual served from bundled static assets with fallback copy

## Story Checklist (Track Progress Here)

Context and prompt quality:

- [x] `STORY-001` context contract and builder
- [x] `STORY-002` context normalization and guardrails
- [x] `STORY-003` context evaluation harness
- [x] `STORY-004` explicit stack-order signaling

Pending implementation backlog:

- [x] `STORY-010` define metadata filtering/dedupe policy and lock it with transform/search regression tests (merged scope formerly tracked as `STORY-005`)
- [x] `STORY-006` add UI-focused frontend coverage for search/add/decrypt
- [x] `STORY-007` add API base URL environment config and deployment targets
- [x] `STORY-009` improve mock answer ergonomics for clearer prompt/context debugging
- [x] `STORY-011` add stack icon/count and stack details/remove regression coverage
- [x] `STORY-012` add duplicate-block and 10-card-cap regression coverage
- [x] `STORY-013` add Decrypt failure-path regression coverage (error copy/state preserve/retry cooldown)
- [x] `STORY-014` add backend provider boundary so mock can swap to Bedrock later without API contract changes
- [x] `STORY-008` replace empty-state emoji with bundled cat-wizard asset (after approval)

## Documentation Notes

- Keep product truth and planning detail in `PRD/`.
- Keep this root README concise and onboarding-focused.
- Update the checklist above as stories move from planned to implemented.
- Empty-state artwork is bundled at `apps/frontend/public/assets/cat-wizard.svg`; keep it local/static and retain a text fallback path.
- Provider integration boundary docs live in `apps/backend/src/providers/README.md`.
