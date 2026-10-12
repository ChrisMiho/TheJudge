# Offline measurement — what a follow-up keeps today, on post-#293 code

**What happened:** refinement measured, offline and with no model or network, what a
pushback follow-up's prompt keeps from its opening question on today's code
(`0461969f`, after #293 changed rule search), and checked the premise the design rests
on: re-running rule search on the opening question reproduces the opening question's
rules exactly.

**What it means for you:** today a follow-up keeps well under half of the opening
question's search excerpts on the keyword half alone, and loses curated topics in 6 of 9
In-Depth cases. Re-running on the opening question reproduces turn 1's rules in 62 of 62
cases. These are the numbers behind the brief's acceptance targets. Counts only: no case
text, no case ids, no practice-suite data.

## Setup and limits

- Worktree `.worktrees/kickoff-follow-ups-keep-their-rules` at `0461969f`. No
  `node_modules` and no `apps/backend/data/models/` in this linked worktree, so the
  local embedder cannot run here and nothing was copied in from outside it.
- What stands in for the embedder: the committed frozen query vectors
  (`apps/backend/src/eval/rules-gate/frozen-query-vectors.json`) and frozen per-card
  vectors (`apps/backend/src/eval/frozen-card-vectors.json`), the same inputs the offline
  rules gate (REQ-222) ranks with. They give the production hybrid ranking for each
  case's opening question. No vector exists for the follow-up text, so today's follow-up
  is measured on the keyword half only (the embedding argument set to `null`, which is
  production's own lexical fallback path).
- Node 26's built-in type stripping loads the backend `.ts` sources; `register.mjs` maps
  their `./x.js` import specifiers to `./x.ts`. The combo catalog's source uses
  TypeScript syntax type stripping cannot load, so combo enrichment is off for this
  measurement. Combo context never changes which rules are selected.
- Case set: the committed diagnostic manifest
  (`apps/backend/src/eval/answer-quality/manifests/diagnostic.json`), the same 62 corpus
  cases the intake probe used. The follow-up is the intake's fixed pushback text, "I
  don't think that's right. Can you check it again?", with the opening question as the
  first history turn and a placeholder assistant turn.

## Manifest check

`measure-manifest.mjs` (beside this file) recomputes each listed case's question and
reference-answer SHA-256 and reads its review status and kind. Command, from the
worktree root:

```sh
node ./PRD/work/follow-ups-keep-their-rules/evidence/measure-manifest.mjs "$PWD"
```

Output:

```text
corpus case files: 416; approved: 408
diagnostic: listed 62 (caseCount field 62); missing 0; not approved 0; stale 0; question-hash mismatch 0; answer-hash mismatch 0; In-Depth 9; lookup 53; tiers {"1":1,"2":43,"3":18}; longest question 379 chars
  appended group resolution-recipe-hard-set: 16 cases
held-out: listed 80 (caseCount field 80); missing 0; not approved 0; stale 0; question-hash mismatch 0; answer-hash mismatch 0; In-Depth 0; lookup 80; tiers {"1":20,"2":60}; longest question 351 chars
```

The `stale 0` column reads a stored flag only; real staleness is computed against the
data snapshot at run time (REQ-225), and every experiment run re-checks it before
spending.

## Follow-up measurement

Command, from the worktree root:

```sh
node --no-warnings --import ./PRD/work/follow-ups-keep-their-rules/evidence/register.mjs \
  ./PRD/work/follow-ups-keep-their-rules/evidence/measure-follow-up.mjs "$PWD"
```

Output (2026-10-12, run twice, identical):

```json
{
  "cases": 62,
  "lookup": 53,
  "inDepth": 9,
  "frozenVectorFresh": 62,
  "frozenVectorNotFresh": 0,
  "semanticTurn1": 62,
  "hybridTurn1SelectedMean": "14.44",
  "hybridTurn1SelectedMin": 2,
  "hybridTurn1SelectedMax": 31,
  "hybridRepeatIdentical": "62/62",
  "openingQuestionWithHistorySelectsTurn1Rules": "62/62",
  "followUpQueryTextDiffersToday": "62/62",
  "keywordHalfToday_allSelected": {
    "turn1Total": 1092,
    "turn2Total": 1098,
    "sharedTotal": 613,
    "sharedMean": "9.89",
    "casesKeepingAll": 1
  },
  "keywordHalfToday_searchExcerptsOnly": {
    "turn1Total": 836,
    "sharedTotal": 357,
    "turn1Mean": "13.48",
    "sharedMean": "5.76",
    "casesKeepingAll": 1,
    "casesKeepingNone": 0
  },
  "inDepthCuratedTopicsChangedOnFollowUpToday": "6/9",
  "inDepthCuratedTopicsLostOnFollowUpToday": 8,
  "inDepthSystem3CarriedWithoutSystem2DiffersFromTurn1": "0/9",
  "lookupPhaseGuidance": {
    "presentTurn1": 18,
    "lostOnFollowUpToday": 0
  }
}
```

## Reading

- **The premise holds.** With the frozen vectors, the opening question's rules are the
  same on a repeat preparation (62/62) and the same when the conversation history is
  attached (62/62). Rule search reads nothing from the history today, so re-running it on
  the opening question with the frozen cards and game context reproduces turn 1 exactly,
  provided the embedder returns the same vector for the same text. That last condition
  could not be measured here (no model); it is a build-time check in the brief.
- **The defect is still there after #293.** The follow-up's search text differs from
  the opening's in 62 of 62 cases. On the keyword half alone, a follow-up keeps 357 of
  the opening question's 836 search excerpts (5.8 of 13.5 per case) and keeps all of them
  in 1 case of 62. Card keyword sets (REQ-235) survive because the cards are frozen,
  which is why the all-rules figure (613 of 1,092) looks better than the search-only
  one. The intake's pre-#293 hybrid figure (1.5 of 10 shared) is not carried forward;
  today's hybrid figure needs the embedder and is not measured here.
- **In-Depth also loses curated topics.** #293 made In-Depth choose some curated topics
  by the question's words (REQ-242). On a pushback follow-up those words are gone: 6 of
  9 In-Depth cases change their curated topics, losing 8 topics in total. The intake
  assumed curated topics come only from the frozen context; that stopped being true with
  #293.
- **Carrying System 3 alone would still reproduce In-Depth excerpts here.** Running the
  opening question's search while excluding the follow-up's (smaller) topic set gives
  the same excerpts as turn 1 in 9 of 9 In-Depth cases. So carrying the curated topics is
  about the topics themselves, not about keeping System 3 stable.
- **Quick Lookup step guidance is not lost on this set.** 18 of 53 lookup cases carry
  `PHASE GUIDANCE` on turn 1, and none lose it on the pushback follow-up: on this set the
  guidance comes from the cards' concept terms, which are frozen. A question that names
  a step in words only would lose it; the brief covers that with a unit test, not a
  corpus number.
