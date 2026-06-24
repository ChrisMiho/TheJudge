# TheJudge PRD quick map

Use **after** kickoff when the user names a task or work slug.

## Source-of-truth precedence

1. `PRD/sections/decisions.md` is the read-first router; indexed `PRD/sections/decisions/<domain>.md` entries override conflicting older language
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
| `thejudge-implement` | Execute a lettered slice |
| `thejudge-cleanup` | Ship feature / corpus hygiene |

**Canonical skills:** edit `.cursor/skills/` only, then run `npm run skills:ai-sync` to copy into `.agents/skills/` (Codex) and `.claude/skills/` (Claude Code). See `AGENT-SKILLS.md`.

Copy-paste handoffs: `PRD/instructions/workflow-reference.md` (Handoff blocks).

## Task → files

| Task | Read order |
| ---- | ---------- |
| Product understanding | `overview.md` → `decisions.md` → `goals-and-non-goals.md` |
| Feature implementation | `decisions.md` → `functional-requirements.md` → `user-flows.md` → `integrations-and-data.md` |
| Active work package | `PRD/work/<slug>/README.md` → `GAMEPLAN.md` → slice doc |

## Out of scope for default reads

- `PRD/archive/`
- tool-specific plan folders (not source of truth — use `PRD/work/`)
