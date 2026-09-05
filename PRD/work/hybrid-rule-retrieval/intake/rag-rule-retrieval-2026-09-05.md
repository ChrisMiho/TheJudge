# Receipt — rag-rule-retrieval — 2026-09-05

**What happened:** When you ask AI a rules question, it now finds the right
Comprehensive Rules excerpt more often. Five fixes shipped in sequence: first
the recall-measuring tools were repaired so they stop disagreeing with each
other; then attaching a card to your question stopped drowning the question
in that card's full rules text; then the searchable rule index had its junk
(duplicate and near-duplicate entries) cleaned out; then the keyword signal
switched from a stale hand-built list to the keyword list Scryfall already
publishes for every card; and finally, when the bundled local embedding model
is turned on (`EMBEDDING_PROVIDER=local`), rules are ranked by what the
question actually means instead of by shared rare words. Today, with the
shipped default setting (`mock`/lexical), nothing changes for players — the
lexical path just got better (clean-query recall@5 0.577 → 0.583 on the
156-pair benchmark). Turning on the local semantic model is measured much
better overall (recall@5 0.85 vs 0.58 clean, 0.83 vs 0.53 with a card
attached) but measurably worse on short lookup-mode questions — a card name,
type line, and one keyword — where two of eight labelled fixtures lose a rule
they used to find; a hybrid lexical-plus-semantic blend is the tracked
follow-up before `local` becomes the default. No screen changed, no new
endpoint was added. Shipped in PR #191
(`thejudge-auto/rag-rule-retrieval-work` → `thejudge-auto/rag-rule-retrieval`),
merged at `d284074` on 2026-09-05; the branch's own PR to `main` (#190, the
docs-only proposal) already merged earlier the same day.

**What it means for you:** Nothing to do right now — the shipped default
keeps the improved lexical retrieval, so answers are at least as accurate as
before and slightly better on the benchmark. When you want semantic ranking,
set `EMBEDDING_PROVIDER=local`; know going in that it trades away some
accuracy on short "what does this keyword do" questions until the hybrid
blend lands. This closes out the whole family of RAG-shaped work folders in
the repo — the parked `semantic-rule-retrieval` design (PR #154, never
merged), two investigate probes, four loose notes, and one recovered deferred
idea — into this one shipped gameplan; nothing else RAG-related is pending.

## Summary

- Date: 2026-09-05
- Slug: rag-rule-retrieval
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 9, `close`), autonomous
  build-half run `graph-20260905-012712` (spec-forming run
  `graph-20260905-061805`). `STATUS.ship-ready` confirmed before cleanup.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/thejudge-auto/rag-rule-retrieval`), so
  the autonomous merge-proof gate below applies.

## What shipped

Five sequential slices, each a measurement-gated step of the RAG gameplan
(`GAMEPLAN.md`):

- **Slice A** (REQ-177) — made the recall ruler trustworthy: the relevance
  report and the eval harness now model production retrieval identically and
  a parity test fails the PR if they diverge; a committed 156-pair offline
  benchmark (clean and card-polluted queries) is the standing measurement all
  later slices are judged against.
- **Slice B** (REQ-178) — stopped drowning the question in card text: the
  System 3 retrieval query is built from the question plus a compact per-card
  signal (name, type line, keyword list) instead of the card's full oracle
  text, which was measured to drop supplemental recall@5 from 0.577 to 0.026.
- **Slice C** (REQ-179) — cleaned the junk out of the rule index: supplemental
  rules are deduplicated against curated System 2 topic rules by rule-number
  prefix (so a curated parent excludes its lettered sub-rules too), removing
  147 near-duplicate documents before embedding.
- **Slice D** (REQ-180) — switched the keyword signal from a hand-maintained
  list to Scryfall's own per-card keyword list, rebuilding
  `cardDetailByOracleId.json` from the local Scryfall bulk file (36,521
  entries, 16,311 with keywords, no network call).
- **Slice E** (REQ-181) — added semantic retrieval: a committed rule-embedding
  artifact, an `EMBEDDING_PROVIDER` seam (`mock`/`local`/`openai`) mirroring
  `ASK_AI_PROVIDER`, cosine-ranked scoring merged with the existing
  exact-rule-id/parent-rule-id boost, and lexical fallback on any embedding
  failure or under `mock`. `local` is bundled (no per-request external call);
  `openai` is opt-in only, never the default.

## Verification

- PR #191 **MERGED** into `thejudge-auto/rag-rule-retrieval` on 2026-09-05
  (merge commit `d2840740b7941691567698423eb658b150d17d9a`, short `d284074`),
  confirmed via `gh pr view 191 --json state,baseRefName,mergedAt,mergeCommit`
  (`state: MERGED`, `baseRefName: thejudge-auto/rag-rule-retrieval`).
- `git merge-base --is-ancestor d2840740b7941691567698423eb658b150d17d9a HEAD`
  on this checkout: true.
- 48/48 acceptance criteria `true` across `slice-a.criteria.json` (8),
  `slice-b.criteria.json` (9), `slice-c.criteria.json` (9),
  `slice-d.criteria.json` (8), `slice-e.criteria.json` (14) — counted directly
  from each file at cleanup.
- Two independent review passes (node 7, opus, no-write/read-only agent): loop
  1 RETURN TO BUILD (four findings, all resolved in build attempt 2); loop 2
  APPROVE with two Important owner-decision findings, both already resolved
  by the owner at `land` (the never-worse wording softened to the measured
  scope; the semantic eval runs in report mode, not gating, until a hybrid
  blend lands) — see the `## Graph run` node ledger, rows 33/35/37, for the
  full findings text.
- Durable product truth present on this branch (confirmed by direct grep
  against live `PRD/sections/` — see `## Durable truth confirmed` below).

## Durable truth confirmed

Every item below was checked against live `PRD/sections/` on this branch —
none was rewritten by this cleanup; all were applied at `build` together with
the code, including the owner's three `edit` verdicts recorded at `land`:

- **REQ-177** (new) — `functional-requirements.md` (report/harness parity, the
  committed benchmark) — present at ~L4076, cited from `system-map.md:493`.
- **REQ-178** (new) — `functional-requirements.md` (retrieval query
  construction: name/type-line/keyword signal, not full oracle text) —
  present at ~L4100, cited from `user-flows.md:1737` and
  `functional-requirements.md:3847`.
- **REQ-179** (new) — `functional-requirements.md` (rule-index hygiene,
  prefix-based curated exclusion) — present at ~L4124, cited from
  `functional-requirements.md:367`.
- **REQ-180** (new) — `functional-requirements.md` (Scryfall keyword source
  replacing the hand list) — present at ~L4146.
- **REQ-181** (new, with the owner's `edit` verdict applied at `land`) —
  `functional-requirements.md` (semantic retrieval mechanism: embeddings
  artifact, provider seam, runtime query-embed, lexical fallback) — present
  at ~L372/L377/L4197, and in `system-map.md:90`. The never-worse claim is
  scoped to `mock` and fallback settings, with the 2026-09-05 measured
  lookup-mode exceptions under `local` stated inline, per the owner's edit.
- **REQ-032 amendment** (`edit` verdict applied at `land`) —
  `functional-requirements.md:589/591/593`: `test:eval` gates the lexical
  path; the two semantic checks (`system3-expected-recall`,
  `system3-noise-excluded`) run against frozen query embeddings in report
  mode — printed per fixture, not failing the run — until a hybrid
  lexical-plus-semantic blend lands.
- **REQ-022 amendment** (`edit` verdict applied at `land`) — same softened
  never-worse scope as REQ-181/SCOPE-D, semantic-primary mechanism stands.
- **`system-map.md`** — Retrieval relevance report block (L493) and the
  REQ-168/NFR-018 dangling-citation repoints match the accepted
  `GATE-QUESTIONS.md` text; `Backed by:` line at L90 lists
  REQ-178/179/180/181.
- **`system-map/game-rules-retrieval.md` amendment** (`edit` verdict applied
  at `land`) — never-worse sentences (L31, L123) softened to state the
  measured lookup-mode exceptions under `local`.
- **`quick-lookup/README.md` amendment** (`edit` verdict applied at `land`) —
  same softened never-worse wording (L271), with the "better overall but
  worse on exactly this lookup-mode query shape" measurement stated (L273).
- **RAG-deferred mechanic-definition idea** — `functional-requirements.md`
  ~L3887 explicitly scopes it out of REQ-177 through REQ-181 and defers it to
  its own future package once REQ-180 settles the keyword vocabulary.

Nothing was found missing. No promotion was needed at this cleanup.

## Autonomous merge-proof gate

- **Base check:** current branch `thejudge-auto/rag-rule-retrieval` equals the
  recorded `Autonomous base: origin/thejudge-auto/rag-rule-retrieval` exactly
  (`git branch -vv`: ahead 1 of the remote, the close-dispatch bookkeeping
  commit — not yet pushed; the driver pushes after this receipt).
- **Implementation PR:** #191 merged, base `thejudge-auto/rag-rule-retrieval`,
  verified via `gh pr view 191 --json state,baseRefName,mergedAt,mergeCommit`
  (`state: MERGED`, `baseRefName: thejudge-auto/rag-rule-retrieval`, merge
  commit `d2840740b7941691567698423eb658b150d17d9a`). GitHub API was reachable;
  no fallback needed.
- **Worktree:** `.worktrees/implement-rag-rule-retrieval` at `659f57e`
  (branch `thejudge-auto/rag-rule-retrieval-implement-agent`), `git status
  --porcelain` empty (clean); `git merge-base --is-ancestor
  thejudge-auto/rag-rule-retrieval-implement-agent
  thejudge-auto/rag-rule-retrieval` = true (fully merged).
- **Runtime cleanup:** no runtime-process-hygiene acceptance criterion is
  recorded in any `slice-{a..e}.criteria.json` (grep for
  `browser_close`/`playwright`/`runtime-process-hygiene`/`port-release`
  returned nothing) — this is a backend retrieval/data feature with no
  browser-driven verification, so the check is vacuously satisfied. Nothing
  to release.

All four checks pass.

## Actions taken

- Wrote this receipt (before any delete).
- Confirmed durable `PRD/sections/` truth present (no rewrite — see
  `## Durable truth confirmed`).
- Confirmed `PRD/sections/system-map.md` has no `planned`/`partial` entry for
  this feature to flip — its RAG-retrieval entries (L90, L493) already read
  as shipped fact, not a forward-looking plan marker. No system-map edit made.
- Removed the `rag-rule-retrieval` row from `PRD/work/STATUS.md`
  (`## ship-ready`).
- Deleted the work package: `git rm -r PRD/work/rag-rule-retrieval/`.
- Removed the merged worktree `.worktrees/implement-rag-rule-retrieval` with
  `git worktree remove`. Its local branch
  `thejudge-auto/rag-rule-retrieval-implement-agent` was left in place per the
  same-safety-check pattern seen on the prior `image-first-cards` cleanup
  (git's branch-delete safety check compares against the branch's configured
  upstream, not `HEAD`); no remote branch touched.
- Did not commit and did not push — the driver commits and pushes per the
  controlling instruction.

## Files

- Created: `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` (this
  receipt)
- Updated: `PRD/work/STATUS.md` (`## ship-ready` row removed)
- Deleted: `PRD/work/rag-rule-retrieval/` (entire package, including
  `GRAPH-RUN.md`, `GATE-QUESTIONS.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`,
  `IDEA.md`, `README.md`, `STATUS.ship-ready`, `intake/` — 6 files plus 5
  subfolders (20 files) — slice docs, and criteria files)

## Graph run

- Run ID: `graph-20260905-012712` (build-half; spec-forming half
  `graph-20260905-061805`) | Profile: `loaded (env sentinel)` | Terminal
  state: shipped (PR #191 merged into `thejudge-auto/rag-rule-retrieval` at
  `d284074`, 2026-09-05)

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/rag-rule-retrieval` pushed at `ad4930f` (tree `clean`, no stash); lock `.worktrees/.graph-run.lock` runId `graph-20260905-061805`; canary denied both tiers; `Profile: unverified` | 2026-09-05 |
| 2 | shape | sonnet | ok | `0 → 44` | package `PRD/work/rag-rule-retrieval/` created (`IDEA.md` with 13 `## Prior run` receipts, `README.md`, `STATUS.ideation`, board row); 26 intake files copied verbatim into `intake/` (`diff -rq` zero drift) from `.worktrees/.graph-intake/graph-20260905-061805/`, staging deleted; commit `d6b8d84` | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver)` | owner's cleanup: `git rm` of `PRD/work/probe-slow-load-vs-rag/`, `PRD/work/probe-prompt-data-optimization/`, four `PRD/work/promptRefinement*.md` — every file first confirmed byte-identical under `intake/` (`cmp`); ledger moved into package; `## Autonomous metadata` written; commit `d6b8d84` | 2026-09-05 |
| 3 | define | opus | ok | `0 → 73` | `STATUS.refined`; `DESIGN-BRIEF.md` (5-step gameplan REQ-177..181, 10 assumptions, intake dispositions) + `GATE-QUESTIONS.md` (24 slots: 5 new REQ, 4 SCOPE decisions, 8 amended IDs incl. NFR-017 Lambda-budget finding, 7 amended specs; 32 Current blocks verified verbatim); 0 blocker questions; commit `797086a` | 2026-09-05 |
| 4 | gate-qc | sonnet | ok | `0 → 54` | PASS, no findings (attempt 1): all Current blocks verbatim vs live files; REQ-177–181 unused live, FLOW-024 high-water; amendment set re-grepped complete; RAG-DEFERRED citations repointed; technical-design-rules hold; live measurements reproduced (`retrieval:report` 6/9 same 3 failures, `test:eval` green, index 3,432/3,285/147/626); `STATUS.refined` unchanged, nothing committed → stop at PASS: docs PR + `owner-action` park | 2026-09-05 |
| — | driver-resume | — | ok | `n/a (driver)` | run two (`/loop graph-implement`, tick 1): `git fetch`; ready-spec scan found `rag-rule-retrieval` (24/24 `accept`, PR #190 MERGED 2026-09-05T07:02:31Z, no code built); base `thejudge-auto/rag-rule-retrieval` fast-forwarded to `main` (`eb0db9a`); lock taken (`npm run graph:preflight -- --take-lock --slug rag-rule-retrieval --run-id graph-20260905-010802 --pid 83033`); both canaries denied; claim committed (`STATUS.owner-action → STATUS.active`, board row moved to `## active`) | 2026-09-05 |
| — | gate-review | sonnet | ok | `0 → 23` | run two, build half. Applied 24 accept / 0 edit / 0 reject inside `GATE-QUESTIONS.md` (no diff change — all accept; `git diff` on `GATE-QUESTIONS.md` and `PRD/sections/` empty); wrote `## Gate verdicts`; resolved `## Open gate`; restored `STATUS.active → STATUS.refined`, README `status: refined`, board row moved to `## refined`. No `PRD/sections/` edits | 2026-09-05 |
| 4 | gate-qc | sonnet | failed | `0 → 103 — cap 60 + grace 30 exhausted` | build-half re-check attempt 1 reported PASS (all `Current:` blocks verbatim, REQ-177–181 unused, `retrieval:report` 6/9 same 3 failures, `test:eval` green, budget test green, index 3,432/3,285/147/626) but the node fanned out to three helper subagents whose calls charged its own key; the hook denied every call from #91 onward, including the driver's park writes, until the owner deleted `.worktrees/.graph-run-state.json` by hand. Outcome recorded `failed` (cap overrun, contract `## Node table`), not PASS: the helpers were cut off mid-check, so the PASS is re-graded as attempt 2 with fan-out forbidden. Driver closed the two residuals it named: `prompt-assembly.md:53` is a debug-sidecar mention, not a scoring claim; `prompt-layout-spec.md:3` `Backed by:` line present and unchanged since the run-one PASS | 2026-09-05 |
| 4 | gate-qc | sonnet | parked | `attempt 2: 0 → 1 (dispatch denied)` | attempt 2 dispatch (no fan-out) denied by the hook rule `denied-command-retry`: attempt 1's helpers had an `Agent` call denied under `tool-call-cap` (`.worktrees/.graph-denials.jsonl` key `Agent::::`, 2026-09-05T07:14:25Z), and `denialKey()` keys `Agent` on tool name alone, so every later `Agent` dispatch in run `graph-20260905-010802` is refused (`ToolSearch::::` and `ScheduleWakeup::::` poisoned the same way). Not remediable in-run; run PARKED, lock released with `.graph-run-release.json` `{ runId, state: PARKED }`, run-state deleted. Product truth untouched; no product question open | 2026-09-05 |
| — | driver-resume | — | ok | `n/a (driver)` | run two resumed (`/loop graph-implement`, 2026-09-05 01:27): `git fetch`; `origin/main` at `eb0db9a` is an ancestor of the base branch (`git log HEAD..origin/main` empty); stale lock (`graph-20260905-012215`, pid 83033 dead) reclaimed via release record + `rm`; lock taken (`npm run graph:preflight -- --take-lock --slug rag-rule-retrieval --run-id graph-20260905-012712 --pid 41137`); both canaries denied; `STATUS.owner-action → STATUS.refined` (gate already resolved by gate-review), board row moved to `## refined`; open gate resolved (fresh run id clears the poisoned retry key) | 2026-09-05 |
| 4 | gate-qc | sonnet | ok | `0 → 16` | build-half re-check attempt 3 (run `graph-20260905-012712`, key `gate-qc/1`): PASS, no findings; 13 tool calls, no subagents; all 24 `Verdict:` lines `accept`; REQ-177–181 unused live (`functional-requirements.md` ends at REQ-176); every spot-checked `Current:` block byte-identical to live `PRD/sections/` (REQ-022/032/074/167/168, NFR-017/018, Q-001, system-map.md:88/493, game-rules-retrieval.md, prompt-layout-spec.md, quick-lookup/in-depth READMEs, integrations-and-data.md, user-flows.md:252/517); `git log -- PRD/sections` shows no section edit since the gate resolved; `STATUS.refined` unchanged; `git status --porcelain` empty after the node | 2026-09-05 |
| 5 | plan | sonnet | ok | `0 → 40` | `GAMEPLAN.md` + five slice docs (A `slice-a-trustworthy-measurement.md` REQ-177, B `slice-b-fix-the-query.md` REQ-178, C `slice-c-clean-the-corpus.md` REQ-179, D `slice-d-scryfall-keywords.md` REQ-180, E `slice-e-pick-rules-by-meaning.md` REQ-181 + ship gates) + `slice-{a..e}.criteria.json` (8/9/9/8/14 criteria, all `false`, every one with an `evidence` block — driver-verified by script); GAMEPLAN maps each accepted `PRD/sections` amendment to its owning slice and records six assumptions (1:1 step→slice sequential; REQ-177–181 next-free; gates stay relative; `EMBEDDING_PROVIDER` mirrors `ASK_AI_PROVIDER`; embeddings artifact beside the rule index in `apps/backend/data/`; slice A clears the two dangling-citation repoints); `STATUS.refined → STATUS.active`, board row under `## active`; `DESIGN-BRIEF.md`/`GATE-QUESTIONS.md`/`PRD/sections/` untouched (`git status`); 37 tool calls, no subagents; package published to `origin/thejudge-auto/rag-rule-retrieval` at `98da746` (last driver push to the base) | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver, during build/1)` | owner approved raising the build cap mid-run ("i approve increasing the budget if needed"): `build` cap 600 → 1200 in `scripts/lib/boundary-rules.mjs` `NODE_CALL_CAPS` and the contract `## Node table` (commit `f9886f6`); the hook re-reads the module per call, so it took effect at once (`capForNode("build")` → 1200); counter stood at 210 after slice A of five. The `graph-implement/reference.md` mirror row still reads 600: the driver's `sed -i` was denied by the graph profile and the `Edit` on `.claude/skills/` was blocked by the auto-mode classifier — owner to make that one-line edit and run `npm run skills:ai-sync`; the contract wins where they disagree. Mechanics only, no scope or criteria change; builder notified | 2026-09-05 |
| — | driver-bookkeeping | — | ok | `n/a (driver, during build/1)` | build/1 stalled four times on the harness stream watchdog ("no progress for 600s") during an intermittent model outage — counter at 405, 413, 420, and 426; zero hook denials for run `graph-20260905-012712` at each stall; the driver resumed the same agent by message each time (same attempt, context intact). State at the fourth stall: slices A–C committed on the implement-agent branch and pushed (`5746a04`), slice D verified and marked done in the worktree README with 62 changed files uncommitted, slice E not started; PR #191 open `thejudge-auto/rag-rule-retrieval-work` → `thejudge-auto/rag-rule-retrieval` (https://github.com/ChrisMiho/TheJudge/pull/191). Also recorded here: the driver's 01:27 `## Open gate` rewrite anchored on the first textual `## Open gate` (inside the gate-review row) instead of the heading and truncated the node table, so the four rows above were silently dropped until this repair rebuilt the table from commit `e0140a9` — `graph-ledger-check` does not validate the node table, which is why it passed | 2026-09-05 |
| 6 | build | sonnet | ok | `0 → 773` (four stream-watchdog stalls, resumed in place) | PR #191 https://github.com/ChrisMiho/TheJudge/pull/191 (`thejudge-auto/rag-rule-retrieval-work` → `thejudge-auto/rag-rule-retrieval`, head `a0d38f2`, MERGEABLE, checks static/backend/frontend×3/coverage-merge SUCCESS); worktree `.worktrees/implement-rag-rule-retrieval` clean at `a0d38f2`; five slices A–E done, each with `test:eval` + `quality:check` green and E adding `lambda-package-budget.test.mjs` + `EMBEDDING_PROVIDER=local test:eval`; 48/48 criteria `true` across `slice-{{a..e}}.criteria.json` (driver-verified by script); `STATUS.ship-ready` in the worktree; 133 files (95 `apps/backend`, 10 `PRD/sections`, 13 `PRD/work`, scripts, `vendor/onnxruntime-web-stub`); PR touches no driver-owned file (no `GRAPH-RUN.md`, `boundary-rules`, contract, `.claude/`). Write-scope assertion: launch checkout and both other worktrees `git status --porcelain` empty — pass for the repository; one write outside the repository, scratch dir `/tmp/lambda-sim` (311M, Lambda package measurement via `npm ci`), left for the owner to delete. Two boundary denials during the node, both correct and neither retried: `rm -rf` inside `/tmp/lambda-sim` (`recursive-force-remove`) and a backgrounded `npm run quality:check` (`background-launch`). Builder-raised findings carried to review and `land`: (1) REQ-181 embedding-text shaping measured 13/20 vs plain 19/20 recall@5 — plain shipped, measurement recorded in REQ-181 notes (a divergence from the accepted wording the owner must see); (2) Lambda non-data reserve 20MB → 130MB, ~2.6MB headroom under the 250MB quota. 700 tool calls, ~944k subagent tokens, no subagents | 2026-09-05 |
| 7 | review | opus | failed → build (loop 1 of 2) | `0 → 39` | no-write reviewer (Explore agent type: no Write/Edit/NotebookEdit), 36 tool calls, no subagents. Verdict RETURN TO BUILD. Critical: C-1 E10 not met — `test:eval` runs only `contextEvaluationHarness.test.ts`, which has no `queryEmbedding` wiring, so `system3-expected-recall`/`system3-noise-excluded` stay lexical-only; the new `semanticRetrievalEval.test.ts` tests two invented queries and is outside `test:eval`; C-2 applied REQ-032 text (`functional-requirements.md:591`) asserts the semantic eval that does not exist. Important: I-1 D1 committed `cardDetailByOracleId.json` has `keywords` on 0/36,521 entries (script writes it, artifact never rebuilt; production keyword signal inert); I-2 D4 fixtures pass only via hand-added inline `keywords`; I-3 B4/D5/E9 benchmark pollution nearly empty (no `name`/`keywords` in the artifact), so multi-card gates are met by the letter; I-4 E12 embeddings artifact outside the `data:build` chain contrary to the accepted block, validator never checks rule ids against the index, semantic branch silently drops unvectored entries. Minor: M-1 `askAi.ts` comment/mock query build; M-2 `package-lambda.sh` rewrites the committed embeddings artifact at deploy; M-3 E14 needs a human. Notes: N-1 REQ-179 note contradicts applied REQ-181; N-2 SCOPE-C/`real rule content` wording drift. Owner statements: REQ-181 divergence (accepted shaping vs shipped plain `sectionTitle: text`, 13/20 vs 19/20 on a 20-question sample; code and applied text consistent with each other, not with the accepted text — owner's call at `land`); NFR-017 test green and honest (quota 250 MB, reserve 130 MB, data 117.40 MB, headroom ~2.6 MB) but the constraint line still carries the stale 230 MB / 118 MB numbers. Reviewer confirmed by reading or running: A1–A7, B1–B2, B4–B5, C1–C4, C7, D3, D6, E1–E8, E11, E13 partial; 39/42 accepted blocks match `PRD/sections/` exactly; took on the file's word: full `quality:check` chains, B6 provenance, E9 full-precision reference, D2 question-text half | 2026-09-05 |
| 6 | build (attempt 2, review loop 1) | sonnet | ok | `0 → 270` | same builder agent resumed with the nine review findings; head `03bcb0f` pushed to `thejudge-auto/rag-rule-retrieval-work` (no force), PR #191 body gained a Review loop 1 section; loop diff `a0d38f2..03bcb0f` 29 files +1296/−260. Builder-reported resolutions: E10 harness now runs `system3-expected-recall`/`system3-noise-excluded` on the semantic path via committed `frozen-query-embeddings.json` (new `scripts/build-frozen-query-embeddings.mjs`), `semanticRetrievalEval.test.ts` deleted, `usedSemantic` diagnostic added — with the honest note that 3/8 labelled fixtures fall short of full recall under pure cosine (702.2b ranks 6th behind 702.2a; 701.8b cross-ref missed); REQ-032 text re-verified; D1 `cardDetailByOracleId.json` rebuilt from the local Scryfall bulk file, no network (36,521 entries, 16,311 with keywords); D4 `fixtureCardDetail.ts` reads keywords from the committed artifact, lookup fixtures re-pointed Questing Beast → South Wind Avatar, golden prompts regenerated; B4/D5/E9 pollution now joins real card name from `cardMetadata.json`, `results.json`/`semantic-results.json` re-recorded, `step1-baseline.json` left as the before reference; E12 `build-rule-embeddings` in `data:build` behind an index-hash skip, accepted wording restored, rule-id validator with lexical fallback + one warning; NFR-017 restated (120 MB budget, ~118.1 MB data, ~1.9 MB headroom); `scripts/warm-embedding-model-cache.mjs` replaces the deploy-time artifact rewrite; `askAi.ts` comment fixed and mock skips query-text build. `quality:check` green per builder (423 backend + 448 script tests). Driver-verified: launch checkout and other worktrees clean, build worktree clean at `03bcb0f`, 48/48 criteria `true`, `STATUS.ship-ready`, PR MERGEABLE with static/backend/frontend×3 SUCCESS (coverage-merge pending), no driver-owned file touched, no new denials (still 2). ~265 tool calls this attempt | 2026-09-05 |
| 7 | review (attempt 2) | opus | ok — APPROVE with 2 Important owner-decision findings | `0 → 40` | fresh no-write reviewer (Explore type), 37 tool calls, no subagents. Both loop-1 Criticals resolved: E10's semantic path is real (frozen vectors cosine 1.000000 against a live embed of the same query text; `usedSemantic` asserted), REQ-032 line true; D1 counts confirmed (36,521 / 16,311; local bulk file, no fetch); D4 swap disclosed and on the production path (`fixtureCardDetail.ts:31` reads the committed artifact by oracle id); benchmark result files reproduce byte-for-byte in-process (B4 gap 0.0577 < 0.10; B5 0.5833 ≥ 0.5769; E9 0.8526/0.8333 vs 0.865/0.763); E12 chain + hash skip + rule-id validator with lexical fallback confirmed; NFR-017 test 2/2 green, 118.10 MB of 120 MB (1.90 MB headroom); deploy script no longer rewrites a tracked file; `askAi.ts` fixed. Important (owner decisions, not builder errors): (1) E10/REQ-032 — `contextEvaluationHarness.test.ts:326-331` hard-asserts only that the semantic scorer engaged; the per-fixture recall verdicts are printed, not gated, and the printed run shows `quick-lookup-card` 0/1, `quick-lookup-multi-card` 0/1, `state-based-actions` 1/2 FAIL under semantic — honest in kind (no threshold lowered, no changed expectation, no hybrid scorer) but `functional-requirements.md:591` reads as if `test:eval` gates it; making it gate needs a ground-truth or shaping decision this loop was forbidden to make. (2) REQ-181/`functional-requirements.md:4197` (also `:372`, `game-rules-retrieval.md:31,118`) — the accepted sentence that System 3 is never worse than lexical under any provider setting is contradicted by the PR's own measurement: under `EMBEDDING_PROVIDER=local` the multi-card lookup returns no deathtouch rule at all where lexical returned `702.2c, 702.2b, 702.2a, 702.2d, 702.2f`. Minor: slice-E note understates the multi-card miss (702.2b ~13th, not 6th); D5 read literally fails (0.5256 < 0.5321) and the slice doc says so, attributing it to the pollution-realism change; no labelled fixture covers the multi-keyword case. Product signal: today nothing changes for players (default `mock` keeps the improved lexical path, clean recall@5 0.5769 → 0.5833); flipping to `local` is much better on the 156-pair benchmark (0.85 vs 0.58 clean, 0.83 vs 0.53 polluted) and distinctly worse on short lookup-mode questions. Verified by own run: quality:check exit 0, test:eval 3/3, benchmark reproduction, budget test | 2026-09-05 |
| 8 | land | — | parked | `n/a (human)` | awaiting the owner's merge of PR #191 https://github.com/ChrisMiho/TheJudge/pull/191 (head `03bcb0f`, MERGEABLE, checks green) and the three decisions under `## Open gate`; `STATUS.active → STATUS.owner-action`, board row moved to `## owner-action`; lock released with `{"runId":"graph-20260905-012712","state":"PARKED"}` and the run-state file deleted | 2026-09-05 |
| 6 | build (attempt 3, gate resolution at land) | sonnet | ok | `0 → 57` | merge commit `c5f1e8b` brought the base's bookkeeping commits into the `-work` branch (board row kept under `## ship-ready`, `STATUS.ship-ready` the only marker); edit commit `659f57e` applied the owner's decisions: never-worse promise softened at `functional-requirements.md:372`/`:4197`, `game-rules-retrieval.md:31`/`:123`, `quick-lookup/README.md:271` (now scoped to `mock` and fallback settings, with the 2026-09-05 `local` measurements and lookup-mode exceptions stated); REQ-032 bullets at `functional-requirements.md:591`/`:593` reworded to report-only semantic checks until the hybrid blend; slice-E disclosure corrected (702.2b 6th single-card, ~13th multi-card) with the dated decision line. Driver-verified: no file outside `PRD/` in the edit commit, `grep -rn 'never worse' PRD/sections/` shows only the scoped phrasing, launch checkout and worktree clean, `quality:check` + `test:eval` green per builder, PR #191 head `659f57e` MERGEABLE (frontend shards still running at record time). Text-only change, verified by the driver by reading the diff; no third reviewer dispatched | 2026-09-05 |
| 8 | land | — | ok | `n/a (human)` | owner merged PR #191 at `d284074` (2026-09-05T17:22:14Z) after all eight checks passed at head `659f57e`; base `thejudge-auto/rag-rule-retrieval` fast-forwarded to the merge; `STATUS.ship-ready` and the `## ship-ready` board row arrived with the merge; E14 attestation made by the owner at merge; lock re-taken with the same run id and the canary denied again | 2026-09-05 |
| 9 | close | sonnet | ok | `0 → 31` | `thejudge-cleanup` under `graph is controlling`: receipt `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` written before delete with `## Graph run` (both ledger tables verbatim) and `## Intake` (20 files); autonomous merge-proof gate 4/4 (base match, PR #191 merged into the recorded base, worktree clean and merged, no runtime-hygiene criteria); durable `PRD/sections/` truth confirmed present, nothing re-written; `system-map.md` had no planned/partial entry to flip; `PRD/work/rag-rule-retrieval/` removed via `git rm -r` (43 paths), board row removed, worktree `.worktrees/implement-rag-rule-retrieval` removed, local branch `thejudge-auto/rag-rule-retrieval-implement-agent` left in place; 29 tool calls, no subagents; the driver commits, pushes the base, and opens the base → `main` PR — run COMPLETE, lock released with `{"runId":"graph-20260905-012712","state":"COMPLETE"}` | 2026-09-05 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "i want to better refine this idea and cleanup the rest of the work folder on that pertains to rag, so that we have a pinpoint gameplan" | answered-once | shape | — |
| "cleanup the rest of the work folder on that pertains to rag" | answered-once | shape | — |
| "accept all 24 and mark them in the gate file for me" | answered-once | owner-action | — |
| "graph-implement, this is probably a long running task, and i am heading to bed, do you wanna start with validating any credentials you need before i head out" | answered-once | driver-resume | — |
| "graph-implement, im resuming this graph after some issues, and ive got the graph profile on now" | answered-once | driver-resume | — |
| "i approve increasing the budget if needed" | answered-once | build | — |
| "Accept plain (Recommended)" | answered-once | land | — |
| "Soften now (Recommended)" | answered-once | land | — |
| "Report for now (Recommended)" | answered-once | land | — |
| "i see 6 local commits? want to walk me through the questions and get everything pushed up before i merge?" | answered-once | land | — |
| "merged, go ahead and run close" | answered-once | land | — |

## Intake

- `intake/MANIFEST.md` — the intake manifest itself, written at `shape` to
  record the origin of every staged file below.
- `intake/probe-slow-load-vs-rag/PROBE.md`,
  `intake/probe-slow-load-vs-rag/FINDINGS-data-layer.md`,
  `intake/probe-slow-load-vs-rag/FINDINGS-slow-load.md`,
  `intake/probe-slow-load-vs-rag/GRAPH-BRIEF.md` — copied verbatim from
  `PRD/work/probe-slow-load-vs-rag/` on `main` (2026-09-03 investigate probe);
  `GRAPH-BRIEF.md` there already shipped as image-first-cards,
  `FINDINGS-data-layer.md` carries the RAG path this package built.
- `intake/probe-prompt-data-optimization/PROBE.md`,
  `.../APPENDIX-prompt-measurements.md`, `.../FINDINGS-data-pipeline.md`,
  `.../FINDINGS-prior-work.md`, `.../FINDINGS-prompt-anatomy.md` — copied
  verbatim from `PRD/work/probe-prompt-data-optimization/` on `main`
  (2026-09-01 investigate probe).
- `intake/prompt-refinement-notes/promptRefinement.md`,
  `.../promptRefinement-analysis.md`, `.../promptRefinement-enhancements.md`,
  `.../promptRefinement-notes.md` — the four loose
  `PRD/work/promptRefinement*.md` notes;
  `promptRefinement-notes.md` was already consumed by the shipped
  prompt-context-refinement run (receipt
  `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md`).
- `intake/semantic-rule-retrieval-branch/DESIGN-BRIEF.md`,
  `.../FINDINGS-EMBEDDING-PROVIDER.md`, `.../GATE-QUESTIONS.md`,
  `.../GRAPH-BRIEF.md`, `.../HANDOFF.md`, `.../IDEA.md`, `.../README.md` —
  copied from `PRD/work/semantic-rule-retrieval/` on
  `origin/thejudge-auto/semantic-rule-retrieval` (never merged; docs-only
  PR #154 closed unmerged 2026-09-01); `GRAPH-RUN.md` and
  `STATUS.owner-action` deliberately not copied (they belonged to that run).
- `intake/combo-context-validation-branch/FINDINGS.md`, `.../HANDOFF.md`,
  `.../IDEA.md`, `.../README.md` — copied from
  `PRD/work/combo-context-validation/` on
  `origin/explore/semantic-rule-retrieval` (RAG benchmark numbers); its
  harness code and generated artifacts stayed on that branch, cited not
  copied.
- `intake/prompt-context-refinement-history/RAG-DEFERRED.md` — recovered from
  git history (`2499a19^`); deleted with its work folder at a prior cleanup,
  but live truth still cites it (`functional-requirements.md` ~L3874,
  `non-functional-requirements.md` ~L286) — the mechanic-definition
  enrichment idea filed for the RAG track.
