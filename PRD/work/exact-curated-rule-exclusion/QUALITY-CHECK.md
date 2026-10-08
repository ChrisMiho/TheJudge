# Quality check — exact-curated-rule-exclusion

- Verdict: **PASS**
- Graph run: `graph-20261008-053030`, node 4 `gate-qc`, attempt 2 (re-check after `define` attempt 2)
- Checked: `DESIGN-BRIEF.md` graded with the proposal in `GATE-QUESTIONS.md`
  (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220), against `PRD/sections/` at
  `8516cedf` (`PRD/sections/` is unchanged since `d9b0090a`; `origin/main` is
  `5a65c91d`; PR #273 still open)
- Mode: orchestrated (`graph is controlling`); no artifact edited, no status moved

The whole package was graded fresh, not only the deltas. All seven attempt-1
findings are resolved. No new must-fix finding. Two non-blocking notes below.

## Attempt-1 findings: resolution

| Finding | Status | Evidence |
| --- | --- | --- |
| F1 — "926 characters" | Resolved | REQ-179 Notes bullet now says 803-character excerpt. Recomputed from `gameRulesByTopic.json`: `abilities-trigger-basics` excerpt is 803 characters. "926" no longer appears in `GATE-QUESTIONS.md`; the brief states it is not used. |
| F2 — "127 across all 24 topics" | Resolved | Plain-language block and Notes bullet say 125 distinct sub-rules no topic lists (41 included), and give 127 only as the topic-by-topic sum with the 120.3f / 614.1a explanation. Recomputed: per-topic sum 127, distinct not listed by any topic 125, listed elsewhere = 120.3f and 614.1a. The brief's build-time condition re-measures "41 / 125" by the same definition. |
| F3 — closing-case ranking path | Resolved | The acceptance bullet and brief (D11, acceptance targets, verification commands) bind the two cases to hybrid ranking from the committed frozen query vector (the rules-gate path); lexical is recorded at build, not gated. The `eval:evidence-trace` line names its ranking path. Traces to REQ-222 Notes (`functional-requirements.md:5844`) and the probe's `measure-two-fixes.out.txt` (603.2e and 603.2g CLOSED under the gate path). |
| M1 — lexical before-value | Resolved | D10 and the target table cite 14/18 (`functional-requirements.md:5801`, `:5817`; both lines read and confirmed). |
| M2 — in-block definitions | Resolved | REQ-181, REQ-182, REQ-220 blocks each define System 3 (and System 2 where used) in the block. |
| M3 — golden-change wording | Resolved | New diff on `functional-requirements.md:4228` widens the acceptance bullet; brief row 47 records it. |
| M4 — "400.7a–m" | Resolved | Now "400.7a–k and 400.7m" in the proposal and brief. Index confirms 400.7 plus 400.7a–k and 400.7m, no 400.7l. |

## Checks requested

1. **Amendment-set completeness (line level).** Re-ran the driver grep: 28 hits,
   identical to the brief's list. Re-ran case-insensitive `prefix`,
   `sub-?rule`, `parent[- ]rule` over `PRD/sections/`, plus a wider sweep
   (`dedup|exclu|already carr|lettered|never repeats|subrule|exact[- ]rule|
   System 2 (set|selection|topic)|curated (baseline|topic|rule)`). Every hit
   that describes curated exclusion has a disposition row. The brief has 47
   rows (counted: 47), 20 amend, 27 no change. Hits with no row, all correctly
   not exclusion: `functional-requirements.md:366`, `:401`, `:402` (REQ-022
   statements that System 2 deduplication is unchanged or topics-per-request),
   `:5845` (REQ-222 ratchet, no prefix wording), `:5854` ("subrules" in the
   mechanic-coverage rule), `system-map/prompt-assembly.md:42` ("excluding the
   curated baseline rule IDs", generic), `system-map.md:494`, `decisions.md:73`
   (retired DEC row), unrelated "prefix" hits (UI counter, image URL, graph
   tooling). None describes prefix exclusion.
2. **Amend rows map to diffs.** 20 amend rows land as 18 replacement diffs (rows
   7–8 and 19–20 share one sentence each); the file has 21 diff blocks, of
   which 3 are addition-only (REQ-179 Constraints, Dependencies, Notes). Slot
   counts re-add: REQ-179 12 + REQ-022 2 + REQ-181 1 + REQ-182 1 + REQ-220 2 = 18.
   Row line numbers match the files.
3. **Removed lines verbatim.** Extracted every `-` line from every diff block
   (28 lines in 18 blocks) and matched each block's removed lines as a
   consecutive run against `PRD/sections/`: 18 of 18 blocks found, 28 of 28
   lines, at the line numbers the brief gives (`functional-requirements.md`
   4221, 4226, 4228, 378, 396, 4280, 4320, 5810, 5816; `system-map/game-rules-
   retrieval.md` 42–45, 75–76, 106–109, 124–125; `system-map.md:88`;
   `integrations-and-data.md:364`; `in-depth/README.md:391`;
   `quick-lookup/README.md` 276–278, 345). Insertion anchors exist: REQ-179
   Dependencies line `REQ-022 (the System 3 enrichment requirement whose
   corpus this cleans)`; REQ-179 has Constraints and Notes sections; 4228 is
   the last Acceptance bullet.
4. **Block format.** All five blocks open with *What this decides* / *In plain
   terms* / *What happens if you say no*, in that order, then the complete
   diff, then `- Verdict:` and `- Reason:`, both blank (5 of 5). The file opens
   with a *Decide:* line. No blocker questions, consistent with the brief.
5. **Numeric targets trace.** Recomputed from committed data (identical to
   `f98b8feb`): 24 topics; 803-character excerpt; 41 always-on barred
   sub-rules (list matches the proposal, 2+8+4+4+4+5+2+12 = 41); 127 per-topic,
   125 distinct unlisted; 117.3a–d = 884 characters; zero topic/listed-rule
   mismatches in either direction over all 24 topics and the whole index.
   293 → 295, 287 → 289, CLOSED for both cases, 16/18, 14/14, 3 goldens, 58
   cases / 76 picks, 62 of 63, p50 14,306, p95 +79, max +465, mean −30 trace
   to `intake/GRAPH-BRIEF.md` and the probe's `measure-two-fixes.out.txt` and
   `FINDINGS-missing.md`. Before-values 287, 16/18, 14/18, 14/14 and the
   benchmark figures match REQ-220's recorded text. Lexical after-values are
   deliberately not set (D10, D11).
6. **Code locations.** The prefix clause exists where the outline says:
   `apps/backend/src/gameRulesRetrieval.ts:705` and `:740` (hybrid and lexical
   branches) and `scripts/lib/evidence-trace.mjs:50–53`
   (`skippedForCuratedTopic`). Other `REQ-179` mentions in code
   (`preparation.test.ts`, `build-game-rules`, `gameRulesBuildPolicy.test.ts`,
   `quick-lookup-no-card.fixture.json`) concern the hygiene half and are not
   affected.
7. **Rest of the checklist.** No contradiction with the System 2 / System 3
   spec as amended; vocabulary current; stack ordering, one-endpoint rule and
   "no rules engine" untouched; no new screen, so no `screen-layout.md` row
   needed; scope implementable; no genuine blocker meets the three-condition
   test; amend-in-place with no new id and no DEC (D7).

## Non-blocking notes (no action required before the gate)

- **N1.** The data test's matching method is left to the build ("carries the
  full text of each rule it lists and of no other rule"). A plain substring
  check of each rule's text in each topic's excerpt over the committed index
  gives zero mismatches in both directions, short rules included, so the test
  is satisfiable on today's data. Map-out may state the method.
- **N2.** The brief's "Evidence cited" list and build outline name code paths
  the intake supplied; this check confirmed the two exclusion sites and the
  trace helper. Map-out still confirms the rest, as the outline says.

## Next step

PASS. The driver records it in the README `## Preparation gate` section; the run
proceeds to the docs PR for the owner's five verdicts.
