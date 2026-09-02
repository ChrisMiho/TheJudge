# Graph run — life-tracker-seat-map

- Run ID (original): `graph-20260902-093611`
- Run ID (build-half re-scope, 2026-09-02): `graph-20260902-121645` — a fresh run
  id for the resumed build half after the owner's compact-horizontal design
  clarification, so criteria are re-earned cleanly rather than inheriting the
  original run's evidence/denials. All new dispatch prompts, the lock, and the
  hook counters key on this id; historical prompts below keep the original id.
- Profile: `loaded (env sentinel)`
- Canary: `denied — hook live (universal: rm -rf denied) + graph tier armed (nohup denied while lock held)`
- Autonomous base: `origin/thejudge-auto/life-tracker-seat-map`
- Staging: `.worktrees/.graph-intake/graph-20260902-093611/` (copied verbatim into `PRD/work/life-tracker-seat-map/intake/`, then deleted at node 2 per kickoff's copy→commit→delete)
- Current node: `land` — **PARKED for the owner's merge (2026-09-02).** The full
  build half ran clean under the re-scope: gate-qc (FAIL→reconcile→PASS) → plan
  (re-slice) → build (compact-horizontal on-card block, live-verified 7/8 in both
  layouts) → review (**APPROVE**). Code PR #182 (`-work → main`) is open with the
  fix + REQ-173 applied; `land` is the owner merging it by hand — never automated.
- Next action: the owner merges PR #182, then `/graph-implement PRD/work/life-tracker-seat-map/`
  records `land` as ok and continues to `close` (cleanup).
- Terminal state (build half): `PARKED` at `land` (awaiting owner merge of PR #182)
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/180 (MERGED — the build signal)
- Boundary-hook fix: https://github.com/ChrisMiho/TheJudge/pull/181 (MERGED — `criterion-flip-without-evidence` now remediable)
- Resume canary (attempt 3): `graph tier armed — nohup denied while lock held`. Lock re-taken (run `graph-20260902-093611`).

## Build-half re-scope (2026-09-02)

The build half was paused at `owner-action` for a layout-design clarification (not
a tooling blocker). The owner resolved it in `observations.md` and confirmed the
shape via a single design question ("how should the on-card commander-damage
mini-grid behave in list layout?" → **"always compact & horizontal"**).

**Decision applied (owner's, recorded — not the driver's):** the on-card
commander-damage mini-map is a compact horizontal block (≤2 rows, grows wider),
identical in grid and list layout, decoupled from `listSeatArrangement`'s tall
stacking, extrapolated sideways for 7–8 players, with the whole card never
rotated. The counter panel is unaffected (owner: "okay with things changing" once
open). `DESIGN-BRIEF.md` carries this under "## Owner clarification (2026-09-02)"
and its acceptance criteria 3–4 are revised.

**Why re-enter at `gate-qc`/`plan`, not `build`:** the clarification overrides
slice B's acceptance criteria (B2/B3 hard-coded "the preview grid uses the active
arrangement's real columns/rows" and "each cell at its own seat coordinate" — the
very shape that goes vertical in list mode). A build node must not rewrite its own
acceptance criteria (self-grading), so the geometry is re-planned independently by
`thejudge-map-out`. Slice A (`buildSeatMapCells` + prop threading), slice C
(panel), and slice D (live containment verification) are design-neutral and
largely stand; slice B is re-sliced.

**Fresh run id `graph-20260902-121645`:** the original run
(`graph-20260902-093611`) has 16 evidence entries and 2 denials on disk for the
old-design criteria. A fresh id makes the resumed build re-earn every criterion
against the new slice B rather than inheriting stale evidence. Branch reconciled:
`origin/thejudge-auto/life-tracker-seat-map-work` (the built A/B/C code) merged
into local `-work`; the base→work→main PR shape is unchanged (base `origin/main`,
one code PR `-work → main`).

Note on dispatch-prompt reproduction: prompts below are reproduced with their
words unchanged. Double-quote glyphs are reserved for the single ledgered user
instruction (the run request); two non-instruction phrases quoted in the node 2
prompt (a contract heading and an intake-brief section label) are rendered with
single-quote glyphs — a quote-glyph normalization only, no word altered — so the
Instruction-ledger match is unambiguous.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `degraded (no run state)` | branch `thejudge-auto/life-tracker-seat-map` pushed to origin; base `origin/main`; stash `graph-preflight/graph-20260902-093611`; canaries denied (rm -rf universal; nohup graph-tier); Profile loaded (env sentinel) | 2026-09-02 |
| 2 | shape | sonnet | ok | `degraded (no run state)` | package `PRD/work/life-tracker-seat-map/` created (commit `21778e5`); `IDEA.md` + `STATUS.ideation` + `intake/` (GRAPH-BRIEF.md, PROBE.md, references/ 12 images) committed; 6 `## Prior run` receipt matches recorded | 2026-09-02 |
| 3 | define | opus | ok | `0 → 33` | `DESIGN-BRIEF.md` + `GATE-QUESTIONS.md` written; STATUS.refined; one new id REQ-173 with 3 complete diffs (functional-requirements.md, life-tracker/README.md, screen-layout.md); counter-panel orientation resolved via assumption ladder (top-down replica), no product fork surfaced; no `PRD/sections/` edits | 2026-09-02 |
| 4 | gate-qc | sonnet | ok | `0 → 24` | Quality-check PASS; checked `DESIGN-BRIEF.md`; findings none (one non-blocking citation nit); code claims verified against `PlayerLifeCard.tsx`/`CounterPanel.tsx`/`PlayerLifeTrackerApp.tsx`/`seatArrangement.ts`; REQ-173 diff placement + cited IDs confirmed. Run stops at PASS → owner-action | 2026-09-02 |
| — | gate-review | sonnet | ok | `3 → 22` | Build-half resume. Owner answered `GATE-QUESTIONS.md` `REQ-173: accept` + merged docs PR #180. `graph-gate-review` finalized the proposal (accept = diffs stand as authored), restored `STATUS.refined`, moved board row off `owner-action`; no `PRD/sections/` or code edits | 2026-09-02 |
| 4 | gate-qc | sonnet | ok | `2 → 28` | Attempt 2 (build-half re-grade after accept). Quality-check PASS; checked `DESIGN-BRIEF.md`; findings none; every code claim re-verified against `seatArrangement.ts`/`PlayerLifeCard.tsx`/`CounterPanel.tsx`; brief consistent with finalized REQ-173, within constraints (pure presentation, DEC-139 not reopened, DEC-136 preserved). `STATUS.refined` unchanged | 2026-09-02 |
| 5 | plan | sonnet | ok | `2 → 53` | `thejudge-map-out`: `GAMEPLAN.md` + 4 slice docs (A geometry helper `lib/lifeTracker/seatMap.ts` + `layout` prop threading; B `PlayerLifeCard` on-card seat map; C `CounterPanel` seat map; D live 7/8-player containment verification) + 4 `slice-*.criteria.json` (A–C command/path evidence, D six `manual` live-browser checks); `STATUS.active` set; board moved to `## active`; all writes inside `PRD/work/life-tracker-seat-map/` | 2026-09-02 |
| 6 | build | sonnet | failed | `2 → 107` | Attempt 1 parked on a **criteria-tooling bug**, not code. Slice A implemented + verified green (typecheck, vitest 32/32, quality:check on staged tree); A1/A2/A4/A5/A6 earned (see `.graph-evidence.jsonl`). A3 un-earnable: `slice-a.criteria.json` A3 evidence regex `grep -n "^import" …` has an unescaped `^` mid-pattern → `new RegExp(pattern).test(command)` is always `false` (verified in `matchesEvidence`, `scripts/lib/boundary-rules.mjs`). Nothing committed/pushed; worktree `.worktrees/implement-life-tracker-seat-map` left staged | 2026-09-02 |
| — | build (guardrail fix) | — | ok | — | Driver fixed the map-out escaping typo per contract *fix the guardrail, never route around it*: A3 evidence `^import` → `\^import` in the launch-checkout `slice-a.criteria.json` (the copy the hook reads — `projectRoot`=`CLAUDE_PROJECT_DIR`). Verified: JSON valid; escaped pattern now matches the real grep command. Scanned B/C/D command patterns — A3 was the only broken one. Re-dispatching build as attempt 2 | 2026-09-02 |
| 6 | build | sonnet | parked | `2 → 52` | Attempt 2 parked on a **second, distinct enforcement-tooling defect** (not code). A3 now earned (log `16:56:36`); all six slice-A criteria A1–A6 have hook-observed evidence for this run. But flipping them to `true` is blocked by `denied-command-retry`: a stale denial from attempt 1 (`.graph-denials.jsonl`, `criterion-flip-without-evidence` at `16:46:53`, when A3 lacked evidence) permanently blocks any `Edit` to `slice-a.criteria.json` for the rest of the run. `denialKey` keys on tool+path only, and `criterion-flip-without-evidence` is **not** in `REMEDIABLE_RULES` (only `run-lock-removal` is), so the now-evidenced retry can never be re-evaluated. Build correctly refused to route around it via `Write`/`Bash`. Slice A code complete + green (typecheck, vitest 32/32, quality:check); nothing committed/pushed; no PR; worktree preserved. Slices B/C/D not started; REQ-173 not yet applied; `STATUS` stays `active` → `owner-action` | 2026-09-02 |
| — | build (gate resolved) | — | ok | — | Owner merged the boundary-hook fix PR #181: `criterion-flip-without-evidence` added to `REMEDIABLE_RULES` (guarantee unchanged — the rule re-evaluates against the evidence log; only the stale-denial trap removed; `test:scripts` green, 436). Driver integrated `origin/main` into `thejudge-auto/life-tracker-seat-map-work` (active hook now corrected) and republished `origin/-work` with the A3 fix so the worktree rebases onto a correct base. `STATUS.active` restored. Re-dispatching build as attempt 3 | 2026-09-02 |
| 6 | build | sonnet | paused | `2 → ?` | Attempt 3 resumed with the fix live; slices A, B, C reached `done` in the worktree (green: typecheck, vitest 32/32, quality:check). Stopped by the owner mid slice-D on a **layout-design issue**. Live DOM measurement (430px): the on-card commander-damage grid is **horizontal + contained in grid mode** at 7 and 8 players (~49×26), but in **LIST mode at 8 players it is vertical (~12–25w × 60h) and overflows the card bottom by ~4px on players 2–8**. Owner: "just rotate the component, then fix the order displayed"; the reference images (`intake/references/`) are the target; my compact-grid redesign proposal was over-scoped. Paused for owner clarification. Nothing committed to the shared branch; no code PR. Handoff: `HANDOFF.md` | 2026-09-02 |

| 4 | gate-qc | sonnet | failed | `1 → 28` | Attempt 3 (build-half re-scope: re-grade of the clarified brief under run `graph-20260902-121645`). FAIL, 2 findings — (1) `DESIGN-BRIEF.md` acceptance criterion 1 still requires each opponent's on-card cell "at the seat that player occupies in the active arrangement" (verified at 8p), which the compact-horizontal clarification supersedes; the supersession clause named only criteria 3–4. (2) `GATE-QUESTIONS.md` REQ-173's Description + acceptance criteria ("uses the arrangement's real columns/rows … not ceil(√N)", cells at their arrangement gridRow/gridColumn) + Notes still commit the on-card map to the literal-arrangement mechanism. `seatArrangement(8)`=2×4, `listSeatArrangement(8)`=2×5 — both exceed the ≤2-row cap. STATUS.refining set; board moved to `## refining`. Loops to `define` for reconciliation | 2026-09-02 |

| — | define | opus | ok | `0 → 37` | Build-half re-scope reconciliation (thejudge-refinement) after the gate-qc FAIL. Reconciled `DESIGN-BRIEF.md` (criterion 1 + on-card prose in What-the-player-gets / Design-direction / Resolved-decisions + extended supersession clause) and `GATE-QUESTIONS.md` REQ-173 (In-plain-terms, Description, four on-card ACs, on-card Constraint, Note, + the on-card README and screen-layout diff bullets) to the compact-horizontal on-card block. Panel top-down matrix, containment guarantee, and preserved behaviors unchanged; REQ-173 stays `accept` (+ Reason line); no new gate question or stable id. STATUS.refined; board → `## refined` | 2026-09-02 |

| 4 | gate-qc | sonnet | ok | `0 → 16` | Attempt 4 (re-scope re-grade after the define reconciliation). PASS; checked `DESIGN-BRIEF.md`; findings none — both prior findings resolved, `DESIGN-BRIEF.md` + REQ-173 agree on the compact horizontal on-card block, panel top-down matrix / containment guarantee / preserved behaviors (always-on decrements-life, REQ-112, DEC-136, DEC-139) intact. README `## Preparation gate` stamped PASS. `STATUS.refined` stands; advance to `plan` | 2026-09-02 |

| 5 | plan | sonnet | ok | `0 → 47` | Build-half re-scope re-slice (thejudge-map-out). Fresh `GAMEPLAN.md` + slices A–D + 4 `slice-*.criteria.json` (A 8 / B 6 / C 4 / D 6, all `false`). A: add a compact-horizontal-block builder to `seatMap.ts` alongside the unchanged `buildSeatMapCells` (panel keeps it); B: on-card `PlayerLifeCard` switches to the compact block (≤2 rows, grows wider, decoupled from `layout.columns`/`rows`), same in grid + list; C: re-verify panel top-down miniature unchanged; D: live 7/8-player containment + block-shape + glyph-orientation, both layouts, + Ship gates. GAMEPLAN documents the old-design A/B/C already committed on `-work` as the starting state (re-earned, no old evidence carried). `STATUS.active`; board → `## active` | 2026-09-02 |

| 6 | build | sonnet | ok | `0 → 246` | Attempt 4 (re-scope build). Worktree `.worktrees/implement-life-tracker-seat-map` fast-forwarded onto shared head `31e4dea` (stale pre-re-scope uncommitted preview tweaks stashed, not lost — `stash@{0}` "stale-old-design-preview-tweaks"). Slice A: `buildCompactSeatMapCells` added to `seatMap.ts` (2 rows always, columns = ceil(N/2), matches the 6-player reference's 2×3 and the brief's stated 2×4 at 8 players; "me" fixed at the block's top-left corner; opponents in table order from the viewer's own seat, identical for grid and list mode since `layout.seats` is always `Player 1..N` order in both). All 8 criteria earned; typecheck + vitest (9/9) + full `quality:check` green; committed `8f043fe`, pushed to `-work`. PR #182 (pre-existing, from an earlier attempt, marker absent) registered with a comment naming this run's 4-slice plan; title set `[THEJUDGE-AUTO][IN PROGRESS]` | 2026-09-02 |

| — | build (guardrail fix) | — | ok | — | Same defect class as the earlier A3 fix, a fresh instance in the re-scoped `slice-b.criteria.json`: B1's evidence command `grep -n "layout.columns\|layout.rows\|ceil(Math.sqrt" …` has an unescaped `(` — `new RegExp(pattern)` throws "Unterminated group", caught silently by `matchesEvidence`, so B1 could never earn. Fixed `ceil(Math.sqrt` → `ceil\(Math.sqrt` in **both** the launch-checkout and worktree copies of `slice-b.criteria.json` (the hook reads `projectRoot=CLAUDE_PROJECT_DIR`, the launch checkout). Scanned every command pattern across A–D (script check via `new RegExp` on each); B1 was the only broken one. Re-ran the grep; B1 now earned for this run (`.graph-evidence.jsonl`, `19:05:02`) | 2026-09-02 |

| — | build (slices B/C/D complete) | sonnet | ok | — | After the guardrail fix: B — `PlayerLifeCard` on-card preview rewritten to render `buildCompactSeatMapCells` (compact block; 6/6 criteria earned). C — `CounterPanel` re-verified as the unchanged top-down miniature (4/4). D — live 7/8-player verification in BOTH grid and list at iPhone-portrait: the on-card block is compact (≤2 rows) and fully contained, list mode no longer inherits the tall stacked shape (the original bug), side-seat glyphs upright, runtime cleanup complete (owned dev server port 5190 stopped, port released); 6/6 manual criteria observed, captures under the worktree's `.playwright-mcp/`. REQ-173's 3 reconciled diffs applied to `PRD/sections/functional-requirements.md`, `life-tracker/README.md`, `screen-layout.md`. `npm run quality:check` green (436/436) on the pushed head. Code PR #182 (`-work → main`) marked `[THEJUDGE-AUTO][READY]`; `STATUS.ship-ready` set in the deliverable. Advance to `review` | 2026-09-02 |

| 7 | review | opus | ok | `0 → 22` | No-write reviewer (fresh-context subagent, read/search only). Verdict **APPROVE** — PR #182 satisfies every acceptance criterion across slices A–D (43/43 tests, typecheck clean). On-card compact block (2×3 at 6, 2×4 at 8; ≤2 rows; never `layout.columns`/`rows`; never ceil-root-N; exactly one self/'me' at a fixed corner; same shape grid + list); panel unchanged (`buildSeatMapCells` miniature, REQ-112 bands, always-on decrements-life); REQ-173 applied with the reconciled compact-block wording; DEC-136 / DEC-139 preserved; presentation-only. Two Minor non-blocking notes: the 2-player block is 1×2 (within the ≤2-row rule, no containment risk); a `boundary-rules.mjs` mention — driver confirmed it is NOT in the PR diff (`git diff origin/main...origin/-work -- scripts/` empty; origin/main already carries the #181 fix). No loop-back. Advance to `land` | 2026-09-02 |

## Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-173` | accept | — |

## Open gate

- **PARKED at `land` (2026-09-02) — awaiting the owner's PR merge. This is the
  active gate.** The build half completed and the independent review APPROVED.
  **The owner merges the code PR — never the run.**
  - Code PR: https://github.com/ChrisMiho/TheJudge/pull/182 (`thejudge-auto/life-tracker-seat-map-work` → `main`), title `[THEJUDGE-AUTO][READY]`.
  - What it delivers: the on-card commander-damage preview is now a compact
    horizontal block (2×3 at 6 players, 2×4 at 8, ≤2 rows, contained in both grid
    and list layout, live-verified at 7 and 8 players); the counter panel is
    unchanged; REQ-173's three reconciled diffs are applied to `PRD/sections/`.
  - Evidence: all criteria earned (A 8/8, B 6/6, C 4/4, D 6/6); `npm run quality:check`
    green (436/436) on the pushed head; slice-D live captures under the worktree's
    `.playwright-mcp/`.
  - **Resume:** after merging PR #182, run `/graph-implement PRD/work/life-tracker-seat-map/`
    — it checks the PR is merged, records `land` as ok, and runs `close` (cleanup:
    fold this ledger into the receipt, confirm REQ-173 in `PRD/sections/`, delete
    the work folder). The base→main hop is this same PR; no separate merge remains.
  - Note (base frozen): since PR #182 opened, the driver's ledger/status commits
    (review, this land park) are LOCAL on `-work` only and are NOT on the PR; they
    reconcile at `close` against merged `main`.

- **RESOLVED 2026-09-02 — the layout-design gate is answered.** The owner clarified
  the intent in `observations.md` and confirmed the shape (chose "always compact &
  horizontal"): the on-card commander-damage mini-map is a **compact horizontal
  block** (≤2 rows, grows wider), the same in grid and list layout, extrapolated
  sideways for 7–8 players, and the whole card is never rotated. This resolves the
  paused gate. Because it overrides slice B's "miniature of the active arrangement"
  criteria, the build half re-scopes and re-enters at `gate-qc` → `plan` → `build`
  under the fresh run id `graph-20260902-121645`. See `## Build-half re-scope
  (2026-09-02)`. Original pause detail kept below for the record.

  (Historical) Not a tooling blocker. Slices A–C were implemented and green; the
  open question was the on-card commander-damage grid layout. Measured live: **grid
  mode correct** (horizontal, contained, 7 and 8 players), but **list mode at 8
  players rendered the grid vertical and overflowed the card bottom by ~4px**.
  Owner guidance: "just rotate the component, then fix the order displayed"; the
  `intake/references/` images are the target; a full geometry redesign was out of
  scope (grid mode already works). **Handoff: `PRD/work/life-tracker-seat-map/HANDOFF.md`.**

- **RESOLVED 2026-09-02 (historical): enforcement-tooling defect** — the build
  could not mark slice A's already-earned criteria as met because a stale
  attempt-1 denial trapped the retry (`criterion-flip-without-evidence` was not
  in `REMEDIABLE_RULES`). Fixed by PR #181 (merged) and integrated into `-work`.
  Original detail kept below for the record.

  **What was blocked, plainly:** the build could not mark slice A's acceptance
  criteria as met, even though the hook had already observed the evidence for all six.

  **Diagnosis (code-grounded):**
  - The A3 regex typo is fixed; A3 is now earned (`.worktrees/.graph-evidence.jsonl`,
    `16:56:36`). All six slice-A criteria A1–A6 have genuine hook-observed evidence
    for run `graph-20260902-093611`.
  - Attempt 1 tried to flip the criteria to `true` *before* A3 had evidence, so the
    hook correctly denied it with `criterion-flip-without-evidence` and logged that
    denial (`.worktrees/.graph-denials.jsonl`, `16:46:53`).
  - The `denied-command-retry` guard (`scripts/lib/boundary-rules.mjs`) now blocks
    **any** later `Edit` to `slice-a.criteria.json` for the rest of the run, because
    `denialKey()` keys a file-tool denial on tool+path only — it cannot tell the
    stale unevidenced attempt apart from the now-legitimate, fully-evidenced retry.
  - The retry guard steps aside only for rules in `REMEDIABLE_RULES`, which today
    holds just `"run-lock-removal"`. `criterion-flip-without-evidence` is a
    "earn the evidence first, then this is permitted" rule — exactly the shape that
    constant is for (see its docstring) — but it was never added.

  **Recommended fix (a small, separate graph-system change — do NOT put it in this
  feature's PR):** add `"criterion-flip-without-evidence"` to `REMEDIABLE_RULES`
  in `scripts/lib/boundary-rules.mjs`, and update the membership test in
  `scripts/lib/boundary-rules.test.mjs` (currently asserts `["run-lock-removal"]`)
  to include it. This preserves the guarantee: the `criterion-flip-without-evidence`
  rule still re-evaluates against the evidence log on retry, so a criterion can be
  flipped only when the hook actually observed its evidence — it just stops a stale
  denial from permanently trapping a legitimate, evidenced retry. Direct in-file
  precedent: `run-lock-removal` was added to this same set in August for the
  identical bug shape. Then run `npm run test:scripts` and commit that fix on its
  own branch/PR.

  **Alternative the owner may prefer:** make `denialKey` / the retry guard
  state-aware for criterion flips, or clear stale criterion-flip denials at each
  build attempt boundary — a more robust fix than widening `REMEDIABLE_RULES`.

  **State left behind (nothing lost):**
  - Worktree `.worktrees/implement-life-tracker-seat-map` (branch
    `implement-life-tracker-seat-map`, on `origin/thejudge-auto/life-tracker-seat-map-work`)
    preserved; slice-A code + tests staged, verified green. Nothing committed/pushed;
    no code PR exists yet.
  - Slice A `blocked` with a full `### Handoff` in `slice-a-seat-map-geometry.md`.
    Slices B/C/D not started. REQ-173 not yet applied to `PRD/sections/`.
  - Launch-checkout `slice-a.criteria.json` A3 fix is committed on
    `thejudge-auto/life-tracker-seat-map-work` (local); `main` untouched.

  **The fix is up as PR #181** (`fix/graph-remediable-criterion-flip` → `main`):
  adds `criterion-flip-without-evidence` to `REMEDIABLE_RULES` in
  `scripts/lib/boundary-rules.mjs` (+ tests; `npm run test:scripts` green, 436).
  https://github.com/ChrisMiho/TheJudge/pull/181

  **Resume sequence:**
  1. Merge PR #181 to `main`.
  2. Integrate the fix into this build branch so the *active* hook is the
     corrected one — the boundary hook runs from the launch checkout's working
     tree, and this branch (`thejudge-auto/life-tracker-seat-map-work`) forked
     `main` before the fix: `git checkout thejudge-auto/life-tracker-seat-map-work`
     then `git merge origin/main`. (The build worktree likewise rebases onto the
     updated `origin/thejudge-auto/life-tracker-seat-map-work`.)
  3. `/graph-implement PRD/work/life-tracker-seat-map/` — re-enters at `build`
     (`STATUS.owner-action` with `GAMEPLAN.md` present, `## Open gate` resolved);
     the resumed build flips A1–A6, completes slice A, then B/C/D, applies REQ-173,
     and opens the code PR into `main`.

- **Define gate — resolved 2026-09-02.** Owner answered `GATE-QUESTIONS.md`
  with `REQ-173: accept` (one verdict, three proposed diffs standing as authored)
  and merged the docs-only base→main PR. `graph-gate-review` applied the verdict
  (no change needed for `accept`), restored `STATUS.refined`, and updated the
  `PRD/work/STATUS.md` board row. The accepted diffs are applied to `PRD/sections/`
  by implementation at build.
- Docs PR: https://github.com/ChrisMiho/TheJudge/pull/180 (base→main, docs-only; MERGED)
- Stash handoff: node 1 stashed the launch checkout's uncommitted work (22 files).
  The stash is the owner's and is never dropped, popped, or reordered by the run.
  Restore it with:

  ```text
  git stash list | grep graph-preflight/graph-20260902-093611
  git stash apply stash@{0}
  ```

## Dispatch prompts

### preflight

```text
graph is controlling. You are node 1 (`preflight`) of an autonomous graph-kickoff run.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Invoke the `graph-preflight` skill (via the Skill tool) and follow it exactly. Inputs:
- --branch thejudge-auto/life-tracker-seat-map
- --run-id graph-20260902-093611

Do this:
1. Run the dry-run: `npm run graph:preflight -- --branch thejudge-auto/life-tracker-seat-map --run-id graph-20260902-093611 --dry-run`. Report the classification, resolved base, planned commands, and the two `profile sentinel:` / `Profile:` lines verbatim.
2. Honor the stop-sentinel refusal, the concurrency lock, and the base→main guard exactly as the skill states. If any of them blocks (exit 2), relay the message verbatim and STOP.
3. If not blocked, re-run the identical command without --dry-run and the same --run-id to create and push the branch, take the lock, and resolve any dirty tree.
4. Issue the universal `CANARY_COMMAND` the script names as a real Bash tool call, require the hook to DENY it, and report its ledger line. Then issue `GRAPH_CANARY_COMMAND` after the lock is taken, require a DENY, and report that ledger line too. An allowed canary is BLOCKED — report verbatim and stop.
5. Confirm end state: `git status --porcelain` (empty) and `git branch --show-current` (thejudge-auto/life-tracker-seat-map).

Report back, verbatim where the skill asks for verbatim: the branch, the resolved autonomous base (origin/<branch>), the preflight classification, both canary ledger lines, the Profile line, and any stash reference + restore command. Do not create the work-package folder — that is node 2's job. Do not proceed past preflight.
```

### shape

```text
graph is controlling. You are node 2 (`shape`) of an autonomous graph-kickoff run. thejudge-kickoff is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Slug (use exactly, do not rename): life-tracker-seat-map
Branch: thejudge-auto/life-tracker-seat-map

The request (verbatim): "Make the life-tracker commander-damage grid a per-seat map — 'me' at each player's own seat, opponents in their table directions on both the on-card preview and the counter panel, and fix map/name containment at 7–8 players"

Do this, in order:
1. Invoke the `thejudge-kickoff` skill (Skill tool) and follow it. Create the work package `PRD/work/life-tracker-seat-map/` with `IDEA.md` and `STATUS.ideation`. Use the slug `life-tracker-seat-map` verbatim — do NOT reuse the intake folder name `probe-life-tracker-seat-map`.
2. Copy the staged intake verbatim into the package: create `PRD/work/life-tracker-seat-map/intake/` and copy everything from `.worktrees/.graph-intake/graph-20260902-093611/` into it (the GRAPH-BRIEF.md, PROBE.md, and the whole references/ image folder). Stage those explicit paths — never `git add -A`.
3. Per the contract's 'Intake is evidence, never authority': treat the staged brief as a citation/evidence bundle. Record its findings and the four 'Decisions already made' it lists in IDEA.md as PROPOSED/claimed items to resolve at the define gate — NOT as settled truth. Do NOT open or fetch any document the brief itself cites beyond the staged files.
4. Grep `PRD/instructions/receipts/` for prior runs against the same ground (life-tracker, commander-damage, seat map, me cell). Write one `## Prior run` line per match into IDEA.md (flat list, no chain-walk).

Constraints:
- Do not edit `PRD/sections/`. Do not write outside `PRD/work/life-tracker-seat-map/`.
- If the request genuinely cannot be turned into an actionable package, return the exact string `NO ACTIONABLE PACKAGE` with the reason and stop.

Report back: the package path created, confirmation IDEA.md + STATUS.ideation + intake/ exist, the list of files copied into intake/, and any `## Prior run` receipt matches found (or none).
```

### define

```text
graph is controlling. You are node 3 (`define`) of an autonomous graph-kickoff run. thejudge-refinement is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user. Resolve each assumption with the assumption ladder in `PRD/instructions/preparation-contract.md`, evaluated fresh per question. Surface every genuine product decision as a `GATE-QUESTIONS.md` block rather than deciding it — the owner answers those at the define gate.

Invoke the `thejudge-refinement` skill (Skill tool) and follow it exactly. Read `IDEA.md` and the staged intake under `intake/` (GRAPH-BRIEF.md, PROBE.md, references/). Per the contract section on intake being evidence and not authority: the intake's findings and its four already-made decisions are claims to resolve at the define gate, never settled truth. Do not open or fetch any document the intake cites beyond the staged files.

Produce:
1. `DESIGN-BRIEF.md` — the shaped design for the per-seat map on the on-card commander-damage preview and the opened counter-panel matrix, built from the existing `seatArrangement` / `listSeatArrangement` geometry, plus the map/name containment fix at 7–8 players in both grid and list layouts. State the design direction, the acceptance criteria, and the surfaces touched (`PlayerLifeCard`, `CounterPanel`). Keep it agent-ready.
2. `GATE-QUESTIONS.md` — when (and only when) the design needs product-truth changes to `PRD/sections/`. Write one `## <STABLE-ID>` block per new or changed stable id. Each block opens with the plain-language gate lines from `PRD/instructions/plain-language-standard.md`, in order — What this decides / In plain terms / What happens if you say no — then that id's COMPLETE proposed diff (never a summary), then `- Verdict: <accept | edit | reject>` and `- Reason:`. The whole proposal gates: every proposed new stable id gets its own slot, not just the headline one.

Product truth the design is expected to touch (propose as diffs in `GATE-QUESTIONS.md`; do NOT edit `PRD/sections/`):
- `PRD/sections/life-tracker/README.md` — the counter-panel and commander-damage-matrix section, and the life-table section: make explicit that both the on-card preview and the panel matrix are seat maps (me at own seat, opponents in their table directions, per-seat viewpoint, no two me-cells coincident), and add the containment guarantee (map + name pill fit the card at 2–8, no clip).
- `PRD/sections/functional-requirements.md` — a new REQ for seat-consistent commander-damage placement across both surfaces, with containment acceptance criteria. Assign the REQ id yourself.
- `PRD/sections/screen-layout.md` — the life-tracker card entry: the map/name containment band at high player counts (fit, no clip, no gutter spill).

The decision log is retired; new product truth is REQ/FLOW proposed in `GATE-QUESTIONS.md`, applied to the feature specs only at build.

Open design choice the intake flags: the opened counter panel is not rotated, so its seat map is a top-down replica. Pick, via the assumption ladder, whether it orients the opener as the near/bottom seat (their own viewpoint) or as an absolute top-down replica with me highlighted; surface it as a gate question only if it is a genuine product fork under the three-condition test.

Constraints (from intake, do not reopen): pure frontend/presentation — touch no backend, no provider path, no GameContext seed contract, no persistence shape; do not reopen the counter-panel overlay shape (DEC-139, owned elsewhere) — change only the matrix arrangement inside the panel; keep the existing commander-damage behaviors (always-on decrements-life, the minus/plus bands, the me self-cell, seat rotation as sole orientation input); the map must derive from the active arrangement so it is correct in both grid and list mode.

Do not edit `PRD/sections/`, application code, or anything outside `PRD/work/life-tracker-seat-map/`. Set `STATUS.refining` while shaping and `STATUS.refined` on completion.

Report back: the DESIGN-BRIEF path, whether `GATE-QUESTIONS.md` was written and the list of stable ids it proposes (or a statement that no product-truth change is needed), the counter-panel orientation choice and how it was resolved, and any genuine product fork you surfaced as a gate question.
```

### gate-qc

```text
graph is controlling. You are node 4 (`gate-qc`) of an autonomous graph-kickoff run. thejudge-quality-check is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user.

Invoke the `thejudge-quality-check` skill (Skill tool) and follow it exactly. Validate `DESIGN-BRIEF.md` for PRD alignment and agent-readiness and produce a PASS or FAIL report. Do not write a GAMEPLAN or slice docs — that is the map-out node's job, not this one.

Check the design brief against the proposed product truth in `GATE-QUESTIONS.md` (REQ-173) and the current-state specs it amends: `PRD/sections/life-tracker/README.md`, `PRD/sections/functional-requirements.md`, `PRD/sections/screen-layout.md`. Confirm the brief is internally consistent with the proposed REQ-173 acceptance criteria, that it stays within the stated constraints (pure presentation; does not reopen DEC-139; preserves the commander-damage behaviors and DEC-136 rotation), and that it is specific enough for an implementer to slice without inventing product decisions.

On FAIL, set `STATUS.refining` and report the complete findings list so refinement can address them. On PASS, report PASS with the checked artifact path and an empty findings list.

Report back: PASS or FAIL, the checked artifact, and the complete findings list (or none).
```

### gate-review

```text
graph is controlling. You are the gate-review step of the build half of an autonomous graph run (graph-implement). graph-gate-review is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions of your own.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

The owner answered the `define` gate in `GATE-QUESTIONS.md` and merged the docs PR (#180) to `main`. Invoke the `graph-gate-review` skill (Skill tool) and follow it exactly.

Do this:
1. Read `PRD/work/life-tracker-seat-map/GATE-QUESTIONS.md`. It gates on exactly one stable id, REQ-173, with `- Verdict: accept`. Confirm the verdict slot is filled (not blank).
2. Apply the owner's verdict INSIDE `GATE-QUESTIONS.md` (finalize the proposal in the work folder). `accept` means the three proposed diffs stand as authored — do not alter their content. Never edit `PRD/sections/` (implementation applies it at build).
3. Restore `STATUS.refined` for the package, update the `PRD/work/STATUS.md` board row off `owner-action`, and record the verdict application.
4. Hand back the exact resume command.

Constraints: do not edit `PRD/sections/`, application code, or anything outside `PRD/work/life-tracker-seat-map/` (plus the shared `PRD/work/STATUS.md` board). Do not run git push, PR, or merge operations. A blank verdict slot means re-park unchanged — but REQ-173 is answered `accept`, so this should apply cleanly.

Report back: the verdict applied per stable id (REQ-173 → accept), confirmation `GATE-QUESTIONS.md` proposal is finalized, the new STATUS marker (`STATUS.refined`), the board-row update, and the exact resume command.
```

### gate-qc (attempt 2, build-half re-grade)

```text
graph is controlling. You are node 4 (`gate-qc`), attempt 2, of an autonomous graph run — build-half re-grade after the owner's define-gate verdict. thejudge-quality-check is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user.

Context: the owner answered the `define` gate with `REQ-173: accept` (no edits to the proposal) and merged docs PR #180. `graph-gate-review` restored `STATUS.refined`. This re-grade confirms the design brief still passes against the now-finalized proposal before the build half proceeds to map-out.

Invoke the `thejudge-quality-check` skill (Skill tool) and follow it exactly. Validate `DESIGN-BRIEF.md` for PRD alignment and agent-readiness and produce a PASS or FAIL report. Do not write a GAMEPLAN or slice docs — that is the map-out node's job.

Check the design brief against the finalized product truth in `GATE-QUESTIONS.md` (REQ-173, verdict accept) and the current-state specs it amends: `PRD/sections/life-tracker/README.md`, `PRD/sections/functional-requirements.md`, `PRD/sections/screen-layout.md`. Confirm the brief is internally consistent with the finalized REQ-173 acceptance criteria, stays within the stated constraints (pure presentation; does not reopen DEC-139; preserves the commander-damage behaviors and DEC-136 rotation), and is specific enough for an implementer to slice without inventing product decisions.

On FAIL, set `STATUS.refining` and report the complete findings list. On PASS, report PASS with the checked artifact path and an empty findings list.

Report back: PASS or FAIL, the checked artifact, and the complete findings list (or none).
```

### plan

```text
graph is controlling. You are node 5 (`plan`) of an autonomous graph run (build half). thejudge-map-out is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Invoke the `thejudge-map-out` skill (Skill tool) and follow it exactly. The package is `STATUS.refined` with a `## Preparation gate` recording `Quality-check: PASS` (build-half re-grade, attempt 2) — do not re-run quality-check; read that PASS and proceed.

Produce `GAMEPLAN.md` and lettered slice docs in `PRD/work/life-tracker-seat-map/`, and set `STATUS.active`. Slice the work from `DESIGN-BRIEF.md` and the finalized `GATE-QUESTIONS.md` (REQ-173, accept). The deliverable is pure frontend/presentation across two surfaces:
- the on-card commander-damage preview (`PlayerLifeCard`) becomes a per-seat map derived from the active arrangement (`seatArrangement` grid mode / `listSeatArrangement` list mode), the 'me' cell at the current player's own seat, each opponent at their seat, using the arrangement's real `columns`/`rows` (not `ceil(sqrt N)`);
- the opened counter panel's commander-damage matrix (`CounterPanel`) becomes the same seat map (top-down replica, opener highlighted as 'me'), removing the fixed two-column roster loop and the oversized 'me' tile;
- containment: the on-card map plus player-name pill stay fully inside the card at every player count 2 to 8 in both grid and list layout, verified live at 7 and 8 players at iPhone-portrait width (~430px).

Constraints (do not reopen): pure presentation — no backend, no provider path, no GameContext seed contract (DEC-102), no persistence shape (DEC-103); preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the 'me' self-cell, and seat rotation as the sole orientation input (DEC-136); do not reopen the counter-panel overlay/tray shape (DEC-139) — change only the matrix arrangement inside the panel. Apply REQ-173's three accepted diffs to `PRD/sections/` at BUILD, not now — map-out plans, it does not apply product truth.

Acceptance criteria per the contract's `## Acceptance criteria are earned, not written`: emit one `slice-<letter>.criteria.json` beside each slice doc, every criterion initialised `false`, each with an `evidence` block (a command pattern, one or more file paths, or a manual flag set true). The containment criterion is inherently a live-browser check — give it a manual flag or a browser-command evidence block, and have that slice carry the `PRD/instructions/runtime-process-hygiene.md` cleanup (browser-close, owned-process-stop, port-release, capture path) so build can run its own isolated dev server and capture 7/8-player screenshots.

Do not edit application code or `PRD/sections/`. Write only inside `PRD/work/life-tracker-seat-map/`.

Report back: the GAMEPLAN path, the ordered list of slices (letter + one-line intent), confirmation each `slice-<letter>.criteria.json` was emitted, and confirmation `STATUS.active` is set.
```

### build

```text
graph is controlling. You are node 6 (`build`) of an autonomous graph run. thejudge-implement-all is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Invoke the `thejudge-implement-all` skill (Skill tool) and follow it exactly. Implement every remaining slice (A, B, C, D) end to end in one session, in its own isolated worktree.

Branch/PR shape (the package's `## Autonomous metadata` records this; use it, do not re-derive):
- Recorded autonomous base: `origin/main` (the docs base merged to main via PR #180 — the answer-then-merge signal; this build branches off fresh main).
- Shared build branch: `thejudge-auto/life-tracker-seat-map-work` (already pushed to origin, carrying GAMEPLAN + slice docs + criteria). Base your contributor branch on `origin/thejudge-auto/life-tracker-seat-map-work`.
- The code PR opens from the shared branch into base `main` (a single code PR into main). `gh pr create --base main --head thejudge-auto/life-tracker-seat-map-work`. Opening a PR is allowed; never merge or close it — land is the owner's.
- Worktree at `.worktrees/implement-life-tracker-seat-map` (repo-local only). One worktree for the package.

Apply the approved product truth AT BUILD, by intent, together with the code (contract `## Applying product truth at build`): write REQ-173's three accepted diffs into `PRD/sections/functional-requirements.md` (new REQ-173), `PRD/sections/life-tracker/README.md`, and `PRD/sections/screen-layout.md`, re-derived against current truth from the finalized `GATE-QUESTIONS.md` (verdict accept) and `DESIGN-BRIEF.md`. These edits happen inside your worktree and ride the slice PR.

Deliverable (pure frontend/presentation): the on-card commander-damage preview (`PlayerLifeCard`) and the opened counter-panel matrix (`CounterPanel`) both become a per-seat map derived from the active arrangement (`seatArrangement`/`listSeatArrangement`), the 'me' cell at each player's own seat, opponents at their seats, using the arrangement's real columns/rows (not ceil(sqrt N)); and the on-card map plus name pill stay contained inside the card at every player count 2 to 8, verified live at 7 and 8 players. Preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the 'me' self-cell, seat rotation as the sole orientation input (DEC-136), and do not reopen the counter-panel overlay shape (DEC-139).

Acceptance criteria: earn every criterion in each `slice-<letter>.criteria.json` — the committed `PreToolUse` hook logs earned ids; a slice is `done` only when all its criteria are earned and its verification and `npm run quality:check` pass. Slice D's six `manual` criteria are live-browser checks: run your worktree's own isolated dev server (a port you own, never attach to an existing one), capture 7/8-player screenshots in grid and list at iPhone-portrait width, record a dated observation line naming each id, and complete the `PRD/instructions/runtime-process-hygiene.md` cleanup (browser-close, owned-process-stop, port-release, capture path under the worktree's `PRD/work/life-tracker-seat-map/.playwright-mcp/`).

Scope: write only inside `.worktrees/implement-life-tracker-seat-map/` and `PRD/work/life-tracker-seat-map/`. Do not edit any `thejudge-*` skill, `.claude/`, `CLAUDE.md`, or `.secrets/`. Do not force-push, merge, or close any PR. When every slice is `done`, set `STATUS.ship-ready`.

Report back: the worktree path, the code PR URL (head `thejudge-auto/life-tracker-seat-map-work`, base `main`), each slice's final status and earned-criteria confirmation, the `PRD/sections/` files edited (REQ-173 applied), the quality:check result, the slice-D capture path, and confirmation `STATUS.ship-ready` is set.
```

### build (attempt 2)

```text
graph is controlling. You are node 6 (`build`), attempt 2, of an autonomous graph run. thejudge-implement-all is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Resume the build. Attempt 1 fully implemented slice A (the `buildSeatMapCells` helper in `apps/frontend/src/lib/lifeTracker/seatMap.ts` plus test, and the `layout` prop threaded from `PlayerLifeTrackerApp` into `PlayerLifeCard` and `CounterPanel`) and verified it green (typecheck, vitest 32/32, quality:check on the staged tree). It parked because slice A criterion A3 was un-earnable due to a regex-escaping typo in `slice-a.criteria.json` — now fixed by the driver in the launch checkout (`^import` → `\^import`), which is the copy the hook reads. Slice A criteria A1, A2, A4, A5, A6 are already earned in the evidence log for this run.

Invoke the `thejudge-implement-all` skill (Skill tool) and follow it exactly. Resume the EXISTING worktree `.worktrees/implement-life-tracker-seat-map` (branch `implement-life-tracker-seat-map`, based on `origin/thejudge-auto/life-tracker-seat-map-work`) — do not recreate it; its slice-A work is staged and must be preserved.

Do this:
1. Ensure the worktree's own `PRD/work/life-tracker-seat-map/slice-a.criteria.json` A3 evidence pattern is the escaped form (backslash-caret import) matching the launch checkout. If it still has the unescaped caret, correct it in the worktree.
2. Re-issue slice A's A3 evidence command — grep with -n for the caret-anchored import pattern in `apps/frontend/src/lib/lifeTracker/seatMap.ts` — so the hook logs A3, then flip A3 to true. Confirm every slice-A criterion is now true, commit slice A, and complete it.
3. Implement slices B, C, D end to end, earning every criterion in each `slice-<letter>.criteria.json`. Slice D's six `manual` criteria are live-browser checks — run the worktree's own isolated dev server (a port you own), capture 7/8-player screenshots in grid and list at iPhone-portrait width, record a dated observation line per id, and complete the `PRD/instructions/runtime-process-hygiene.md` cleanup (browser-close, owned-process-stop, port-release, capture path under the worktree's `PRD/work/life-tracker-seat-map/.playwright-mcp/`).

Branch/PR shape (from `## Autonomous metadata`): recorded autonomous base `origin/main`; shared build branch `thejudge-auto/life-tracker-seat-map-work`; open ONE code PR `gh pr create --base main --head thejudge-auto/life-tracker-seat-map-work`. Opening is allowed; never merge/close it — land is the owner's.

Apply the approved product truth AT BUILD, by intent, together with the code: REQ-173's three accepted diffs into `PRD/sections/functional-requirements.md` (new REQ-173), `PRD/sections/life-tracker/README.md`, and `PRD/sections/screen-layout.md`, re-derived from the finalized `GATE-QUESTIONS.md` (accept) and `DESIGN-BRIEF.md`. Preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the 'me' self-cell, seat rotation as the sole orientation input (DEC-136); do not reopen the counter-panel overlay shape (DEC-139).

Scope: write only inside `.worktrees/implement-life-tracker-seat-map/` and `PRD/work/life-tracker-seat-map/`. Do not edit any `thejudge-*` skill, `.claude/`, `CLAUDE.md`, or `.secrets/`. When every slice is `done`, set `STATUS.ship-ready`.

Report back: the worktree path, the code PR URL (head `thejudge-auto/life-tracker-seat-map-work`, base `main`), each slice's final status and earned-criteria confirmation, the `PRD/sections/` files edited (REQ-173 applied), the quality:check result, the slice-D capture path, and confirmation `STATUS.ship-ready` is set.
```

### build (attempt 3)

```text
graph is controlling. You are node 6 (`build`), attempt 3, of an autonomous graph run. thejudge-implement-all is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-093611
Package: PRD/work/life-tracker-seat-map/

Resume the build. Slice A is fully implemented and verified green (the buildSeatMapCells helper in apps/frontend/src/lib/lifeTracker/seatMap.ts plus test, and the layout prop threaded from PlayerLifeTrackerApp into PlayerLifeCard and CounterPanel; typecheck, vitest 32/32, quality:check). All six slice-A criteria A1–A6 already have hook-observed evidence for this run. The two prior blockers are both fixed: the A3 criteria regex escape, and the boundary-hook fix (PR #181, merged) that makes criterion-flip-without-evidence remediable — so flipping the already-earned criteria is no longer trapped by the stale attempt-1 denial.

Invoke the `thejudge-implement-all` skill (Skill tool) and follow it exactly. Resume the EXISTING worktree `.worktrees/implement-life-tracker-seat-map` (branch `implement-life-tracker-seat-map`, based on `origin/thejudge-auto/life-tracker-seat-map-work`). Fetch and rebase it onto the updated `origin/thejudge-auto/life-tracker-seat-map-work` (now carries the A3 criteria fix and the merged boundary fix) before continuing; preserve the staged slice-A code.

Do this:
1. Flip slice A's criteria A1–A6 to true (all are earned) and complete slice A: commit it, and confirm every slice-A criterion is now true.
2. Implement slices B, C, D end to end, earning every criterion in each slice-<letter>.criteria.json. Slice D's six manual criteria are live-browser checks — run the worktree's own isolated dev server (a port you own), capture 7/8-player screenshots in grid and list at iPhone-portrait width, record a dated observation line per id, and complete the PRD/instructions/runtime-process-hygiene.md cleanup (browser-close, owned-process-stop, port-release, capture path under the worktree's PRD/work/life-tracker-seat-map/.playwright-mcp/).

Branch/PR shape (from `## Autonomous metadata`): recorded autonomous base `origin/main`; shared build branch `thejudge-auto/life-tracker-seat-map-work`; open ONE code PR: `gh pr create --base main --head thejudge-auto/life-tracker-seat-map-work`. Opening is allowed; never merge/close it — land is the owner's.

Apply the approved product truth AT BUILD, by intent, together with the code: REQ-173's three accepted diffs into PRD/sections/functional-requirements.md (new REQ-173), PRD/sections/life-tracker/README.md, and PRD/sections/screen-layout.md, re-derived from the finalized GATE-QUESTIONS.md (accept) and DESIGN-BRIEF.md. Preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the 'me' self-cell, seat rotation as the sole orientation input (DEC-136); do not reopen the counter-panel overlay shape (DEC-139).

Scope: write only inside `.worktrees/implement-life-tracker-seat-map/` and `PRD/work/life-tracker-seat-map/`. Do not edit any `thejudge-*` skill, `.claude/`, `CLAUDE.md`, `scripts/`, or `.secrets/`. When every slice is `done`, set `STATUS.ship-ready`.

Report back: the worktree path, the code PR URL (head `thejudge-auto/life-tracker-seat-map-work`, base `main`), each slice's final status and earned-criteria confirmation, the PRD/sections/ files edited (REQ-173 applied), the quality:check result, the slice-D capture path, and confirmation `STATUS.ship-ready` is set.
```

### gate-qc (attempt 3, build-half re-scope)

```text
graph is controlling. You are node 4 (`gate-qc`), attempt 3 (build-half re-scope), of an autonomous graph run. thejudge-quality-check is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-121645
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user, ask no questions, make no product decisions.

Context: the build half was paused for a layout-design clarification. The owner resolved it (see `GRAPH-RUN.md` `## Build-half re-scope (2026-09-02)` and `DESIGN-BRIEF.md` `## Owner clarification (2026-09-02)`): the on-card commander-damage mini-map becomes a compact horizontal block (<=2 rows, grows wider), the same in grid and list layout, extrapolated sideways for 7-8 players, whole card never rotated. `DESIGN-BRIEF.md` acceptance criteria 3-4 were revised to match. REQ-173 (the accepted product truth) is unchanged - this is a design-mechanism clarification, not a new product decision.

Invoke the `thejudge-quality-check` skill (Skill tool) and follow it exactly. Validate the UPDATED `DESIGN-BRIEF.md` for PRD alignment and agent-readiness and produce a PASS or FAIL report. Do not write a GAMEPLAN or slice docs - that is the map-out node's job.

Check the design brief against the finalized product truth in `GATE-QUESTIONS.md` (REQ-173, verdict accept) and the current-state specs it amends: `PRD/sections/life-tracker/README.md`, `PRD/sections/functional-requirements.md`, `PRD/sections/screen-layout.md`. Confirm specifically:
- The new '## Owner clarification (2026-09-02)' section is internally consistent with the rest of the brief and with REQ-173's containment intent (a compact horizontal block contained inside the card at 2-8 satisfies REQ-173's containment; it does not contradict the seat-consistency the panel still delivers).
- Revised acceptance criteria 3-4 are consistent with the clarification and with criterion 2 (the panel remains a seat map).
- The brief stays within the stated constraints (pure presentation; does not reopen DEC-139; preserves the commander-damage behaviors and DEC-136 rotation), and is specific enough for an implementer to slice without inventing product decisions.

On FAIL, set `STATUS.refining` and report the complete findings list. On PASS, report PASS with the checked artifact path and an empty findings list.

Report back: PASS or FAIL, the checked artifact, and the complete findings list (or none).
```

### define (build-half re-scope reconciliation)

```text
graph is controlling. You are node 3 (`define`), build-half re-scope reconciliation, of an autonomous graph run. thejudge-refinement is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions of your own.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-121645
Package: PRD/work/life-tracker-seat-map/

The owner has ALREADY decided the on-card commander-damage map design — do NOT re-open a gate question for it and do NOT ask the user. From `observations.md` and a confirmed design question, the on-card mini-map is a compact horizontal block (at most 2 rows, growing wider with more players), the same in grid and list layout, decoupled from the arrangement's tall shape and from `listSeatArrangement`'s stacking, extrapolated sideways for 7-8 players (e.g. a 2-by-4 block at 8 players), with the whole card never rotated. Seat-consistency (one self/'me' cell at the player's own seat, opponents by real direction, no two cards sharing a self cell) is preserved as a best-effort outcome WITHIN the compact block; where a table's true geometry cannot fit 2 rows (7-8 players), containment and the reference look win over exact directional fidelity. The counter panel is unaffected (it stays the top-down seat map). This is recorded in `DESIGN-BRIEF.md` under the '## Owner clarification (2026-09-02)' section.

A `gate-qc` re-validation just FAILED because two artifacts still commit to the OLD 'miniature of the active arrangement / real columns-and-rows' mechanism that the clarification overrides for the on-card map:
1. `DESIGN-BRIEF.md` acceptance criterion 1 still requires each opponent's on-card cell to sit at the seat that player occupies in the active arrangement, verified at 8 players — contradicting the compact-horizontal clarification. The supersession clause names only 'Design direction and acceptance criteria 3-4', leaving criterion 1 (and any other on-card prose that mandates the literal-arrangement grid) outside it.
2. `GATE-QUESTIONS.md` REQ-173 (accepted) — its Description, several Acceptance Criteria (especially 'the on-card map uses the arrangement's real columns-and-rows ... not ceil-root-N' and cells placed at their arrangement gridRow/gridColumn), and Notes commit the ON-CARD map to the literal arrangement shape, which the clarification supersedes. `seatArrangement(8)` is 2 columns by 4 rows and `listSeatArrangement(8)` is 2 by 5 — both exceed the at-most-2-rows cap.

Invoke the `thejudge-refinement` skill (Skill tool) and follow it exactly, in reconciliation mode: reconcile `DESIGN-BRIEF.md` and the REQ-173 proposal in `GATE-QUESTIONS.md` to the owner's compact-horizontal on-card decision, introducing NO new product decision beyond it. Specifically:
- In `DESIGN-BRIEF.md`: bring acceptance criterion 1 (and any on-card 'miniature of the active arrangement / real columns-and-rows' prose in 'What the player gets', 'Design direction', and 'Resolved decisions') into line with the compact-horizontal clarification. Extend the supersession clause to cover criterion 1. Keep the containment guarantee and the panel (top-down seat map) unchanged.
- In `GATE-QUESTIONS.md` REQ-173: rewrite ONLY the ON-CARD parts of the Description, Acceptance Criteria, and Notes so they describe the compact horizontal block (at most 2 rows, grows wider, contained at 2-8 in both layouts, extrapolate 7-8 sideways, never ceil-root-N, never the tall arrangement, whole card never rotated), while KEEPING: (a) the containment guarantee (map plus name pill inside the card at 2-8, verified live at 7 and 8), (b) the panel top-down-seat-map criteria unchanged, (c) the preserved behaviors/constraints (always-on decrements-life, the REQ-112 bands, DEC-136 rotation, DEC-139 not reopened), and (d) the seat-consistency promise softened to best-effort-within-the-compact-block per the clarification. Keep `- Verdict: accept` (the owner accepted the feature and clarified the mechanism); add a `- Reason:` line recording the 2026-09-02 reconciliation. Do NOT add a new gate question or a new stable id.

Constraints: do NOT edit `PRD/sections/`, application code, or anything outside `PRD/work/life-tracker-seat-map/`. Do NOT run git push, PR, or merge. The owner's decision is the input — do not re-surface it as a question. Set `STATUS.refined` on completion (this reconciles an already-accepted, already-decided proposal; it is not a fresh proposal needing owner review).

Report back: the files changed, a short list of what was reconciled in the brief and in REQ-173, confirmation the containment guarantee and panel criteria are unchanged, confirmation no new gate question or stable id was added, and the STATUS marker set.
```

### gate-qc (attempt 4, re-scope re-grade after reconciliation)

```text
graph is controlling. You are node 4 (`gate-qc`), attempt 4 (build-half re-scope re-grade after the reconciliation), of an autonomous graph run. thejudge-quality-check is being dispatched under the graph driver.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-121645
Package: PRD/work/life-tracker-seat-map/

Run non-interactively: do not pause for the user, ask no questions, make no product decisions.

Context: the prior gate-qc FAILED because DESIGN-BRIEF criterion 1 and REQ-173's on-card acceptance criteria/Description still committed the on-card map to the literal-arrangement mechanism. The `define` node (thejudge-refinement) reconciled `DESIGN-BRIEF.md` and the REQ-173 proposal in `GATE-QUESTIONS.md` to the owner's compact-horizontal on-card decision (on-card map = compact horizontal block, at most 2 rows, grows wider, decoupled from the arrangement, extrapolate 7-8 sideways, whole card never rotated), keeping the containment guarantee, the panel top-down seat map, and the preserved behaviors unchanged, with REQ-173 still `Verdict: accept`.

Invoke the `thejudge-quality-check` skill (Skill tool) and follow it exactly. Validate the reconciled `DESIGN-BRIEF.md` for PRD alignment and agent-readiness and produce PASS or FAIL. Do not write a GAMEPLAN or slice docs.

Confirm the two prior findings are resolved and no new inconsistency was introduced:
- No remaining on-card requirement or acceptance criterion mandates the literal-arrangement grid (real columns-and-rows, ceil-root-N, or per-seat arrangement gridRow/gridColumn) for the on-card map — the on-card map is uniformly described as a compact horizontal block contained at 2-8.
- `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` REQ-173 agree with each other on the on-card map.
- The panel (top-down seat map), the containment guarantee (map plus name pill inside the card at 2-8, verified live at 7 and 8), and the preserved behaviors/constraints (always-on decrements-life, REQ-112 bands, DEC-136, DEC-139 not reopened) are intact.
- The brief is specific enough for an implementer to slice without inventing product decisions.

On FAIL, set `STATUS.refining` and report the complete findings. On PASS, report PASS with the checked artifact and an empty findings list.

Report back: PASS or FAIL, the checked artifact, and the complete findings list (or none).
```

### plan (build-half re-scope re-slice)

```text
graph is controlling. You are node 5 (`plan`), build-half re-scope, of an autonomous graph run. thejudge-map-out is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-121645
Package: PRD/work/life-tracker-seat-map/

The package is `STATUS.refined` with a `## Preparation gate` recording `Quality-check: PASS` (build-half re-scope re-grade, attempt 4) — do not re-run quality-check; read that PASS and proceed.

This RE-PLANS an existing GAMEPLAN after the owner's compact-horizontal on-card clarification (see `DESIGN-BRIEF.md` `## Owner clarification (2026-09-02)` and the reconciled REQ-173 in `GATE-QUESTIONS.md`). The prior GAMEPLAN + slice docs + criteria encode the OLD 'on-card map = miniature of the active arrangement' design and MUST be regenerated to the compact-horizontal design. Invoke `thejudge-map-out` (Skill tool) and follow it exactly. Produce a fresh `GAMEPLAN.md` and lettered slice docs plus one `slice-<letter>.criteria.json` per slice (every criterion initialised false, each with an evidence block: a command pattern, file paths, or a manual flag), and set `STATUS.active`.

The deliverable is pure frontend/presentation across two surfaces:
- ON-CARD (`PlayerLifeCard`): the commander-damage preview is a COMPACT HORIZONTAL BLOCK — at most 2 rows, growing wider as players are added — matching the reference images, the SAME in grid and list layout, decoupled from the active arrangement's shape (never `layout.columns` by `layout.rows`, never ceil-root-N), with the self/'me' cell in the current player's own seat corner and opponents around it as a best-effort outcome within the block, extrapolated sideways for 7-8 players (e.g. a 2-by-4 block at 8 players). The whole card is never rotated; only the block's internal layout changes. Containment: the block plus player-name pill stay fully inside the card at every count 2-8 in BOTH layouts, verified live at 7 and 8 at iPhone-portrait (~430px).
- PANEL (`CounterPanel`): UNCHANGED from the prior design — the commander-damage matrix stays a top-down seat-map miniature of the active arrangement (opener highlighted as the self/'me' cell, each opponent's CommanderDamageCell at its own seat, unused slots empty), preserving the REQ-112 bands and decrements-life.

Because the on-card block and the panel matrix now use DIFFERENT geometry (compact block vs arrangement miniature), plan slice A (the shared `lib/lifeTracker/seatMap.ts` geometry) to provide BOTH: keep the arrangement-miniature builder the panel uses, and add a compact-horizontal-block builder for the on-card map (the exact helper shape/param is yours to design — a pure, framework-agnostic function like `seatArrangement.ts`, no React/DOM import). Slice B (on-card) renders the compact block; slice C (panel) is largely unchanged; slice D is the live 7/8-player containment plus side-seat glyph-orientation verification in both layouts, carrying the runtime-process-hygiene cleanup and the package Ship gates.

Constraints (do not reopen): pure presentation — no backend, no provider path, no GameContext seed contract (DEC-102), no persistence shape (DEC-103); preserve always-on commander-damage-decrements-life, the panel minus/plus bands (REQ-112), the self/'me' cell, and seat rotation as the sole life-zone orientation input (DEC-136); do not reopen the counter-panel overlay/tray shape (DEC-139). Apply REQ-173's accepted diffs to `PRD/sections/` at BUILD, not now — map-out plans, it does not apply product truth.

Slice B's criteria MUST reflect the compact-horizontal block (e.g. the on-card preview grid is at most 2 rows and grows wider; it does NOT use the active arrangement's columns/rows; the self/'me' cell is at the player's own seat corner) — do NOT carry over the old 'uses the arrangement's real columns/rows' criterion. Slice D's containment criteria stay live-browser/manual checks in both layouts at 7 and 8.

Do not edit application code or `PRD/sections/`. Write only inside `PRD/work/life-tracker-seat-map/`.

Report back: the GAMEPLAN path, the ordered list of slices (letter plus one-line intent), confirmation each `slice-<letter>.criteria.json` was emitted with the on-card criteria reflecting the compact block, and confirmation `STATUS.active` is set.
```

### build (build-half re-scope, attempt 1)

```text
graph is controlling. You are node 6 (`build`), build-half re-scope, of an autonomous graph run. thejudge-implement-all is being dispatched under the graph driver — run non-interactively, ask no questions, make no product decisions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Copy this exact `Working directory:` line, unchanged, into every prompt you write to any subagent of your own.

Run ID: graph-20260902-121645
Package: PRD/work/life-tracker-seat-map/

Invoke the `thejudge-implement-all` skill (Skill tool) and follow it exactly. Implement every remaining slice (A, B, C, D) end to end in one session, in its own isolated worktree.

This is a RE-SCOPED build after the owner's compact-horizontal on-card clarification. The prior build committed the OLD design (on-card preview = miniature of the active arrangement, sized to layout.columns by layout.rows, sharing `buildSeatMapCells` with the panel) on the shared branch. The NEW plan (fresh GAMEPLAN.md + slices A-D, criteria all false under run graph-20260902-121645) changes the ON-CARD map only:
- The on-card commander-damage preview becomes a COMPACT HORIZONTAL BLOCK — at most 2 rows, growing wider with more players — matching the reference images (`PRD/work/life-tracker-seat-map/intake/references/fullTable.PNG`, `player1..6.PNG`), the SAME in grid and list layout, decoupled from the active arrangement's shape (never layout.columns by layout.rows, never ceil-root-N), self/'me' cell in the current player's own seat corner, opponents around it as best-effort within the block, extrapolated sideways for 7-8 players (e.g. a 2-by-4 block at 8 players). The whole card is NEVER rotated; only the block's internal layout changes.
- The PANEL (`CounterPanel`) is UNCHANGED: its matrix stays the top-down arrangement miniature (`buildSeatMapCells`), REQ-112 bands and decrements-life preserved.

Slice A adds a NEW compact-horizontal-block builder to `apps/frontend/src/lib/lifeTracker/seatMap.ts` alongside the existing `buildSeatMapCells` (keep buildSeatMapCells for the panel). Slice B rewrites `PlayerLifeCard`'s on-card preview to render the compact block from the new builder. Slice C re-verifies `CounterPanel` is still the unchanged top-down miniature (re-touch only if slice A's export shape moved under it). Slice D is the live 7/8-player containment + block-shape + side-seat glyph-orientation verification, both layouts, against the references.

Branch/PR shape (from `## Autonomous metadata`; use it, do not re-derive):
- Recorded autonomous base: `origin/main`.
- Shared build branch / PR head: `thejudge-auto/life-tracker-seat-map-work` (already on origin at commit eaa5aef, carrying the fresh GAMEPLAN + slices + criteria + reconciled brief/REQ-173 + this run's ledger, PLUS the old-design A/B/C code as the starting point). Base the worktree on `origin/thejudge-auto/life-tracker-seat-map-work` and fetch/rebase onto it so you have the new plan; PRESERVE the existing A-slice code (`buildSeatMapCells` + the layout prop wiring) — it is reused, not rebuilt.
- Worktree at `.worktrees/implement-life-tracker-seat-map` (repo-local only; one worktree for the package). Publish the worktree's commits to the `thejudge-auto/life-tracker-seat-map-work` ref on origin, and open ONE code PR into base `main`: `gh pr create --base main --head thejudge-auto/life-tracker-seat-map-work` (or, if a PR from that head already exists, ensure it reflects the final deliverable). Opening a PR is allowed; never merge or close it — land is the owner's.

Apply the approved product truth AT BUILD, by intent, together with the code (contract `## Applying product truth at build`): write REQ-173's three accepted diffs — re-derived against current truth from the finalized, reconciled `GATE-QUESTIONS.md` (verdict accept) and `DESIGN-BRIEF.md` — into `PRD/sections/functional-requirements.md` (new REQ-173), `PRD/sections/life-tracker/README.md`, and `PRD/sections/screen-layout.md`. These edits happen inside your worktree and ride the code PR. NOTE the reconciled REQ-173 describes the on-card map as a compact horizontal block (NOT the arrangement's real columns/rows) — apply that reconciled wording, not the old.

Acceptance criteria: earn every criterion in each `slice-<letter>.criteria.json` — the committed PreToolUse hook logs earned ids; a slice is `done` only when all its criteria are earned and its verification and `npm run quality:check` pass. Slice D's six `manual` criteria are live-browser checks: run your worktree's own isolated dev server (a port you own, never attach to an existing one — servers on 5173/3000 belong to the launch checkout, do not use them), set the viewport to iPhone-portrait (~430px), capture 7- and 8-player screenshots in BOTH grid and list layout, confirm (visual read against the references) the on-card block is a compact horizontal block (at most 2 rows), fully contained (no clipped cell, name pill not crushed or spilled), record a dated observation line naming each id, and complete the `PRD/instructions/runtime-process-hygiene.md` cleanup (browser-close, owned-process-stop, port-release, capture path under the worktree's `PRD/work/life-tracker-seat-map/.playwright-mcp/`).

Scope: write only inside `.worktrees/implement-life-tracker-seat-map/` and `PRD/work/life-tracker-seat-map/`. Do not edit any `thejudge-*` skill, `.claude/`, `CLAUDE.md`, `scripts/`, or `.secrets/`. Do not force-push, merge, or close any PR. When every slice is `done`, set `STATUS.ship-ready`.

Report back: the worktree path, the code PR URL (head `thejudge-auto/life-tracker-seat-map-work`, base `main`), each slice's final status and earned-criteria confirmation, the `PRD/sections/` files edited (REQ-173 applied, reconciled wording), the quality:check result, the slice-D capture path, and confirmation `STATUS.ship-ready` is set.
```

### review (no-write reviewer, build-half re-scope)

```text
graph is controlling. You are node 7 (`review`) of an autonomous graph run — a fresh-context, NO-WRITE reviewer. You hold read and search tools only; you have no Write/Edit and must not modify anything. You are NOT invoking any thejudge skill.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260902-121645
Package: PRD/work/life-tracker-seat-map/

Grade the code deliverable in PR #182 (head `thejudge-auto/life-tracker-seat-map-work`, base `main`) against the slices' OWN acceptance criteria — nothing else. Read, in fresh context (do NOT look at any build agent's transcript):
- the PR diff: `gh pr diff 182`
- the built code at the PR head: it lives in the worktree `.worktrees/implement-life-tracker-seat-map/apps/frontend/src/...` (the launch checkout does NOT have it). Read full files there, or via `git show origin/thejudge-auto/life-tracker-seat-map-work:<path>`.
- the slice docs and criteria: `PRD/work/life-tracker-seat-map/slice-a-seat-map-geometry.md`, `slice-b-card-preview-seat-map.md`, `slice-c-counter-panel-seat-map.md`, `slice-d-live-containment-verification.md`, and each `slice-*.criteria.json`
- `DESIGN-BRIEF.md` (especially `## Owner clarification (2026-09-02)`) and the reconciled REQ-173 in `GATE-QUESTIONS.md`
- the reference images the design targets: `PRD/work/life-tracker-seat-map/intake/references/fullTable.PNG`, `player1..6.PNG`

The rubric is the slices' acceptance criteria (A1-A8, B1-B6, C1-C4, D1-D6). Confirm the code actually satisfies each. Focus on:
- ON-CARD: the preview is a compact horizontal block, at most 2 rows, growing wider (2-by-3 at 6, 2-by-4 at 8), NEVER derived from `layout.columns`/`layout.rows` and NEVER `ceil(sqrt(N))`; exactly one self/'me' cell at a fixed corner; the same shape in grid and list layout.
- CONTAINMENT: the on-card block plus name pill stay inside the card at 2-8 in both layouts (slice D's live checks cover 7 and 8).
- PANEL: `CounterPanel`'s matrix is UNCHANGED — still the top-down arrangement miniature via `buildSeatMapCells`, opener as the self/'me' cell, REQ-112 minus/plus bands and always-on decrements-life preserved.
- PRODUCT TRUTH: REQ-173 is applied to `PRD/sections/functional-requirements.md`, `life-tracker/README.md`, `screen-layout.md` with the reconciled compact-block wording (NOT the old 'real columns/rows' wording).
- PRESERVED: DEC-136 (seat rotation sole orientation), DEC-139 (panel overlay not reopened), no backend/provider/persistence change.

Severity rule (hard): a preference, a style note, or an improvement OUTSIDE the slices' stated acceptance criteria is NEVER Critical or Important and must NOT trigger a loop back to build. Flag only gaps that break correctness or a stated acceptance criterion. If the deliverable meets the criteria, APPROVE.

Do NOT write or edit any file. Report back: an overall verdict (APPROVE, or CHANGES-REQUESTED with each finding rated Critical / Important / Minor), and for each finding the criterion or correctness issue it violates with a file:line pointer. If APPROVE, say so plainly with a one-line basis per slice.
```

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Make the life-tracker commander-damage grid a per-seat map — 'me' at each player's own seat, opponents in their table directions on both the on-card preview and the counter panel, and fix map/name containment at 7–8 players" | answered-once | shape | — |
| "just the mini boxes … horizontal, not [rotate] the entire component" + "always compact & horizontal" (on-card mini-map is a compact horizontal block ≤2 rows, same in grid and list layout, extrapolate 7–8 sideways, never rotate the whole card) — from `observations.md` and the confirmed design question | answered-once | build (re-scope) | — |
