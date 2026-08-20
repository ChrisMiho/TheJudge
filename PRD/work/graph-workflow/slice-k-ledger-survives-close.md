# Slice K — The run ledger survives `close`

## Status: done

Scope item 10. Depends on: **J** (same `thejudge-cleanup` skill files).

## Goal

The proof that a run refused a pre-authorization outlives the run's success.

## Requirements

1. `thejudge-cleanup` deletes `PRD/work/<slug>/`, which holds `GRAPH-RUN.md` —
   the node ledger, the evidence column, and slice G's `## Instruction ledger`.
   Receipts are durable (`thejudge-cleanup/SKILL.md:64`) but carry no graph run
   record, so today that proof survives exactly until the run succeeds.
2. `thejudge-cleanup` gains one required receipt section, written **before the
   delete**, populated only when `GRAPH-RUN.md` exists:

   ```markdown
   ## Graph run

   - Run ID: `<id>` | Profile: `<value>` | Terminal state: `<state>`
   - <the complete `## Node ledger` table, verbatim>
   - <the complete `## Instruction ledger` table, verbatim>
   ```
3. **Verbatim, not summarized.** A summary of a refusal ledger is the driver
   grading its own compliance.
4. Cleanup **refuses to delete the package folder** when `GRAPH-RUN.md` exists
   and this section is absent from the receipt.
5. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [x] A `thejudge-cleanup` run against a scratch package holding a `GRAPH-RUN.md`
      **refuses** to delete the folder until the receipt carries `## Graph run`
      with both tables verbatim — observed and recorded, not asserted
- [x] With the section present, the same run completes and the receipt contains
      both tables **byte-identical** to the source `GRAPH-RUN.md` tables (compare
      with `diff`, not by eye)
- [x] A package with **no** `GRAPH-RUN.md` cleans up normally, with no empty
      `## Graph run` section added
- [x] The section is written **before** the delete — verified by the refusal path
      above, which cannot pass if the order is reversed
- [x] The receipt convention in `thejudge-cleanup/SKILL.md` documents the section
      and the refusal condition
- [x] `diff -rq .claude/skills .agents/skills` produces no output
- [x] `npm run quality:check` green

## Verification

```bash
git grep -n 'Graph run' .claude/skills/thejudge-cleanup/
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

Scratch-package dry runs: record the refusal text, the completed receipt path,
and the `diff` result proving the tables are verbatim. Remove the scratch package
afterward.

## Files touched

- `.claude/skills/thejudge-cleanup/SKILL.md` (+ reference, + mirror)
- `PRD/instructions/graph-workflow-contract.md` — if the receipt convention is
  referenced there

## Result

`thejudge-cleanup` gains `### Graph run in the receipt`, a `## Gates` bullet
naming the refusal condition, and the `## Writes` receipt line now listing
`## Graph run`. `graph-workflow-contract.md` gains a matching
`## The ledger outlives the run` section. Slice J's forward reference to this
section now resolves.

### Measured — three `thejudge-cleanup` runs against a scratch package

Run in an isolated scratch repository holding a copy of `.claude/skills/`, the
two instruction files, and a `PRD/work/demo/` package with a two-row node ledger
and a two-row instruction ledger — one row recording a *refused*
pre-authorization. The implementation worktree was never the subject.

**1. Refusal path.** With `PRD/instructions/receipts/` empty, the run refused
and quoted the deciding rule itself:

> - **Graph-run gate:** when `PRD/work/<slug>/GRAPH-RUN.md` exists, refuse the
>   delete until the receipt carries `## Graph run` with both ledger tables
>   verbatim.

It named the consequence unprompted: "Deleting now would destroy the only record
that the run refused a pre-authorization — precisely what the gate exists to
prevent." No file was created, modified, or deleted. This also proves the
ordering: the refusal cannot pass if the receipt is written after the delete.

**2. Completion path, tables verbatim.** With the section written, the run
completed — receipt, `STATUS.md` row removed, folder deleted via
`git rm -r PRD/work/demo/`. Both tables were extracted from inside the receipt's
`## Graph run` section and `diff`ed against the source `GRAPH-RUN.md` tables:
**no output**, 8 table rows, byte-identical. Compared with `diff`, not by eye.

**3. No `GRAPH-RUN.md`.** The package cleaned up normally and the receipt
carries no `## Graph run` section — the only mention is a line stating it was
intentionally omitted, which is better than silence.

### A defect the measurement caught

The first completion run copied `## Node ledger` and `## Instruction ledger`
through at their **source heading level**, `##`. The tables were verbatim, but
the sibling headings ended the `## Graph run` section at the first one — a
reader or parser looking inside `## Graph run` would find only the summary line.

The template now specifies `### Node ledger` and `### Instruction ledger`, with
the reason stated: the tables are verbatim, their headings are not part of them.
Re-run against the corrected template, the section contains both tables and the
`diff` is clean.

Reading the template alone would not have surfaced this. The scratch package and
scratch repository are removed.

`diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
