# Lookup suite decisions

Lightweight Ask AI lookup entries that reuse existing search, scan, and conversation UI without user-staged game state. Card Lookup (DEC-097) and Rules Lookup (DEC-099) were refined as two separate destinations before either shipped; quick-lookup refinement reconciled them into one Quick Lookup destination (DEC-107/DEC-108).

### DEC-097
- Decision: Card Lookup is a lightweight Ask AI entry that reuses existing components end to end. It registers as a **feature-portal** destination (the portal owns navigation per DEC-095; Card Lookup ships no menu of its own). Its single-card input reuses **both** the existing typed card search and the existing camera scanner, each resolving to one oracle-level card. Its Q&A surface reuses the shipped conversation chrome (thread, follow-up composer, inline processing animation, start over) with the **single looked-up card frozen** as the conversation context, under the **same** message-count and text-length limits as the main MTG Assistant flow. The backend runs the **same per-card enrichment** the main flow already applies — WotC rulings (DEC-029), full card metadata including oracle text (DEC-042 / REQ-030), and card/question-driven supplemental rules (System 3, DEC-046) — via the same helper functions, and omits the game-state-only prompt sections (zone sections, `PHASE GUIDANCE`, System 2 game-state topic gating per DEC-045, and the merged zone scope sentence) because card mode carries no game state.
- Status: superseded
- Context: Players often need rules help on a single card without building full game state. The value is highest reuse: the client already has card search, the scanner, and a full conversation UI, and the backend already enriches each submitted card. Card Lookup repackages those into a `mode: "card"` (DEC-095) entry rather than new subsystems, so the only genuinely new work is the entry surface, the card-mode request/prompt skeleton, and portal registration.
- Impact:
  - Card Lookup appears as a destination in the feature-portal registry (owned by `feature-portal`, DEC-095); selecting it opens the lookup entry as a frontend-only view switch, no reload
  - single-card input: typed autocomplete search (REQ-001/REQ-002 behavior) and the camera scanner (FLOW-006 engine, DEC-050/DEC-053) both resolve to one `CardMetadataItem`; the resolved card's oracle text and metadata are shown before the user asks
  - no zones, no stack, no phase, no multi-card setup, and no per-card enrichment editing UI; the looked-up card is the whole context
  - Q&A reuses REQ-025 / REQ-026 / REQ-027 / REQ-028 / REQ-029 chrome; the "frozen context" is the single card (not a `GameContext`), and the initial user question is included in `conversationHistory` but not shown as a visible bubble, exactly as the main flow does
  - conversation limits (message count via `conversationHistory` validation, per-message and question character caps) are shared with the main flow; Card Lookup does not define its own limit policy
  - backend card-mode prompt assembly (REQ-074) reuses the existing rulings, metadata, and System-3 helpers and skips game-state-only sections; success `{ answer }` and error contracts are unchanged
  - no new product-facing endpoint, no `GameContext` change, no printing-level identity in the prompt or rulings lookup
- Related requirements:
  - REQ-073
  - REQ-074
  - REQ-075
  - REQ-072
- Notes:
  - depends on `feature-portal` (DEC-095) for entry chrome and on DEC-096 for the `mode` contract; prefer landing the mode contract with or before this UI
  - `rules-lookup` (`mode: "rules"`) reuses this feature's conversation chrome and extends this domain file later
  - a future option to accept optional lightweight game context in card mode is tracked as Q-003 and is out of v1 scope
  - superseded by DEC-107: quick-lookup refinement unifies Card Lookup and Rules Lookup into one Quick Lookup destination before either shipped

### DEC-099
- Decision: Rules Lookup is a lightweight Ask AI entry for general rules questions that carries **no** user-staged game state and no card. It registers as a **feature-portal** destination (the portal owns navigation per DEC-095; Rules Lookup ships no menu of its own) and reuses the shipped conversation chrome (thread, follow-up composer, inline processing animation, start over) that Card Lookup (DEC-097) already repackages, under the **same** message-count and text-length limits as the main MTG Assistant flow. Its primary path is **AI-mediated**: the player types a rules question, the backend runs rules-mode enrichment and answer composition (DEC-100), and the answer surfaces the relevant **verbatim** Comprehensive Rules excerpts plus an explanation. As a zero-cost secondary path, the empty state offers a **small committed local copy** of the core rules topics (a frontend-bundled subset of the same curated `gameRulesByTopic` excerpts the prompt uses — one source of truth, no hand-authored second copy) that the player can read locally with no AI call, and "ask about this" seeds a question into the primary path.
- Status: superseded
- Context: Players often need to understand a rules concept (priority, the stack, layers) without building game state and without tying the question to a card. Manual keyword lookup is hard to get right, so the primary path leans on the AI to interpret the question and surface the governing rules rather than making the player hunt. The value is reuse: the client already has the full conversation UI and the backend already retrieves curated + supplemental rules, so the only genuinely new work is the entry surface, the rules-mode request/prompt skeleton (DEC-098 / DEC-100), the answer-seeded second-pass retrieval (DEC-100), the small local core-topics browse artifact, and portal registration.
- Impact:
  - Rules Lookup appears as a destination in the feature-portal registry (owned by `feature-portal`, DEC-095); selecting it opens the lookup entry as a frontend-only view switch, no reload, no menu of its own
  - primary input is a freeform rules question (same character cap and guardrails as the main flow question, REQ-011) submitted as `{ mode: "rules", question, conversationHistory? }` (DEC-098) with no `gameContext` and no `card`
  - no zones, stack, phase, card, or multi-card setup; there is no game state to stage or edit
  - Q&A reuses REQ-025 / REQ-026 / REQ-027 / REQ-028 / REQ-029 chrome; there is **no frozen context object** (unlike Card Lookup's frozen card) — rules mode carries only the question and history; the initial user question is included in `conversationHistory` but not shown as a visible bubble, exactly as the other modes do
  - conversation limits (message count via `conversationHistory` validation, per-message and question character caps) are shared with the main flow; Rules Lookup defines no separate limit policy
  - empty state shows a small always-local list of **core rules topics** built from the same curated `gameRulesByTopic` manifest (a committed frontend subset, DEC-012 static-bundle pattern); reading a topic is fully client-side with no backend call, and "ask about this" pre-fills a question into the primary path
  - backend rules-mode prompt assembly and answer-seeded second-pass retrieval are specified by DEC-100 / REQ-077 / REQ-078; success `{ answer }` and error contracts are unchanged
  - no new product-facing endpoint, no `GameContext` change, no rules-engine / legality / board-state behavior (DEC-002 / DEC-013 guardrails preserved)
- Related requirements:
  - REQ-076
  - REQ-077
  - REQ-078
  - REQ-079
  - REQ-080
- Notes:
  - depends on `feature-portal` (DEC-095) for entry chrome, on DEC-098 for the `mode: "rules"` contract, and on DEC-100 for enrichment/answer composition
  - reuses Card Lookup's (DEC-097) conversation chrome; prefer landing the `mode` contract and Card Lookup's conversation reuse with or before this UI
  - the local core-topics list is a discoverability fallback, not a full Comprehensive Rules browser (explicit non-goal); topic curation is a build-time sign-off like DEC-030
  - superseded by DEC-107: quick-lookup refinement unifies Card Lookup and Rules Lookup into one Quick Lookup destination before either shipped

### DEC-107
- Decision: Quick Lookup is a single reuse-first Ask AI entry combining what card-lookup-qa and rules-lookup would have shipped as two destinations. It registers as **one** feature-portal destination (DEC-095) with no menu of its own. The user optionally resolves a single card (typed search or camera scan, both existing) before asking, or asks a freeform Magic question with no card. Its Q&A surface reuses the shipped conversation chrome (thread, follow-up composer, inline processing animation, start over) under the **same** message-count and text-length limits as the main MTG Assistant flow, with the attached card (if any) frozen as context. The backend runs **one** prompt-assembly path (DEC-106's `mode: "lookup"`) rather than forking enrichment by mode: question-driven rules retrieval — the static MTG reference block (DEC-025), always-on core game-rules topics (DEC-045 core set), and System 3 supplemental (DEC-046) scored on the question — always runs; when a card is attached, per-card enrichment layers in — WotC rulings (DEC-029) and full card metadata including oracle text (DEC-042 / REQ-030), with System 3 additionally scored against the card. Game-state-only sections (zone sections, `PHASE GUIDANCE`, DEC-045 game-state topic gating, the merged zone scope sentence) are always omitted, because this path never carries game state. Off-domain questions are guarded per DEC-108. The empty state (no card, no question yet) offers the small local core-topics browse fallback (REQ-079) already scoped for rules lookup. The answer-seeded second-pass retrieval DEC-100 specified for rules-mode is **not** carried into Quick Lookup v1 — deferred to a dedicated future feature (Q-004) so it can get its own tuning pass.
- Status: confirmed
- Context: card-lookup-qa and rules-lookup were refined and promoted separately (DEC-097 / DEC-099) before either shipped, each as its own destination and its own wire shape. Product framing has since converged on one short-ask path: the player either has a card in mind or doesn't, but the value proposition — skip staging full game state, get a fast answer in the shared conversation chrome — is identical either way. Two destinations and two forked backend enrichment paths for one user intent duplicates surface area for no product benefit and risks the two prompt-assembly implementations drifting apart; DEC-107 reconciles them into one destination, one wire mode, and one branching (not forked) enrichment path.
- Impact:
  - Quick Lookup is registered as a single destination in the feature-portal registry (DEC-095); selecting it opens the lookup entry as a frontend-only view switch, no reload
  - single-card input is optional: typed autocomplete search (REQ-001 / REQ-002 behavior) and the camera scanner (FLOW-006 engine, DEC-050 / DEC-053) both resolve to one `CardMetadataItem`; the user may instead skip card input and ask directly
  - no zones, no stack, no phase, no multi-card setup, no per-card enrichment-editing UI, and not a full Comprehensive Rules browser or judge authority (DEC-002 / DEC-013)
  - empty state (no card attached, no question submitted yet) shows the local core-topics browse fallback (REQ-079); attaching a card or typing a question both replace it
  - Q&A reuses REQ-025 / REQ-026 / REQ-027 / REQ-028 / REQ-029 chrome; frozen context is the attached card if one was resolved, otherwise none; the initial user question is included in `conversationHistory` but not shown as a visible bubble
  - conversation limits (message count, per-message and question character caps) are shared with the main flow; Quick Lookup defines no separate limit policy
  - backend prompt assembly reuses the same rulings / metadata / System-2 / System-3 helper functions the main flow and each other use — single authoritative definitions, no duplicated enrichment implementations
  - the answer-seeded second-pass retrieval is out of v1; the model still surfaces relevant verbatim rules from the first-pass provided set (DEC-100's verbatim-fidelity guard carries forward)
- Related requirements:
  - REQ-072
  - REQ-073
  - REQ-074
  - REQ-075
  - REQ-079
- Notes:
  - supersedes DEC-097 (Card Lookup) and DEC-099 (Rules Lookup); depends on `feature-portal` (DEC-095) and DEC-106 for the `mode: "lookup"` contract
  - supersedes DEC-100's enrichment shape for this feature; DEC-100's answer-seeded second-pass is deferred and tracked as Q-004, not dropped
  - a future option to accept optional lightweight game context when a card is attached is tracked as Q-003 and is out of v1 scope

### DEC-108
- Decision: Quick Lookup's prompt instructs the model to treat itself as searching the game's rules corpus, not as a general-purpose assistant. When a question — with or without an attached card — is off-domain / non-MTG, the model must respond in a **"confused rules lookup"** persona, as though it searched for the concept in the rules and found nothing, rather than a generic capability refusal. For example, asking for a cookie recipe should get a reply in the spirit of "I couldn't find any rules covering a mechanic called 'cookies' — did you mean a different card or rules term, or maybe misspell something?", and any other off-domain question gets an analogous "I'm not familiar with that / it isn't in the rules" response. This is enforced entirely through prompt instruction; no new backend detection, classification, or validation code is added.
- Status: confirmed
- Context: Quick Lookup's freeform question field with no game state and no card requirement makes it easy to ask it as a general chatbot, which both the IDEA's non-goals and existing framing (DEC-002 / DEC-013) forbid. A flat "I can only answer Magic questions" refusal is accurate but breaks the "rules lookup" framing the feature is built around; playing dumb in-character ("not found in the rules") keeps every response — on-domain or not — consistent with what the feature actually is: a rules search, not a chat assistant.
- Impact:
  - the lookup-mode system prompt includes an explicit instruction: treat unrecognized / off-domain terms as "not found in the rules corpus," ask the user to check spelling or rephrase toward a Magic term, and never answer the off-domain question directly
  - applies identically whether or not a card is attached; no separate off-domain handling for the card-attached branch
  - no backend-visible signal, log flag, or debug sidecar field is added for refusals (mock provider still exposes the full assembled prompt per existing DEC-017 / DEC-033 behavior, which is sufficient to inspect the instruction)
  - no rules-validation, legality, or classification logic is added under this guardrail; it is prompt copy only (DEC-002 / DEC-013 preserved)
- Related requirements:
  - REQ-074
- Notes:
  - copy/tone for the "confused" persona is a build-time content concern (system-prompt wording), not a product-behavior contract; future wording changes may tune it as long as the persona and no-direct-answer behavior hold

### DEC-112
- Decision: Quick Lookup's topics browse section (REQ-079) is renamed **"General rules topics"** (from "Browse core rules topics"), moves below the Question field in the pre-submit layout, and remains rendered regardless of whether a card is attached or the question field already has text — replacing REQ-079's original "shown whenever no card is attached and no question has been submitted yet" gate. The section is an outer disclosure that is collapsed by default: its "General rules topics" summary stays visible while its helper copy and topic list remain hidden until expanded. Inside the expanded outer disclosure, topic rows are also collapsed by default, each showing its title, a **"Use this topic"** button (renamed from "Ask about this"), and an expand/collapse toggle without needing to expand the row; expanding one topic's row reveals its rule numbers and excerpt and auto-collapses any other open topic (accordion, at most one excerpt visible at a time). Tapping "Use this topic" no longer pre-fills the freeform question textarea with editable text. Instead it locks that topic's phrase (`Tell me about {Topic}.`) into a **non-editable pill** shown inline next to the Question field's label, with its own explicit remove control; only one topic pill may be locked at a time, and picking a different topic swaps it. The textarea stays independently editable at all times as optional supplementary context — locking, swapping, or removing a pill never touches text the user separately typed there. Tapping "Use this topic" also smooth-scrolls the view to the Question field and focuses the textarea, since the topics section now sits below it. On submit, the pill phrase and any supplementary textarea text are composed client-side into the single `question` string sent to the backend; there is no `AskAiRequest` wire-contract change.
- Status: confirmed
- Context: quick-question-ui-refinement's first pass (moving the topics section below the question, keeping its outer summary rendered in every pre-submit state, and giving each row a visible action button with accordion disclosure inside the expanded body) left "ask about this" on its original REQ-079 behavior: pre-fill the shared question textarea with editable text the user could alter or delete before submitting. On review, that meant a topic pick was only a suggestion — a user could accidentally edit it away, and once the topics section moved below the question, there was no visible confirmation the tap had done anything, since the affected field was off-screen above. The product owner wants a topic choice to always reach the submitted question once picked, visibly and in its original wording, without blocking the user from adding their own context or silently hiding what got asked.
- Impact:
  - the outer topics disclosure is collapsed by default; its summary remains visible in every pre-submit state, and expanding it reveals the helper copy and nested topic-row accordions
  - "Browse core rules topics" → "General rules topics"; "Ask about this" → "Use this topic" (copy-only renames; row structure — title, button, expand/collapse toggle all visible without expanding a row — is unchanged from the prior outer-disclosure/accordion refinement)
  - the Question field gains an optional locked-pill state: a pill inline next to the "Question" label shows the exact phrase `Tell me about {Topic}.`; a remove control on the pill clears it back to the plain (no-pill) state; only one pill can be locked at a time and selecting a new topic swaps it
  - the textarea's placeholder text changes while a pill is locked, inviting optional supplementary detail or an as-is submit; its content is never overwritten by a pill being added, swapped, or removed
  - submit becomes valid whenever a pill is locked, a card is attached, or the textarea has non-empty trimmed text — not only on non-empty textarea content
  - "Use this topic" triggers a smooth scroll to the Question field plus textarea focus, so the action stays visibly connected to its effect despite the topics section sitting below the field it feeds
  - the composed `question` (pill phrase plus optional textarea text, space-joined, or the textarea alone when no pill is locked) is measured against the shared REQ-011 300-character cap as one string, with the visible counter reflecting the composed length
  - when no pill is locked and the textarea is empty but a card is attached — the submit-enabling case added by this decision — the composed `question` silently falls back to `Tell me about {Card Name}.`, never an empty string; this fallback is not shown to the user and follows the same silent-substitution pattern already used by the game-context flow's `resolveFallbackQuestion`
  - a locked topic pill and an attached card are independent inputs and may both be present at submit time; the collapsed outer general-topics summary remains rendered regardless of card state
- Related requirements:
  - REQ-079
  - REQ-091
- Notes:
  - refines DEC-107 and REQ-079; does not change DEC-106's `AskAiRequest` shape, `POST /api/ask-ai`, or any backend prompt-assembly contract
  - supersedes REQ-079's prior "ask about this pre-fills a freely editable textarea" acceptance criterion; REQ-079 is amended alongside this decision and a new REQ-091 captures the locked-pill mechanism in full

### DEC-113
- Decision: Quick Lookup's pre-submit guidance copy ("Add a card for context or ask any Magic related question.") moves from its own line between the header and the "Optional card" section into an inline suffix on the "Optional card" label, separated by an em dash, reading "OPTIONAL CARD — Add a card for context or ask any Magic related question."; the standalone paragraph is removed. The card-attach control's position in the pre-submit layout (top of the stack, per REQ-073) is unchanged.
- Status: confirmed
- Context: The guidance line sat as an orphaned paragraph between the header and the "Optional card" section it was actually describing, reading as disconnected from the field it explains. Folding it inline with the label it precedes ties the copy directly to the control it describes, in the same spirit as DEC-092's helper-copy tightening elsewhere in the app, without adding any new guidance text.
- Impact:
  - the standalone guidance paragraph directly under the `StagedStepHeader` is removed
  - the "Optional card" label renders as "OPTIONAL CARD — Add a card for context or ask any Magic related question." with the label portion keeping its existing uppercase/tracked styling and the guidance sentence in normal case/weight, matching its prior paragraph styling
  - copy text itself is unchanged verbatim; only its placement moves
  - no change to the card-attach control, search behavior, or scan entry point
- Related requirements:
  - REQ-073
- Notes:
  - amends REQ-073's guidance-copy-placement acceptance criterion only; REQ-073's layout order (card-attach control, then Question field, then General rules topics) is unchanged
  - narrow, presentation-only precedent alongside DEC-092; does not expand DEC-092's own scope (game-context players / zone-confirmation helpers)

### DEC-114
- Decision: Quick Lookup's initial submit (pre-first-answer) hides the Question form while a request is in flight, replacing it in place with the existing `AskAiWaitingPanel`, instead of leaving the form visible with the panel appended beneath it. The Optional card section and the "General rules topics" disclosure remain visible and interactive throughout the wait, unchanged.
- Status: confirmed
- Context: The in-depth flow's decrypt wait already replaces its submit form with `AskAiWaitingPanel` while keeping context above the form visible (DEC-031/REQ-023). Quick Lookup's initial submit had drifted from that pattern — the Question form stayed on screen with the waiting panel added underneath, reading as cluttered and inconsistent with the flow it's meant to mirror. This decision brings the same "form replaced by the waiting panel, context above stays visible" pattern to Quick Lookup's own submit form (the Question field/composer), scoped only to the pre-first-answer wait; the post-first-answer conversation experience (REQ-075) is unaffected.
- Impact:
  - while `isSubmitting` is true and no answer has yet arrived, the Question form (label, pill, textarea, character counter, submit button) is not rendered; `AskAiWaitingPanel` renders in its place
  - the Optional card section (search/attach control and any selected-card preview) stays visible and interactive during the wait, matching REQ-023's "context above the form remains visible" pattern
  - the "General rules topics" disclosure stays visible and interactive during the wait; expanding/collapsing topics or locking a topic pill mid-wait has no effect on the in-flight request
  - the Question form reappears (waiting panel removed) as soon as the request resolves, whether that resolution is an error (form and retry affordance return, matching REQ-023's "restored ... when a response is received or an error occurs") or a success (the component instead swaps into the existing post-answer conversation view, unchanged)
  - no change to `useAskAiSubmitOrchestration`, request payloads, prompt assembly, or the `isConversationActive` swap that already replaces the full pre-submit view once the first answer lands
- Related requirements:
  - REQ-092
  - REQ-023
  - REQ-075
- Notes:
  - purely a pre-submit-view rendering change in `QuickLookupApp.tsx`; reuses the existing `AskAiWaitingPanel` component and its timer/threshold behavior verbatim (REQ-023), no new waiting-panel variant
  - scoped to the initial submit only; follow-up turns already use the inline composer-button animation per DEC-041/REQ-028 and are unaffected
