# Quality check — resolution-recipe-eval

Run `graph-20261010-183425`, node `gate-qc`, attempt 1. Graph is controlling.
Date 2026-10-10. Graded: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`.

**Verdict: FAIL.** Two problems are real: the cost anchor cannot be reproduced
from anything the brief names, and one G3 card (Serra Angel) is not in the
committed card data the brief says it checked. Three smaller defects ride
along. Everything else checked out.

## Passed

1. **Diff blocks match live text.** A script compared every removed (`-`) and
   context (` `) line in the five diff blocks (REQ-230, REQ-228, REQ-187,
   REQ-224, REQ-185) with `PRD/sections/functional-requirements.md`: 33 lines,
   0 mismatches. Each block carries the three-part plain-language opening
   (What this decides / In plain terms / What happens if you say no) and a
   blank `- Verdict:` / `- Reason:` pair.
2. **Grep reproduces.** The brief's grep returns 104 hits. The 104 table rows
   cover the same file:line set, none missing, none extra. Disposition counts
   match the brief: 10 amend, 20 build, 74 keep.
3. **Blockers recommend without deciding.** G1, G2, G4 each carry a
   Recommendation and blank slots. G5 is correctly folded into the REQ-187 slot.
   All verdict slots are blank.
4. **Rules cited exist and say what the references use.** Checked in
   `apps/backend/data/gameRulesRuleIndex.json`: 613.1a/d/f, 613.4a-d, 613.6,
   613.7, 613.8/a/b, 305.7, 614.1a, 614.6, 700.4, 514.1/2/3a, 616.1/e/f, 707.2,
   603.3b, 704.3, 704.5a/f, 117.5. Card oracle text checked for Blood Moon,
   Urborg, Humility, Opalescence, Giant Growth, Turn to Frog, Kalitas, Blood
   Artist, Necropotence, Borne Upon a Wind, Silence, Academy Manufactor, Esix,
   Clone, Frogify, Mycosynth Lattice, March of the Machines. Every reference
   outcome (G3-01 to G3-16) is correct under that text, and none carries a
   side error of its own (Blood Moon beats Urborg by dependency; Humility 4/4
   and Bears 1/1; 5/5 Frog; Kalitas exiles with no death trigger; cleanup
   priority via the Necropotence trigger; Manufactor-first gives three copies,
   Esix-first gives one; Clone is not a Frog; Lattice-first kills the lands;
   the non-active player's Blood Artist resolves first).
5. **Eval-only.** Nothing under `apps/backend/src/prompt/`, routes or
   providers is touched. No code tags cards with layers (the case-file
   `layers` field is existing case data). The runbook and report go to
   `docs/eval/resolution-recipe/`, not `PRD/work/`. Caps are 6, 3 and 2 USD,
   all at or under 15. R's "replaces" paragraph matches
   `apps/backend/src/prompt/mtgReference.ts` verbatim; the recipe adds 937
   characters (brief says about 900).
6. **Arithmetic is internally consistent.** 0.84 / 72 and 1.08 / 92 give
   about 0.0117 per graded answer; 216 x 0.0117 = 2.52; 88 x 0.0117 = 1.03;
   total 3.55. The noise data matches the backup: Luna has four arm-A answers
   each on the two tier-3 cases in
   `~/Coding/Projects/TheJudge-backups/answer-quality-paid-run-2026-10-09/`.
   The estimate constants at `scripts/eval-answer-quality.mjs:165-167` match.

## Findings (return to refinement)

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| F1 | Blocking | Cost anchor and repeat-count figures cannot be reproduced. The brief says "Run on 2026-10-10 in this worktree" and gives $0.84 and $1.08, but names no command, manifest, flags, or saved output. No record exists in the package (`GRAPH-RUN.md`, intake, IDEA all lack it). Item 6 of the gate requires each number to trace to a command or record named in the brief. | Put the two dry-run command lines (manifest path, `--arm`, `--repeat`, model) in the brief, and save the printed output under `PRD/work/resolution-recipe-eval/` (evidence, build deletes it) or cite it. Same for the Luna reasoning-token figures (mean 323, tier 3 mean 1,286, max 2,026) and the judge cost ($0.0054 mean): name the run folder and field they come from. |
| F2 | Blocking | G3-11/G3-12 name Serra Angel "({3}{W}{W}, flying and vigilance)", resolved by name, and the brief and G3 intro say each card was checked against the committed card data. The committed data (`cardDetailByOracleId.json.br`) has no card with oracle text "Flying, vigilance" and cost {3}{W}{W} (the nearest is `d12cf640-...` at {4}{W}, a different card). Card data has no name field, so "resolved by name" cannot be shown either. The claim of verification is unsupported for this card. | List the oracle id for Serra Angel and confirm its committed oracle text, or swap in a creature that is in the data and re-verify G3-11/G3-12. |
| F3 | Minor | The G3 intro says "Card ids are the ones used to verify", and the brief says ids are listed in each G3 slot. Grizzly Bears, Murder, Serra Angel, Forest and Island carry no id. The data holds at least two Murder-text instants ({1}{B}{B}) and five vanilla {1}{G} Bears, so "by name" is ambiguous without the ids. | Add the ids used, or state the disambiguation rule. |
| F4 | Minor | Brief "Verified facts" row on printed power and toughness says the only dependency is "Serra Angel's 4/4 (named in G3-13)". G3-13 is Mycosynth Lattice. Serra Angel is G3-11, and its reference deliberately avoids naming 4/4. The sentence misleads the owner. | Correct to G3-11 and say no reference depends on printed P/T. |
| F5 | Minor | The REQ-230 diff hard-codes "holds the 16 hard layer and timing cases" and the brief's append group is the 16 new ids. G3 allows reject and edit per case; a rejected case makes the committed requirement text false on merge. Also the G3 slots carry no per-slot recommendation; only the top-line "accept all" covers them. | Word the diff as "the hard layer and timing cases the package authored" (count in the build note), and add a one-line recommendation to the G3 intro (accept each, reference checked). |

## Status

FAIL: set `STATUS.refining`, board row moved under `## refining`. README
`## Preparation gate` left to the driver. No product code, no GAMEPLAN, no
slice docs written. Brief and questions file not edited.

Return to refinement with F1 to F5.
