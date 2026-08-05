# Conversation UX decisions

Decrypt wait UX and follow-up conversation history behavior.

### DEC-031
- Decision: Decrypt wait UX uses a pure frontend animated panel with CSS-only motion, a live elapsed timer, and threshold-based escalating messages.
- Status: confirmed
- Context: AI responses during decrypt can take several seconds; the submit button going inactive with no feedback creates a perceived hang. A dedicated waiting panel was added to replace the submit form while `isSubmitting` is true.
- Impact:
  - `lib/askAiWaitStages.ts` — threshold config and stage selector (pure TS, no React)
  - `hooks/useElapsedWaitTimer.ts` — setInterval hook returning elapsed seconds and current stage
  - `components/AskAiWaitingPanel.tsx` — timer display with `aria-live` message region and CSS variant classes
  - `index.css` — `.wait-stage-calm`, `.wait-stage-curious`, `.wait-stage-absurd` keyframe classes
  - `components/EnrichmentStep.tsx` — conditionally renders `AskAiWaitingPanel` in place of submit form
  - CSS carve-out under NFR-006 explicitly permits these keyframe animations for functional wait states
- Related requirements:
  - REQ-023
  - NFR-006
- Notes:
  - no animation libraries added; CSS-only constraint satisfied
  - card list and wizard context above the form remain visible during the wait

### DEC-038
- Decision: `POST /api/ask-ai` may accept an optional `conversationHistory` field on follow-up turns; success and error response shapes remain unchanged.
- Status: confirmed
- Context: The post-decrypt follow-up chat feature requires prior exchange turns to be sent with each follow-up so the model can reason in context. Adding one optional field is the smallest additive change to the existing contract.
- Impact:
  - `AskAiRequest` gains optional `conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>`
  - first decrypt omits `conversationHistory`; follow-up N sends frozen `gameContext` plus full prior exchange
  - backend Zod validation accepts the field when present: non-empty array, max 20 turns, max 2000 chars/message, same control-character guardrails as `question`, must start `role: "user"`, must alternate user/assistant, last entry must be `assistant`
  - success response shape `{ answer }` and error response shape are unchanged for both mock and OpenAI providers
  - mock-provider follow-up answers include the exact assembled LLM-facing prompt for the submitted user message, allowing the visible chat flow and provider-bound prompt to be validated without live model access
  - DEC-020 frozen contract is preserved; this is an additive optional extension only
- Related requirements:
  - REQ-019
  - REQ-027
- Notes:
  - amends DEC-020 contract freeze for this one optional additive field

### DEC-039
- Decision: Follow-up conversation history is client-side ephemeral only; no server-side session store, no persistence across page reloads.
- Status: confirmed
- Context: The PRD non-goal explicitly excludes saved sessions. Ephemeral client state is sufficient for the in-session follow-up use case and avoids any server-side session complexity.
- Impact:
  - `conversationHistory` is assembled in the frontend hook from in-memory state and discarded on page reload
  - no session IDs, no new backend endpoints, no storage layer
- Related requirements:
  - REQ-027
- Notes:
  - narrowly reopened for saved conversation history only by DEC-124; all other conversation state remains ephemeral per this decision

### DEC-040
- Decision: Game context is frozen after the first successful decrypt for the duration of the in-session conversation; follow-up turns are text-only in v1.
- Status: confirmed
- Context: Allowing zone or card edits mid-conversation would require re-deriving the full context for every history turn, adding complexity without a clear v1 use case. Freezing context keeps the history coherent and the implementation tractable.
- Impact:
  - `frozenGameContext` snapshot is taken on first decrypt success and used unchanged for all follow-up requests
  - enrichment zone/card editing is disabled while a conversation is active
  - `hiddenInitialQuestion` (including zone-aware fallback) is captured at first decrypt and included in `conversationHistory` on follow-up turns but not shown in the UI thread
  - In-Depth Question start over clears the thread and returns the user to the beginning of the flow (game context step): staged game context, selected zones, zone cards, question text, and turn-phase/combat-step staging are all cleared; player roster (player count, display names, life totals, poison/energy/experience, commander damage, custom counters) is preserved so a game staged in or seeded from Player Life Tracker is not wiped
  - start over button is visible whenever the first decrypt has succeeded and no request is in flight
- Related requirements:
  - REQ-025
  - REQ-029
- Notes:

### DEC-041
- Decision: Follow-up submit UX is inline within the chat composer; `AskAiWaitingPanel` is not shown for follow-up turns.
- Status: confirmed
- Context: The full waiting panel is appropriate for the initial decrypt which can take several seconds under a cold start. Follow-up turns share frozen context and shorter prompts; replacing the entire form for each follow-up would break the chat flow. An inline button animation is sufficient feedback.
- Impact:
  - Send button replaces its content with a processing animation (e.g. spinner or animated dots) while a follow-up request is in flight
  - `AskAiWaitingPanel` continues to render for the initial decrypt only (REQ-023 unchanged)
  - Send button is disabled and shows the animation until the response is received or an error occurs
- Related requirements:
  - REQ-023
  - REQ-028
- Notes:

### DEC-118
- Decision: In-Depth Question and Quick Question share one chat-first conversation workspace after the first answer. The scrollable message log is the dominant surface; follow-up composer, retry/error feedback, and Start Over occupy stable workspace rows; and the composer is docked within the workspace rather than fixed to the viewport. Frozen flow-specific context moves behind a compact trigger: an accessible bottom sheet below `768px` and an accessible right-side drawer at `768px+`. In-Depth Question always exposes frozen game context; Quick Question exposes an attached frozen card and omits the trigger when no card was submitted. Appended messages auto-scroll only when the reader is within 64px of the bottom; otherwise reading position is preserved and a New response control scrolls to and places keyboard focus on the newest assistant message. Focused first-answer/message/drawer/control transitions reuse existing CSS motion tokens and honor reduced motion.
- Status: confirmed
- Context: The two shipped answer flows already reuse `ConversationThread` and `FollowUpComposer`, but each assembles its own surrounding answered-state layout. The result is a narrow bubble list with duplicated chrome, inline context consuming the top of the chat, no reader-safe auto-scroll policy, and desktop space used little differently from mobile. The product owner chose a chat-first context-drawer direction over a permanent desktop context rail and over keeping one stacked column at every width. Conversation semantics and contracts are already sound and are intentionally frozen; this decision changes presentation and interaction only.
- Impact:
  - one shared workspace owns thread, composer, error/retry placement, Start Over placement, context trigger, adaptive context container, and new-response affordance; both flows consume it rather than maintaining separate answered-state assemblies
  - preserves existing destination/header chrome, hidden initial user question, first visible assistant answer, frozen-context rules, follow-up text limits, retry cooldown, Start Over data preservation, and request/history contracts
  - context remains read-only; the bottom sheet/right drawer closes by explicit control and Escape, contains keyboard focus while open, and returns focus to its trigger
  - the In-Depth trigger provides a terse cue (phase and populated-zone count); its drawer reuses the existing full frozen-context formatting; Quick Question uses the attached card name and existing card presentation, and renders no empty context trigger without a card
  - the thread is an accessible polite live log that announces additions without re-announcing the full history
  - remaining scroll distance `<= 64px` counts as near-bottom; appended messages then move to the latest message (immediate under reduced motion); farther-up readers keep their position and receive a New response control until they activate it or otherwise return to the bottom; activation scrolls to and places keyboard focus on the newest assistant message, dismisses the control, and preserves any composer draft
  - first-answer handoff, newly appended messages, drawer/sheet open-close, and New response appearance use existing transform/opacity CSS motion tokens; existing bubbles do not replay entrance motion on unrelated renders
  - DEC-031 waiting-panel behavior and DEC-041 inline Send spinner are preserved; no new palette/Menu signature animation or broad app-wide motion audit is introduced
  - presentation only — no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, response shapes, conversation-history assembly/limits, retry timing, backend routes, or scanning behavior
- Related requirements:
  - REQ-025
  - REQ-026
  - REQ-028
  - REQ-075
  - REQ-097
  - REQ-098
  - DEC-040
  - DEC-041
  - DEC-079
  - DEC-117
  - NFR-006
- Notes:
  - approved layout: chat-first with adaptive overlay context, chosen over a permanent desktop context rail and a centered stacked column
  - non-goals: visible initial-question bubble, context mutation, viewport-fixed composer, new conversation limits, persistence, backend changes, animation library, palette pulse, or scanner re-animation
  - persistence is narrowly reopened, for conversation history only, by DEC-124

### DEC-123
- Decision: The shared conversation thread renders assistant answers as structured markdown — headings, lists, emphasis, inline code, tables, code blocks, and links — instead of plain text, using client-side rendering only. No schema-enforced answer shape is introduced. This applies generically to `ConversationThread`/`ConversationWorkspace`, so any current or future consumer of the shared workspace (In-Depth Question, Quick Question, and any later chat feature) inherits it without per-flow duplication.
- Status: confirmed
- Context: Assistant answers already come back containing markdown (headings, lists, emphasis) from the model, but the thread renders them as unformatted plain text, so structured explanations are harder to scan than intended. `technical-design-rules.md`'s "preserve plain-text core product response output" constraint predates this decision and is narrowed by it to mean the wire contract (`{ answer }` stays a plain string) rather than the rendered presentation.
- Impact:
  - a client-side markdown renderer (e.g. `react-markdown` + a GFM plugin for tables) parses and renders `answer` text and follow-up assistant messages inside `ConversationThread` bubbles; user messages remain plain text
  - rendered output is sanitized against script/style injection; raw HTML in model output is not executed
  - no change to `AskAiRequest`/`AskAiResponse` shapes, Zod schemas, prompt assembly, or provider behavior — the model still returns a plain markdown string; only the frontend's rendering of that string changes
  - existing plain-text answers (no markdown syntax) render unchanged
  - narrows `technical-design-rules.md`'s "preserve plain-text core product response output" constraint to the API/contract layer only
- Related requirements:
  - REQ-102
  - DEC-118
- Notes:
  - non-goals: schema-enforced/structured answer shapes, prompt changes to request markdown, syntax highlighting themes beyond default code-block styling

### DEC-124
- Decision: Conversation history becomes persistent and resumable, browser-local and single-device only, following the `DEC-103` (Player Life Tracker) persistence precedent. Any conversation that reaches at least one successful answer auto-saves to a local history list; a left history drawer (part of the shared conversation workspace) lists saved conversations most-recent-first, each labeled by originating flow and timestamp with the first question as a preview snippet. Selecting a saved conversation restores its frozen context (game context or attached card), its mode, and its full message thread, and re-enables follow-up asking against that restored state. The list is capped at the 20 most recent conversations; saving a 21st prunes the oldest. This narrowly diverges from `DEC-039`'s ephemeral-only conversation history and `DEC-111`'s "each destination's in-session state...resets fresh on every reload" for saved conversation history only — no other suite state gains persistence by this decision.
- Status: confirmed
- Context: The shared conversation workspace (DEC-118) made every flow's chat presentation consistent, but conversations are still lost the moment the user starts a new one or reloads — there is no way to revisit or continue a past exchange. `DEC-103` already established a browser-local, single-device persistence pattern for exactly this kind of narrow, feature-scoped divergence from the suite's default ephemeral/no-persistence convention.
- Impact:
  - a history entry stores: flow/mode, frozen context snapshot (`GameContext` or attached card, matching DEC-040/REQ-075's existing frozen-context shapes), the full message thread, and a created/updated timestamp
  - entries are written to a browser-local storage key on auto-save (first successful answer) and updated on each subsequent follow-up in that conversation; reads are guarded try/catch with corrupt/invalid entries dropped, mirroring the `DEC-111`/theme-preference fallback pattern
  - the history drawer opens from the shared conversation workspace, lists entries most-recent-first, and supports selecting an entry to resume it
  - resuming an entry loads its frozen context, mode, and thread into the active workspace exactly as if that conversation were still in progress; follow-up requests behave identically to a freshly-decrypted conversation (same limits, same frozen-context rules)
  - starting a new conversation (existing Start Over control, DEC-040/REQ-029) is unaffected in its own behavior; if the conversation being left has at least one successful answer, it is auto-saved to history first
  - list is capped at 20 entries; the oldest entry is pruned automatically when a 21st is saved
  - no server-side store, no account system, no cross-device sync; storage is scoped to one browser on one device
  - no change to `AskAiRequest`/`AskAiResponse` shapes, Zod schemas, prompt assembly, providers, or backend routes
- Related requirements:
  - REQ-103
  - REQ-104
  - DEC-118
  - DEC-103
  - DEC-040
- Notes:
  - diverges from DEC-039/DEC-111 for saved conversation history only; all other suite state remains in-session/ephemeral
  - non-goals: cross-device sync, account/auth, server-side storage, editing restored frozen context, unbounded history retention
  - narrow-viewport presentation, trigger placement, and the DEC-122 collision are resolved by DEC-125

### DEC-125
- Decision: DEC-124's left history drawer gets its own trigger — a full-width button inside the conversation workspace body (the same implementation pattern as `AdaptiveContextDialog`'s trigger, DEC-118), positioned above the context trigger — rather than sharing DEC-122's top-left corner-rail Menu trigger or its drawer. The history drawer presents as an accessible bottom sheet below `768px` and a left-side drawer at `768px`+, mirroring DEC-118's context sheet/drawer breakpoint and affordance types exactly, just mirrored to the left instead of the right. Because both the history drawer and DEC-122's Menu drawer slide in from the left edge at `768px`+, they are mutually exclusive: opening either one closes the other first, so the left edge never shows two overlapping slide-in panels.
- Status: confirmed
- Context: quality-check flagged that DEC-124 confirmed a "left history drawer" with no narrow-viewport presentation spec, unlike DEC-118 which resolved the identical question for the context drawer. Meanwhile DEC-122 (in-flight, `center-menu-tab-prominence`) independently claims the top-left corner rail and a left-edge sliding drawer for the suite's global Menu, on every destination screen including the conversation workspace. Left unresolved, implementers would have had to invent either the mobile presentation or the trigger/collision resolution mid-slice.
- Impact:
  - the history drawer trigger renders as a full-width button in the conversation workspace body (`ConversationWorkspace`), stacked above `AdaptiveContextDialog`'s trigger, not inside `EnrichmentStep`'s header row and not registered through the feature-portal `PortalSlot`/destination registry (DEC-095/DEC-109/DEC-122 unaffected)
  - the history drawer overlay reuses the `AdaptiveContextDialog` bottom-sheet/drawer pattern: `align-items: flex-end` bottom sheet below `768px`, left-edge drawer (`justify-content: flex-start`) at `768px`+, same focus-trap/restore, Escape-to-close, and reduced-motion behavior as DEC-118 established
  - opening the history drawer while DEC-122's Menu drawer is open closes the Menu drawer first, and opening the Menu drawer while the history drawer is open closes the history drawer first; each drawer's own open/close/focus-restore behavior is otherwise unchanged
  - no change to DEC-122's corner rail, drawer transform, or destination registry; no change to DEC-118's context sheet/drawer
- Related requirements:
  - REQ-103
  - DEC-124
  - DEC-118
  - DEC-122
- Notes:
  - refines DEC-124's presentation only; retention cap, resume semantics, persistence model, and auto-save behavior are unchanged
  - non-goals: merging history into the Menu drawer, a shared drawer primitive/component extraction (left as a future code-health item), any change to DEC-122's corner rail
  - trigger placement is superseded by DEC-126; drawer open/close mechanics, breakpoint presentation, and mutual exclusivity with the Menu drawer are unchanged and stay resolvable here

### DEC-126
- Decision: DEC-125's history-drawer trigger placement is superseded: instead of a full-width button inside the conversation workspace body, the trigger becomes a small icon-only control integrated into the same top-left corner rail as the feature-portal Menu trigger (DEC-109/DEC-122). The rail's single ambient radial-glow hit-area grows taller and splits into two equal-weight hit-zones separated by a subtle divider — Menu on top, History below — both icons rendered at the same neutral color/weight and the same icon style (matching stroke-based glyphs) so they read as sibling controls in one integrated rail, not a primary control with something appended. The rail's height is fluid (CSS `clamp()`, scaling between a minimum that satisfies NFR-001's 44px-per-zone touch-target floor and a modest maximum) rather than a fixed rem value or a discrete mobile/desktop breakpoint switch, consistent with DEC-117's "fluid CSS, structural breakpoints only where layout cannot interpolate" precedent — today's rail has no responsive sizing rule at all (identical fixed size at every viewport), so a two-icon rail needs one and this decision supplies it. The History zone renders only on the two destinations that have history to show (In-Depth Question, Quick Question); Life Tracker and Trade Balancer keep the single-zone Menu-only rail.
- Status: confirmed
- Context: Live review of the shipped `DEC-125` trigger against the product owner's stated goal (mirroring Claude/ChatGPT/Cursor's chat UI) found it read as a disconnected, boxy element competing with the thread for vertical space, not an integrated part of the app's navigation chrome. Iterative static HTML mockups during refinement walked three integration options — shared glow with split hit-zones, two independent compact icon buttons, and History docked outside the glow entirely — before the product owner confirmed the shared-glow/split-zone direction, then flagged two follow-on issues live against the mock: mismatched icon rendering (a stretched text glyph next to a thin-stroke SVG) reading as visually inconsistent, and no existing decision governing how a taller two-icon rail behaves at narrow viewports (confirmed by inspection: the shipped single-icon rail had zero responsive sizing rules).
- Impact:
  - `ConversationWorkspace.tsx`'s full-width `.conversation-history-trigger` button is removed; a new icon-only history trigger renders in the same header area as the Menu's `PortalSlot` (moving ownership from the workspace body up to each conversation-bearing destination's own header row), present only when a `historyTrigger` is supplied
  - the rail's ambient glow region (DEC-122) grows from housing one hit-zone to two, divided by a subtle 1px separator; each zone is independently clickable/tappable and meets NFR-001's 44×44px minimum at every viewport via the `clamp()` floor
  - both icons render as the same stroke-weight glyph style (no mixing a text character with an SVG); Menu keeps its existing accessible name ("Switch feature") and History gets its own ("Conversation history")
  - saved-conversation entries in the history drawer render as plain, unboxed grouped rows with a quiet active/hover highlight rather than a bordered card per entry
  - opening either control's drawer still closes the other via the existing `LeftEdgeDrawerContext` (DEC-125, unchanged)
  - no change to DEC-122's corner rail on destinations without history (Life Tracker, Trade Balancer render the original single-zone rail)
- Related requirements:
  - REQ-103
  - DEC-125
  - DEC-122
  - DEC-109
  - DEC-117
  - NFR-001
- Notes:
  - supersedes only DEC-125's trigger-placement clause; DEC-125's drawer open/close mechanics, breakpoint presentation (bottom sheet/left drawer), and mutual exclusivity remain unchanged and authoritative
  - non-goals: any change to DEC-122's corner-rail visual language (radial glow, no border) beyond growing its hit-area height; a shared icon-button component extraction (left as a future code-health item)

### DEC-127
- Decision: Within the conversation workspace only (not the outer app shell, header chrome, MOCK-mode banner, or any other destination), the message thread stops being a secondary bordered panel capped at a small fixed height (`max-h-96`) with internal scrolling nested inside the workspace's own bordered card. It instead fills the available vertical space, with the follow-up composer docked at the bottom of that space as a rounded pill control. Assistant and user turns get stronger visual contrast against the surrounding surface and against each other (assistant messages as plain flowing text with no bubble container; user messages as a solid accent-colored right-aligned bubble) so each turn reads as clearly distinct at a glance, closer to the Claude/ChatGPT/Cursor reference the original idea named.
- Status: confirmed
- Context: Live review of the shipped conversation workspace against the product owner's "mirror Claude's chat UI" goal found the thread read as a form field, not a chat surface — a small internally-scrolling box nested inside a visually near-identical outer card, with assistant/user bubble backgrounds too close in tone to the surrounding panel to read as separate turns.
- Impact:
  - `ConversationThread.tsx`'s fixed `max-h-96` container is replaced with a layout that fills the workspace's available height; the follow-up composer moves from a bordered rectangular field to a docked rounded-pill control at the bottom of that space
  - assistant message bubbles (`bg-zinc-800/80`) and user message bubbles (currently `bg-accent-strong/30`) get revisited for stronger contrast against both the surface behind them and each other
  - none of DEC-118's scroll/auto-scroll near-bottom threshold, New response control, reader-safe scroll preservation, or composer-docked-not-viewport-fixed rules change — this decision layers presentation/framing only on top of DEC-118's existing behavior
  - scoped strictly to the shared conversation workspace (`ConversationWorkspace.tsx`/`ConversationThread.tsx`); the outer app shell (`.page-card`), header, MOCK-mode banner, and every other destination (Life Tracker, Trade Balancer) are unaffected, consistent with this package's non-goal against redesigning unrelated suite chrome
- Related requirements:
  - REQ-105
  - DEC-118
  - REQ-097
  - REQ-098
- Notes:
  - non-goals: any change to the outer app-shell card/header treatment, MOCK-mode banner, or non-conversation destinations; markdown rendering (DEC-123) and adaptive context trigger (DEC-118) behavior are unchanged, not reopened by this decision
