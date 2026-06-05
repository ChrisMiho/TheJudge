# Slice C — Tri-platform deploy

## Status: planned

## Goal

Copy staged skills from `PRD/work/prd-workflow-skills/skills/` to all three platform paths.

## Depends on

Slice B (staged skills complete).

## Requirements

1. For each skill in `skills/`:

```bash
# Repeat for thejudge-kickoff, refinement, quality-check, map-out, cleanup
SKILL=thejudge-kickoff
mkdir -p .cursor/skills/$SKILL .codex/skills/$SKILL .claude/skills/$SKILL
cp PRD/work/prd-workflow-skills/skills/$SKILL/SKILL.md .cursor/skills/$SKILL/
cp PRD/work/prd-workflow-skills/skills/$SKILL/SKILL.md .codex/skills/$SKILL/
cp PRD/work/prd-workflow-skills/skills/$SKILL/SKILL.md .claude/skills/$SKILL/
# kickoff only:
cp PRD/work/prd-workflow-skills/skills/thejudge-kickoff/reference.md .cursor/skills/thejudge-kickoff/
cp PRD/work/prd-workflow-skills/skills/thejudge-kickoff/reference.md .codex/skills/thejudge-kickoff/
cp PRD/work/prd-workflow-skills/skills/thejudge-kickoff/reference.md .claude/skills/thejudge-kickoff/
```

2. Verify byte-identical copies across platforms (or `diff` each triple).

3. Do **not** deploy old `agents/openai.yaml` unless Claude Code fails to discover skills without it.

## Acceptance criteria

- [ ] 5 skill folders under `.cursor/skills/`
- [ ] 5 skill folders under `.codex/skills/`
- [ ] 5 skill folders under `.claude/skills/`
- [ ] `thejudge-kickoff/reference.md` in all three kickoff folders
- [ ] Each platform's `SKILL.md` matches staging copy

## Verification

```bash
for d in .cursor .codex .claude; do ls $d/skills/thejudge-*/SKILL.md | wc -l; done
# each should print 5
```

## Files touched

- `.cursor/skills/thejudge-*/` (create)
- `.codex/skills/thejudge-*/` (create)
- `.claude/skills/thejudge-*/` (create)
