# Slice E — Prior shipped runs are linked from receipts

## Status: planned

## Goal

The owner reports a bug on a feature that already shipped. The run finds the
receipt documenting how that feature was built and hands it to refinement, so
run two does not start blind on work run one recorded.

## Requirements

REQ-163, FLOW-021.

1. Node 2 searches `PRD/instructions/receipts/` — whose files are already named
   `<slug>-<date>.md` — for slug and keyword matches against the request and
   any intake material.
2. Each match is written as one `## Prior run` line in
   `PRD/work/<slug>/IDEA.md`, naming the receipt path.
3. `thejudge-refinement` reads those lines as input. They already fall under its
   existing `IDEA.md` read; the slice states it rather than assuming it.
4. No match writes no section, and the run continues without interruption.
5. Matches are a **flat list**, not a chain walk. Receipts carry no parent
   pointer, so there is nothing to walk when run three follows run two.
6. The owner is never asked to recall or name a prior receipt.
7. A match is offered to refinement as input and never treated as scope.
8. The stated limit goes in the skill: this is keyword matching. It will miss a
   receipt whose slug shares no words with the request, and may offer an
   irrelevant one. A false match costs a read, not a wrong decision.

## Files touched

- `.claude/skills/thejudge-kickoff/SKILL.md` — `## Reads`, `## Writes`, and the
  receipts search with its stated limit
- `.agents/skills/**` via `npm run skills:ai-sync`

## Acceptance criteria

- [ ] E1 — `thejudge-kickoff/SKILL.md` names `PRD/instructions/receipts/` as a
      searched input, matching on slug and keywords from the request and intake.
- [ ] E2 — `thejudge-kickoff/SKILL.md` specifies one `## Prior run` line per
      match in `IDEA.md`, naming the receipt path.
- [ ] E3 — `thejudge-kickoff/SKILL.md` states that no match writes no section
      and the run continues uninterrupted.
- [ ] E4 — `thejudge-kickoff/SKILL.md` states matches are a flat list, with the
      no-parent-pointer reason, and are input rather than scope.
- [ ] E5 — `thejudge-kickoff/SKILL.md` states the keyword-matching limit: a
      miss costs a blind run, a false match costs a read.
- [ ] E6 — `grep -rn "PRD/instructions/receipts" .claude/skills/` returns
      `thejudge-kickoff` alongside `thejudge-cleanup`, where before this package
      no skill read the receipts corpus at all.
- [ ] E7 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [ ] E8 — run the search by hand against the live corpus for one plausible bug
      description, and record which receipts matched and whether any is
      relevant. This measures the stated limit rather than asserting it away.

## Verification

```bash
grep -n "receipts" .claude/skills/thejudge-kickoff/SKILL.md
grep -n "Prior run" .claude/skills/thejudge-kickoff/SKILL.md
grep -rln "PRD/instructions/receipts" .claude/skills/
ls PRD/instructions/receipts/
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```
