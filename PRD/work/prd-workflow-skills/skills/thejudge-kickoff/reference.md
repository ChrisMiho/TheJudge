# TheJudge PRD quick map

Use **after** kickoff when the user names a task or work slug.

## Source-of-truth precedence

1. `PRD/sections/decisions.md` overrides conflicting older language
2. `PRD/sections/*.md` — product scope
3. `PRD/instructions/*.md` — agent process
4. `PRD/README.md` — navigation only

## Workflow skills (manual attach)

| Skill | Use when |
| ----- | -------- |
| `thejudge-kickoff` | New session / new idea |
| `thejudge-refinement` | Shape idea + write PRD sections |
| `thejudge-quality-check` | Before slicing |
| `thejudge-map-out` | Create GAMEPLAN + slices |
| `thejudge-cleanup` | Ship feature / corpus hygiene |

Paths: `.cursor/skills/`, `.codex/skills/`, `.claude/skills/` (identical copies).

## Task → files

| Task | Read order |
| ---- | ---------- |
| Product understanding | `overview.md` → `decisions.md` → `goals-and-non-goals.md` |
| Feature implementation | `decisions.md` → `functional-requirements.md` → `user-flows.md` → `integrations-and-data.md` |
| Active work package | `PRD/work/<slug>/README.md` → `GAMEPLAN.md` → slice doc |

## Out of scope for default reads

- `PRD/archive/`
- `.cursor/plans/` (not source of truth — use `PRD/work/`)
