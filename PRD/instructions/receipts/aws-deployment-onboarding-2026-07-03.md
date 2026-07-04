# Cleanup receipt — aws-deployment-onboarding

- Date: 2026-07-03
- Slug: `aws-deployment-onboarding`
- Status: shipped

## Actions taken

- [x] Verified Slices 0 and A–F against the implementation, durable operator docs, repository history, and recorded first-deploy results
- [x] Confirmed the canonical quality gate passes
- [x] Confirmed deployment scripts are syntactically valid and contain no committed AWS account ID
- [x] Confirmed deployment configuration does not assign `OPENAI_API_KEY`
- [x] Confirmed the Lambda package excludes the runtime-provided SSM SDK
- [x] Retained the shipped `docs/aws/` operator references and root README links
- [x] Promoted production status and the durable AWS deployment decision into PRD truth
- [x] Added the shipped AWS production deployment subsystem to `sections/system-map.md`
- [x] Deleted the ephemeral `PRD/work/aws-deployment-onboarding/` package
- [x] Left `PRD/README.md` unchanged because navigation did not change and the package had no active-work row

## Files created

- `PRD/instructions/receipts/aws-deployment-onboarding-2026-07-03.md`
- `PRD/sections/decisions/deployment.md`

## Files updated

- `PRD/sections/decisions.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/sections/overview.md`
- `PRD/sections/system-map.md`

## Files deleted

- `PRD/work/aws-deployment-onboarding/GAMEPLAN.md`
- `PRD/work/aws-deployment-onboarding/IDEA.md`
- `PRD/work/aws-deployment-onboarding/README.md`
- `PRD/work/aws-deployment-onboarding/slice-0-owner-sso-setup.md`
- `PRD/work/aws-deployment-onboarding/slice-a-adopt-branch.md`
- `PRD/work/aws-deployment-onboarding/slice-b-ci-gate-and-account-var.md`
- `PRD/work/aws-deployment-onboarding/slice-c-openai-secret-ssm.md`
- `PRD/work/aws-deployment-onboarding/slice-d-cost-scale-guardrails.md`
- `PRD/work/aws-deployment-onboarding/slice-e-operator-docs.md`
- `PRD/work/aws-deployment-onboarding/slice-f-first-live-deploy.md`

## Verification results

- `npm run quality:check` — PASS: typecheck, lint, format check, 582 frontend tests, 223 backend tests, and both coverage gates passed
- `bash -n scripts/aws-bootstrap.sh scripts/aws-deploy.sh scripts/package-lambda.sh` — PASS
- account-ID scan over `.github/` and `scripts/` — PASS: no 12-digit account ID found
- deployment-file scan for `OPENAI_API_KEY=` — PASS: no assignment found
- `bash scripts/package-lambda.sh` plus packaged dependency check — PASS: artifact built and `.tmp/lambda-package/node_modules/@aws-sdk/client-ssm` is absent
- Implementation review — PASS: workflow quality gate precedes deploy; SSM cold-start loader has five passing tests; bootstrap includes SSM/KMS permissions, guarded reserved concurrency, AWS Budget setup, and `PriceClass_100`
- Durable docs review — PASS: `docs/aws/deployment.md`, `docs/aws/operations.md`, and `docs/aws/secrets.md` exist and are linked from the root README
- Live deployment — PASS based on the owner's current confirmation that the cloud app is working and the recorded Slice F evidence: frontend and health endpoint served successfully, real OpenAI answers completed, the key was absent from Lambda configuration, and the AWS Budget was present
- Public contract — PASS: no product API, prompt, stack-ordering, or local mock-default contract change
- Secrets — PASS: no secret material was introduced during cleanup; production key remains in SSM
