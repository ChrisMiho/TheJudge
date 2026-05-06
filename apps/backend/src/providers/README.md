# Ask AI Provider Boundary

This folder isolates answer-generation providers behind a stable interface so route handlers stay contract-focused.

## Current Providers

- `mockAskAiProvider.ts` is the Phase A provider used by default.
- It receives prepared prompt input (`context` + prompt diagnostics) and returns `AskAiResponse` (`answer: string`).
- `bedrockReadinessProvider.ts` now implements the Bedrock runtime invocation path through the AWS SDK while preserving the same provider interface.
- `createAskAiProvider.ts` selects provider based on runtime config.

### Bedrock runtime selection and config

- Provider selection is controlled by the explicit feature flag `ASK_AI_PROVIDER` (`mock` or `bedrock`).
- Default behavior is always `ASK_AI_PROVIDER=mock` when the flag is unset; this does not auto-switch based on `NODE_ENV` or deploy target.
- `ASK_AI_PROVIDER=bedrock` requires `AWS_REGION` and `BEDROCK_MODEL_ID`; config fails fast if either is missing.
- Optional runtime controls for Bedrock mode:
  - `BEDROCK_TIMEOUT_MS` (default `15000`)
  - `BEDROCK_MAX_ATTEMPTS` (default `2`)
- Route handlers remain provider-agnostic. Bedrock SDK wiring lives in provider/factory composition only.
- Error middleware returns the centralized API error shape (`{ code, message, metadata?, retryAfterSeconds? }`) regardless of provider mode.

## Interface Contract

- `askAiProvider.ts` defines `AskAiProvider.generateAnswer(preparedPrompt)`.
- `createApp()` accepts `askAiProvider` injection for tests and future integrations.

## Local AWS auth (profile/SSO first)

For local development, use the AWS SDK default credential chain with profile/SSO as the primary human workflow:

1. Configure AWS profile/SSO locally (`aws configure sso` + `aws sso login`).
2. Optionally set `AWS_PROFILE` if the profile is not `default`.
3. Run backend with Bedrock mode enabled (`ASK_AI_PROVIDER=bedrock`) and required non-secret config.

Fallback path (only when needed): set temporary env credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`). Do not commit secrets or long-lived keys.

## Product sequencing reference

Product-wide sequencing and gates: `PRD/analysis/MVP2-bedrock-integration-roadmap.md`. MVP1 closeout context: `PRD/archive/mvp1/README.md`.
