# Slice D — Promote REQ-195 into PRD/sections, together with the code

## Status: done

### D5 manual observation (2026-09-08)

Compared the script path and npm script name written into all four
`PRD/sections/` edits against the real implementation from slices A and C:
`scripts/refresh-and-open-pr.mjs` (the file created in slice A) and
`data:refresh-pr` (the `package.json` entry added in slice C, value
`node scripts/refresh-and-open-pr.mjs`). Both names match exactly what
slice A and slice C actually implemented — no drift from the proposed
names in `GATE-QUESTIONS.md`, so the PRD edits use them verbatim. D5
confirmed true.

## Goal

Apply the approved `GATE-QUESTIONS.md` proposal to durable `PRD/sections/`
truth, by intent against current-state content, in the same PR as the code
from slices A–C — per
`PRD/instructions/graph-workflow-contract.md` (`## Propose / apply / close`),
durable truth is written at build, not deferred to cleanup, for a graph run.

## Requirements

1. Append a `### REQ-195` entry to `PRD/sections/functional-requirements.md`
   immediately after the `### REQ-194` block (currently the file's last entry,
   ending at line 4577) — content by intent from `GATE-QUESTIONS.md`'s
   finalized diff, with the script/npm-script names corrected to whatever
   slices A and C actually implemented if they drifted from the proposed
   `scripts/refresh-and-open-pr.mjs` / `data:refresh-pr`.
2. Amend `PRD/sections/trade-balancer/data/cardPrintingPrices.md`: the
   `Backed by` line adds `REQ-195`, and the static-snapshot bullet documents
   the weekly one-command refresh-and-PR cadence while keeping the
   no-runtime-sync statement intact.
3. Amend `PRD/sections/trade-balancer/README.md`: the `Backed by` line adds
   `REQ-195`, and the first "Prices and freshness" bullet documents the weekly
   refresh-and-PR cadence and that merging + deploying moves the freshness
   line forward.
4. Amend `PRD/sections/system-map.md`'s `Printing-price artifact build` entry:
   `Summary` and `Lives in` name the new wrapper script, `Backed by` adds
   `REQ-195`. Leave the entry's `Status: shipped` line untouched — the base
   artifact-build capability already shipped; this only extends the entry.
5. Do not edit `PRD/sections/decisions.md` — decisions are retired; this is a
   `REQ`, not a `DEC`.

## Acceptance criteria

- [ ] D1: `PRD/sections/functional-requirements.md` contains a `### REQ-195`
      heading positioned after `### REQ-194` and before end of file (or the
      next `### REQ-` heading, if a concurrent package added one), with
      Title/Priority/Description/Acceptance Criteria/Constraints/Dependencies/
      Notes fields present
- [ ] D2: `PRD/sections/trade-balancer/data/cardPrintingPrices.md`'s
      `Backed by` line cites `REQ-195` and the static-snapshot bullet still
      states there is no live fetch/runtime sync
- [ ] D3: `PRD/sections/trade-balancer/README.md`'s `Backed by` line cites
      `REQ-195` and the prices bullet documents the weekly refresh-and-PR
      cadence
- [ ] D4: `PRD/sections/system-map.md`'s `Printing-price artifact build` entry
      names `scripts/refresh-and-open-pr.mjs` in `Lives in` and cites
      `REQ-195` in `Backed by`; its `Status:` line is unchanged (`shipped`)
- [ ] D5: the script path and npm script name written into all four PRD edits
      exactly match the real filenames from slices A and C (manual check —
      no drift between code and docs)

## Verification

```bash
grep -n '^### REQ-195' PRD/sections/functional-requirements.md
grep -n 'REQ-195' PRD/sections/trade-balancer/data/cardPrintingPrices.md
grep -n 'REQ-195' PRD/sections/trade-balancer/README.md
grep -n 'REQ-195' PRD/sections/system-map.md
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
- `PRD/sections/trade-balancer/README.md`
- `PRD/sections/system-map.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/weekly-data-refresh-pr/` ready to delete
