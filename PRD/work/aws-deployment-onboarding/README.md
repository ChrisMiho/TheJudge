status: active

# aws-deployment-onboarding

Adopt the collaborator's `aws_web_app` serverless deployment, close three production-readiness gaps, and go live on AWS-provided URLs running the real OpenAI provider — plus durable operator docs so the app can be managed day-to-day. No custom domain yet.

## Goal

Get TheJudge deployed to AWS, cheaply and safely, with the live OpenAI provider, and leave behind documentation the owner can use to run it.

- **Optimize for: cheapest to run.** Serverless scale-to-zero backend, static frontend behind CDN.
- **Launch with: live OpenAI** (not mock). Prepaid OpenAI credits with no auto-renew are the cost backstop on the AI side.
- **No custom domain.** Use the CloudFront `*.cloudfront.net` domain and the Lambda Function URL as-is.

## Adoption decision

Adopt the collaborator's `aws_web_app` branch (approach **B**: adopt + harden before first deploy), not a from-scratch rebuild.

- The branch is idiomatic, cheap, and secure where it matters. Keep it.
- Keep the **imperative bash scripts** (`aws-bootstrap.sh`, `aws-deploy.sh`, `package-lambda.sh`). An IaC migration (CDK/Terraform) is out of scope — YAGNI at this scale.
- Layer the three missing pieces on top **before** the first live deploy.

## Current state inventory (`origin/aws_web_app`, 2 commits ahead of main)

| Area | What the branch provides | Assessment |
|------|--------------------------|------------|
| Backend runtime | `createConfiguredApp()` factory shared by local Express (`index.ts`) and Lambda (`lambda.ts`) via `@codegenie/serverless-express` | Clean refactor, behavior-preserving |
| Backend host | Lambda `nodejs24.x`, arm64, 512 MB, 20 s timeout, public Function URL (`auth NONE`) | Cheap, scales to zero. **No concurrency cap yet.** |
| Frontend host | Private S3 bucket (public access blocked) served via CloudFront with OAC, `PriceClass_100`, SPA 403/404 → `index.html` fallback | Correct + cheap |
| CI/CD | `.github/workflows/deploy-aws.yml`: on push to `main`, build + deploy via **OIDC role assumption** (no static AWS keys) | Right approach. **No test gate.** |
| Infra setup | `aws-bootstrap.sh` (idempotent): S3, CloudFront, OAC, Lambda, Function URL, IAM roles, GitHub OIDC provider + deploy role | Solid, one-time run with admin creds |
| Provider mode | Hardcoded `ASK_AI_PROVIDER=mock` in both bootstrap and deploy env blocks | **Blocks live OpenAI launch** |

## Gap 1 — OpenAI key management (secure secrets)

**Problem:** nothing handles `OPENAI_API_KEY`. Everything runs `mock`. Additionally, `aws-deploy.sh` calls `update-function-configuration` with a **full `Variables={...}` block on every deploy**, which *replaces* the entire env — so any manually-set key would be wiped on the next deploy.

**Fix (decided: cold-start read):**
- Store `OPENAI_API_KEY` in **AWS SSM Parameter Store as a `SecureString`** (free tier, KMS-encrypted) under a fixed path (e.g. `/thejudge/openai-api-key`). The key never enters Git, the repo, or the Lambda function configuration.
- The Lambda **reads the key from SSM at cold start** (once per container), so redeploys never touch or clobber it. The `update-function-configuration` env block only ever carries non-secrets: `ASK_AI_PROVIDER=openai`, `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`, `OPENAI_API_KEY_SSM_PARAM` (the parameter path, not the value), plus the existing `NODE_ENV`/`FRONTEND_ORIGIN`/logging flags.
- Grant the **Lambda execution role** `ssm:GetParameter` on that parameter path plus KMS `Decrypt` on the key's CMK. The GitHub deploy role needs no key access.
- Document what may/may not live in Git and why GitHub needs **no** AWS keys (OIDC).

## Gap 2 — cost & scale guardrails

**Problem:** the Function URL is public with no throttle. On the AWS side, unbounded Lambda concurrency means a traffic flood could scale to many parallel executions and generate compute cost; there is no cost visibility or alert.

**Fix (two levers + visibility):**
- **AWS side:** set **Lambda reserved concurrency** to a low ceiling (e.g. `5`). This hard-caps parallel executions — excess requests throttle (429) instead of scaling to thousands. CloudFront `PriceClass_100` (already set) caps edge cost.
- **OpenAI side:** prepaid credits with no auto-renew are the backstop (owner-managed); document the OpenAI usage dashboard for visibility.
- **Visibility/alerting:** create an **AWS Budgets** budget with an email alert at a low threshold (e.g. ~$1–$5), and document the Cost Explorer / Billing dashboard so costs are checkable at a glance.
- (Deferred/optional) a lightweight in-Lambda rate limit if the public URL is ever abused — not needed for launch.

## Gap 3 — test gate before auto-deploy

**Problem:** `deploy-aws.yml` deploys on every push to `main` with no tests run — a broken commit ships automatically.

**Fix:** run `npm run quality:check` (the canonical pre-PR gate: typecheck + lint + format + test + coverage) as a required step/job before the deploy step, so a red build cannot deploy.

**Also (secrets hygiene):** move the hardcoded AWS account ID out of the committed workflow and scripts into a **GitHub Actions repository variable** (`vars.AWS_ACCOUNT_ID`), and construct the `role-to-assume` ARN and other account-scoped ARNs from it. The scripts already accept `AWS_ACCOUNT_ID` from the environment (only their fallback default is hardcoded), so the workflow passes the variable through. The account will be the owner's own new AWS account.

## Deliverables

### 1. Implementation changes (the three gaps)
Adapt the collaborator's scripts + workflow on a feature branch off `main`, incorporating Gaps 1–3.

### 2. Durable operator docs — `docs/aws/` (linked from root README "Operational References")
| File | Purpose |
|------|---------|
| `docs/aws/deployment.md` | Architecture overview + diagram, one-time bootstrap, how deploys work, first-time live-OpenAI setup, where the AWS-provided URLs come from |
| `docs/aws/operations.md` | Day-2 runbook: reading CloudWatch logs, rotating the OpenAI key, checking cost (Budgets/Cost Explorer/OpenAI dashboard), rollback, teardown |
| `docs/aws/secrets.md` | What can/can't go in Git, the SSM SecureString approach, OIDC (why no AWS keys in GitHub) |

These are durable references (survive after the work ships), distinct from this ephemeral `work/` folder.

## Slice table

| Slice | Name | Status | Depends on | Doc |
|-------|------|--------|------------|-----|
| 0 | **Owner-run:** IAM Identity Center (SSO) admin access to the new account | done | — | [slice-0](./slice-0-owner-sso-setup.md) |
| A | Adopt `aws_web_app` onto a feature branch off `main`; verify local build/tests green | done | — | [slice-a](./slice-a-adopt-branch.md) |
| B | Gap 3 — `quality:check` deploy gate; AWS account ID → GitHub repo variable | done | A | [slice-b](./slice-b-ci-gate-and-account-var.md) |
| C | Gap 1 — SSM SecureString + Lambda cold-start read; flip to `openai`; IAM grants | done | A | [slice-c](./slice-c-openai-secret-ssm.md) |
| D | Gap 2 — Lambda reserved concurrency + AWS Budgets alarm | done | A | [slice-d](./slice-d-cost-scale-guardrails.md) |
| E | `docs/aws/` operator docs (deployment, operations, secrets) + root README link | done | B, C, D | [slice-e](./slice-e-operator-docs.md) |
| F | First live deploy + verification on AWS URLs | done | C, D, E | [slice-f](./slice-f-first-live-deploy.md) |

## Implementation map

- **Slice 0 is owner-run and comes before everything that touches AWS** (bootstrap, C, D, F) — it sets up your SSO admin credentials. A and B need no AWS creds, so they can proceed in parallel with Slice 0.
- **A first** (adopt the branch), then **B, C, D run in parallel** (independent, each only depends on A).
- **E** follows B+C+D (docs must describe the final scripts/workflow).
- **F** is the human-in-the-loop first live deploy; needs C+D+E and the owner's AWS account.
- See `GAMEPLAN.md` for architecture, the secrets/identity flow, and the cold-start init detail.

## Non-goals

- No custom domain or ACM certificate (use default CloudFront/Function URL URLs).
- No IaC migration (CDK/Terraform) — keep the bash scripts.
- No product, prompt, or API-contract changes.
- No changes to the local `npm run dev` developer experience.

## Resolved decisions

- **OpenAI key location:** read from **SSM Parameter Store at Lambda cold start** — the key never sits in the function configuration. (See Gap 1.)
- **First-deploy ordering:** the SSM SecureString is set **before** bootstrap (key-first), so the provider is `openai` from the very first cold start with no mock-in-prod stage. (See Slice F runbook.)
- **Deploy path:** push to `main` (the `deploy-aws.yml` gate → OIDC → `aws-deploy.sh` pipeline) is the **primary** deploy mechanism, including the first live deploy; local `aws-deploy.sh` is a fallback. This is inherited in Slice A, hardened in Slice B, and first exercised end-to-end in Slice F.
- **AWS account ID:** the owner will use their **own new AWS account**, and the account ID moves into a **GitHub Actions repository variable** (`vars.AWS_ACCOUNT_ID`) rather than being committed in the workflow/scripts. (See Gap 3.)

## Source

- `IDEA.md` — original idea capture
- Reference commits: `e48687f` (Lambda entrypoint), `5ec761b` (AWS deployment automation) on `origin/aws_web_app`
