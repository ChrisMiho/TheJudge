# Slice C — Answer-seeded second-pass retrieval

## Status: planned

## Goal

After the first rules-mode answer, re-query the committed rule index using the model's
answer text, dedup against first-pass rules, cap, and append the recovered verbatim
excerpts to the plain-text `answer` — a single AI call plus a free local re-query
(DEC-100 / REQ-078).

## Requirements

1. Add `applyRulesSecondPass(response, preparedPrompt, { gameRulesRuleIndex,
   collectEnrichmentDebug })`. When `preparedPrompt.rulesMode`, build an answer query
   via `buildQueryTokensFromText(response.answer, "question")` and call
   `retrieveRulesForQuery(answer tokens, index, exclude = firstPassRuleIds, max = 5)`
   (the same authoritative System-3 scorer + rule index from Slice B — no forked
   matcher).
2. Recovered rules are deduplicated against the first-pass rule-ID set (core +
   supplemental) so nothing already in the prompt repeats; the addition is capped
   consistently with the supplemental budget (5).
3. The recovered verbatim excerpts are formatted (a human-facing labeled block) and
   **appended** to `response.answer`. There is no new response field, key, or endpoint;
   success `{ answer }` and error shapes and plain-text output (REQ-013) are unchanged.
4. The answer explanation is **not** regenerated (single AI call); the second pass adds
   only local scoring. Wire `applyRulesSecondPass` into the route immediately after
   `generateAnswer`, gated on `rulesMode`.
5. Mock provider / `enrichmentDebug` exposes second-pass selections and runner-ups
   (DEC-033 pattern) when `collectEnrichmentDebug` is on.

## Acceptance criteria

- [ ] For a rules request whose answer cites a rule the question missed (e.g. a rule
      number like `704.5g`), the second pass recovers it and appends its verbatim
      excerpt to `answer`.
- [ ] A rule already present in the first-pass prompt (core or supplemental) is **not**
      duplicated in the appended block.
- [ ] When no rule scores above threshold on the answer, the second pass appends
      nothing and `answer` is the provider text unchanged.
- [ ] The appended text is verbatim CR excerpt content (drawn from the rule index), not
      paraphrase; success `{ answer }` / error shapes unchanged for both providers.
- [ ] Game and card mode responses are untouched (second pass is `rulesMode`-gated).
- [ ] `enrichmentDebug` (mock) exposes second-pass selected + runner-up rules.
- [ ] `npm --workspace apps/backend run test` and `npm run test:eval` green.

## Verification

```bash
npm --workspace apps/backend run test -- askAi
npm --workspace apps/backend run test
npm run test:eval   # rules-mode fixture asserts answer-seeded recovery of a missed rule
```

## Files touched

- `apps/backend/src/prompt/preparation.ts` (or a new `prompt/rulesSecondPass.ts`) —
  `applyRulesSecondPass` + the recovered-rules formatter
- `apps/backend/src/routes/askAi.ts` — invoke `applyRulesSecondPass` after
  `generateAnswer`, gated on `preparedPrompt.rulesMode`
- `apps/backend/src/prompt/enrichmentDebug.ts` — extend debug schema with second-pass
  selections/runner-ups (mock-only)
- eval fixtures/harness — assert answer-seeded second-pass recovery (REQ-032 /
  DEC-047 extension)
- backend tests for route + second-pass dedup/append/cap

## Notes

- Depends on **Slice B** (query-based scorer, rules-mode prompt, `rulesMode` +
  first-pass rule-ID set on `PreparedPromptInput`).
- Two-call **regenerate** (rebuild the explanation on the expanded set) is a deferred
  follow-up (DEC-100 note), **not** in v1.
