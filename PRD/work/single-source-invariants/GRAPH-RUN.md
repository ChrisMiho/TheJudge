# Graph run — single-source-invariants

- Run ID: `graph-20260904-201403` (run one, spec-forming half)
- Build-half run ID: `graph-20260904-220341` (run two, `/graph-implement`; lock, run-state, evidence, and release records for nodes 5–9 key on this id)
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — graph tier armed (nohup true)`
- Build-half canary: `denied — graph tier armed (nohup true), 2026-09-04 run two`; run-state degraded at take-lock (`.graph-run-state.json` absent until first node dispatch), so cap enforcement arms once run-state is written per node
- Autonomous base: `origin/thejudge-auto/single-source-invariants`
- Staging: none — resume of an existing `STATUS.ideation` package, no new intake staged
- Current node: `build` (plan emitted 5 slices / 43 criteria; applying the finalized proposal to `PRD/sections/` + root/PRD README + guardrail in a worktree)
- Next action: `/graph-implement PRD/work/single-source-invariants/` — `build → review → land → close`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `n/a — driver-run resume` | branch `thejudge-auto/single-source-invariants` created + pushed; base resolved `main`; clean tree, no stash; lock `graph-20260904-201403` taken; universal canary denied (`rm -rf`), graph canary denied (`nohup true`) | 2026-09-04 |
| 3 | define | opus | ok | `0 → 36` | `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` (5 blocks: INV-ENDPOINT, INV-MOCK-FIRST, INV-RULES-ENGINE, INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND) written; `STATUS.refined`; no `PRD/sections/` or root README edits (`git status --porcelain` clean); no new IDs minted | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 40` | FAIL, loop 1 of 3. Two grep-derived amendment-set errors (the exact defect this feature fixes): (1) INV-ENDPOINT miscites `functional-requirements.md` REQ-175 lines 4020/4031 as `integrations-and-data.md` (only 444 lines) — REQ-175 is an unlisted live home of the one-endpoint rule; (2) INV-RULES-ENGINE omits `user-flows.md:268`. Both verified against live files. `STATUS.refining` | 2026-09-04 |
| 3 | define | opus | ok | `0 → 41` | attempt 2 (loop-back fix). Re-ran endpoint + rules-engine `grep -rniE` families; corrected both named errors and surfaced 2 more of the same class (`:2195` REQ-094 mislabelled REQ-072; missing REQ-072 home `:1677` citing retired DEC-010) plus grep-recovered rules-engine homes. `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` reconciled; `STATUS.refined`; no `PRD/sections/` edits | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 78` | FAIL, loop 2 of 3. Loop-1 findings confirmed fixed; INV-ENDPOINT/INV-DECISION-LOG/GUARD clean. 4 new missing homes, all verified by direct read: 3 distinct mock-first restatements (`PRD/README.md:140`, `in-depth/README.md:370`, `quick-lookup/README.md:279` — the mock-first family was never re-grepped in attempt 2) + 1 rules-engine identity line (`quick-lookup/README.md:34`). Non-blocking: `overview.md:39` section label wrong. Count 78 is within the 60-cap + 30 park-grace band; node made no denied dispatch and returned a valid verdict — grep-heavy gate, enforcer behaved correctly. `STATUS.refining` | 2026-09-04 |
| 3 | define | opus | ok | `0 → 42` | attempt 3 (loop-back 2, comprehensive). ONE reconciliation across all four families vs a fresh full-corpus `grep -rniE`. Added the 4 re-check-2 misses; fresh grep caught 1 more endpoint straggler (`PRD/README.md:145`) and folded it in; cosmetic `overview.md:39` label fixed (confirmed under Current Product Status). `STATUS.refined`; no `PRD/sections/` edits | 2026-09-04 |
| 4 | gate-qc | sonnet | failed | `0 → 27` | FAIL, loop 3 of 3. All loop-3 homes verified clean by independent full-corpus re-grep. 2 remaining homes, both verified: (1) INV-ENDPOINT `in-depth/README.md:278` asserts the endpoint rule citing DEC-010 — structurally identical to the already-repointed `quick-lookup/README.md:158` but misclassified as out-of-scope traceability; (2) INV-DECISION-LOG root `README.md:17` (decisions.md-router pointer), a 2nd contradiction beside the flagged `:163`. `STATUS.refining` | 2026-09-04 |
| 3 | define | opus | ok | `0 → 35` | attempt 4 (FINAL loop-back). Closed both straggler classes, not just the two named lines. CLASS A: adopted a written scope test — a line stating the one-endpoint rule is in-scope even when it cites DEC-010; only Backed-by/traceability and per-feature closed-door clauses stay out. Applied it to a fresh `grep -rniE 'DEC-010'` hit-by-hit — folded `in-depth/README.md:278` in as an INV-ENDPOINT pointer (+ NFR-004 echoed-in list); every DEC-010 hit now explicitly classified in `GATE-QUESTIONS.md`. CLASS B: folded root `README.md:17` ("start with the decisions.md router") into INV-DECISION-LOG beside `:163`; block now rewrites both lines. Re-reconciled all four families vs fresh grep — mock-first + rules-engine sets matched, no third class. `DESIGN-BRIEF.md` scope test + Loop-4 reconciliation note added; `STATUS.refined`; no `PRD/sections/` edits; no new IDs | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `0 → 26` | PASS (re-check 4, final). Independent full-corpus re-grep of all four families + dedicated DEC-010 sweep (9 live hits, all matching the brief's classification: 3 in-scope rule-statements, 6 out-of-scope traceability/closed-door). Every live rule-stating line is a canonical home or a listed pointer; no unlisted home; no new IDs; docs-only, no genuine blocker. `STATUS.refined` (no transition on PASS) | 2026-09-04 |

| — | gate-review | sonnet | ok | `1 → 17` | run two, build half. Applied 5 accept / 0 edit / 0 reject inside `GATE-QUESTIONS.md` (no diff change — all accept); wrote `## Gate verdicts`; resolved `## Open gate`; restored `STATUS.owner-action → STATUS.refined`, README `status:`, board row. No `PRD/sections/` edits | 2026-09-04 |
| 4 | gate-qc | sonnet | ok | `1 → 26` | run two build-half re-check (PASS). Independent full-corpus `grep -rniE` of all four families + `DEC-010` sweep (9 live hits: 3 in-scope CLASS-A rule-statements, 6 out-of-scope). Every amendment-set home in `GATE-QUESTIONS.md` resolves to its cited live file:line; no unlisted rule-stating home; guardrail anchors (`writing-rules.md ## Editing Rules`, `requirement-format.md ## Formatting Rules`) present. `STATUS.refined` holds; no `PRD/sections/` edits | 2026-09-04 |
| 5 | plan | sonnet | ok | `1 → 33` | 5 slices A–E (one per accepted gate block), 43 acceptance criteria total (A 13, B 9, C 15, D 3, E 3); all evidence path-based or dated manual re-grep (docs-only). `GAMEPLAN.md` + `slice-{a..e}-*.md` + `slice-{a..e}.criteria.json` written; `STATUS.active`; scope-clean (`git status`: only work-folder + board). Sequencing: A→C share `functional-requirements.md` REQ-094 line (A writes, C verifies) — sequential, no fan-out | 2026-09-04 |

Entry point: resume of a `STATUS.ideation` package with no prior ledger. Per the
entry-point table, `STATUS.ideation` enters at `define`; `shape` (node 2) is
skipped because the package is already named (README + IDEA exist). Preflight
was run first (README carried no `## Autonomous metadata`) to record the base.

Build-half resume (run two, `graph-20260904-220341`): docs PR #187 (base→main)
was merged as the answer-then-merge build signal, so `origin/main` already carries
the finalized spec (`origin/main` is 1 ahead of the now-merged base branch, which
is 0 ahead — base is fully contained in main). The code deliverable therefore
grows into a PR **against `main`**, not the merged base; the reference's
`-work → base` shape assumes an still-open base→main PR, which #187's merge closed.

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `INV-ENDPOINT` | accept | — |
| `INV-MOCK-FIRST` | accept | — |
| `INV-RULES-ENGINE` | accept | — |
| `INV-DECISION-LOG` | accept | — |
| `GUARD-GREP-BEFORE-AMEND` | accept | — |

Blocker questions: none recorded; none raised.

## Open gate

- **Resolved 2026-09-04 — 5 accept, 0 edit, 0 reject.** Owner answered all five
  decision blocks in `PRD/work/single-source-invariants/GATE-QUESTIONS.md`
  (INV-ENDPOINT, INV-MOCK-FIRST, INV-RULES-ENGINE, INV-DECISION-LOG,
  GUARD-GREP-BEFORE-AMEND) with verdict `accept`; every proposed diff stands as
  refinement wrote it. Docs-only base→main PR merged —
  https://github.com/ChrisMiho/TheJudge/pull/187. `STATUS.refined` restored.
- Resume: `/graph-implement PRD/work/single-source-invariants/` — the run
  re-enters at `gate-qc`, then `plan → build → review → land → close` applies
  the finalized proposal to `PRD/sections/` together with the code.

## Dispatch prompts

### define

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions or wait for approval — resolve open product questions by
writing them as accept/edit/reject slots in `GATE-QUESTIONS.md` for the owner to
answer later, per the graph workflow contract.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `thejudge-refinement` skill on the package at
`PRD/work/single-source-invariants/`. Shape the idea in `IDEA.md` into
`DESIGN-BRIEF.md`, and record the `PRD/sections/` product-truth changes it needs
as the exact proposed diff in `PRD/work/single-source-invariants/GATE-QUESTIONS.md`
— one `## <STABLE-ID>` block per stable ID, each opening with the gate-question
plain-language block (What this decides / In plain terms / What happens if you
say no) required by `PRD/instructions/plain-language-standard.md`, then that ID's
complete proposed diff, then `- Verdict:` and `- Reason:` slots. Do NOT edit
`PRD/sections/` — refinement only proposes; implementation applies later.

The idea: de-duplicate the cross-cutting product-truth invariants (rules
asserted across 3+ files, e.g. the one-main-product-facing-endpoint rule, the
mock-first-local-default rule, the no-deterministic-rules-engine rule) into one
canonical home each, with every other mention linking to it; and a grep-before-amend
guardrail so refinement and gate-authoring enumerate a rule's amendment set by
grep, never from memory. Scope is bounded to invariants asserted in 3+ places;
single-feature requirements are out of scope. Fold in the root-README-vs-retired-
decision-log contradiction noted in `IDEA.md`.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the outcome (STATUS marker, whether
`GATE-QUESTIONS.md` was written) back to the driver.

### gate-qc

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions — produce the PASS/FAIL report and set the STATUS marker
per the skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `thejudge-quality-check` skill on the package at
`PRD/work/single-source-invariants/`. Validate `DESIGN-BRIEF.md` for PRD
alignment and agent-readiness and produce a PASS/FAIL report. This package
proposes `PRD/sections/` product-truth changes recorded as proposed diffs in
`GATE-QUESTIONS.md` (five blocks: INV-ENDPOINT, INV-MOCK-FIRST,
INV-RULES-ENGINE, INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND) — check the brief
against them, not against live `PRD/sections/` edits (there are none; refinement
only proposes). Do not write a GAMEPLAN or slice docs. On FAIL set
`STATUS.refining` and list the findings.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report PASS or FAIL and the complete findings
list back to the driver.

### define (attempt 2)

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions or wait for approval — resolve open product questions as
accept/edit/reject slots in `GATE-QUESTIONS.md`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Re-invoke the `thejudge-refinement` skill on the package at
`PRD/work/single-source-invariants/` to correct two verified amendment-set
errors found at quality-check — both the same grep-from-memory defect this
feature exists to eliminate, so fix them by re-running the grep, not by patching
the two lines in isolation:

1. INV-ENDPOINT miscites the file for two real homes. `DESIGN-BRIEF.md` and the
   INV-ENDPOINT proposed diff list `integrations-and-data.md:4020,4031` — but
   that file is only 444 lines. Those lines are REQ-175 in
   `functional-requirements.md` (Description line 4020, Constraints line 4031),
   which restates the second-product-facing-endpoint rule and its amendment set.
   That is a live, unlisted home of the one-endpoint rule. Correct the file
   attribution and add REQ-175 to the INV-ENDPOINT amendment set and pointer-edit
   list.
2. INV-RULES-ENGINE omits `user-flows.md:268` — the Quick-Lookup note asserting
   it is not a full Comprehensive Rules browser and not official judge authority
   (DEC-002 / DEC-013), five lines from `user-flows.md:302` which is already in
   the set. Add it to the enumerated set and the pointer-edit list.

Re-run the grep the brief itself specifies (`grep -rniE` for the endpoint and
rules-engine pattern families) against current `PRD/` + root `README.md` and
reconcile the full amendment sets against it, so no other home is missing.
Update `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` accordingly. Do NOT edit
`PRD/sections/`. Set `STATUS.refined` when done.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the outcome back to the driver.

### gate-qc (attempt 2)

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions — produce the PASS/FAIL report and set the STATUS marker.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Re-invoke the `thejudge-quality-check` skill on the package at
`PRD/work/single-source-invariants/`. This is re-check 2 after a FAIL whose two
findings (INV-ENDPOINT file mis-attribution of the REQ-175 lines; missing
`user-flows.md:268` in INV-RULES-ENGINE) were corrected by a re-grep pass that
also folded in additional homes. Re-validate `DESIGN-BRIEF.md` for PRD alignment
and agent-readiness, checking the corrected amendment sets in `GATE-QUESTIONS.md`
against the live `PRD/` files — confirm every enumerated home resolves to the
file and line cited, and that no unlisted live home of the endpoint or
rules-engine rule families remains. Do not write a GAMEPLAN or slice docs. On
FAIL set `STATUS.refining` and list the findings.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report PASS or FAIL and the complete findings
list back to the driver.

### define (attempt 3)

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions or wait for approval — resolve open product questions as
accept/edit/reject slots in `GATE-QUESTIONS.md`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Re-invoke the `thejudge-refinement` skill on the package at
`PRD/work/single-source-invariants/`. This is loop 3 (final loop before the run
would park). The previous two loops fixed only the families that had failed, so a
different family's stragglers surfaced each re-check. Fix that pattern now:
do ONE comprehensive reconciliation across ALL amendment sets, not just the ones
flagged below.

Run a fresh `grep -rniE` for EVERY invariant family — endpoint, mock-first,
rules-engine, and decision-log — across the whole live corpus (`PRD/` and root
`README.md`), and reconcile each amendment set in `GATE-QUESTIONS.md` and
`DESIGN-BRIEF.md` against its grep output line by line, so every live home is
either a canonical home or a listed pointer and none is missing. The verified
misses from re-check 2, all confirmed by direct file read, are:

1. INV-MOCK-FIRST is missing three distinct restatements of the mock-default
   rule: `PRD/README.md:140` (distinct from the listed `:137`),
   `PRD/sections/in-depth/README.md:370` (distinct from the listed `:46`), and
   `PRD/sections/quick-lookup/README.md:279` (distinct from the listed `:29`).
   The mock-first family was not re-grepped in loop 2 — re-grep it fully.
2. INV-RULES-ENGINE is missing `PRD/sections/quick-lookup/README.md:34` (the
   line stating it is not a full rules browser or a judge authority), the same
   identity assertion already captured for `in-depth/README.md:49-50` and
   `life-tracker/README.md:44`.
3. Cosmetic: `overview.md:39` is labelled Key Constraints in the brief and the
   gate file but actually sits under Current Product Status — correct the section
   label (line and content are right).

Update `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`. Do NOT edit `PRD/sections/`.
Set `STATUS.refined` when done.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the outcome back to the driver.

### gate-qc (attempt 3)

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions — produce the PASS/FAIL report and set the STATUS marker.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Re-invoke the `thejudge-quality-check` skill on the package at
`PRD/work/single-source-invariants/`. This is re-check 3 after a comprehensive
all-families re-grep that folded in the four re-check-2 misses (three mock-first
homes + one rules-engine home), one further endpoint straggler
(`PRD/README.md:145`), and the `overview.md:39` label fix. Re-validate
`DESIGN-BRIEF.md` for PRD alignment and agent-readiness. Confirm every enumerated
home in each amendment set (`GATE-QUESTIONS.md`) resolves to the live file:line
cited, and run your own independent full-corpus grep of all four families
(endpoint, mock-first, rules-engine, decision-log) to confirm no live home
remains unlisted. Do not write a GAMEPLAN or slice docs. On FAIL set
`STATUS.refining` and list the findings.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report PASS or FAIL and the complete findings
list back to the driver.

### define (attempt 4)

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions or wait for approval — resolve open product questions as
accept/edit/reject slots in `GATE-QUESTIONS.md`.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Re-invoke the `thejudge-refinement` skill on the package at
`PRD/work/single-source-invariants/`. This is the FINAL loop-back — if the next
quality-check still finds an unlisted live home, the run parks for the owner. So
close the two recurring straggler classes completely, not just the two named
lines:

CLASS A — endpoint lines that cite retired DEC-010. Adopt this classification
rule: a line that STATES the one-endpoint rule is in-scope and must be repointed
to the canonical home, even when it cites DEC-010 — do NOT file it as an
out-of-scope traceability citation. `grep -rniE 'DEC-010' PRD/ README.md` and, for
every hit that asserts the endpoint rule (not merely a per-feature promise not to
violate it), add it to the INV-ENDPOINT amendment set and pointer-edit list. The
known miss is `PRD/sections/in-depth/README.md:278` (`POST /api/ask-ai` endpoint
(DEC-010)), structurally identical to the already-repointed
`quick-lookup/README.md:158`. Reclassify it and any sibling from traceability to
in-scope.

CLASS B — decision-log router pointers. `grep -rniE 'decisions\.md|decision log|
start with the .*router|read-first' PRD/ README.md` and list every line that
tells an agent to read or start with the decision log as a contradiction of the
retired-log rule. The known miss is root `README.md:17` (Product source of truth:
`PRD/sections/` (start with the `decisions.md` router)), a second contradiction
beside the already-flagged `README.md:163`. Fold it into INV-DECISION-LOG.

Then re-reconcile ALL four families against fresh grep output one more time so no
third class is lurking. Update `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md`; adjust
the brief's scope test so the CLASS A reclassification is written down as the
rule, not just applied once. Do NOT edit `PRD/sections/`. Set `STATUS.refined`
when done.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the outcome back to the driver.

### gate-qc (attempt 4)

graph is controlling. This is an autonomous graph run (run ID
`graph-20260904-201403`); no human is available, so do not stop to ask
clarifying questions — produce the PASS/FAIL report and set the STATUS marker.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Re-invoke the `thejudge-quality-check` skill on the package at
`PRD/work/single-source-invariants/`. This is re-check 4, the final check; the
last loop-back closed the two recurring straggler classes — endpoint lines citing
retired DEC-010 (now classified in-scope when they state the rule) and
decision-log read-first pointers — and added a written scope test to the brief.
Re-validate `DESIGN-BRIEF.md` for PRD alignment and agent-readiness. Run your own
independent full-corpus grep of all four families (endpoint, mock-first,
rules-engine, decision-log), plus `grep -rniE 'DEC-010' PRD/ README.md`, and
confirm every live line that STATES a rule is either the canonical home or a
listed pointer, applying the brief's written scope test to any DEC-010 citation.
Do not write a GAMEPLAN or slice docs. On FAIL set `STATUS.refining` and list the
findings.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report PASS or FAIL and the complete findings
list back to the driver.

### gate-review

graph is controlling. This is an autonomous graph run (build-half run ID
`graph-20260904-220341`); no human is available at this step, so do not stop to
ask clarifying questions — read the verdicts the owner already recorded in
`GATE-QUESTIONS.md` and apply them exactly as written.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `graph-gate-review` skill on the package at
`PRD/work/single-source-invariants/`. The owner has answered every
`## <STABLE-ID>` block in `GATE-QUESTIONS.md` and merged the docs PR to `main`.
Read each block's `Verdict:` slot, apply it inside that ID's proposed diff in
`GATE-QUESTIONS.md` only (never `PRD/sections/`), write the `## Gate verdicts`
table into `GRAPH-RUN.md`, resolve the `## Open gate`, restore `STATUS.refined`
and the board row, and hand back the resume command. All five verdicts are
`accept` and there are no blocker questions, so an `accept` leaves each proposed
diff as refinement wrote it — record the verdicts and resolve the gate.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the verdict counts and the restored status
back to the driver.

### gate-qc (build-half re-check)

graph is controlling. This is an autonomous graph run (build-half run ID
`graph-20260904-220341`); no human is available, so do not stop to ask clarifying
questions — produce the PASS/FAIL report and set the STATUS marker per the skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `thejudge-quality-check` skill on the package at
`PRD/work/single-source-invariants/`. This is the build-half re-entry required
after gate-review, so an owner edit at the gate is re-graded before planning. The
owner accepted all five decision blocks unchanged (INV-ENDPOINT, INV-MOCK-FIRST,
INV-RULES-ENGINE, INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND — 0 edit, 0 reject),
so the proposal is byte-identical to the re-check-4 PASS. Re-validate
`DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and confirm every
enumerated amendment-set home in `GATE-QUESTIONS.md` still resolves to the live
file:line cited (run your own independent full-corpus grep of the four invariant
families plus a DEC-010 sweep). Do not write a GAMEPLAN or slice docs. On FAIL set
`STATUS.refining` and list the findings.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report PASS or FAIL and the complete findings list
back to the driver.

### plan

graph is controlling. This is an autonomous graph run (build-half run ID
`graph-20260904-220341`); no human is available, so do not stop to ask clarifying
questions — plan the slices and emit the artifacts per the skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `thejudge-map-out` skill on the package at
`PRD/work/single-source-invariants/`. The package has `## Preparation gate` →
`Quality-check: PASS`, so planning may proceed (do not self-certify a PASS — read
the recorded one). This is a **docs-only / product-truth-only** deliverable: no
application code changes. The apply step (`build`) will write the real
`PRD/sections/` and root/PRD README edits **by intent** from the finalized
proposal in `GATE-QUESTIONS.md` (five accepted blocks: INV-ENDPOINT,
INV-MOCK-FIRST, INV-RULES-ENGINE, INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND) plus
the `DESIGN-BRIEF.md` intent.

Slice the work into reviewable milestones and emit `GAMEPLAN.md`, one `slice-*.md`
per slice, and a `slice-<letter>.criteria.json` beside each, per the skill and its
`reference.md`. Because this is docs-only, acceptance-criteria evidence blocks
should be file-path or manual-observation based (the edited `PRD/sections/` and
README files, and a re-grep confirming each canonical home carries its
amendment-set list and no unlisted rule-stating home remains) — not app test
commands. Keep each invariant's amendment set (from `DESIGN-BRIEF.md` /
`GATE-QUESTIONS.md`) intact within its slice so a reviewer can check the full
home+pointers set together. Do NOT edit `PRD/sections/` — planning only writes
planning artifacts inside `PRD/work/single-source-invariants/`.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the slice list, the artifact paths written,
and the total criteria count back to the driver.

### build

graph is controlling. This is an autonomous graph run (build-half run ID
`graph-20260904-220341`); no human is available, so do not stop to ask clarifying
questions — implement every remaining slice per the skill, apply the finalized
proposal, earn each criterion, and open the code PR.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `thejudge-implement-all` skill on the package at
`PRD/work/single-source-invariants/`. Use the shared build branch
`thejudge-auto/single-source-invariants-work` (already pushed to `origin` with the
GAMEPLAN, all five slice docs, and their `.criteria.json`). The recorded autonomous
base is `origin/main` (docs PR #187 merged the original base into `main`), so the
code deliverable PR opens against `main` (`gh pr create --base main --head
thejudge-auto/single-source-invariants-work` — opens a PR, never merges).

This is the **apply** step and it is **docs-only / product-truth-only** — NO
application code. Write the real `PRD/sections/`, `PRD/README.md`, and root
`README.md` edits **by intent** from the finalized proposal in `GATE-QUESTIONS.md`
(five accepted blocks, 0 edit / 0 reject) and the `DESIGN-BRIEF.md` intent,
re-derived against current truth — not a blind replay. Implement slices A→B→C→D→E
in order (A writes the shared `functional-requirements.md` REQ-094 line carrying
both the endpoint and rules-engine pointers; C only verifies it — see the GAMEPLAN
Sequencing note). Slice E adds the grep-before-amend guardrail to `writing-rules.md`
and the `requirement-format.md` cross-ref (both are non-skill instruction files, in
scope); it must NOT edit any `thejudge-*` skill file (protected — the skill-side
pointer is a noted follow-up, not part of this deliverable).

Earn every acceptance criterion in each `slice-*.criteria.json`: path criteria by
editing the named file, manual criteria by a dated re-grep observation line naming
the criterion id. Every criterion must be `true` before the node reports done. All
writes must stay inside `.worktrees/implement-single-source-invariants/` or
`PRD/work/single-source-invariants/`.

Copy the `Working directory:` line above, unchanged, into every prompt you write
for any subagent you dispatch. Report the worktree path, the PR URL, each slice's
final status, and confirm every criterion is earned, back to the driver.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
