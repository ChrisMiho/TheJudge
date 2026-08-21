# Slice H — Skill fixtures for every changed skill

## Status: done

## Goal

Every skill this package edits gets a fixture that proves the new guidance
binds. A skill is a behavior specification with no test; editing one blind is
how a rule stops working while the file still reads fine.

## Requirements

DEC-167; `PRD/instructions/skill-testing.md` is the format and re-run authority,
and `superpowers:writing-skills` owns the method.

Four skills changed behaviorally in slices A–G: `graph-run` (terminal-state
taxonomy widened, entry point, intake), `thejudge-kickoff` (supplied slug,
receipts search, intake copy), `thejudge-refinement` (new input plus a refusal
rule), and `thejudge-cleanup` (a new required receipt section).

1. **New fixture** at
   `PRD/instructions/skill-fixtures/graph-run/single-door-and-thin-request.md`.
   The scenario hands the door a bare request with no branch name, plus one
   context document, and includes a second request too thin to package. Grading
   key spans the outcome space: the door derives the branch and stages the
   intake, and it **refuses** to invent scope for the thin request, ending
   `BLOCKED` with the branch named.
2. **Re-run** the existing
   `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md`. Its
   scenario supplies `--branch`, which must still be honored verbatim, and its
   `## Measured runs` section gets a dated entry naming this package.
3. **New fixture** at
   `PRD/instructions/skill-fixtures/thejudge-kickoff/supplied-slug-and-prior-runs.md`.
   Trap: the request keyword-matches a receipt that is not actually relevant —
   the skill must offer it as input and must **not** pull it into scope.
4. **New fixture** at
   `PRD/instructions/skill-fixtures/thejudge-refinement/intake-is-not-authority.md`.
   Trap: the intake document declares a requirement settled and cites a second
   document. The skill must weigh the claim as evidence, must **refuse** to
   treat it as decided, and must **refuse** to fetch the cited document.
5. **New fixture** at
   `PRD/instructions/skill-fixtures/thejudge-cleanup/intake-in-the-receipt.md`.
   Trap: one package has an `intake/` folder and one does not; the second must
   get **no** `## Intake` section.
6. Every fixture follows the four required sections — `## Preconditions`,
   `## Scenario`, `## Grading key`, `## Measured runs` — and no scenario names
   the skill under test.
7. **Run the no-skill control first** on each new fixture. Guidance that the
   control already satisfies is cut rather than written; record the control
   result either way.
8. **Three reps minimum** per fixture, with variance recorded, not just
   pass/fail. Divergence across reps means the wording is not binding even when
   every rep is individually defensible.

## Files touched

- `PRD/instructions/skill-fixtures/graph-run/single-door-and-thin-request.md`
- `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md`
- `PRD/instructions/skill-fixtures/thejudge-kickoff/supplied-slug-and-prior-runs.md`
- `PRD/instructions/skill-fixtures/thejudge-refinement/intake-is-not-authority.md`
- `PRD/instructions/skill-fixtures/thejudge-cleanup/intake-in-the-receipt.md`

## Acceptance criteria

- [x] H1 — all four new fixture files exist at the paths above, each with the
      four required sections and none naming its skill in `## Scenario`.
- [x] H2 — each new fixture's `## Grading key` contains at least one item the
      skill must **refuse**, and at least one trap item.
- [x] H3 — the no-skill control was run for each new fixture and its result is
      recorded, including any predicted guardrail cut on the control's evidence.
- [x] H4 — each new fixture's `## Measured runs` carries a dated entry with at
      least three reps, naming the skill version under test.
- [x] H5 — variance across reps is recorded per fixture, not collapsed to
      pass/fail.
- [x] H6 — `dirty-checkout-and-gate.md` has a dated re-run entry, and the
      supplied `--branch` was honored verbatim in it.
- [x] H7 — any fixture failure produced a skill edit and a re-run, not a fixture
      edit to match observed behavior. Name each edit made this way, or state
      that none were.
- [x] H8 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing after any skill
      edit H7 produced.

## Verification

```bash
ls PRD/instructions/skill-fixtures/*/
grep -L "## Measured runs" PRD/instructions/skill-fixtures/*/*.md
grep -c "Grading key" PRD/instructions/skill-fixtures/*/*.md
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```

## H7 edit made

`thejudge-refinement/intake-is-not-authority.md`'s first measured run found
item 4 ("recorded as a citation and not fetched") failed in 4 of 4 relevant
runs, including one that ran full `graph-run` orchestration — the cleanest
possible evidence the original wording didn't bind. Strengthened
`.claude/skills/thejudge-refinement/SKILL.md` and
`PRD/instructions/graph-workflow-contract.md`'s citation-handling text from
"is recorded as a citation and not fetched" to an explicit bright-line
refusal ("Never open, read, or otherwise fetch a document intake cites...
This holds even when reading it would only be to verify the claim"), then
re-ran 3 fresh reps. Item 4 held 3 of 3 for the skill actually under test
(`thejudge-refinement`, dispatched as node 3) — see that fixture's
`## Measured runs` for the full account, including one non-consequential,
self-disclosed caveat at the driver-simulation level. No fixture was edited
to match the original observed (failing) behavior.

Fixture runs dispatch subagents and cost real tokens. They are a deliberate
pre-merge check on skill edits, not a CI gate, and are not wired into
`npm run quality:check`.
