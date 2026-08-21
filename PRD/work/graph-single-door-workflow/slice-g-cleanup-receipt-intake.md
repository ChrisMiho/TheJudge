# Slice G — Cleanup folds intake into the receipt

## Status: planned

## Goal

Deleting `PRD/work/<slug>/` loses nothing traceable. The receipt names each
intake file and the origin it stated, so a reader six months later can tell what
document drove the work even though the folder is gone.

This discharges the first follow-up on
`PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md`.

## Requirements

REQ-162 (the durability half).

1. When `PRD/work/<slug>/intake/` exists, `thejudge-cleanup` writes an
   `## Intake` section into the receipt **before** deleting the package folder,
   naming each intake file and its stated origin.
2. A package with no `intake/` folder cleans up normally. Do not add an empty
   `## Intake` section to its receipt — the same rule the existing
   `## Graph run` section already follows.
3. The section is listed in the skill's `## Writes` alongside the receipt's
   other required contents.
4. `## Intake` sits beside `## Graph run`, not inside it. Intake exists for
   packages built without a graph run too — a direct `thejudge-kickoff` session
   can produce one.
5. No new refusal condition is added. The graph-run refusal gate stays exactly
   as written; missing intake is not a reason to refuse a delete.

## Files touched

- `.claude/skills/thejudge-cleanup/SKILL.md` — `## Writes`, plus a
  `### Intake in the receipt` subsection stating the shape
- `.agents/skills/**` via `npm run skills:ai-sync`

## Acceptance criteria

- [ ] G1 — `thejudge-cleanup/SKILL.md` states that an `## Intake` section is
      written into the receipt before the package folder is deleted, when
      `PRD/work/<slug>/intake/` exists.
- [ ] G2 — the stated section shape names each intake file and its stated
      origin, and appears in the skill as a copyable markdown block.
- [ ] G3 — `thejudge-cleanup/SKILL.md` states that a package with no `intake/`
      gets no `## Intake` section.
- [ ] G4 — `## Intake` is documented as a sibling of `## Graph run`, not nested
      inside it.
- [ ] G5 — the receipt line in `## Writes` lists `## Intake` among the receipt's
      contents.
- [ ] G6 — the graph-run refusal condition in
      `### Graph run in the receipt` is byte-unchanged: no new refusal is added.
- [ ] G7 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [ ] G8 — draft the `## Intake` section for the already-shipped
      `graph-run-boundary-enforcement` package as it would have been written,
      using `docs/whatIsGraph/graph-hardening-handoff.md` as the intake file.
      Confirm the follow-up it discharges would have been unnecessary. Record
      the draft.

## Verification

```bash
grep -n "## Intake\|Intake" .claude/skills/thejudge-cleanup/SKILL.md
git diff -- .claude/skills/thejudge-cleanup/SKILL.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```
