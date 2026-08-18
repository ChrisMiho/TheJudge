---
slug: graph-workflow
status: active
---

# graph-workflow

Autonomous graph workflow for TheJudge: a driver skill (`graph-run`) that chains
the eleven-skill `thejudge-*` lifecycle without per-step human input, plus
`graph-preflight`, a durable contract, a resumable ledger, per-node model
assignment, and a permission profile.

## Autonomous metadata

- Autonomous base: origin/feature/graph-workflow-hardening

## Package contents

| File | What it is |
| --- | --- |
| `DESIGN-BRIEF.md` | **Scope of record.** Supersedes `HANDOFF.md` |
| `GAMEPLAN.md` | Architecture, sequencing, verification checklist |
| `slice-a-*.md` … `slice-o-*.md` | The fifteen implementation slices |
| `HANDOFF.md` | Cold-start state and incident narrative: blockers, open items, decisions already made |
| `ideaBraindump.md` | Origin idea |
| `PLAN-spine.md` | The superpowers-era build plan for the spine (historical) |

## Product truth

- `DEC-163` — the spine, recorded retroactively
- `DEC-164` — boundaries enforced by scripts rather than prose
- `DEC-165` — Cursor dropped; `.claude/skills/` canonical, `.agents/skills/` its mirror
- `Q-005` — the leaked refinement on `rescue/fixture-leak-card-collection-20260817`

## Slices

Mapped 2026-08-18. One scope item per slice, in the brief's stated order.

| Slice | Item | Objective | Depends on | Status |
| --- | --- | --- | --- | --- |
| [A](./slice-a-drop-cursor.md) | 1 | Drop Cursor; `.claude/skills/` canonical; sync repointed | PR #90 merged | done |
| [B](./slice-b-node-sync.md) | 2 | Sync ports to Node through the protected-write helper | A | done |
| [C](./slice-c-protected-write-guard.md) | 3 | Protected-write drift guard passes on the current tree | B | planned |
| [D](./slice-d-profile-node-surface.md) | 8 | Profile matches the node command surface; `PROMPTED` state | A | planned |
| [E](./slice-e-explicit-staging.md) | 11 | Explicit staging — `git add -A` denied | D | planned |
| [F](./slice-f-profile-sentinel.md) | 9 | `Profile: loaded` becomes observed evidence | E | planned |
| [G](./slice-g-dispatch-validator.md) | 4 | Dispatch validator and `## Instruction ledger` | A | planned |
| [H](./slice-h-working-directory-pin.md) | 14 | Absolute working directory in every dispatch; node 6 write scope | G | planned |
| [I](./slice-i-concurrency-lock.md) | 15 | One run at a time — the concurrency lock | D, F | planned |
| [J](./slice-j-predicate-nodes-6-9.md) | 16 | The predicate covers nodes 6 and 9 | D | planned |
| [K](./slice-k-ledger-survives-close.md) | 10 | The run ledger survives `close` | J | planned |
| [L](./slice-l-define-gate-and-review.md) | 12+13 | `define` parks on any `PRD/sections/` diff; `graph-gate-review` | B, I, K | planned |
| [M](./slice-m-fixture-rig.md) | 5 | Fixture rig owns rep setup | C — **parallel-ready** | planned |
| [N](./slice-n-cleanup-fixture.md) | 6 | `thejudge-cleanup` fixture | J, K, M | planned |
| [O](./slice-o-remeasure-item-5.md) | 7 | Re-measure item 5 against the validator; ship gates | G, L, M | planned |

### Implementation map

| Surface | Slices |
| --- | --- |
| `.claude/graph-profile.json` | A, D, E, F |
| `.claude/skills/graph-run/**` | A, D, F, G, H, I, L |
| `.claude/skills/graph-preflight/**` | F, I |
| `.claude/skills/graph-gate-review/**` (new) | L |
| `.claude/skills/thejudge-*/**` | A, D, J, K |
| `scripts/lib/protected-paths.mjs`, `sync-agent-skills.mjs` | B |
| `scripts/protected-write-guard.test.mjs` | C |
| `scripts/graph-ledger-check.mjs` | G, H |
| `scripts/graph-preflight.mjs` | F, I |
| `scripts/fixture-rig.mjs` | M |
| `PRD/instructions/graph-workflow-contract.md` | A, C, D, E, F, G, H, I, J, L |
| `PRD/instructions/skill-fixtures/**` | G, M, N, O |
| Root docs (`AGENT-SKILLS.md`, `README.md`, `PRD/README.md`) | A, L |

**Sequential A→L with a stated blocker:** four single files carry most of the
package — the profile, `graph-run`'s SKILL, `thejudge-cleanup`'s SKILL, and the
contract — and several slices depend on the prior slice's artifact, not merely
its file. M is the one genuinely parallel-ready slice.

**Branch precondition — satisfied 2026-08-18.** PR #90 merged as `db91850`;
slices land on `feature/graph-workflow-hardening`, cut fresh from that merge.

> **History note — `e206506`'s commit subject is wrong.** It reads *"implement
> slices E to O"*, but the commit touches only Markdown: it adds this package's
> `DESIGN-BRIEF.md`, `GAMEPLAN.md`, and all fifteen slice docs at
> `Status: planned`, and flips `STATUS.ship-ready` to `STATUS.active`. It is the
> **map-out of A–O, not an implementation of them.** No slice code existed at
> merge time. The subject is permanent in `main`'s history and is not worth a
> rewrite — read this note instead of the log line.

**Not implementable under the graph profile:** the protected set denies
`Edit`/`Write` on `thejudge-*/**`, and slices A, D, J, K, O edit those files.
That deny is a graph-run boundary, not an authoring restriction — implement in an
ordinary session.

**No browser verification.** Skills, scripts, profile JSON, and docs — no
browser-observable risk per `PRD/instructions/runtime-process-hygiene.md`.

## Status

`active` — quality-check PASS and mapped 2026-08-18 into fifteen slices (A–O). Reopened 2026-08-17
after a workflow review found nine boundaries outside the brief's three; scope
grew from seven items to sixteen. The fifth
quality-check pass returned FAIL on five enumeration errors, all now corrected
against the tree and approved by the owner on 2026-08-18: the §1 gate's real
output (29 = 24 scrubbed + 5 deleted under `.cursor/`), where the terminal
states actually live, the `rm` deny set, the full stale-file list for the third
graph skill, and one DEC-163 edit that had already landed.

**Sixth quality-check pass — PASS** (2026-08-18, run after map-out at the
owner's direction). All seven checklist items pass; three are N/A because the
package touches no product UI, API, prompt, or screen. Every enumeration the
fifth pass flagged was re-run against the tree and held exactly:

- §1 gate command 2 prints **29**, decomposing as **24 + 5** — the 24 scrub-list
  files and the 5 tracked paths under `.cursor/` that carry the word, matching
  the checklist file for file
- Every cited line number resolves: `AGENT-SKILLS.md` 6/8/15/26/31/97-98/124/
  129/135/144, the four skill-tree lines, `doc-lifecycle.md:74`,
  `workflow-reference.md:6-8` and `:22`, contract 20/32-34/123/132/193/212-218/
  234, `graph-run` SKILL `:121` with `## Terminal states` at `:128`, reference
  `:60`/`:77-85`/`:133`
- Terminal states appear **nowhere** in `graph-workflow-contract.md` — the
  brief's claim that `graph-run/SKILL.md` is their only home holds
- §3's buildability proof is real: the four protected-literal scripts perform
  **zero** anchored write calls, and the eleven disk writers are exactly the
  eleven named — disjoint sets, so the guard passes with no refactor
- The substring collisions are genuine (`dev.mjs:3,29,33`,
  `graph-preflight.mjs:17,18,132`), so the anchored-call-form requirement is
  load-bearing as stated
- `doc-process.md:167` already reads "fourteen" and already names
  `graph-gate-review` — the "already landed, do not look for it" note is accurate

Two non-blocking observations recorded, neither changing what gets built: the
brief abbreviates `ci-workflow-parity.test.mjs`'s anchor regex (actual:
`/^npx vitest run --coverage .*--reporter=blob --shard=/`), and
`thejudge-kickoff/reference.md:14` says "All 10 are model-invocable" when eleven
`thejudge-*` skills exist — pre-existing drift, unrelated to the third graph
skill, on a line slice A already edits.

### Added on reopen

Mechanical gaps, found by reading `.claude/graph-profile.json` against the node
table instead of against the contract's prohibition list:

- **8** — the profile does not match what the nine nodes actually run. Node 9
  (`close`) has *no permitted delete mechanism*: six `rm` denies that are all
  force forms, no `git rm` allowed, and a bare `rm -r` that is unlisted and so
  prompts — the first profiled run stalls there either way. Node 6's
  preparation-worktree removal is unlisted too. Adds a `PROMPTED` terminal state
  to `graph-run`'s table, because a permission prompt in an autonomous session
  is a hang, not a park.
- **9** — an `env` sentinel in the profile makes `Profile: unverified` an
  observation instead of the user's word.
- **10** — `thejudge-cleanup` deletes the folder holding `GRAPH-RUN.md`, so the
  refusal ledger survives only until the run succeeds. It now folds both ledger
  tables verbatim into the receipt first.
- **11** — `git add -A`, `--all`, and `.` become profile denies. That command
  committed the 2026-08-17 leak and had no rule anywhere.

Control decisions made by the owner on reopen:

- **12 + 13** — `define` parks on any `PRD/sections/` diff, and a third graph
  skill, `graph-gate-review`, walks it one stable ID at a time and resumes the
  run. `land` was otherwise the first human touch, so code would exist against
  product truth nobody had read. The two ship together: a park with no way
  through it gets routed around.
- **14** — every dispatch pins an absolute working directory and propagates it to
  nested prompts; node 6's writes are asserted in scope. Item 5 fixed this for
  fixture reps only, and the production dispatch path has the identical
  inheritance.
- **15** — `graph-preflight` takes a concurrency lock. Two runs share one launch
  checkout otherwise.
- **16** — the predicate extends to `thejudge-implement-all` and
  `thejudge-cleanup`.

Four limits are stated rather than fixed — see the brief's `## Stated limits`.
The sharpest: item 4's validator reads a self-report, so it is the one check in
this work that does not read ground truth.

### Prior passes

The spine is built on
`feature/graph-workflow-spine` (PR #90, open), but three boundaries the workflow
depends on were written as prose and all three failed under measurement —
including one that wrote product truth into `PRD/sections/` on 2026-08-17. This
pass converts them to mechanical checks and cuts the skill surface from three
runtimes to two.

Every issue raised across the three passes is resolved:

- **First FAIL** — the protected-path guard states its reach per writing
  mechanism instead of claiming to cover all of them, and `## Instruction ledger`
  replaces `## Refused instructions` outright rather than overlapping it.
- **Second FAIL, issue 1** — the drift guard's reach is now protected-path writes
  only, with the eleven existing disk-writing scripts named and their refactor
  recorded as a non-goal. The mechanism is pinned by reference to
  `scripts/ci-workflow-parity.test.mjs`: a source-text scan with a declared
  exemption list holding exactly one entry, the helper itself. Fixed in
  `DESIGN-BRIEF.md` §3 and DEC-164's Impact.
- **Second FAIL, issue 2** — slice 1 repoints `scripts/sync-agent-skills.sh` to
  `.claude/skills/` in the same slice that deletes `.cursor/`, so
  `npm run skills:ai-sync` works at every commit. Recorded in `DESIGN-BRIEF.md`
  §1 and DEC-165's Impact.

- **Third FAIL, issue 1 — the scrub enumeration missed nine files.** §1 now
  carries an exhaustive 24-file checklist, built by running the gate against the
  tree rather than by reading prose: the three unnamed `SKILL.md` command-prefix
  lines (`thejudge-kickoff:67`, `thejudge-map-out:66`, `thejudge-refinement:74`,
  in both trees), `PRD/instructions/doc-lifecycle.md:74`,
  `PRD/instructions/workflow-reference.md:22`, and the guide's sixth file,
  `templates/PRD/instructions/workflow-reference.md:11`. The skill-tree rows are
  stated as four edits in `.claude/skills/` regenerated into the mirror, not
  eight hand-edits. Also in DEC-165's Impact.
- **Third FAIL, issue 2 — the verification criterion could not go green.**
  Replaced with two commands whose exit status is the gate:
  `git ls-files | grep -i '\.cursor'`, and `git grep -lwiI cursor` excluding the
  five legitimate-keep categories by pathspec. The keeps are named as part of
  the criterion — DEC-165's own body among them — instead of being an oversight
  in it. Three things the old form got wrong are now stated: an unqualified grep
  can never pass; `-w` makes card data a non-issue (every hit is *Precursor
  Golem*), so no data-file exclusion is needed; and on macOS `grep -r … .`
  prints bare paths, so the old `'^\./…'` anchors silently matched nothing and
  every exclusion was a no-op. Run against `fcafd31`, command 2 prints exactly
  the 24-file checklist — gate and checklist are the same set.
- **Precision items.** §3's script count is four, with a table naming each
  protected literal and confirming no writes (`dev.mjs:5` was the missing one).
  Call-form matching is now stated as load-bearing, with the two concrete
  substring collisions on the current tree — `platform`/`SIGTERM` containing
  `rm`, `renameSources` containing `rename` — and the anchored regex
  `ci-workflow-parity.test.mjs` actually uses. Also in DEC-164's Impact.

All four items verified against the tree at `fcafd31` before editing.

**Fourth pass — PASS.** Every enumeration in the brief was re-run against the
tree at `fcafd31` and held exactly: the 24-file scrub checklist matches the
gate's output, all cited line numbers are correct (`AGENT-SKILLS.md` 8/15/26/31/
124/129/135/144, the four skill-tree lines, `doc-lifecycle.md:74`,
`workflow-reference.md:22`, contract 123/132/193, `graph-run` SKILL 121 /
reference 133), the four protected-literal scripts perform no anchored write
calls, the eleven writers are the right eleven, and the `sync-agent-skills.sh`
diff matches the file byte for byte.

Mapped 2026-08-18. Next: `/thejudge-implement PRD/work/graph-workflow/ slice A`
for one slice, or `/thejudge-implement-all PRD/work/graph-workflow/` for an
unattended pass — **after PR #90 merges and a fresh branch is cut from `main`**.
