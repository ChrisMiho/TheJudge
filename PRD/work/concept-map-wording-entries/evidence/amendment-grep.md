# Amendment grep — concept-map-wording-entries

**What this is:** every `PRD/sections/` line the six new concept-map entries and the retrain could touch, found by one grep, with what happens to each line. Two requirements change (REQ-234, the concept map; REQ-236, the trained search model). Every other hit only cites them by id and stays true.

## The grep (run 2026-10-12 at `0135580e`, from the worktree root)

```
grep -rnE 'REQ-234|REQ-236|concept map|concept-map|gameRulesConceptMap|78 oracle|163 distinct|83 entries|rule-search-[0-9a-f]{12}|78th' PRD/sections
```

75 hits in 11 files. Dispositions: **amend 5** (REQ-234 rows 54, 55, 56; REQ-236 rows 60 and 63), **no change 70**.

One passage the grep cannot see is amended too: REQ-236's rules-gate criterion (`functional-requirements.md:6258`), which says the gate is re-baselined "in this change" without naming the concept map or the model id. It is found by reading REQ-236 whole and is carried in the REQ-236 gate block.

## Dispositions

| # | Hit | Text near the match | Disposition |
| --- | --- | --- | --- |
| 1 | user-flows.md:257 | concept terms — not its oracle text, REQ-178, REQ-234 | no change — describes what the query carries, not how many entries |
| 2 | user-flows.md:527 | not its full oracle text (REQ-178, REQ-234) | no change — same |
| 3 | system-map.md:81 | cards' wording (through the fixed concept map) | no change — In-Depth topic choice by card wording still holds; the new terms add topics through the same path (see brief, side effects) |
| 4 | system-map.md:88 | the fixed concept map's terms for each card's wording | no change — no count or model id |
| 5 | system-map.md:89 | the concept map module | no change — location unchanged |
| 6 | system-map.md:90 | Backed by: … REQ-234, … REQ-236 | no change — pointer list |
| 7 | integrations-and-data.md:17 | fine-tuned on Magic rules questions (REQ-236) | no change — model family unchanged; id not named |
| 8 | integrations-and-data.md:274 | recording the model id and manifest hash | no change — the rule rebuilt here is followed, not reworded |
| 9 | integrations-and-data.md:277 | retraining … owner-run step (REQ-236) | no change — this build follows it |
| 10 | quick-lookup/README.md:217 | terms (REQ-234) — not its full oracle text | no change |
| 11 | quick-lookup/README.md:285 | Magic-trained search model (REQ-236) | no change |
| 12 | quick-lookup/README.md:302 | oracle text (REQ-167, REQ-178, REQ-234) | no change |
| 13 | quick-lookup/README.md:303 | pointer list with REQ-234 | no change |
| 14 | quick-lookup/README.md:375 | REQ-178, REQ-234 | no change |
| 15 | system-map/prompt-layout-spec.md:36 | System 3 row cites REQ-234 | no change — section order and layout unchanged |
| 16 | system-map/prompt-layout-spec.md:59 | presence row cites REQ-234 | no change |
| 17 | system-map/game-rules-retrieval.md:2 | Backed by list | no change |
| 18 | system-map/game-rules-retrieval.md:18 | fixed concept map, REQ-234 (In-Depth topics) | no change — mechanism unchanged |
| 19 | system-map/game-rules-retrieval.md:35 | the concept terms the committed concept map | no change |
| 20 | system-map/game-rules-retrieval.md:36 | draws from each card's wording (REQ-234) | no change |
| 21 | system-map/game-rules-retrieval.md:73 | fine-tuned on Magic rules questions (REQ-236) | no change |
| 22 | system-map/game-rules-retrieval.md:126 | one committed module, gameRulesConceptMap.ts | no change — still one module |
| 23 | system-map/game-rules-retrieval.md:127 | manifest, fetch script, training pipeline | no change — paths unchanged |
| 24 | system-map/game-rules-retrieval.md:184 | from private storage only at packaging | no change |
| 25 | system-map/game-rules-retrieval.md:194 | concept map … fixed, committed tables | no change — still fixed, no model call |
| 26 | system-map/game-rules-retrieval.md:195 | no model call produces search terms | no change |
| 27 | in-depth/README.md:387 | cards' wording (through the fixed concept map) | no change |
| 28 | in-depth/README.md:402 | REQ-182, REQ-236 | no change |
| 29 | in-depth/README.md:405 | full oracle text (REQ-178, REQ-234) | no change |
| 30 | in-depth/README.md:410 | pointer list | no change |
| 31 | non-functional-requirements.md:301 | bundled model is now the Magic-trained MiniLM | no change — still that family, still from private S3 |
| 32 | functional-requirements.md:382 | concept terms the fixed concept map draws (REQ-022) | no change |
| 33 | functional-requirements.md:388 | packaged when the deploy package is built (REQ-236, REQ-237) | no change |
| 34 | functional-requirements.md:1788 | concept terms of its wording (REQ-234) | no change |
| 35 | functional-requirements.md:3933 | concept terms of its wording (REQ-234) | no change |
| 36 | functional-requirements.md:4203 | REQ-178 description, concept terms | no change |
| 37 | functional-requirements.md:4205 | card's concept terms (REQ-234) | no change |
| 38 | functional-requirements.md:4225 | REQ-178 amended note, concept terms | no change — historical note |
| 39 | functional-requirements.md:4302 | rule vectors rebuilt whenever the model is retrained | no change — this build follows it |
| 40 | functional-requirements.md:4321 | fine-tuned on Magic rules questions (REQ-236) | no change |
| 41 | functional-requirements.md:4338 | per-channel reduced-range int8 | no change — export recipe unchanged |
| 42 | functional-requirements.md:4372 | alpha 0.65 with the Magic-trained model | no change — blend unchanged |
| 43 | functional-requirements.md:4373 | benchmark polluted condition | no change — benchmark unchanged |
| 44 | functional-requirements.md:4389 | model stored in private S3 | no change |
| 45 | functional-requirements.md:5843 | fixed concept terms from card wording (REQ-234) | no change — historical note |
| 46 | functional-requirements.md:6131 | practice suite may train the model (REQ-236) | no change |
| 47 | functional-requirements.md:6151 | runtime effect is the search model (REQ-236) | no change |
| 48 | functional-requirements.md:6172 | stemmer shared with the training export | no change |
| 49 | functional-requirements.md:6177 | concept weight (REQ-234) | no change — weight ×2 unchanged |
| 50 | functional-requirements.md:6179 | ranks recorded with the trained model | no change — historical |
| 51 | functional-requirements.md:6193 | `### REQ-234` | amended block — heading unchanged |
| 52 | functional-requirements.md:6194 | REQ-234 title | no change |
| 53 | functional-requirements.md:6196 | REQ-234 description | no change — still general phrase-to-concept rules |
| 54 | functional-requirements.md:6198 | CONCEPT_MAP (78 oracle-text entries) … 77 ported, 78th type-setting | **amend** — 84 entries; names entries 79–84 (REQ-234 gate block) |
| 55 | functional-requirements.md:6202 | 163 distinct words across the 83 entries … 78 + 5 | **amend** — 165 words across 89 entries; 84 + 5 (REQ-234 gate block) |
| 56 | functional-requirements.md:6206 | any change … owner-reviewed; the 78th entry (type-setting …) | **amend** — type-setting tightening (m-1) and the six reviewed entries (REQ-234 gate block) |
| 57 | functional-requirements.md:6212 | REQ-236 (training pairs built with this query builder) | no change |
| 58 | functional-requirements.md:6215 | measured at intake: 432 vs 449, bench@5 129 vs 125 | no change — historical; new note lines appended after 6216 |
| 59 | functional-requirements.md:6216 | held to bench@5 ≥ 118 (REQ-236) | no change |
| 60 | functional-requirements.md:6243 | `### REQ-236` | **amend** — rules-gate criterion (6258, outside the grep) and new note lines (REQ-236 gate block) |
| 61 | functional-requirements.md:6249 | query side built by the shipped query builder (REQ-234) | no change — this build follows it |
| 62 | functional-requirements.md:6269 | REQ-233, REQ-234, REQ-235 dependency | no change |
| 63 | functional-requirements.md:6278 | measured at build … model `rule-search-d2c2e500a4c6` | **amend** — append the rule-character figures (m-3) to this line (REQ-236 gate block) |
| 64 | functional-requirements.md:6279 | rules gate re-baselined once, 351 → 472 | no change — historical record of that build |
| 65 | functional-requirements.md:6284 | REQ-237 description | no change — storage and identity checks unchanged |
| 66 | functional-requirements.md:6300 | REQ-236 (the model) | no change |
| 67 | functional-requirements.md:6312 | REQ-238 description, concept map | no change — checked: none of the six new terms names a turn step |
| 68 | functional-requirements.md:6319 | concept terms (REQ-234) name a step | no change — same check |
| 69 | functional-requirements.md:6329 | REQ-234 (the concept terms that can name a step) | no change |
| 70 | functional-requirements.md:6333 | cleanup summary through the concept map | no change |
| 71 | functional-requirements.md:6422 | REQ-242 description, concept map | no change — mechanism unchanged; new topic picks recorded in REQ-234's build note |
| 72 | functional-requirements.md:6432 | card wording selects topics through the fixed concept map only | no change |
| 73 | functional-requirements.md:6437 | REQ-234 (the concept terms) | no change |
| 74 | functional-requirements.md:6442 | type-setting entry keeps the layers topic | no change — historical; still true |
| 75 | functional-requirements.md:6507 | card-wording topics (REQ-220, REQ-234) unchanged by REQ-246 | no change |

Count check: amend rows 54, 55, 56, 60, 63 = 5, all inside the two gate blocks (row 60 stands for the REQ-236 block's new note lines and the 6258 criterion). The other 70 rows are no change.

## Outside `PRD/sections/` (build deliverables, not product truth)

Same pattern over `docs/`, `README.md` and the fixtures README:

| Hit | Disposition |
| --- | --- |
| `docs/aws/model-upload.md:8, 24, 25, 26, 35` — model id `rule-search-d2c2e500a4c6` | build updates to the new model id and file size |
| `docs/eval/cap15-answer-check/REPORT.md:23, 82` — model id | no change — a dated report of a past run |
| `apps/backend/src/gameRulesConceptMap.ts:1-5` header ("Ported verbatim") | build rewrites (m-2) |
| `apps/backend/src/gameRulesConceptMap.test.ts` pins 78, 163, 83, Ephemeral Hydra example | build updates to 84, 165, 89 and the new Hydra term |
