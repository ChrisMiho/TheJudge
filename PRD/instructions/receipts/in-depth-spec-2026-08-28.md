# Receipt — in-depth-spec

- **Date:** 2026-08-28
- **Slug:** `in-depth-spec`
- **Status:** shipped
- **Type:** documentation only — the DEC-168 current-state feature-spec
  layer's seventh and final instance (Phase A #7, the last of the
  docs-refactor gameplan), describing In-Depth Question: the primary MTG
  Assistant loop (four-step staged game-context capture, submit, the
  `mode: "game"` Ask AI backend, and the post-decrypt conversation). The
  largest and most entangled destination in the suite. No `apps/` code
  change, no backend route change, no UI behavior change.

## Actions taken

- [x] Slice A (verify-only) — verified "What it is", "The staged flow, end
      to end", and Steps 1–4 (game context, zone confirmation, zone
      collection, enrichment) against cited `DEC`/`REQ`/`FLOW` sources,
      `system-map.md`, `screen-layout.md`, and the DEC-168 template shape.
      Independently confirmed the DEC-018 header-citation gap (added to
      `Backed by:`) and the DEC-122 gap (added to "Consumed but owned
      elsewhere" prose, cross-boundary to shared chrome). Confirmed
      FLOW-010 and DEC-070 correctly stay out of `Backed by:` (already
      cross-boundary per the DESIGN-BRIEF's explicit list). Criteria
      A1–A8, all `true`.
- [x] Slice B (verify-only) — verified "Submit — Decrypt Stack", "The
      wait, the answer, and the conversation", Measured bounds, Rejected
      alternatives and deferred scope, and the frontend-facing portion of
      Where it lives. Criteria B1–B6, all `true`.
- [x] Slice C (verify-only) — verified "The full backend path
      (`mode: "game"`)" section directly against real
      `apps/backend/src/` files (request validation, prompt assembly,
      retrieval enrichment, combo enrichment, provider boundary and
      diagnostics) and the backend portion of Where it lives.
      Independently confirmed the DEC-047 and REQ-033 header-citation
      gaps (both added to `Backed by:`). Surfaced, but correctly left
      uncorrected as out of this verify slice's license, three
      spec-vs-code discrepancies — recorded under
      `## Owner follow-up (unresolved)` below. Criteria C1–C9, all
      `true`.
- [x] Slice D (header/nav reconciliation + diff proof) — reconciled the
      header `Backed by:` / "Consumed but owned elsewhere" lines against
      every ID slices A and C actually confirmed cited in the body;
      verified the `PRD/README.md` Section Inventory row for
      `sections/in-depth/`; proved the package diff since its fork point
      (`3045e60`) touched only `PRD/README.md` (+1 line) and
      `PRD/sections/in-depth/README.md` — nothing under `apps/`, no
      existing `DEC`/`REQ`/`FLOW`/`NFR` body edited. Criteria D1–D6, all
      `true`.
- [x] All 29 acceptance criteria (`slice-a.criteria.json` A1–A8,
      `slice-b.criteria.json` B1–B6, `slice-c.criteria.json` C1–C9,
      `slice-d.criteria.json` D1–D6) `true`, independently re-confirmed by
      the node 7 no-write reviewer: verdict **APPROVE**, 0
      Critical/Important findings (one non-looping Minor: harmonize the
      2000-char `conversationHistory` cap hedge — a style note, not
      addressed by this node).
- [x] PR #120 (base `thejudge-auto/in-depth-spec`, head
      `thejudge-auto/in-depth-spec-work`) merged by the owner
      2026-08-28T13:47:00Z, merge commit
      `eb9d737d9b0d49a155293b7bb6a3e74bf6772d1e`.
- [x] Durable promotion: none required at cleanup beyond confirming
      presence. Both deliverables (`PRD/sections/in-depth/README.md`, the
      one `PRD/README.md` row) were already committed on the branch before
      this node ran (`5d24a72`, `d479fe4`), then additively corrected by
      slice A/C/D's bounded header fixes during `build`. Confirmed present
      at HEAD — see `## Durable outcomes` below. No new stable IDs were
      minted and no existing DEC/REQ/FLOW/NFR body was modified, so
      `decisions.md` stays precedence #1 through Phase A/B as designed —
      no `decisions.md` promotion applies.
- [x] System-map promotion gate: no flip required. This package added a
      derived documentation view over already-classified system-map
      entries; it did not change any entry's shipped/planned status. Note:
      `system-map.md`'s `gameStateNotes` / `ADDITIONAL GAME STATE` entry
      already correctly reads "no code under `apps/` yet" — see
      `## Owner follow-up (unresolved)` below for the spec-body
      discrepancy this exposes.
- [x] `PRD/work/in-depth-spec/GRAPH-RUN.md`'s `## Node ledger` and
      `## Instruction ledger` folded verbatim into `## Graph run` below,
      before the package folder was deleted, per this run's node-9
      requirement.
- [x] `intake/refactor-gameplan.md` recorded under `## Intake` below,
      before the package folder was deleted.
- [x] Autonomous merge-proof gate — all four checks satisfied; see
      `## Merge-proof gate` below for the full evidence and verdict on
      each.

## Owner follow-up (unresolved)

Three spec-vs-code discrepancies were surfaced by the `build` node
(slice C), confirmed real by the independent `review` node, posted as a
PR #120 comment, and merged as-is — deliberately left uncorrected because
fixing them is outside these verify slices' license (it needs an
authoritative REQ/DEC-body change, an `apps/` code change, or both). This
is a separate owner decision, not resolved by this cleanup node:

1. **`gameStateNotes` / `ADDITIONAL GAME STATE` built-vs-planned
   mismatch.** The spec's Step 1 bullet and backend prompt-assembly
   section both describe `gameStateNotes` / the `ADDITIONAL GAME STATE`
   prompt section as **Built**, but no such field or section exists in
   `apps/backend/src/` today. `PRD/sections/system-map.md`'s own
   `gameStateNotes` / `ADDITIONAL GAME STATE` entry (line 56) already
   correctly marks it "decided and documented, no code under `apps/` yet"
   — i.e. **planned**, not shipped. The spec's "Built" framing disagrees
   with the system of record it is derived from.
2. **`conversationHistory` per-message cap mismatch.** The spec
   (citing REQ-027/DEC-038) states each history message is capped at
   ≤2000 characters. The real validation schema
   (`conversationTurnSchema` in `apps/backend/src/validation/...`) caps
   each message at `boundedText(10000)` — 10,000 characters, not 2,000.
3. **Prompt-section order mismatch.** The spec's "Prompt assembly
   (ordered sections)" bullet lists `CONVERSATION HISTORY` before
   `SCOPE` in the fixed section order. The real `buildPromptText` in
   `apps/backend/src/prompt/` emits them in the inverted order —
   `SCOPE` before `CONVERSATION HISTORY`.

Recommended next step for the owner: decide, per item, whether to (a)
correct the spec's "Built" framing / cap value / section order to match
real code, or (b) treat one or more as a genuine product gap and update
the authoritative `REQ`/`DEC` body and code to match the spec's stated
intent. Either resolution is future work outside this closed package.

## Merge-proof gate

1. **Current branch equals recorded base.** `git branch --show-current`
   → `thejudge-auto/in-depth-spec`, matching `README.md`'s
   `Autonomous base: origin/thejudge-auto/in-depth-spec` exactly.
   `git fetch origin --prune` ran clean and left
   `origin/thejudge-auto/in-depth-spec` present, so the base still exists
   on the remote and the deleted-base second path does not apply. **Met.**
2. **PR merged into the recorded base, verified via `gh`.**
   `gh pr view 120 --json state,baseRefName,mergedAt,mergeCommit` →
   `state: MERGED`, `baseRefName: thejudge-auto/in-depth-spec`,
   `mergedAt: 2026-08-28T13:47:00Z`, `mergeCommit.oid:
   eb9d737d9b0d49a155293b7bb6a3e74bf6772d1e`. The GitHub API was
   reachable, so `gh` stays authoritative; the local-proof fallback does
   not apply. **Met.**
3. **Worktree fully merged.** `.worktrees/implement-in-depth-spec` is on
   branch `implement-in-depth-spec-contributor`, tip `51c6ca4`;
   `git merge-base --is-ancestor 51c6ca4 thejudge-auto/in-depth-spec`
   (run from the launch checkout) succeeds. `git -C
   .worktrees/implement-in-depth-spec status --porcelain` is empty.
   **Met.**
4. **Runtime-cleanup criteria.** Confirmed against `GAMEPLAN.md` rather
   than assumed: its `## Runtime / browser risk` section states "None.
   This package is documentation-only ... No Playwright verification is
   required." No slice evidence file records a browser session, dev
   server, or port. **Met — vacuously, no runtime session was ever
   opened.**

## Files created

- `PRD/instructions/receipts/in-depth-spec-2026-08-28.md` (this file)

## Files updated

- `PRD/work/STATUS.md` — removed the `in-depth-spec` row from the
  `## ship-ready` section

## Files deleted

- `PRD/work/in-depth-spec/` (entire work folder): `README.md`, `IDEA.md`,
  `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `GRAPH-RUN.md`, `STATUS.ship-ready`,
  `slice-a-verify-staged-flow.md` + `slice-a.criteria.json` +
  `slice-a.evidence.md`, `slice-b-verify-submit-and-conversation.md` +
  `slice-b.criteria.json` + `slice-b.evidence.md`,
  `slice-c-verify-backend-path.md` + `slice-c.criteria.json` +
  `slice-c.evidence.md`, `slice-d-header-nav-and-diff-proof.md` +
  `slice-d.criteria.json` + `slice-d.evidence.md`,
  `intake/refactor-gameplan.md`
- `.worktrees/implement-in-depth-spec/` (autonomous implementation
  worktree, clean and fully merged per merge-proof check 3) and its local
  branch `implement-in-depth-spec-contributor`
- No local `thejudge-auto/in-depth-spec-work` head was present at
  cleanup time; `git fetch origin --prune` reported
  `origin/thejudge-auto/in-depth-spec-work` deleted — GitHub appears to
  have auto-deleted the PR head branch on merge. No remote-branch delete
  was performed by this node.

## Durable outcomes already shipped (present on the base prior to this node)

- `PRD/sections/in-depth/README.md` — 514 lines, the DEC-168 current-state
  feature spec for In-Depth Question (staged four-step game-context flow,
  submit, the full `mode: "game"` Ask AI backend path, and the post-decrypt
  conversation). Header carries the additive slice A/C/D corrections
  (DEC-018, DEC-047, REQ-033 added to `Backed by:`; DEC-122 added to the
  "Consumed but owned elsewhere" prose). Confirmed present at HEAD.
- `PRD/README.md` — one Section Inventory row for `sections/in-depth/`
  (line 50), citing DEC-168 alongside the six prior Phase A specs.
  Confirmed present at HEAD (`grep -c "sections/in-depth/" PRD/README.md`
  → 1).
- The spec's `Status:` line correctly marks it draft, derived, and
  non-authoritative, with `PRD/sections/decisions.md` staying precedence
  #1 through Phase A/B — no promotion to authoritative status applies at
  this cleanup, by design.

## Verification results

- `npm run quality:check` — exit 0. `typecheck`, `lint`, `format:check`,
  `coverage:check` all clean; `test:scripts`: 402/402 tests passing, 0
  failures.
- Touched-area note: this package's diff (outside `PRD/work/`) from the
  `3045e60` fork point is `PRD/README.md` (+1 line) and
  `PRD/sections/in-depth/README.md` (new, 514 lines including the
  build-node header corrections) — `git diff --stat 3045e60` (excluding
  `PRD/work/`) → 2 files changed, 515 insertions, 0 deletions. Markdown
  only, not covered by `lint`/`format:check`/`typecheck`.
- `git fetch origin --prune` → `origin/thejudge-auto/in-depth-spec`
  present (base still live on remote);
  `origin/thejudge-auto/in-depth-spec-work` reported deleted.
- `gh pr view 120 --json state,baseRefName,mergedAt,mergeCommit` →
  `MERGED`, base `thejudge-auto/in-depth-spec`, merge `eb9d737`.
- `git merge-base --is-ancestor 51c6ca4 thejudge-auto/in-depth-spec` →
  success.
- `git -C .worktrees/implement-in-depth-spec status --porcelain` → empty.
- `grep -c "sections/in-depth/" PRD/README.md` → 1 (exactly one nav row).

## Graph run

- Run ID: `graph-20260827-213634` | Profile: `unverified` | Terminal state: `close (node 9, this receipt)`

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/in-depth-spec` created and pushed to origin; base `main`; tree clean; both canaries denied | 2026-08-27 |
| 2 | shape | sonnet | ok | `0 → 22` | package `PRD/work/in-depth-spec/` created; intake folded to `intake/refactor-gameplan.md`; commit `bfe6774`; 6 prior-run receipt matches in `IDEA.md` | 2026-08-27 |
| 3 | define | opus | ok | `0 → 44` | spec `PRD/sections/in-depth/README.md` (514 lines, new file, 0 deletions); `DESIGN-BRIEF.md`; `PRD/README.md` nav row; **0 new stable IDs**; status → refined | 2026-08-27 |
| 4 | gate-qc | sonnet | ok | `0 → 29` | PASS, 0 findings; all 69 DEC / 47 REQ / 5 FLOW / 3 NFR citations verified against index; entanglement ownership confirmed on owning specs; status stays refined | 2026-08-27 |
| 5 | plan | sonnet | ok | `0 → 46` | `GAMEPLAN.md` + 4 verify slices (A staged flow / B submit+conversation / C backend path / D header-nav+diff-proof), 29 criteria; STATUS.active; candidate finding: DEC-018/DEC-047/DEC-122/REQ-033 cited inline but absent from header Backed-by (additive fix in A/C/D) | 2026-08-27 |
| 6 | build | sonnet | ok | `0 → 216` | all 4 slices done, **29/29 criteria `value:true`** (A8/B6/C9/D6); PR [#120](https://github.com/ChrisMiho/TheJudge/pull/120) `thejudge-auto/in-depth-spec-work` → base; write-scope clean (all writes under `.worktrees/implement-in-depth-spec/`, launch checkout untouched); STATUS.ship-ready. Header gaps DEC-018/047/122/REQ-033 confirmed + additively fixed. **3 spec-vs-code discrepancies surfaced, left uncorrected (out of slice license), posted as PR comment for owner:** `gameStateNotes`/ADDITIONAL GAME STATE absent in `apps/` (system-map marks "planned"); `conversationHistory` per-message cap 10000 in code vs 2000 in REQ-027/DEC-038/spec; CONVERSATION HISTORY/SCOPE section order inverted vs `buildPromptText` | 2026-08-27 |
| 7 | review | opus | ok | `0 → 18` | **APPROVE.** No Critical/Important. Independently re-verified: diff purely additive (3164 insertions, 0 deletions, nothing under `apps/`, no DEC/REQ/FLOW/NFR body edit, one `PRD/README.md` nav row); the 4 additive header IDs resolve to real confirmed sources and stayed bounded (DEC-122 correctly header-excluded); slice-C backend labels/schema confirmed against `apps/backend/src/`. Confirmed all 3 deferred discrepancies real and the deferral correct. One non-looping Minor (harmonize the 2000-char cap hedge) | 2026-08-27 |
| 8 | land | — | ok | — | owner merged PR [#120](https://github.com/ChrisMiho/TheJudge/pull/120) 2026-08-28 (merge commit `eb9d737`); base `thejudge-auto/in-depth-spec` reconciled into launch checkout, GRAPH-RUN.md kept as fuller ledger, single marker STATUS.ship-ready | 2026-08-28 |
| 9 | close | sonnet | ok | — | receipt `PRD/instructions/receipts/in-depth-spec-2026-08-28.md` written; all four merge-proof checks verified independently (see `## Merge-proof gate` above); `PRD/work/in-depth-spec/` deleted via `git rm -r`; `.worktrees/implement-in-depth-spec` and local branch `implement-in-depth-spec-contributor` removed, no local `thejudge-auto/in-depth-spec-work` head was present; `PRD/work/STATUS.md` board row removed; `npm run quality:check` exit 0 (402/402 `test:scripts`) | 2026-08-28 |

**Node 9's row was written by the driver after the fact, not by the run.**
The run cannot record its own final node: node 9 deletes
`PRD/work/<slug>/`, and `GRAPH-RUN.md` lives inside it, so there is no
ledger left to write the `close` row into. This matches the same
structural gap recorded in `shared-chrome-spec-2026-08-27.md`,
`trade-balancer-spec-2026-08-26.md`, `user-feedback-spec-2026-08-25.md`,
`life-tracker-spec-2026-08-25.md`, and
`codebase-duplication-audit-2026-08-23.md`'s receipts.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Write the current-state feature spec for the in-depth feature — Phase A #7, the last of the docs-refactor gameplan. Land it at PRD/sections/in-depth/README.md on the DEC-168 template. It is the largest and most entangled feature, so lean on the patterns the earlier six specs established. Keep it draft and non-authoritative." | answered-once | shape | — |
| "ok its merged" | answered-once | land | — |

## Intake

- `intake/refactor-gameplan.md` — staged docs-refactor gameplan, copied
  verbatim from `.worktrees/.graph-intake/graph-20260827-213634/`, per
  `GRAPH-RUN.md`'s node 2 dispatch prompt. Not opened by this node —
  recorded as a citation only, per the graph-workflow-contract's intake
  rule.
