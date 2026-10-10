# Slice C — Name lookup, header mapping, convert

## Status: planned

## Goal

The owner can turn frozen raw questions into local draft cases, with every card resolved by name from committed data and every cited rule mapped to the rule index, proven on invented questions only.

## Requirements

1. Applies the accepted `REQ-232` block: add the convert, full name lookup, bare keyword headers and kept-but-excluded criteria to the `REQ-232` entry.
2. `scripts/lib/rulesguru-card-names.mjs`: keys are every oracle id in `cardDetailByOracleId.json.br`; names from `cardMetadata.json`, then `cardScanMap.json` for ids it omits (sources injectable). Match exact, then case-insensitive, then accent-folded; `A // B` also answers to `A`. A non-token card beats a token; two non-token matches are unresolved.
3. `scripts/lib/rulesguru-rules.mjs`: a cited id in the rule index maps to itself; an absent id with lettered subrules maps to all of them (prefix followed by a letter, so `702.16` never matches `702.160`); any other absent id excludes the case as `unknown-rule`. Each cited id is one rule group.
4. `scripts/lib/rulesguru-convert.mjs` and `scripts/rulesguru-convert.mjs`: reads `raw/` and committed data only, no network, deterministic. Writes `cases/rulesguru-<id>.case.json` in the shape in `DESIGN-BRIEF.md` (tier `external`, draft review, `expected.outcome` null, `suite` and `source` blocks with licence `used with permission, local only`, empty layers, `computeSnapshot` over committed data) and `convert-report.txt` (counts, excluded ids and reasons, local only). Exclusions kept, never selected: `unresolved-card`, `ambiguous-card`, `no-cited-rule`, `unknown-rule`, `duplicate-question`. Fails loudly on a missing API field. Runs the ignore guard first. `package.json` gains `eval:rulesguru:convert`.
5. The build never runs convert against real suite data.

## Acceptance criteria

- [ ] Name lookup resolves exact, case-insensitive, accent-folded and front-face names from injected sources, and ignores an id absent from card detail
- [ ] A token loses to a non-token; two non-token matches are unresolved
- [ ] A present rule id maps to itself; a bare header maps to its lettered subrules only (not `702.160`); an unknown id excludes the case
- [ ] Synthetic raw files convert to case files that pass the external-mode loader, with the brief's field values (tier, review, null outcome, source licence wording, suite block, group arrays)
- [ ] Each exclusion reason is produced by a test case and the case file is still written with `suite.excluded` set
- [ ] Two converts of the same inputs give identical bytes; the snapshot is computed from injected sources
- [ ] Convert fails loudly on a missing field and makes no network call; tests use temporary folders and invented questions only
- [ ] `package.json` has `eval:rulesguru:convert`; the entry runs the ignore guard first
- [ ] The `REQ-232` entry gains the convert, name lookup, header and excluded criteria
- [ ] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/lib/rulesguru-card-names.test.mjs scripts/lib/rulesguru-rules.test.mjs scripts/lib/rulesguru-convert.test.mjs
npm run test:scripts
```

## Files touched

- `scripts/lib/rulesguru-card-names.mjs`, `.test.mjs`
- `scripts/lib/rulesguru-rules.mjs`, `.test.mjs`
- `scripts/lib/rulesguru-convert.mjs`, `.test.mjs`
- `scripts/rulesguru-convert.mjs`
- `package.json`
- `PRD/sections/functional-requirements.md` (REQ-232 criteria)
