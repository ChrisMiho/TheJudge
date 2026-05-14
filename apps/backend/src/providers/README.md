# Ask AI Provider Boundary

This folder isolates answer-generation providers behind a stable interface so route handlers stay contract-focused.

## Current Providers

- `mockAskAiProvider.ts` is the Phase A provider used by default.
- It receives prepared prompt input (`context` + prompt diagnostics) and returns `AskAiResponse` (`answer: string`).
- `openAiResponsesProvider.ts` implements the OpenAI Responses API runtime invocation path while preserving the same provider interface.
- `createAskAiProvider.ts` selects provider based on runtime config.

### OpenAI runtime selection and config

- Provider selection is controlled by the explicit feature flag `ASK_AI_PROVIDER` (`mock` or `openai`).
- Default behavior is always `ASK_AI_PROVIDER=mock` when the flag is unset; this does not auto-switch based on `NODE_ENV` or deploy target.
- `ASK_AI_PROVIDER=openai` requires `OPENAI_MODEL`; config fails fast if it is missing.
- Optional runtime controls for OpenAI mode:
  - `OPENAI_TIMEOUT_MS` (default `15000`)
  - `OPENAI_MAX_RETRIES` (default `2`)
- Route handlers remain provider-agnostic. OpenAI SDK wiring lives in provider/factory composition only.
- Error middleware returns the centralized API error shape (`{ code, message, metadata?, retryAfterSeconds? }`) regardless of provider mode.

## Interface Contract

- `askAiProvider.ts` defines `AskAiProvider.generateAnswer(preparedPrompt)`.
- `createApp()` accepts `askAiProvider` injection for tests and future integrations.

## Local OpenAI auth

For local development:

1. Keep non-secret runtime config in `apps/backend/.env` (`ASK_AI_PROVIDER`, `OPENAI_MODEL`, timeouts/retries).
2. Keep secret credentials in `.secrets/openai-dev.env` (`OPENAI_API_KEY`) copied from `secrets-templates/openai-dev.env.example`.
3. Run backend with OpenAI mode enabled (`ASK_AI_PROVIDER=openai`).

Do not commit secrets, and do not place `OPENAI_API_KEY` in `apps/backend/.env`.

Troubleshooting note: if OpenAI mode reports missing `OPENAI_MODEL`, ensure `apps/backend/.env` contains a non-empty value and that there is no blank shell export overriding it.

## Product sequencing reference

Product-wide sequencing and gates: `PRD/analysis/MVP2-openai-integration-roadmap.md`. MVP1 closeout context: `PRD/archive/mvp1/README.md`.
