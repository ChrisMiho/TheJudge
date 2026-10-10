status: active

# rulesguru-local-suite

Local-only RulesGuru practice suite for the rules test harness. See `IDEA.md`.

Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`, `intake/FINDINGS-fit.md`. Hard constraint: no RulesGuru data in any committed file.

- Design brief: `DESIGN-BRIEF.md`
- Proposal and owner questions: `GATE-QUESTIONS.md` (new REQ-232; amends REQ-185, REQ-186, REQ-188, REQ-226, NFR-018 and one non-goal; blockers B1 promotion, B2 folder)
- Evidence: `evidence/name-lookup-counts.mjs` and its saved output `evidence/name-lookup-counts.out.txt` (the brief's name-lookup counts, from committed data only); `evidence/amendment-grep.cmd.txt`, `evidence/amendment-grep.mjs` and the raw hit list `evidence/amendment-grep.hits.txt` (the brief's amendment-set grep, 269 hits at `c6dec2ce`)
- Graph run ledger: `GRAPH-RUN.md`

- Gameplan: `GAMEPLAN.md`

## Slices

| Slice | Doc | Title | Depends on | Criteria | Status |
| --- | --- | --- | --- | --- | --- |
| A | `slice-a-folder-guards-loader.md` | Suite folder, ignore line, guards, loader external mode | none | 10 | planned |
| B | `slice-b-import-purge.md` | Import and purge commands | A | 10 | planned |
| C | `slice-c-lookup-headers-convert.md` | Name lookup, header mapping, convert | A | 10 | planned |
| D | `slice-d-retrieval-check.md` | Retrieval check suite mode | A, C | 8 | planned |
| E | `slice-e-answer-run.md` | Answer-quality run suite mode | A, C, D | 11 (1 manual) | planned |
| F | `slice-f-prd-apply-readme.md` | PRD apply, README pointer, promotion checklist | A to E | 11 (1 manual) | planned |

B and C are parallel-ready after A. The build never runs the real import, convert or suite run and makes no live call.

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/rulesguru-local-suite/DESIGN-BRIEF.md`
- Findings: none (build-half re-grade attempt 2 at `c6dec2ce`, commit `9face57d`, after the owner's 9/9 accept; attempt 1 `8476a3ef` failed on a stale amendment set, refreshed by define `02a2cc5b`). Report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/main
