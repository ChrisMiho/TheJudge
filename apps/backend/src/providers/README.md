# Ask AI Provider Boundary

This folder isolates answer-generation providers behind a stable interface so route handlers stay contract-focused.

## Current Provider

- `mockAskAiProvider.ts` is the Phase A provider used by default.
- It receives validated `AskAiRequest` input and returns `AskAiResponse` (`answer: string`).

## Interface Contract

- `askAiProvider.ts` defines `AskAiProvider.generateAnswer(request)`.
- `createApp()` accepts `askAiProvider` injection for tests and future integrations.

## Phase B Handoff (Bedrock)

When Bedrock integration begins:

1. Add a Bedrock-backed provider in this folder that implements `AskAiProvider`.
2. Keep `/api/ask-ai` request/response schema unchanged.
3. Wire provider selection in composition/bootstrap code, not inside route handlers.
4. Preserve stack-order and fallback-question semantics already enforced upstream.
