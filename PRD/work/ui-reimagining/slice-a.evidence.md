# Slice A — evidence log

2026-09-24 A9 — read every "Amend" row in `GATE-QUESTIONS.md`'s four grep
tables (Grep A: A1-A22 excluding A5/A6/A7/A23/A24 which are unchanged rows;
Grep B: B1, B3, B4, B5; Grep C: C1, C11; Grep D: D1, D12, D16) side by side
with the resulting diff in `PRD/sections/functional-requirements.md`,
`PRD/sections/user-flows.md`, `PRD/sections/goals-and-non-goals.md`,
`PRD/sections/non-functional-requirements.md`, `PRD/sections/screen-layout.md`,
and `PRD/sections/trade-balancer/README.md`. Each row's cited assertion is
edited to the finalized `GATE-QUESTIONS.md` text, applied by intent against
current content (line numbers had shifted since the diffs were authored):
REQ-200 block folds A1 (system-map.md Theme summary), A2/A4 (FLOW-007 step 4
+ notes), A8 (REQ-044), A20 (goals-and-non-goals.md); REQ-046 block folds
A9/A10/A11/A12/A13; REQ-060 block folds A14/A15/A16; REQ-099 block folds
A17/A18/A19; NFR-011 block folds A21/A22; REQ-203 block folds B1/B3 (via
FLOW-001 step 1 and the REQ-045 note) and the REQ-056 block folds B4/B5;
REQ-204 block folds C1 (screen-layout.md Trade Balancer Phone row) and C11
(trade-balancer/README.md Layout/fit line); REQ-203/REQ-056 block folds D1/D12
(same lines as B1/B4); REQ-124 block folds D16. Every row's disposition is
"Amend" and every one is reflected in the diff above; no row was skipped.
