# Receipt — graph-run-boundary-enforcement

- Date: 2026-08-20
- Slug: `graph-run-boundary-enforcement`
- Status: shipped
- Decision: DEC-166
- Requirements: REQ-152..159, NFR-016, FLOW-020

Every safety boundary in the autonomous graph-run contract is now enforced by a
mechanism that fires without a launch flag. The owner can stop a run in flight,
and node 7 has a reviewer that cannot edit what it grades.

## Actions taken

- [x] Verified all nine slices `done` and all 64 acceptance criteria `true`.
- [x] Ran the autonomous merge-proof gate — all four checks passed. See
      `## Merge proof`.
- [x] `npm run quality:check` green on the merged base.
- [x] Reconciled DEC-166's impact list with what shipped; recorded six
      implementation deltas and the resolved `bypassPermissions` measurement in
      its `Notes`.
- [x] Confirmed no `PRD/sections/` file changed during implementation, so
      REQ-152..159, NFR-016, and FLOW-020 shipped exactly as refined.
- [x] Made no `system-map.md` change: DEC-166 records that no entry is added,
      for the same reason as DEC-163, DEC-164, and DEC-165 — agent workflow and
      repository configuration, with no product surface.
- [x] Removed the `PRD/work/STATUS.md` row and deleted
      `PRD/work/graph-run-boundary-enforcement/`.
- [x] Removed the implementation worktree and its local branch. The remote
      branch was not deleted.
- [x] No `GRAPH-RUN.md` in the package, so this receipt carries no `## Graph run`
      section. The work was built by `thejudge-implement-all` invoked directly,
      not by a graph run.

## Merge proof

The package's `## Autonomous metadata` recorded `Autonomous base:
origin/feature/graph-workflow-hardening`. All four checks passed:

1. **Branch** — cleanup ran on `feature/graph-workflow-hardening`, the recorded
   base exactly. The base still exists on the remote, so the deleted-base
   fallback path was not used.
2. **Pull request** — PR #93, located by its
   `thejudge-auto:v1:registered:graph-run-boundary-enforcement` marker. Merged
   2026-08-20T20:54:46Z as `b83a7f9`, base `feature/graph-workflow-hardening`.
   Verified through `gh pr view` with the API reachable; no local fallback was
   needed.
3. **Worktree** — `.worktrees/implement-graph-run-boundary-enforcement`,
   `git status --porcelain` empty, zero commits absent from the base tip.
4. **Runtime cleanup** — not applicable and stated as such. The GAMEPLAN's
   `## Browser verification` section records that no slice carries browser or
   dev-server acceptance criteria, so no cleanup evidence was required.

## Shipped behavior

**The hook.** `scripts/graph-boundary-hook.mjs`, registered as a `PreToolUse`
hook in the committed `.claude/settings.json`. It fires in every session and
inside every dispatched subagent, with no launch flag. Decision logic is pure and
lives in `scripts/lib/boundary-rules.mjs`, which holds every protected-path and
command literal; the hook does the file I/O and holds none of them, so the
counter and evidence writes it performs cannot trip
`scripts/protected-write-guard.test.mjs`.

**Two tiers.** The universal tier fires always: secrets access, force-push in
every flag and refspec form, remote branch deletion, `main`/`master` pushes,
`rm -rf`, `sudo`, `pkill`, `killall`. The graph tier fires only while a run holds
`.worktrees/.graph-run.lock`: protected-path writes, writes to the hook's own
records, removal of the lock or the stop sentinel, `nohup`, a background `&`, the
per-node tool-call cap, and a criterion flipped to `true` without evidence.

Gating the strict tier on the lock is what lets the hook be committed rather than
passed at launch: ordinary skill authoring and `CLAUDE.md` edits are untouched.

**It never fails closed.** An internal error prints a diagnostic and exits 0. A
hook that denied on its own bugs would brick every session in this repository.

**Kill switch.** The owner creates `.worktrees/.graph-stop`; the run halts at the
next node boundary with a terminal state written, the halt recorded under
`## Open gate`, the status marker and board row updated, and the lock released.
`graph-preflight` refuses to start while the sentinel exists, so throwing the
switch is not undone by the next invocation.

**Tool-call cap.** Each node carries a per-dispatch budget, counted against
`<run id>/<node>/<attempt>`. A loop-back is a new attempt with a fresh budget, so
the cap adds no third loop limit.

**Liveness.** A canary at run start — a command the universal tier must deny,
targeting a non-existent path so it is inert if it ever runs — and a counter
heartbeat between every node. Neither falls back to the permission profile.

**Criteria earned, not written.** `thejudge-map-out` emits one
`slice-<letter>.criteria.json` per slice with every criterion `false`. The hook
observes evidence and appends to an append-only log it alone writes; a write
setting a criterion `true` is denied unless the id is already logged.

**Node 7.** A fresh-context reviewer holding no write tools, grading against the
slice's own acceptance criteria, with a stated rule that a preference is never
Critical or Important.

**No-pre-authorization re-read.** One ordered pre-dispatch block — kill switch,
rule re-read, ledger check, run-state write, dispatch — so the rule cannot be
lost to compaction on a long run.

## What the independent reviewer caught

Node 7's first live dispatch found four defects in slices A and B; three were
confirmed real and fixed with regression tests in the same package:

- `&` inside a redirection was read as a background launch, so `npm run build
  2>&1` split into two segments and was denied under a live lock. That form
  appears in almost every command — it would have made the system unusable on the
  first real run, and it was invisible from inside the work.
- The secrets rule denied any token *containing* `.secrets/`, so it blocked
  discussion of the path, including slice A's own verification command. Matching
  is now anchored to path shape with pattern operands excluded.
- `git -C /elsewhere push --force` was allowed, because the rules keyed on
  `argv[1] === "push"`.
- The direct-invocation check compared a raw `file://` template against a
  percent-encoded `import.meta.url`, so a repository path containing a space
  would load the hook without running it — failing open, silently.

## Stated limits, carried into the contract

Recorded as limits rather than smoothed over, each in one place under
`## The boundary hook, and what it does not reach`:

1. Literal matching — a path or command assembled at runtime evades the hook.
2. `graph-ledger-check.mjs` remains a schema check over the driver's own report.
3. A `manual` criterion proves the check happened, not that it passed.
4. A missing run-state file degrades the cap, reported on every call.
5. The heartbeat degrades with it; the canary stays the binding proof.
6. Project hooks require workspace trust — a named `BLOCKED` condition.
7. `bypassPermissions` — measured, not guaranteed. On 2026-08-20, `claude`
   2.1.234, `pkill -f definitely-no-such-process-xyz` was **denied**. One
   command, one moment, one binary version.

Additionally: the per-node caps are estimates rather than measurements, because
no completed graph-run ledger existed to size them against. Only `build` rests on
an observation. They want re-tuning once real ledgers accumulate.

## Retirements

- The protected-path reach table's raw-Bash row no longer reads
  `enforcement: none`; it names the hook and its reach. No row in that table
  reads `none`.
- The two convention-only boundary notes for `nohup` and the trailing `&` are
  retired. The paragraph explaining why no permission rule can express them
  stays — it is the reason the hook exists.
- The stray line naming `graph-ui-shape` and `graph-enrich-define` as domain node
  packs is deleted. Never built, referenced once.
- The env sentinel and the ledger's `Profile:` field are demoted from
  load-bearing to informational. `.claude/graph-profile.json` is retained as a
  second layer, not deleted.

## Durable truth promoted

- `PRD/sections/decisions/doc-process.md` — DEC-166 `Notes` gained the shipped
  record, six implementation deltas, and the resolved `bypassPermissions`
  measurement.
- `PRD/instructions/graph-workflow-contract.md` — merged with the feature. Now
  describes the enforced system: node-table cap column, `## The owner's stop
  sentinel`, `## Node 7 — the no-write reviewer`, `## Acceptance criteria are
  earned, not written`, `## Hook liveness`, and `## The boundary hook, and what
  it does not reach` with its seven stated limits.
- `AGENT-SKILLS.md` — the `graph-run` row names the always-on boundary hook and
  the no-write reviewer at node 7.
- `PRD/sections/functional-requirements.md`, `non-functional-requirements.md`,
  and `user-flows.md` — unchanged. REQ-152..159, NFR-016, and FLOW-020 shipped
  exactly as refined; implementation forced no change.

## Requirement traceability

| Requirement | Slice | Evidence |
| --- | --- | --- |
| REQ-152 | A, B | Hook committed; live deny at top level and inside a dispatched subagent; `nohup` and background `&` denied under a lock |
| REQ-153 | B | Every graph-tier rule asserted with and without a lock; live proof both directions with the permission layer removed |
| REQ-154 | C | Halt rehearsal produced all five artifacts; dispatch and sentinel-removal denied; preflight refuses to start |
| REQ-155 | G | Live reviewer held no write tools, graded against the slice's criteria, changed nothing, found four defects |
| REQ-156 | D | Counter advances per call; deny fires exactly at the cap; loop-back starts fresh; missing run-state degrades |
| REQ-157 | F | Live round trip: denied, earned, denied, observed, allowed. Log append-only |
| REQ-158 | H | Ordered pre-dispatch block; rule text appears once; hook-observed log shows the read 3.9s before the write |
| REQ-159 | E | Canary denied with the hook installed, allowed with it removed; heartbeat classified three ways |
| NFR-016 | A, B, E | Ordinary session ran an edit, `git status`, and the suite with no denial; hook latency 42–46 ms |
| FLOW-020 | C | Five halt observations plus the preflight refusal |

## Verification

- `npm run quality:check` — exit 0 on the merged base.
- `npm run test:scripts` — 295 pass, 0 fail.
- Nine slices `done`; 64 of 64 criteria `true`.
- No secret-bearing path in the merged range `d2cc14b..b83a7f9`.

## Files

Created:

- `.claude/settings.json`
- `scripts/graph-boundary-hook.mjs`, `scripts/graph-boundary-hook.test.mjs`
- `scripts/lib/boundary-rules.mjs`, `scripts/lib/boundary-rules.test.mjs`
- `PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md`

Updated:

- `scripts/lib/protected-paths.mjs`, `scripts/graph-preflight.mjs`,
  `scripts/graph-preflight.test.mjs`, `package.json`
- `PRD/instructions/graph-workflow-contract.md`, `AGENT-SKILLS.md`
- `.claude/skills/graph-run/` and `.claude/skills/graph-preflight/`,
  `.claude/skills/thejudge-map-out/`, `.claude/skills/thejudge-implement-all/`,
  and their `.agents/skills/` mirrors
- `PRD/sections/decisions/doc-process.md`, `PRD/work/STATUS.md`

Deleted:

- `PRD/work/graph-run-boundary-enforcement/`

## Follow-ups

- `docs/whatIsGraph/graph-hardening-handoff.md` is the source document for this
  package's six findings, and the promotion checklist expected its findings
  marked closed or the file retired. It is **untracked local working material**,
  not in the repository, so there was nothing committed to update or retire.
  Cleanup did not commit it: sweeping untracked files into the repository is the
  owner's call, not cleanup's. All six findings are closed by this package, and
  the mapping is the requirement traceability table above.
- The per-node tool-call caps want re-tuning against real `GRAPH-RUN.md` ledgers
  once graph runs have actually completed.
