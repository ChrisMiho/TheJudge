# Ask AI Provider Boundary

This folder isolates answer-generation providers behind a stable interface so route handlers stay contract-focused.

## Current Providers

- `mockAskAiProvider.ts` is the Phase A provider used by default.
- It receives prepared prompt input (`context` + prompt diagnostics) and returns `AskAiResponse` (`answer: string`).
- `bedrockReadinessProvider.ts` is a non-invoking bootstrap provider used to verify config wiring in Phase A.
- `createAskAiProvider.ts` selects provider based on runtime config.

### Bedrock readiness bootstrap

- Provider selection is controlled by the explicit feature flag `ASK_AI_PROVIDER` (`mock` or `bedrock`).
- Default behavior is always `ASK_AI_PROVIDER=mock` when the flag is unset; this does not auto-switch based on `NODE_ENV` or deploy target.
- `ASK_AI_PROVIDER=bedrock` requires `AWS_REGION` and `BEDROCK_MODEL_ID`; config fails fast if either is missing.
- In Phase A, the bedrock provider intentionally throws a readiness-only error so production contract mapping can be tested without live Bedrock calls.
- Error middleware returns the centralized API error shape (`{ code, message, metadata?, retryAfterSeconds? }`) regardless of provider mode.

## Interface Contract

- `askAiProvider.ts` defines `AskAiProvider.generateAnswer(preparedPrompt)`.
- `createApp()` accepts `askAiProvider` injection for tests and future integrations.

## Phase B Handoff (Bedrock)

Product-wide sequencing and gates: `PRD/analysis/MVP2-bedrock-integration-roadmap.md`. MVP1 closeout context: `PRD/archive/mvp1/README.md`.

When Bedrock invocation begins:

1. Replace readiness provider implementation with real SDK invocation logic.
2. Keep `/api/ask-ai` request/response schema unchanged.
3. Continue wiring provider selection in composition/bootstrap code, not route handlers.
4. Preserve stack-order and fallback-question semantics already enforced upstream.
