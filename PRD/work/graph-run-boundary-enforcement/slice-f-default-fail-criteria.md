# Slice F — Slice criteria start false and need observed evidence

## Status: done

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

- [x] The criteria file's schema is documented in `thejudge-map-out`'s
      `reference.md` with a worked example, and this package's own slices carry
      one as the first instance.
- [x] Unit tests: a tool call matching a criterion's command pattern appends
      that id to the log; a non-matching call appends nothing; a file-path
      evidence block matches a read of that path.
- [x] Unit test: a write flipping a criterion to `true` with no logged evidence
      is denied, and the reason names the criterion id and the missing evidence.
- [x] Unit test: the same write is allowed once the id is present in the log.
- [x] Unit test: the log is append-only — an existing entry is never rewritten
      or removed by the hook.
- [x] Unit test: a `manual` criterion flips only after the dated observation
      line naming its id is written.
- [x] `thejudge-implement-all` states the node-6 gate: any `false` criterion
      fails the node, and the check is over the emitted files, not a summary.
- [x] **Live round trip.** Emit a criteria file for a throwaway two-criterion
      slice, attempt a flip with no evidence (denied — record the reason), run
      the evidence command, attempt the flip again (allowed — record it).
- [x] `npm run test:scripts` green; `npm run skills:ai-sync` run and the mirror
      clean in `git status --porcelain`.

## Verification

```bash
npm run test:scripts
npm run skills:ai-sync && git status --porcelain
```

## Verification record

### Unit proof

- `node --test scripts/graph-boundary-hook.test.mjs` — 106 pass, 0 fail.
- `npm run test:scripts` — 288 pass, 0 fail.
- `npm run skills:ai-sync` re-run leaves no further change.

### The criteria file

`slice-<letter>.criteria.json`, beside each slice doc, emitted from the doc's
`## Acceptance criteria` list. The schema, field table, and worked example are in
`.claude/skills/thejudge-map-out/reference.md`. This package carries the first
nine instances — 64 criteria across slices A–I, all of which parse through the
hook's own `parseCriteriaFile()`.

An `evidence` block may name a `command` pattern, `paths`, or `"manual": true`.
`command` and `paths` may both appear and **either** matching is enough:
requiring both would make most blocks unsatisfiable. `manual` wins over anything
beside it, so a manual criterion is never earned by an ordinary command.

### Live round trip

Throwaway two-criterion slice under a live lock and run state.

**1. Flip both with no evidence:**

```
[graph-boundary] Setting acceptance criteria to `true` is denied without observed evidence: `Z1` (still needs: a command matching `npm run test:scripts`), `Z2` (still needs: a dated observation line naming `Z2`). A criterion starts `false` and is earned by the hook seeing the evidence, not by writing the value.
   exit=2
```

**2. Run Z1's evidence command:**

```
{"runId":"graph-critproof","slice":"Z","criterionId":"Z1","via":"tool-call","observedAt":"2026-08-20T20:32:19.266Z"}
```

**3. Flip again — Z1 earned, Z2 not:**

```
[graph-boundary] Setting an acceptance criterion to `true` is denied without observed evidence: `Z2` (still needs: a dated observation line naming `Z2`).
   exit=2
```

**4. Write Z2's dated observation line:**

```
{"runId":"graph-critproof","slice":"Z","criterionId":"Z2","via":"manual-observation","observedAt":"2026-08-20T20:32:30.882Z"}
```

**5. Flip again — both earned:** `exit=0`.

**6. Append-only:** re-running an already-earned evidence command left the log at
two lines.

### Why A–E's criteria files show `true` without log entries

Slices A–E were verified before this mechanism existed, so their values were
written directly rather than earned through the log. That is stated rather than
hidden: the enforcement is proven by the round trip above, not by this package's
own files, and it binds from the next package `thejudge-map-out` maps.

Slice F's own `F8` was earned the intended way — see `slice-f.evidence.md`.

### Stated limits carried forward

- **The `manual` limit.** A dated observation line proves the check *happened*.
  It does not prove it passed. No mechanism here closes that gap, and calling a
  `manual` criterion "verified" overclaims what the evidence supports.
- Evidence matching is pattern matching. A criterion whose `command` pattern is
  loose is earned by any call that happens to match it, and one whose pattern is
  wrong is never earned at all. `thejudge-map-out` authors those patterns.
- The flip check reads the text a call would write. A criteria file rewritten by
  a process the hook never saw — an editor, a `git checkout`, a script the hook
  allowed — is not caught.
- A criterion id is stable only by convention. Renumbering criteria in a slice
  doc silently orphans the ids already in the evidence log.

## Files touched

- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `.claude/skills/thejudge-map-out/SKILL.md`
- `.claude/skills/thejudge-map-out/reference.md`
- `.claude/skills/thejudge-implement-all/SKILL.md`
- `PRD/instructions/graph-workflow-contract.md`
