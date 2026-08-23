# Design brief — codebase duplication audit

## Summary

Read every hand-authored source file in `apps/frontend`, `apps/backend`, and
`scripts`, and write one document listing every place where the same need is
served by two or more separate implementations. The document names each
duplicated need, every location that serves it, whether it looks deliberate or
accidental, what consolidating it would touch, and how big that would be.

This package changes no product code. Nothing a player sees changes. The
output is a document the owner reads to decide what, if anything, to
consolidate next — each consolidation would be its own package.

## Why it exists

`PRD/instructions/technical-design-rules.md` already carries a
reuse-before-create rule under Design Proposal Rules: shared logic must have a
single authoritative definition, and duplicated constants or functions across
files or the FE↔BE boundary are "a defect, not a style preference". Nothing
enforces it and nothing sweeps for violations. The rule exists; the check
does not.

## Deliverable

One file: `PRD/work/codebase-duplication-audit/DUPLICATION-AUDIT.md`.

Header records the commit SHA the audit was taken against, so a later reader
knows what the snapshot describes.

### Per-finding record

Each finding is a `### F-##` entry with exactly these fields:

- **Need** — the duplicated job, one plain sentence.
- **Locations** — every implementation, as `path:line-range` plus the symbol
  name. Two minimum; a single location is not a finding.
- **Verdict** — `accidental`, `deliberate but consolidatable`, or `healthy`.
- **Consolidation** — the suggested single home, and roughly which files the
  change would touch.
- **Size** — `small`, `medium`, or `large`.
- **Complexity removed** — the ranking value: how many independent places a
  future change to this need must currently be made, and what silently
  diverges if one copy is edited and the others are not.

### Ordering

Findings are ranked by complexity removed, not by duplicated line count. A
three-line constant repeated in six files that must change together outranks a
sixty-line block copied once.

### Required sections

1. **Header** — commit SHA, date, scope, exclusions.
2. **Findings** — `F-##` entries, ranked.
3. **Healthy reuse** — things that look duplicated in a grep but are the
   shared implementation working correctly, recorded so the next reader does
   not re-flag them. `DEC-157` records `src/hooks/useScanCapture.ts` and
   `src/components/ScanCameraSurface.tsx` as measured, intended reuse; carry
   that forward as the first entry.
4. **Coverage table** — every in-scope directory, the file count examined, and
   whether it produced findings. This is what makes "the whole codebase" a
   checkable claim rather than an assertion.

## Scope

In scope: every committed file under `apps/frontend/`, `apps/backend/`, and
`scripts/`, except the exclusions below — plus the `scripts` block of
`package.json` at the repo root and in each workspace.

Concretely, at this commit: 250 source files under `apps/frontend/src`, 70
under `apps/backend/src`, 37 under `scripts` (`.ts`, `.tsx`, `.mjs`, `.js`),
plus CSS, HTML, and the config files that live inside those three trees.

Tests are in scope. Duplicated test setup is the same defect as duplicated
product logic, and `DEC-086` already treated it that way when it extracted
shared `EnrichmentStep` fixtures across three test files. Findings in test
code generally rank lower on complexity removed, and the ranking rule handles
that without a scope carve-out.

### Surfaces

The audit walks five surfaces. Each produces a coverage-table row.

1. Frontend components and hooks — `apps/frontend/src/components/**`,
   `apps/frontend/src/hooks/**`.
2. Frontend lib, types, and styles — `apps/frontend/src/lib/**`,
   `apps/frontend/src/types/**`, top-level `apps/frontend/src/*`,
   `apps/frontend/src/test/**`, and the app's CSS.
3. Backend — `apps/backend/src/**`.
4. Scripts — `scripts/**` plus the three `package.json` script blocks.
5. Cross-boundary — the same need served on two sides of the FE↔BE↔scripts
   boundary. This surface reads the other four's inventories rather than a new
   file set, and it is where the highest-value findings are expected: the
   perceptual-hash recipe (`REQ` acceptance criterion at
   `PRD/sections/functional-requirements.md:629` requires one authoritative
   definition shared by scanner and builder), the player-label list (the
   `PlayerLabel` union in `apps/frontend/src/types.ts` versus `PLAYER_LABELS`
   in `apps/backend/src/constants.ts`), and the frontend `*Policy.test.ts`
   files that assert behavior implemented in `scripts/*.mjs`. These are
   starting points the passes must confirm or dismiss on the code, not
   pre-accepted findings.

### Exclusions

Excluded because they are committed data or binary payloads, not
implementations:

- `apps/frontend/public/data/**` — `cardMetadata.json`,
  `cardPrintingPrices.json`, `cardScanMap.json`, `cardhashes.bin`,
  `cardhashManifest.json`, `cardhashSkiplist.json`, `gameRulesCoreTopics.json`.
- `apps/backend/data/**` — `cardRulingsByOracleId.json`, `gameRules*.json`,
  `commanderSpellbookCombos*.json.gz`.
- `apps/frontend/public/assets/**` — images and audio.
- Binary and generated fixture payloads: `**/__fixtures__/**` files with a
  `.bin`, `.png`, `.jpg`, `.wav`, or `.gz` extension;
  `apps/backend/src/eval/fixtures/*.golden.txt`; captured upstream JSON under
  `apps/backend/src/commanderSpellbook/__fixtures__/`.
- Anything untracked or ignored: `node_modules/`, `dist/`, `coverage/`,
  `output/`, `.tmp/`.

The exclusion is by file kind, not by folder. A `.ts` or `.mjs` file inside a
`__fixtures__` or `test-utils` folder is hand-authored code and stays in
scope — those folders are a known duplication surface, not a data dump.

Out of scope entirely: `.github/workflows/**`, `docs/`, `PRD/`, `.claude/`,
`.agents/`, `.codex/`, `secrets-templates/`, and root-level config files other
than `package.json`'s `scripts` block. A workflow file or root config may be
named as context inside a finding whose duplicated implementations are all in
scope, but it never supplies a location on its own.

## Method

Each surface pass is a read pass over that surface's file inventory, seeded by
searches, not a search alone. Greps find literal repetition; they do not find
two helpers computing the same value by different routes, which is the shape
the owner named. Seeding searches include repeated literal class strings and
magic numbers, repeated exported symbol names, near-identical function
signatures, and parallel handler names for one interaction (open, close,
dismiss, retry).

A finding must clear one floor: at least two independent implementations that
a future change to the same need would have to touch together. Anything below
that floor is not written down.

## Non-goals

- Not a lint or style pass. Naming, formatting, and idiom preferences are out.
- Not a refactor. No product code changes in this package. Every consolidation
  the document suggests is a proposal the owner rules on afterward.
- Not a bug hunt. Correctness defects are recorded only when they fall out of
  the duplication analysis for free.
- No new `PRD/sections/` file, no `system-map.md` entry, and no consolidation
  backlog outside the package. See the assumptions below.

## Verification

- Coverage: every in-scope directory has a coverage-table row, and the file
  counts reconcile against `git ls-files apps scripts` minus the exclusion
  list.
- Every location cited in a finding resolves — the path exists and the named
  symbol is present at the given lines.
- Read-only proof: `git status --porcelain` shows changes only under
  `PRD/work/codebase-duplication-audit/` and `PRD/work/STATUS.md`.
- `npm run quality:check` exits 0, unchanged from the pre-audit baseline. A
  green gate after a package that touched no product code is the cheapest
  proof that none was touched.

## Material assumptions

Recorded per `PRD/instructions/preparation-contract.md`. Each names the ladder
rung that answered it.

1. **The audit document lives in the package and is promoted through the
   receipt, not into `PRD/sections/`.** Rung 3, established local pattern. The
   closest prior run, `PRD/instructions/receipts/consolidate-shared-logic-2026-06-18.md`,
   shipped a pure duplication-removal package with "No new `DEC-###` /
   `REQ-###` / FLOW entries", promoted its one durable outcome into
   `PRD/instructions/technical-design-rules.md`, and recorded its findings —
   including a finding-only inline duplication — in the receipt.
   `PRD/instructions/doc-lifecycle.md` makes receipts durable and never
   deleted with the work folder, and bans execution roadmaps and analysis
   trees outside `sections/`. `sections/system-map.md`'s four-field
   subsystem shape (`DEC-044`, `DEC-048`) does not fit a findings register,
   and its promotion gate requires shipped product code, which this package
   produces none of. So: `DUPLICATION-AUDIT.md` in the package during the run,
   carried into `PRD/instructions/receipts/codebase-duplication-audit-<date>.md`
   at cleanup. Reversible — the owner can promote it later if the findings
   warrant it.

2. **No `PRD/sections/` edit in this package.** Same rung and same evidence.
   The audit adds no product behavior, changes no contract, and states no new
   requirement on the product. The reuse-before-create rule it checks against
   already exists in `technical-design-rules.md`. Adding a `DEC`/`REQ` for a
   one-off read-only sweep would be scope the request does not carry (rung 4,
   smallest reversible scope).

3. **"Committed data corpora" means generated or vendor-sourced data
   artifacts and binary payloads, listed explicitly above.** Rung 1, active
   decisions. `DEC-012` (committed static card metadata), `DEC-029`/`DEC-030`/
   `DEC-032` (rulings and rule-index artifacts), `DEC-051`/`DEC-054`
   (`cardhashes.bin` fingerprint library), `DEC-088` (printing-level price
   artifact), and `DEC-162` (Commander Spellbook gzip corpus) each define a
   committed data artifact produced by the approved offline pipeline. Those,
   plus binary media and generated golden/fixture payloads, are the category.
   Hand-authored code is never in it, wherever it sits.

4. **"Scripts" covers the `scripts/` tree and `package.json` script
   definitions.** Rung 1, active requirements.
   `PRD/sections/non-functional-requirements.md:169` (`DEC-155`) already
   treats `package.json`'s script definitions as a duplication-bearing
   surface: because CI runs `quality:check`'s sub-scripts individually rather
   than the aggregate, an automated guard must assert the CI job set covers
   every sub-script "so the canonical local command and the CI decomposition
   cannot drift apart". That guard is `scripts/ci-workflow-parity.test.mjs`.
   The PRD has already ruled that the same need served in two script
   definitions is a drift risk worth guarding, so script blocks are in scope.
   The existing `DEC-155` guard is recorded under Healthy reuse, not as a new
   finding. `.github/workflows/**` stays out of scope; it is not one of the
   three trees the request named.

5. **Tests are in scope.** Rung 1 and rung 3. `DEC-086` reorganized test files
   and extracted duplicated `EnrichmentStep` setup as an explicit outcome, so
   duplicated test scaffolding is already treated as consolidatable in this
   repo.

## Constraints

- No product-code or product-test edit. Writes are limited to
  `PRD/work/codebase-duplication-audit/` and `PRD/work/STATUS.md`.
- `DEC-159`, `DEC-157`, and `PRD/work/adhoc/refactor-gameplan.md` are
  citations recorded from the intake and were not opened during refinement.
  The audit may report on the code those decisions govern; it reads that code
  directly rather than restating a decision it has not read. The gameplan is
  out of scope for this package entirely.
- The audit is a snapshot. It records the commit SHA and makes no claim about
  later commits.

## Open questions

None. All three questions carried in `IDEA.md` were resolved on the assumption
ladder above; none met the genuine decision blocker test in
`PRD/instructions/preparation-contract.md`, because in each case the PRD or an
established local pattern supplied an authoritative basis and the conservative
choice is reversible without silently deciding product behavior.

## References

- `PRD/instructions/technical-design-rules.md` — reuse-before-create rule.
- `PRD/instructions/doc-lifecycle.md` — durable versus ephemeral doc homes.
- `PRD/instructions/receipts/consolidate-shared-logic-2026-06-18.md` — prior
  duplication-removal run; its outcome and its finding-only residue.
- `PRD/instructions/receipts/test-suite-hygiene-2026-07-01.md` — prior test
  duplication cleanup (`DEC-086`).
- `PRD/sections/non-functional-requirements.md` — `DEC-155` script/CI
  non-duplication requirements.
- `PRD/sections/functional-requirements.md:629` — single authoritative
  perceptual-hash recipe, no FE↔build duplication.
</content>
