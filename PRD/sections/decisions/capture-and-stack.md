# Capture and stack decisions

Stack entry UX, ordering, limits, and request-building fallback behavior.

### DEC-004
- Decision: Stack ordering is bottom-to-top in the array, with `stack[0]` as bottom and the last item as top.
- Status: confirmed
- Context: Ordering is critical for prompt correctness and user understanding.
- Impact:
  - frontend, backend, and prompt logic must remain consistent
- Related requirements:
  - REQ-006
- Notes:

### DEC-005
- Decision: The newest added card is appended to the end of the array and becomes the top of the stack.
- Status: confirmed
- Context: Users build the stack upward during entry.
- Impact:
  - add behavior is append-only
  - manual reorder is deferred
- Related requirements:
  - REQ-005
  - REQ-006
- Notes:

### DEC-006
- Decision: If `stack.length === 0`, the add button text is **Begin stackening!**; otherwise it is **Add to Stack**.
- Status: confirmed
- Context: The first add action should feel playful, while repeated actions should stay clear.
- Impact:
  - add control text is conditional on stack length
  - styling remains unchanged
- Related requirements:
  - REQ-004
- Notes:

### DEC-007
- Decision: Duplicate stack cards are blocked as an intentional constraint.
- Status: confirmed
- Context: This reduces complexity while validating the basic flow.
- Impact:
  - some real gameplay scenarios are excluded
  - duplicate blocking must be documented as temporary
- Related requirements:
  - REQ-009
- Notes:
  - this decision overrides gameplay realism for current scope control

### DEC-008
- Decision: The stack is capped at 10 cards in the core product.
- Status: confirmed
- Context: This limits prompt size and reduces abuse risk.
- Impact:
  - UI must block additional adds past 10
- Related requirements:
  - REQ-010
- Notes:

### DEC-009
- Decision: Blank questions fall back to **Resolve the stack** in request-building logic.
- Status: superseded
- Context: The question field is optional, but the backend should always receive a final question string.
- Impact:
  - fallback is not shown as injected UI text
- Related requirements:
  - REQ-011
- Notes:
  - superseded by DEC-028 for zone-aware blank-question fallback behavior

### DEC-015
- Decision: The empty-state search input should say **Type to begin** before the user types.
- Status: confirmed
- Context: The empty state needs a minimal directional cue without extra helper copy or buttons.
- Impact:
  - the input itself carries the starting guidance
- Related requirements:
  - REQ-001
- Notes:

### DEC-018
- Decision: Stack details should show thumbnails when available, but continue to work without them.
- Status: confirmed
- Context: Images are helpful but should not be required for the details UI.
- Impact:
  - thumbnail rendering is opportunistic, not mandatory
- Related requirements:
  - REQ-008
- Notes:

### DEC-028
- Decision: Blank-question fallback is zone-aware.
- Status: confirmed
- Context: Manual walkthrough on 2026-06-05 showed that default main-phase selected zones can include stack while users may only populate battlefield. The previous unconditional **Resolve the stack** fallback caused the prompt to ask for stack resolution even when no stack cards were submitted.
- Impact:
  - blank trimmed questions use **Resolve the stack** when `gameContext.zones.stack` has one or more cards
  - blank trimmed questions use **Explain the interaction with the provided game state** when stack has no cards and another zone has cards
  - submit remains allowed when stack is selected but empty as long as another selected zone has a card
  - skipped targets do not imply an empty stack; `targets: (none)` means no target was specified for that card
  - enrichment shows a pre-decrypt summary of populated zones and the fallback question when the user leaves the question blank
  - zone collection shows a non-blocking nudge when stack is selected but empty and another selected zone has cards
- Related requirements:
  - REQ-011
  - REQ-012
  - REQ-017
  - REQ-018
  - REQ-019
- Notes:
  - supersedes DEC-009 where it describes an unconditional stack fallback

### DEC-082
- Decision: Each `ZoneCardItem` carries a stable, frontend-only per-instance identity (`instanceId`) assigned once when the card is added, and all UI list keys, removal, and per-instance enrichment edits key on that `instanceId` instead of the oracle `cardId`. So when the same card is added more than once to a non-stack zone, each copy is an independent, individually removable and individually editable instance. `cardId` remains the oracle-level identity used for prompt/rulings/duplicate-stack behavior, and `instanceId` is stripped at the single request-serialization boundary so the backend payload contract is unchanged.
- Status: confirmed
- Context: Non-stack zones already permit duplicate cards (the duplicate block in `validateZoneCardAdd` is stack-only, DEC-007/FLOW-004/REQ-009), but every operation keys on `cardId` (the oracle id): `removeZoneCardById` (`zoneCards.ts`) and `removeCardFromZone` (`EnrichmentStep.tsx`) filter by `cardId`, so deleting one copy deletes every copy; `updateZoneCard` (`EnrichmentStep.tsx`) maps by `cardId`, so editing one copy's owner/targets/notes edits every copy; and React list keys use `cardId` (`ZoneCardPicker.tsx`, `ScanReviewBubble.tsx`, `EnrichmentStep.tsx`), so duplicate copies collide on key. The reported defect is that scanning (or manually adding) the same card twice produces two visible entries that share one identity, so removing one removes both. The fix is a per-instance identity, not a change to duplicate-add policy.
- Impact:
  - `ZoneCardItem` gains a required `instanceId: string`, generated once in the single add path `buildZoneCardFromMetadata` (used by both manual add and scan auto-add) via `crypto.randomUUID()` with a guarded fallback when `crypto.randomUUID` is unavailable; reuse the existing `debugLogger.ts` id pattern rather than adding a dependency
  - UI list keys (`ZoneCardPicker`, `ScanReviewBubble`, the `EnrichmentStep` card lists) key on `instanceId`; removal is by `instanceId` (a new `removeZoneCardByInstanceId` replacing/aliasing the `cardId` filter in `removeZoneCardById`, and the `EnrichmentStep` `removeCardFromZone` path); per-instance enrichment edit (`updateZoneCard`) matches on `instanceId` so editing one duplicate's owner/targets/notes does not affect its siblings
  - **contract guard:** `zoneCardItemSchema` is `.strict()`, so `instanceId` must never reach the wire. It is stripped from every zone card at the single serialization boundary `buildAskAiRequest` (`contextFlow/flow.ts`); `AskAiRequest`, the Zod request schema, `buildPromptContext`/`buildPromptText`, the provider boundary, and the product-facing endpoint stay byte-for-byte unchanged
  - the stack duplicate block (DEC-007/FLOW-004/REQ-009) is unchanged and still keyed on `cardId`, so duplicates remain confined to non-stack zones; `instanceId` does not enable duplicate stack cards
  - stack ordering (DEC-004/DEC-005) is unchanged: `instanceId` is identity, not order; append order is preserved
  - oracle-level identity is unchanged for prompt, rulings, scan oracle-bridge (DEC-053), and the duplicate-stack key — all stay keyed on `cardId`; `instanceId` is purely a frontend list/instance key
  - `ContextTarget` "card" references remain oracle-level (zone + `cardId` + `cardName`); making a target point at a specific duplicate instance is explicitly out of scope and recorded as a constraint, not solved here
- Related requirements:
  - REQ-061
  - REQ-009
- Notes:
  - this is a frontend identity fix; it does not change duplicate-add policy, scan capture/fingerprinting/matching, stack-order semantics, or the backend payload contract (the work's IDEA non-goals)
  - `instanceId` is non-semantic (a UI instance key only); it is not persisted to the backend, not shown to the user, and not part of prompt or rulings identity

