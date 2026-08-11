# skill-testing.md

## Status
- Status: active
- Applies to: every `thejudge-*` skill in `.cursor/skills/`

## Purpose

A skill is a behavior specification with no test. Editing one is editing agent
behavior blind — the SKILL.md still reads fine, and nothing tells you the
guidance stopped binding.

A **skill fixture** fixes that: one scenario, one grading key, and the measured
result of running it. Re-running a fixture after a skill edit tells you whether
the skill still does what it claimed.

This is the same bargain `apps/backend/src/eval/fixtures/` makes for prompts —
record expected behavior, re-run to detect drift.

## Method is not defined here

`superpowers:writing-skills` owns the RED-GREEN-REFACTOR cycle, pressure
scenarios, rationalization tables, and the wording rules. Read it before
authoring or editing a skill. Do not restate it here.

This file defines only the repo-local parts: fixture format, storage, and when
to re-run.

## Fixture format

One file per scenario at
`PRD/instructions/skill-fixtures/<skill-name>/<scenario-slug>.md`, with four
sections:

| Section | Contents |
| --- | --- |
| `## Preconditions` | Repo/package state the scenario assumes, concrete enough to verify or rebuild |
| `## Scenario` | The prompt, verbatim and copy-pasteable. Never mentions the skill under test |
| `## Grading key` | Expected outcome per item, the anchor, and why. **Never shown to the agent** |
| `## Measured runs` | Dated results per run, naming the skill version and the rep count |

## Rules

- **The scenario never names the skill under test.** Naming it tests
  compliance, not discovery, and a skill that is never found is a skill that
  never runs.
- **Span the outcome space.** Include at least one item the skill must refuse.
  A fixture where everything succeeds cannot detect a skill that has stopped
  refusing anything.
- **Include traps.** At least one item that looks routine but conflicts with
  something already settled. Both real failures found so far were traps.
- **Run the no-skill control first.** If the control already behaves correctly,
  there is nothing to fix — do not author guidance for it. Two of five
  guardrails predicted for `thejudge-amend` protected against nothing, and were
  cut on the control's evidence.
- **Three reps minimum.** Single samples lie. Divergence across reps means the
  wording is not binding, even when every rep is individually defensible.
- **Record variance, not just pass/fail.** Convergence is the signal that
  guidance landed.

## When to re-run

| Change | Re-run |
| --- | --- |
| Verdict/outcome taxonomy, gates, or refusal conditions | Yes — full fixture |
| Rationalization table, red flags, wording of an existing rule | Yes — full fixture |
| `description` frontmatter | Yes — discovery is what it controls |
| Typos, formatting, link fixes | No |

Fixture runs dispatch subagents and cost real tokens. This is a deliberate
pre-merge check on skill edits, not a CI gate, and it is not wired into
`npm run quality:check`.

## Fixtures are not receipts

A fixture records how a skill behaves, not what a work package decided. Product
truth stays in `PRD/sections/`; package history goes to
`PRD/instructions/receipts/` at cleanup. A fixture that starts accumulating
product decisions has drifted — move them.

## Related material

- `superpowers:writing-skills` — the authoring and testing method
- `AGENT-SKILLS.md` — skill catalog and the `npm run skills:ai-sync` workflow
- `PRD/instructions/workflow-reference.md` — status vocabulary the fixtures assert against
