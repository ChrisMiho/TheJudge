# Slice F — PRD apply, README pointer, promotion checklist

## Status: planned

## Goal

The product truth matches the code: every accepted amendment is in `PRD/sections/`, the nine code comments, tests or docs that cite amended text agree, and a short pointer in the worked-solutions README tells the owner how to run the suite.

## Requirements

1. Applies the accepted blocks of `GATE-QUESTIONS.md` by intent (verdicts all accept, B1 yes, B2 `output/rulesguru/`):
   - `REQ-232`: confirm the entry built across slices A to E is complete against the accepted block (all criteria, Constraints, Dependencies, Notes); fill any gap.
   - `REQ-185`: the local-suite criterion after the community-sources criterion, the constraint after the "commits only WotC text" constraint, the dependency line at the end of `Dependencies`, plus the B1 promotion criterion right after the local-suite criterion. Keep the recipe change's wording on the lines it rewrote. If an anchor moved, use the placement rule in `DESIGN-BRIEF.md`, "How the build applies it".
   - `REQ-186`: description and approved-only criterion scoped to the suite exception, plus the dependency line.
   - `REQ-188`: case-selection exception and the dependency line.
   - `REQ-226`: the suite-mode sentence and the dependency line.
   - `NFR-018` (`non-functional-requirements.md`): description sentence, gating constraint, dependency line.
   - `goals-and-non-goals.md`: the suite sentence on the answer-gating non-goal.
   - `system-map.md`: the `## Eval harness` Summary and Backed by, and `### Answer-quality baseline` Summary, Lives in and Backed by.
2. The nine amendments at build in code comments, tests or docs, from the dispositions in `DESIGN-BRIEF.md` "Amendment set" and the hit list `evidence/amendment-grep.hits.txt`: update each so it agrees with the amended text; re-run the same grep after and confirm no hit contradicts `REQ-232`.
3. `apps/backend/src/eval/worked-solutions/README.md`: a short section naming the suite as local-only (used with permission, local only), the three import, convert and purge commands, the two `--suite rulesguru` runs, the filters, that the owner runs it from the main checkout, and that the suite is never a gate and never committed. Counts and field names only, no question text. This is where the durable usage note lives (not under `PRD/work/`).
4. Privacy read-through: no committed file contains question text, answer text, a card roll or a per-question result; the only wording on the permission is "used with permission, local only".
5. Promotion checklist (executed in cleanup, not here): the durable PRD truth above is already applied at build; cleanup confirms it and deletes the package folder.

## Acceptance criteria

- [ ] `REQ-185` holds the local-suite criterion, the constraint, the dependency and the B1 promotion line; the recipe change's two rewritten lines are untouched
- [ ] `REQ-186`, `REQ-188` and `REQ-226` carry their accepted scoped edits and a `REQ-232` dependency line
- [ ] `NFR-018` carries the description sentence, the gating constraint and the dependency line
- [ ] `goals-and-non-goals.md` and both `system-map.md` entries carry the accepted edits
- [ ] The `REQ-232` entry is complete against the accepted block, with the same suite folder path `output/rulesguru/` everywhere
- [ ] The nine code, test or doc amendments are applied and the amendment grep shows no line contradicting `REQ-232`
- [ ] The worked-solutions README has the suite pointer section (counts and field names only)
- [ ] Manual: a read-through of the diff finds no suite question, answer, card roll or result text and no wording on the permission beyond used with permission, local only
- [ ] `git diff --stat main -- apps/backend/src/prompt` is empty, and no route, provider or frontend file changed
- [ ] `npm run quality:check` passes
- [ ] `git ls-files output/rulesguru` is empty and `git status --short` shows no path under `output/rulesguru/`

## Verification

```bash
grep -rnE 'REQ-232|output/rulesguru' PRD/sections apps/backend/src/eval/worked-solutions/README.md
git diff --stat main -- apps/backend/src/prompt
git ls-files output/rulesguru
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`, `non-functional-requirements.md`, `goals-and-non-goals.md`, `system-map.md`
- `apps/backend/src/eval/worked-solutions/README.md`
- The code comments, tests or docs named in the amendment hit list rows marked amended at build

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/rulesguru-local-suite/` ready to delete
