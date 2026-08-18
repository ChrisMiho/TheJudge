# GAMEPLAN — graph-workflow hardening

Scope of record: `DESIGN-BRIEF.md`. This file states architecture, data flow,
sequencing, and the verification checklist. Slice docs `slice-a-*.md` …
`slice-o-*.md` carry the executable detail.

Product truth: **DEC-163** (the spine), **DEC-164** (enforcement model),
**DEC-165** (two runtimes, `.claude/skills/` canonical) in
`PRD/sections/decisions/doc-process.md`. Open question: **Q-005**.

## What a run experiences

Today an autonomous run is asked to behave. Sixteen scope items turn three
behavioural asks into checks the run has to pass, and close the mechanical gaps
that would stall a profiled run before it ever reaches them.

Three boundaries failed under measurement and are converted here:

| Boundary | Was | Becomes |
| --- | --- | --- |
| No pre-authorization of product decisions | Prose at three layers | `scripts/graph-ledger-check.mjs`, run **before** dispatch (slice G) |
| Fixture rep isolation | "Work in your clone" in a prompt | `scripts/fixture-rig.mjs` owning clone + bare origin + before/after snapshot (slice M); absolute `Working directory:` in every production dispatch (slice H) |
| Staging discipline | Convention | Profile denies on `git add -A` / `--all` / `.` (slice E) |

## Architecture

### Three enforcement layers, each with stated reach

| Layer | Mechanism | Reach |
| --- | --- | --- |
| Agent `Edit`/`Write` | `.claude/graph-profile.json` deny rules | Only in a session launched with `--settings`; slice F makes that loading observable via an `env` sentinel |
| `node scripts/*` | `scripts/lib/protected-paths.mjs` + `scripts/protected-write-guard.test.mjs` | Non-test `scripts/**/*.mjs`; protected-path writes only, one declared exemption |
| Raw Bash (`cp`, `rsync`, redirection) | none | Convention. Detected after the fact by the rig snapshot (M) and the sync drift check (C). Never claimed as enforced |

Protected set: `.secrets/**`, `CLAUDE.md`, `.claude/graph-profile.json`,
`.claude/settings*.json`, and `thejudge-*/**` in both skill trees.

### Skill-tree data flow after slice B

```
.claude/skills/   canonical — edit here (Claude Code reads)
      |  npm run skills:ai-sync  ->  node scripts/sync-agent-skills.mjs
      |  mirrorSkillTrees() in scripts/lib/protected-paths.mjs
      v            (the single declared protected-write)
.agents/skills/   mirror (Codex reads) — never hand-edited
```

### Graph skills after slice L

`graph-preflight` (lock + sentinel report) → `graph-run` (nine nodes) →
on a `define` park, `graph-gate-review` walks the recorded `PRD/sections/` diff
one stable ID at a time and resumes the run. Three graph skills; catalog becomes
fourteen.

### Terminal states

`.claude/skills/graph-run/SKILL.md` `## Terminal states` is the **single**
authority. Slice D adds `PROMPTED` there and gives
`graph-workflow-contract.md` a one-line pointer, never a second copy. Slice I's
lock releases on every state in that table by reference, not by re-enumeration.

## Sequencing

**Branch precondition.** Per the brief's `## Sequencing`, slices A–O land on a
fresh branch off `main`, **after PR #90 (`feature/graph-workflow-spine`) merges**
— those 31 commits touch the skill trees that slice A rewrites. Do not start
slice A on `feature/graph-workflow-spine`.

**Ordering rationale.** A decides which trees exist, so it is first. B and C are
the write-guard foundation. D is next because a profiled run cannot reach node 9
without it, regardless of how well A–C are built. Everything after builds on
those four.

**Sequential by default here, with a stated blocker.** Slices A–L are a chain
because they contend on four single files —
`.claude/graph-profile.json` (A, D, E, F), `.claude/skills/graph-run/SKILL.md`
(A, D, G, H, L), `.claude/skills/thejudge-cleanup/SKILL.md` (D, J, K), and
`PRD/instructions/graph-workflow-contract.md` (nearly all) — and several depend
on the prior slice's artifact, not merely its file. Slice M is genuinely
parallel-ready after C.

**Standing rule for every slice touching `.claude/skills/**`:** run
`npm run skills:ai-sync` and commit the regenerated `.agents/skills/` in the
same commit. Never hand-edit the mirror. `diff -rq .claude/skills .agents/skills`
must produce no output at the end of every such slice.

**These slices cannot be implemented under the graph profile.** The protected set
denies `Edit`/`Write` on `thejudge-*/**`, and slices A, D, J, K, and O edit
`thejudge-*` skill files. That deny is a graph-run boundary, not an authoring
restriction — implement this package in an ordinary session.

## Slice map

| Slice | Scope item | Objective | Depends on |
| --- | --- | --- | --- |
| A | 1 | Drop Cursor; `.claude/skills/` canonical; sync repointed | PR #90 merged |
| B | 2 | Sync ports to Node through the protected-write helper | A |
| C | 3 | Protected-write drift guard passes on the current tree | B |
| D | 8 | Profile matches the node command surface; `PROMPTED` state | A |
| E | 11 | Explicit staging — `git add -A` denied | D |
| F | 9 | `Profile: loaded` becomes observed evidence | E |
| G | 4 | Dispatch validator and `## Instruction ledger` | A |
| H | 14 | Absolute working directory in every dispatch; node 6 write scope | G |
| I | 15 | One run at a time — the concurrency lock | D, F |
| J | 16 | The predicate covers nodes 6 and 9 | D |
| K | 10 | The run ledger survives `close` | J |
| L | 12+13 | `define` parks on any `PRD/sections/` diff; `graph-gate-review` | B, I, K |
| M | 5 | Fixture rig owns rep setup | C (parallel-ready) |
| N | 6 | `thejudge-cleanup` fixture | J, K |
| O | 7 | Re-measure fixture item 5 against the validator; ship gates | G, L, M |

## Browser verification

**Not required.** Per `PRD/instructions/runtime-process-hygiene.md`, this package
is skills, scripts, profile JSON, and documentation — no browser-observable risk,
no UI surface, no dev server. No slice carries Playwright scenarios or
cleanup-evidence criteria. Any slice that nonetheless starts a browser or server
must record the full ownership/cleanup evidence that document requires.

## Verification checklist

Every item is the brief's `## Verification` list, bound to the slice that owns it.

- [ ] `npm run quality:check` green, including the new `test:scripts` guards — every slice
- [ ] `npm run skills:ai-sync` succeeds at the end of slice A, before the Node port exists — A
- [ ] `diff -rq .claude/skills .agents/skills` produces no output after `npm run skills:ai-sync` — A, B, and every skill-touching slice
- [ ] Both §1 gate commands exit non-zero; the five legitimate-keep categories survive, DEC-165's own body among them — A
- [ ] The Node sync's output is byte-identical to the bash script's, proved by `diff -rq` against the pre-port mirror — B
- [ ] `protected-write-guard.test.mjs` passes on the current tree with exactly one exemption — including `dev.mjs` and `graph-preflight.mjs`, which a substring matcher fails — and fails a planted protected-path writer — C
- [ ] The node-command enumeration is recorded in the slice doc, and every command resolves to an `allow` entry or is deliberately denied with the node's park/`PROMPTED` behavior stated — D
- [ ] A dry-run of node 9's delete mechanism against a scratch package folder completes under the profile without a prompt — D
- [ ] `git add -A` and `git add .` are refused under the profile; path-scoped `git add PRD/work/<slug>/README.md` still succeeds — E
- [ ] `graph-preflight` reports the env sentinel's value; a session launched without `--settings` reports absent and the ledger reads `unverified` — F
- [ ] The validator fails a dispatch prompt carrying conditional-future authorization, and fails a quoted user instruction with no `## Instruction ledger` row — G
- [ ] Every dispatch prompt in a completed `GRAPH-RUN.md` contains an absolute `Working directory:` line, verified by the ledger check — H
- [ ] A second `graph-run` launched while a run holds the lock refuses and names the holding slug, run ID, and PID; a lock held by a dead PID is reported stale — I
- [ ] `thejudge-implement-all` and `thejudge-cleanup` each carry a `## Mode` section naming `graph-run is controlling` — J
- [ ] A `thejudge-cleanup` run against a package holding a `GRAPH-RUN.md` refuses to delete the folder until the receipt carries `## Graph run` with both tables verbatim — K
- [ ] A `define` node writing nothing to `PRD/sections/` advances to `gate-qc`; one writing a single REQ row parks with that row's complete diff under `## Open gate` — L
- [ ] `graph-gate-review` against a parked package leaves `STATUS.refined`, a resolved `## Open gate`, a `## Gate verdicts` row per stable ID, and a `/graph-run` that resumes at `gate-qc` — L
- [ ] A `reject` verdict removes the ID from `PRD/sections/` and no later refinement reuses that number — L
- [ ] Every fixture run ends with the rig's after-snapshot asserting `git -C <real-repo> status --porcelain` empty; recording results is a separate deliberate commit after that assertion passes — M, N, O
- [ ] `thejudge-cleanup` fixture measured and recorded — N
- [ ] Fixture item 5 measured 3 of 3 against the validator, with variance recorded — O

## Stated limits carried into implementation

From the brief's `## Stated limits` — a slice must not quietly close one of these
by inventing scope:

- The dispatch validator (G) polices testimony, not ground truth. It reads a
  self-report. Transcript-side closure is out of scope.
- Node 7's independence is nominal — `superpowers:requesting-code-review` is not
  gated on the predicate and is out of scope (J covers 6 and 9 only).
- No cost or wall-clock budget. Accepted by the owner 2026-08-17.
- The env sentinel (F) proves the profile file loaded, not that any deny rule
  fired. `nohup` and trailing `&` stay convention.

## Non-goals

Per the brief: backlog clearing, the `graph-ui-shape` and `graph-enrich-define`
packs, rewriting receipts or `PLAN-spine.md` for historical Cursor references,
restructuring `.agents/skills/` beyond its mirror role, routing the eleven
existing disk-writing scripts through the helper, PRD corpus reorganization,
scheduling, re-measuring item 5 as a wording experiment, and ruling on
`rescue/fixture-leak-card-collection-20260817` (Q-005).
