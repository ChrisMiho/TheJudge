# Quality check — rulesguru-local-suite

Graph run `graph-20261010-193032`, node 4 (`gate-qc`), attempt 2, 2026-10-10,
after define attempt 2 (commit `62296b1e`).

Attempt 1 failed on findings 1 to 3 (a non-verbatim removed line, a permission
sentence that said too much, and name-lookup numbers with no command).

**Result: PASS.** All three attempt-1 findings are resolved and no new problem
was found. Package stays at `refined`.

## Attempt-1 findings

1. **Resolved.** The system-map `### Answer-quality baseline` `Summary` diff now
   quotes the full live line as the `-` line and the same line plus the new
   sentence as the `+` line; the "shown on its own line" note is gone. A script
   checked every removed and context line in every diff block against the live
   `PRD/sections/*.md` lines: 19 checked, 0 mismatches.
2. **Resolved.** The REQ-232 plain-terms text now reads "A purge command deletes
   the whole folder." The withdrawal clause is gone. Outside the verbatim
   intake, the only permission wording left in the brief, questions file, IDEA
   and evidence is "used with permission, local only".
3. **Resolved.** The brief ("Measured coverage", assumption 5, the verification
   list) names `evidence/name-lookup-counts.mjs`, how it counts, and the saved
   output. Re-ran it: every number matches `evidence/name-lookup-counts.out.txt`
   and the brief (37,854 detail ids; 34,639 `cardMetadata.json` rows; 34,568
   named from it; 34,973 with `cardScanMap.json`; 2,881 unnamed; 341 of 348
   non-token creatures with no rules text named; 19 shared names; 400 corpus
   case files). The only line that differs is the script's own `commit:` stamp
   (HEAD now, `8b0a3a88` when saved). The script reads files only: no network,
   no writes.

## Checks

1. **Stable-ID blocks.** Nine blocks (REQ-232, REQ-185, REQ-186, REQ-188,
   REQ-226, NFR-018, goals-and-non-goals, B1, B2). Nine "What this decides", nine
   "In plain terms", nine "What happens if you say no", nine blank `- Verdict:`
   and nine blank `- Reason:` slots. `REQ-232` appears nowhere in
   `PRD/sections`; `REQ-231` is still the last entry.
2. **Line-level grep.** The brief's exact command returns 251 hits. The brief's
   251 `file:line` keys equal the live list exactly (diffed). Dispositions: 12
   amend in `PRD/sections`, 9 amend at build, 230 no change. The list of edited
   lines the grep misses is consistent with the blocks.
3. **Blockers.** B1 recommends yes by hand only; B2 recommends
   `output/rulesguru/`. Both say what no does and stay blank.
4. **No RulesGuru content.** Counts, field names and invented description only;
   no question, answer or card-roll text. No network request made.
5. **Nothing outside the package changed.** `git diff --stat dabad406 HEAD --
   PRD/sections apps scripts docs .gitignore` is empty; the working tree was
   clean at the start.
6. **Edits introduced no new problem.** The attempt-2 diff touches only the
   brief, questions file, README note, GRAPH-RUN, status marker and the two
   evidence files. The REQ-185 overlap with docs PR #283 text is unchanged.

## Other checklist items

- No contradiction with REQ-185 to REQ-188, REQ-222 to REQ-230 or NFR-018 beyond
  what the amendments resolve.
- No user-visible screen or overlay: the `screen-layout.md` row check does not
  apply.
- `technical-design-rules.md`: no runtime, route, schema or provider change; no
  new dependency.
- Open questions are limited to B1 and B2, both genuine owner choices.

## Non-blocking note

`README.md` line 18 (the driver's preparation-gate text) quotes attempt-1
finding 2, including the withdrawal wording. It is a record of a finding, not a
claim in the package's design text; the driver owns that section.
