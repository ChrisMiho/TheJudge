# Slice B — Author skill drafts

## Status: planned

## Goal

Verify and finalize all five `SKILL.md` files (+ kickoff `reference.md`) under `PRD/work/prd-workflow-skills/skills/`.

**Note:** Drafts are pre-authored in `skills/` during package materialization. Review for accuracy, adjust if needed, then mark complete.

## Depends on

Slice A (workflow-reference exists for quality-check skill to reference).

## Requirements

1. Create staged skills:

```
PRD/work/prd-workflow-skills/skills/
  thejudge-kickoff/SKILL.md
  thejudge-kickoff/reference.md
  thejudge-refinement/SKILL.md
  thejudge-quality-check/SKILL.md
  thejudge-map-out/SKILL.md
  thejudge-cleanup/SKILL.md
```

2. **thejudge-kickoff** — merge from `.claude/skills/kickoff/SKILL.md`:
   - Keep 2-file read discipline
   - Add IDEA.md capture when user describes a new idea
   - Rename `kickoff` → `thejudge-kickoff`
   - `disable-model-invocation: true`
   - Modernize example response (core product, not MVP1)
   - `reference.md`: update PRD quick map; no MVP/Phase terminology

3. **thejudge-refinement** — per GAMEPLAN.md spec; reference `workflow-reference.md`, `requirement-format.md`, `technical-design-rules.md`

4. **thejudge-quality-check** — checklist from workflow-reference; pass/fail report only

5. **thejudge-map-out** — slice template from workflow-reference; lettered slices; final slice has PRD promotion checklist

6. **thejudge-cleanup** — receipt template; compare slices vs codebase; delete work folder when shipped; write receipt to `PRD/instructions/receipts/` **before** delete

7. Each SKILL.md must have YAML frontmatter: `name`, `description`, `disable-model-invocation: true`

## Source files to read

- `.claude/skills/kickoff/SKILL.md`
- `.claude/skills/kickoff/reference.md`
- [GAMEPLAN.md](GAMEPLAN.md)
- `PRD/instructions/workflow-reference.md` (from slice A)

## Acceptance criteria

- [ ] All 6 staged files exist under `skills/`
- [ ] Frontmatter valid on each SKILL.md
- [ ] Kickoff reference.md uses current terminology
- [ ] No references to `docs/superpowers/` or `.cursor/plans/` as persistence targets
- [ ] Cleanup skill mandates receipt path under `PRD/instructions/receipts/`

## Verification

```bash
ls PRD/work/prd-workflow-skills/skills/thejudge-*/SKILL.md | wc -l  # expect 5
test -f PRD/work/prd-workflow-skills/skills/thejudge-kickoff/reference.md
```

## Files touched

- `PRD/work/prd-workflow-skills/skills/**` (create)
