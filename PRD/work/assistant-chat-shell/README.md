---
status: ship-ready
---

# assistant-chat-shell

Structured markdown answer rendering plus persistent, resumable conversation
history (left history drawer) on top of the already-shipped chat-first
workspace (DEC-118). Absorbed `in-depth-question-ux` (answer formatting)
during refinement.

See `IDEA.md` for the original idea, `DESIGN-BRIEF.md` for the approved
scope (plus its post-ship refinement addendum), and `GAMEPLAN.md` for the
original implementation architecture.

## Post-ship refinement pass

Slices A–C below shipped and were reviewed live against the dev server. Two
gaps surfaced against the original goal of mirroring Claude's chat UI:

1. The history trigger (`DEC-125`) shipped as a full-width button inside the
   workspace body rather than integrated into the Menu corner rail.
2. The conversation thread's boxed/capped-height framing and low-contrast
   bubbles read as a form, not a chat surface.

`DESIGN-BRIEF.md`'s addendum and `DEC-126`/`DEC-127` (in
`sections/decisions/conversation-ux.md`) capture the approved direction, with
a visual reference at
[`mockups/history-icon-and-full-bleed-chat.html`](./mockups/history-icon-and-full-bleed-chat.html).
Slices D and E below (added by the remap pass, see `GAMEPLAN.md`'s
addendum for architecture) implement it.

## Implementation map

| Slice | Objective | Depends on | Status |
| --- | --- | --- | --- |
| [A](./slice-a-markdown-answer-rendering.md) | Structured markdown rendering of assistant messages | none | done |
| [B](./slice-b-history-persistence-layer.md) | Browser-local conversation history storage + hook save/restore API | none | done |
| [C](./slice-c-history-drawer-and-wiring.md) | History drawer UI, resume flow, Menu mutual exclusivity, dual-consumer wiring | B | done |
| [D](./slice-d-history-trigger-corner-rail.md) | History trigger relocates into the Menu corner rail; saved-entry rows simplified (DEC-126) | none | done |
| [E](./slice-e-full-bleed-conversation-thread.md) | Full-bleed conversation thread, contrasted turns, pill composer (DEC-127) | none | done |

D and E have no dependency on each other or on A/B/C and can be implemented
in any order.

## Next step

All slices (A–E) are done. `/thejudge-cleanup PRD/work/assistant-chat-shell/`
after this PR merges.
