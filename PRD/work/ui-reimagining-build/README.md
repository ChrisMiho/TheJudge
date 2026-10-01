status: active

# ui-reimagining-build

See IDEA.md. Intake evidence: intake/GRAPH-BRIEF.md. Design brief: DESIGN-BRIEF.md.
Finalized product truth, applied by each owning slice: GATE-QUESTIONS.md (54
accept / 3 edit: REQ-210, REQ-206, REQ-214).

Supersession note: `intake/GRAPH-BRIEF.md:273` and `:477` describe Mana spent as
a box on "the Stack and the Battlefield" only — superseded by the REQ-210 edit
verdict (2026-10-01), which puts the box on every zone's card.

## Slices

Mapped by node 5 (`plan`), graph run `graph-20260930-055958`. Full detail,
dependencies and the complete 57-id assignment table: `GAMEPLAN.md`.

| Slice | Title | Depends on | `GATE-QUESTIONS.md` ids | Criteria (manual) | Status |
| --- | --- | --- | --- | --- | --- |
| [A](slice-a-frame-tokens-menu.md) | Frame: tokens, ambient scene, banner header, Menu tray, Theme band, font | — | 12 | 11 (4) | done |
| [B](slice-b-shared-sheet-shell.md) | Shared sheet shell + confirm sheet | A | 4 | 10 (3) | done |
| [C](slice-c-ask-a-question.md) | Ask a Question: door, stage, pill composer, ruling view, carry | A, B | 10 | 12 (4) | done |
| [D](slice-d-in-depth-stations-cards.md) | In-depth details: stations rail, Cards shelf, card menu, placement, Stack reorder | A, B, C | 8 | 11 (3) | done |
| [E](slice-e-in-depth-context-review.md) | In-depth details: context sheet, Targets, Mana spent, review | D | 7 | 11 (3) | done |
| [F](slice-f-wait-inscription.md) | Wait inscription | C, E | 2 | 7 (4) | done |
| [G](slice-g-trade-balancer.md) | Trade Balancer: piles, verdict, New trade, rename, picker pills | A, B | 4 | 11 (3) | done |
| [H](slice-h-card-scan-chrome.md) | Card scan chrome, with a holding list | A, B, D, G | 1 | 11 (5) | planned |
| [I](slice-i-question-history.md) | Question History: one list, reopened live | A, B, C, D | 6 | 11 (3) | planned |
| [J](slice-j-life-tracker-sheets.md) | Life Tracker's sheets take the look | A, B | 1 | 11 (3) | planned |
| [K](slice-k-late-additions.md) | Late additions: dictation, Copies on a Stack card | C, E | 2 | 9 (3) | planned |

Implementation order is A → B → C → D → E → F → G → H → I → J → K, one agent,
sequential (`$thejudge-implement-all PRD/work/ui-reimagining-build/`, first
slice `A`). Slice K is the final slice and carries the PRD promotion
checklist and the Ship gates block.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ui-reimagining-build/DESIGN-BRIEF.md`
- Findings: none
