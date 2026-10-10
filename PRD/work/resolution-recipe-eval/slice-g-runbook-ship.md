# Slice G — Runbook, truth sweep, ship gates

## Status: planned

## Goal

The owner can run the paid comparison from one document that outlives this
package, and the product truth reads consistently after every accepted block.

## Requirements

1. `docs/eval/resolution-recipe/RUNBOOK.md`: the command sequence from the brief (manifest check, emit `rr-hard` and `rr-regression`, dry run first, then the owner's `--confirm-live-calls` run, `--resume`, the five compare commands including the noise floor), the cost arithmetic (about $3.55 estimated, likely nearer $2; every live run `--max-cost-usd` 15 or less), the owner's auto-mode allow-rule note, the G4 decision rule exactly as accepted, where the result goes (`docs/eval/resolution-recipe/REPORT.md`, written after the paid run), the grouping of results by "answer already in an attached ruling" using case ids, and the note that harness `latencyMs` is not production `providerElapsedMs`. The runbook states `--confirm-live-calls` only as the owner's step.
2. Re-run the brief's amendment-set grep and check every disposition row: each "amend" and "build" line is done by slices A to F; fix any leftover. Counts reported in the receipt input.
3. Promotion checklist: confirm every accepted block (REQ-230, REQ-228, REQ-187, REQ-224, REQ-185) is present in `PRD/sections/`; nothing durable points into `PRD/work/resolution-recipe-eval/`.
4. Close the build: `npm run quality:check` green.

## Acceptance criteria

- [ ] `docs/eval/resolution-recipe/RUNBOOK.md` exists and names the G4 rule as accepted
- [ ] The runbook lists every command from the brief, the 15 USD cap rule, and no path under `PRD/work/`
- [ ] The amendment-set grep shows no remaining line from the "amend" or "build" dispositions that is stale
- [ ] `grep -rn "PRD/work/resolution-recipe-eval" apps scripts docs PRD/sections` finds nothing durable (the runbook and code do not depend on the package)
- [ ] `git diff origin/main --stat -- apps/backend/src/prompt` is empty and no route or provider file changed
- [ ] `npm run quality:check` passes
- [ ] A reader followed the runbook top to bottom up to the first paid command and found it complete (manual)

## Verification

```bash
npm run quality:check
git diff origin/main --stat -- apps/backend/src/prompt apps/backend/src/routes apps/backend/src/providers
```

## Files touched

- `docs/eval/resolution-recipe/RUNBOOK.md`
- `PRD/sections/functional-requirements.md` (consistency fixes only)

## PRD promotion checklist

- [ ] REQ-230, REQ-228, REQ-187, REQ-224, REQ-185 accepted blocks present in `PRD/sections/functional-requirements.md`
- [ ] No new REQ or DEC (decision log retired); REQ-227 and REQ-226 unchanged

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/resolution-recipe-eval/` ready to delete
