# Cleanup receipt — skill-handoff-chain

- **Date:** 2026-06-06
- **Skill:** thejudge-cleanup (corpus hygiene)
- **Work slug:** skill-handoff-chain
- **Status:** shipped

## Actions taken

- [x] Added `scripts/sync-agent-skills.sh` and `npm run skills:ai-sync`
- [x] Made `.cursor/skills/` canonical; synced to `.agents/skills/` and `.claude/skills/`
- [x] Removed legacy `.codex/skills/` tree
- [x] Unified triple-block Handoff sections in all six skills
- [x] Extended `PRD/instructions/workflow-reference.md` with Handoff blocks and platform openers
- [x] Created `AGENT-SKILLS.md`; linked from root `README.md`
- [x] Updated `thejudge-kickoff/reference.md` and `PRD/README.md`
- [x] Verified sync: `diff -rq .cursor/skills .agents/skills` and `.claude/skills` identical

## Files created

- `scripts/sync-agent-skills.sh`
- `AGENT-SKILLS.md`
- `.agents/skills/` (synced from `.cursor/skills/`)
- `PRD/instructions/receipts/skill-handoff-chain-2026-06-06.md`

## Files updated

- `package.json` — `skills:ai-sync` script
- `README.md`
- `PRD/README.md`
- `PRD/instructions/workflow-reference.md`
- `.cursor/skills/thejudge-kickoff/SKILL.md`
- `.cursor/skills/thejudge-refinement/SKILL.md`
- `.cursor/skills/thejudge-quality-check/SKILL.md`
- `.cursor/skills/thejudge-map-out/SKILL.md`
- `.cursor/skills/thejudge-implement/SKILL.md`
- `.cursor/skills/thejudge-cleanup/SKILL.md`
- `.cursor/skills/thejudge-kickoff/reference.md`
- `.claude/skills/` (refreshed via sync)

## Files deleted

- `.codex/skills/thejudge-cleanup/SKILL.md`
- `.codex/skills/thejudge-implement/SKILL.md`
- `.codex/skills/thejudge-kickoff/SKILL.md`
- `.codex/skills/thejudge-kickoff/reference.md`
- `.codex/skills/thejudge-map-out/SKILL.md`
- `.codex/skills/thejudge-quality-check/SKILL.md`
- `.codex/skills/thejudge-refinement/SKILL.md`

## Verification

```bash
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills   # no output
diff -rq .cursor/skills .claude/skills   # no output
test ! -d .codex/skills                  # OK
grep -l "## Handoff" .cursor/skills/thejudge-*/SKILL.md | wc -l  # 6
```

## Notes

- Edit skills only under `.cursor/skills/`, then run `npm run skills:ai-sync` before commit.
- Codex discovers skills from `.agents/skills/` per current OpenAI docs.
