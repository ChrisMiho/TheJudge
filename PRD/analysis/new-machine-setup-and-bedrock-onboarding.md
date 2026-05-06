# New Machine Setup and Bedrock Onboarding

## Purpose

Provide a complete, repeatable setup guide for a brand-new developer machine (for example a new MacBook), while keeping root READMEs concise.

This guide is the detailed companion to:
- `README.md` (quick onboarding and command references)
- `apps/backend/src/providers/README.md` (provider boundary + Bedrock auth behavior)
- `PRD/instructions/secrets-handling.md` (no secret commits policy)

## Scope

This checklist covers:
- local toolchain installation
- repository bootstrap
- mock-mode development run
- Bedrock-mode development run (SSO/profile-first)
- verification and common failure recovery

It does not cover production deployment infrastructure.

## 1) Machine Prerequisites

Install these first on the new machine:

1. Xcode Command Line Tools
2. Homebrew
3. Git
4. Node.js + npm (project-compatible modern LTS)
5. AWS CLI v2 (required for `aws configure sso` / `aws sso login`)

Optional but recommended:
- GitHub CLI (`gh`) for PR workflows
- `nvm` or `volta` for Node version management

## 2) Identity and Access Setup

### GitHub access

- Configure SSH key or GitHub CLI auth.
- Confirm clone access to the repository.

### AWS access (local Bedrock path)

Primary path (recommended):
1. `aws configure sso`
2. `aws sso login`
3. Optionally set `AWS_PROFILE` when not using `default`

Fallback path (only when needed):
- temporary env credentials:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_SESSION_TOKEN`

Security rule:
- never commit credentials, session tokens, or secret files.

## 3) Repository Bootstrap

From your workspace directory:

1. Clone the repo.
2. Install dependencies:
   - `npm install`
3. Prepare card data:
   - preferred: `npm run data:refresh`
   - alternative: manually place `default-cards.json` in `apps/frontend/data/scryfall/`
4. Build trimmed metadata:
   - `npm run data:build`

## 4) Environment File Setup

Create local env files from examples as needed:
- `apps/frontend/.env` from `apps/frontend/.env.example`
- `apps/backend/.env` from `apps/backend/.env.example`

For mock mode, defaults are usually enough.

For Bedrock mode, ensure backend config includes:
- `ASK_AI_PROVIDER=bedrock`
- `AWS_REGION=<your-region>`
- `BEDROCK_MODEL_ID=<approved-model-id>`

Optional Bedrock tuning:
- `BEDROCK_TIMEOUT_MS` (default `15000`)
- `BEDROCK_MAX_ATTEMPTS` (default `2`)

## 5) Run Modes (Deliberate Command Choice)

### Local mock mode (default dev)

- `npm run dev` or `npm run dev:mock`

Use this when:
- validating UX, flow, and contracts without AWS dependencies
- coding frontend or non-provider backend work

### Live Bedrock mode

- `npm run dev:bedrock`

Use this when:
- validating real model integration path
- checking Bedrock-specific behavior and provider diagnostics

Important:
- Bedrock mode requires valid AWS auth/session and required backend env vars.

## 6) Verification Checklist

After startup:

1. Frontend loads at `http://localhost:5173`
2. Backend health passes at `http://localhost:3000/api/health`
3. Ask flow succeeds in selected mode
4. Quality gate passes:
   - `npm run quality:check`

Bedrock-specific verification:
1. Confirm caller identity (`aws sts get-caller-identity`)
2. Confirm backend starts without Bedrock config validation errors
3. Confirm one successful `/api/ask-ai` response in Bedrock mode

## 7) Common Failure Modes

- **`ASK_AI_PROVIDER=bedrock` startup error**
  - Missing `AWS_REGION` or `BEDROCK_MODEL_ID`
- **AWS credential resolution failures**
  - SSO session expired; rerun `aws sso login`
  - wrong `AWS_PROFILE`
- **Bedrock access denied**
  - model or region not allowed for your account/role
- **Frontend loads but ask fails**
  - verify backend is running and `VITE_API_URL` points at backend origin
- **Metadata/search issues**
  - rerun `npm run data:refresh` and `npm run data:build`

## 8) Post-Setup Hardening

After first successful run on the new machine:

1. Confirm no secrets are tracked by git
2. Keep Bedrock auth profile-based for daily use (avoid long-lived keys)
3. Capture any machine-specific gotchas as follow-up notes in this file

## Definition of Done for New Machine Readiness

- machine can run mock mode end-to-end
- machine can run Bedrock mode end-to-end with SSO/profile auth
- quality checks are green locally
- no secrets are committed or stored in tracked config files
