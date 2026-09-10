# Receipt — compact-data-extracts — 2026-09-09

**What happened:** The committed Magic-data files the game server loads at
startup — combo details, card rulings, card details, and trade prices — were
compressed one record at a time (gzip per combo variant, individually gzipped
price file). That per-record compression forfeits the savings a shared stream
gets from repeated JSON keys across records, and the full fresh combo corpus
no longer fit inside the 120 MB data budget the Lambda deploy allows. This
ships brotli (a stronger compressor) in 128-combo blocks instead of one gzip
member per combo, plus brotli for rulings/card-detail/prices — recovering the
cross-record savings while a lookup still decodes only the one ~230 KB block
it needs, not the whole file. Committed data is now ~24.75 MB against the
120 MB budget, so the full, untrimmed fresh corpus fits with room to spare.
Every regenerated artifact carries a new file name (`.br` instead of `.gz`/
`.json`), and every place that named the old files — the build scripts, the
loaders, the eval fixtures, the weekly refresh wrapper's committed-path list,
and nine `PRD/sections/` documents — was swept and updated together. Code PR:
https://github.com/ChrisMiho/TheJudge/pull/225 (open, not yet merged).

**What it means for you:** Nothing changes in what a player sees — combo
answers, card rulings, and trade prices look and behave exactly as before.
What changes is that the server now has real headroom under the Lambda size
limit, so a future data refresh won't need to trim low-popularity combos out
of the corpus just to fit. Merge PR #225 to ship this.

## Summary

- Date: 2026-09-09
- Slug: compact-data-extracts
- Status: **shipped**
- Cleanup mode: graph-controlled invocation (node 8, `close`), build-half run
  `graph-20260909-003859`, **PR-ready path** — this receipt and the package
  deletion are committed on the code branch and ride in PR #225, before the
  owner's merge.
- Package classification: autonomous — `README.md` carries `## Autonomous
  metadata` (`Autonomous base: origin/main`), so the PR-ready path of the
  autonomous gate applies.
- PR: https://github.com/ChrisMiho/TheJudge/pull/225

## What shipped

- **Slice A — combo block layout.** `serializeVariantDetail` groups combo
  variants into 128-variant NDJSON blocks in `variantId` order, one brotli
  member per block; build writes `commanderSpellbookComboBlocks.br` (the
  concatenated block members) and `commanderSpellbookComboIndex.json.br` (a
  block directory of `{ offset, length }`); `--trim-committed` re-blocks
  (filter, re-serialize, rewrite) rather than splicing. 6/6 criteria true.
- **Slice B — catalog loader.** `readVariantDetail` reads only the requested
  variant's block byte range, brotli-decodes that one block, and returns the
  correct variant by position/line arithmetic; the 64-entry LRU cache and
  per-variant validation are unchanged; `byOracleId`/`byTemplateOracleId`
  Maps and route responses are byte-identical to pre-slice output. 5/5
  criteria true.
- **Slice C — rulings/detail/prices brotli.** `build-card-rulings.mjs` and
  `build-card-detail-by-oracle-id.mjs` write brotli (fixed named params, no
  dictionary) to `cardRulingsByOracleId.json.br`, `cardDetailByOracleId.json.br`,
  and `cardPrintingPricesByOracleId.json.br`; `cardRulings.ts`, `cardDetail.ts`,
  `cardPrices.ts` decode once at startup with unchanged map shapes; each
  loader still fails open when its committed file is missing. 6/6 criteria
  true.
- **Slice D — filename sweep.** `COMMITTED_ARTIFACT_PATHS` in
  `refresh-and-open-pr.mjs` lists all five renamed artifacts;
  `createConfiguredApp.ts`, the four eval readers, `prompt-fidelity.mjs`,
  `compare-combo-answer-quality.mjs`, `.gitignore`, root `README.md`, and
  `OPERATOR.md` reference no old artifact name; the design brief's
  enumeration grep, re-run, found zero remaining old-name hits outside this
  package's own docs. 6/6 criteria true.
- **Slice E — positional-int index.** The index writes `variantIds: string[]`
  once, in `variantId` order; `byOracleId`/`byTemplateOracleId` are written as
  arrays of integer positions, not repeated variant-id strings; `catalog.ts`
  maps positions back to variant ids at load and still exposes
  `Map<oracleId, string[]>` with byte-identical membership; the combo matcher
  and every consumer is unchanged. 5/5 criteria true.
- **Slice F — regenerate, verify, amend.** Every committed artifact under
  `apps/backend/data/` regenerated from the 2026-09-08 raw sources with the
  finished slice A–E code — five renamed `.br` files present, five old files
  absent; `lambda-package-budget.test.mjs` passes with committed data
  measured at ~24.75 MB against the 120 MB budget; post-load process RSS
  measured at 430.8 MB against the 1769 MB Lambda memory ceiling; all 20
  accepted `GATE-QUESTIONS.md` diffs applied verbatim to the 9 listed
  `PRD/sections/` files; `npm run quality:check` and `npm test` pass. 6/6
  criteria true (F3 manual confirmation).
- All 6 slices done; 34/34 criteria true across
  `slice-{a,b,c,d,e,f}.criteria.json`, matching the build ledger.

## Verification

- Backend suites 90/90 + script suites 65/65 passed at build and at the
  independent fresh-context review (node 7, opus, read-only — no
  Edit/Write). Budget test 2/2; committed data 24.78 MB vs 120 MB measured
  independently at review.
- Re-ran `npm run quality:check` fresh at this cleanup (not reused from the
  build ledger). First run hit one flaky test-timeout under coverage-load
  (`createConfiguredApp.test.ts`'s combo A/B-leg prompt test, 5000ms budget,
  timed out at full-suite load): confirmed it passes in isolation (6/6,
  40ms) and confirmed the full `quality:check` green on immediate re-run —
  exit 0, `typecheck`/`lint`/`format:check`/`coverage:check` all passed,
  frontend 131/131 test files (1318/1318 tests), backend 40/40 test files
  (504/504 tests), `test:scripts` 570/570. No drift since build.
- Slice-D file-name sweep re-confirmed: zero old-name hits, and
  `refresh-and-open-pr.mjs`'s `COMMITTED_ARTIFACT_PATHS` lists all 5 `.br`
  files (no silent weekly-refresh drop).
- Loaders confirmed fail-open when their committed file is missing (mock
  boot with no data present).
- `gh pr view 225 --json state,baseRefName,headRefName,url`: `state: OPEN`,
  `baseRefName: main`, `headRefName: thejudge-auto/compact-data-extracts-work`.
  GitHub API was reachable; no fallback needed.
- Independently re-confirmed at this cleanup by direct read of the live
  branch (not re-derived from the ledger's account) — see
  `## Durable truth confirmed` below.

## Durable truth confirmed

Every item below was checked against the live files on
`thejudge-auto/compact-data-extracts-work` (this branch) at this cleanup —
none was rewritten here, all were applied at `build` (node 6) together with
the code, matching all 20 owner-accepted `GATE-QUESTIONS.md` verdicts
exactly:

- `git diff origin/main -- PRD/sections --name-only` lists exactly 9 files,
  matching slice F's criterion F4 evidence list precisely:
  `PRD/sections/functional-requirements.md`,
  `PRD/sections/non-functional-requirements.md`,
  `PRD/sections/integrations-and-data.md`,
  `PRD/sections/in-depth/README.md`,
  `PRD/sections/trade-balancer/data/cardPrintingPrices.md`,
  `PRD/sections/system-map.md`,
  `PRD/sections/system-map/game-rules-retrieval.md`,
  `PRD/sections/quick-lookup/README.md`,
  `PRD/sections/trade-balancer/README.md`.
- `PRD/sections/system-map.md` — the "Card rulings", "Artifact builders",
  "Printing-price artifact build", "Commander Spellbook combo artifact
  build", and "Prompt preview" entries all name the new `.br` artifacts and
  brotli encoding; every `Status:` line in this diff was already `shipped`
  before this change (description-only updates, no planned→shipped flip
  needed).
- `PRD/sections/functional-requirements.md` — REQ-093, REQ-066, REQ-167,
  REQ-180, REQ-175, REQ-185, REQ-195, REQ-196 amendments present per the
  accepted diffs.
- `PRD/sections/non-functional-requirements.md` — NFR-017 re-measurement
  note (2026-09-08, ~25.6 MB) present.

Nothing was found missing. No promotion was needed at this cleanup — every
outcome the build half applied is present as recorded.

## Autonomous gate: PR-ready path (pre-merge checks)

- **Checkout/branch:** current checkout is
  `.worktrees/implement-compact-data-extracts` with
  `thejudge-auto/compact-data-extracts-work` checked out. After `git fetch
  origin`, this branch's `HEAD` (`9259674`) equals
  `origin/thejudge-auto/compact-data-extracts-work` exactly — nothing
  unpushed, nothing unfetched. `git status --porcelain`: empty (clean).
- **Implementation PR:** #225 is **OPEN**, head
  `thejudge-auto/compact-data-extracts-work`, base `main` — the recorded
  autonomous base — verified via `gh pr view 225
  --json state,baseRefName,headRefName,url`. GitHub API reachable; no
  fallback used.
- **Ship-ready with criteria:** `README.md`/`STATUS.ship-ready` marker
  present; every criterion in every `slice-{a,b,c,d,e,f}.criteria.json` read
  directly and confirmed `true` (34/34, F3 manual).
- **Runtime cleanup:** this package is backend/script-only — no application
  UI, no server, no browser session started by any slice (confirmed by grep
  across the slice docs for playwright/browser/port/process terms: no hits).
  No `PRD/instructions/runtime-process-hygiene.md` criteria were recorded
  for this package, so none apply.

All four checks pass. No worktree and no branch removed on this path — the
owner's `npm run graph:prune -- --apply` lists this worktree and both
branches as merged leftovers once PR #225 lands.

Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/225

## Actions taken

- Wrote this receipt (before any delete).
- Confirmed durable `PRD/sections/` truth present (no rewrite — see
  `## Durable truth confirmed`).
- Removed the `compact-data-extracts` row from `PRD/work/STATUS.md`
  (`## ship-ready` section).
- Deleted the work package: `git rm -r PRD/work/compact-data-extracts/`.
- Re-ran `npm run quality:check` twice: first run showed one flaky
  test-timeout under load, confirmed a non-issue (isolation pass + clean
  full re-run, exit 0) — see `## Verification`.
- Did **not** merge or close PR #225, did **not** push to `main`, and did
  **not** delete any remote branch. Committed on
  `thejudge-auto/compact-data-extracts-work` and pushed that branch (never
  `main`).

## Files

- Created: `PRD/instructions/receipts/compact-data-extracts-2026-09-09.md`
  (this receipt)
- Updated: `PRD/work/STATUS.md` (`## ship-ready` row removed)
- Deleted: `PRD/work/compact-data-extracts/` (entire package, including
  `GRAPH-RUN.md`, `GATE-QUESTIONS.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`,
  `IDEA.md`, `README.md`, `STATUS.ship-ready`, `intake/GRAPH-BRIEF.md`, six
  `slice-*.md` docs, and six `slice-*.criteria.json` files)

## Graph run

- Run ID: `graph-20260908-233747` (spec-forming half) /
  `graph-20260909-003859` (build half) | Profile: `loaded (env sentinel)` |
  Terminal state: COMPLETE — land: the owner's merge of
  https://github.com/ChrisMiho/TheJudge/pull/225

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `degraded (no run state)` | branch `thejudge-auto/compact-data-extracts` pushed from `.worktrees/kickoff-compact-data-extracts` (remote at 86db681); canary denied (universal `rm -rf`, graph-tier `nohup`); profile loaded (env sentinel); launch checkout `git status --porcelain` empty before and after | 2026-09-08 |
| 2 | shape | sonnet | ok | `degraded (no run state)` | commit `6a3de5f` on run branch — `PRD/work/compact-data-extracts/{IDEA.md,README.md,STATUS.ideation,intake/GRAPH-BRIEF.md}` + `PRD/work/STATUS.md` ideation row; 7 prior-run matches recorded in IDEA.md | 2026-09-08 |
| 3 | define | opus | ok | `1 → 38` | commit `c5e8c93` on run branch — DESIGN-BRIEF.md (slices A–F) + GATE-QUESTIONS.md (18 stable-ID slots: REQ-093/066/175/195/196/185, NFR-017, integrations-and-data, in-depth/README, trade-balancer cardPrintingPrices, system-map ×5 entries, game-rules-retrieval, quick-lookup/README, trade-balancer/README); STATUS.refined; no blocker questions | 2026-09-08 |
| 4 | gate-qc | sonnet | failed | `1 → 63` (cap 60 reached; verdict delivered and committed within grace) | FAIL commit `4b9a517` — STATUS.refined→refining. Amendment set incomplete: misses REQ-167 + REQ-180 (functional-requirements.md) and 4 more `integrations-and-data.md` lines that name `cardDetailByOracleId.json` without a proposed `.json.br` rename; after rename they'd describe a nonexistent file. GATE-QUESTIONS form well-formed; PRD/sections untouched. Loop 1→define | 2026-09-09 |
| 3 | define | opus | ok | `1 → 30` | attempt 2 (loop 1 fix). Commit `30d47ef` — amendment set closed at 20 slots: ADDED REQ-167, REQ-180; EXTENDED integrations-and-data (all 4 card-detail lines) + NFR-017 stale-name note. Re-enumerated by grep; every before-text verbatim vs PRD/sections; PRD/sections untouched. STATUS.refined | 2026-09-09 |
| 4 | gate-qc | sonnet | ok | `1 → 28` | attempt 2 PASS. Amendment set verified complete by reviewer's own grep — 20 slots cover every PRD/sections line that goes stale after the brotli/rename change; all before-text byte-identical; GATE-QUESTIONS well-formed; PRD/sections unedited. STATUS stays refined. Run stops here (docs PR + owner-action park) | 2026-09-09 |
| — | gate-review | sonnet | ok | `1 → 22` | build half run `graph-20260909-003859`. All 20 owner verdicts `accept` applied inside GATE-QUESTIONS.md (no edit/reject); STATUS.owner-action→refined; README status→refined; `## Gate verdicts` table added; `## Open gate` resolved; `PRD/work/STATUS.md` board row owner-action→refined; PRD/sections untouched | 2026-09-09 |
| 4 | gate-qc | sonnet | ok | `1 → 18` | build-half re-grade after gate resolution. PASS. Reviewer re-ran the amendment-set grep independently — 8 PRD/sections files all covered by the 20 slots; every slot's before-text byte-identical to current truth; GATE-QUESTIONS well-formed; `git diff origin/main -- PRD/sections` empty. Byte-identical to the proposal that passed at `30d47ef`/#224. STATUS stays refined; `## Preparation gate` in README already PASS | 2026-09-09 |
| 5 | plan | sonnet | ok | `1 → 39` | GAMEPLAN.md + 6 slice docs (A–F) + 6 `slice-*.criteria.json` (34 criteria, all `false`; F3 `manual`); STATUS.refined→active; README status→active + slice table; `PRD/work/STATUS.md` board row refined→active; PRD/sections untouched (`git status` clean). Build order A→B→C→D→E→F; risk flagged: slice D `COMMITTED_ARTIFACT_PATHS` silent-drop + brotli byte-determinism | 2026-09-09 |
| 6 | build | sonnet | ok | `1 → 437` | 6 slice commits `ec40977`(A)→`7b4003a`(B)→`21d0854`(C)→`86a673c`(E)→`b751bbe`(D)→`9313e1e`(F) (E before D per its dependency table). 34/34 criteria true (F3 `manual`). Committed data 24.75 MB vs 120 MB budget (~95 MB headroom); post-load RSS 430.8 MB vs 1769 MB ceiling. Old formats deleted (`.gz`/raw `.json`), 5 `.br` added. PRD/sections written only at slice F (9 files, the accepted slots). Code PR #225 opened → main. STATUS.active→ship-ready. REQ-193: launch checkout `git status --porcelain` byte-identical to pre-dispatch baseline (empty); all writes committed on the worktree branch. **KNOWN GAP:** evidence log had 0 entries for this run — the hook resolves the criteria-bookkeeping root to the launch checkout, which lacks this branch-only slice docs, so the earned-criteria flip-guard was degraded; criteria were set `true` on the build agent's shown-command verification, not the hook's independent gate. Heartbeat `1→437` + run-start canary still prove the hook fired; independent integrity check carried by review (node 7) | 2026-09-09 |
| 7 | review | opus | ok | `1 → 32` | APPROVE — no Critical/Important. No-write reviewer (read/search only), fresh context, re-verified independently (criteria.json marks distrusted per the degraded evidence log): budget test 2/2, committed data 24.78 MB vs 120 MB; backend suites 90/90 + script suites 65/65 pass; slice-D file-name sweep zero old-name hits and `refresh-and-open-pr.mjs` COMMITTED_ARTIFACT_PATHS lists all 5 `.br` (no silent weekly-refresh drop); loaders fail open; PRD apply-by-intent = 9 files, 54/54, matches the 20 accepted verdicts, nothing beyond the slots. One Nit only (stale prose in `commander-spellbook-eval-catalog.json` comment; not a loaded path, out of slice-D grep scope) — not actionable, no loop-back | 2026-09-09 |
| 8 | close | sonnet | ok | `1 → 29` | `thejudge-cleanup` on the code branch before merge. Verified STATUS.ship-ready + 34/34 criteria + reviewer APPROVE; confirmed durable PRD/sections truth already applied at build (9 files = the 20 accepted verdicts, nothing leftover to promote). Receipt written with `## Node ledger` + `## Instruction ledger` folded verbatim under `## Graph run`; `## Intake` names `intake/GRAPH-BRIEF.md`. `quality:check` clean re-run (frontend 131/131, backend 40/40, scripts 570/570; one flaky coverage-load timeout cleared on isolated + full re-run). PRD/work/compact-data-extracts/ deleted (20 files); PRD/work/STATUS.md row removed. Commit `db7ba9b` pushed → PR #225 (still OPEN; no merge/close/branch-delete). Driver appended this row post-cleanup (GRAPH-RUN.md gone; receipt is the ledger's durable home) | 2026-09-09 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Re-encode the committed backend data extracts (brotli, 128-combo blocks) so the full fresh corpus fits the 120 MB Lambda budget without trimming." | answered-once | shape | — |

## Intake

- `intake/GRAPH-BRIEF.md` — origin: staged verbatim from
  `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/.graph-intake/graph-20260908-233747/`
  at node 2 (`shape`), per `GRAPH-RUN.md`'s ledger row for that node.

## Probe evidence folded at owner cleanup — 2026-09-09

The intake brief came from the investigate-first probe
`PRD/work/probe-data-extract-size/` (2026-09-08). Its findings file held the
measured alternatives that the brief only summarised, and nothing else in the
PRD records them. They are folded here so the decisions stay re-checkable;
the probe folder (findings, measurement scripts, logs) was deleted after this
fold. The scripts targeted the old per-variant gzip layout and no longer run
against the committed files.

All numbers measured on the owner's Apple laptop against `main` at 908fd6a
and a fresh 108,484-variant combo build from the 2026-09-08 raw Commander
Spellbook export. Sizes are committed on-disk bytes, which is what the budget
test counts.

### Where the bytes were (committed on `main`, before this change)

| File | Committed | Encoding | Raw JSON |
| --- | ---: | --- | ---: |
| `commanderSpellbookCombos.json.gz` | 74.95 MB | one gzip member per combo | 171 MB |
| `cardRulingsByOracleId.json` | 18.61 MB | raw minified JSON | 18.61 MB |
| `cardDetailByOracleId.json` | 12.67 MB | raw minified JSON | 12.67 MB |
| `cardPrintingPricesByOracleId.json.gz` | 4.76 MB | single gzip | 16.05 MB |
| `commanderSpellbookComboIndex.json.gz` | 4.30 MB | single gzip of prettier-formatted JSON | 24.15 MB |
| game-rules files (5) | 3.74 MB | raw / int8-base64 | |
| **Total tracked** | **119.03 MB** | | 0.97 MB headroom; 137.3 MB with the fresh corpus |

Raw combo-detail bytes by field (191.8 MB fresh): `cardIngredients` 29 %,
`steps` 24 %, `templateIngredients` 21 % (37.9 MB of it a verbatim copy of
`index.templates[*].oracleIds`), `producedEffects` 9 %, `sourceUrl` 3 %.

### Codec per file, nothing restructured

| File | Raw | gzip -9 | brotli q11 | zstd 19 | brotli decode |
| --- | ---: | ---: | ---: | ---: | ---: |
| rulings | 18.61 MB | 4.71 MB | **1.47 MB** | 1.53 MB | 29 ms |
| card detail | 12.67 MB | 2.87 MB | **1.57 MB** | 1.63 MB | 14 ms |
| prices | 16.05 MB | 4.65 MB | **3.41 MB** | 3.53 MB | 40 ms |
| combo index (fresh, prettier) | 46.64 MB | 6.30 MB | **2.42 MB** | — | — |
| game rules rule index | 2.04 MB | 0.30 MB | 0.20 MB | 0.22 MB | 2 ms |
| rule embeddings | 1.44 MB | 1.04 MB | 1.00 MB | 1.02 MB | 8 ms |

Brotli won every file, 2–3× over gzip on the text-heavy ones. Zstd was within
5 % and 3–4× faster to build, but its `zlib` binding is newer (v22.15 / v23.8);
brotli was chosen as smaller and available on every Node the repo runs (22 CI,
24 Lambda, 26 local). `gameRulesRuleIndex.json` was left raw: it is re-hashed
by the embeddings build (`ruleIndexHash`) and the gain is 1.8 MB.

### Combo detail layouts (the real lever)

| Layout | gzip -9 | brotli q11 | zstd 19 | Random read of one combo |
| --- | ---: | ---: | ---: | ---: |
| per-record (old) | 90.96 MB | 77.63 MB | 89.43 MB | 0.02 ms |
| blocks of 32 | 32.65 MB | 17.53 MB | 19.35 MB | ~0.1–1 ms |
| **blocks of 128** (chosen) | 30.09 MB | **12.99 MB** | 14.19 MB | **0.34 ms** (measured through a file handle) |
| blocks of 512 | 29.44 MB | 10.63 MB | 11.45 MB | ~1–2.5 ms |
| one stream (lower bound, no random access) | 29.20 MB | — | 6.44 MB | n/a |
| per-record zstd19 + 70 KB shared dictionary | | | 43.12 MB | 0.012 ms |
| per-record brotli11 + 70 KB shared dictionary | | 39.63 MB | | 0.043 ms |
| per-record zstd19 + 90 KB shared dictionary | | | 46.55 MB | 0.026 ms |
| per-record brotli11 + 90 KB shared dictionary | | 43.94 MB | | 0.036 ms |

- **Blocks of 128 won.** 512 saves 2.4 MB more but quadruples the read; 32
  costs 4.5 MB more. One decoded block is ~230 KB, held only for the read; at
  most five combos enter a prompt, so the per-request worst case is ~2 ms.
  Build time ~80 s at brotli q11 (gzip 2 s, zstd 19 24 s), inside a weekly
  `data:build` that already streams a 646 MB export.
- **Shared dictionary rejected.** It keeps one-record reads but lands at 3×
  the block layout: the savings come from the ~230 KB of neighbouring combos
  a block shares, which no ~100 KB dictionary can carry. It also adds an
  artifact that must stay byte-identical between build and runtime, and
  Node 22 (CI) silently ignores the brotli `dictionary` option while Node 24
  (Lambda) honours it, so a dictionary-built artifact would decode on Lambda
  and fail in CI.
- **"Slim" detail records rejected.** Dropping `sourceUrl` and the template
  `oracleIds` lists duplicated from the index saves a further 4 MB on the
  block layout (13.0 → 8.9 MB). Not taken: it would make a detail record
  depend on the index to validate, against the per-record integrity model in
  `catalog.ts`. Documented lever only.

### Combo index forms

| Index form | Raw | gzip -9 | brotli q11 |
| --- | ---: | ---: | ---: |
| as built before (prettier) | 46.64 MB | 6.30 MB | 2.42 MB |
| minified | 18.65 MB | 4.02 MB | 1.89 MB |
| **positional ints** (chosen, slice E) | 12.25 MB | 3.09 MB | 1.38 MB |

The positional-int form's payoff is cold start and resident memory, not
budget: it cuts the JSON parsed at every cold start from 47 MB to 12 MB.

### The owner's hypothesis: one per-card record for prices + rulings + detail

| Shape | Raw | gzip -9 | brotli q11 | zstd 19 |
| --- | ---: | ---: | ---: | ---: |
| three separate files | 47.34 MB | 12.23 MB | 5.77 MB | 6.68 MB |
| one merged per-card file | 45.55 MB | 12.51 MB | 5.60 MB | 6.03 MB |
| **difference** | −1.8 MB | +0.29 MB | **−0.17 MB** | −0.65 MB |

The only bytes a merge removes are the repeated 36-character oracle-id keys,
and a compressor already removes those. Rejected: it would also put price
bytes on the ask-ai path (REQ-175) and REQ-093 forbids folding corpora
together. A restructured price file (set names in a lookup table, printings
as tuples) measured 3.28 MB vs 3.41 MB brotli as-is; not worth a schema change.

### Rejected without measurement

Each fails on an axis the numbers cannot change: S3 range reads at runtime
(adds a network hop and a runtime data dependency DEC-162 avoids),
container-image Lambda (replaces the DEC-169 zip deploy, worse cold start),
Lambda layers (same 250 MB quota), EFS (new infra and a monthly charge),
SQLite or any database (owner-excluded), raising `MIN_VARIANT_POPULARITY`
(drops combos players see; stays in the code as the emergency valve, unused).

### Cold start and the memory raise (2026-09-08 evening)

Measured because the owner reported Trade Balancer price lookups feeling slow
after PR #212 moved prices behind `GET /api/cards/:oracleId/prices`.

| Price route hit, against the live Function URL | 512 MB (before) | 1769 MB (after) |
| --- | ---: | ---: |
| cold start over the wire | 12.3 – 13.6 s | **5.07 s** |
| first-invocation `Duration` (CloudWatch) | 8.6 – 10.2 s | **2.40 s** |
| `Init Duration` | 0.84 s | 0.66 s |
| `Max Memory Used` | 491 MB of 512 | 497 MB of 1769 |
| warm over the wire | 168 – 205 ms (~105 ms DNS + TLS) | 182 – 219 ms |
| warm in-Lambda | 2 – 4 ms | 2 – 3 ms |

The same startup on the laptop takes ~0.6 s (rulings 59 ms, card detail
66 ms, prices 82 ms, combo index 112 ms, transformers + ONNX + sharp import
118 ms, first embedding 70–280 ms) at ~660 MB RSS. At 512 MB the Lambda has
roughly a third of a vCPU and was 21 MB from its memory cap during cold
start: CPU starvation and near-OOM at once. The owner raised the function to
1769 MB (`aws lambda update-function-configuration`, then
`scripts/aws-bootstrap.sh` synced, PR #221). The ~2.6 s between the in-Lambda
3.1 s and the 5.1 s on the wire is AWS fetching the then-137 MB package onto a
fresh instance; the smaller package from this change trims that a little.
Cost at 1769 MB and 85 invocations / 30 days is four orders of magnitude
inside the free tier. The encoding change itself is neutral for cold start
(brotli decode adds ~20 ms on the price file). Provisioned concurrency or a
warm ping remain owner options if cold starts must go away entirely.

Loose ends noted and left: the 130 MB non-data reserve was measured on macOS
and NFR-017 still flags it as "to be re-measured on the CI runner"; with
≈94 MB of data headroom it no longer threatens deploys.
