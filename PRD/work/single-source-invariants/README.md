status: refined

# single-source-invariants

Seed idea captured 2026-09-04. See `IDEA.md`.

De-duplicate the cross-cutting product-truth invariants (rules asserted across
3+ files, like "one main endpoint") into one canonical home each, and add a
grep-before-amend guardrail to refinement/gate-authoring. Bounded corpus
hygiene — not an ID-system rewrite. To implement next, after image-first-cards
ships.

Next step: answer the five decision blocks in `GATE-QUESTIONS.md`, merge the
docs-only PR to `main`, then `/graph-implement PRD/work/single-source-invariants/`.

Gate review complete (2026-09-04): owner answered all five decision blocks in
`GATE-QUESTIONS.md` — INV-ENDPOINT, INV-MOCK-FIRST, INV-RULES-ENGINE,
INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND — all verdict `accept`; no blocker
questions. Docs PR #187 merged to `main`. `STATUS.refined`. Next:
`/graph-implement PRD/work/single-source-invariants/` (resumes at `gate-qc`).

Refinement complete (2026-09-04): `DESIGN-BRIEF.md` written; `GATE-QUESTIONS.md`
carries five decision blocks (INV-ENDPOINT, INV-MOCK-FIRST, INV-RULES-ENGINE,
INV-DECISION-LOG, GUARD-GREP-BEFORE-AMEND), no new IDs minted.

Re-grep correction (2026-09-04, graph-20260904-201403): re-ran the endpoint and
rules-engine `grep -rniE` families against current `PRD/` + root `README.md` and
reconciled both amendment sets against the output. Fixes: the `:4020/:4031`
file mis-attribution (they are REQ-175 in `functional-requirements.md`, not
`integrations-and-data.md`); the `:2195` REQ mislabel (REQ-094, not REQ-072);
added the missing REQ-072 endpoint home at `:1677` (which cites retired DEC-010);
added `user-flows.md:268`; and added grep-recovered rules-engine homes
(`integrations-and-data.md:370-373`, `agent-working-rules.md:44`,
`problem-statement.md:32`, `game-rules-retrieval.md:89`, DEC-002 index row).
`STATUS.refined`. Next: re-run quality-check.

Loop-3 comprehensive reconciliation (2026-09-04, graph-20260904-201403): re-ran
a fresh `grep -rniE` for ALL FOUR invariant families (endpoint, mock-first,
rules-engine, decision-log) across the whole live corpus (`PRD/` + root
`README.md`) and reconciled every amendment set line by line, rather than only
the flagged families — the fix for the "a different family's stragglers surface
each re-check" pattern. Applied the loop-2 misses (`PRD/README.md:140`,
`in-depth/README.md:370`, `quick-lookup/README.md:279` for mock-first;
`quick-lookup/README.md:34` for rules-engine) and the cosmetic `overview.md:39`
label fix (Current Product Status, not Key Constraints). The comprehensive
re-grep additionally surfaced one endpoint-family straggler the prior loops
never listed — `PRD/README.md:145` (the Implementation-Snapshot "single
product-facing backend route" assertion) — now added as a pointer and folded
into NFR-004's echoed-in list. Every canonical home's echoed-in list updated to
carry its new pointers (NFR-004 gains `PRD/README.md`; the rules-engine home
gains `quick-lookup/README.md`). Decision-log family re-verified clean: the only
live contradiction is the already-captured root `README.md:163`. `STATUS.refined`.

## Autonomous metadata

- Autonomous base: origin/main
- Note: node 1 first recorded `origin/thejudge-auto/single-source-invariants`;
  docs PR #187 merged that base into `main` as the answer-then-merge build signal,
  so the build half branches from `origin/main` (which now carries the finalized
  spec) and the code deliverable PR targets `main`. Shared build head:
  `thejudge-auto/single-source-invariants-work`.

## Preparation gate

- Quality-check: PASS (re-check 4, final — 2026-09-04, graph-20260904-201403).
- Checked artifact: `PRD/work/single-source-invariants/DESIGN-BRIEF.md`
- Findings: none. Independent full-corpus `grep -rniE` of all four invariant
  families (endpoint, mock-first, rules-engine, decision-log) plus a dedicated
  DEC-010 sweep (9 live hits, all matching the brief's classification: 3 in-scope
  rule-statements, 6 out-of-scope traceability/closed-door). Every live
  rule-stating line resolves to a canonical home or a listed pointer; no unlisted
  home; no new IDs minted; docs-only and reversible, no genuine decision blocker.
- Loop history (FAIL→PASS): loop 1 FAIL (REQ-175 file mis-attribution; missing
  `user-flows.md:268`) → loop 2 FAIL (3 mock-first + 1 rules-engine homes) →
  loop 3 FAIL (endpoint DEC-010 line `in-depth:278` misclassified; 2nd
  decision-log contradiction `README.md:17`) → loop 4 closed both straggler
  classes with a written scope test → re-check 4 PASS. Every FAIL was the exact
  grep-from-memory defect this package exists to eliminate. Full detail in
  `GRAPH-RUN.md`.
