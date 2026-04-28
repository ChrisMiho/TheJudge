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
- capture lightweight structured game context before stack resolution
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
   - Backend Ask-AI flow logs print in this terminal when `DEBUG_LOGGING` is unset (defaults on in development; the backend `dev` script sets `NODE_ENV=development`). Frontend `[TheJudge][frontend]` logs appear in the browser DevTools console, not the dev terminal.
5. Optional checks:
   - frontend: `http://localhost:5173`
   - backend health: `http://localhost:3000/api/health`

## Useful Commands

- `npm run dev` - run frontend + backend together
- `npm run dev:frontend` - run frontend only
- `npm run dev:backend` - run backend only
- `npm run typecheck` - run frontend + backend TypeScript checks
- `npm run test` - run frontend + backend test suites
- `npm run quality:check` - run pre-PR quality gate (`typecheck` + `test`)
- `npm run build` - build both apps
- `npm --workspace apps/frontend run test` - run frontend tests
- `npm --workspace apps/backend run test` - run backend tests
- `npm --workspace apps/backend run test:eval` - run backend eval harness test
- `npm run data:refresh` - download latest Scryfall `default_cards` and rebuild trimmed metadata
- stop running processes with `Ctrl + C`

## Quality Gate Workflow

Use this baseline before opening a PR:

1. Run `npm run quality:check` from repository root.
2. If it fails, fix issues and rerun until green.
3. Optionally run workspace-specific checks while iterating (`npm --workspace apps/frontend run test`, `npm --workspace apps/backend run test`).

`quality:check` is the canonical guardrail command and runs both static typing checks and tests across frontend/backend.

## Environment Configuration

Local defaults work out of the box, but deployment targets should set explicit values.

- Frontend (`apps/frontend/.env`):
  - `VITE_API_URL` - absolute backend origin used by the browser app (default: `http://localhost:3000`)
  - `VITE_DEBUG_LOGGING` - optional debug log toggle (`true`/`false`); defaults on in development and off in test mode
- Backend (`apps/backend/.env`):
  - `PORT` - backend server port (default: `3000`)
  - `FRONTEND_ORIGIN` - optional CORS allow-origin for frontend deployments (example: `https://preview.thejudge.dev`)
  - `DEBUG_LOGGING` - optional backend debug log toggle (`true`/`false`); defaults on in `development`

Reference templates:

- `apps/frontend/.env.example`
- `apps/backend/.env.example`

## Validating Ask-AI Flow Locally

1. Enable debug logging in both apps (or rely on local defaults):
   - frontend: set `VITE_DEBUG_LOGGING=true` in `apps/frontend/.env`
   - backend: set `DEBUG_LOGGING=true` in `apps/backend/.env`
2. Start both services from repo root:
   - `npm run dev`
3. Open the frontend, build a small stack, and click `Decrypt Stack`.
4. Use the same correlation id to follow one attempt across systems:
   - browser DevTools console: `[TheJudge][frontend]` `ask_ai.*` events
   - backend terminal: `[TheJudge][backend]` `ask_ai.*` lifecycle events
   - network response headers: `X-Correlation-Id` echoed from backend response

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
- [x] per-stack-entry context enrichment (`caster`, typed `targets`, optional `contextNotes`) with frontend capture/edit and backend deterministic prompt output (supports `Player 1` ... `Player 4` and explicit `none` target context)
- [x] lightweight frontend/backend debug logging with per-request correlation id and environment toggles (`VITE_DEBUG_LOGGING`, `DEBUG_LOGGING`)

## Story Checklist (Track Progress Here)

Context and prompt quality:

- [x] `STORY-001` context contract and builder
- [x] `STORY-002` context normalization and guardrails
- [x] `STORY-003` context evaluation harness
- [x] `STORY-004` explicit stack-order signaling

Pending implementation backlog:

- [x] `STORY-005` metadata-transform/search scenario tests (scope merged and completed under `STORY-010`)
- [x] `STORY-010` define metadata filtering/dedupe policy and lock it with transform/search regression tests (merged scope formerly tracked as `STORY-005`)
- [x] `STORY-006` add UI-focused frontend coverage for search/add/decrypt
- [x] `STORY-007` add API base URL environment config and deployment targets
- [x] `STORY-009` improve mock answer ergonomics for clearer prompt/context debugging
- [x] `STORY-011` add stack icon/count and stack details/remove regression coverage
- [x] `STORY-012` add duplicate-block and 10-card-cap regression coverage
- [x] `STORY-013` add Decrypt failure-path regression coverage (error copy/state preserve/retry cooldown)
- [x] `STORY-014` add backend provider boundary so mock can swap to Bedrock later without API contract changes
- [x] `STORY-008` replace empty-state emoji with bundled cat-wizard asset (after approval)
- [x] `STORY-015` use `cats-homescreen.png` as centered empty-state default image with no surrounding box
- [x] `STORY-016` establish engineering quality guardrails with enforceable repo-level gates
- [x] `STORY-017` remediate current hotspots via modular refactor with regression-safe tests
- [x] `STORY-018` enrich stack entries with explicit caster (`Player 1` / `Player 2`) and typed targeting context for improved LLM prompt input
- [x] `STORY-019` add basic frontend/backend debug logging with correlation id traceability for flow validation
- [x] `STORY-020` wire enriched stack-entry context into deterministic backend prompt/mock output for LLM-readiness
- [x] `STORY-021` expand caster/player-target labels to support up to four players across UI and backend validation
- [x] `STORY-022` capture pre-stack general game context (player count + life totals) and include it in LLM prompt context
- [x] `STORY-023` capture per-stack-entry mana spent context with deterministic fallback to `manaValue` in prompt context
- [x] `STORY-024` add optional battlefield-context step after game context with explicit skip path and prompt-context inclusion
- [x] `STORY-025` harden expanded Ask-AI context contract end-to-end after staged-context features land
- [x] `STORY-026` expand deterministic prompt structure to include staged context sections
- [x] `STORY-027` extend eval harness fixtures/checks for staged-context regression detection
- [x] `STORY-028` prepare Phase B Bedrock bootstrap/config/provider-selection wiring without API contract changes
- [x] `STORY-029` add prompt budget and latency guardrails for high-context scenarios
- [x] `STORY-030` align battlefield-context entry with existing metadata-backed card search behavior
- [x] `STORY-031` simplify battlefield-step progression to one dynamic skip/continue action button
- [x] `STORY-032` add target kind `other` with up-to-200-char custom target context wired through payload/prompt
- [x] `STORY-033` move cat visual from stack window/empty-state placement to game-context first screen
- [x] `STORY-034` remove `cardId` from LLM-facing prompt output while preserving deterministic stack-order context
- [x] `STORY-035` introduce a shared autocomplete path foundation across stack and battlefield entry
- [x] `STORY-036` add deterministic relevance ranking contract for suggestion ordering
- [x] `STORY-037` add keyboard interaction parity for autocomplete in both contexts
- [x] `STORY-038` clean up battlefield input-state path wiring against shared adapters
- [x] `STORY-039` add cross-flow parity regression suite for stack vs battlefield suggestions
- [x] `STORY-040` add lightweight search performance guardrails for responsiveness
- [x] `STORY-041` make battlefield item name display-only while keeping search and details editable
- [x] `STORY-042` strengthen cross-boundary flow validation logging (response correlation echo, staged-flow milestones, README playbook)
- [x] `STORY-043` unify stack and battlefield selected-card preview UX with shared preview component and target-kind option parity
- [ ] `STORY-045` eliminate backend contract drift via schema-first typing (`z.infer`) and shared source-of-truth contracts
- [ ] `STORY-046` add backend error taxonomy + centralized middleware with stable machine-readable error codes
- [ ] `STORY-047` consolidate prompt/context build ownership into one backend service boundary
- [ ] `STORY-048` standardize backend logging with `pino` JSON output and payload-log toggle docs
- [ ] `STORY-049` layer backend tests and extract reusable fixture/builders for maintainable contract coverage
- [x] `STORY-044` hide battlefield target-entry controls until a card is selected (preview is the single target-entry surface)
- [ ] `STORY-050` extract shared target-editor logic used by stack and battlefield selected-card previews
- [ ] `STORY-051` componentize battlefield step rendering/state wiring out of `App.tsx`
- [ ] `STORY-052` componentize stack builder rendering/state wiring out of `App.tsx`
- [ ] `STORY-053` refactor ask-ai submit/retry orchestration and logging lifecycle helpers

## Documentation Notes

- Keep product truth and planning detail in `PRD/`.
- Keep this root README concise and onboarding-focused.
- Update the checklist above as stories move from planned to implemented.
- Empty-state artwork is bundled at `apps/frontend/public/assets/cat-wizard.svg`; keep it local/static and retain a text fallback path.
- Provider integration boundary docs live in `apps/backend/src/providers/README.md`.
- Search responsiveness guardrails stay frontend-local (debounced query + in-memory pre-normalized index) and must not add runtime metadata sync paths.
