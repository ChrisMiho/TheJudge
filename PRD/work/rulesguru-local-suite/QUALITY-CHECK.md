# Quality check — rulesguru-local-suite

Graph run `graph-20261010-205704`, node 4 (`gate-qc`), build-half re-grade,
2026-10-10, against base `c6dec2ce` (includes code PR #285,
resolution-recipe-eval) after the gate was answered (commit `714b5354`).

History: attempt 1 FAIL (verbatim removed line, permission wording, name-lookup
numbers); attempt 2 PASS; this re-grade (post-#285) FAIL on bookkeeping only.

**Result: FAIL.** The product text and the build scope are sound. One check
fails: the brief's amendment-set count and line keys are stale at this base.
No `PRD/sections` wording needs to change. Status set to `refining`.

## Findings

1. **FAIL — the line-level grep no longer yields the stated count.** The brief's
   command returns 269 hits at `c6dec2ce`, not 251 (251 was right at
   `dabad406`). Every `file:line` key for `functional-requirements.md` and many
   code files has also shifted, because #285 added lines above them. The
   brief's headline ("251 hits: 12 amended, 9 amended at build, 230 no
   change") and its 251 rows must be refreshed against this base.
2. **The 18 new hits need rows, and none needs an amendment.** All 18 are "no
   change":
   - 16 `license` lines ("no outside text is copied") in the 16 new
     committed diagnostic case files from #285 (corpus data, tier 3 drafts).
   - REQ-187: the new rubric-revision criterion ("it moves again ... adopted
     by the `resolution-recipe-eval` package ... `--regrade-from` (REQ-226)").
   - `apps/backend/src/eval/answer-quality/rubric.ts:86` comment (REQ-226).
3. **Three existing hits changed text, so their rows are stale.**
   - REQ-185 `Description` (row 12): the row says the parked recipe package
     "rewrites this line"; #285 has now rewritten it. Disposition stays "no
     change by this package".
   - REQ-185 constraint "no case is approved by an agent" (the REQ-224 and
     REQ-185 approval lines): #285 added the per-case define-gate path. The new
     REQ-185 criterion says a suite case is "never approved by any path", which
     still covers it. Disposition stays "no change", but the row's reason
     should name the gate-slot path.
   - REQ-230 `Description` (arm list): #285 added arm R. A suite run refuses
     every arm but A, so no change.
4. **Stale prose about the recipe package (non-blocking).** The brief's
   "Overlap with resolution-recipe-eval (docs PR #283)", assumption text and
   the REQ-187 "third-party collision" note, and the questions file's overlap
   paragraph, still describe the recipe change as parked. It has merged. The
   conclusions hold (no REQ-185 line this package inserts conflicts; REQ-187
   still needs no amendment, now because a suite case is never approved, not
   because of a collision), but the wording should say it landed first.

## Checks passed

1. **Stable-ID diffs.** A script checked every removed (`-`) and context (` `)
   line in all diff blocks of `GATE-QUESTIONS.md` against live
   `PRD/sections/*.md` lines: 19 checked, 0 mismatches. Each added line sits
   correctly beside the #285 wording: the REQ-185 criterion follows the
   community-sources criterion; the REQ-185 constraint follows "commits only
   WotC text" and precedes #285's "no case is approved by an agent" line; the
   REQ-185 dependency follows REQ-230; REQ-226 and NFR-018 lines unchanged by
   #285; REQ-232 appears nowhere in `PRD/sections`; `REQ-231` is still the
   last entry.
2. **Build scope names.** Still present: `executeExperiment`, `manifestEntryFor`,
   `runExperimentCommand`, `loadGoldCases`, `loadCases`, `computeSnapshot`,
   `embedGoldCaseQueries`, `buildCaseRequest`, `preparePromptInput`,
   `describeRetrieval`, `CASES_DIR`, `NEVER_IN_A_GATE`, the `--arm` flag, and
   `scripts/lib/{gold-cases.mjs,gold-cases.d.mts,experiment-run.mjs}`. No
   `scripts/lib/rulesguru-*` file exists yet. One detail to keep straight at
   build: the case-file hashing that joins `CASES_DIR` is the `fileHashes`
   dependency defined in `scripts/eval-answer-quality.mjs` (about line 1066),
   injected into `experiment-run.mjs`, so the folder parameter is added there.
   #285's new game-state fidelity check in `experiment-run.mjs` skips cases
   with null `gameState`, which every suite case has.
3. **Verdict slots.** Nine blocks (REQ-232, REQ-185, REQ-186, REQ-188, REQ-226,
   NFR-018, goals-and-non-goals, B1, B2), each answered `accept` with a reason;
   consistent with the brief (B1 yes by hand with the added REQ-185 line; B2
   `output/rulesguru/`, the brief's `SUITE_DIR`). The brief carries no
   edit or reject to reconcile.
4. **Nothing outside the package changed.** `git diff --stat origin/main HEAD --
   PRD/sections apps scripts docs .gitignore` is empty; the working tree was
   clean at the start.
5. **No suite content.** Counts and field names only; no question, answer or
   card-roll text; no network request made. The only permission wording is
   "used with permission, local only".
6. **Other checklist items.** No contradiction with REQ-185 to REQ-188, REQ-222
   to REQ-230 or NFR-018 beyond what the amendments resolve; no screen change;
   no runtime, route, schema, provider or dependency change; open questions
   limited to B1 and B2, now answered.

## What refinement must do

Refresh the amendment set in `DESIGN-BRIEF.md` against `c6dec2ce`: new count
(269), 18 added "no change" rows, updated line keys, updated reasons for the
three changed rows, and the recipe-package prose. No change to the diffs, the
verdicts or the build scope is needed. The owner's accepted verdicts stay as
they are.
