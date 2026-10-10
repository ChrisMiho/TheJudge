# Quality check — resolution-recipe-eval

Run `graph-20261010-183425`, node `gate-qc`, attempt 2. Graph is controlling.
Date 2026-10-10. Graded: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` after define
attempt 2 (commit `a5f98eec`).

Attempt 1 failed on F1 to F5 (cost anchor not reproducible, Serra Angel and
other G3 cards without ids, a wrong G3-13 cite, a hard-coded "16"); all five
are resolved below.

**Verdict: PASS.** No findings. The package stays at `refined`.

## Attempt-1 findings

| # | Status | Check |
| --- | --- | --- |
| F1 | Resolved | The brief's two dry-run command lines (manifest emit lines, `--arm A --arm B`, `--repeat 6`, model, caps) are character-identical to the commands saved in `evidence/cost-anchor-dry-runs.txt`; the printed "72 / 72 / $0.84" and "92 / 92 / $1.08" match. Luna figures name the folder (`~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/answer-quality/runs/`), the filter (`model` `gpt-6-luna`, `status` `ok`, 181 records), and the fields: `outputTokens` mean 322.9 / tier-3 mean 1,286.2 / max 2,026, `judgeCostUsd` mean 0.005394 / tier-3 0.006447, `latencyMs` max 22,683 / tier-3 median 13,114.5. Each equals step 4 of the evidence file. Phase folders (126 + 46 + 9) sum to 181. |
| F2 | Resolved | `node evidence/resolve-g3-cards.mjs` reproduces `evidence/g3-card-ids.txt` (22 names, 0 problems; the only diff is the file's header line). Serra Angel is `4b7ac066-...`, {3}{W}{W}, "Flying / Vigilance", read from `cardDetailByOracleId.json.br`. Grizzly Bears comes from `cardScanMap.json` (id present there). |
| F3 | Resolved | All 16 G3 slots list an oracle id for every card (Grizzly Bears, Murder, Serra Angel, Forest, Island included). Each id matches the evidence file. |
| F4 | Resolved | The printed power/toughness row now says no reference depends on it and cites G3-11/G3-12. |
| F5 | Resolved | The REQ-230 diff says "the hard layer and timing cases the `resolution-recipe-eval` package authored from the define-gate slots the owner accepted or edited", with no fixed count. The G3 intro and every slot carry a recommendation. |

## Direct checks

1. **Diff blocks match live text.** A script compared every removed (`-`) and
   context (` `) line in the five blocks (REQ-230, REQ-228, REQ-187, REQ-224,
   REQ-185) with live `PRD/sections/functional-requirements.md`: 33 lines, 0
   mismatches. Each block keeps the three-line opening (What this decides / In
   plain terms / What happens if you say no) and a blank `- Verdict:` /
   `- Reason:` pair.
2. **Grep reproduces.** The brief's grep returns 104 hits; the table has 104
   rows (10 amend, 20 build, 74 keep), as stated.
3. **Blocker slots.** G1, G2, G4 recommend without deciding; G5 folds into the
   REQ-187 slot. All 24 verdict slots (5 + G1, G2, G4 + 16) and 24 reason
   slots are blank.
4. **G3 references.** Outcomes and reasoning are unchanged in substance from
   attempt 1 (all 16 correct, no side error). Only ids, intro text and
   recommendation lines changed.
5. **Nothing outside the package changed.**
   `git diff --stat dabad406 HEAD -- PRD/sections apps scripts docs` is empty.
6. **New problems from the edits.** None found. Counts agree across brief,
   questions file and evidence (46 diagnostic cases today, 44 ordinary after
   the two existing hard cases, 18 hard, 216 + 88 answers, about $3.55). No
   product code, GAMEPLAN or slice docs written.

## Status

PASS: `STATUS.refined` and the board row under `## refined` stay as they are;
map-out owns the move to `active`. README `## Preparation gate` left to the
driver. Brief and questions file not edited.
