status: active

# right-rules-in-order

Luna gets the right rules in an order she can follow: a Magic-trained search model, search fixes, and prompt fixes.

- Idea: [IDEA.md](IDEA.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Gate questions (39 slots, all answered accept): [GATE-QUESTIONS.md](GATE-QUESTIONS.md)
- Amendment-set grep (100 hits, a disposition per hit): [evidence/amendment-grep.md](evidence/amendment-grep.md)
- Intake (evidence, not authority): [intake/GRAPH-BRIEF-search-and-prompt.md](intake/GRAPH-BRIEF-search-and-prompt.md), copied verbatim from the owner's probe folder (PR #290).
- Hard constraint: no practice-suite question, answer, card list, id or per-question result in any committed file.

## Implementation map

Plan: [GAMEPLAN.md](GAMEPLAN.md). Run in order A to G.

| Slice | Title | Depends on | Criteria |
| --- | --- | --- | --- |
| [A](slice-a-fidelity-and-rule-data.md) | Fidelity gate and rule data | none | 9 (1 manual) |
| [B](slice-b-search.md) | Search | A | 11 (1 manual) |
| [C](slice-c-model-tooling.md) | Trained-model tooling, manifest, fetch, identity | B | 10 (1 manual) |
| [D](slice-d-train-and-validate.md) | First training, cross-validation, vectors, gates | C | 11 (2 manual) |
| [E](slice-e-prompt-rules-section.md) | Prompt rules section | A | 9 (1 manual) |
| [F](slice-f-prompt-structure.md) | Prompt structure | E | 9 (1 manual) |
| [G](slice-g-checks-and-ship.md) | Built-prompt checks, goldens, PRD sweep, ship | A to F | 10 (3 manual) |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/right-rules-in-order/DESIGN-BRIEF.md`
- Findings: none
