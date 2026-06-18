status: ideation

# prompt-context-retrieval-tuning

Draw a clear boundary between the card-agnostic curated rule baseline (System 2) and the card/question-driven adaptive retrieval (System 3), make each pull the right rules, and prove it with the eval harness.

## Boundary decision (locked 2026-06-18)

Boundary is **by signal source** (see `IDEA.md` for detail):
- **System 2** = card-agnostic game state only (turn phase / combat step, populated zones, stack/priority). Curated, deterministic.
- **System 3** = all card/question-driven retrieval, including oracle-text keywords (which must carry strong scoring weight to preserve quality). Adaptive catch-all.

## Threads

| Thread | Scope | Status |
|--------|-------|--------|
| System 2 — conditional curated rules | Slim always-on core + game-state-driven conditional expansion | ideation |
| System 3 — adaptive scoring | Relevance-aware scoring (IDF / question weighting / keyword weight / tie-break) | ideation |
| Measurement | Extend eval harness with scenario fixtures + expected-rule assertions | ideation |

## The three retrieval systems (investigation 2026-06-18)

- **System 1 — official card rulings.** `apps/backend/src/cardRulings.ts` + `apps/backend/data/cardRulingsByOracleId.json` (~19.5 MB). Exact **oracle-ID** dictionary lookup per submitted card (`collectCardsForRulings` → `resolveRulingsForPrompt`). Considered correct; **out of scope** (only possibly confirm `cardId` = oracle ID via the `cardsSkippedNoMatch` debug field).
- **System 2 — curated general rules.** `apps/backend/src/gameRules.ts` + `apps/backend/data/gameRulesTopicManifest.json` (23 topics → CR rule numbers) built into `gameRulesByTopic.json` by `scripts/build-game-rules.mjs`. Loaded at startup and attached to **every** prompt via `preparePromptInput` as `GAME RULES (reference)`. **No game-state awareness today.**
- **System 3 — supplemental retrieval.** `apps/backend/src/gameRulesRetrieval.ts` over `gameRulesRuleIndex.json` (~3,432 CR rules). Lexical word-overlap scorer, top-5. **Already excludes System 2's curated rule IDs** (`collectCuratedRuleIds` → `excludeRuleIds`), so the two are coupled.

Orchestration: `apps/backend/src/prompt/preparation.ts` (`preparePromptInput`). Prompt assembly: `apps/backend/src/prompt/normalization.ts` (`buildPromptText`).

## System 3 current behavior (and why it needs tuning)

Pipeline per request (`retrieveSupplementalRules`):
1. `buildQueryText` concatenates question + turn phase + zones + **every card's name, type line, full oracle text, and contextNotes** into one bag of words.
2. `tokenize` lowercases, splits on non-alphanumeric (keeps dots), drops tokens < 3 chars and ~25 stop words.
3. Score every rule: `+100` exact rule-ID in query, `+20` parent rule-ID, `+8` per shared dotted token, `+1` per shared plain word. Rule words are de-duplicated into a Set, so a rule's score = **count of distinct query words it contains**.
4. Sort by score desc; ties break toward **lowest rule number**. Take top 5 (score > 0).

Weaknesses (the reason for this package):
- No rarity/IDF weighting — common words (`target`, `spell`, `damage`, `permanent`) dominate, so common/general rules win.
- The `+100`/`+20`/`+8` signals almost never fire for real users (they require literal CR numbers / dotted tokens in the query), so scoring is effectively `+1`-per-shared-word only.
- The question is drowned out by full oracle text of every card.
- Small-integer scores tie constantly; "lowest rule number" tie-break is arbitrary (biases toward early, general rules).
- Purely lexical — no semantics (e.g. "counter" the verb vs. "+1/+1 counter").

Worked example: Counterspell ("Counter target spell.", Instant), question "Does Counterspell resolve?", `main_1`. Meaningful query words ≈ `counterspell, resolve, main, stack, instant, counter, target, spell`. Most of those are among the most common words in the rulebook, so dozens of rules tie at 4–5 and the lowest-numbered ones win — not necessarily the rules about countering.

## Candidate levers for System 3 (to decide in refinement)

- IDF / rarity weighting (downweight words common across many rules).
- Weight the question above card oracle text in the query.
- Strong weight for oracle-keyword matches (per boundary decision).
- Replace the lowest-rule-number tie-break.
- (Bigger, optional follow-up) semantic/embeddings retrieval.

## Debug visibility (use to measure)

- `enrichmentDebug` (collected when not in OpenAI mode) and `npm run prompt:preview` write sidecars showing selected rules + scores, runner-ups, and rulings match/skip. Note: the user found the raw preview output hard to read across many files — the measurement thread should produce a more digestible before/after view.

## Related

- `prd-doc-traceability` — PRD/documentation hygiene, split out of this package.

## Next

Refine via `thejudge-refinement` once the open scoping questions in `IDEA.md` are settled. (User intends to start a fresh chat for refinement; this folder is self-contained for that handoff.)
