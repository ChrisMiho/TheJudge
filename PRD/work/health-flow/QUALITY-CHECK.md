# Quality check — health-flow

- Result: **FAIL**
- Checked: 2026-10-22, first check, graph run `graph-20261023-020331` node 4 (`gate-qc`), attempt 1
- Artifact: `PRD/work/health-flow/DESIGN-BRIEF.md` with `GATE-QUESTIONS.md`, `IDEA.md`, `README.md`, `evidence/`, `intake/`
- Not under check: `PRD/work/health-pipeline/` (Part 2)

## In plain terms

The proposal is mostly sound and applies cleanly. Four things must be fixed
before it passes: a retired job name left in NFR-012, a stale sentence left in
NFR-021's description, three of the ten bug fixes with no recorded cause or
test, and an order of steps that skips over the graph's close step.

## What passed (checked mechanically)

- All 44 diff hunks in the 17 blocks were run against the live `PRD/sections/` and `PRD/instructions/runtime-process-hygiene.md` text: every old-text span matches exactly once, in the file the block names. The two add-only hunks (NFR-012 note, FLOW-005 line) have a context line that also matches once.
- NFR-022 is unused in `PRD/sections/` and `PRD/instructions/`. It follows NFR-021, the highest NFR. The next free flow id after FLOW-025 is FLOW-026, as the FLOW-008 block says.
- Every REQ/DEC cited by the brief exists (REQ-246, 088, 237, 217, 205, 209, 213, 208, 214, 200, 053, 071, 202; DEC-084, 138, 117, 107, 160, 155, 042).
- All 17 blocks open with the three plain-language lines; `- Verdict:` and `- Reason:` are blank in all 17; `## Blocker questions` is present. The substance of each cited REQ/DEC is stated in the block's own words.
- No new `DEC-###` is proposed anywhere. Every DEC id in the brief and gate file is an existing one.
- The 18 flows in the NFR-022 test-case list match the brief's list (001-007, 009-011, 013, 014, 016-018, 023-025). With FLOW-008, 012 and 019 gone, `user-flows.md` has 22 entries: 18 mapped plus 4 exempt (015, 020, 021, 022).
- The reconciliation items A1-A10, B1-B4 and C1 each land in a block (A1 and A2 in REQ-027 and FLOW-005; A3-A4 in FLOW-006; A5 FLOW-007; A6 FLOW-010; A7 FLOW-013; A8-A10 FLOW-023; B1 REQ-206; B2 and B3 are app fixes 8 and 9; B4 REQ-058; C1 FLOW-024).
- Grep re-run for `FLOW-0(08|12)`, `2000 chars`/`(6000)`/`20 turns`, `N cards`/context-trigger wording and `direct Remove`: every hit is either in the brief's disposition table or is a historical receipt.

## Blocking findings

1. **NFR-012 keeps a retired job name.** `non-functional-requirements.md:209` is one line. The NFR-012 diff rewrites only its first half. The second half still says "plus about one minute each for `built-server` and `browser-smoke`". The brief's table says line 209 is amended in the NFR-012 block, but the proposed diff leaves a job name that no longer exists. Extend the old and new text to cover the whole sentence (rename the job, or say "and each flow shard").
2. **NFR-021's Description contradicts its new Title.** The diff changes the Title and the Constraints, but the Description (`non-functional-requirements.md:376`) still says each tool "does its most basic action". Constraint line 387 still says the pass/fail rules are "unit-tested under `scripts/`", while the brief moves those rules to wherever the harness lives (`e2e/flows/`). Add hunks for both, or state in the brief that the rules stay under `scripts/`. The Notes line 403 measures the old six steps; mark it historical or reword it.
3. **Fixes 6 to 10 are not agent-ready as the brief claims.** The brief says `evidence/bug-diagnosis.md` has "full causes, file:line evidence and fix sketches" for each of the ten fixes, and the check asked that each fix name its file and its unit test. The file covers only five bugs (its own title says so). Fixes 6 and 7 appear in "Other bugs found along the way (not chased)" with a cause but no file list, no size and no unit test named. Fixes 8, 9 and 10 have no diagnosis at all: no file, no line, no test. The brief's table gives "1 file, small" or "small" for them. Fix 10's detail lives in `PRD/ideasForLater/browser-smoke-followups/IDEA.md` (open docs PR #341), which is not in this branch, so the package cannot be read alone. Add a diagnosis entry per fix 6-10 with the file(s) and the named unit test that would have caught it (fix 10: the `elementFromPoint` test; copy the needed text from PR #341 into `evidence/`).
4. **The order in `### 6. Order` skips the graph's close step.** Per `graph-workflow-contract.md` the build half runs `close` (node 8) before the owner merges: the receipt is written, the package folder (brief, gate file, evidence) is deleted, and the run ends `COMPLETE` with the PR open. The brief's steps 6-7 (owner watches in Playwright UI mode, owner's misses are added to the same PR) therefore happen after the run is over, with the package already gone. The brief says the graph "opens the code PR and stops" and that the list is updated "in the receipt", but it never says who adds the owner's misses (the owner in a direct session on `thejudge-auto/health-flow-work`, or a resumed graph run), that the evidence files are gone by then, or that the receipt must carry the full test-case list and the walk notes the later round needs. State this in step 5-7, and require close to put the test-case list, the checks/skips lists and the must-fail records into the receipt.

## Advisory findings (do not block)

- Owner decision 7 says "Seven bugs plus two app-versus-spec fixes", but the table and every other line say ten. Make the count consistent.
- `evidence/flow-text-reconciliation.md` says "5 known bugs" and that FLOW-017 needs no text change ("`user-flows.md:400` already says this"). The brief and the FLOW-017 block add a clarifying clause. Add one line in the reconciliation that the owner's later decision supersedes this.
- The disposition table lists greps only for FLOW-008/012, the smoke names and the wording changes. It has no row for the other flow ids the brief touches (005, 006, 007, 010, 013, 017, 023, 024). All their stale sentences are in blocks, so nothing is missed today, but the row is the audit trail.
- The REQ-206 block cites REQ-213 and REQ-209 by number with only a half-sentence of substance; fine for this owner, but one clause each would match the standard better.
- `NFR-022` says the build "sets the shard count from measured CI time" and the `deploy` job "needs every shard" while NFR-021's hunk says `deploy` needs `flow-tests` (one matrix job). Both are consistent in effect; use the same wording in both.

## Next step

Return this list to refinement (`/thejudge-refinement PRD/work/health-flow/`). Fix findings 1-4 in `GATE-QUESTIONS.md`, `DESIGN-BRIEF.md` and `evidence/`, then re-run quality-check. Because the brief and blocks change, the owner re-approves the changed blocks (NFR-012, NFR-021) only.
