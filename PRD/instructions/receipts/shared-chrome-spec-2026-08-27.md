# Receipt — shared-chrome-spec

- **Date:** 2026-08-27
- **Slug:** `shared-chrome-spec`
- **Status:** shipped
- **Type:** documentation only — the DEC-168 current-state feature-spec
  layer's sixth instance (Phase A #6, docs-refactor gameplan), and the first
  to describe the shared chrome layer (suite shell, Menu rail/tray,
  mock-mode banner, routing/load fallback, the shared answered-conversation
  workspace, history drawer, View Context overlay, card-detail popup, shared
  layout language) rather than a single player-facing destination. No
  `apps/` code, no backend route change, no UI behavior change.

## Actions taken

- [x] Slice A (verify-only) — verified the structural-chrome half of the
      already-committed `PRD/sections/shared-chrome/README.md` (header/Backed-by
      structural half, What it is, the first four How it works subsections —
      suite shell + mock-mode banner, destination routing + load fallback, the
      Menu corner rail + tray, Theme section — plus the structural portions of
      Shared layout language, Measured bounds, Rejected alternatives, and Where
      it lives) against its cited sources and the actual `apps/frontend/src/`
      tree. Criteria A1–A9, all `true`.
- [x] Slice B (verify-only) — verified the conversation/overlay-chrome half
      (header/Backed-by conversation half, the last four How it works
      subsections — the shared answered-conversation workspace, the history
      drawer, the View Context / adaptive-context overlay, the card-detail
      popup + shared close control — plus the matching portions of Measured
      bounds, Rejected alternatives, and Where it lives) against its cited
      sources and the tree, applying one bounded path correction. Criteria
      B1–B7, all `true`.
- [x] Slice C (verify-only) — verified the two scope-boundary bullets in
      Rejected alternatives (deferred/out-of-scope; per-feature surfaces),
      verified the `PRD/README.md` Section Inventory row for
      `sections/shared-chrome/`, and proved the package diff from the
      `ee6e33f` map-out baseline stayed in scope — correctly excluding the
      concurrent `lambda-s3-deploy` package's already-committed changes on
      this branch. Criteria C1–C7, all `true`.
- [x] All 23 acceptance criteria (`slice-a.criteria.json` A1–A9,
      `slice-b.criteria.json` B1–B7, `slice-c.criteria.json` C1–C7) `true`,
      independently re-confirmed by the node 7 no-write reviewer: verdict
      **APPROVE**, 0 findings.
- [x] PR #118 (base `thejudge-auto/shared-chrome-spec`, head
      `thejudge-auto/shared-chrome-spec-work`) merged by the owner
      2026-08-27T17:21:58Z, merge commit `d28d9de6972b81d4a0f30fe76fa27872742b7cdf`.
- [x] Durable promotion: none required at cleanup beyond confirming presence.
      Both deliverables (`PRD/sections/shared-chrome/README.md`, the one
      `PRD/README.md` row) were already committed on the branch before this
      node ran; confirmed present at HEAD (see `## Durable outcomes` below). No
      new stable IDs were minted and no existing DEC/REQ/FLOW/NFR body was
      modified, so `decisions.md` stays precedence #1 through Phase A/B as
      designed — no `decisions.md` promotion applies.
- [x] System-map promotion gate: no flip required. `PRD/sections/system-map.md`'s
      `## Feature portal (app navigation)`, `## Mock-mode banner`, and
      `## Follow-up chat` entries already read `Status: shipped` from prior
      shipped work; this package added a derived documentation view over
      already-shipped chrome, not a change to shipped product behavior.
- [x] `PRD/work/shared-chrome-spec/GRAPH-RUN.md`'s `## Node ledger` and
      `## Instruction ledger` folded verbatim into `## Graph run` below, before
      the package folder was deleted, per this run's node-9 requirement.
- [x] `intake/refactor-gameplan.md` recorded under `## Intake` below, before
      the package folder was deleted.
- [x] Autonomous merge-proof gate — all four checks satisfied; see
      `## Merge-proof gate` below for the full evidence and verdict on each.

## Merge-proof gate

1. **Current branch equals recorded base.** `git branch --show-current` →
   `thejudge-auto/shared-chrome-spec`, matching `README.md`'s
   `Autonomous base: origin/thejudge-auto/shared-chrome-spec` exactly.
   `git fetch origin --prune` ran clean and left
   `origin/thejudge-auto/shared-chrome-spec` present (tip
   `d28d9de6972b81d4a0f30fe76fa27872742b7cdf`), so the base still exists on
   the remote and the deleted-base second path does not apply. **Met.**
2. **PR merged into the recorded base, verified via `gh`.**
   `gh pr view 118 --json state,baseRefName,mergedAt,mergeCommit` →
   `state: MERGED`, `baseRefName: thejudge-auto/shared-chrome-spec`,
   `mergedAt: 2026-08-27T17:21:58Z`, `mergeCommit.oid:
   d28d9de6972b81d4a0f30fe76fa27872742b7cdf`. The GitHub API was reachable,
   so `gh` stays authoritative; the local-proof fallback does not apply.
   **Met.**
3. **Worktree fully merged.** `.worktrees/implement-shared-chrome-spec` is on
   branch `implement-shared-chrome-spec-build`, tip `df52160`, reported
   `behind 1` relative to `origin/thejudge-auto/shared-chrome-spec` with no
   commits ahead; `git merge-base --is-ancestor HEAD
   origin/thejudge-auto/shared-chrome-spec` run from inside the worktree
   succeeds. `git -C .worktrees/implement-shared-chrome-spec status
   --porcelain` is empty. **Met.**
4. **Runtime-cleanup criteria.** Confirmed against `GAMEPLAN.md` rather than
   assumed: its `## Runtime / browser risk` section states "None. This
   package is documentation-only ... No Playwright verification is
   required." Neither slice's evidence file mentions a browser, a dev
   server, or a port (a `grep` match on "port" in `slice-a.evidence.md` /
   `slice-b.evidence.md` resolved to "viewport" and "CardDetailPopup" —
   false positives). **Met — vacuously, no runtime session was ever
   opened.**

## Files created

- `PRD/instructions/receipts/shared-chrome-spec-2026-08-27.md` (this file)

## Files updated

- `PRD/work/STATUS.md` — removed the `shared-chrome-spec` row from the
  `## ship-ready` section

## Files deleted

- `PRD/work/shared-chrome-spec/` (entire work folder): `README.md`,
  `IDEA.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `GRAPH-RUN.md`,
  `STATUS.ship-ready`, `slice-a-verify-structural-chrome.md` +
  `slice-a.criteria.json` + `slice-a.evidence.md`,
  `slice-b-verify-conversation-chrome.md` + `slice-b.criteria.json` +
  `slice-b.evidence.md`, `slice-c-nav-scope-and-diff-proof.md` +
  `slice-c.criteria.json` + `slice-c.evidence.md`,
  `intake/refactor-gameplan.md`
- `.worktrees/implement-shared-chrome-spec/` (autonomous implementation
  worktree, clean and fully merged per merge-proof check 3) and its local
  branch `implement-shared-chrome-spec-build`
- No local `thejudge-auto/shared-chrome-spec-work` head was present at
  cleanup time; `git fetch origin --prune` reported
  `origin/thejudge-auto/shared-chrome-spec-work` deleted — GitHub appears to
  have auto-deleted the PR head branch on merge. No remote-branch delete was
  performed by this node.

## Durable outcomes already shipped (present on the base prior to this node)

- `PRD/sections/shared-chrome/README.md` — new, 442 lines, the DEC-168
  current-state feature spec for the shared chrome layer (suite shell,
  mock-mode banner, destination routing + load fallback, Menu corner rail +
  tray, Theme section, the shared answered-conversation workspace, history
  drawer, View Context / adaptive-context overlay, card-detail popup +
  shared close control, shared layout language, measured bounds, rejected
  alternatives, where it lives). Confirmed present at HEAD.
- `PRD/README.md` — one Section Inventory row for `sections/shared-chrome/`
  (line 50), citing DEC-168 alongside the five prior Phase A specs.
  Confirmed present at HEAD (`grep -c "sections/shared-chrome" PRD/README.md`
  → 1).
- `PRD/sections/system-map.md`'s `## Feature portal (app navigation)`,
  `## Mock-mode banner`, and `## Follow-up chat` entries — already
  `Status: shipped` from prior, unrelated shipped work; unchanged by this
  package.
- The spec's `Status:` line correctly marks it draft, derived, and
  non-authoritative, with `PRD/sections/decisions.md` staying precedence #1
  through Phase A/B — no promotion to authoritative status applies at this
  cleanup, by design.

## Verification results

- `npm run quality:check` — exit 0. `typecheck`, `lint` (7 pre-existing
  `react-refresh/only-export-components` warnings, 0 errors), `format:check`,
  `coverage:check` all clean; `test:scripts`: 402/402 tests passing, 0
  failures.
- Touched-area note: this package's diff (outside `PRD/work/`) from the
  `ee6e33f` map-out baseline is `PRD/README.md` (+1 line) and
  `PRD/sections/shared-chrome/README.md` (new, then +11/-4 lines across
  slice B's bounded path correction) — `git diff --stat ee6e33f` → 3 files
  changed (`PRD/README.md`, `PRD/sections/shared-chrome/README.md`,
  `PRD/work/STATUS.md`), 13 insertions, 4 deletions. Markdown only, not
  covered by `lint`/`format:check`/`typecheck`.
- `git fetch origin --prune` → `origin/thejudge-auto/shared-chrome-spec`
  present at `d28d9de6` (base still live on remote);
  `origin/thejudge-auto/shared-chrome-spec-work` reported deleted.
- `gh pr view 118 --json state,baseRefName,mergedAt,mergeCommit` → `MERGED`,
  base `thejudge-auto/shared-chrome-spec`, merge `d28d9de6`.
- `git merge-base --is-ancestor HEAD origin/thejudge-auto/shared-chrome-spec`
  (run from `.worktrees/implement-shared-chrome-spec`) → success.
- `git -C .worktrees/implement-shared-chrome-spec status --porcelain` →
  empty.
- `grep -c "sections/shared-chrome" PRD/README.md` → 1 (exactly one nav
  row).

## Graph run

- Run ID: `graph-20260827-001521` | Profile: `unverified` | Terminal state: `close (node 9, this receipt)`

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` | branch `thejudge-auto/shared-chrome-spec` created + pushed; clean checkout, no stash; both canaries denied (universal + graph tier) | 2026-08-27 |
| 2 | shape | sonnet | ok | `0 → 52` | package `PRD/work/shared-chrome-spec/` created; `STATUS.ideation`; intake copied to `PRD/work/shared-chrome-spec/intake/refactor-gameplan.md` | 2026-08-27 |
| 3 | define | opus | ok | `0 → 76` | spec `PRD/sections/shared-chrome/README.md` (442 lines, new file) written on DEC-168 template; zero new stable IDs; STATUS reached `refined`; run parks at define gate over the new-file diff | 2026-08-27 |
| — | gate-review | — | resolved | — | owner walked 14/14 spec sections, all accepted (0 edits, 0 rejects); `## Gate verdicts` recorded; STATUS restored to `refined` | 2026-08-27 |
| 4 | gate-qc | sonnet | ok (PASS) | `0 → 31` | `thejudge-quality-check` PASS on `DESIGN-BRIEF.md`; all 40 DEC / 22 REQ / 4 FLOW / 4 NFR citations verified against source; diff is one new file, zero source-body edits; no findings | 2026-08-27 |
| 5 | plan | sonnet | ok | `0 → 37` | `thejudge-map-out`: 3 verify-only slices (A structural chrome, B conversation/overlay chrome, C scope bullets + `PRD/README.md` nav row + diff-scope proof) with criteria files; `STATUS.active`; slice C diff-scope baselined on `ee6e33f` to exclude lambda-s3-deploy's committed changes | 2026-08-27 |
| 6 | build | sonnet | ok | `0 → 128` | `thejudge-implement-all`: PR #118 (`thejudge-auto/shared-chrome-spec-work` → base) opened; all 23 criteria `value:true` (A 9 / B 7 / C 7) verified from emitted files; write-scope clean (launch checkout untouched, writes in `.worktrees/implement-shared-chrome-spec/`); one bounded slice-B path correction; `STATUS.ship-ready`; pre-existing unrelated `lambda-package-budget.test.mjs` worktree failure documented on PR | 2026-08-27 |
| 7 | review | opus | ok (APPROVE) | `0 → 13` | no-write reviewer (Explore, no write tools) APPROVE, 0 findings; graded A1–A9 / B1–B7 / C1–C7 against acceptance criteria; slice-B path correction verified accurate against the real tree; lambda changes and pre-existing test failure correctly not flagged | 2026-08-27 |
| 8 | land | — | parked (human merge) | — | PR #118 OPEN + MERGEABLE; driver parks for owner PR merge — never runs `gh pr merge` | 2026-08-27 |
| 8 | land | — | ok | n/a (human merge) | PR #118 confirmed MERGED (`gh pr view 118` → `state: MERGED`, `mergedAt: 2026-08-27T17:21:58Z`); owner merged `-work` → base; launch checkout reconciled via `git merge origin/thejudge-auto/shared-chrome-spec` | 2026-08-27 |
| 9 | close | sonnet | ok | — | receipt `PRD/instructions/receipts/shared-chrome-spec-2026-08-27.md` written; all four merge-proof checks verified independently (see `## Merge-proof gate` above); `PRD/work/shared-chrome-spec/` deleted via `git rm -r`; `.worktrees/implement-shared-chrome-spec` and local branch `implement-shared-chrome-spec-build` removed, no local `thejudge-auto/shared-chrome-spec-work` head was present; `PRD/work/STATUS.md` board row removed; `npm run quality:check` exit 0 (402/402 `test:scripts`) | 2026-08-27 |

**Node 9's row was written by the driver after the fact, not by the run.**
The run cannot record its own final node: node 9 deletes
`PRD/work/<slug>/`, and `GRAPH-RUN.md` lives inside it, so there is no
ledger left to write the `close` row into. This matches the same
structural gap recorded in `trade-balancer-spec-2026-08-26.md`,
`user-feedback-spec-2026-08-25.md`, `life-tracker-spec-2026-08-25.md`, and
`codebase-duplication-audit-2026-08-23.md`'s receipts.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Write the current-state spec for the shared chrome — Phase A #6 of the docs-refactor gameplan. Land it at PRD/sections/shared-chrome/README.md on the DEC-168 template (confirm the directory name at the gate). This is the shared-chrome bucket: the shared layout language and chrome the feature specs kept reaching for, plus the screen-layout.md rows that belong to shared chrome rather than a single feature. Keep it draft and non-authoritative." | answered-once | shape | — |

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, copied
  verbatim from `.worktrees/.graph-intake/graph-20260827-001521/`, per
  `GRAPH-RUN.md`'s node 2 dispatch prompt. Not opened by this node — recorded
  as a citation only, per the graph-workflow-contract's intake rule.
