# Quality check — luna-answer-budget

Run: graph-20261009-142138, node 4 (gate-qc), attempt 1. Mode: graph controlling.
Checked at worktree `HEAD` `7442a846`. No paid or live call made.

## Verdict: PASS

STATUS.refined stays in place. The board row stays under `## refined`.

## What was checked, and how

| Check | Result |
| --- | --- |
| Gate blocks: three plain-language lines (What this decides / In plain terms / What happens if you say no) | All 10 blocks have all three. |
| Blank verdict slot | All 10 blocks end with an empty `- Verdict:` and `- Reason:`. |
| Diff context and removed lines match current PRD text | Script check: every context and removed line in all 15 diff blocks (REQ-231 x4 files, NFR-002 x2 incl. the note append, REQ-181, 182 x2, 186, 188 x4, 190, 226, 228, 230) equals a current line of the named file, in order. 0 mismatches. |
| Diff completeness | Every PRD-file "amend" row in the brief's table (rows 5-11, 14-16, 18-23) lands in a block. REQ-188's six touches are all present. REQ-231 new section is appended after the last REQ-230 line. REQ-231 is not used anywhere else. |
| PRD/sections unchanged | `git diff main -- PRD/sections` is empty. |
| Amendment-set disposition table | Re-ran the brief's grep at HEAD: 366 unique file:line hits. The table has 366 rows. Set difference both ways: none missing, none extra. Dispositions sum 105 + 161 + 98 + 2 = 366, as stated. |
| Spot-checks of the brief's code claims | `aws-bootstrap.sh:17-19` and the `update-function-configuration` at 643-647, `aws-deploy.sh` config call at ~96 (no `--timeout`), `createAskAiProvider.ts:14-16` fallbacks, `ASSUMED_TIMEOUT_MS = 15000` with `productionTimeoutMs` fallback, and 31 of 31 prompt goldens carrying the old layers sentence all match. |
| Extra sweep for related wording the grep terms miss | `20 seconds`, `15 seconds`, `Lambda timeout`, `3 seconds` over PRD/sections, docs, deploy scripts, provider, config, frontend: only the already-listed hits (plus design-mockup docs under `docs/design/`, which are not product truth). |
| Intake departures named with a reason | A5 (`ASSUMED_TIMEOUT_MS` stays 15000, intake said 30000) is named and reasoned. Stale-fallback alignment, A1 retries=1, the added grep terms and `docs/aws/deployment.md` are named. |
| Technical-design rules, stack ordering, vocabulary, screen-layout | No new endpoint or rules engine; `{ answer }` contract unchanged; no new screen or overlay, so no screen-layout row needed. |
| Agent-readiness | Fixed behaviours are testable; the mechanism is left to map-out on purpose. Slices A-D are sketched. Blocker questions: none, and none are needed. |

## Findings

None blocking. Three non-blocking notes for map-out (no re-refinement needed):

1. The brief's "Found by reading" list says REQ-230's "adopted-arm constraint" is amended. The gate slot only appends a note. The constraint at `functional-requirements.md:6040` is still true after the change, so the slot is right and the brief wording is loose.
2. The intake called the line-402 note "REQ-178"; it is REQ-022. The brief uses the correct id (row 4, keep as history). The correction is not called out as a departure.
3. REQ-023's 40-second waiting-panel line and the `docs/design/ui-reimagining/` mockup thresholds are not touched. The brief records the REQ-023 choice (A8).
