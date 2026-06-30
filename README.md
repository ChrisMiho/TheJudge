# TheJudge

TheJudge is a rules assistant for Magic gameplay questions — it helps players navigate MTG rules, and is not an official judge or deterministic rules engine.
It helps players build an ordered stack of cards, ask a question, and receive an AI-generated explanation through a backend API.

## Start Here

- Product planning and story source of truth: `PRD/README.md`
- This root README is for fast onboarding, setup, and implementation status.
- If you are using coding agents, point them to `PRD/README.md` first.

## Current Product Status

- Core product: staged zone flow with user-flow refinements and gap fixes promoted into `PRD/sections/`; the core loop is validated (past MVP) and is now being refined toward a first production deployment, not yet deployed to production (`DEC-080`)
- Baseline: rules assistant with mock-default backend and optional OpenAI provider mode (`DEC-020` in `PRD/sections/decisions/providers-and-contract.md`, indexed from `PRD/sections/decisions.md`)
- Product source of truth: `PRD/sections/` (start with the `decisions.md` router)
- Agent workflow skills: see `AGENT-SKILLS.md` (canonical: `.cursor/skills/`)

## Tech Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Zod validation
- Testing: Vitest (frontend and backend)
- Data: Scryfall-derived local metadata and WotC rulings transform pipeline
- Architecture: npm workspaces monorepo (`apps/frontend`, `apps/backend`)

## Repository Layout

- `PRD/`
  - `README.md` control plane for product docs and read order
  - `sections/` product truth (requirements, decisions, flows, constraints)
  - `instructions/` generation and editing rules
  - `work/` ephemeral planning folders (deleted when slices ship)
- `apps/frontend/` client app
  - `src/components/` zone-flow step UI
  - `src/hooks/` React hooks (`useAskAiSubmitOrchestration`, autocomplete helpers)
  - `src/lib/` shared utilities and `contextFlow/` state machine
  - `public/data/` runtime card metadata (`cardMetadata.json`)
  - `data/scryfall/` gitignored Scryfall bulk input for `npm run data:build`
- `apps/backend/` API app (`POST /api/ask-ai`, `GET /api/health`)
  - `src/app/` Express app factory and error handler
  - `src/routes/` HTTP route registration
  - `src/prompt/` prompt context, normalization, and preparation
  - `src/validation/` Zod request schemas
  - `src/providers/` Ask AI provider boundary
  - `src/eval/` prompt/context golden regression harness
  - `data/cardRulingsByOracleId.json` committed WotC rulings artifact for backend prompt enrichment
- `scripts/` shared dev/data scripts (including metadata build)

## Local Setup

1. Install dependencies from repo root:
   - `npm install`
2. Prepare card metadata source file:
   - place Scryfall bulk file at `apps/frontend/data/scryfall/default-cards.json`
   - or refresh automatically with `npm run data:refresh`
   - agent-run refreshes require explicit human approval because they download Scryfall bulk data
3. Build trimmed metadata:
   - `npm run data:build`
   - this also rebuilds `apps/backend/data/cardRulingsByOracleId.json` when local rulings bulk data is present
4. Start both apps: `npm run dev` (logging defaults: see `apps/backend/src/providers/README.md` and env vars under Environment Configuration below).
5. Optional checks:
   - frontend: `http://localhost:5173`
   - backend health: `http://localhost:3000/api/health`

## Useful Commands

- `npm run dev` - run frontend + backend together (explicit mock provider mode)
- `npm run dev:mock` - run frontend + backend with `ASK_AI_PROVIDER=mock`
- `npm run dev:openai` - run frontend + backend with `ASK_AI_PROVIDER=openai` (requires OpenAI env config)
- `npm run dev:frontend` - run frontend only
- `npm run dev:backend` - run backend only
- `npm run typecheck` - run frontend + backend TypeScript checks
- `npm run test` - run frontend + backend test suites
- `npm run lint` - run ESLint across workspaces
- `npm run format:check` - verify formatting for docs/config files
- `npm run quality:check` - run pre-PR quality gate (`typecheck` + `lint` + `format:check` + `test` + `coverage:check`)
- `npm run coverage:check` - run Vitest coverage with conservative line thresholds
- `npm run build` - build both apps
- `npm --workspace apps/frontend run test` - run frontend tests
- `npm --workspace apps/backend run test` - run backend tests
- `npm --workspace apps/backend run test:eval` - run backend eval harness test
- `npm run data:refresh` - download latest Scryfall `default_cards` and `rulings` bulk data, then rebuild trimmed metadata and rulings artifacts
- `npm run data:scan-fingerprints` - resume and extend `apps/frontend/public/data/cardhashes.bin`, downloading only missing Scryfall PNGs to transient temp files that are deleted after hashing
- `npm run data:scan-fingerprints -- --coverage-summary` - inspect scan corpus target/fingerprinted/missing/parked counts without network or writes
- `npm run data:scan-fingerprints -- --diagnose-id <scryfall-id>` - inspect one printing's filter and fingerprint status without network or writes
- `npm run data:scan-fingerprints:fresh` - rebuild scan fingerprints into `cardhashes.fresh.bin` / `cardhashManifest.fresh.json` without touching the live artifact
- `npm run prompt:preview` - spin up mock backend, POST curated fixtures through `/api/ask-ai`, write reviewable prompt artifacts to gitignored `output/prompt-preview/`
- `npm run prompt:preview:all` - same as above but includes all eval fixtures (including expected error paths); use `--fixture <id>`, `--output-dir`, `--port` for fine-grained runs
- stop running processes with `Ctrl + C`

## Quality Gate Workflow

Use this baseline before opening a PR:

1. Run `npm run quality:check` from repository root.
2. If it fails, fix issues and rerun until green.
3. Optionally run workspace-specific checks while iterating (`npm --workspace apps/frontend run test`, `npm --workspace apps/backend run test`).

`quality:check` is the canonical guardrail command and runs static typing, linting, formatting checks, and tests across frontend/backend.

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
  - `ASK_AI_PROVIDER` - provider mode toggle (`mock` default, `openai` for live provider path)
  - `OPENAI_MODEL` - required when `ASK_AI_PROVIDER=openai` (default recommendation: `gpt-4.1-mini`)
  - `OPENAI_TIMEOUT_MS` - optional OpenAI request timeout in ms (default: `15000`)
  - `OPENAI_MAX_RETRIES` - optional SDK retry attempts (default: `2`)

Local OpenAI auth guidance:
- Keep non-secret configuration in `apps/backend/.env`.
- Keep real secrets in `.secrets/openai-dev.env` (copy from `secrets-templates/openai-dev.env.example`); never commit `.secrets/`. See `PRD/instructions/secrets-handling.md`.
- In `development`, the backend loads `apps/backend/.env` first, then `.secrets/openai-dev.env` when that file exists (via `dotenv`).
- Run `npm run openai:verify-credentials` to confirm API key and model connectivity before `npm run dev:openai`.

Reference templates:

- `apps/frontend/.env.example`
- `apps/backend/.env.example`
- `secrets-templates/openai-dev.env.example` (copy to `.secrets/openai-dev.env` for local secret storage)

## Operational References

Use these docs for deeper runtime/contract detail instead of expanding the root README:
- API contract, payload shape, stack-order semantics, and integration constraints: `PRD/sections/integrations-and-data.md`
- Provider rules and integration constraints: `PRD/sections/decisions/providers-and-contract.md` (`DEC-020`, indexed from `PRD/sections/decisions.md`), `PRD/sections/integrations-and-data.md`
- WotC rulings prompt enrichment decision: `PRD/sections/decisions/rules-retrieval.md` (`DEC-029`, indexed from `PRD/sections/decisions.md`)
- Backend provider boundary and mode intent: `apps/backend/src/providers/README.md`

Card-scan fingerprint operations:
- `npm run data:scan-fingerprints` is the day-to-day path. It treats the shipped `cardhashes.bin` as resume state, downloads only missing filtered printings, checkpoints partial progress, and writes the bin, manifest, and skip-list atomically.
- `npm run data:scan-fingerprints -- --coverage-summary` reports corpus `targetCount`, `fingerprintedTargetCount`, `missingCount`, `parkedCount`, and full/partial status from local artifacts only.
- `npm run data:scan-fingerprints -- --diagnose-id <scryfall-id>` and `npm run data:scan-fingerprints -- --diagnose-illustration-id <illustration-id>` report filter inclusion, fingerprint, and skip-list status for a target without downloading images or writing files.
- `npm run data:scan-fingerprints -- --limit 500` and `npm run data:scan-fingerprints -- --max-minutes 30` bound a run; either budget can be combined with the other, and the current entry finishes before the stop checkpoint.
- Downloads use polite `--rate-ms` pacing plus automatic `429` / `5xx` / network retry backoff. Running the command is the required human approval for Scryfall network access; agents should not run it without explicit approval.
- Permanent per-image failures are recorded in `apps/frontend/public/data/cardhashSkiplist.json` and parked after repeated attempts. Use `npm run data:scan-fingerprints -- --retry-parked` to re-attempt parked entries.
- `npm run data:scan-fingerprints:fresh` writes separate `.fresh` artifacts and never overwrites the live bin. Promote a fresh build to `cardhashes.bin` / `cardhashManifest.json` only as a deliberate manual step after review; use `--force` or an explicit `--output` only when replacing a chosen fresh target is intentional.

Quick local verification flow:
1. Start services with `npm run dev`.
2. Open frontend (`http://localhost:5173`) and backend health (`http://localhost:3000/api/health`).
3. Run `npm run quality:check` before PRs.

## Documentation Notes

- Keep product truth and planning detail in `PRD/`.
- Keep this root README concise and onboarding-focused.
- Keep product truth in `PRD/sections/`; record new DEC bodies in the relevant `PRD/sections/decisions/<domain>.md` file and keep the `PRD/sections/decisions.md` router index current.
- Keep historical implementation detail out of the repo unless promoted into active PRD sections.
- Empty-state artwork is bundled at `apps/frontend/public/assets/cats-homescreen.png`; keep it local/static and retain a text fallback path.
- Provider integration boundary docs live in `apps/backend/src/providers/README.md`.
- Search responsiveness guardrails stay frontend-local (debounced query + in-memory pre-normalized index) and must not add runtime metadata sync paths.
- The committed rulings artifact `apps/backend/data/cardRulingsByOracleId.json` lets CI and local prompt tests run without downloading Scryfall data.

## Agent Workflow Skills

See [AGENT-SKILLS.md](AGENT-SKILLS.md) for the skill catalog, workflow sequence, and `npm run skills:ai-sync` sync workflow.
