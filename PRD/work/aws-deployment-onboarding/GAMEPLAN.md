# GAMEPLAN — aws-deployment-onboarding

## Summary

Adopt the collaborator's `aws_web_app` serverless deployment (Lambda + Function URL backend, private S3 + CloudFront frontend, GitHub Actions deploy via OIDC) onto a feature branch off `main`, then close three production-readiness gaps before the first live deploy: secure `OPENAI_API_KEY` handling (SSM SecureString, read at Lambda cold start), cost/scale guardrails (Lambda reserved concurrency + AWS Budgets alarm), and a `quality:check` gate before auto-deploy. Ship durable operator docs under `docs/aws/`, then execute the first live deployment running the real OpenAI provider on AWS-provided URLs (no custom domain).

This work is **deployment/infra + docs only**. No product behavior, API contract, endpoint, prompt-assembly, or stack-ordering change (DEC-020, DEC-080).

## Branch strategy

- Create `feature/aws-deployment-onboarding` off the latest `main`.
- Integrate the two collaborator commits from `origin/aws_web_app` (`e48687f`, `5ec761b`) — Slice A.
- Bring this work-package folder (`PRD/work/aws-deployment-onboarding/`) onto the branch so the plan travels with the code.
- Land Slices B/C/D/E on the branch; Slice F is the first live deploy from `main` after merge.

## Architecture (target state)

```
Browser
  → CloudFront (https://<dist>.cloudfront.net, PriceClass_100, OAC)
      → private S3 bucket (thejudge-web-<account>) — built SPA (VITE_API_URL baked to Function URL)
  → Lambda Function URL (https://<id>.lambda-url.<region>.on.aws, auth NONE, reserved concurrency = N)
      → Lambda (nodejs24.x, arm64) → apps/backend/dist/lambda.handler
          cold start: read OPENAI_API_KEY from SSM SecureString (WithDecryption) → process.env
          → createConfiguredApp(repoRoot, process.env) → Express app (same POST /api/ask-ai + /api/health)
          → ASK_AI_PROVIDER=openai → OpenAI Responses API

GitHub Actions (push to main)
  → quality:check (gate) → OIDC AssumeRole (thejudge-github-deploy) → aws-deploy.sh
      → package-lambda.sh → update-function-code + non-secret env → build FE → s3 sync → CloudFront invalidation
```

### Secrets & identity flow

```
OPENAI_API_KEY  → SSM Parameter Store SecureString (/thejudge/openai-api-key, KMS: aws/ssm)
                  → read by Lambda exec role (ssm:GetParameter + kms:Decrypt) at cold start ONLY
                  → never in Git, never in Lambda function config, never in GitHub
GitHub → AWS    → OIDC federation (no static keys); deploy role scoped to Lambda/S3/CloudFront actions
AWS_ACCOUNT_ID  → GitHub Actions repo variable (vars.AWS_ACCOUNT_ID), not committed literals
```

### Cold-start init (the key technical change)

`readServerConfig` throws when `ASK_AI_PROVIDER=openai` and `OPENAI_API_KEY` is absent (`apps/backend/src/config/index.ts:84`), and the current `lambda.ts` builds the app **synchronously** at module load. Therefore the Lambda entrypoint must become **async**: fetch the SSM parameter → set `process.env.OPENAI_API_KEY` → *then* `createConfiguredApp`, with the exported `handler` awaiting a one-time init promise before delegating to serverless-express. SSM logic stays in `lambda.ts`/a Lambda-only helper; local `index.ts` is untouched and keeps reading the key from `.secrets/openai-dev.env`.

`@aws-sdk/client-ssm` is provided by the Node 24 Lambda runtime, so it is a **devDependency** (available for local typecheck/build, excluded from the deploy zip via `npm ci --omit=dev`, resolved at runtime by the platform).

## Slice dependency map

| Slice | Objective | Depends on | Parallel-ready |
|-------|-----------|------------|----------------|
| 0 | **Owner-run (not for agents):** IAM Identity Center (SSO) admin access + `thejudge-admin` CLI profile on the new account | — | with A, B |
| A | Adopt `aws_web_app` onto feature branch; verify local build/tests green | — | — |
| B | Gap 3 — `quality:check` deploy gate + account ID → repo variable | A | with C, D |
| C | Gap 1 — SSM SecureString + Lambda cold-start read + flip to `openai` + IAM | A | with B, D |
| D | Gap 2 — Lambda reserved concurrency + AWS Budgets alarm | A | with B, C |
| E | `docs/aws/` operator docs + root README link | B, C, D | — |
| F | First live deploy + verification on AWS URLs | C, D, E | — |

B, C, and D are independent and can run in parallel after A. Slice 0 is owner-run and gates every AWS-touching step (bootstrap, C, D, F), but not A or B (no AWS creds needed there), so it can proceed alongside A/B.

## Verification checklist (whole package)

- [ ] Slice A: both collaborator commits integrated; `npm run build` + `npm run quality:check` green; `npm run dev:mock` health check 200; provider still `mock` by default
- [ ] Slice B: no 12-digit account ID literal in `.github/` or `scripts/` (grep); workflow runs `quality:check` before deploy; scripts fail fast when `AWS_ACCOUNT_ID` unset
- [ ] Slice C: `@aws-sdk/client-ssm` absent from packaged prod deps; SSM loader unit test passes (mocked client); no `OPENAI_API_KEY` in any committed file or the Lambda env block; bootstrap grants `ssm:GetParameter` + `kms:Decrypt`
- [ ] Slice D: bootstrap sets reserved concurrency to the configured ceiling; a budget with an email alert exists (or documented manual step present); CloudFront stays `PriceClass_100`
- [ ] Slice E: `docs/aws/{deployment,operations,secrets}.md` exist with required sections; root README Operational References links them; `npm run format:check` green
- [ ] Slice F: Function URL `/api/health` 200; `/api/ask-ai` returns a real OpenAI answer; CloudFront URL completes a full ask flow; reserved concurrency + budget confirmed; no key in Lambda config; push-to-main runs `quality:check` then deploys green

## Notes

- Optional truth-layer promotion (cleanup): consider a new DEC recording the AWS serverless deployment target + `openai`-in-prod. DEC-020/DEC-080 already permit it, so this is hygiene, not a blocker.
- No IaC migration; keep the idempotent bash scripts. No custom domain; use default CloudFront + Function URL URLs.
