# TheJudge

TheJudge is an MVP card-stack interaction assistant for Magic gameplay questions.
It helps players build an ordered stack of cards, ask a question, and receive an AI-generated explanation through a backend API.

## Start Here

- Product planning and story source of truth: `PRD/README.md`
- This root README is for fast onboarding, setup, and implementation status.
- If you are using coding agents, point them to `PRD/README.md` first.

## Current Product Phase

- MVP1: closed and archived
- MVP2: active (Bedrock integration and reliability hardening)
- Primary MVP2 execution guide: `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
- For MVP1 history, see `MVP1 Closeout Snapshot` below.

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
  - `stories/` active MVP2+ implementation slices and Definition of Done
  - `archive/` historical context snapshots; start at `PRD/archive/README.md`
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
4. Start both apps: `npm run dev` (logging defaults: see `apps/backend/src/providers/README.md` and env vars under Environment Configuration below).
5. Optional checks:
   - frontend: `http://localhost:5173`
   - backend health: `http://localhost:3000/api/health`

## Useful Commands

- `npm run dev` - run frontend + backend together (explicit mock provider mode)
- `npm run dev:mock` - run frontend + backend with `ASK_AI_PROVIDER=mock`
- `npm run dev:bedrock` - run frontend + backend with `ASK_AI_PROVIDER=bedrock` (requires Bedrock env config)
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
  - `LOG_PAYLOADS` - optional backend request payload logging toggle (`true`/`false`); defaults on in `development`, off otherwise
  - `ASK_AI_PROVIDER` - provider mode toggle (`mock` default, `bedrock` for live provider path)
  - `AWS_REGION` - required when `ASK_AI_PROVIDER=bedrock`
  - `BEDROCK_MODEL_ID` - required when `ASK_AI_PROVIDER=bedrock`
  - `BEDROCK_TIMEOUT_MS` - optional Bedrock invoke timeout in ms (default: `15000`)
  - `BEDROCK_MAX_ATTEMPTS` - optional SDK retry attempts (default: `2`)

Local Bedrock auth guidance:
- Prefer AWS profile/SSO for human local usage (`aws configure sso`, `aws sso login`, optional `AWS_PROFILE`).
- Use direct env credentials only as fallback and keep them local-only (never commit keys or session tokens).

Reference templates:

- `apps/frontend/.env.example`
- `apps/backend/.env.example`

## Operational References

Use these docs for deeper runtime/contract detail instead of expanding the root README:
- API contract, payload shape, stack-order semantics, and integration constraints: `PRD/sections/integrations-and-data.md`
- Current MVP2 rollout phases, reliability goals, and environment strategy: `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
- Backend provider boundary and mode intent: `apps/backend/src/providers/README.md`

Quick local verification flow:
1. Start services with `npm run dev`.
2. Open frontend (`http://localhost:5173`) and backend health (`http://localhost:3000/api/health`).
3. Run `npm run quality:check` before PRs.

## MVP1 Closeout Snapshot

MVP1 delivered the complete staged flow, deterministic prompt/context construction, stable backend contract behavior, and quality gates required to begin live-provider integration.

For historical detail:
- MVP1 closeout summary: `PRD/archive/mvp1/README.md`
- MVP1 key decisions for continuity: `PRD/archive/mvp1/key-decisions.md`
- MVP1 deep references (stories/analysis/sections): `PRD/archive/mvp1/reference-links.md`

## Documentation Notes

- Keep product truth and planning detail in `PRD/`.
- Keep this root README concise and onboarding-focused.
- Track active phase progress in `PRD/analysis/MVP2-bedrock-integration-roadmap.md` and `PRD/README.md`.
- MVP1 history: `PRD/archive/README.md`.
- Empty-state artwork is bundled at `apps/frontend/public/assets/cat-wizard.svg`; keep it local/static and retain a text fallback path.
- Provider integration boundary docs live in `apps/backend/src/providers/README.md`.
- Search responsiveness guardrails stay frontend-local (debounced query + in-memory pre-normalized index) and must not add runtime metadata sync paths.
