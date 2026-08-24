# Surface D — Scripts

## Inventory

`git ls-files scripts | wc -l` → **42** files (includes `scripts/.gitkeep`
and three `.sh` deploy scripts alongside the `.mjs` majority).

## `package.json` script blocks read

Read the `scripts` block of all three `package.json` files (root,
`apps/frontend/package.json`, `apps/backend/package.json`) as part of this
pass — full contents recorded below for slice E's reconciliation.

- Root (`package.json`): `dev`, `dev:mock`, `dev:openai`, `dev:frontend`,
  `dev:backend`, `typecheck`, `test`, `test:scripts`, `coverage:check`,
  `lint`, `lint:fix`, `format`, `format:check`, `quality:check`, `build`,
  `data:build`, `data:refresh`, `data:refresh-combos`,
  `openai:verify-credentials`, `prompt:preview`, `prompt:preview:all`,
  `retrieval:report`, `combo:answer-quality`, `data:scan-vectors`,
  `data:scan-fingerprints`, `data:scan-fingerprints:fresh`,
  `data:scan-hashes`, `data:scan-map`, `skills:ai-sync`, `graph:preflight`.
- `apps/frontend/package.json`: `dev`, `typecheck`, `build`, `preview`,
  `test`, `test:coverage`.
- `apps/backend/package.json`: `dev`, `typecheck`, `build`, `start`, `test`,
  `test:coverage`, `test:eval`.

`DEC-155`'s CI-decomposition guard, `scripts/ci-workflow-parity.test.mjs`,
exists and asserts the CI job set covers every `quality:check` sub-script
(confirmed by reading the file — see Healthy reuse). Recorded there, not as
a new finding, per Material assumption 4.

`data:scan-hashes` is an alias for `data:scan-fingerprints` (both resolve to
`tsx scripts/build-card-hashes.mjs`) — one implementation under two script
names, referenced from `README.md` and three PRD receipts/decisions. Not a
finding: the brief's floor requires two independent implementations, and
this is one implementation with two names, not two.

## Seeding searches run

- Repeated exported symbol names: `grep -rhoE '^export (const|function|async
  function) [A-Za-z0-9_]+' scripts --include='*.mjs'` — surfaced
  `CONFIRM_FLAG` (2), `describePlan` (2), `parseArgs` (2, plus an unexported
  third in `build-card-hashes.mjs`).
- Read every file the search surfaced plus the rest of the surface,
  including the three `.sh` deploy scripts and `scripts/lib/**`.

## Findings

### F-01: Live-call confirmation gate reimplemented in two refresh/report scripts

**Need:** Refuse to make live network/provider calls unless the caller
passes an explicit confirmation flag, and print a dry-run plan explaining
what would happen and how to confirm it — the mechanism `PRD/instructions/
technical-design-rules.md`'s "explicit human approval" rule for any Scryfall
or live-provider call is implemented as, per `thejudge-implement-all`'s own
binding constraint 5.

**Locations:**
- `scripts/refresh-commander-spellbook-data.mjs:22` — `export const
  CONFIRM_FLAG = "--confirm-live-calls"`; `parseRefreshArgs` (line 26-28,
  `{ confirmed: argv.includes(CONFIRM_FLAG) }`); `describePlan` (line
  260-268, "Commander Spellbook refresh plan (no request has been made): ...
  Re-run with ${CONFIRM_FLAG} to ...")
- `scripts/compare-combo-answer-quality.mjs:31` — `export const CONFIRM_FLAG
  = "--confirm-live-calls"`; `parseArgs` (line 37-46, `confirmed:
  argv.includes(CONFIRM_FLAG)` among its other parsed options);
  `describePlan` (line 78-89, "Combo answer-quality comparison plan (no
  provider request has been made): ... Re-run with ${CONFIRM_FLAG} to make
  the N live provider calls.")

**Verdict:** accidental. Three separate pieces of the same mechanism echo
between the two files: the flag string itself (`"--confirm-live-calls"`,
typed independently in both), the `argv.includes(CONFIRM_FLAG)` confirmation
check (embedded in each file's own differently-named arg parser), and the
`describePlan` dry-run template (identical three-part shape: title line
ending "(no ... has been made):", the plan body, a closing "Re-run with
${CONFIRM_FLAG} to ..." line). Nothing shares a common ancestor; both
authors solved "gate a live-call script behind confirmation" from scratch.

**Consolidation:** a small shared module (candidate home: `scripts/lib/
liveCallConfirmation.mjs`) exporting `CONFIRM_FLAG`, an `isConfirmed(argv)`
helper, and a `describeConfirmationFooter(count?)` template line that both
scripts' own `describePlan` functions call into. Touches 2 script files plus
1 new lib file; no CLI-surface change — the flag stays
`--confirm-live-calls` in both.

**Size:** small.

**Complexity removed:** 2 independent places currently define the same
safety-critical flag string; if it were ever renamed or an additional
default-deny check added (e.g. also requiring a `CI` env check), both copies
would need the edit by hand, and a future third confirmation-gated script
(the brief's non-goal list rules out adding one in this package, but nothing
prevents scripts D-1 in a later package) would very likely add a fourth,
independent copy rather than importing a canonical one — none currently
exists to import.

## Healthy reuse

- `scripts/ci-workflow-parity.test.mjs` — confirmed present and exercising
  the `CI_DECOMPOSITIONS` reconciliation the file's own header comment
  describes: keeps `package.json`'s `quality:check` chain and
  `.github/workflows/quality-check.yml`'s per-job decomposition provably
  equivalent. `DEC-155` / Material assumption 4.
- `parseArgs` in `scripts/graph-preflight.mjs:341` and the unexported
  `parseArgs` in `scripts/build-card-hashes.mjs:99` share only a common,
  idiomatic Node CLI-parsing function name; their flag surfaces, return
  shapes, and validation rules are each specific to that script and share no
  logic. Ruled out after reading both in full.
- `refresh-scryfall-data.mjs` deliberately does *not* duplicate
  `refresh-commander-spellbook-data.mjs`'s `CONFIRM_FLAG` gate when it calls
  `performCommanderSpellbookRefresh()` directly — its own comment cites
  `DEC-162`: invoking `data:refresh` is itself the human approval, so no
  second gate is needed inside that chain. Confirmed by reading both files;
  not a finding, and not the same gap as F-01 (F-01 is about two *standalone*
  scripts each reinventing the gate, not about this chain skipping it).
- `scripts/aws-bootstrap.sh` and `scripts/aws-deploy.sh` both use bash
  `${VAR:-default}` parameter-expansion for their own, distinct sets of
  config values — a shared shell idiom, not a duplicated implementation.
  Ruled out after reading both in full.

## Draft coverage-table row

| Directory | Files examined | Findings |
| --- | --- | --- |
| `scripts/**` plus the three `package.json` script blocks | 42 | 1 (F-01) |
