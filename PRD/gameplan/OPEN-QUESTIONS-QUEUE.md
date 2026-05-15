# Open Questions Queue

Mirror unresolved product ambiguity from `PRD/sections/open-questions.md` in execution-ready terms.

## Queue

| Question ID | Blocking | Impact | Owner | Next step |
|---|---|---|---|---|
| Q-001 | no | low | unassigned | Default to name-only fallback if thumbnail is unavailable; record final decision in `PRD/sections/decisions.md` when confirmed. |
| Q-002 | no | low | unassigned | Keep mock payload format decision explicit in implementation docs/tests; confirm formatting mode via decision update if needed. |
| Q-003 | no | low | unassigned | Keep empty-state asset strategy out of active provider-scope slices; resolve in a dedicated UX/docs pass. |

## Rules

- Keep IDs aligned with `PRD/sections/open-questions.md`; do not invent fake confirmed answers.
- Use `Blocking = yes` only when implementation should stop until resolved.
- Update this queue whenever feature plans reference unresolved `Q-*`.
