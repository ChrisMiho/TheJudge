# commander-spellbook-combos — reconciliation handoff

**Written:** 2026-08-14, during a repository consolidation pass.
**Read this before any `thejudge-implement*`, `thejudge-amend`, or
`thejudge-cleanup` run on this package.**

This package exists in **four divergent versions** across branches. Resuming
from any one of them without reading this note silently discards the others.
Nothing has been merged or discarded — every version is preserved on
`origin`.

## The four versions

| Branch | Status marker | Slice plan | Product code | Role |
| --- | --- | --- | --- | --- |
| `origin/thejudge-auto/commander-spellbook-combos` | `STATUS.refined` | A–F | **Yes — 67 files, +6,704** | Open PR #89, `[THEJUDGE-AUTO][BLOCKED]` |
| `origin/feature/enhancement-bangers` | `STATUS.active` | A–F | No | PR #89's base branch |
| `origin/rescue/launch-checkout-20260814` | `STATUS.active` | A–F | No | Uncommitted launch-checkout state, rescued 2026-08-14 |
| `origin/main` | `STATUS.deferred` | A–E, different filenames | No | Superseded pre-expansion plan |

## What is actually settled

**Product code truth is the PR branch.** It is the only branch where the
implementation exists. Slices A–F are committed there:

- `scripts/build-commander-spellbook-combos.mjs` (+ test)
- `scripts/refresh-commander-spellbook-data.mjs` (+ test)
- `scripts/compare-combo-answer-quality.mjs` (+ test)
- `apps/backend/src/prompt/` — `preparation.ts`, `promptAssembly.ts`,
  `promptDiagnostics.ts`, `comboPromptIntegration.test.ts`
- `apps/backend/src/runtime/createConfiguredApp.ts` (+ test)
- New `apps/backend/src/eval/fixtures/commander-spellbook-*` fixtures and
  prompt goldens

Do not attempt to reimplement any of this from the docs on another branch.

**`main`'s A–E version is dead.** It predates the 2026-08-11 re-refinement
that expanded scope to per-ingredient card state and answer-quality
measurement. It will be overwritten when PR #89 eventually lands. Ignore it.

## What is genuinely unresolved

### 1. Which A–F doc set is current

`origin/rescue/launch-checkout-20260814` and the PR branch hold doc sets
**663 insertions / 711 deletions** apart. Per-file:

| File | Lines differing |
| --- | --- |
| `DESIGN-BRIEF.md` | 185 |
| `GAMEPLAN.md` | 189 |
| `README.md` | 136 |
| `slice-a-corpus-build-pipeline.md` | 185 |
| `slice-b-catalog-loader-and-config.md` | 118 |
| `slice-c-intent-and-matching.md` | 100 |
| `slice-d-prompt-integration.md` | 136 |
| `slice-e-eval-fixtures-and-goldens.md` | 101 |
| `slice-f-answer-quality-comparison.md` | 137 |
| `PRD/sections/decisions/combo-retrieval.md` | 27 |
| `PRD/sections/functional-requirements.md` | 40 |
| `PRD/sections/integrations-and-data.md` | 12 |
| `PRD/sections/system-map.md` | 6 |

Neither is obviously canonical. The rescued version was sitting uncommitted
in the working checkout and is *newer by wall-clock*, but was never verified
against the code that shipped to the PR.

Compare with:

```bash
git diff origin/thejudge-auto/commander-spellbook-combos \
         origin/rescue/launch-checkout-20260814 \
         -- PRD/work/commander-spellbook-combos PRD/sections
```

### 2. The PR branch's status marker contradicts its own contents

The PR branch carries `STATUS.refined` and `status: refined`, but also carries
six implemented slices and the commit
`05895b5 docs(commander-spellbook-combos): reopen from false ship-ready, record DEC-162`.

A package with committed slice implementations is not `refined`. The other two
live branches both say `active`, which matches reality. Most likely the
reopen reset the marker one step too far.

**Decide explicitly** whether the correct status is `active` (slices exist,
work continues) or something else, and make the marker, the README `status:`
field, and the `PRD/work/STATUS.md` board row agree. Per
`PRD/instructions/workflow-reference.md` all three must match, and exactly one
`STATUS.*` marker may exist.

### 3. Why PR #89 is BLOCKED

The PR title carries `[THEJUDGE-AUTO][BLOCKED]`. Read its blocker comments
(hidden marker `thejudge-auto:v1:blocker:commander-spellbook-combos:*`) before
resuming — the blocker may already be stale:

```bash
gh pr view 89 --comments
```

Note `c2ac618 fix(commander-spellbook-combos): make the refresh survive
upstream throttling` was pushed on 2026-08-14 and may already resolve it.

### 4. DEC-162

`05895b5` records DEC-162. Confirm it is present in the right
`PRD/sections/decisions/<domain>.md` file with a current router index line in
`PRD/sections/decisions.md`, on whichever doc set wins.

## Suggested order

1. Read `gh pr view 89 --comments`; establish whether the blocker still holds.
2. Diff the two A–F doc sets; pick one as truth, or merge deliberately.
3. Fix the status marker / README / board to agree.
4. Verify DEC-162 landed in the decisions router.
5. Resume with `thejudge-implement` or, if scope changed, `thejudge-amend`.

## Do not

- Do not delete `origin/rescue/launch-checkout-20260814` until step 2 is done.
- Do not resume from `main`'s A–E plan.
- Do not force-push the PR branch — it holds the only copy of the code.
