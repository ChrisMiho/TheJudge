# Slice B — Card-wording selector and the rules-retrieval product truth

## Status: planned

## Dependencies

Slice A. The topic must exist in the committed artifact so the lookup and prompt-assembly tests can select and render it.

## Goal

Switch the new topic on when two or more cards in a question carry replacement or prevention wording, in lookup mode and game mode through one shared function, and apply the REQ-220 and REQ-022 product truth with it.

## Requirements

1. **Selector.** One pure function in `apps/backend/src/gameRulesTopicSelection.ts` (for example `selectCardWordingTopicIds(cards)`), reading only `oracleText`. A card carries the wording when its oracle text contains the whole word `instead`, `prevent`, `prevents`, or `prevented`, in any letter case (`/\binstead\b/i`, `/\bprevent(s|ed)?\b/i`; "prevention" and "preventing" do not count). With two or more such cards it returns `["replacement-effects-interaction"]`; otherwise `[]`. Two copies of one card count as two.
2. **Lookup call site.** In `apps/backend/src/prompt/preparation.ts` (`prepareLookupPromptInput`, the always-on filter near line 212) the lookup topic list becomes the four always-on topics plus the new topic when the selector fires on the attached cards. Core topics are never replaced. Topics stay in id order.
3. **Game-mode call site.** `selectGameRulesTopics` adds the topic through the same function, over every card on the stack and in any populated zone. This is the card set `buildQueryParts` in `apps/backend/src/gameRulesRetrieval.ts` reads for System 3 (the brief's name `contextCards` exists only in the measure scripts). Output stays deduplicated and sorted by id.
4. **Code comments.** Update the header at `gameRulesTopicSelection.ts:7` ("card-agnostic game-state signals ... No card names, oracle text, or keywords") and the `selectGameRulesTopics` JSDoc at `:93` to say the selection reads game state plus this one card-wording gate.
5. **Tests.** `gameRulesTopicSelection.test.ts`: two marked cards fire; one does not; "prevention" and "preventing" do not count; letter case is ignored; a card in a game zone counts; a stack card counts; two copies of one card count as two; existing fixtures (empty oracle text) are unchanged. `preparation.test.ts`: lookup topic list is the four always-on topics alone with one marked card and the four plus the new topic with two. `promptAssembly.test.ts`: the `GAME RULES (reference)` section carries the topic's title and rules when it fires, is absent otherwise, and System 3 never repeats the topic's rule numbers (REQ-179).
6. **Unchanged.** `preparePromptInput`'s signature, System 3's search text, scoring, cap of ten, embeddings, and every frozen query vector. Run `contextEvaluationHarness.test.ts`, `retrievalReportParity.test.ts`, `retrievalReportInputs.test.ts`, and `ragRetrievalBenchmark.test.ts` without the golden-update mode; none of the 31 fixtures' goldens changes.
7. **PRD truth applied here (by intent against current truth, using `GATE-QUESTIONS.md`).**
   - `PRD/sections/functional-requirements.md`: add `### REQ-220` after `REQ-219`'s block and before `### REQ-222`; amend `### REQ-022` (description, the `GAME RULES (reference)` acceptance bullet, the System 2 and System 3 constraint bullets, the REQ-220 dependency, and the last Notes bullet). REQ-220's last Notes bullet keeps the "the build re-runs every suite above and records its before/after here" line; Slice D replaces it with the recorded numbers. REQ-221 is not written and stays unused.
   - `PRD/sections/system-map.md`: the `## Game rules retrieval` summary and Backed-by (`:66`) and the Curated game rules (System 2) summary and Backed-by (`:81`).
   - `PRD/sections/system-map/game-rules-retrieval.md`: Backed-by, `:14-16`, `:63`, and the invariant at `:117-118`.
   - `PRD/sections/system-map/prompt-layout-spec.md`: the section 7 row (`:35`) and the matrix row (`:59`).
   - `PRD/sections/integrations-and-data.md`: `:363` and `:400`.
   - `PRD/sections/quick-lookup/README.md`: `:276`, the Built bullet at `:288-290`, and `REQ-220` added to the header's Backed-by.
   - `PRD/sections/in-depth/README.md`: `:375-377` and `REQ-220` added to the header's Backed-by.
   - Left unedited because they stay true: `functional-requirements.md:1780-1782`, `quick-lookup/README.md:200-215` and `:349`, `in-depth/README.md:527`, `user-flows.md:257` and `:527`, `decisions.md:86`, `system-map/game-rules-retrieval.md:94`, and `PRD/sections/system-map/prompt-assembly.md:40-41` (non-blocking note 1: not contradicted, since the normalized context includes the cards).
   - The REQ-222 amendment and the REQ-229 clause belong to Slice C.

## Acceptance criteria

- [ ] B1: One shared selector in `gameRulesTopicSelection.ts` reads only `oracleText` and fires on two or more cards carrying the whole word "instead", "prevent", "prevents", or "prevented" in any letter case, and not on "prevention" or "preventing"
- [ ] B2: Lookup mode (`preparation.ts`) adds the topic alongside the four always-on topics through that function, never in place of them
- [ ] B3: Game mode (`selectGameRulesTopics`) adds the topic through the same function over every card on the stack and in any populated zone, in id order
- [ ] B4: The `gameRulesTopicSelection.ts` header and the `selectGameRulesTopics` JSDoc no longer claim selection is card-agnostic
- [ ] B5: The selector tests (two fire, one does not, "prevention" and "preventing" do not count, zone card counts, two copies count, letter case) pass
- [ ] B6: The `preparation.test.ts` and `promptAssembly.test.ts` tests (lookup topic list, `GAME RULES (reference)` carries the topic when it fires and not otherwise, System 3 never repeats its rule numbers) pass
- [ ] B7: The context-evaluation harness, retrieval-report parity and inputs tests, and the retrieval benchmark pass with no golden file changed
- [ ] B8: `functional-requirements.md` has `### REQ-220` between `### REQ-219` and `### REQ-222`, and no `### REQ-221`
- [ ] B9: REQ-022 is amended: description, the `GAME RULES (reference)` bullet, the System 2 and System 3 constraint bullets, the REQ-220 dependency, and the last Notes bullet
- [ ] B10: The system-map, game-rules-retrieval, prompt-layout-spec, integrations-and-data, quick-lookup, and in-depth lines in Requirement 7 are amended, and `prompt-assembly.md:40-41` is untouched
- [ ] B11: Re-running the Invariant 1 grep (`card-agnostic|game-state-gated|state-gated|game-state signals|always-on core|fixed always-on|fixed curated set|DEC-045 core set|no card names|not card names|affect System 2|oracle text, or keywords|owns all card` over `PRD/sections`) leaves only hits the brief dispositions as unchanged
- [ ] B12: `npm run typecheck`, `npm run lint`, and `npm run format:check` pass

## Verification

```bash
npm --workspace apps/backend run test -- gameRulesTopicSelection
npm --workspace apps/backend run test -- preparation promptAssembly
npm --workspace apps/backend run test -- contextEvaluationHarness retrievalReport ragRetrievalBenchmark
git diff --stat
grep -rniE "card-agnostic|game-state-gated|state-gated|game-state signals|always-on core|fixed always-on|fixed curated set|DEC-045 core set|no card names|not card names|affect System 2|oracle text, or keywords|owns all card" PRD/sections
npm run typecheck && npm run lint && npm run format:check
```

## Files touched

- `apps/backend/src/gameRulesTopicSelection.ts`
- `apps/backend/src/gameRulesTopicSelection.test.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/preparation.test.ts`
- `apps/backend/src/prompt/promptAssembly.test.ts`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/system-map.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/system-map/prompt-layout-spec.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/in-depth/README.md`
