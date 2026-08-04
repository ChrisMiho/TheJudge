---
status: active
---

# assistant-chat-shell

Structured markdown answer rendering plus persistent, resumable conversation
history (left history drawer) on top of the already-shipped chat-first
workspace (DEC-118). Absorbed `in-depth-question-ux` (answer formatting)
during refinement.

See `IDEA.md` for the original idea, `DESIGN-BRIEF.md` for the approved
scope, and `GAMEPLAN.md` for architecture, data flow, and cross-cutting
implementation decisions made during mapping.

## Implementation map

| Slice | Objective | Depends on |
| --- | --- | --- |
| [A](./slice-a-markdown-answer-rendering.md) | Structured markdown rendering of assistant messages | none |
| [B](./slice-b-history-persistence-layer.md) | Browser-local conversation history storage + hook save/restore API | none |
| [C](./slice-c-history-drawer-and-wiring.md) | History drawer UI, resume flow, Menu mutual exclusivity, dual-consumer wiring | B |

## Next step

`/thejudge-implement PRD/work/assistant-chat-shell/ slice A`
