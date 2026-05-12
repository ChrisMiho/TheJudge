# OpenAI Migration Impact Analysis (Bedrock -> OpenAI)

## Purpose

Document every code, config, tooling, and documentation surface that must be updated to move TheJudge from Amazon Bedrock/AWS runtime integration to the OpenAI API.

## Assumptions

- We are replacing the live provider path, not removing the existing `mock` mode.
- `ASK_AI_PROVIDER` remains the runtime selector, but allowed live value changes from `bedrock` to `openai`.
- Backend-only secret boundary remains required.
- Existing API contract (`POST /api/ask-ai` request shape and `{ "answer": "string" }` success response) should remain unchanged unless explicitly approved.

## Critical Runtime Changes (Must Update)

- `apps/backend/src/config.ts`
  - Change provider enum/validation from `mock|bedrock` to `mock|openai`.
  - Remove Bedrock-only env keys (`AWS_REGION`, `BEDROCK_MODEL_ID`, `BEDROCK_TIMEOUT_MS`, `BEDROCK_MAX_ATTEMPTS`).
  - Add OpenAI config keys (at minimum API key + model + timeout/retry strategy keys if needed).
  - Replace Bedrock-specific fail-fast error messaging with OpenAI-specific guidance.

- `apps/backend/src/providers/createAskAiProvider.ts`
  - Replace Bedrock branch with OpenAI provider selection branch.
  - Rename provider client injection option(s) for testing (currently `bedrockClient`).

- `apps/backend/src/providers/bedrockReadinessProvider.ts`
  - Replace with an OpenAI provider implementation file (or repurpose this file with a new name).
  - Swap AWS Bedrock `Converse` request/response parsing for OpenAI request/response parsing.
  - Keep provider output mapped to `{ answer: string }`.
  - Preserve canonical app errors (`PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`) with provider-appropriate diagnostics.

- `apps/backend/src/index.ts`
  - Remove AWS-specific dotenv merge/loading behavior:
    - `.secrets/aws-bedrock-dev.env`
    - `AWS_*`, `BEDROCK_*` key backfill behavior
  - Replace with OpenAI secret loading strategy and key list.

## Test Suite Impact (Must Update)

- `apps/backend/src/config.test.ts`
  - Update provider parsing and validation expectations from Bedrock to OpenAI.
  - Replace Bedrock-required env test cases with OpenAI-required env test cases.
  - Update invalid provider tests so `openai` is accepted and any removed values are rejected.

- `apps/backend/src/providers/createAskAiProvider.test.ts`
  - Replace fake Bedrock client tests with fake OpenAI client tests.
  - Update provider selection assertions and empty-output behavior mapping.

- `apps/backend/src/app.contract.test.ts`
  - Rename Bedrock-specific contract test cases and fake client setup.
  - Update any hardcoded response text mentioning Bedrock in mock assertions.

- `apps/backend/src/app.behavior.test.ts`
  - Update provider error detail expectations that currently refer to Bedrock-specific wording.

## Dependencies and Commands (Must Update)

- `apps/backend/package.json`
  - Remove `@aws-sdk/client-bedrock-runtime`.
  - Add `openai` SDK dependency (official package).

- `package.json` (repo root)
  - Replace `dev:bedrock` script with `dev:openai` (or transitional alias + new canonical command).
  - Replace `aws:verify` command with an OpenAI verification command.

- `package-lock.json`
  - Regenerate to reflect dependency and script changes.

## Local Tooling and Secret Templates (Must Update)

- `scripts/aws-verify.mjs`
  - Replace with OpenAI verification script (for example, key/model sanity check and minimal API call).
  - Remove AWS CLI assumptions (`sts`, `bedrock list-foundation-models`).

- `secrets-templates/aws-bedrock-dev.env.example`
  - Replace with OpenAI-focused template and filename (for example OpenAI dev secret env template).

- `apps/backend/.env.example`
  - Replace Bedrock/AWS config block with OpenAI config block.
  - Update command references to new verify/dev commands.

## Backend Provider Documentation (Must Update)

- `apps/backend/src/providers/README.md`
  - Rewrite provider runtime section from Bedrock to OpenAI.
  - Replace AWS profile/SSO guidance with OpenAI key management guidance.
  - Update troubleshooting notes and required env variables.

## Root/Product Documentation (Must Update)

- `README.md`
  - Replace all Bedrock setup/run/verify references.
  - Update environment variable docs and local auth guidance.
  - Rename command docs (`dev:bedrock`, `aws:verify`) to OpenAI equivalents.

- `PRD/analysis/new-machine-setup-and-bedrock-onboarding.md`
  - Rewrite onboarding to OpenAI setup (or supersede with a new OpenAI onboarding file and deprecate this one).

- `PRD/analysis/local-iam-and-aws-transition-gameplan.md`
  - This file becomes obsolete if AWS is no longer the provider path.
  - Either archive as historical context or replace with an OpenAI key-management/deployment transition plan.

## Active PRD Strategy/Scope Docs (Must Update for Source-of-Truth Consistency)

- `PRD/README.md`
  - Current MVP2 phase framing is Bedrock/AWS-centric; update active roadmap and checklist labels.

- `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
  - Replace with OpenAI roadmap equivalent (new file name recommended), then update references.

- `PRD/stories/STORY-056-provider-feature-flag-selection.md`
- `PRD/stories/STORY-057-bedrock-config-validation.md`
- `PRD/stories/STORY-058-bedrock-provider-integration.md`
- `PRD/stories/STORY-059-bedrock-error-mapping-contract.md`
- `PRD/stories/STORY-060-provider-observability-contract.md`
- `PRD/stories/STORY-063-bedrock-eval-harness-expansion.md`
- `PRD/stories/STORY-067-phase6-production-expansion-planning.md`
  - These active stories either need rename/re-scope to OpenAI or replacement with new story IDs for OpenAI-specific scope.

- `PRD/sections/integrations-and-data.md`
  - Update provider/dependency statements from Bedrock/AWS SDK to OpenAI.
  - Update API design wording that says prompt is built for Bedrock.

- `PRD/sections/non-functional-requirements.md`
  - Update NFR wording that currently says Bedrock credentials and direct Bedrock access constraints.

- `PRD/sections/overview.md`
  - Replace "mock-first before real Bedrock integration" wording.

- `PRD/instructions/technical-design-rules.md`
  - Replace "AWS Bedrock through backend only" with OpenAI backend-only rule.

- `PRD/instructions/story-generation.md`
- `PRD/stories/DEFINITION-OF-DONE.md`
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/agent-working-rules.md`
  - Update any references that hardcode the Bedrock roadmap filename or Bedrock-specific scope language.

## Optional / Historical Cleanup

- `PRD/archive/mvp1/**`
  - Contains many Bedrock references but is historical.
  - Recommendation: keep content unchanged unless we want terminology normalization across archives.

- Existing analysis docs with Bedrock naming that are no longer active:
  - `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
  - `PRD/analysis/new-machine-setup-and-bedrock-onboarding.md`
  - `PRD/analysis/local-iam-and-aws-transition-gameplan.md`
  - Recommendation: either supersede with OpenAI versions and mark older files as historical, or fully rewrite in place.

## Non-Repo Operational Changes (Not Code, But Required)

- CI/CD environment secrets and deployment variable names must be migrated from AWS/Bedrock keys to OpenAI keys.
- Any cloud IAM policies/roles created only for Bedrock runtime can be retired once no longer needed.
- Team runbooks should remove AWS CLI/SSO onboarding steps for local provider validation.

## Suggested Execution Sequence

1. Finalize OpenAI config contract (`ASK_AI_PROVIDER` values + required env keys).
2. Implement provider runtime swap (`config.ts`, provider factory, provider implementation, `index.ts` env loading).
3. Update backend tests to lock behavior and error mapping.
4. Update scripts/templates/commands (`aws-verify`, env examples, `dev:bedrock`).
5. Update root/backend docs.
6. Update PRD active roadmap/stories/sections so source-of-truth matches implementation direction.
7. Archive or supersede Bedrock-specific analysis docs.

## Key Migration Risks

- Hidden contract drift during provider swap (mitigation: keep contract tests as blocking gate).
- Incomplete docs causing mixed setup paths (mitigation: update root README + provider README + PRD control-plane together).
- Partial PRD migration leaving Bedrock roadmap as active source-of-truth (mitigation: replace roadmap references first in `PRD/README.md`).
