# Quality check — health-flow

- Result: **PASS**
- Checked: 2026-10-22, graph run `graph-20261023-020331` node 4 (`gate-qc`), attempt 2 (re-grade after define commit `dd56ff68`; checked at tip `ad85d2a9`)
- Artifact: `PRD/work/health-flow/DESIGN-BRIEF.md` with `GATE-QUESTIONS.md`, `IDEA.md`, `README.md`, `evidence/`, `intake/`
- Not under check: `PRD/work/health-pipeline/` (Part 2)
- Previous report: attempt 1, FAIL (4 blocking, 5 advisory)

## In plain terms

All four blocking findings and all five advisory findings from attempt 1 are
fixed. Every proposed change to the product text still applies cleanly, exactly
once. The one new question, Q-015 (drop Life Tracker fix 10), is a real
blocker with a blank verdict slot, and the package reads correctly for either
answer. Three small advisory notes remain; none blocks.

## Attempt-1 findings, one line each

Blocking
1. NFR-012 kept a retired job name: **resolved**. The hunk now rewrites the whole of `non-functional-requirements.md:209`; after applying it no `browser-smoke` job name is left (only the historical file path in NFR-021's Notes).
2. NFR-021 Description / constraint 387 / Notes: **resolved**. New hunks for the Description (376), Notes (403) and "what it does not prove" (405); line 387 is kept on purpose (see "Line 387" below).
3. Fixes 6-10 had no diagnosis: **resolved**. `evidence/bug-diagnosis.md` bugs 6-10 each give cause, file:line evidence, fix, size and a named test; fix 10's source is copied into `evidence/browser-smoke-followups-pr341.md`.
4. `### 6. Order` skipped `close`: **resolved**. Steps 5-8 now match the graph contract (close writes the receipt and deletes the package before the owner merges; the run ends `COMPLETE` with the PR open) and name the actor (a direct Claude Code session the owner starts on `thejudge-auto/health-flow-work`).

Advisory
5. Decision 7 count: **resolved** (count note names ten in the table, nine after Q-015).
6. Reconciliation supersede note: **resolved** (`flow-text-reconciliation.md:21`).
7. Disposition rows for the other flow ids: **resolved** (`evidence/flow-id-dispositions.md`, see "Disposition coverage").
8. REQ-206 cite substance: **resolved** (REQ-213 and REQ-209 each inlined in the block).
9. `deploy` needs wording: **resolved** (see "Deploy wording").

## What passed (checked mechanically)

- **Diffs.** All 47 diff fences in `GATE-QUESTIONS.md` were parsed and run against the live text: 46 old-text spans each match exactly once, in the file the block names; the 47th is NFR-022's all-add block, and NFR-022 is unused in `PRD/sections/` and `PRD/instructions/`. All 46 were then applied in memory to a copy; none overlap. The NFR-012 hunk covers the whole of line 209. The new NFR-021 hunks at 376, 403 and 405 apply cleanly.
- **Leftovers after applying.** No `smoke:browser`, `browser-smoke` job, `FLOW-008`, `FLOW-012`, `2000 chars`/`(6000)`, `"N cards"`, `direct Remove button`, `most basic action` or `card-context trigger` text remains in `PRD/sections/` or `PRD/instructions/` (the 2000-character hits left are `gameStateNotes`, a different field).
- **Line 387 kept.** The reason holds: the brief's section 4 and the harness bullet make the harness import the pure rules (request classification, console filtering, env builders, port picking) from `scripts/`, run by `npm run test:scripts`, so "unit-tested under `scripts/`" stays true. NFR-020's line 355 is a separate requirement and is unchanged.
- **Plain-language blocks.** All 17 blocks and Q-015 open with "What this decides / In plain terms / What happens if you say no"; cited REQ/DEC/FLOW ids carry their substance in the sentence. There are exactly 18 `- Verdict:` and 18 `- Reason:` lines, all blank.
- **Q-015 is a genuine blocker.** Condition 1: the answers change what a tap does and how every life card looks. Condition 2: REQ-217 (`functional-requirements.md:5737`), `life-tracker/README.md:29-31` and DEC-136 all say the three inner controls take their own taps, while the approved package called it a bug. Condition 3: building either version silently decides the other. Recommendation is stated; the quoted spec text exists. Brief section 5 row 10, section 6 step 1, owner decision 7, the FLOW-013 test-case row ("if Q-015 keeps fix 10: the centre of each - half instead") and `bug-diagnosis.md` bug 10 read correctly for accept (drop, nine fixes) and reject (keep, ten fixes).
- **Test-case list.** 18 rows, matching the 18 player flows (001-007, 009-011, 013, 014, 016-018, 023-025).
- **Order and close.** `### 6. Order` agrees with `graph-workflow-contract.md` (close node 8 runs on the code branch before the merge, writes the receipt, deletes the package; `intake/` is preserved by DEC-167). The receipt must carry the test-case list, per-test checks/skips lists and must-fail records; the lists and records also live in the repo (`flow-NNN-<slug>.md`, `coverage-map.json`); the actor who adds the owner's misses is named; the Material assumptions repeat it.
- **Disposition coverage.** A fresh line-level grep over `PRD/sections/` for `FLOW-005|006|007|010|013|017|023|024` returns 119 distinct `path:line` hits; `evidence/flow-id-dispositions.md` lists exactly those 119 (122 rows, because three lines name two flows). Nothing is missing and nothing is extra. FLOW-008/012 hits (5) are in the brief's table; the brief's table covers `smoke:browser`, `2000 chars`, `(6000)`, `"N cards"` and `direct Remove button`.
- **Deploy wording.** NFR-021 hunk, NFR-022 constraint and brief section 4 all say the `deploy` job lists `flow-tests` in `needs:` and waits for every shard.
- **REQ-206 block** inlines REQ-213 ("with its cards in the strip") and REQ-209 ("the shared workspace with the Cards strip").
- **Define's two extra changes are sound.** REQ-027 wording (caps defined once in the backend, imported by the client): `apps/backend/src/constants.ts` has only a type import, `apps/frontend/tsconfig.json` is `noEmit` and already type-checks a test that imports `backend/src/constants.js`; the brief tells the planner to confirm the frontend build takes the import. The 11th follow-up in the FLOW-005 row is correct arithmetic: the k-th follow-up sends 2k messages, so the 11th sends 22 against a cap of 20; the fix keeps the opening exchange (REQ-246).
- **No `DEC-###` entry** is proposed anywhere. `intake/` is unchanged since carry commit `31c689ae` (empty diff).
- **Other checklist items.** No contradiction with the cited feature specs; no screen or overlay is introduced (the REQ-206 change describes the existing Cards strip, so no `screen-layout.md` row is needed); technical-design-rules respected (one endpoint, no rules engine); scope implementable without hidden assumptions; the one open question is a genuine blocker.

## Blocking findings

None.

## Advisory findings (do not block)

1. `system-map.md:537` "Lives in" (NFR-021 block) drops `scripts/smoke-browser.mjs` and lists `e2e/flows/`, while the brief says the pure rules stay under `scripts/` and "only the file may be renamed". Name the file that holds the rules (renamed or not) in that line when the build applies it.
2. `quick-lookup/README.md:195` and `:364` still say "1-20 turns" while the amended places now say "20 messages". The meaning is the same (roles alternate), so it is not wrong, but the brief's disposition table has no `20 turns` row; add one (keep, or reword to "messages" in the REQ-027 block) for the audit trail.
3. `evidence/bug-diagnosis.md:21` still says "Method: code reading for all five" and the file's first line says "ten"; bugs 6-10 are by code reading too. Cosmetic.

## Next step

PASS. The package stays at `refined` (`STATUS.refined`, board row under `## refined`). The owner answers the 18 verdict slots at the `define` gate (17 blocks plus Q-015); map-out follows after the gate is resolved. Fix 10 and the FLOW-013 row depend on Q-015's answer.
