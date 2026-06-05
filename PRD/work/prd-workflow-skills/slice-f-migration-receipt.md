# Slice F — Migration receipt + closeout

## Status: planned

## Goal

Document every action from slices A–E in a durable receipt, verify rollout, delete this work folder.

## Depends on

Slices A, B, C, D, E complete.

## Requirements

1. Run full verification (GAMEPLAN.md checklist).

2. Write `PRD/instructions/receipts/skill-migration-<YYYY-MM-DD>.md` using template below. List **every** file created, updated, deleted with paths.

3. Update slice statuses in this README to `complete`.

4. Delete entire folder `PRD/work/prd-workflow-skills/` including staged `skills/` subfolder.

5. Do **not** delete `PRD/instructions/receipts/skill-migration-*.md`.

## Receipt template

```markdown
# Cleanup receipt — skill-migration

- **Date:** YYYY-MM-DD
- **Skill:** thejudge-cleanup (manual rollout)
- **Work slug:** prd-workflow-skills
- **Status:** shipped

## Actions taken

- [ ] Slice A: workflow-reference + receipts/
- [ ] Slice B: staged skills authored
- [ ] Slice C: 15 platform folders deployed
- [ ] Slice D: old kickoff deleted
- [ ] Slice E: sections terminology pass
- [ ] Slice F: this receipt + work folder deleted

## Files created

(list every path)

## Files updated

(list every path)

## Files deleted

(list every path — include PRD/work/prd-workflow-skills/ tree and old kickoff files)

## Verification

- Platform skill counts: cursor=5, codex=5, claude=5
- Old kickoff absent: yes/no
- Terminology grep: pass/fail notes

## Notes
```

## Acceptance criteria

- [ ] Receipt file exists at `PRD/instructions/receipts/skill-migration-<date>.md`
- [ ] Receipt lists all creates/updates/deletes
- [ ] `PRD/work/prd-workflow-skills/` no longer exists
- [ ] Skills still present in `.cursor`, `.codex`, `.claude` after work folder delete

## Verification

```bash
test -f PRD/instructions/receipts/skill-migration-*.md
test ! -d PRD/work/prd-workflow-skills
ls .cursor/skills/thejudge-kickoff/SKILL.md
ls .codex/skills/thejudge-kickoff/SKILL.md
ls .claude/skills/thejudge-kickoff/SKILL.md
```

## Files touched

- `PRD/instructions/receipts/skill-migration-<date>.md` (create)
- `PRD/work/prd-workflow-skills/` (delete entire tree)
