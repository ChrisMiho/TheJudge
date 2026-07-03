# Slice A — Adopt `aws_web_app` onto a feature branch off `main`

## Status: planned

## Goal

Bring the collaborator's two deployment commits onto a fresh `feature/aws-deployment-onboarding` branch based on the latest `main`, resolve any conflicts, and confirm the app still builds, tests green, and runs locally in mock mode — with no behavior change.

## Requirements

- Integrate `origin/aws_web_app` commits `e48687f` (Lambda entrypoint / runtime factory) and `5ec761b` (AWS deployment automation) onto a branch off `main`.
- Local developer experience is unchanged: `npm run dev` / `npm run dev:mock` still start; provider default stays `mock` (DEC-020).
- No product behavior, contract, endpoint, prompt, or stack-ordering change (DEC-080).

## Files touched

- `apps/backend/src/index.ts` (slimmed to use the runtime factory)
- `apps/backend/src/lambda.ts` (new)
- `apps/backend/src/runtime/createConfiguredApp.ts` (new)
- `apps/backend/package.json` (+ `@codegenie/serverless-express`)
- `package-lock.json`
- `.github/workflows/deploy-aws.yml` (new)
- `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, `scripts/package-lambda.sh` (new)
- `.gitignore` (`.tmp/`), `.gitattributes` (`*.sh text eol=lf`)

## Changes

1. `git switch -c feature/aws-deployment-onboarding origin/main` (fetch first).
2. Integrate the two commits (merge `origin/aws_web_app`, or cherry-pick `e48687f` then `5ec761b`). Resolve `package.json` / `package-lock.json` conflicts by keeping both the collaborator's new deps and any main-branch deps.
3. Bring `PRD/work/aws-deployment-onboarding/` onto the branch so the plan travels with the code.
4. `npm install` to reconcile the lockfile, then run the gates below.

## Acceptance criteria

- [ ] `git log --oneline` on the branch shows the runtime-factory + deployment-automation changes present
- [ ] `npm run build` succeeds for both workspaces
- [ ] `npm run quality:check` is green (no new failures vs. `main`)
- [ ] `npm run dev:mock` starts and `GET http://localhost:3000/api/health` returns 200
- [ ] `apps/backend/src/index.ts` still logs the same startup fields; provider default is `mock`
- [ ] No changes under `apps/frontend/src`, `apps/backend/src/routes`, `apps/backend/src/prompt`, or `apps/backend/src/validation` (contract/prompt untouched) — `git diff --stat main` touches only runtime/scripts/CI/config files

## Verification

```bash
git fetch origin
git switch -c feature/aws-deployment-onboarding origin/main
git merge --no-ff origin/aws_web_app   # or cherry-pick e48687f 5ec761b
npm install
npm run build
npm run quality:check
npm run dev:mock &   # then: curl -s http://localhost:3000/api/health
```
