# Slice A — Answer budget (provider deadline, config, product truth for the budget)

## Status: planned

## Goal

A player's AI call gets one 30-second budget covering every attempt, and an expired budget always reads as PROVIDER_TIMEOUT (504).

## Requirements

1. Provider (`apps/backend/src/providers/openAiResponsesProvider.ts`): one overall deadline per request (an abort signal on the overall deadline passed beside the SDK's own per-attempt timeout is the suggested mechanism; the choice is yours). The budget starts when the provider call starts and covers every attempt. No attempt outlives the deadline; no retry starts after it is spent; a slow answer that used the budget is never restarted.
2. Classify an expired budget by cause, not message: the SDK abort error (`APIUserAbortError`, 'Request was aborted.') and the existing timeout errors all map to `PROVIDER_TIMEOUT` (504, 'Miho is working on it'), never `PROVIDER_UNAVAILABLE`. A fast failure (dropped connection, 5xx) still retries inside the remaining budget.
3. Config (`apps/backend/src/config/index.ts`): `DEFAULT_OPENAI_TIMEOUT_MS` becomes 30000 and keeps its name and `const NAME = 30000` literal form (the eval script reads it by regex); the retries default becomes 1; `OPENAI_MAX_RETRIES=0` becomes valid ('never retry'); negative and non-integer values stay invalid. `OPENAI_TIMEOUT_MS` keeps its name and now means the overall budget.
4. Factory fallbacks (`apps/backend/src/providers/createAskAiProvider.ts:14-16`) align to `gpt-6-luna`, 30000, 1 (importing config's defaults is allowed). Mock behaviour, mock goldens and the `{ answer }` contract do not change. No reasoning-effort value is sent anywhere.
5. `scripts/openai-verify-credentials.mjs` defaults 30000 / 1 and accepts 0 in step with config (brief rows 193, 194, 197).
6. Offline tests with fake clients only (no network): a slow attempt is cut off at the deadline and maps to `PROVIDER_TIMEOUT`; a fast failure retries inside the budget; no retry starts after the budget is spent; retries=0 never retries. Update `config/index.test.ts` (rows 44, 45, 48, 49, 59, 61: new defaults, 0 valid, a still-invalid input for the invalid-retries test).
7. Apply by intent to `PRD/sections/` the accepted slots in `PRD/work/luna-answer-budget/GATE-QUESTIONS.md`: REQ-231 (new section, reserved id), the In-Depth provider passage, the Quick Lookup provider passage, the system-map OpenAI provider passage, NFR-002 plus its goals echo (`goals-and-non-goals.md` lines 20 and 60), REQ-181, REQ-182 (both lines), REQ-190. Apply the intent of each diff block, not a blind patch; the amendment table in DESIGN-BRIEF.md names the lines. Do not touch REQ-014, REQ-023 (its 40-second panel line stays) or the error taxonomy in `integrations-and-data.md`.
8. Note for the receipt, not a criterion: the brief's REQ-230 wording is looser than the slot (the slot only appends a note) and the intake's 'REQ-178' is REQ-022; follow the slots.

## Acceptance criteria

- [ ] A1: Provider tests prove a slow attempt is cut off at the deadline and maps to PROVIDER_TIMEOUT (504), using fake clients and no network
- [ ] A2: Provider tests prove a fast failure retries inside the budget and no retry starts after the budget is spent; retries=0 never retries
- [ ] A3: The SDK abort error (APIUserAbortError, 'Request was aborted.') is classified by cause as PROVIDER_TIMEOUT and never as PROVIDER_UNAVAILABLE (a named test)
- [ ] A4: Config defaults are 30000 and 1, OPENAI_MAX_RETRIES=0 is accepted, negative or non-integer values are rejected; DEFAULT_OPENAI_TIMEOUT_MS keeps its name and 'const NAME = 30000' form
- [ ] A5: createAskAiProvider fallbacks read gpt-6-luna, 30000, 1 and the factory tests pass
- [ ] A6: scripts/openai-verify-credentials.mjs defaults 30000 / 1 and accepts 0; the script tests pass
- [ ] A7: Backend typecheck and the full backend test run pass with no network call and no OPENAI key
- [ ] A8: PRD/sections carries REQ-231 (new), the In-Depth, Quick Lookup and system-map provider passages, NFR-002 plus the goals echo, REQ-181, REQ-182 and REQ-190 as accepted in GATE-QUESTIONS.md; REQ-014 and REQ-023 are unchanged
- [ ] A9 (manual): A reader confirms the applied REQ-231 and NFR-002 text matches the accepted slot intent (30 s budget, no restart of a slow answer, 504 mapping, about 4 s typical) and that no under-3-second wording remains in those requirements

Every deliverable lives outside `PRD/work/` (node 8 deletes the package). No criterion needs a paid run, live provider call or aws command.

## Verification

```bash
npm --workspace apps/backend run typecheck
npm --workspace apps/backend run test
npm run test:scripts
git grep -n -i 'under 3 seconds\|under-3-second\|under-three-second' -- PRD/sections
```

## Files touched

- `apps/backend/src/providers/openAiResponsesProvider.ts`
- `apps/backend/src/providers/openAiResponsesProvider.test.ts`
- `apps/backend/src/providers/createAskAiProvider.ts`
- `apps/backend/src/providers/createAskAiProvider.test.ts`
- `apps/backend/src/config/index.ts`
- `apps/backend/src/config/index.test.ts`
- `scripts/openai-verify-credentials.mjs`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/system-map.md`
