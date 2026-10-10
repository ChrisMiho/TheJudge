# Quality check — rulesguru-local-suite

Graph run `graph-20261010-193032`, node 4 (`gate-qc`), attempt 1, 2026-10-10.

**Result: FAIL.** Two small fixes in `GATE-QUESTIONS.md` and one in the brief.
Everything else passes. Status set to `refining`.

## Findings (return to refinement)

1. **A removed line is not word for word (GATE-QUESTIONS.md line 129).** The
   system-map `### Answer-quality baseline` `Summary` diff uses
   `On-demand, confirmation-gated run that asks the selected approved cases of
   the rules test corpus — … (unchanged) … (REQ-230).` The `…` stands in for the
   live text, so the removed line does not match
   `PRD/sections/system-map.md:501`. Every other removed and context line (18 of
   19 checked, by script against the live section files) matches exactly. Fix:
   quote the full live line 501 as the `-` line, and the same line plus the new
   sentence as the `+` line, and drop the "shown on its own line for
   readability" note (lines 137-138).
2. **A sentence says more about the permission than the settled decision
   allows (GATE-QUESTIONS.md line 67).** "A purge command deletes the whole
   folder if the permission is ever withdrawn." Decision 2 is to say nothing
   about the permission beyond "used with permission, local only". Fix: reword
   the purge sentence without the withdrawal clause, for example "A purge
   command deletes the whole folder."
3. **Name-lookup numbers name files but no command (DESIGN-BRIEF.md,
   "Measured coverage" and assumption 5; GATE-QUESTIONS.md REQ-232 Notes).**
   I re-measured them and they hold: 37,854 detail ids; `cardMetadata.json`
   34,639 names; with `cardScanMap.json` 34,973 named; 341 of 348 non-token
   creatures with no rules text named; 19 duplicate names among non-token cards.
   But no command or script is named, so a later reader cannot repeat them. Fix:
   add one line saying how they were counted (the join of the three files by
   oracle id, counting detail ids with a name, and non-token creature ids with
   empty `oracleText`), or name a scratch script kept in the work folder.

## Checks that pass

1. **Stable-ID blocks.** All seven blocks (REQ-232, REQ-185, REQ-186, REQ-188,
   REQ-226, NFR-018, goals-and-non-goals) carry the three-line opening ("What
   this decides", "In plain terms", "What happens if you say no") and a blank
   `- Verdict:` / `- Reason:` slot. Removed and context lines match live
   `PRD/sections/` text, except finding 1. `REQ-232` appears nowhere in
   `PRD/sections` or in any `thejudge-auto/*` remote branch outside this
   package; `REQ-231` is the last entry, so "after `### REQ-231`" is right. Same
   anchor lines for the REQ-185 insertions exist live.
2. **Line-level grep.** Re-ran the brief's exact command: 251 hits. The brief's
   251 `file:line` keys equal the live hit list exactly (diffed, no extras, no
   gaps). Dispositions: 12 PRD amends, 9 amend-at-build, 230 no change, which
   sums to 251 and matches the brief's totals. The brief's list of edited lines
   the grep misses (REQ-186 description and criterion, REQ-226 first criterion,
   dependency insertion points, system-map line 502) is consistent with the
   blocks; line 502 is the `Lives in` line.
3. **Blockers.** B1 and B2 each state a recommendation (B1 yes by hand only; B2
   `output/rulesguru/`), say what no does, and leave the slot blank.
4. **No RulesGuru content.** The package files hold counts, field names and
   invented description only: no question, answer or card-roll text. No network
   request was made.
5. **Five intake decisions kept.** Local only, gitignored folder ignored in the
   first slice before any import; permission wording otherwise (except finding
   2); not ground truth and reported apart from REQ-187's headline; never a
   build gate (`NEVER_IN_A_GATE` extension, no-test-reads-the-folder guard);
   synthetic data, injected fetch and clock.
6. **REQ-185 overlap with docs PR #283.** Read
   `origin/thejudge-auto/resolution-recipe-eval:.../GATE-QUESTIONS.md`. Its
   REQ-185 block rewrites the `Description` last sentence and the "no case is
   approved by an agent" constraint. This package's three REQ-185 insertions
   (criterion after the community-sources criterion, constraint after the "commits
   only WotC text" constraint, dependency after the REQ-230 line) touch neither.
   Its other blocks (REQ-230, REQ-228, REQ-187, REQ-224) touch no line this
   package amends. The brief's "Overlap" section gives the by-intent build
   procedure if the recipe lands first, including the anchors-moved fallback and
   the B1 gate-slot note.
7. **Numbers.** Grep count 251 reproduced (check 2). Name-lookup numbers
   reproduced (finding 3). The 400 corpus case files is correct. Probe figures
   (918 questions, 830, 686, 476) trace to `intake/FINDINGS-fit.md` and
   `intake/GRAPH-BRIEF.md`.

## Other checklist items

- No contradiction found with REQ-185 to REQ-188, REQ-222 to REQ-230 or
  NFR-018 beyond what the amendments resolve.
- No user-visible screen or overlay: the `screen-layout.md` row check does not
  apply.
- `technical-design-rules.md`: no runtime, route, schema or provider change; no
  new dependency.
- Open questions are limited to B1 and B2, both genuine owner choices.
