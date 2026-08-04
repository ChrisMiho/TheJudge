# assistant-chat-shell — Design Brief

## Origin

Started from two related ideation packages:
- `assistant-chat-shell` — a modern chat shell for In-Depth Question and Quick Question (history drawer, centered thread, context badges, edit/new conversation).
- `in-depth-question-ux` — readable markdown/structured answer formatting in chat.

Refinement found that most of `assistant-chat-shell`'s original ask — chat-first centered thread, docked composer, adaptive read-only context sheet/drawer, New response scroll affordance — is **already shipped** as `DEC-118`/`REQ-025`/`REQ-026`/`REQ-028`/`REQ-075`/`REQ-097`/`REQ-098`, implemented in `apps/frontend/src/components/ConversationWorkspace.tsx`. The two packages are merged into this one because their genuinely remaining scope is small, related, and sits on the same shared conversation surface. `in-depth-question-ux` is retired; its scope (answer formatting) is fully captured below.

## Outcome

Two additive capabilities on top of the already-shipped shared conversation workspace:

1. **Structured markdown answer rendering** (`DEC-123`/`REQ-102`) — assistant answers render as markdown (headings, lists, emphasis, inline code, tables, code blocks, links) instead of plain text, client-side only. Applies generically to `ConversationThread`, so any future chat feature built on the shared workspace inherits it automatically.
2. **Persistent, resumable conversation history** (`DEC-124`/`REQ-103`/`REQ-104`/`FLOW-016`) — a left history drawer lists auto-saved past conversations (browser-local, single-device, capped at 20, oldest pruned), and selecting one restores its frozen context, mode, and thread with follow-ups re-enabled — a real, scoped divergence from the suite's default ephemeral/no-persistence convention, following the `DEC-103` (Player Life Tracker) precedent.

## Non-goals

- Re-litigating or re-implementing the already-shipped chat-first workspace, adaptive context drawer/sheet, or reader-safe scrolling (`DEC-118`) — those stay as-is.
- Cross-device sync, account/auth, or any server-side conversation store.
- Schema-enforced/structured answer shapes (markdown rendering only).
- Editing restored frozen context, or any zone/card/enrichment editing mid-conversation (`DEC-040` unchanged).
- Unbounded history retention (capped at 20 conversations).
- Any change to `AskAiRequest`/`AskAiResponse` shapes, Zod schemas, prompt assembly, providers, or backend routes.

## Product truth added

- `DEC-123` (`sections/decisions/conversation-ux.md`) — structured markdown answer rendering.
- `DEC-124` (`sections/decisions/conversation-ux.md`) — persistent, resumable conversation history; narrowly diverges from `DEC-039`/`DEC-111` for saved history only.
- `DEC-125` (`sections/decisions/conversation-ux.md`) — history drawer's own trigger, mobile presentation (bottom sheet `<768px` / left drawer `768px`+, mirroring DEC-118), and mutual exclusivity with DEC-122's Menu drawer.
- `REQ-102` — structured markdown answer rendering.
- `REQ-103` — persistent conversation history list and drawer.
- `REQ-104` — resume a saved conversation.
- `FLOW-016` — resume a saved conversation from history.

## Technical direction

- Client-side markdown rendering (e.g. `react-markdown` + a GFM plugin for tables) inside `ConversationThread`, sanitized against script/style injection. Wire contract (`{ answer }` as a plain string) is unchanged; only frontend rendering changes.
- History persistence reuses the `DEC-103` browser-local storage pattern (try/catch-guarded reads, validated/dropped on corruption) rather than new storage infrastructure. No new backend endpoint.
- Resume restores stored frozen context, mode, and thread into the existing shared workspace state — no new context-derivation logic, no re-validation beyond what was captured at save time.

## Open questions

None outstanding — scope, retention cap (20), resume semantics (fully resumable), and persistence model (browser-local, single-device) were confirmed with the user during refinement. A quality-check pass flagged that the history drawer's narrow-viewport presentation and its collision with DEC-122's in-flight Menu corner rail were undecided; both are now resolved by `DEC-125` (own workspace-body trigger, bottom sheet `<768px` / left drawer `768px`+, mutually exclusive with the Menu drawer).
