# MVP2 Bedrock Integration Roadmap

## Purpose

This document is an execution handoff for agents to:

- continue from the completed MVP1 baseline without regressing contracts or UX
- transition the backend from Phase A mock responses to real Amazon Bedrock calls
- preserve existing API contract and staged UX behavior

This roadmap follows current product truth from:

- `PRD/sections/decisions.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/non-functional-requirements.md`
- `PRD/README.md` (control plane and read order)
- `PRD/stories/` (active MVP2+ per-story scope)
- `PRD/archive/mvp1/stories/` (MVP1 acceptance history)

Historical MVP1 continuity references:

- `PRD/archive/mvp1/README.md`
- `PRD/archive/mvp1/key-decisions.md`
- `PRD/archive/mvp1/reference-links.md`

## Current Baseline (Start State)

- Monorepo with `apps/frontend` and `apps/backend`
- Backend provider boundary already exists and is Bedrock-ready in principle (`STORY-014`, `STORY-028`)
- API contract must remain stable:
  - `POST /api/ask-ai` request shape remains unchanged
  - success response remains `{ "answer": "string" }`
  - failure responses follow the canonical error JSON contract below (aligned with `PRD/sections/integrations-and-data.md` and schema-first backend types)
- MVP1 flow, context capture, and closeout hardening (`STORY-046` through `STORY-054`) are complete; this document is the forward execution plan.

## Feature flags vs environment configuration

- **Feature flags** control *which behavior runs* (for example: use the live Bedrock provider path vs keep the mock provider path). Flags must be explicit and evaluated at the composition/provider boundary, not inferred from “what environment we are in.”
- **Environment variables** supply *configuration for the running deployment*: API origins, CORS, AWS region, model identifiers, credential material, log toggles, timeouts, etc. They do **not** replace feature flags as the switch for mock vs live ask behavior.
- **Anti-pattern:** coupling functionality to `NODE_ENV`, hostname, or implicit “dev vs prod” alone without a named flag documented in runbooks.

## Canonical `POST /api/ask-ai` error contract (best practice)

Clients should branch on `**code`** (stable machine-readable). `**message`** is for humans and may change copy without a breaking API change. `**metadata`** is optional and intentionally small.

**JSON body (strict keys)**


| Field               | Type             | Required | Notes                                                                                               |
| ------------------- | ---------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `code`              | string enum      | yes      | One of: `VALIDATION_ERROR`, `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `UNEXPECTED_ERROR`          |
| `message`           | string           | yes      | Human-readable summary                                                                              |
| `metadata`          | object           | no       | If present: only `correlationId` and/or `details` (see product rules for when `details` is emitted) |
| `retryAfterSeconds` | positive integer | no       | Hint for retryable provider failures                                                                |


**HTTP status (baseline mapping)**


| HTTP  | `code`                 |
| ----- | ---------------------- |
| `400` | `VALIDATION_ERROR`     |
| `503` | `PROVIDER_UNAVAILABLE` |
| `504` | `PROVIDER_TIMEOUT`     |
| `500` | `UNEXPECTED_ERROR`     |


**Headers**

- Responses should continue to expose `**X-Correlation-Id`** so browser and server logs can be joined.

**Why this shape**

- Stable `**code`** supports frontend retry/cooldown logic and observability dashboards without parsing prose.
- `**message`** stays user- and agent-friendly.
- `**metadata.correlationId`** ties failures to structured logs without widening the contract arbitrarily.

## Hard Rules For MVP2

- Keep frontend and backend independently deployable release units.
- Bedrock credentials remain backend-only (NFR-003).
- Do not introduce rules-engine logic, legality checks, or board simulation.
- Preserve stack order semantics (`stack[0]` bottom, last item top).
- Do not break existing frontend behavior while changing backend provider internals.
- **Functional toggles** (mock vs live Bedrock on the ask path) are **feature-flag driven**, not implied by environment name alone.

## MVP1 Closeout Gate (Complete)

The following stories were required before live Bedrock rollout; they are done. Use them as regression anchors when changing provider internals:

- `STORY-046` backend error taxonomy + centralized middleware
- `STORY-047` prompt/context build ownership consolidation
- `STORY-048` backend logging standardization (`pino`) + payload toggle
- `STORY-049` backend test layering + fixture reuse
- `STORY-050` shared target editor extraction
- `STORY-051` battlefield step componentization
- `STORY-052` stack builder componentization
- `STORY-053` ask-ai submit/retry orchestration polish
- `STORY-054` homepage app title visibility

### Exit Criteria For MVP1 Closeout (Met)

- quality gate passes (`npm run quality:check`)
- no contract regressions in backend tests
- frontend staged-flow regressions remain green
- logging/error behavior is deterministic and documented

Operational and contract detail for local debugging lives in `README.md` (Operational References) and `PRD/sections/integrations-and-data.md`, not in a root story checklist.

## MVP2 Phase Plan

## Task 0 - Secrets hygiene baseline (must land first)

### Goal

Ensure no credentials or secret material are committed while MVP2 integration work begins.

### Scope

- create a local-only `.secrets/` folder convention for AWS credentials and any sensitive integration artifacts used during development.
- enforce git protection by ignoring `.secrets/` in `.gitignore`.
- document that secrets must never be pushed to GitHub and must not appear in PR diffs, story docs, or screenshots.
- keep committed `.env.example` files as placeholders only; real values remain local/dev-secret managed.

### Deliverables

- `.gitignore` contains `.secrets/`.
- roadmap/runbook note that all credentials and secret files stay under `.secrets/` (or external secret manager) and are never committed.

### Exit Criteria

- team confirms `.secrets/` is ignored by git on all local clones.
- no committed files include real secrets, keys, tokens, or credential JSON payloads.

## Phase 1 - Bedrock Runtime Foundation

### Goal

Enable real Bedrock invocation behind the existing provider interface without changing external API shape.

### Scope

- finalize **provider selection** at the factory: mock remains the default for CI and for flag-off paths; Bedrock implementation exists behind the same interface.
- define **feature flag(s)** that choose mock vs live provider at runtime (documented names and defaults); document how operators turn Bedrock on in DEV without implying prod behavior.
- define required **environment configuration** (region, model id, timeouts, retries, credentials) validated at startup when the Bedrock path is eligible to run.
- document a **novice-safe local auth path**: AWS SDK default credential chain with profile/SSO-first guidance; explicit env-var credentials are fallback only.
- add startup validation with clear fail-fast errors when configuration is incomplete for the selected path.
- implement Bedrock client factory and invoke path in the provider layer (no Bedrock SDK imports in route handlers)

### Deliverables

- backend config module with strict validation
- provider factory with explicit mode selection
- Bedrock provider implementation + typed adapter response
- updated `.env.example` and provider docs

### Exit Criteria

- backend starts only when Bedrock config is valid in Bedrock mode
- mock mode still works exactly as before
- no request/response schema change on `/api/ask-ai`

## Phase 2 - Reliability and Observability

### Goal

Make Bedrock behavior safe to debug and operate.

### Scope

- map Bedrock failures into stable machine-readable error codes (build on `STORY-046`)
- standardize structured logs with correlation IDs (build on `STORY-048`)
- capture timing metrics per provider call:
  - total request latency
  - provider latency
  - timeout/retry counts
- define payload logging policy with a safe redaction strategy

### Deliverables

- error mapper for Bedrock SDK/runtime failures
- structured log fields contract in backend docs
- alarm-ready metric naming guidance for future AWS deployment

### Exit Criteria

- known failure classes return stable API error semantics
- correlation ID traces include provider lifecycle milestones
- logs are useful without exposing secrets

## Phase 3 - Prompt context pipeline and model-facing shape

### Goal

**Enrich and harden the data path from validated request to model input**—not “vibes-based” answer scoring. Phase 3 is where you refine how structured game/stack/battlefield data is **retrieved** (from the already-validated request), **normalized**, **ordered**, and **molded** into the prompt (system/user sections, budgets, guardrails) before and after Bedrock is live.

### Scope

- keep **deterministic** rules in the preparation layer (`STORY-047` boundary): same validated payload → same prompt-shaped artifact for tests (minus true LLM stochasticity where explicitly out of scope for fixtures).
- refine **context assembly**: field selection, ordering, omission rules (e.g. LLM-facing vs debug-only), stack role markers, staged sections (game / battlefield / stack), and any prompt-size budgeting already required by product constraints.
- tighten **instruction text** bundled with that context: assistant-not-judge tone, no invented hidden game state, table-friendly brevity—implemented as versioned prompt templates with clear ownership.
- extend the **eval harness** so regressions are detected on **prompt/context shape and guardrails**, including high-card-count and awkward targeting edge cases—not on subjective “quality” scoring unless you add a separate explicit rubric later.

### Deliverables

- versioned prompt templates + changelog note (what changed and why)
- additional **fixture-backed** tests for prompt output structure and edge payloads
- short **engineering checklist** for “safe prompt delta” reviews (contract unchanged, preparation layer only, tests updated)

### Exit Criteria

- eval harness and contract tests green with **Bedrock flag on in DEV** where applicable, without widening the HTTP request/response schema
- documented mapping from **request fields → prompt sections** so a new agent can change preparation without reverse-engineering the codebase

## Phase 4 - DEV rollout and process (production deferred)

### Goal

Ship a **brittle-but-real DEV path** for Bedrock behind **feature flags**, with enough **process documentation** that production can be introduced later without rediscovering steps. Expect **extended soak testing in DEV only** for now.

### Separate frontend and backend deployments

Treat **frontend** and **backend** as **independent release units** end-to-end in DEV (and later in prod):

- **Two pipelines / two artifacts:** frontend build (static assets + env-injected `VITE_API_URL`) and backend build (Node service exposing `/api/ask-ai` and `/api/health`) deploy on their own cadence; neither build bundles the other.
- **Contract at the wire only:** the browser talks to the backend **origin** configured at frontend build or runtime; CORS and `FRONTEND_ORIGIN` (or equivalent) are documented per DEV backend deployment.
- **Runbook explicitly lists:** order of operations when only one side changes (e.g. backend first when the API contract changes; frontend first when only UI changes), smoke checks after each deploy, and rollback per side.

### Recommended AWS stack for DEV (first footprint)

Pick concrete services for the **first** AWS-backed DEV environment so IAM (Phase 5) and runbooks stay specific. Defaults below match the repo stack (**React + Vite** frontend, **Node** backend) and **Bedrock** from the backend only.


| Layer            | Role                          | Suggested AWS services (DEV)                                                                                                                    |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend         | Static SPA, own URL           | **Amazon S3** (bucket) + **CloudFront** distribution, **or** **Amplify Hosting** for a managed static-hosting path                              |
| Backend          | Node HTTP API, Bedrock caller | **AWS App Runner** *or* **Amazon ECS on Fargate** behind an **Application Load Balancer** (choose one pattern for DEV and document it)          |
| Model access     | From backend task only        | **Amazon Bedrock** (`InvokeModel` / converse APIs as chosen); no Bedrock calls from the browser                                                 |
| Secrets / config | Non-code configuration        | **AWS Secrets Manager** *or* **SSM Parameter Store** for secrets; plain parameters for non-secret tuning if appropriate                         |
| Logs             | Operational visibility        | **Amazon CloudWatch Logs** for backend (and App Runner/ECS service logs); optional **CloudWatch Metrics** for ask-ai latency/error counts later |


**Not in initial DEV scope unless you need it:** multi-region, autoscaling policies beyond platform defaults, WAF—add when moving toward Phase 6.

### Scope

- **DEV-only** enablement: document how to deploy **frontend and backend separately** to the DEV footprint above, which env vars and flags are required, and which **feature flag** turns on the live Bedrock path on the backend.
- **When Bedrock is unavailable or misconfigured:** return the **canonical error contract** with stable `code` and optional `retryAfterSeconds`; do not silently change success-shape behavior.
- **Optional temporary mock fallback** (if ever used): only behind an **explicit second flag** and documented as emergency-only; default remains honest provider errors so failures are visible.
- **Production / preview / SLO work is out of scope** until you explicitly start a later phase; keep a stub checklist in the runbook (“when we add prod: …”) so criteria are not invented under pressure.

### Deliverables

- **Runbook**: deploy DEV backend and DEV frontend independently, set flags, verify health + one ask-ai success path + forced failure path, rollback (flag off / redeploy prior build per side).
- **Environment matrix (DEV row filled)**: separate columns for frontend origin, backend origin, flags, env vars, CORS—no requirement to fill prod/staging rows yet.
- **Debug playbook**: map SDK/provider exceptions → `AppError` / HTTP / log fields.

### Exit Criteria

- team can repeat **DEV Bedrock on/off** from the runbook without tribal knowledge
- contract tests and manual smoke path documented; failures remain **predictable** per the error contract
- runbook states explicitly that **frontend and backend are deployed and rolled back independently**

## Phase 5 - IAM roles and access standards (AWS)

### Goal

Before or as soon as workloads run on AWS, define **IAM roles and policies** so Bedrock, logging, and deployment follow **least privilege** and common AWS standards—avoid long-lived broad keys and “`*` on production” drift.

### Scope

- **Runtime identity (backend compute):** one **task / execution role** (App Runner, ECS task role, or equivalent) used by the Node process that:
  - invokes **Bedrock** only for the intended actions and resource ARNs (model IDs / foundation-model access as applicable),
  - writes to **CloudWatch Logs** only for required log groups,
  - reads **Secrets Manager** / **SSM** only for the secrets/parameters that service needs.
- **Deployment / CI identity:** separate role(s) for pipelines (push image, update App Runner/ECS, invalidate CloudFront) with **narrow** permissions; no reuse of the runtime task role for deploy if avoidable.
- **Human break-glass:** document who may assume admin-style roles and when; keep out of the default runbook path.
- **Standards alignment:** document choices against least privilege, no static credentials on compute where **IRSA** / **task roles** apply, and separation of duties between deploy vs runtime.
- **Review gate:** short checklist before widening permissions (e.g. adding `bedrock:`*, cross-account, or new regions).

### Deliverables

- **IAM design note** in-repo (or linked doc): role names, trust relationships, policy JSON or IaC pointers, and which role each component uses.
- **Bedrock access** documented as identity-based (and/or resource policies if used) with explicit model/region scope.
- **Diagram or table**: frontend (no AWS keys) → public HTTPS → backend task role → Bedrock / Logs / Secrets.

### Exit Criteria

- backend can call Bedrock and emit logs **using only the documented task role** (no embedded AWS access keys in the app image for normal operation)
- deploy path documented with its own **least-privilege** role
- no undocumented `*` actions on shared production-bound roles without an explicit exception record

## Phase 6 - AWS deployment expansion (deferred)

### Goal

Later: balanced AWS hosting with frontend/backend still independently deployable.

### Note on earlier “latency/cost targets” question

That referred to **production-style** exit gates (for example: “p95 ask latency under X ms” or “monthly Bedrock spend under $Y”). Those numbers are **meaningful only when you are scoping a real production environment** and traffic shape. Until then, Phase 6 stays **deferred**; DEV soak does not need arbitrary SLOs in this roadmap.

### Scope (placeholder for when you pick this up)

- backend: managed compute (App Runner or ECS Fargate) with autoscaling
- frontend: static hosting (S3 + CloudFront or Amplify Hosting)
- secrets/config: Secrets Manager or SSM Parameter Store
- runtime logs/alerts: CloudWatch
- **Build on Phase 5 IAM** so prod roles are tightened versions of DEV patterns, not a parallel permission model.

### Exit Criteria (to be defined when Phase 6 starts)

- frontend and backend release independently
- CORS and environment config are stable across intended environments
- explicit **SLO and cost budgets** agreed for prod (not filled in during DEV-only phase)

## Suggested Agent Execution Order

1. Confirm MVP1 closeout baseline remains green (`npm run quality:check`).
2. Complete **Task 0 secrets hygiene baseline** (`.secrets/` convention + ignore rules + documentation guardrails).
3. Implement Phase 1 foundation with no behavior changes in mock mode.
4. Add Phase 2 reliability/observability before broad Bedrock enablement.
5. Run Phase 3 iterations on the **prompt preparation pipeline** and fixtures until exit criteria are met.
6. Execute Phase 4 **DEV rollout process** (separate FE/BE deploys, AWS DEV stack as documented) and extend soak testing; capture learnings in the runbook.
7. Complete Phase 5 **IAM roles and access standards** before treating any AWS path as “stable”; revisit when adding new services or regions.
8. Defer Phase 6 until production hosting is in scope; only then define SLO/cost gates.

## Dependency Graph (High Level)

```mermaid
flowchart LR
  mvp1Done[MVP1CloseoutComplete] --> task0[Task0SecretsHygiene]
  task0 --> phase1[Phase1Foundation]
  phase1 --> phase2[Phase2ReliabilityObservability]
  phase2 --> phase3[Phase3PromptContextPipeline]
  phase3 --> phase4[Phase4DevRolloutSeparateDeployments]
  phase4 --> phase5[Phase5IAMAccessStandards]
  phase5 --> phase6[Phase6AWSProdExpansionDeferred]
```



## Risks and Mitigations

- Risk: Bedrock integration breaks request/response contract
  - Mitigation: schema-first tests and contract fixtures remain blocking gates
- Risk: noisy logs or missing traces slow debugging
  - Mitigation: structured logging fields + correlation ID lifecycle checks
- Risk: latency degrades gameplay usefulness
  - Mitigation: timeout/retry policy + p95 tracking + prompt budget controls
- Risk: infrastructure decisions made too early
  - Mitigation: Bedrock quality and reliability gates before full AWS hosting expansion
- Risk: IAM sprawl or over-broad roles on first AWS deploy
  - Mitigation: Phase 5 role boundaries, explicit Bedrock/Logs/Secrets scopes, and no shared admin role as the default runtime identity

## Definition of Done for MVP2 (DEV-first milestone)

- `/api/ask-ai` can run **Bedrock in DEV** when the **feature flag** is on, with **mock** unchanged when the flag is off
- **Prompt preparation** changes are covered by **fixtures/eval** and contract tests; HTTP schema unchanged
- **Failure handling** matches the canonical error contract and remains safe for the existing retry UX
- **Runbooks** exist for DEV flag on/off, configuration, rollback, and debugging provider failures, including **independent frontend and backend** deploy and rollback steps
- **IAM design** for the first AWS DEV footprint is documented (Phase 5) before calling that environment “stable”
- Phase 6 / production SLOs are explicitly **out of scope** until a separate initiative starts

