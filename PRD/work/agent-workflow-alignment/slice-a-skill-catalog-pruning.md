# Slice A — Skill catalog pruning

## Status: done

## Goal

Delete the two parallel-flavor skills from the canonical tree and republish an
accurate operator map for the remaining nine skills (Slice E adds the tenth,
`thejudge-defer`, later).

## Requirements

1. Delete `.cursor/skills/thejudge-map-out-parallel/` and
   `.cursor/skills/thejudge-implement-parallel/` entirely (both contain
   `SKILL.md` and `reference.md`).
2. In `AGENT-SKILLS.md`:
   - Update the intro paragraph's skill count and mode list (remove
     "dependency-wave implementation"; keep single-slice, unattended
     all-slice, and fanout modes).
   - Remove the `map-out-parallel` / `implementp` nodes and edges from the
     `mermaid` workflow diagram, and the sentence noting
     `thejudge-implement-parallel` degrades to sequential in Codex.
   - Remove the `thejudge-map-out-parallel` and `thejudge-implement-parallel`
     rows from the skill catalog table.
   - Update the `thejudge-implement-fanout` catalog row's dispatch target
     description to name only `thejudge-implement-all` (Slice C confirms this
     row's final wording; this pass only removes the deleted skill's mention).
3. In `PRD/instructions/requirement-format.md`, the "Slice Dependency Rules"
   section references `thejudge-map-out/reference.md` **and**
   `thejudge-map-out-parallel/reference.md`. Remove the now-dead second
   reference so the sentence names only `thejudge-map-out/reference.md`.
4. In `PRD/instructions/workflow-reference.md`:
   - Line 5–8 states "All 11 `thejudge-*` skills are model-invocable". Update
     the count to 9 (Slice E updates it again to 10).
   - The "Skill status duties" table has a combined
     `thejudge-map-out` / `map-out-parallel` row and references
     `implement-parallel` in the `thejudge-implement` row's duty description.
     Update both to name only the surviving skills.
   - The "Related material" section's first bullet cites
     `thejudge-map-out-parallel/reference.md`. Remove that citation.
5. Do **not** edit `PRD/instructions/receipts/skill-output-token-tuning-2026-06-25.md`
   — it is a durable historical receipt, not current documentation, and its
   past-tense mentions of the two skills are accurate history.
6. Do not create `thejudge-defer` in this slice — Slice E owns it.
7. Run `npm run skills:ai-sync` and verify all three skill trees are
   byte-identical.

## Acceptance criteria

- [ ] `.cursor/skills/thejudge-map-out-parallel/` and
      `.cursor/skills/thejudge-implement-parallel/` do not exist, nor do their
      mirrors under `.agents/skills/` or `.claude/skills/`
- [ ] `grep -rn "map-out-parallel\|implement-parallel" AGENT-SKILLS.md PRD/instructions/requirement-format.md PRD/instructions/workflow-reference.md` returns nothing
- [ ] `diff -rq .cursor/skills .agents/skills` and `diff -rq .cursor/skills .claude/skills` produce no output
- [ ] `AGENT-SKILLS.md`'s mermaid diagram still renders a connected flow from `thejudge-map-out` through `thejudge-implement` / `thejudge-implement-all` to `thejudge-cleanup`, with `thejudge-implement-fanout` dispatching only to `thejudge-implement-all`

## Verification

```bash
test ! -d .cursor/skills/thejudge-map-out-parallel
test ! -d .cursor/skills/thejudge-implement-parallel
grep -rn "map-out-parallel\|implement-parallel" AGENT-SKILLS.md PRD/instructions/requirement-format.md PRD/instructions/workflow-reference.md; test $? -eq 1
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

## Files touched

- `.cursor/skills/thejudge-map-out-parallel/` (deleted)
- `.cursor/skills/thejudge-implement-parallel/` (deleted)
- `.agents/skills/thejudge-map-out-parallel/` (deleted by sync)
- `.agents/skills/thejudge-implement-parallel/` (deleted by sync)
- `.claude/skills/thejudge-map-out-parallel/` (deleted by sync)
- `.claude/skills/thejudge-implement-parallel/` (deleted by sync)
- `AGENT-SKILLS.md`
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/workflow-reference.md`
