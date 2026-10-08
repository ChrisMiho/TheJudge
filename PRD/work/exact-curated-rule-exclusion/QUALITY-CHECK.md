# Quality check — exact-curated-rule-exclusion

- Verdict: **PASS**
- Graph run: `graph-20261008-061643`, node 4 `gate-qc` (build half, re-grade after gate resolution)
- Prior attempts: run `graph-20261008-053030` — attempt 1 FAIL (3 must-fix: F1 excerpt length, F2 125 vs 127, F3 closing-case ranking path), attempt 2 PASS (all resolved).
- Checked: `DESIGN-BRIEF.md` graded with the finalized proposal in `GATE-QUESTIONS.md` (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220), against `PRD/sections/` and code on this branch (HEAD `01bf2fa9`, cut from `origin/main` `63617818`, which contains PR #276 `5a65c91d` and docs PR #277).
- Mode: orchestrated (`graph is controlling`); no artifact other than this report edited; status marker left at `STATUS.refined`.

Re-graded fresh against current truth, not trusting the earlier report. No must-fix finding. Two minor notes.

## Gate resolution

All five `- Verdict:` slots read `accept` with empty reasons (valid for accept). `GRAPH-RUN.md` `## Gate verdicts` agrees: 5 of 5 accept, no edit or reject, so the brief needs no reconciliation and none is owed. `GATE-QUESTIONS.md` is the finalized proposal.

## Checks

1. **Truth unchanged since the earlier PASS.** `git diff --stat 5a65c91d HEAD -- PRD/sections apps scripts docs` prints nothing; `git diff d9b0090a HEAD -- PRD/sections` prints nothing; `git diff f98b8feb HEAD -- apps/backend/data` prints nothing. So the line numbers and measured numbers in the brief still apply. PR #273 is still OPEN (`gh pr view 273`: state OPEN, not merged), so the build-time re-measure condition stays conditional and the intake numbers stand.
2. **Removed lines verbatim.** Extracted every `-` line from all 21 diff blocks; 18 blocks have removed lines (3 are addition-only). Matched each block's removed lines as a consecutive run against `PRD/sections/**/*.md`: 18 of 18 blocks found, 28 of 28 lines, at the line numbers the brief gives (`functional-requirements.md` 378, 396, 4221, 4226, 4228, 4280, 4320, 5810, 5816; `system-map/game-rules-retrieval.md` 42, 75, 106, 124; `system-map.md:88`; `integrations-and-data.md:364`; `in-depth/README.md:391`; `quick-lookup/README.md` 276, 345).
3. **Amendment set complete at line level.** Driver grep `REQ-179|rule-number prefix|lettered sub-rules|sub-rules are excluded|parent rule ids?` returns 28 hits, as the brief says. Re-ran `by prefix|prefix match|prefix-based|prefix exclusion|parent rule[- ]ids?`, plus `lettered|already carr|never repeats|exclusion set|dedup` over `PRD/sections/`. Every hit describing curated exclusion has a disposition row (47 rows: 20 amend, 27 no change). Hits without a row are not exclusion: `functional-requirements.md:366`, `:401`, `:402` (REQ-022 System 2 dedup unchanged / topics-per-request), `:2207`, `:4504`, `:4839`, `:5883` (unrelated), `user-flows.md:455`, `open-questions.md:37`, `decisions.md:73` (retired DEC-032 row). No line still describes prefix exclusion after the proposal applies.
4. **Amend rows map to diffs.** 20 amend rows land as 18 replacement diffs; slot counts re-add (REQ-179 12 + REQ-022 2 + REQ-181 1 + REQ-182 1 + REQ-220 2 = 18). Insertion anchors exist: REQ-179 has `- Constraints:`, `- Dependencies:` (last bullet `REQ-022 (the System 3 enrichment requirement whose corpus this cleans)`, `functional-requirements.md:4236`) and `- Notes:`; `:4228` is the last Acceptance bullet.
5. **Cited code paths.** The prefix clause is where the outline says: `apps/backend/src/gameRulesRetrieval.ts` hybrid branch (~line 705) and lexical branch (~line 740), both `entry.parentRuleIds.some(...)`; `scripts/lib/evidence-trace.mjs` `skippedForCuratedTopic` (lines 49–53) carries the same parent clause. `apps/backend/src/gameRulesRetrieval.test.ts` lines 230 and 973 assert prefix exclusion on both paths, matching the outline's "flip" step. The three named goldens exist (`commander-spellbook-lookup-attached-intent`, `commander-spellbook-wrong-zone`, `upkeep-trigger`, each `.prompt.golden.txt`); their `.context.golden.json` files do not contain the swapped rule ids (614.10a, 500.10a, 609.7a: zero hits), so only the three prompt goldens change. `upkeep-trigger.fixture.json` description still cites REQ-179, matching the outline's update step. npm scripts `eval:rules-gate:baseline`, `eval:worked-solutions`, `eval:evidence-trace` exist in `package.json`.
6. **Numbers recomputed from committed data.** 24 topics; `abilities-trigger-basics` excerpt 803 characters; 41 always-on barred sub-rules; per-topic sum 127, distinct sub-rules no topic lists 125. A whole-index substring check (each topic excerpt contains a rule's text iff the topic lists it) gives zero mismatches over all 24 topics and the whole rule index, so the new data test is satisfiable on today's data. Before-values 287, 16/18 hybrid, 14/18 lexical, 14/14 match the PRD (`functional-requirements.md:5797–5817`, REQ-222 note at `:5844`). 293 → 295, 289, three goldens, 58 cases / 76 picks, size deltas remain intake-measured, adopted and labelled as such; lexical after-values deliberately not set (D10, D11).
7. **Block format and checklist.** All five blocks carry *What this decides* / *In plain terms* / *What happens if you say no*, then the diff, then Verdict and Reason. No blocker questions, consistent with the brief. No contradiction with the System 2 / System 3 spec as amended; vocabulary current; stack ordering, one-endpoint and no-rules-engine constraints untouched; no new screen, so no `screen-layout.md` row needed; scope implementable; amend-in-place with no new id and no DEC (D7).

## Non-blocking notes (no action required)

- **N1.** The data test's matching method is left to the build. A plain substring check of each rule's text in each topic excerpt gives zero mismatches in both directions today (tested over the whole index, short rules included), so a substring method is workable. Map-out may state it.
- **N2.** The outline's remaining code and test paths (the new data test location, `scripts/build-game-rules.test.mjs` versus a backend test; the evidence-trace test file) come from the intake. This check confirmed the two exclusion sites, the trace helper, the two prefix-asserting tests and the goldens. Map-out confirms the rest, as the outline says.

## Next step

PASS. The driver records it in the README `## Preparation gate` section; the run proceeds to `plan` (map-out).
