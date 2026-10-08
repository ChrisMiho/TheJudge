# Receipt — niche-interaction-rule-tests — 2026-10-07

**What happened:** A tester said Ask AI got hard rules questions wrong when the
player attached the cards, for example Academy Manufactor with Esix, Fractal
Bloom (stacked token replacement effects) and Silence with Necropotence and
Borne Upon a Wind. The cause was that the rules that decide those fights
(replacement and prevention effects) often did not reach the AI. Now, when a
player attaches two or more cards whose wording replaces or prevents an event,
the AI prompt also carries a ten-rule excerpt of the Comprehensive Rules on
replacement and prevention effects. Nothing else in the prompt changed. Code PR:
https://github.com/ChrisMiho/TheJudge/pull/276 (open, not yet merged).

**What it means for you:** Merge PR #276 to ship it. After the merge, the
tester's two questions reach the AI with the deciding rules in front of it.
This change is measured offline only: the deciding rules now reach the prompt
and no other test case lost a rule. Whether the answers themselves improved was
not measured, because this run made no live model calls. The prompt output
format is the next package, as you set on 2026-10-06.

## Summary

- Date: 2026-10-07
- Slug: niche-interaction-rule-tests
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 8, `close`), run
  `graph-20261006-150550`, **PR-ready path** — this receipt and the package
  deletion are committed on the code branch and ride in PR #276, before the
  owner's merge.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/main`).
- PR: https://github.com/ChrisMiho/TheJudge/pull/276

## What shipped

- **Slice A — topic data and size guard.** A new curated topic,
  `replacement-effect-interactions` (ten rules, 3,846-character excerpt, built
  from the committed rule index by the work package's
  `build-topic-from-index.mjs`), added to `gameRulesByTopic.json` and
  `gameRulesTopicManifest.json`. The build-policy guard in
  `gameRulesBuildPolicy.test.ts` moved from 23 to 24 topics and from 22,000 to
  26,000 characters (measured total 25,808).
- **Slice B — card-wording selector and rules truth.** `gameRulesTopicSelection.ts`
  switches the topic on when two or more attached cards carry replacement or
  prevention wording; `prompt/preparation.ts` passes the cards through. The
  product truth (REQ-220 new, REQ-022 amended) was applied to `PRD/sections/`
  in the same commit.
- **Slice C — the rules gate counts a rule a curated topic carries.** The
  offline rules gate (`rulesGate.ts`, `baseline.ts`, `baseline.json`) gains a
  per-case `inTopic` list so a deciding rule carried by the topic counts as
  reaching the prompt (REQ-222 amended). Slices B and C landed in one commit
  because Slice B alone fails the rules gate on `replacement-bard-and-bilbo-tokens`.
- **Slice D — re-measure and ship.** Every rule-output suite re-run; REQ-220's
  last Notes bullet carries the measured before and after (`slice-d.evidence.md`).
- **REQ-221 withdrawn.** Both tester questions were already approved cases in
  the rules test corpus, so no new cases were added; the number stays unused.

## Durable truth

Applied by the build with the code and confirmed present at cleanup; nothing
promoted and nothing re-written. REQ-220 (new) and REQ-022, REQ-222 (amended)
are in `PRD/sections/functional-requirements.md`; the integrations, Quick
Lookup, In-Depth, game-rules-retrieval and prompt-layout pages carry the
matching lines. `PRD/sections/system-map.md` shows "Game rules retrieval" and
"Curated game rules (System 2)" as `shipped`, backed by REQ-220.

## Files created, updated, deleted

Updated (all in PR #276):

- `PRD/sections/functional-requirements.md`, `PRD/sections/integrations-and-data.md`,
  `PRD/sections/in-depth/README.md`, `PRD/sections/quick-lookup/README.md`,
  `PRD/sections/system-map.md`, `PRD/sections/system-map/game-rules-retrieval.md`,
  `PRD/sections/system-map/prompt-layout-spec.md`
- `apps/backend/data/gameRulesByTopic.json`, `apps/backend/data/gameRulesTopicManifest.json`
- `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/gameRulesTopicSelection.test.ts`
- `apps/backend/src/prompt/preparation.ts`, `apps/backend/src/prompt/preparation.test.ts`,
  `apps/backend/src/prompt/promptAssembly.test.ts`
- `apps/backend/src/eval/rules-gate/rulesGate.ts`, `rulesGate.test.ts`, `baseline.ts`,
  `baseline.json`; `apps/backend/src/eval/worked-solutions/README.md`
- `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts`
- `PRD/work/STATUS.md` (board row removed at close)

Created at close: this receipt.

Deleted at close: `PRD/work/niche-interaction-rule-tests/` (the whole package
folder, including `intake/`, the measure scripts and their outputs, and
`GRAPH-RUN.md`).

## Verification

From the build (node 20) and the independent review (node 21, APPROVE on head
`896e9a44`, 0 Critical, 0 Important, 2 Minor):

- All 45 slice criteria `true` across the four `slice-*.criteria.json` files
  (read at close; self-reported by the build, because the hook evidence log
  earned no new entries — the known evidence-root gap).
- Review re-ran: backend tests 600/600, frontend 1559/1559, `test:scripts`
  766/766, typecheck, lint (0 errors), format check, `eval:worked-solutions`
  287/392, rules-staleness 0/0, evidence trace (rules 614.1a, 616.1, 616.1e,
  616.1f available).
- Old against new `baseline.json`: only the Bard and Bilbo case moved; 11 cases
  carry an `inTopic` list; 287 System 3 complete. No recorded hit lost.
- No live model call and no data refresh were made.
- Runtime-cleanup criteria: none recorded; the package is offline-only (no
  browser, server, or port).

## Follow-ups (Minor, from review)

1. The header comment at `apps/backend/src/gameRulesTopicSelection.ts:8-10`
   names only instead and prevent wording, not prevents and prevented.
2. REQ-220's Notes bullet in `PRD/sections/functional-requirements.md` says
   3,837 characters where the committed excerpt is 3,846 (carried from the
   accepted proposal).

## Loose ends

- The gitignored model folder `apps/backend/data/models/` was copied into the
  build worktree (brief step 7) and the gitignored `output/evidence-trace/`
  files were written there; `npm run graph:prune` removes both when it removes
  the worktree after the merge.
- PR #273 (data refresh) is still open. When it lands it will rebuild topic
  text from the new rules index, so the topic's character count and the
  `gameRulesBuildPolicy.test.ts` ceiling (26,000) need a look then.
- After the merge: run `npm run graph:prune`.

## Graph run

- Run ID: `graph-20261006-150550` | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/276

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/niche-interaction-rule-tests` pushed (`git ls-remote --heads origin thejudge-auto/niche-interaction-rule-tests` → `066fbbd`) from `.worktrees/kickoff-niche-interaction-rule-tests`; launch checkout still on `main`; lock `.worktrees/.graph-run.lock` runId `graph-20261006-150550` | 2026-10-06 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/niche-interaction-rule-tests/IDEA.md`, `README.md`, `STATUS.ideation`, `intake/` (4 files verbatim), `PRD/work/STATUS.md` ideation row | 2026-10-06 |
| 3 | define | opus | ok | `0 → 82` | `PRD/work/niche-interaction-rule-tests/DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (REQ-220; Blocker questions: none), `measure-retrieval.mjs`, `STATUS.refined`; owner added intake `intake/screenwriter_temp_1791299243121.jpg` mid-node (the tester's exact prompts), relayed to the node by the driver | 2026-10-06 |
| 4 | gate-qc | sonnet | failed | `0 → 38` | FAIL attempt 1 of 3: 3 findings (1 Important: REQ-220 `source` cites an intake path cleanup deletes; 2 Minor: two-card list ambiguity, lexical-fallback refusal credited to REQ-185 not REQ-188); `STATUS.refining`; findings in `README.md` `## Preparation gate` | 2026-10-06 |
| 5 | define | opus | ok | `0 → 29` | attempt 2: 3 gate-qc findings fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (REQ-220 `source` cites reporter/date/channel/CR ids, two-card list, REQ-188 credited); `STATUS.refined` | 2026-10-06 |
| 6 | gate-qc | sonnet | ok | `0 → 32` | PASS attempt 2, findings none; README `## Preparation gate` PASS; parked `STATUS.owner-action`; docs PR https://github.com/ChrisMiho/TheJudge/pull/266 | 2026-10-06 |
| 7 | define | opus | ok | `0 → 56` | attempt 3 (owner re-scope, not a gate-qc loop): `DESIGN-BRIEF.md` rewritten, `GATE-QUESTIONS.md` = new REQ-220, REQ-022 amended, new REQ-221; `measure-candidates.mjs` + `measure-candidates.out.txt` (C7 fixes Manufactor + Esix, 0 suites move); `STATUS.refined` | 2026-10-06 |
| 8 | gate-qc | sonnet | failed | `0 → 62` | FAIL attempt 3 (2nd FAIL of 3 allowed loops): 6 findings (3 Important: Q1 fixture gets no frozen vector, 616.1 top-ten claim vs lexical #7/#8, topic build needs gitignored `apps/backend/data/cr/source.txt`; 3 Minor: case-insensitive amendment grep, whole-word match rule, cost range); `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 9 | define | opus | ok | `0 → 48` | attempt 4: 6 gate-qc findings fixed in `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (Q1 System 2 label only, one new vector; both-rules top-ten claim; `node scripts/build-game-rules.mjs` build step with local `source.txt` copy + byte-identical outputs; case-insensitive grep 28 hits; whole-word match; measured cost range); `STATUS.refined` | 2026-10-06 |
| 10 | gate-qc | sonnet | failed | `0 → 62` | FAIL attempt 4 (3rd FAIL; final loop to define): 5 findings (2 Important: build source is 2026-08-07 text vs committed 2026-06-05 artifacts — 50 rule texts change incl. 616.2/514.3a; `gameRulesBuildPolicy.test.ts` 23-topic / 22,000-char guard; 3 Minor: checklist-report golden, ~3,720 formatted cost, three disposition rows); `STATUS.refining`; findings in README `## Preparation gate` | 2026-10-06 |
| 11 | define | opus | ok | `0 → 61` | attempt 5: 5 findings fixed; topic built from committed `gameRulesRuleIndex.json` (2026-06-05 text) via new `build-topic-from-index.mjs` — 23/23 topics byte-identical, index/stats/embeddings unchanged (scratch export of `origin/main`); build-policy guard proposed 23→24 topics, 22,000→26,000 chars (measured 25,632); checklist golden, ~3,720 cost, three disposition rows; `STATUS.refined` | 2026-10-06 |
| 12 | gate-qc | sonnet | parked | `0 → 76` | FAIL attempt 5 = 4th FAIL → parked at owner-action per the three-loop cap: 2 findings (1 Important: game-mode topic scope phrased as stack/battlefield/in play in `GATE-QUESTIONS.md:31`, `:219`, `DESIGN-BRIEF.md:196` vs every populated zone; 1 Minor: three disposition rows); build path, numbers, IDs, diff anchors all verified clean; findings in README `## Preparation gate` | 2026-10-06 |
| 13 | define | opus | ok | `0 → 95` | attempt 6 (resume after restore; owner-authorized pass): both attempt-5 findings fixed (one scope phrase, three disposition rows); re-measured on the rules test harness via new `measure-rules-gate.mjs` (+ `.out.txt`, `.nine.out.txt`): the System 2 topic does not register in the rules gate and the nine-rule topic would fail its ratchet on `replacement-bard-and-bilbo-tokens` (616.1f), so `GATE-QUESTIONS.md` now = REQ-220 (topic gains 614.1a as C8; 0 suites move; 25,808 chars under the 26,000 cap), REQ-022 amended, REQ-222 amended (new `inTopic` list; 0 recorded hits lost over 392 cases), REQ-221 withdrawn (both tester cases already approved corpus cases); Necropotence #7/#3 vs baseline misses reconciled to query-text difference (verbatim vs corpus wording); `measure-candidates.mjs` ported to the case format, attempt-5 numbers reproduce; `STATUS.refined`; board row moved owner-action → refined | 2026-10-07 |
| 14 | gate-qc | sonnet | ok | `0 → 64` (includes 4 driver calls made during the node) | PASS attempt 6, findings none (3 non-blocking notes recorded in README `## Preparation gate`): both amendment greps re-run (28 + 12 hits, all dispositioned), all 19 diff blocks match merged `PRD/sections/`, `measure-rules-gate.mjs` + `measure-candidates.mjs` outputs byte-identical to the committed `.out.txt`, scratch build 23 → 24 topics / 25,808 chars; README `## Preparation gate` PASS; parked `STATUS.owner-action`; docs PR https://github.com/ChrisMiho/TheJudge/pull/266 (body rewritten, marked ready) | 2026-10-07 |
| 15 | gate-review | sonnet | ok | `1 → 21` | build half: claim commit `e9a86c31` on `thejudge-auto/niche-interaction-rule-tests-work` (cut from `origin/main` `c1188dc8`, kickoff worktree removed clean); `graph-gate-review` commit `0abe57ba`: 4 accept / 0 edit / 0 reject, `GATE-QUESTIONS.md` and `PRD/sections/` unchanged, brief reconciliation none needed; `## Gate verdicts` written, `## Open gate` resolved; `STATUS.refined` only marker, board row under refined; worktree porcelain empty; launch checkout porcelain unchanged | 2026-10-07 |
| 16 | gate-qc | sonnet | parked | `1 → 53` | FAIL attempt 7 (build-half re-entry; loops spent → park at owner-action): 1 finding — the brief's fresh-worktree build section claims no gitignored file, but step 7's `npm run eval:worked-solutions` needs `apps/backend/data/models/` (gitignored, absent in a fresh worktree; scratch run exits 1). Re-verified clean: 28 + 12 amendment-grep hits dispositioned, 24 diff blocks match `PRD/sections/` on `c1188dc8`, REQ-220/221 unused, three measure outputs byte-identical, topic build 23 → 24 / 25,808 chars, build-policy 9/9, rules-gate + context-eval + topic tests 50/50; README `## Preparation gate` FAIL; `STATUS.owner-action`; board row under owner-action | 2026-10-07 |
| 17 | define | opus | ok | `1 → 29` | attempt 7 (owner-authorized, bounded to the gate-qc attempt 7 finding): `DESIGN-BRIEF.md` only — Method (lines 169–172), Scope 6 (609–610), Build in a fresh worktree (682–713): new step 7 copies `apps/backend/data/models/` from the main checkout (stop if absent, never download), no-gitignored-file claim names the one exception; scratch export reproduced `npm run eval:worked-solutions` exit 1 without the folder, exit 0 and 287/392 with it; `GATE-QUESTIONS.md`, `PRD/sections/`, code untouched; `STATUS.refined`; board row under refined; launch checkout porcelain unchanged | 2026-10-07 |
| 18 | gate-qc | sonnet | ok | `2 → 23` (includes 1 driver commit call) | PASS attempt 8, findings none (1 non-blocking path nit): tree unchanged since `c1188dc8`; scratch export ran the brief's fresh-worktree sequence — `npm run eval:worked-solutions` exit 1 without `apps/backend/data/models/`, exit 0 and 287/392 after step 7's copy; quality-check suites pass without the folder (43/43 backend gating tests, 1559/1559 frontend); README `## Preparation gate` PASS; `STATUS.refined` | 2026-10-07 |
| 19 | plan | sonnet | ok | `1 → 40` | `GAMEPLAN.md` + 4 slices with criteria files (A topic data and size guard, 8 criteria; B card-wording selector and rules truth, 12; C rules gate counts topic rules, 11; D re-measure and ship, 14; manual criteria A8, D2, D8, D9, D14); Preparation gate PASS verified first; `STATUS.active`; board row under active; launch checkout porcelain unchanged | 2026-10-07 |
| 20 | build | sonnet | ok | `1 → 157` | code PR https://github.com/ChrisMiho/TheJudge/pull/276 (OPEN, `[THEJUDGE-AUTO][READY]`); commits `07825592` (A), `7101386c` (B+C combined — no B-only tree passes the rules gate; noted in README), `0827b5db` (D, `STATUS.ship-ready`); 45/45 criteria `true` read from the four `slice-*.criteria.json` (self-reported — evidence log got no new entries, known evidence-root gap); reported `quality:check` exit 0, `eval:worked-solutions` 287/392, rules-staleness 0/0, evidence trace 614.1a/616.1/616.1e/616.1f available; launch checkout porcelain identical to `.worktrees/.graph-intake/launch-status-before-build-niche-interaction-rule-tests.txt`; `classifyBuildWrites` over `git diff --name-only origin/main..HEAD` (36 paths) → ok, all inside `.worktrees/implement-niche-interaction-rule-tests/` | 2026-10-07 |
| 21 | review | opus | ok | `1 → 46` | APPROVE on PR #276 head `896e9a44`, 0 Critical / 0 Important, 2 Minor (header comment at `apps/backend/src/gameRulesTopicSelection.ts:8-10` names only instead/prevent; REQ-220 Notes says 3,837 characters where the committed excerpt is 3,846 — carried from the accepted proposal); re-ran backend 600/600, frontend 1559/1559, `test:scripts` 766/766, typecheck, lint 0 errors, format:check, `eval:worked-solutions` 287/392, rules-staleness 0/0, evidence trace (4 rules available); old vs new `baseline.json` compared by node (only Bard + Bilbo moved, 11 `inTopic`, 287 System 3 complete); `origin/main` still `c1188dc8`; worktree porcelain empty | 2026-10-07 |
| 22 | close | sonnet | ok | `1 → 25` | `thejudge-cleanup` commit `0fe405cb` on `thejudge-auto/niche-interaction-rule-tests-work`: receipt `PRD/instructions/receipts/niche-interaction-rule-tests-2026-10-07.md` (Graph run, Intake, `- PR:` line, Terminal state COMPLETE), `PRD/work/niche-interaction-rule-tests/` deleted (30 files), board row removed, durable truth confirmed present (nothing promoted); PR https://github.com/ChrisMiho/TheJudge/pull/276 open; worktree porcelain empty; launch checkout porcelain unchanged | 2026-10-07 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "scouring of the internet to see if we can find, some more input on these Use cases" | answered-once | define | — |
| "if a user is not adding a card to the context, then i do not expect the agent to be able to answer the question" | answered-once | define | — |
| "if they are adding all the cards, thats the use case id like to focus on" | answered-once | define | — |
| "the focus of this work should be on refining the rules retrieval process, as well as refining the output format of the initial prompt that goes to the agent" | answered-once | define | — |
| "i want to operate under the assumption that he did add the cards (even if he really didnt)" | answered-once | define | — |
| "we should be doing a full test of all use cases were using to validate output of rules, this is just expanding on it" | answered-once | define | — |
| "if were going to adjust the output format, we again need to test, lets start with making the rules correct, and then we can make the output pretty" | answered-once | define | — |
| "dont worry about usage, keep going" | answered-once | gate-qc | — |
| "/graph-kickoff niche-interaction-rule-tests" (2026-10-07, the go signal the parked gate named: restore, define attempt 6, gate-qc attempt 6) | answered-once | define | — |
| "/graph-implement PRD/work/niche-interaction-rule-tests/" (2026-10-07, after the owner merged docs PR #266: build half) | answered-once | gate-review | — |
| "yes, authorize the define pass and keep going" (2026-10-07, answer to the gate-qc attempt 7 park: one define pass on that finding, then continue the build half) | answered-once | define | — |

## Intake

- `intake/feedback.md` — the owner's note, supplied to the run as a staged file (`.worktrees/.graph-intake/graph-20261006-150550/feedback.md`)
- `intake/screenwriter_temp_1791297379886.jpg` — Discord screenshot of the tester's verdict, supplied to the run as a staged file
- `intake/screenwriter_temp_1791297414126.jpg` — Discord screenshot of the tester's verdict, supplied to the run as a staged file
- `intake/screenwriter_temp_1791298001844.jpg` — Discord screenshot of the tester's verdict, supplied to the run as a staged file
- `intake/screenwriter_temp_1791299243121.jpg` — screenshot with the tester's two verbatim prompts, added by the owner mid-run (2026-10-06) during the first define node
