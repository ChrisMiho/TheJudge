# Slice A — Mock sidecars and enrichment debug

## Status: planned

## Goal

Extend the mock `/api/ask-ai` success response with structured sidecar fields and a rules enrichment trace, wired from the existing `preparePromptInput` path. No new routes. OpenAI provider and frontend remain `{ answer }` only.

## Depends on

Nothing — first slice.

## Requirements

1. **Response schema** — Extend `askAiResponseSchema` in `apps/backend/src/validation/askAiRequest.ts` to accept optional `context`, `diagnostics`, and `enrichmentDebug`. Schema stays `.strict()`; absent fields remain valid (OpenAI path unchanged).
2. **EnrichmentDebug types** — Add `apps/backend/src/prompt/enrichmentDebug.ts` with types matching [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) § `enrichmentDebug`. Export Zod sub-schemas for response validation.
3. **Supplemental retrieval debug** — Add `retrieveSupplementalRulesWithDebug()` (sibling to `retrieveSupplementalRules` in `gameRulesRetrieval.ts`) that returns `{ selected, runnerUp, debug }` without breaking existing callers. Debug includes: `queryText`, `queryTokens`, `queryRuleIds`, `excludedCuratedRuleCount`, `candidatesScored`, `selected` (top 5 with scores), `runnerUp` (next up to 10 by score). Reuse scoring constants already in `gameRulesRetrieval.ts`.
4. **Rulings debug** — Extend or wrap `resolveRulingsForPrompt` in `cardRulings.ts` to record: `cardsConsidered`, `cardsIncluded` (with `rulingCount`), `cardsSkippedNoMatch`, `sectionTruncated`.
5. **Curated game rules debug** — Snapshot manifest topics as `{ topicIds, topics: [{ id, title, ruleNumbers }] }` from `gameRulesTopics` passed to `preparePromptInput`.
6. **Mock-only collection** — Collect `enrichmentDebug` only when enrichment debug is requested (add `collectEnrichmentDebug?: boolean` to `PreparePromptInputOptions`; wire from mock provider path or route deps — do not attach to OpenAI responses).
7. **Mock answer wiring** — Update `buildMockAnswer` in `mockAskAi.ts` to populate `context`, `diagnostics`, and `enrichmentDebug` from `PreparedPromptInput`. Do **not** add `promptText` as a separate response field (DEC-033).
8. **PreparedPromptInput** — Extend type in `preparation.ts` with optional `enrichmentDebug` when collected.

## Acceptance criteria

- [ ] `askAiResponseSchema` accepts `{ answer }` only and `{ answer, context, diagnostics, enrichmentDebug }` — rejects unknown keys
- [ ] Mock `POST /api/ask-ai` returns all three sidecars on HTTP 200
- [ ] OpenAI provider responses remain `{ answer }` only
- [ ] Frontend contract unchanged (reads `answer` only; no frontend file changes)
- [ ] `EnrichmentDebug.supplemental.selected[0].score` is a number in mock responses
- [ ] `EnrichmentDebug.supplemental.runnerUp` length ≤ 10
- [ ] `EnrichmentDebug.rulings.sectionTruncated` reflects budget truncation behavior
- [ ] `buildMockAnswer` still embeds full prompt in `answer` under `FULL PROMPT (SENT TO PROVIDER)` delimiter (existing test contract)
- [ ] Unit tests pass for mock answer, supplemental debug retrieval, and mock route sidecars

## Verification

```bash
npm --workspace apps/backend run test -- src/mockAskAi.test.ts src/app.behavior.test.ts src/gameRulesRetrieval.test.ts
```

Manual check (optional during dev):

```bash
# With backend running in mock mode, POST a fixture request and inspect JSON sidecars
curl -s -X POST http://127.0.0.1:3000/api/ask-ai \
  -H 'Content-Type: application/json' \
  -d @apps/backend/src/eval/fixtures/cascade-keyword.fixture.json \
  | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(Object.keys(d), d.enrichmentDebug?.supplemental?.selected?.[0])"
```

## Files touched

- `apps/backend/src/prompt/enrichmentDebug.ts` (new)
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/types/index.ts` (re-export types if needed)
- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `apps/backend/src/cardRulings.ts`
- `apps/backend/src/cardRulings.test.ts` (if rulings debug warrants coverage)
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/mockAskAi.ts`
- `apps/backend/src/mockAskAi.test.ts`
- `apps/backend/src/providers/mockAskAiProvider.ts`
- `apps/backend/src/app.behavior.test.ts`

## Tests

| Test file | What to add |
|-----------|-------------|
| `mockAskAi.test.ts` | Assert sidecars present; `answer` still contains `FULL PROMPT (SENT TO PROVIDER)` |
| `gameRulesRetrieval.test.ts` | `retrieveSupplementalRulesWithDebug` — selected/runnerUp ordering, score values, `candidatesScored` |
| `app.behavior.test.ts` | Mock provider integration: `POST /api/ask-ai` returns `context`, `diagnostics`, `enrichmentDebug` |

## Next

Slice B — orchestrator script consumes these sidecars and writes artifact files.
