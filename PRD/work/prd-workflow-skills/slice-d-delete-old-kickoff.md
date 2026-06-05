# Slice D — Delete old kickoff

## Status: planned

## Goal

Remove legacy `kickoff` skill folders from all platform paths. No deprecation stub.

## Depends on

Slice C (new `thejudge-kickoff` deployed).

## Requirements

1. Search and delete if present:

```
.claude/skills/kickoff/
.codex/skills/kickoff/
.cursor/skills/kickoff/
```

2. Grep repo for references to old path `skills/kickoff` (not `thejudge-kickoff`):
   - Update `PRD/README.md`, root `README.md`, any docs pointing to old skill
   - Do not update historical receipts

3. Confirm `thejudge-kickoff` exists in all three platforms before deleting.

## Acceptance criteria

- [ ] No `kickoff/` directory under `.claude/skills/`, `.codex/skills/`, or `.cursor/skills/`
- [ ] `thejudge-kickoff/` exists in all three
- [ ] No doc references to attach `kickoff` skill (should say `thejudge-kickoff`)

## Verification

```bash
test ! -d .claude/skills/kickoff
test ! -d .codex/skills/kickoff
test ! -d .cursor/skills/kickoff
rg 'skills/kickoff' --glob '!PRD/work/prd-workflow-skills/**' || true
# fix any hits outside this rollout package
```

## Files deleted

- `.claude/skills/kickoff/SKILL.md`
- `.claude/skills/kickoff/reference.md`
- `.claude/skills/kickoff/agents/openai.yaml`
- (same pattern for `.codex/`, `.cursor/` if present)
