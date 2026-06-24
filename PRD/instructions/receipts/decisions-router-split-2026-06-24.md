# decisions-router-split cleanup receipt

- Date: 2026-06-24
- Slug: decisions-router-split
- Status: shipped

## Actions taken

- [x] Verified Slice A router/domain split: router contains zero DEC bodies; domain files hold DEC-001 through DEC-063 exactly once.
- [x] Verified Slice B skill wording and ran `npm run skills:ai-sync`.
- [x] Verified Slice C durable wording and `doc-lifecycle.md` lifecycle rule.
- [x] Verified Slice D ship gates: DEC body/index parity, cross-reference resolvability, DEC-063 placement, receipts untouched before this receipt, apps code untouched, and no system-map changes.
- [x] Applied system-map promotion gate: no `PRD/sections/system-map.md` entry applies because this was a documentation/process refactor, not a shipped product/code subsystem.
- [x] Wrote this durable receipt before deleting the ephemeral work folder.
- [x] Deleted `PRD/work/decisions-router-split/`.

## Files created

- `PRD/instructions/receipts/decisions-router-split-2026-06-24.md`
- `PRD/sections/decisions/capture-and-stack.md`
- `PRD/sections/decisions/conversation-ux.md`
- `PRD/sections/decisions/doc-process.md`
- `PRD/sections/decisions/framing.md`
- `PRD/sections/decisions/game-context-model.md`
- `PRD/sections/decisions/prompt-assembly.md`
- `PRD/sections/decisions/providers-and-contract.md`
- `PRD/sections/decisions/rules-retrieval.md`
- `PRD/sections/decisions/scanning.md`

## Files updated

- `.agents/skills/thejudge-cleanup/SKILL.md`
- `.agents/skills/thejudge-kickoff/reference.md`
- `.agents/skills/thejudge-quality-check/SKILL.md`
- `.agents/skills/thejudge-refinement/SKILL.md`
- `.claude/skills/thejudge-cleanup/SKILL.md`
- `.claude/skills/thejudge-kickoff/reference.md`
- `.claude/skills/thejudge-quality-check/SKILL.md`
- `.claude/skills/thejudge-refinement/SKILL.md`
- `.cursor/skills/thejudge-cleanup/SKILL.md`
- `.cursor/skills/thejudge-kickoff/reference.md`
- `.cursor/skills/thejudge-quality-check/SKILL.md`
- `.cursor/skills/thejudge-refinement/SKILL.md`
- `PRD/README.md`
- `PRD/instructions/agent-working-rules.md`
- `PRD/instructions/doc-lifecycle.md`
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/instructions/writing-rules.md`
- `PRD/sections/decisions.md`
- `README.md`
- `apps/backend/src/eval/fixtures/README.md`
- `apps/backend/src/providers/README.md`

## Files deleted

- `PRD/work/decisions-router-split/DESIGN-BRIEF.md`
- `PRD/work/decisions-router-split/DESIGN.md`
- `PRD/work/decisions-router-split/GAMEPLAN.md`
- `PRD/work/decisions-router-split/README.md`
- `PRD/work/decisions-router-split/slice-a-router-and-domain-files.md`
- `PRD/work/decisions-router-split/slice-b-skill-references.md`
- `PRD/work/decisions-router-split/slice-c-durable-references-and-lifecycle.md`
- `PRD/work/decisions-router-split/slice-d-verification-and-ship.md`

## Verification results

- `test "$(grep -cE '^###? +DEC-[0-9]' PRD/sections/decisions.md)" -eq 0`: passed; router clean.
- `grep -rhoE '^###? +DEC-[0-9]{3}' PRD/sections/decisions/*.md | ... | uniq -c`: passed; each DEC-001 through DEC-063 appears once as a body.
- Body set vs `DEC-001` through `DEC-063`: passed.
- Router index unique DEC count: passed; index covers 63 IDs.
- Domain body set vs router index set: passed.
- Supersedes/superseded/amends cross-reference target check: passed; no dangling IDs printed.
- `grep -qE '^###? +DEC-063' PRD/sections/decisions/doc-process.md && grep -q 'DEC-063' PRD/sections/decisions.md`: passed.
- `git diff --name-only -- PRD/instructions/receipts/`: passed before this receipt; no existing receipts changed.
- `git diff --name-only -- apps/ | grep -vE 'README\.md$'`: passed; no apps code changes.
- `git diff --name-only -- PRD/sections/system-map.md PRD/sections/system-map/`: passed; no system-map changes.
- `grep -rl "decisions/<domain>.md" ...`: passed for all four canonical `.cursor/skills/thejudge-*` files.
- `grep -q "router index line" PRD/instructions/doc-lifecycle.md && grep -qi "tombstone" ...`: passed.
- `npm run skills:ai-sync`: passed.
- `npm run quality:check`: passed; typecheck, lint, format check, tests, and coverage check completed successfully.
