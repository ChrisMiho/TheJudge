# TheJudge PRD quick map

Use after kickoff, once the user names a task or work slug.

## Source-of-truth precedence

1. `PRD/sections/decisions.md` is the read-first router; indexed `PRD/sections/decisions/<domain>.md` entries override conflicting older language
2. `PRD/sections/*.md` — product scope
3. `PRD/instructions/*.md` — agent process
4. `PRD/README.md` — navigation only

## Workflow skills

All 10 are model-invocable and may also be called explicitly (`/thejudge-*` in Cursor/Claude Code, `$thejudge-*` in Codex).

| Skill | Use when |
| ----- | -------- |
| `thejudge-prepare` | Autonomously turn one request into one reviewed, implementation-ready package and docs-only preparation PR |
| `thejudge-kickoff` | New session / new idea |
| `thejudge-refinement` | Shape idea + write PRD sections |
| `thejudge-quality-check` | Before slicing |
| `thejudge-map-out` | Create GAMEPLAN + slices, sequential |
| `thejudge-map-out-parallel` | Create GAMEPLAN + slices, grouped into dependency waves |
| `thejudge-implement` | Execute one lettered slice |
| `thejudge-implement-all` | Execute every remaining slice unattended with one agent |
| `thejudge-implement-parallel` | Dispatch a whole wave across agents |
| `thejudge-cleanup` | Ship feature / corpus hygiene |

Use `thejudge-prepare` when one agent should control kickoff through map-out,
independent review, verification, and preparation publication without approval
pauses. Use the direct phase sequence when the user wants interactive questions
and explicit approvals between phases.

**Canonical skills:** edit `.cursor/skills/` only, then run `npm run skills:ai-sync` to copy into `.agents/skills/` (Codex) and `.claude/skills/` (Claude Code). See `AGENT-SKILLS.md`.

## Task → files

| Task | Read order |
| ---- | ---------- |
| Product understanding | `overview.md` → `decisions.md` → `goals-and-non-goals.md` |
| Feature implementation | `decisions.md` → `functional-requirements.md` → `user-flows.md` → `integrations-and-data.md` |
| UI layout / screen polish | `decisions.md` → `screen-layout.md` → `decisions/ui-presentation.md` → layout REQs |
| Active work package | `PRD/work/<slug>/README.md` → `GAMEPLAN.md` → slice doc |

## Out of scope for default reads

- `PRD/archive/`
- tool-specific plan folders (not source of truth — use `PRD/work/`)
