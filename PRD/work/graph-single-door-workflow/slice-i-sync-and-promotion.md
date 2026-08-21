# Slice I — Mirror sync, promotion checklist, ship gates

## Status: planned

## Goal

The package closes clean: both skill trees byte-identical, the whole-package
verification run once against the finished state, and the promotion checklist
written down so cleanup has no judgment left to make.

## Requirements

DEC-167.

1. `npm run skills:ai-sync` run against the finished state, and
   `diff -rq .claude/skills .agents/skills` produces no output. The trees are a
   plain two-way mirror with no expected exclusions.
2. `npm run quality:check` green.
3. The whole-package diff touches only the files the GAMEPLAN's
   `## Files touched across the package` table names. Anything else is out of
   scope and comes out.
4. The out-of-scope set stays untouched:
   `.claude/skills/thejudge-prepare/SKILL.md`,
   `PRD/instructions/preparation-contract.md`,
   `.claude/graph-profile.json`, `scripts/graph-preflight.mjs`,
   `scripts/graph-boundary-hook.mjs`, and the contract's `## Boundaries` list.
5. The PRD promotion checklist below is written into the package. **Execution
   happens in cleanup**, not here.

## PRD promotion checklist — for `thejudge-cleanup`

- [ ] `PRD/sections/functional-requirements.md` — REQ-160..164 present and
      confirmed; no renumbering.
- [ ] `PRD/sections/user-flows.md` — FLOW-021, FLOW-022 present and confirmed.
- [ ] `PRD/sections/decisions/doc-process.md` — DEC-167 body present.
- [ ] `PRD/sections/decisions.md` — DEC-167 router index line present.
- [ ] No `PRD/sections/system-map.md` entry is added. This package ships agent
      process, not product code under `apps/` or `scripts/`; the system-map
      promotion gate does not apply and the last graph package set the
      precedent.
- [ ] Receipt at `PRD/instructions/receipts/graph-single-door-workflow-<date>.md`
      written **before** the folder is deleted, listing every file created,
      updated, and deleted, and the verification results.
- [ ] The receipt records that this package discharges the first follow-up on
      `PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md` —
      intake now lands in the receipt via the `## Intake` section slice G adds.
- [ ] The receipt records that `docs/whatIsGraph/` was **not** committed.
      Sweeping untracked working material into the repository stays the owner's
      call, exactly as the prior receipt stated.
- [ ] `PRD/work/graph-single-door-workflow/` deleted with
      `git rm -r`, and the slug removed from every section of
      `PRD/work/STATUS.md`.
- [ ] No `## Graph run` section: this package is built in an ordinary session
      and holds no `GRAPH-RUN.md`. Do not add an empty one.

## Acceptance criteria

- [ ] I1 — `npm run skills:ai-sync && diff -rq .claude/skills .agents/skills`
      prints nothing.
- [ ] I2 — `npm run quality:check` exits 0.
- [ ] I3 — `git diff --name-only main...HEAD` lists only files named in the
      GAMEPLAN's files table.
- [ ] I4 — `git diff --name-only main...HEAD` contains none of the five
      out-of-scope paths in requirement 4, and the contract's `## Boundaries`
      list is unchanged in `git diff main...HEAD --
      PRD/instructions/graph-workflow-contract.md`.
- [ ] I5 — every slice A–H is `## Status: done` and every criteria file has all
      criteria `true`.
- [ ] I6 — the promotion checklist above is present in this slice doc,
      unexecuted, with each box unticked.
- [ ] I7 — read the four terminal states and the node table in the finished
      contract: confirm the count is still four states and nine nodes, and that
      the only terminal-state text this package moved is the `BLOCKED`
      paragraph. Record the reading.

## Verification

```bash
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
git diff --name-only main...HEAD
git diff main...HEAD -- PRD/instructions/graph-workflow-contract.md
grep -c '"value": false' PRD/work/graph-single-door-workflow/*.criteria.json
```

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/graph-single-door-workflow/` ready to
      delete

## Files touched

- No product files. This slice verifies the finished state and records the
  promotion checklist; the only writes are to this package's own docs.
