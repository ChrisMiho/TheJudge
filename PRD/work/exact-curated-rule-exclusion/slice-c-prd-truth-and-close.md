# Slice C — Apply the PRD truth and close

## Status: done

## Goal

Apply the five accepted `PRD/sections/` slots by intent, add the build record to REQ-179's Notes, and run the final checks so the package is ready to delete.

## Requirements

1. Apply the accepted proposal in `GATE-QUESTIONS.md` to `PRD/sections/` by intent, slot by slot: REQ-179 (its own Description, acceptance, constraint, dependency and note bullets, plus the nine dependent current-state lines in `system-map.md`, `system-map/game-rules-retrieval.md`, `integrations-and-data.md`, `in-depth/README.md`, `quick-lookup/README.md`), REQ-022, REQ-181, REQ-182, REQ-220. The 20 amend rows in the brief's amendment set are the checklist: 18 replacement diffs plus the new REQ-179 bullets. Rows marked no change stay untouched. Amend in place: no new REQ or DEC id, REQ-179's title kept.
2. Verify each applied removed line was present and is now gone, with a line-level grep: `grep -rnE 'rule-number prefix|by prefix|prefix-based|lettered sub-rules|rule IDs or parent rule IDs|bars System 3 from every' PRD/sections/` should return no retrieval hit afterwards. Ranking-boost lines (parent-rule-id boost) are not hits to change.
3. Add a build-record bullet to REQ-179's Notes from `slice-b.evidence.md`: the measured values (or the re-measured ones if PR #273 applied), the lexical first-ship count and the two closing cases' lexical result. Where a measured value equals a number the accepted slot already states, leave that number; where it differs, record the measured value and say so.
4. Leave dated acceptance records of shipped requirements unchanged (REQ-220's 287 of 392 and its 31 goldens line, REQ-222's 6 topic-carried count, REQ-180's values recorded after REQ-179).
5. PRD promotion checklist (executed in cleanup): the durable truth is applied here, in `PRD/sections/`; cleanup confirms it is present, writes the receipt (with slice B's measured values), updates `PRD/work/STATUS.md`, and deletes `PRD/work/exact-curated-rule-exclusion/`. Nothing else needs promoting.
6. Run the full verification: `npm run quality:check`, `npm --workspace apps/backend run test`, `npm run test:scripts`.

## Acceptance criteria

- [ ] REQ-179's Description, acceptance, constraint, dependency and note bullets in `functional-requirements.md` match the accepted slot, with its title and id kept and no new REQ or DEC id added
- [ ] The dependent current-state lines (`system-map.md`, `system-map/game-rules-retrieval.md` lines 43-44, 75, 107 and 124, `integrations-and-data.md`, `in-depth/README.md`, `quick-lookup/README.md` lines 276-277 and 345) describe exact-id exclusion
- [ ] REQ-022, REQ-181, REQ-182 and REQ-220 are amended per their accepted slots (REQ-022 lines 378 and 396, REQ-181 line 4280, REQ-182 line 4320, REQ-220 lines 5810 and 5816)
- [ ] A line-level grep for the stale phrases over `PRD/sections/` returns no retrieval hit, and the rows the amendment set marks no change are untouched
- [ ] REQ-179's Notes carry a build record with the measured values, the lexical first-ship count and the two closing cases' lexical result from slice B
- [ ] `npm run quality:check` passes
- [ ] The backend test suite and the script test suite pass
- [ ] Ship gates: slice criteria satisfied, no secrets committed, public contract unchanged, durable outcomes promoted and the package ready to delete

## Tests

No new test. Final regression run over the whole repo.

## Verification

```bash
grep -rnE 'rule-number prefix|by prefix|prefix-based|lettered sub-rules|rule IDs or parent rule IDs|bars System 3 from every' PRD/sections/
git diff --stat -- PRD/sections
npm run quality:check
npm --workspace apps/backend run test
npm run test:scripts
```

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/system-map.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/quick-lookup/README.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/exact-curated-rule-exclusion/` ready to delete
