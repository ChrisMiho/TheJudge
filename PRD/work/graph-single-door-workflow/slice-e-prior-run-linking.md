# Slice E — Prior shipped runs are linked from receipts

## Status: done

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

- [x] E1 — `thejudge-kickoff/SKILL.md` names `PRD/instructions/receipts/` as a
      searched input, matching on slug and keywords from the request and intake.
- [x] E2 — `thejudge-kickoff/SKILL.md` specifies one `## Prior run` line per
      match in `IDEA.md`, naming the receipt path.
- [x] E3 — `thejudge-kickoff/SKILL.md` states that no match writes no section
      and the run continues uninterrupted.
- [x] E4 — `thejudge-kickoff/SKILL.md` states matches are a flat list, with the
      no-parent-pointer reason, and are input rather than scope.
- [x] E5 — `thejudge-kickoff/SKILL.md` states the keyword-matching limit: a
      miss costs a blind run, a false match costs a read.
- [x] E6 — `grep -rn "PRD/instructions/receipts" .claude/skills/` returns
      `thejudge-kickoff` alongside `thejudge-cleanup`, where before this package
      no skill read the receipts corpus at all.
- [x] E7 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [x] E8 — run the search by hand against the live corpus for one plausible bug
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

## E8 hand-run

Request: `"Bug: the card scanner sometimes locks onto the wrong card outline
and won't re-detect."` Keywords: `scan`, `lock`, `outline`.

```
$ ls PRD/instructions/receipts/ | grep -iE "scan.*lock|lock.*scan"
card-scan-lockin-fix-2026-06-22.md
scan-lock-acquisition-tuning-2026-06-26.md
scan-lock-on-outline-2026-06-30.md
```

All three matched on keyword overlap. `scan-lock-on-outline-2026-06-30.md`
(status: shipped) is directly relevant — it is the receipt for exactly this
kind of lock-on-outline behavior. `card-scan-lockin-fix-2026-06-22.md` and
`scan-lock-acquisition-tuning-2026-06-26.md` are adjacent but not certainly
the same bug — offering all three as input costs refinement a few reads, not
a wrong decision, which is the stated limit in practice.
