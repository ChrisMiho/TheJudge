# Build evidence log — right-rules-in-order

Counts only. No practice-suite text, ids or per-question results appear here.

## Slice A

- 2026-10-11 — Fidelity gate PASSED, run before any parser, data or search edit (the only files present at the run were the new scorer `scripts/score-rule-search.mjs`, its `.gitignore` line and the git-ignored local inputs). Command: `EMBEDDING_PROVIDER=local npx tsx scripts/score-rule-search.mjs --fidelity`. Result: suite citations 473, suite questions with every deciding rule 159, hard 25 citations 5, corpus citations 351, corpus cases with every deciding rule 305. The scorer's independent recomputation differs from production's top ten on 0 of 1,596 questions (1,181 suite, 415 corpus).
- The hard-25 id list for this run was copied from the probe's recorded verification file into `output/rule-search-eval/hard25.json` (git-ignored); the probe's ids carry the pre-rename prefix, mapped to the current `practice-` prefix in that local file only.
- Rebuilt rule data from the 2026-09-25 rule book (`node scripts/build-game-rules.mjs`): 2,894 entries (2,893 − 2 empty + 3 added). Added 303.7, 700.15, 704.5aa; removed 702.163, 702.179; text changed only for the eight glued titles and 704.5z. Glossary 741 entries, 35 obsolete; edition 2026-09-25; 9 part titles.
- Extra, same defect class: the curated topic `replacement-effects-interaction` ended in the glued "7. Additional Rules" title; `extractRuleExcerpt` now cuts part titles too, so the topic excerpt loses it (one-line data change).
- Vectors: kept every previous vector whose text is unchanged and embedded only the 12 new or changed rules with the stock model. A full re-embed moved 495 unchanged rules' vectors (batch-order noise in the int8 model) and cost the rules gate one hit; the merge keeps the standing baseline intact until slice D replaces all vectors.
- `node scripts/privacy-scan.mjs` over tracked files: 2,940 suite texts, 0 matches.
