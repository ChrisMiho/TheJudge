# TheJudge PRD quick map

Condensed from `PRD/README.md` for use **after** kickoff when the user names a task type.

## Source-of-truth precedence

1. `PRD/sections/decisions.md` overrides conflicting older language
2. `PRD/sections/*.md` — current product scope
3. `PRD/instructions/*.md` — how agents edit/generate docs
4. `PRD/README.md` — navigation only

## Task → files (user must request these paths)

| Task type | Read order |
|-----------|------------|
| Product understanding | `sections/overview.md` → `sections/decisions.md` → `sections/goals-and-non-goals.md` → `sections/problem-statement.md` |
| Feature implementation | `sections/decisions.md` → `sections/functional-requirements.md` → `sections/user-flows.md` → `sections/integrations-and-data.md` → `sections/non-functional-requirements.md`; add `instructions/technical-design-rules.md` if architecture involved; add `instructions/secrets-handling.md` if credentials/env |
| Story / backlog work | `sections/decisions.md` → `sections/functional-requirements.md` → `sections/user-flows.md` → `instructions/story-generation.md` → `instructions/requirement-format.md` |

## Instructions folder (load on demand)

| File | Use when |
|------|----------|
| `instructions/agent-working-rules.md` | Any PRD edit or generation |
| `instructions/doc-lifecycle.md` | Creating/closing non-section PRD docs |
| `instructions/writing-rules.md` | Editing doc style/structure |
| `instructions/technical-design-rules.md` | Architecture or code structure proposals |
| `instructions/secrets-handling.md` | Credentials, `.secrets/`, provider keys |

## Out of scope for default agent work

- `PRD/archive/` — historical unless user points to a specific file
- `PRD/gameplan/` — roadmap/backlog unless user asks
