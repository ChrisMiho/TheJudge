# Slice H — No-pre-authorization rule re-read at every dispatch

## Status: planned

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

- [ ] `graph-run/SKILL.md` carries one ordered pre-dispatch block naming, in
      order: kill-switch check, no-pre-authorization re-read, ledger check,
      run-state write, dispatch.
- [ ] The re-read names the exact contract section heading it reads, so a
      renamed section is a visible break rather than a silent no-op.
- [ ] `grep -n "pre-authorization" CLAUDE.md` returns nothing — the rule did not
      leak into the file every ordinary session reads.
- [ ] The rule's text appears exactly once across
      `PRD/instructions/graph-workflow-contract.md`, `.claude/skills/graph-run/`,
      and `AGENT-SKILLS.md`: the contract's copy. Verified by grep for a
      distinctive phrase from the rule.
- [ ] **Live check.** Dispatch one node under a stub run and confirm the
      contract read appears before the dispatch prompt is written. Record the
      ordering evidence.
- [ ] `npm run skills:ai-sync` run and the mirror clean in
      `git status --porcelain`.

## Verification

```bash
grep -n "pre-authorization" CLAUDE.md || echo "clean"
grep -rn "never converts a user instruction" PRD/ .claude/skills/ AGENT-SKILLS.md
npm run skills:ai-sync && git status --porcelain
```

## Files touched

- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
- `PRD/instructions/graph-workflow-contract.md`
