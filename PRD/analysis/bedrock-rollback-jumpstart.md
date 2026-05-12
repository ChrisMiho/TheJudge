# Bedrock Rollback Jumpstart

If we need to roll back from OpenAI to the prior AWS Bedrock implementation, use this as the quick recovery reference.

## Pinned rollback commit

- Full SHA: `dc84780b54bafa227aae1bfa98307ae06c428479`
- Short SHA: `dc84780`
- Commit message: `Add shared skills for analysis-to-story backlog flow.`

## Quick restore flow

1. Create a rollback branch from the pinned commit:
   - `git checkout -b rollback/bedrock-restore dc84780b54bafa227aae1bfa98307ae06c428479`
2. Install dependencies:
   - `npm install`
3. Validate Bedrock credentials/config:
   - `npm run aws:verify`
4. Start Bedrock mode:
   - `npm run dev:bedrock`
5. Run baseline quality checks:
   - `npm run quality:check`

## Required Bedrock env/config surface

- Backend provider mode:
  - `ASK_AI_PROVIDER=bedrock`
- Required Bedrock config:
  - `AWS_REGION`
  - `BEDROCK_MODEL_ID`
- Optional Bedrock runtime tuning:
  - `BEDROCK_TIMEOUT_MS`
  - `BEDROCK_MAX_ATTEMPTS`
- Optional profile auth:
  - `AWS_PROFILE`

## Key Bedrock implementation files

- `apps/backend/src/config.ts`
- `apps/backend/src/index.ts`
- `apps/backend/src/providers/createAskAiProvider.ts`
- `apps/backend/src/providers/bedrockReadinessProvider.ts`
- `apps/backend/.env.example`
- `scripts/aws-verify.mjs`
- `secrets-templates/aws-bedrock-dev.env.example`
- `apps/backend/src/providers/README.md`
- `README.md`

## Notes

- We are intentionally **not** keeping a Bedrock archive path active in `main`.
- Git history + this pinned commit are the rollback source of truth.
