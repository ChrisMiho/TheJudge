# Slice I — Contract retirement, stated limits, and promotion

## Status: done

## Goal

Rewrite the contract so it describes the enforced system rather than the
convention-only one, retire the text this work supersedes, and record every
stated limit as a limit.

## Requirements

REQ-152..159, NFR-016, FLOW-020, DEC-166. This slice writes no new mechanism; it
makes the documentation match the eight slices that did.

1. **Retire the protected-path reach table's raw-Bash row.** `cp`, `rsync`, and
   redirection are no longer `enforcement: none`. The row names the hook and
   states its reach.
2. **Retire the two convention-only boundary notes.** `nohup` and the trailing
   `&` are enforced by the hook (slice B). The paragraph explaining why no
   permission rule can express them stays — it is the reason the hook exists —
   but it no longer ends in "convention only".
3. **Delete the stray domain-node-pack line** naming `graph-ui-shape` and
   `graph-enrich-define` at `graph-workflow-contract.md:23`. Never built,
   referenced once, and the only frontend/backend split in the workflow.
   `graph-single-door-workflow/IDEA.md` records that this package owns the
   deletion, so it is deleted here and nowhere else.
4. **Demote the env sentinel and the ledger's `Profile:` field** from
   load-bearing to informational. Both survive. The hook is the enforcer; the
   profile is belt-and-braces and is not deleted.
5. **Record the stated limits** as limits, not as claims: literal matching, the
   `graph-ledger-check.mjs` self-report, the `manual` criterion, the degraded
   cap and the degraded heartbeat that follows it, workspace trust, and slice
   A's `bypassPermissions` measurement written as the measurement observed with
   the binary version.
6. Update `AGENT-SKILLS.md` for the node-7 change and the new hook surface.

## Acceptance criteria

- [x] `grep -n "graph-ui-shape\|graph-enrich-define" PRD/ .claude/ -r` returns
      nothing outside `PRD/work/`.
- [x] `grep -n "convention only\|Convention\." PRD/instructions/graph-workflow-contract.md`
      returns no hit describing `nohup`, the trailing `&`, or raw Bash writes.
- [x] The reach table's raw-Bash row names the hook and its reach; no row in
      that table reads `none`.
- [x] The contract states the `bypassPermissions` measurement as observed, with
      the command, the result, and the binary version from slice A — never as an
      assertion that a deny survives it.
- [x] Each of the seven stated limits appears in the contract, each in one place.
- [x] Every REQ-152..159 acceptance criterion is traceable to a shipped slice.
      This slice records the mapping — requirement id → slice letter → evidence.
- [x] `npm run quality:check` green.
- [x] `npm run skills:ai-sync` run and the mirror clean in
      `git status --porcelain`.

## Verification record

### Retirements applied

| # | Retirement | Evidence |
| --- | --- | --- |
| 1 | Reach table's raw-Bash row | Now names `scripts/graph-boundary-hook.mjs` and its reach. The agent `Edit`/`Write` row names the hook as primary and the profile as a second layer. `grep -n "^| .* | none |"` returns nothing |
| 2 | Two convention-only boundary notes | The paragraph explaining why no permission rule can express `nohup` or a trailing `&` **stays** — it is the reason the hook exists — and now ends by naming the two graph-tier rules that enforce them. `grep -n "convention only\|Convention\."` on the contract is clean |
| 3 | Stray domain-node-pack line | `grep -rn "graph-ui-shape\|graph-enrich-define" PRD/ .claude/` returns nothing outside `PRD/work/` |
| 4 | Env sentinel and ledger `Profile:` demoted | Both survive, both marked informational. The hook is named the enforcer; the profile is belt-and-braces and is not deleted. An unverified profile is explicitly no longer a gap in enforcement |
| 5 | Seven stated limits recorded | New `### Stated limits` list, seven numbered entries, each in one place |
| 6 | `AGENT-SKILLS.md` updated | Node 7 reads the no-write reviewer (slice G); the `graph-run` row now names the always-on boundary hook |

### The `bypassPermissions` measurement

Recorded in the contract as an observation with its command, its verbatim
result, its date, and the binary version — followed by an explicit instruction
not to restate it as a property of the harness. One command, one moment, one
binary version.

### Requirement traceability

Every requirement maps to a shipped slice and to evidence recorded in that
slice's own doc.

| Requirement | Slice | Evidence |
| --- | --- | --- |
| REQ-152 — always-on enforcement, no launch flag | A, B | Hook committed in `.claude/settings.json`; live deny at top level and inside a dispatched subagent; `nohup` and background `&` denied under a lock, closing the requirement's last two lines |
| REQ-153 — graph tier gated on the run lock | B | Every graph-tier rule asserted twice, with and without a lock; live proof both directions with the permission layer removed so the hook is the only gate |
| REQ-154 — owner kill switch with a clean halt | C | Halt rehearsal produced all five artifacts; `Task`/`Agent` denied with the sentinel present; sentinel removal denied; `graph-preflight` refuses to start |
| REQ-155 — independent node-7 reviewer | G | Live dispatch held no `Write`/`Edit`/`NotebookEdit`, graded against the slice's own criteria, changed nothing, and found four defects — three real and fixed |
| REQ-156 — per-dispatch tool-call cap | D | Counter advances per call under `<run id>/<node>/<attempt>`; deny fires exactly at the cap; a loop-back starts fresh; a missing run-state degrades rather than blocks |
| REQ-157 — criteria start `false`, earned by evidence | F | Live round trip: flip denied, evidence earned, flip still denied for the manual criterion, observation line written, flip allowed. Log is append-only |
| REQ-158 — no-pre-authorization rule re-read per dispatch | H | One ordered pre-dispatch block; the rule's text appears exactly once; hook-observed evidence log shows the contract read 3.9s before the dispatch-prompt write |
| REQ-159 — hook liveness proven | E | Canary denied with the hook installed, allowed with it removed; heartbeat classified three ways; ledger carries both |
| NFR-016 — enforcement without blocking ordinary work | A, B, E | Ordinary session performed an edit, `git status`, and the script suite with no denial; hook latency 42–46 ms on the allow path; ordinary work asserted allowed under a live lock |
| FLOW-020 — the owner stops a run | C | The five halt observations, plus the preflight refusal that stops the next invocation restarting it |
| DEC-166 | all | This package |

### Gates

- `npm run quality:check` — exit 0.
- `npm run test:scripts` — 295 pass, 0 fail.
- `npm run skills:ai-sync` run; mirror clean on a re-run.

### What this slice deliberately did not do

It wrote no new mechanism. Every claim added to the contract describes something
one of slices A–H built and proved, and every gap is written as a limit rather
than smoothed over. The `graph-ledger-check.mjs` self-report and the `manual`
criterion are the two places where the system still takes its own word for
something, and both now say so in the contract.

## PRD promotion checklist

Executed by `thejudge-cleanup`, not here. Recorded so cleanup has one list:

- [ ] `PRD/sections/decisions/doc-process.md` — DEC-166 impact list reconciled
      with what shipped; anything that changed during implementation recorded.
- [ ] `PRD/sections/functional-requirements.md` — REQ-152..159 unchanged unless
      implementation forced a change, in which case the change is recorded.
- [ ] `PRD/sections/non-functional-requirements.md` — NFR-016.
- [ ] `PRD/sections/user-flows.md` — FLOW-020.
- [ ] `PRD/sections/system-map.md` — the graph-workflow entry flips to `shipped`
      only with product code wired in and the receipt written.
- [ ] Receipt at `PRD/instructions/receipts/graph-run-boundary-enforcement-<YYYY-MM-DD>.md`,
      including the `## Graph run` section if a ledger exists.
- [ ] `PRD/work/STATUS.md` row removed and `PRD/work/graph-run-boundary-enforcement/`
      deleted.
- [ ] `docs/whatIsGraph/graph-hardening-handoff.md` — the six findings marked
      closed, or the file retired if it carries nothing further.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/graph-run-boundary-enforcement/` ready to delete

## Verification

```bash
npm run quality:check
grep -rn "graph-ui-shape\|graph-enrich-define" PRD/ .claude/ || echo "clean"
npm run skills:ai-sync && git status --porcelain
```

## Files touched

- `PRD/instructions/graph-workflow-contract.md`
- `PRD/instructions/runtime-process-hygiene.md`
- `AGENT-SKILLS.md`
- `PRD/sections/decisions/doc-process.md`
