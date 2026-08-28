# TheJudge PRD quick map

Use after kickoff, once the user names a task or work slug.

## Source-of-truth precedence

1. `PRD/sections/<feature>/README.md` — the current-state feature specs, read-first truth for what a feature does today
2. `PRD/sections/*.md` — product scope (`REQ`/`FLOW`/`NFR`, screen layout, system map)
3. `PRD/sections/decisions.md` — demoted historical index; resolves a cited `DEC-ID` only, never an override
4. `PRD/instructions/*.md` — agent process
5. `PRD/README.md` — navigation only

## Workflow skills

All 11 are model-invocable and may also be called explicitly (`/thejudge-*` in Claude Code, `$thejudge-*` in Codex).

| Skill | Use when |
| ----- | -------- |
| `thejudge-prepare` | Autonomously turn one request into one reviewed, implementation-ready package and docs-only preparation PR |
| `thejudge-kickoff` | New session / new idea |
| `thejudge-refinement` | Shape idea + write PRD sections |
| `thejudge-quality-check` | Before slicing |
| `thejudge-map-out` | Create GAMEPLAN + slices, sequential |
| `thejudge-implement` | Execute one lettered slice |
| `thejudge-implement-all` | Execute every remaining slice unattended with one agent |
| `thejudge-implement-fanout` | Run two or more active packages concurrently |
| `thejudge-cleanup` | Ship feature / corpus hygiene |

Use `thejudge-prepare` when one agent should control kickoff through map-out,
independent review, verification, and preparation publication without approval
pauses. Use the direct phase sequence when the user wants interactive questions
and explicit approvals between phases.

**Canonical skills:** edit `.claude/skills/` only (Claude Code reads it), then run `npm run skills:ai-sync` to mirror into `.agents/skills/` (Codex). See `AGENT-SKILLS.md`.

## Task → files

| Task | Read order |
| ---- | ---------- |
| Product understanding | `overview.md` → `<feature>/README.md` → `goals-and-non-goals.md` |
| Feature implementation | `<feature>/README.md` → `functional-requirements.md` → `user-flows.md` → `integrations-and-data.md` |
| UI layout / screen polish | `<feature>/README.md` → `screen-layout.md` → layout REQs |
| Active work package | `PRD/work/<slug>/README.md` → `GAMEPLAN.md` → slice doc |

## Out of scope for default reads

- `PRD/archive/`
- tool-specific plan folders (not source of truth — use `PRD/work/`)
