# Cleanup receipt — stories-folder-retire

- **Date:** 2026-06-05
- **Skill:** thejudge-cleanup (corpus hygiene)
- **Work slug:** stories-folder-retire
- **Status:** shipped

## Actions taken

- [x] Folded ship gates into `workflow-reference.md` slice template
- [x] Updated `thejudge-map-out` and `thejudge-cleanup` skills (Cursor, Codex, Claude)
- [x] Replaced story template with slice rules in `requirement-format.md`
- [x] Updated root and PRD navigation docs
- [x] Added `PRD/stories/` to prohibited patterns in `doc-lifecycle.md`
- [x] Deleted `PRD/stories/` folder and `story-generation.md`

## Files created

- `PRD/instructions/receipts/stories-folder-retire-2026-06-05.md`

## Files updated

- `README.md`
- `PRD/README.md`
- `PRD/instructions/doc-lifecycle.md`
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/workflow-reference.md`
- `.cursor/skills/thejudge-cleanup/SKILL.md`
- `.cursor/skills/thejudge-map-out/SKILL.md`
- `.codex/skills/thejudge-cleanup/SKILL.md`
- `.codex/skills/thejudge-map-out/SKILL.md`
- `.claude/skills/thejudge-cleanup/SKILL.md`
- `.claude/skills/thejudge-map-out/SKILL.md`

## Files deleted

- `PRD/stories/DEFINITION-OF-DONE.md`
- `PRD/stories/` (directory)
- `PRD/instructions/story-generation.md`

## Verification

- Grep for `PRD/stories`, `stories/DEFINITION`, and `story-generation.md`: only intentional references remain in `doc-lifecycle.md` (prohibited patterns) and historical receipt `skill-migration-2026-06-05.md`
- No application code or test changes required

## Notes

- Standalone Definition of Done file was not migrated; ship gates embedded in slice workflow and cleanup skill instead.
- Historical receipt `PRD/instructions/receipts/skill-migration-2026-06-05.md` left unchanged (durable audit).
