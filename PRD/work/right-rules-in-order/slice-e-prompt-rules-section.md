# Slice E — Prompt rules section

## Status: done

## Goal

Luna reads the rules the way a judge would: in rule-book order, grouped, labelled, each id once, lead-ins with their lists, and step summaries correct and available in Quick Lookup.

## Requirements

1. Step summaries (REQ-238, REQ-024): correct the wrong facts in the turn-step summaries. A step is named when the question contains a step name from one fixed committed table of rule-book step names, or when an attached card's concept terms name a step. At most three summaries, in turn order. Quick Lookup renders them under `PHASE GUIDANCE` after `MTG REFERENCE`, worded as a description of the step, not "You are in...". In-Depth keeps its current-step summary.
2. Excerpt order and labels (REQ-239, REQ-022): excerpts in rule-book order, grouped and labelled with where they sit ("Turn Structure > Cleanup Step", from the index part titles added in A); each rule id printed once; the parent's lead-in is added where a piece needs it.
3. Lead-ins with lists (REQ-240): a lead-in is a rule whose text ends in a colon or in "following exception(s)." or "following rules."; its list is its directly lettered sub-rules. The lead-in arrives with its list in search excerpts and curated topics alike. Per-prompt list budget 12,000 characters; the list-overflow line must fire on 0 corpus cases. Curated topics gain missing rules (117.3a-d add 916 characters; 400.7's twelve sub-rules add 2,833, always-on) and list items are written as topic rule numbers in the manifest so REQ-179's exact-number exclusion and its data test keep working.
4. Pointers (REQ-244): "see rule X" pointers carry what they point at, at most ten resolved pointers per prompt, each first sentence capped at 250 characters.
5. Keep the excerpt cap at REQ-190's value (fifteen with the 0.6 relevance cutoff after the owner's build-half amendment; it was ten when this slice was written). Two instructions in the preamble that refer to sections absent in Quick Lookup are left to slice F; do not duplicate.
6. Apply by intent to `PRD/sections/`: REQ-238, 239, 240, 244 (new), REQ-022, REQ-024, and the matching parts of `prompt-layout-spec.md`, `prompt-assembly.md` (rules section only; slice F finishes the rest).
7. Update golden prompt tests: every golden change reviewed and listed in the evidence log, never silent.

## Acceptance criteria

- [x] Step-table tests: a named step in a Quick Lookup question adds its summary under PHASE GUIDANCE, at most three, in turn order; none when no step is named
- [x] Corrected step-summary facts are covered by a test per corrected fact
- [x] Excerpt tests: rule-book order, grouped labels from part titles, each id printed once, lead-in added where needed
- [x] Lead-in tests: every lead-in with a list arrives with it; the 12,000-character budget holds and the overflow line fires on 0 committed corpus cases
- [x] The curated manifest includes 117.3a-d and 400.7's sub-rules as topic rule numbers and the REQ-179 data test passes
- [x] Pointer tests: resolved pointers capped at ten and 250 characters
- [x] REQ-238, 239, 240, 244, 022, 024 and the rules-section parts of the layout and assembly docs are applied by intent
- [x] Golden prompt changes are each reviewed and listed in the evidence log
- [x] `npm run quality:check` passes

## Verification

```bash
npm --workspace apps/backend run test
npm run test:eval
npm run quality:check
```

## Files touched

- `apps/backend/src/prompt/` rules-section builders and tests, `apps/backend/src/gameRulesTopicSelection.ts`, `gameRulesTopicData.test.ts`
- `apps/backend/data/gameRulesTopicManifest.json`, `gameRulesByTopic.json`
- eval goldens (reviewed)
- `PRD/sections/functional-requirements.md`, `system-map/prompt-layout-spec.md`, `system-map/prompt-assembly.md`
