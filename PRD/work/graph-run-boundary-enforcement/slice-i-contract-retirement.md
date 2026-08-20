# Slice I — Contract retirement, stated limits, and promotion

## Status: planned

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

- [ ] `grep -n "graph-ui-shape\|graph-enrich-define" PRD/ .claude/ -r` returns
      nothing outside `PRD/work/`.
- [ ] `grep -n "convention only\|Convention\." PRD/instructions/graph-workflow-contract.md`
      returns no hit describing `nohup`, the trailing `&`, or raw Bash writes.
- [ ] The reach table's raw-Bash row names the hook and its reach; no row in
      that table reads `none`.
- [ ] The contract states the `bypassPermissions` measurement as observed, with
      the command, the result, and the binary version from slice A — never as an
      assertion that a deny survives it.
- [ ] Each of the seven stated limits appears in the contract, each in one place.
- [ ] Every REQ-152..159 acceptance criterion is traceable to a shipped slice.
      This slice records the mapping — requirement id → slice letter → evidence.
- [ ] `npm run quality:check` green.
- [ ] `npm run skills:ai-sync` run and the mirror clean in
      `git status --porcelain`.

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

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/graph-run-boundary-enforcement/` ready to delete

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
