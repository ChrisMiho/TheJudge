# Slice D — Intake is evidence, never authority

## Status: planned

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

- [ ] D1 — `thejudge-refinement/SKILL.md`'s `## Reads` names
      `PRD/work/<slug>/intake/` and says it is read when the folder exists.
- [ ] D2 — `thejudge-refinement/SKILL.md` states intake is evidence and never
      authority, listing what it may do and what it may not.
- [ ] D3 — `graph-workflow-contract.md` carries the same rule, once, as the
      authority the skill defers to.
- [ ] D4 — both files state that a cited document is recorded as a citation and
      not fetched.
- [ ] D5 — the contract states the rule is unenforced and names the `define`
      gate as what catches an intake claim adopted wholesale.
- [ ] D6 — `graph-run/SKILL.md`'s loop step 5 gate trigger is byte-unchanged by
      this slice: `git diff -- .claude/skills/graph-run/SKILL.md` is empty.
- [ ] D7 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [ ] D8 — read the rule as an implementer would: it is clear that intake
      proposing a slug is honored while intake declaring a requirement settled
      is not. Record the reading.

## Verification

```bash
grep -n "intake" .claude/skills/thejudge-refinement/SKILL.md
grep -n "evidence\|authority\|citation" PRD/instructions/graph-workflow-contract.md
git diff -- .claude/skills/graph-run/SKILL.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```
