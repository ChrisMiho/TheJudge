# Quality check — rulesguru-local-suite

Graph run `graph-20261010-205704`, node 4 (`gate-qc`), build-half re-grade,
attempt 2, 2026-10-10, against base `c6dec2ce` (includes code PR #285,
resolution-recipe-eval) after the gate was answered (commit `714b5354`) and
`define` refreshed the brief (commit `02a2cc5b`).

History: attempt 1 FAIL (verbatim removed line, permission wording, name-lookup
numbers); attempt 2 PASS; post-#285 re-grade attempt 1 (`8476a3ef`) FAIL on
bookkeeping findings 1 to 4 (stale amendment-set count, keys, three row
reasons, recipe prose).

**Result: PASS.** The brief's amendment set now matches the live tree at
`c6dec2ce`. The product text, the diffs, the verdicts and the build scope are
sound. Package stays at `refined` (`STATUS.refined`).

## Findings

None blocking. Prior findings 1 to 4 are resolved.

## Checks passed

1. **Findings 1 to 4 resolved.**
   - Count: the saved command returns 269 hits at `c6dec2ce`, matching the
     brief headline (12 amend, 9 build, 248 no change; the table has 12 "Amend
     (...)", 9 "Amend at build" and 248 "No change" rows).
   - Keys: the brief's 269 `file:line` keys equal the hits file in order and
     equal the live grep as a set; no key repeats, so each hit has exactly one
     row. (Live grep order differs from the hits file; the brief says it
     follows the hits file.)
   - New rows: the 16 licence lines match the 16 case files #285 added
     (`git diff --name-status dabad406 c6dec2ce` shows 16 added); row 30
     (REQ-187 rubric-revision criterion, `functional-requirements.md:4505`)
     and row 185 (`rubric.ts:86`, `--regrade-from (REQ-226)`) are correct
     "no change".
   - Rows 5, 63, 89: row 5 (REQ-185 `Description`, line 4402) names #285's
     define-gate approval path; row 63 (line 5892) quotes the live (a)/(b)
     approval exceptions and keeps "no change" because a suite case is never
     approved; row 89 (line 6035) notes #285 added arm R and a suite run refuses
     every arm but A. All three reasons match the live lines.
   - Recipe prose: the overlap section now says the package merged
     (`81739f35`); conclusions unchanged.
2. **Stable-ID diffs.** A script checked every removed and context line in all
   diff blocks of `GATE-QUESTIONS.md` against live `PRD/sections/*.md` lines:
   19 checked, 0 mismatches (56 added lines). `PRD/sections` is identical to
   `origin/main`, and the questions file is unchanged since `714b5354`, so the
   attempt-1 adjacency read still holds: the REQ-185 criterion follows the
   community-sources criterion, the constraint sits after "commits only WotC
   text" and before #285's agent-approval line, the dependency follows REQ-230.
3. **Build scope names.** All present: `executeExperiment`, `manifestEntryFor`,
   `runExperimentCommand`, `loadGoldCases`, `loadCases`, `computeSnapshot`,
   `embedGoldCaseQueries`, `buildCaseRequest`, `preparePromptInput`,
   `describeRetrieval`, `CASES_DIR`, `NEVER_IN_A_GATE`, `fileHashes`, and
   `scripts/lib/{gold-cases.mjs,gold-cases.d.mts,experiment-run.mjs}`. No
   `scripts/lib/rulesguru-*` file exists yet (to be created at build).
4. **Verdict slots.** Nine blocks (REQ-232, REQ-185, REQ-186, REQ-188, REQ-226,
   NFR-018, goals-and-non-goals, B1, B2), each `Verdict: accept`; consistent
   with the brief (B1 yes by hand with the added REQ-185 line; B2
   `output/rulesguru/`). No edit or reject to reconcile.
5. **Nothing outside the package changed.** `git diff --stat origin/main HEAD --
   PRD/sections apps scripts docs .gitignore` is empty; `origin/main` is
   `c6dec2ce` and is the merge base; working tree clean at start.
6. **No suite content.** Counts and field names only; no question, answer or
   card-roll text; no network request. Only permission wording: "used with
   permission, local only".
7. **Other checklist items.** No contradiction with REQ-185 to REQ-188, REQ-222
   to REQ-230 or NFR-018 beyond what the amendments resolve; no screen change;
   no runtime, route, schema, provider or dependency change; no open questions
   left (B1 and B2 answered).

## Next

Hand to `graph-implement` / map-out. The driver records the Preparation gate.
