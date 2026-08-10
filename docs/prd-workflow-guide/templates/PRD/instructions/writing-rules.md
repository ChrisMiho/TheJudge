# writing-rules.md

## Purpose

How to write and edit the documents in this PRD set.

## Rules

- One purpose per file.
- Sections are self-contained: a reader who jumps straight to `REQ-047` should
  not need three other files to understand it.
- Concise markdown. Bullets over paragraphs for enumerable content; prose for
  reasoning.
- Preserve meaning when editing. If a change alters intent, it needs a decision.
- Ambiguity becomes a `Q-###`, never a guess written as fact.

## Style

Use these standard field labels so entries are scannable and greppable:

`Summary`, `Description`, `Acceptance Criteria`, `Constraints`,
`Dependencies`, `Notes`

## ID Rules

| Prefix | File |
|---|---|
| `DEC-###` | `sections/decisions/<domain>.md` |
| `REQ-###` | `sections/functional-requirements.md` |
| `NFR-###` | `sections/non-functional-requirements.md` |
| `FLOW-###` | `sections/user-flows.md` |
| `Q-###` | `sections/open-questions.md` |
| `GOAL-###` | `sections/goals-and-non-goals.md` |
| `PERSONA-###` | `sections/personas.md` |

- Zero-padded to three digits.
- Assigned sequentially: the next ID is the highest existing plus one.
- Never reused, never renumbered, for any reason including tidiness.
- Cross-reference by bare ID in prose (`DEC-112`), not by link and never by
  line number. Bare IDs survive file moves; links and line numbers do not.

## Editing Rules

- Make the smallest change that is correct.
- Edit in dependency order: decision body and router index first, then the
  section files that depend on them.
- When a later decision narrows an earlier requirement, record it in that
  requirement's `Notes` rather than rewriting its original text.
