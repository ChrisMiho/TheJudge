# Slice H — No-pre-authorization rule re-read at every dispatch

## Status: done

## Goal

`graph-run` re-reads the no-pre-authorization rule from the contract immediately
before writing each node's dispatch prompt, so the rule cannot be lost to
compaction partway through a long run.

## Requirements

REQ-158.

1. The rule is read from `PRD/instructions/graph-workflow-contract.md` before
   every dispatch prompt is written — not once at run start.
2. The re-read happens at the same point `scripts/graph-ledger-check.mjs`
   already runs, which is before dispatch rather than after.
3. The rule is not added to `CLAUDE.md`. It must not apply to every ordinary
   session in the repository or add to that file's dilution.
4. The rule's text stays in one place — the contract — and is not duplicated
   into the skill file or a third location. `graph-run/SKILL.md` points at the
   contract section; it does not restate the rule.
5. The re-read joins the same pre-dispatch block as slice C's kill-switch check
   and slice D's run-state write, so there is one ordered pre-dispatch sequence
   rather than three scattered instructions.

## Acceptance criteria

- [x] `graph-run/SKILL.md` carries one ordered pre-dispatch block naming, in
      order: kill-switch check, no-pre-authorization re-read, ledger check,
      run-state write, dispatch.
- [x] The re-read names the exact contract section heading it reads, so a
      renamed section is a visible break rather than a silent no-op.
- [x] `grep -n "pre-authorization" CLAUDE.md` returns nothing — the rule did not
      leak into the file every ordinary session reads.
- [x] The rule's text appears exactly once across
      `PRD/instructions/graph-workflow-contract.md`, `.claude/skills/graph-run/`,
      and `AGENT-SKILLS.md`: the contract's copy. Verified by grep for a
      distinctive phrase from the rule.
- [x] **Live check.** Dispatch one node under a stub run and confirm the
      contract read appears before the dispatch prompt is written. Record the
      ordering evidence.
- [x] `npm run skills:ai-sync` run and the mirror clean in
      `git status --porcelain`.

## Verification

```bash
grep -n "pre-authorization" CLAUDE.md || echo "clean"
grep -rn "never converts a user instruction" PRD/ .claude/skills/ AGENT-SKILLS.md
npm run skills:ai-sync && git status --porcelain
```

## Verification record

### The ordered block

`graph-run/SKILL.md` now carries one `## Pre-dispatch sequence`:

```
1. **Kill switch.**
2. **Re-read the no-pre-authorization rule.**
3. **Ledger check.**
4. **Run-state write.**
5. **Dispatch.** Only now.
```

Three of these used to sit in three different places in the file. Scattered
instructions are how a step gets skipped on the seventh node of a nine-node run.

Step 2 names the heading it reads —
`### No pre-authorization of product decisions` — rather than a line number or a
vague pointer at "the boundaries section". A renamed section then fails loudly
instead of silently reading nothing.

### Text checks

- `grep -n "pre-authorization" CLAUDE.md` — clean. The rule governs autonomous
  runs, not every ordinary session in this repository, and that file is diluted
  enough.
- The rule's text appears **exactly once**. `grep -rn "never converts a user
  instruction" PRD/ .claude/skills/ AGENT-SKILLS.md` returns
  `PRD/instructions/graph-workflow-contract.md:371` and nothing else. (The slice
  doc's own verification command is the only other hit, and it is the grep, not
  the rule.)
- The heading is referenced by pointer in three places — `SKILL.md`,
  `reference.md`, and a fixture — which is the design: one copy of the text, many
  pointers to it.
- `npm run skills:ai-sync` run; mirror clean on a re-run.

### Live check — ordering, measured rather than reported

A stub package under a live lock and run state, with two criteria whose evidence
blocks the hook can observe: `H90` for a read of the contract, `H91` for a write
of the dispatch prompt. A driver session was then told to follow the sequence for
one dispatch of node `plan`.

The evidence log is append-only and the hook is its sole writer, so its order is
**hook-observed, not self-reported**:

```
{"runId":"graph-hproof","slice":"H","criterionId":"H90","via":"tool-call","observedAt":"2026-08-20T20:44:22.393Z"}
{"runId":"graph-hproof","slice":"H","criterionId":"H91","via":"tool-call","observedAt":"2026-08-20T20:44:26.263Z"}
```

The contract read was observed at `:22.393`, the dispatch-prompt write at
`:26.263` — the read came first, by 3.9 seconds. The node's counter stood at 7
tool calls for `graph-hproof/plan/1`, so slices D and E's machinery was live
throughout.

The session's own account matched: stop check, contract read, prompt write, in
that order, and it reported the rule's operative points back rather than a bare
"I read it".

Using the hook as the instrument is the point. The alternative — the driver
saying it read the rule first — is exactly the self-report this package exists
to stop accepting.

### Stated limits carried forward

- The re-read is an instruction, not a mechanism. Nothing forces a driver to
  actually read the section before writing the prompt; the hook can observe that
  a read happened, not that its contents influenced anything.
- Observing a read of the contract file is not observing a read of that
  *section*. A driver that opened the file for any reason satisfies the same
  evidence block.
- The heading is named in three files. Renaming it in the contract breaks all
  three at once, which is loud — but nothing automatically checks that the
  heading still exists.

## Files touched

- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
- `PRD/instructions/graph-workflow-contract.md`
