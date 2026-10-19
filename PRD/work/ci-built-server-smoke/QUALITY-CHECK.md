# Quality check — ci-built-server-smoke

**Verdict: PASS**

What happened: the design brief, the gate questions and the measurements file
were checked against `PRD/sections/` and the repository on 2026-10-18 (graph
run `graph-20261018-231424`, node `gate-qc`, attempt 1). Nothing blocks
map-out. The package stays at `refined`.

What it means for a player: the proposed check would stop a backend that will
not start, or one that starts with no card data, from reaching production.
Both are caught.

## Blocking findings

None.

## Advisory findings (do not block)

1. No overall timeout is stated for the whole smoke run or for each HTTP call.
   The ready deadline (30 s) is. Map-out should give each fetch a short
   timeout and set `timeout-minutes` on the `built-server` job so a hung
   request cannot stall the job to the six-hour default.
2. The 30 s ready deadline is labelled "proposed". Map-out should fix it as a
   constant in the script and in the unit tests.
3. Only the card data is asserted. A missing rulings, prices or rules file
   still boots clean and would pass. This matches the brief's stated scope
   (the card lookup) and is not a gap against the two named failures.
4. The brief cites GitHub ruleset 15384308 as requiring no status checks. The
   ruleset was re-read: rules are deletion, non_fast_forward and
   pull_request only. Confirmed.

## Checks run

### Proposed diffs against current `PRD/sections/`

| Diff | Target | Result |
| --- | --- | --- |
| NFR-020 append | `non-functional-requirements.md`, after NFR-019 | context line (last NFR-019 note) matches once; file ends there; append applies cleanly |
| Companion, health route | `integrations-and-data.md` `### Optional Endpoint: GET /api/health` | five-line context matches once |
| Companion, deploy guardrails | `system-map.md` `### Deploy and cost guardrails` | four-line removed/context block matches once |
| REQ-166 | `functional-requirements.md` | removed line matches once |
| NFR-012 | `non-functional-requirements.md` | removed line matches once ("against the 6 this workflow uses" occurs once) |

NFR-020 is unused in `PRD/sections/` (zero hits). The last NFR is NFR-019. No
remote branch names NFR-020.

Stable IDs: NFR-020 (new, own block, full diff), REQ-166 (amend, own block),
NFR-012 (amend, own block). The `integrations-and-data.md` and `system-map.md`
edits are carried inside the NFR-020 block with full diffs. No uncovered ID.

### Gate-question format

Every block opens with `What this decides`, `In plain terms` and `What happens
if you say no`. The substance of REQ-175, REQ-237, REQ-166 and NFR-012 is inlined; IDs sit in parentheses as pointers.
`Verdict:` and `Reason:` are blank in all three blocks. The file opens with
`Decide:`.

### Technical claims against the repository

| Claim | Result |
| --- | --- |
| One workflow `.github/workflows/quality-check.yml`; jobs `static`, `backend`, `frontend`, `coverage-merge`, `changes`, `deploy` | confirmed; triggers are `pull_request`, push to `main`, `workflow_dispatch` |
| Gate jobs on Node 22, `deploy` on Node 24, `deploy` has `id-token: write` | confirmed |
| `deploy.needs: [static, backend, coverage-merge, changes]` | confirmed (line 219) |
| Build runs only in `deploy` | confirmed (`npm --workspace apps/backend run build`) |
| Build command `tsc -p tsconfig.build.json`; `typecheck` is `--noEmit` | confirmed in `apps/backend/package.json` |
| `start` is `node dist/index.js`; `index.ts` reads config, `createConfiguredApp`, `listen`; `.env` loaded only when `NODE_ENV=development` | confirmed |
| Lambda handler `apps/backend/dist/lambda.handler` | confirmed in `scripts/aws-bootstrap.sh` |
| `GET /api/health` returns 200 `{ok:true}` | confirmed in `routes/health.ts` |
| `PORT` parsed 1 to 65535 (so `PORT=0` is rejected) | confirmed in `config/index.ts` |
| `dotenv` is a devDependency; Lambda package uses `npm ci --omit=dev` | confirmed |
| Card detail file is committed | confirmed: `git ls-files apps/backend/data` lists `cardDetailByOracleId.json.br` and the other boot files |
| Mock is the default for both providers | confirmed |
| Parity guard `scripts/ci-workflow-parity.test.mjs` requires every `quality:check` leaf in a pull-request job | confirmed. It expands `npm run X` and splits on `&&`, so a `smoke:built-server` script of `build && node script` expands to the same leaves in `quality:check` and in the new job |
| Ruleset requires no status checks | confirmed (see advisory 4) |
| Measurements (build 1.2 s, listen ~0.5 s, 200/200/404, empty-data run gives health 200 and card 404) | recorded with commands and verbatim output; internally consistent |

### Both failures are caught

- Server does not start: the child exit before ready, or the ready deadline,
  fails the check and prints the captured server output.
- Server starts with no card data: health 200 alone would pass, but the Sol
  Ring lookup returns 404 (measured with the data folder removed), and the
  pass rule requires 200 with non-empty `oracleText` and `typeLine`. The unit
  test list names the health-green, card-404 case.

### Agent-readiness

- Measurable acceptance: exact command, exact URLs and statuses, exact body
  shape, exact failure triggers.
- Port: free port found by binding port 0; reason given.
- Environment: provider and key variables stripped; no `.env` or `.secrets/`.
- Timeout and pass/fail rule stated (see advisories 1 and 2 for the gaps).
- No paid API, no `.secrets/`, no AWS, no network, no gitignored dump. All
  boot-time files are committed; the model folder is untouched under mock.
- Open questions from `IDEA.md` all answered with evidence. No blocker
  questions remain.
- Screen-layout row check: not applicable, no user-visible screen changes.
- Technical-design rules: one endpoint and no rules engine untouched; no
  stack, prompt or API change.

### Amendment set

The brief lists 64 grep hits with a disposition per hit. The three "amend"
dispositions (system-map line 537, integrations-and-data lines 160 and 163,
REQ-166 line 3929, NFR-012 line 209) all map to diffs in `GATE-QUESTIONS.md`.
Spot-checks of the unaffected rows found no missed amendment.

## Status

`STATUS.refined` remains the only marker. The `PRD/work/STATUS.md` board row
stays under `## refined`. The README `## Preparation gate` section is left to
the driver.
