# New Machine Setup and OpenAI Onboarding

## Purpose

Provide a complete, repeatable setup guide for a brand-new developer machine while keeping root READMEs concise.

This guide is the detailed companion to:
- `README.md` (quick onboarding and command references)
- `apps/backend/src/providers/README.md` (provider boundary + OpenAI auth behavior)
- `PRD/instructions/secrets-handling.md` (no secret commits policy)

## Scope

This checklist covers:
- local toolchain installation
- repository bootstrap
- mock-mode development run
- OpenAI-mode development run
- verification and common failure recovery

It does not cover production deployment infrastructure.

## 1) Machine Prerequisites

Install these first on the new machine:

1. Xcode Command Line Tools
2. Homebrew
3. Git
4. Node.js + npm (project-compatible modern LTS)

Optional but recommended:
- GitHub CLI (`gh`) for PR workflows
- `nvm` or `volta` for Node version management

## 2) Repository Bootstrap

From your workspace directory:

1. Clone the repo.
2. Install dependencies:
   - `npm install`
3. Prepare card data:
   - preferred: `npm run data:refresh`
   - alternative: manually place `default-cards.json` in `apps/frontend/data/scryfall/`
4. Build trimmed metadata:
   - `npm run data:build`

## 3) Environment File Setup

Create local env files from examples as needed:
- `apps/frontend/.env` from `apps/frontend/.env.example`
- `apps/backend/.env` from `apps/backend/.env.example`
- `.secrets/openai-dev.env` from `secrets-templates/openai-dev.env.example`

Required OpenAI mode config:
- `ASK_AI_PROVIDER=openai`
- `OPENAI_MODEL=gpt-4.1-mini`

Optional OpenAI tuning:
- `OPENAI_TIMEOUT_MS` (default `15000`)
- `OPENAI_MAX_RETRIES` (default `2`)

Secret handling:
- keep `OPENAI_API_KEY` only in `.secrets/openai-dev.env`
- do not put real secrets in `apps/backend/.env`
- never commit anything under `.secrets/`

## 4) Run Modes (Deliberate Command Choice)

### Local mock mode (default dev)

- `npm run dev` or `npm run dev:mock`

Use this when:
- validating UX, flow, and contracts without provider dependencies
- coding frontend or non-provider backend work

### Live OpenAI mode

- `npm run dev:openai`

Use this when:
- validating real model integration path
- checking OpenAI-specific behavior and provider diagnostics

## 5) Verification Checklist

After startup:

1. Frontend loads at `http://localhost:5173`
2. Backend health passes at `http://localhost:3000/api/health`
3. Ask flow succeeds in selected mode
4. Quality gate passes:
   - `npm run quality:check`

OpenAI-specific verification:
1. From repo root, run `npm run openai:verify-credentials`.
2. Confirm backend starts without OpenAI config validation errors.
3. Confirm one successful `/api/ask-ai` response in OpenAI mode.

## 6) Common Failure Modes

- **`ASK_AI_PROVIDER=openai` startup error**
  - Missing `OPENAI_MODEL` in `apps/backend/.env`
- **OpenAI credential failures**
  - missing/invalid `OPENAI_API_KEY` in `.secrets/openai-dev.env`
- **Frontend loads but ask fails**
  - verify backend is running and `VITE_API_URL` points at backend origin
- **Metadata/search issues**
  - rerun `npm run data:refresh` and `npm run data:build`

## Definition of Done for New Machine Readiness

- machine can run mock mode end-to-end
- machine can run OpenAI mode end-to-end
- quality checks are green locally
- no secrets are committed or stored in tracked config files
