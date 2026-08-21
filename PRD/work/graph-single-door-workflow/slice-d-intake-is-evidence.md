# Slice D — Intake is evidence, never authority

## Status: done

## Goal

Refinement reads the handed-in document and still makes every product decision
with the owner at the `define` gate. A document that states a matter is settled
does not settle it.

## Requirements

REQ-162 (the authority half).

1. `thejudge-refinement` reads `PRD/work/<slug>/intake/` as an input when the
   folder exists. It is added to the skill's `## Reads` list.
2. `PRD/instructions/graph-workflow-contract.md` states the rule: intake is
   evidence and never authority. It **may** state findings, mark matters
   settled, and propose a slug. It **may not** decide product truth.
3. Every product decision arising from intake is still made with the owner at
   the `define` gate. Material that could bind refinement would route product
   truth around the gate, which is the one thing this design protects.
4. A document cited by intake is recorded as a citation and **not fetched**.
   Transitive following is unbounded.
5. The rule is stated as unenforced, not implied to be enforced. Nothing
   prevents refinement adopting an intake claim wholesale; what catches it is
   the `define` gate parking on the resulting `PRD/sections/` diff. Slice D
   writes that limit down rather than leaving a reader to assume a mechanism
   exists.
6. Nothing about what the `define` gate parks on changes. The gate trigger — a
   non-empty `PRD/sections/` diff after node 3 returns `ok` — is untouched.

## Files touched

- `.claude/skills/thejudge-refinement/SKILL.md` — `## Reads`, and the
  evidence-not-authority rule where it governs the brief
- `PRD/instructions/graph-workflow-contract.md` — the rule, the citation rule,
  and the stated limit
- `.agents/skills/**` via `npm run skills:ai-sync`

## Acceptance criteria

- [x] D1 — `thejudge-refinement/SKILL.md`'s `## Reads` names
      `PRD/work/<slug>/intake/` and says it is read when the folder exists.
- [x] D2 — `thejudge-refinement/SKILL.md` states intake is evidence and never
      authority, listing what it may do and what it may not.
- [x] D3 — `graph-workflow-contract.md` carries the same rule, once, as the
      authority the skill defers to.
- [x] D4 — both files state that a cited document is recorded as a citation and
      not fetched.
- [x] D5 — the contract states the rule is unenforced and names the `define`
      gate as what catches an intake claim adopted wholesale.
- [x] D6 — `graph-run/SKILL.md`'s loop step 5 gate trigger is byte-unchanged by
      this slice: `git diff -- .claude/skills/graph-run/SKILL.md` is empty.
- [x] D7 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [x] D8 — read the rule as an implementer would: it is clear that intake
      proposing a slug is honored while intake declaring a requirement settled
      is not. Record the reading.

## Verification

```bash
grep -n "intake" .claude/skills/thejudge-refinement/SKILL.md
grep -n "evidence\|authority\|citation" PRD/instructions/graph-workflow-contract.md
git diff -- .claude/skills/graph-run/SKILL.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```

## D8 reading

Read both amended texts as a fresh implementer: intake proposing a slug is
explicitly listed among what it "may" do (`## Reads` item 8 and the
`## Intake is evidence, never authority` sections in both files), so a slug
proposal is honored without further review. Intake declaring "REQ-160 is
settled" or similar is explicitly excluded — "it may not decide product
truth" — and any such claim only reaches `PRD/sections/` through the normal
`define` gate diff, which parks for the owner regardless of what intake
asserted. The distinction reads clearly: propose is honored, decide is not.
