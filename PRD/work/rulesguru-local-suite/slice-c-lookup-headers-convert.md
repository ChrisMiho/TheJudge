# Slice C — Name lookup, header mapping, convert

## Status: done

## Goal

The owner can turn frozen raw questions into local draft cases, with every card resolved by name from committed data and every cited rule mapped to the rule index, proven on invented questions only.

## Requirements

1. Applies the accepted `REQ-232` block: add the convert, full name lookup, bare keyword headers and kept-but-excluded criteria to the `REQ-232` entry.
2. `scripts/lib/rulesguru-card-names.mjs`: keys are every oracle id in `cardDetailByOracleId.json.br`; names from `cardMetadata.json`, then `cardScanMap.json` for ids it omits (sources injectable). Match exact, then case-insensitive, then accent-folded; `A // B` also answers to `A`. A non-token card beats a token; two non-token matches are unresolved.
3. `scripts/lib/rulesguru-rules.mjs`: a cited id in the rule index maps to itself; an absent id with lettered subrules maps to all of them (prefix followed by a letter, so `702.16` never matches `702.160`); any other absent id excludes the case as `unknown-rule`. Each cited id is one rule group.
4. `scripts/lib/rulesguru-convert.mjs` and `scripts/rulesguru-convert.mjs`: reads `raw/` and committed data only, no network, deterministic. Writes `cases/rulesguru-<id>.case.json` in the shape in `DESIGN-BRIEF.md` (tier `external`, draft review, `expected.outcome` null, `suite` and `source` blocks with licence `used with permission, local only`, empty layers, `computeSnapshot` over committed data) and `convert-report.txt` (counts, excluded ids and reasons, local only). Exclusions kept, never selected: `unresolved-card`, `ambiguous-card`, `no-cited-rule`, `unknown-rule`, `duplicate-question`. Fails loudly on a missing API field. Runs the ignore guard first. `package.json` gains `eval:rulesguru:convert`.
5. The build never runs convert against real suite data.

## Acceptance criteria

- [x] Name lookup resolves exact, case-insensitive, accent-folded and front-face names from injected sources, and ignores an id absent from card detail
- [x] A token loses to a non-token; two non-token matches are unresolved
- [x] A present rule id maps to itself; a bare header maps to its lettered subrules only (not `702.160`); an unknown id excludes the case
- [x] Synthetic raw files convert to case files that pass the external-mode loader, with the brief's field values (tier, review, null outcome, source licence wording, suite block, group arrays)
- [x] Each exclusion reason is produced by a test case and the case file is still written with `suite.excluded` set
- [x] Two converts of the same inputs give identical bytes; the snapshot is computed from injected sources
- [x] Convert fails loudly on a missing field and makes no network call; tests use temporary folders and invented questions only
- [x] `package.json` has `eval:rulesguru:convert`; the entry runs the ignore guard first
- [x] The `REQ-232` entry gains the convert, name lookup, header and excluded criteria
- [x] `npm run test:scripts` passes

## Verification

```bash
node --test scripts/lib/rulesguru-card-names.test.mjs scripts/lib/rulesguru-rules.test.mjs scripts/lib/rulesguru-convert.test.mjs
npm run test:scripts
```

## Notes (evidence, self-reported; re-run to confirm)

- C1, C2: `node --test scripts/lib/rulesguru-card-names.test.mjs` 4 pass, 0 fail.
- C3: `node --test scripts/lib/rulesguru-rules.test.mjs` 4 pass, 0 fail.
- C4 to C7: `node --test scripts/lib/rulesguru-convert.test.mjs` 5 pass, 0 fail (invented questions, temporary folders, injected sources; the cases pass `loadGoldCases(dir, { external: true })`).
- C8: `package.json` has `eval:rulesguru:convert`; `scripts/rulesguru-convert.mjs` calls `assertSuiteIgnored()` first in `main()`. The entry was never run (it would read the suite folder).
- C9: `grep -n "full name lookup" PRD/sections/functional-requirements.md` finds the criterion; convert, name lookup, bare keyword headers and kept but excluded are all in the `REQ-232` entry.
- C10: `npm run test:scripts` 828 pass, 0 fail.
- Sanity on committed data only (not a test): `buildCardNameIndex(await loadCardNameSources())` names 34,973 oracle ids, matching `evidence/name-lookup-counts.out.txt`.
- Decision: an excluded external case may carry no deciding rule (no-cited-rule, unknown-rule), so external mode relaxes the "at least one decidingRuleIds" rule for cases with `suite.excluded` set. Selectable cases still need one. Needed so every kept-but-excluded case still loads.
- Assumption (raw field names): convert reads `id, level, complexity, tags, includedCards[].name, questionSimple, answerSimple, citedRules`; level `4` or text containing "corner" becomes `corner`. A missing field fails loudly, naming the file, so a shape mismatch shows on the owner's first convert and costs nothing.

## Files touched

- `scripts/lib/rulesguru-card-names.mjs`, `.test.mjs`
- `scripts/lib/rulesguru-rules.mjs`, `.test.mjs`
- `scripts/lib/rulesguru-convert.mjs`, `.test.mjs`
- `scripts/rulesguru-convert.mjs`
- `package.json`
- `PRD/sections/functional-requirements.md` (REQ-232 criteria)
