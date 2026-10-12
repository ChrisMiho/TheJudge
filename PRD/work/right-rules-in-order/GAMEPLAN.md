# Gameplan — right-rules-in-order

Luna (the answering model) gets the deciding rules about twice as often, reads them in rule-book order, and gets the step summary in Quick Lookup. Source of truth: `DESIGN-BRIEF.md` (scope A–D, 12 acceptance targets, 23 assumptions) and the finalized `GATE-QUESTIONS.md` (39 slots, all accept).

## Slices and order

| Slice | Brief scope | Depends on |
| --- | --- | --- |
| A | Fidelity stop gate, then rule data | none |
| B | Search fixes | A |
| C | Trained-model tooling, manifest, fetch, identity | B |
| D | First training, cross-validation, vectors, gates | C |
| E | Prompt rules section: order, labels, lead-ins, curated, pointers, step summaries | A |
| F | Prompt structure: rulings, topics, one instruction list, card blocks | E |
| G | Built-prompt checks, goldens, privacy, PRD sweep, PR body | A–F |

Run order is A, B, C, D, E, F, G (one agent, sequential). E may run beside C or D because it needs only A; the letters keep the single-agent order simple.

## Architecture

- Rule data: `scripts/build-game-rules.mjs` parses the raw rule book into `apps/backend/data/gameRulesRuleIndex.json` (plus glossary, edition, source hash, part titles). `scripts/build-rule-embeddings.mjs` writes `gameRulesRuleEmbeddings.json` and records the model id inside it.
- Search: `apps/backend/src/gameRulesRetrieval.ts` blends meaning 0.65 and words 0.35. New concept map `apps/backend/src/gameRulesConceptMap.ts`. One Porter stemmer in-repo, shared by the index build, the backend and the training export (no new npm dependency).
- Trained model: dev-only Python (`uv`, Python 3.12, sentence-transformers) in `scripts/` trains and exports. Weights live in git-ignored folders and, later, the private S3 bucket. Committed: `apps/backend/data/embeddingModel.manifest.json` (model id, file hashes), `scripts/fetch-embedding-model.mjs`, packaging checks.
- Prompt: `apps/backend/src/prompt/` builds both modes; step summaries and curated topics live in `gameRulesTopicManifest.json` / `gameRulesByTopic.json`.

## Data flow

question + cards -> query builder (words x3 question, x1 card, x2 concept, keyword x6; embedded text) -> trained model vector -> blend with words -> ten excerpts (eight main, two per-card) -> grouped, labelled, rule-book-order excerpts -> prompt for Quick Lookup or In-Depth.

## Cross-cutting rules for every slice

- Everything committed lands outside `PRD/work/`; `close` deletes the package folder before merge. Scripts under `scripts/`, runtime under `apps/backend/`, docs under `docs/`.
- Privacy (target 12, hard): no practice-suite question, answer, card list, id or per-question result in any committed file. Training pairs, checkpoints, the trained model folder, hard-25 ids and per-question results go only under git-ignored folders (add the paths to `.gitignore` in slice A or C where first created, and test with `git check-ignore`).
- Local inputs (read-only, launch checkout): rule book `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/cr/source.txt`; practice suite `/Users/chrismiho/Coding/Projects/TheJudge/output/practice-suite/`; stock embedder `/Users/chrismiho/Coding/Projects/TheJudge/apps/backend/data/models/` (copy into the worktree's own git-ignored `apps/backend/data/models/` first, or semantic search silently falls back to lexical); probe caches and public base model under `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/models-probe/`. If the rule book is absent the build parks.
- Probe code to port (read, then commit the port under `scripts/`): `PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/` (`train.py`, `export-training.mjs`, `score-trained.mjs`, `leak-check.mjs`, `latency-q8check.mjs` and recorded outputs).
- Nothing outward-facing: no S3 upload, no AWS bootstrap, no deploy, no paid model calls, no `npm run data:refresh`. Packaging and the fetch script are tested offline against a local directory.
- Product truth: each slice applies, by intent against current `PRD/sections/`, every accepted `GATE-QUESTIONS.md` diff it implements, in the same slice as the code. Slot-to-slice map is in each slice doc; slice G re-checks all 39. Never blind-replay a diff. No `DEC-###` is added.
- Stop conditions (park the build for the owner, no workaround): target 1 fidelity mismatch (slice A, before any change); target 6 benchmark floors (0.8526 clean, 0.8333 polluted) or the 12 labelled checks missed (slices D, G); assumption 4 hard-25 not reproducible (slice D); rule book absent (slice A).

## Verification checklist (brief acceptance targets)

1 fidelity (A) · 2 CV suite (D) · 3 final model, Necropotence (D, G) · 4 built prompts, committed and in `quality:check` (G, with E and F) · 5 In-Depth topics (F) · 6 standing gates (D, G) · 7 concept map test (B) · 8 rule data diff (A) · 9 identity tests (C) · 10 stemming ranks (B, D) · 11 size (G) · 12 privacy (A scanner, C weights test, G final).

## Owner handoff (PR body, written in G)

Exact upload commands for `models/<model-id>/` with profile `thejudge-admin`, the `scripts/aws-bootstrap.sh` note, the lost-hit list from the rules-gate re-baseline, and the after-merge steps from the brief. The build does none of them.
