# TheJudge

Product planning and implementation repository for TheJudge.

## Repository structure

- `PRD/` - Product requirements, app breakdown, and planning docs
- `apps/frontend/` - React + Vite + Tailwind MVP client
- `apps/backend/` - Express + TypeScript mock API (`POST /api/ask-ai`)
- `scripts/` - helper scripts for local dev and data tooling

## Getting started

1. Review the PRD in `PRD/README.md`.
2. Install dependencies:
   - `npm install`
3. Build trimmed frontend card metadata from downloaded Scryfall bulk data:
   - place raw file at `apps/frontend/data/scryfall/default-cards.json`
   - run `npm run data:build`
4. Build both apps:
   - `npm run build`
5. Start both services together:
   - `npm run dev`
6. Open the frontend URL shown by Vite (typically `http://localhost:5173`).

Alternative manual startup:

- backend only: `npm run dev:backend`
- frontend only: `npm run dev:frontend`
- stop any running dev command with `Ctrl + C`

## Start and stop services

Recommended (single command from repo root):

- start both: `npm run dev`
- stop both: press `Ctrl + C`
- if prompted with `Terminate batch job (Y/N)?`, press `Y` then Enter

Two-terminal option:

1. Terminal A (backend):
   - `npm run dev:backend`
2. Terminal B (frontend):
   - `npm run dev:frontend`

To stop the two-terminal setup, press `Ctrl + C` in each terminal.

Optional service checks:

- frontend should be available at `http://localhost:5173`
- backend health endpoint should return `{"ok":true}` at `http://localhost:3000/api/health`

## Workspace model

This repo uses a workspace layout:

- root `package.json` orchestrates all apps and shared scripts
- each app keeps its own `package.json` for app-specific dependencies
- root `tsconfig.base.json` holds shared TypeScript defaults

## Current MVP status

Implemented from the PRD:

- card search with suggestion threshold and no-match state
- card preview before add
- stack add/remove and stack detail modal
- duplicate-blocking and stack-size cap (10)
- optional question + fallback to `Resolve the stack`
- mock backend `POST /api/ask-ai` response flow
- failure copy and retry cooldown behavior
- local trimmed metadata pipeline from Scryfall bulk data (`npm run data:build`)
- runtime metadata loading from `public/data/cardMetadata.json` to keep bundle size low
- lightweight frontend and backend test suites via Vitest

## Next suggested steps

Current branch focus: `feat/metadata-loading-optimization`

- [x] Move metadata loading off the main bundle path while keeping the static prebuilt data strategy.
- [ ] Tune metadata filters and dedupe policy for gameplay realism.
- [ ] Add tests for the metadata transform script and expand search behavior scenarios.
- [ ] Add UI-focused frontend tests for search/add/decrypt flows (backend contract tests are in place).
- [ ] Add environment configuration for API base URL and deployment targets.
- [ ] Begin Phase B integration boundary for real Bedrock invocation.
