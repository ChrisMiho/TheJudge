# Receipt — remove-dead-card-back-detector (2026-09-02)

**What happened:** The card scanner's dormant, never-called card-back detector
was deleted from the engine — the `isCardBack()` method, its `CARD_BACK_THRESHOLD`
constant, and the `cardBack` field/write in `apps/frontend/src/lib/scan/identify.ts`.
The live `_card_back` database-exclusion filter is untouched. The owner accepted
the product-truth change (DEC-055) at the graph run's `define` gate before any code
was removed.

**What it means for you:** Nothing changes when you scan a card — the scanner
identifies cards exactly as before; this only removes dead code. The one
trade-off, which you accepted: re-enabling the "Flip the card over" card-back
prompt later now costs more — it needs the detector reimplemented, not just a
`_card_back` reference image added. **Action: none — this shipped to `main`.**

- **Date:** 2026-09-02
- **Slug:** remove-dead-card-back-detector
- **Status:** shipped (merged to `main`)
- **Recorded autonomous base:** `origin/thejudge-auto/codehealth-20260901-1457-1-deadcardback`
  (auto-deleted on merge — a normal end state)
- **Merge trail:** implementation PR #161 (`-work` → base, merge commit `ef38599`)
  merged into the base; base→main PR #157 (merge commit `a24a7f6`) merged into
  `main`. Both merge commits are ancestors of `origin/main`.

## What changed

- **Code (via PR #161 → base → PR #157 → main):**
  `apps/frontend/src/lib/scan/identify.ts` — deleted `isCardBack()`,
  `CARD_BACK_THRESHOLD`, the `cardBack` field and its constructor write; the
  `CARD_BACK_ID` skip branch that excludes `_card_back` from the searchable set is
  unchanged. Sole source file changed.
- **Durable product truth (applied by refinement at the `define` step, on the base
  branch, per the pre-`graph-shipping-mode-phase1` flow this run began under):**
  5 `PRD/sections/` files — `functional-requirements.md`, `integrations-and-data.md`,
  `scan/README.md`, `scan/data/cardhashes.md`, `system-map.md` — record the
  post-deletion state (no detector; `_card_back` still DB-excluded; re-enable now
  needs a reimplemented detector). No new stable IDs. `system-map.md` already
  reflects the shipped state, so no separate planned→shipped flip is needed.

## Verification

- Fresh repo-wide grep (`isCardBack`, `CARD_BACK_THRESHOLD`, `cardBack`, excluding
  `dist/`): zero source hits after deletion; zero on `origin/main`.
- `apps/frontend` tests: 1302 passed / 129 files, including the
  `CardIdentifier.identify` golden-vector suite (byte-for-byte identical expected
  output).
- `apps/frontend` typecheck clean; repo-root `npm run quality:check` green.
- Independent no-write reviewer: APPROVE against all six slice-A acceptance
  criteria (A1–A6).

## Deviation from the clean two-run flow

The base→main PR (#157) was merged at the `land` step, **before** `close` ran — the
"base→main PR merges last" hazard. Because the base branch auto-deletes on merge,
`close` could not push its receipt through the base PR, and a graph run cannot push
to `main`. Recovery: this receipt and the work-folder deletion ship as this
separate cleanup PR into `main`. The substantive outcome (the code deletion) was
unaffected and is already on `main`.

## Graph run

- Run ID: `graph-20260901-150630` | Profile: `loaded (env sentinel)` at run one;
  run two resumed in a plain session (`unverified`), with the committed boundary
  hook as the enforcer (graph canary denied under the lock) | Terminal state: `COMPLETE`

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `— → 6` | branch `thejudge-auto/codehealth-20260901-1457-1-deadcardback` pushed to origin; tree clean; both canaries denied | 2026-09-01 |
| 2 | shape | sonnet | ok | `— → 25` | package `PRD/work/remove-dead-card-back-detector/` created (IDEA.md, README.md, STATUS.ideation, intake/); prior-run matches recorded | 2026-09-01 |
| 3 | define | opus | ok | `— → 46` | `thejudge-refinement`: judged product decision; wrote 5 `PRD/sections/` edits (no new IDs) + `DESIGN-BRIEF.md`; `STATUS.refined`; `GATE-QUESTIONS.md` written (non-empty diff) | 2026-09-01 |
| 4 | gate-qc | sonnet | ok | `— → 29` | `thejudge-quality-check`: PASS — brief aligned + slice-ready; line numbers, zero-callers, and 5 `PRD/sections/` edits all verified; delete-vs-keep correctly routed to `GATE-QUESTIONS.md` | 2026-09-01 |
| — | gate-review | sonnet | ok | `— → 15` | `graph-gate-review`: applied `DEC-055` accept (no-op on recorded diff); status restored `refined`; gate resolved | 2026-09-02 |
| 4 | gate-qc (run two) | sonnet | ok | `— → 17` | `thejudge-quality-check` re-grade after owner accepted DEC-055: PASS, no findings; 5 `PRD/sections/` edits + deletion line numbers + zero-callers re-verified against live tree | 2026-09-02 |
| 5 | plan | sonnet | ok | `— → 27` | `thejudge-map-out`: one slice A (delete `isCardBack()`/`CARD_BACK_THRESHOLD`/`cardBack` from identify.ts, keep live `_card_back` filter); GAMEPLAN + slice-a doc + criteria.json; STATUS.active | 2026-09-02 |
| 6 | build | sonnet | ok | `— → 57` | `thejudge-implement-all`: slice A done in worktree; `apps/frontend/src/lib/scan/identify.ts` only source change; frontend 1302 tests + typecheck + `quality:check` green; PR #161 (`-work` → base) opened; A1–A6 criteria earned; STATUS.ship-ready; launch checkout clean (write scope OK) | 2026-09-02 |
| 7 | review | opus | ok | `— → 19` | no-write reviewer: **APPROVE** — A1–A6 all verified against the PR branch worktree (grep zero hits, `_card_back` filter intact, 1302 tests + golden vectors byte-identical, typecheck + `quality:check` green, only identify.ts changed); no Critical/Important finding | 2026-09-02 |
| 8 | land | — | ok | — | owner merged PR #161 (`-work` → base, `ef38599`) then PR #157 (base → main, `a24a7f6`) | 2026-09-02 |
| 9 | close | — | ok | — | receipt + work-folder deletion via this cleanup PR into `main` (base branch auto-deleted; see deviation note) | 2026-09-02 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |

No user instructions were converted into standing authorizations and none were refused; the run carried no instruction-ledger rows.

## Intake

- `intake/intake-brief.md` — staged by the overnight code-health loop that opened the run (dead-`isCardBack` code-health target).
