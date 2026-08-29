# Slice C evidence

2026-08-28 C6 — read the rewritten flow end to end across all four files and
confirmed it is coherent and self-consistent:

- `graph-workflow-contract.md` `## The two runs`: run one drives
  `preflight → shape → define → gate-qc`, writes `GATE-QUESTIONS.md` at `define`
  on a non-empty diff, stops at gate-qc PASS, opens `thejudge-auto/<slug> → main`
  with `gh pr create` (create, not merge), parks `owner-action`. Run two applies
  the answered file via `graph-gate-review`, re-enters `gate-qc`, continues.
- `graph-run/SKILL.md` `## The two runs` agrees and adds the publish/PR/park
  steps and the run-two branches (answered → apply; blank → re-park; no file →
  resolve empty gate).
- `graph-gate-review/SKILL.md` is a reader: parses the answered file, refuses any
  blank/malformed `Verdict:` slot, applies accept/edit/reject inside the recorded
  diff, restores `refined`.
- `graph-run/reference.md` mirror rows (node 3 success, owner-action entry, the
  publish-before-build note) match the new flow.

Byte-unchanged assertions (C5) pass: node table rows and the boundary deny list
in the contract are untouched. `npm run quality:check` exits 0.

Owner sign-off on coherence is the checkpoint review requested before C.
