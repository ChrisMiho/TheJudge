# Sweep — future-infra

- Date: 2026-08-30
- Corpus: 8 AWS infra concern-areas (defined, not on-disk files) — a forward
  architecture study, not an existing-corpus audit
- Question: Given the S3-staged Lambda deploy just landed (package ceiling
  ~50MB → 250MB) and RAG-for-rules is coming, what should TheJudge's AWS infra
  become? Per concern-area: current state → target → gap, plus general better
  practices.
- Verdicts (per recommendation): now / with-rag / later
  - `now` — do alongside the current Lambda/deploy work; there is a forcing
    function today
  - `with-rag` — required before or with RAG-for-rules lands
  - `later` — general best-practice, no forcing function yet
- Scored against: the real repo as current-state reference — `docs/aws/*`,
  `scripts/aws-*.sh` + Lambda-package/deploy tests, `.github/workflows/
  quality-check.yml`, `PRD/sections/system-map.md`, and the retrieval code
  under `apps/backend/src/` + bundled data under `apps/backend/data/`
- Cost plan: worker sonnet/high, 1 section/agent, 8 agents, synthesis opus
- Workflow runId: wf_07fc586e-a93

## Grounding facts the workers start from
- Backend is one Express app on a single Lambda (nodejs24, arm64, 512MB, 20s)
  behind a public Function URL (auth NONE); OpenAI key read from SSM at cold
  start; OpenAI Responses API.
- "RAG for rules" today is NOT RAG: keyword/IDF scoring over static JSON
  bundled inside the Lambda zip (`gameRulesRetrieval.ts`, System 2 curated +
  System 3 top-5 excerpts). No embeddings, no vector store.
- The Lambda already bundles ~60MB of static data
  (`cardRulingsByOracleId.json` 19.5MB + `commanderSpellbookCombos.json.gz`
  37.5MB) — the reason the 250MB S3-staged ceiling matters.
- IaC is shell scripts (`aws-bootstrap.sh` + `aws-deploy.sh`), no
  Terraform/CDK/SAM. CloudFront+S3 frontend, OIDC deploy role, $5 monthly
  budget, fixed-key artifact object overwritten every deploy (no history).

## Sections (batch = 1 each)
1. lambda-compute-packaging
2. rag-data-plane
3. retrieval-architecture
4. iac-deploy-pipeline
5. security-secrets-iam
6. observability-cost-guardrails
7. networking-edge-api
8. scaling-concurrency
