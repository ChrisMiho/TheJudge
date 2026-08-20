# Slice F — Slice criteria start false and need observed evidence

## Status: planned

## Goal

Every acceptance criterion starts `false` and cannot be flipped to `true` unless
the hook has observed a matching evidence read — so node 6's `ok` is ground
truth rather than a self-report.

## Requirements

REQ-157.

1. `thejudge-map-out` emits one machine-readable criteria file per slice, beside
   the slice doc: one entry per acceptance criterion, each with a stable
   criterion id, a value initialised `false`, and an `evidence` block.
2. The `evidence` block is what maps a tool call to a criterion. It names a
   command pattern, one or more file paths that must be read, or both.
   `thejudge-map-out` authors it beside the criterion in the slice doc, so it is
   written once with the criterion rather than maintained as a second list.
3. The hook matches every observed tool call against every criterion's
   `evidence` block and appends the ids of matching criteria to an append-only
   observed-evidence log under `.worktrees/`, keyed by run id and slice. The
   hook is that log's only writer; slice B's graph tier already denies agent
   writes to it.
4. A write flipping a criterion to `true` is denied unless that criterion's id
   appears in the log, and the denial names the criterion id and the evidence
   still missing.
5. A criterion with no machine-checkable evidence is marked `manual`, and its
   evidence event is defined rather than left open: the agent writes a dated
   observation line naming the criterion id into the slice's evidence log, and
   the hook records the observed write as that criterion's evidence event.
6. Node 6 (`build`) reports `ok` only when every criterion in every slice's file
   is `true`. Any remaining `false` fails the node.
7. The slice doc format defined by `PRD/instructions/requirement-format.md` is
   unchanged — the criteria file is emitted from it, not a replacement for it.
8. The `manual` limit is stated in the contract by slice I: the evidence proves
   the check occurred, not that it passed.

## Acceptance criteria

- [ ] The criteria file's schema is documented in `thejudge-map-out`'s
      `reference.md` with a worked example, and this package's own slices carry
      one as the first instance.
- [ ] Unit tests: a tool call matching a criterion's command pattern appends
      that id to the log; a non-matching call appends nothing; a file-path
      evidence block matches a read of that path.
- [ ] Unit test: a write flipping a criterion to `true` with no logged evidence
      is denied, and the reason names the criterion id and the missing evidence.
- [ ] Unit test: the same write is allowed once the id is present in the log.
- [ ] Unit test: the log is append-only — an existing entry is never rewritten
      or removed by the hook.
- [ ] Unit test: a `manual` criterion flips only after the dated observation
      line naming its id is written.
- [ ] `thejudge-implement-all` states the node-6 gate: any `false` criterion
      fails the node, and the check is over the emitted files, not a summary.
- [ ] **Live round trip.** Emit a criteria file for a throwaway two-criterion
      slice, attempt a flip with no evidence (denied — record the reason), run
      the evidence command, attempt the flip again (allowed — record it).
- [ ] `npm run test:scripts` green; `npm run skills:ai-sync` run and the mirror
      clean in `git status --porcelain`.

## Verification

```bash
npm run test:scripts
npm run skills:ai-sync && git status --porcelain
```

## Files touched

- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `.claude/skills/thejudge-map-out/SKILL.md`
- `.claude/skills/thejudge-map-out/reference.md`
- `.claude/skills/thejudge-implement-all/SKILL.md`
- `PRD/instructions/graph-workflow-contract.md`
