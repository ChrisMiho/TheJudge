# Lookup suite decisions

Lightweight Ask AI lookup entries that reuse existing search, scan, and conversation UI without user-staged game state. Card Lookup lands first; Rules Lookup extends this file later.

### DEC-097
- Decision: Card Lookup is a lightweight Ask AI entry that reuses existing components end to end. It registers as a **feature-portal** destination (the portal owns navigation per DEC-095; Card Lookup ships no menu of its own). Its single-card input reuses **both** the existing typed card search and the existing camera scanner, each resolving to one oracle-level card. Its Q&A surface reuses the shipped conversation chrome (thread, follow-up composer, inline processing animation, start over) with the **single looked-up card frozen** as the conversation context, under the **same** message-count and text-length limits as the main MTG Assistant flow. The backend runs the **same per-card enrichment** the main flow already applies — WotC rulings (DEC-029), full card metadata including oracle text (DEC-042 / REQ-030), and card/question-driven supplemental rules (System 3, DEC-046) — via the same helper functions, and omits the game-state-only prompt sections (zone sections, `PHASE GUIDANCE`, System 2 game-state topic gating per DEC-045, and the merged zone scope sentence) because card mode carries no game state.
- Status: confirmed
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

### DEC-099
- Decision: Rules Lookup is a lightweight Ask AI entry for general rules questions that carries **no** user-staged game state and no card. It registers as a **feature-portal** destination (the portal owns navigation per DEC-095; Rules Lookup ships no menu of its own) and reuses the shipped conversation chrome (thread, follow-up composer, inline processing animation, start over) that Card Lookup (DEC-097) already repackages, under the **same** message-count and text-length limits as the main MTG Assistant flow. Its primary path is **AI-mediated**: the player types a rules question, the backend runs rules-mode enrichment and answer composition (DEC-100), and the answer surfaces the relevant **verbatim** Comprehensive Rules excerpts plus an explanation. As a zero-cost secondary path, the empty state offers a **small committed local copy** of the core rules topics (a frontend-bundled subset of the same curated `gameRulesByTopic` excerpts the prompt uses — one source of truth, no hand-authored second copy) that the player can read locally with no AI call, and "ask about this" seeds a question into the primary path.
- Status: confirmed
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
