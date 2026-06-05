# Cleanup receipt — skill-migration

- **Date:** 2026-06-05
- **Skill:** thejudge-cleanup (manual rollout)
- **Work slug:** prd-workflow-skills
- **Status:** shipped

## Actions taken

- [x] Slice A: workflow-reference + receipts/
- [x] Slice B: staged skills authored and checked
- [x] Slice C: 15 platform folders deployed
- [x] Slice D: old kickoff deleted
- [x] Slice E: sections terminology pass
- [x] Slice F: this receipt + work folder deleted

## Files created

- `.cursor/skills/thejudge-cleanup/SKILL.md`
- `.cursor/skills/thejudge-kickoff/SKILL.md`
- `.cursor/skills/thejudge-kickoff/reference.md`
- `.cursor/skills/thejudge-map-out/SKILL.md`
- `.cursor/skills/thejudge-quality-check/SKILL.md`
- `.cursor/skills/thejudge-refinement/SKILL.md`
- `.codex/skills/thejudge-cleanup/SKILL.md`
- `.codex/skills/thejudge-kickoff/SKILL.md`
- `.codex/skills/thejudge-kickoff/reference.md`
- `.codex/skills/thejudge-map-out/SKILL.md`
- `.codex/skills/thejudge-quality-check/SKILL.md`
- `.codex/skills/thejudge-refinement/SKILL.md`
- `.claude/skills/thejudge-cleanup/SKILL.md`
- `.claude/skills/thejudge-kickoff/SKILL.md`
- `.claude/skills/thejudge-kickoff/reference.md`
- `.claude/skills/thejudge-map-out/SKILL.md`
- `.claude/skills/thejudge-quality-check/SKILL.md`
- `.claude/skills/thejudge-refinement/SKILL.md`
- `PRD/instructions/workflow-reference.md`
- `PRD/instructions/receipts/skill-migration-2026-06-05.md`

## Files updated

- `README.md`
- `PRD/README.md`
- `PRD/instructions/story-generation.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/sections/decisions.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/open-questions.md`
- `PRD/sections/overview.md`
- `PRD/sections/problem-statement.md`
- `PRD/sections/user-flows.md`
- `PRD/stories/DEFINITION-OF-DONE.md`
- `PRD/work/card-wotc-rule-enrichment/README.md`
- `PRD/work/empty-stack-fallback-fix/README.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-kickoff/reference.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-map-out/SKILL.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-quality-check/SKILL.md`
- `apps/backend/src/providers/README.md`
- `secrets-templates/aws-bedrock-dev.env.example`

## Files deleted

- `.claude/skills/kickoff/SKILL.md`
- `.claude/skills/kickoff/agents/openai.yaml`
- `.claude/skills/kickoff/reference.md`
- `.codex/skills/kickoff`
- `.cursor/skills/kickoff/` (absent at delete time)
- `PRD/work/prd-workflow-skills/GAMEPLAN.md`
- `PRD/work/prd-workflow-skills/README.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-cleanup/SKILL.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-kickoff/SKILL.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-kickoff/reference.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-map-out/SKILL.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-quality-check/SKILL.md`
- `PRD/work/prd-workflow-skills/skills/thejudge-refinement/SKILL.md`
- `PRD/work/prd-workflow-skills/slice-a-reference.md`
- `PRD/work/prd-workflow-skills/slice-b-author-skills.md`
- `PRD/work/prd-workflow-skills/slice-c-tri-platform-deploy.md`
- `PRD/work/prd-workflow-skills/slice-d-delete-old-kickoff.md`
- `PRD/work/prd-workflow-skills/slice-e-sections-terminology.md`
- `PRD/work/prd-workflow-skills/slice-f-migration-receipt.md`

## Verification

- Platform skill counts: cursor=5, codex=5, claude=5
- Platform copies: byte-identical to staging before work-folder deletion
- Old kickoff absent: yes
- `PRD/instructions/workflow-reference.md`: exists, 98 lines
- Terminology grep: pass; remaining retired terms in `PRD/sections/` are historical `Context:` lines on superseded decisions
- Work folder deletion: verified after receipt write

## Notes

- Pre-existing deletions under `PRD/work/repo-hygiene-cleanup/` were present before this rollout and were left untouched.
- Writing `.codex/skills/*` and removing the legacy `.codex/skills/kickoff` path required elevated filesystem approval.
