# Quality check — exact-curated-rule-exclusion

- Verdict: **FAIL**
- Graph run: `graph-20261008-053030`, node 4 `gate-qc`, attempt 1
- Checked: `DESIGN-BRIEF.md` graded with the proposal in `GATE-QUESTIONS.md`
  (REQ-179, REQ-022, REQ-181, REQ-182, REQ-220), against `PRD/sections/` at
  `24500b9c` (`origin/main` is `5a65c91d`; PR #273 still open)
- Mode: orchestrated (`graph is controlling`); no artifact edited, no status moved

The design is sound and the amendment set is complete. Three precision defects in
the proposed durable text must be corrected before PASS (F1–F3). Four minor items
(M1–M4) are non-blocking.

## What passed

1. **Amendment-set completeness (line level).** Re-ran the driver grep: 28 hits,
   identical to the brief. Re-ran case-insensitive `prefix`, `sub-?rule`,
   `parent[- ]rule` over `PRD/sections/`, plus `dedup|exclusion|curated
   (baseline|topic|rule)|System 2 (set|selection|topic)|lettered|never repeats|
   already carr`. Every hit that describes curated exclusion has a disposition row
   in the brief (46 rows). The 19 amend rows each have a matching diff
   (11 REQ-179 + 2 REQ-022 + 1 REQ-181 + 1 REQ-182 + 2 REQ-220 = 17 diff clusters,
   rows 7–8 and 19–20 sharing one sentence). Counts in the brief (46 / 19 / 27 /
   17 / 9 dependent lines) re-add correctly. Row line numbers match the files.
   Hits with no row, all correctly "no change": `functional-requirements.md:402`
   (REQ-022 note, "System 2 deduplication ... unchanged"), `system-map/prompt-
   assembly.md:42` ("excluding the curated baseline rule IDs"),
   `functional-requirements.md:5826`, `:5829` (REQ-222 ratchet wording),
   `decisions.md:73` (retired DEC-032 row). None describes prefix matching.
2. **Removed lines verbatim.** Extracted every `-` line from every diff block
   (27) and matched each, whole-line, against `PRD/sections/`: 27 of 27 found, at
   the line numbers the brief gives. The REQ-179 `Dependencies` anchor
   (`REQ-022 (the System 3 enrichment requirement whose corpus this cleans)`)
   exists.
3. **Block format.** All five blocks open with *What this decides* / *In plain
   terms* / *What happens if you say no*, in that order, then the complete diff,
   then `- Verdict:` and `- Reason:` both blank.
4. **Core factual premise re-verified from committed data.** All 24 topic
   excerpts carry exactly their listed rules (0 missing, 0 extra, checked by
   substring over `gameRulesRuleIndex.json`). 41 sub-rules are blocked on the four
   always-on topics (recomputed; the list matches). 117.3a–d total 884 characters.
5. **Measurement trace.** 293→295, 287→289, 16/18, 14/14, 3 goldens, 58 cases /
   76 picks, 62 of 63, p50 14,306, p95 +79, max +465, mean −30 are all in
   `intake/GRAPH-BRIEF.md` and `probe-keyword-rule-retrieval/FINDINGS-two-fixes.md`
   and `measure-two-fixes.out.txt`. The before-values 287, 16/18 and 14/14 match
   REQ-220's recorded text (`functional-requirements.md:5801`, `:5817`). The
   benchmark figures match the REQ-220 record.
6. **Ladder and scope.** Decisions D1–D10 each cite a real source (quotes checked:
   REQ-178 "one shared retrieval path", REQ-022 verbatim-prose bullet, REQ-220
   exclusion bullet, `technical-design-rules.md` golden rule, `requirement-
   format.md` "Decisions (retired)"). No blocker meets the three-condition test.
   No screen/overlay is introduced, so the `screen-layout.md` row check does not
   apply. Stack ordering and the one-endpoint rule are untouched.

## Findings that must be corrected (FAIL)

**F1. "926 characters" is wrong and untraceable.** The REQ-179 `Notes` bullet
says the always-on `abilities-trigger-basics` topic "prints only those three
parent sentences, 926 characters". The committed excerpt in
`gameRulesByTopic.json` is **803 characters** (801 of rule text; 819 UTF-8 bytes;
828 rendered with the 24-character title and a newline). The figure 926 appears
only in prose in the probe (`GRAPH-BRIEF.md:30`, `FINDINGS-missing-nonkeyword.md:7`)
and in no measurement output; it matches no definition I could compute (also
checked the `searchText` sum, 906). The data is identical at `f98b8feb`. Fix:
replace with 803 characters (or drop the number). The brief itself does not carry
the number, so only `GATE-QUESTIONS.md` (REQ-179 Notes bullet) changes.

**F2. "127 across all 24 topics" is a per-topic sum, not a count of sub-rules, and
is presented as the latter.** Both the REQ-179 plain-language block ("127 across
all topics in an In-Depth game question", under "can never reach the AI") and the
Notes bullet ("127 across all 24 topics in game mode") read as 127 distinct
sub-rules kept out of the prompt. Recomputed from the index (`parentRuleIds`
against the manifest): summed topic by topic = 127, but distinct sub-rules not
themselves listed by any topic = **125**; 19 of the 144 prefix-blocked sub-rules
are listed by a different topic and do reach the prompt. The probe recorded 127
(`FINDINGS-two-fixes.md:63`) with that per-topic definition. Fix: state 125
distinct sub-rules, or say "127 counted once per topic". The brief's build-time
condition ("the 41 / 127 blocked-sub-rule counts") should use the same definition
so the build re-measure compares like with like.

**F3. The two closing-case acceptance bullet does not say which ranking path it
holds on, and only one path is measured.** New REQ-179 bullet: "for the approved
rules test cases `triggers-becomes-tapped-not-entering-tapped` ... and
`triggers-damage-prevented-no-trigger` ..., the deciding rule is a System 3
excerpt in the prompt". The recorded measurement (603.2e and 603.2g ranked first;
"CLOSED" in `measure-two-fixes.out.txt:75–76`) is the rules-gate path: committed
frozen query vectors, hybrid ranking. No lexical rank for either case is recorded.
Both paths are in scope and the lexical path is the mock/offline default, so a
build agent cannot tell which path the criterion binds, and an unmeasured path
could fail it. Fix (either): state the criterion holds under hybrid ranking with
the frozen vectors, as the rules gate measures it, and record the lexical ranks at
build alongside the other re-measured values (as D10 does for first-ship); or
measure the lexical ranks now and record them. The brief's verification line for
`eval:evidence-trace` should also say which provider it runs under.

## Minor, non-blocking (fix on the same pass if cheap)

- **M1.** D10 says no lexical after-value was measured, which is true, but it
  omits that the PRD already records the lexical first-ship before-value as
  **14/18** (`functional-requirements.md:5801`, `:5817`). Cite it so the build has
  a before-value to hold.
- **M2.** The REQ-181, REQ-182 and REQ-220 plain-language blocks use "System 3"
  without defining it inside the block (it is defined only in the REQ-179 block).
  The standard asks each block to stand alone; add a clause, e.g. "System 3 (the
  scored rule search)".
- **M3.** `functional-requirements.md:4228` (REQ-179 acceptance) still reads "any
  golden prompt change is an intentional, reviewed consequence of removing a junk
  excerpt". The new bullet covers goldens changed by admitting a sub-rule, so no
  contradiction, but the old wording will read narrower than the truth. Optional
  one-clause widening.
- **M4.** The sub-rule list "400.7a–m" has 12 rules (there is no 400.7l), so
  "41" is right but the range notation implies 13. Optional: write "400.7a–k, m".

## Next step

Return F1–F3 (and M1–M4 if taken) to refinement through `graph-kickoff`, then
re-run quality-check. No package status was changed by this check; the driver
records the result in the README `## Preparation gate` section.
