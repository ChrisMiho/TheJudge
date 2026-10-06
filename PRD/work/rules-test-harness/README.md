status: refining

# rules-test-harness

Rules test harness, run 1: six-layer-ready case format, offline gate (dropped cards, missed rules), on-demand budget-safe answer grader, owner review flow, about 400 cases (every real mechanic once plus about 120 hard interactions).

- Idea: [IDEA.md](IDEA.md)
- Intake (evidence, never authority): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposed product truth and owner questions: [GATE-QUESTIONS.md](GATE-QUESTIONS.md) — REQ-185–190, NFR-018 amended; REQ-222–225 new; Q-007, Q-008
- Scratch measurement scripts: [measure/](measure/)

Next: `thejudge-quality-check`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rules-test-harness

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/rules-test-harness/DESIGN-BRIEF.md`
- Findings:
  1. (Important) Slice E cannot be built and tested green on its own: its done-when expects the coverage gate to fail on 252 uncovered mechanics before slice F, so `quality:check` is red; the report-only-vs-ship-with-F choice is left to map-out (a hidden assumption — settle it in the brief). Slice C's approved-and-non-stale filter needs the stale comparison that lives in slice E (REQ-225); name the owning slice (slice A already has snapshot hashing).
  2. (Important) Run-1 size does not add up and is partly untraced: hard-area basis ~50 + ~55 + 2 testers = 107, not ~120 (total 377, not ~390); the up-to-13 extra tier-3 fill-ins have no stated source when Q-008 recommends 0; the ~55 two-card ruling pool (6,643 rulings) has no `## Measurements` row; ~50 unused `Example:` lines is a pick, not a measurement (126 less ~10 used leaves ~116); REQ-185's at-least-a-third `does-not-work` acceptance criterion has no measured basis.
  3. (Important) Migration of `cards` for the 15 tier-1 gold cases is unspecified: slice A requires 16/18 and the same two misses unchanged, `buildCaseRequest` attaches only the tier-2 cited card today, and REQ-185's new every-named-card-attached rule would attach Tarmogoyf to `token-created-by-name-uses-oracle-card`, changing its prompt. State the migrated `cards`, or that attachment follows today's behavior until a case is edited.
  4. (Important) Q-007 and Q-008 give a recommendation but no plain-language default: both say only that the run re-parks (undefined jargon) — say in player terms that nothing is built until the owner answers. Q-007's In plain terms is dense, leads with measurements, and leaves Un-set, acorn, Unfinity and eternal formats unglossed; its recommendation excludes the three Attraction mechanics (701.51, 701.52, 702.159) while its own caution says they may be legal and real — reconcile or justify.
  5. (Minor) Disposition table: `PRD/work/STATUS.md:21` (this package's board row) is a hit with no row (220 hits vs 219 rows); the `STATUS.md:52` row says it cites NFR-018 but the hit cites REQ-177 and REQ-185.
  6. (Minor) Unamended wording inside amended entries: REQ-187's Correctness bullet still says the published worked solution (tier 3 is owner-approved, not published); REQ-187's no-axis bullet is kept verbatim; REQ-189's no-prose guard still names `workedSolution`. Amend or confirm intentionally kept.
  7. (Minor) Slice B's done-when has no test for the state-fact check, and the `gameState` → In-Depth request mapping is unspecified (zones and stack confirmed, controllers not). The new system-map entry is applied in slice B with `Status: shipped` yet describes review, coverage and staleness features from slices D and E.
  8. (Minor) Infinity count: brief M4 and Q-007 say two Infinity Stone cards; `measure/text-search.mjs` shows 4 cards naming ∞, 2 with rulings. Reconcile the wording.
