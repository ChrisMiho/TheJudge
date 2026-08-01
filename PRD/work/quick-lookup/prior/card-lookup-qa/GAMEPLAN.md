# GAMEPLAN: card-lookup-qa

Implementation architecture for **Card Lookup** — a lightweight Ask AI entry that looks up **one** card (typed search or camera scan), shows its oracle text, and runs a Q&A with the single card frozen as context. Reuse-first: the only genuinely new work is the `mode: "card"` request skeleton, a card-mode prompt branch, and a portal-registered lookup view. No new endpoint (DEC-010), no `GameContext` change, no printing-level identity in prompt/rulings (DEC-053).

Decisions: DEC-096 (`mode` discriminator on `POST /api/ask-ai`), DEC-097 (reuse map). Requirements: REQ-072/073/074/075. Flow: FLOW-011. Out of scope: Q-003 (optional lightweight game context on card mode).

## External prerequisite

**`feature-portal` (DEC-095) must land first.** Card Lookup ships no navigation of its own — it registers as a destination in `PORTAL_DESTINATIONS` (`src/components/portal/destinationRegistry.tsx`) by appending one entry, exactly the extension path the portal GAMEPLAN describes. Slice C consumes the portal's registry + state-preserving `DestinationOutlet`. If the portal has not shipped, Slice C is blocked; Slices A and B (backend) are not.

## What ships

- A `mode`-discriminated `AskAiRequest`: `mode: "game"` (default, unchanged) vs `mode: "card"` (`{ mode, question, card, conversationHistory? }`, no `gameContext`).
- A card-mode backend prompt branch that reuses rulings (DEC-029), full card metadata incl. oracle text (REQ-030), and System-3 supplemental rules (DEC-046), and omits every game-state-only section.
- A **Card Lookup** frontend view registered as a portal destination: single-card input via the existing typed search **and** the existing scanner, card presentation, question field, and the shipped conversation chrome with the single card frozen.

## Architecture

### Request contract (Slice A) — backend

Today `askAiRequestSchema` (`apps/backend/src/validation/askAiRequest.ts`) is a single `.strict()` object `{ question, gameContext, conversationHistory? }`. It becomes a `mode`-discriminated union:

- `game` branch: `{ mode: "game" (default), question, gameContext, conversationHistory? }` — today's rules (REQ-019) unchanged; `card` rejected.
- `card` branch: `{ mode: "card", question, card, conversationHistory? }` — no `gameContext` (rejected); `card` is a single oracle-level reference resolvable to a committed `CardMetadataItem`.

`mode` is optional-with-default `"game"` so existing clients validate unchanged. Because Zod `discriminatedUnion` needs a present discriminator, realize the default with a preprocess/normalization step that stamps `mode: "game"` when absent, then discriminate. `question` cap (300) and control-char guardrails are shared across branches; `conversationHistory` uses the existing `conversationHistorySchema` unchanged (DEC-038). The `card` reference shape reuses the fields the prompt needs from a `CardMetadataItem` (id, name, oracle text, full metadata) — a single-card analog of `zoneCardItemSchema` without stack/zone/enrichment fields. `AskAiRequest` (`apps/backend/src/types/index.ts`) is re-derived from the union.

### Card-mode prompt assembly (Slice B) — backend

`buildPromptContext` (`apps/backend/src/prompt/context.ts`) and `buildPromptText` (`apps/backend/src/prompt/promptAssembly.ts`) today assume `payload.gameContext`. Add a card-mode path that produces a `PromptContext` (or a card-mode analog) carrying the single card and the question, and gate the game-state-only sections in `buildPromptText`:

- **Include** for card mode: the card's full metadata + oracle text using the **same per-card formatting** as populated-zone cards (REQ-030 helper), its WotC rulings via the existing `collectCardsForRulings` / `resolveRulingsForPrompt` path (DEC-029), and System-3 supplemental rules via `retrieveSupplementalRules` scored against the single card + question (DEC-046). `CONVERSATION HISTORY` (REQ-027) and `QUESTION` keep existing placement.
- **Omit** for card mode: zone sections, `PHASE GUIDANCE` (REQ-024), System-2 game-state topic gating (DEC-045 — `selectGameRulesTopics` is game-state-driven), and the merged zone `SCOPE` sentence (DEC-025). Reuse the existing helpers; do not re-implement (single authoritative definitions).

`preparePromptInput` (`apps/backend/src/prompt/preparation.ts`) branches on mode: card mode skips `selectGameRulesTopics` (System-2) and the zone/phase/scope inputs but keeps rulings + System-3. Mock provider must expose the exact assembled card-mode prompt (DEC-017 / DEC-038); success `{ answer }` and error shapes unchanged (REQ-013, DEC-020).

### Card Lookup view + entry (Slice C) — frontend

New `CardLookupApp` (view) registered as a portal destination. Reuse, in order of preference, before creating:

- **Single-card input** — typed search suggestions reuse `useAutocompleteSuggestions` + `search.ts` (REQ-001/002 behavior); scan reuses `ScanCameraSurface` + `resolveScanCandidates` (FLOW-006 engine). Both resolve to one `CardMetadataItem`. The existing `ZoneCardPicker` already wires search+scan+`CardSelectionPreview` together for a zone — factor its search/scan/preview core so Card Lookup drives it in single-card mode (no zone/add semantics), rather than forking a second search+scan surface.
- **Card presentation** — `CardSelectionPreview` / `CardPresentation` show name, image, oracle text + full metadata before the user asks (REQ-073).
- **Conversation** — reuse `ConversationThread`, the follow-up composer, inline Send-button processing (REQ-028), and start over (REQ-029). The frozen "context" is the single card, not a `GameContext`: replace `FrozenContextSummary` (game-context-specific) with a card-frozen summary built from `CardSelectionPreview`.
- **Submit path** — `useAskAiSubmitOrchestration` currently freezes a `GameContext` and sends `ZoneAskAiPayload`. Generalize its frozen-context typing so card mode freezes the `card` reference and sends `{ mode: "card", question, card, conversationHistory }` (prefer generalizing the one hook over a parallel copy). Initial user question is included in `conversationHistory` but never shown as a bubble (REQ-075).

## Data flow

Card mode: FE resolves one `CardMetadataItem` → `{ mode: "card", question, card }` → `POST /api/ask-ai` → Zod card branch → card-mode `preparePromptInput` (rulings + full metadata + System-3, no zone/phase/scope) → provider → `{ answer }` → conversation thread. Follow-ups append `conversationHistory` (frozen card unchanged). Game mode is byte-for-byte unchanged.

## Reuse (before creating)

- Backend: `conversationHistorySchema`, `collectCardsForRulings` / `resolveRulingsForPrompt`, `retrieveSupplementalRules`, the per-card metadata formatter used for populated-zone cards (REQ-030), `getPromptDiagnostics`, mock-provider prompt exposure.
- Frontend: `ScanCameraSurface`, `resolveScanCandidates`, `useAutocompleteSuggestions` + `search.ts`, `CardSelectionPreview` / `CardPresentation`, `ConversationThread`, follow-up composer + inline Send animation, `useAskAiSubmitOrchestration`, the portal registry + `DestinationOutlet`.

## Sequencing

- **Slice A** (contract) — no dependency. Foundational.
- **Slice B** (card-mode prompt) — depends on A (needs the card-mode request shape).
- **Slice C** (frontend view + entry) — depends on A (payload shape) and on **feature-portal** (external, DEC-095). Parallel-ready with B once A lands; a full mock-provider E2E of C needs B, but C can be built and unit-tested against A's types before B merges.

Recommended order: A → then B and C in parallel; C is the ship/promotion slice.

## Verification checklist

- [ ] `npm --workspace apps/backend run test` green — card/game discriminator validation, cross-field rejection, default-`mode` back-compat, card-mode prompt sections present/omitted, mock card-mode prompt exposure
- [ ] `npm run test:eval` green — no game-mode golden drift; card-mode fixture asserts rulings + System-3 present and zone/phase/scope absent
- [ ] `npm --workspace apps/frontend run test` green — single-card search + scan resolve to one card, card presentation, card-mode payload shape, conversation reuse (assistant-first, hidden initial question, follow-up history, start over), portal destination registered
- [ ] `npm run quality:check` green for touched areas; `npm run lint` / `npm run format:check` clean
- [ ] Manual: from the portal, open Card Lookup, resolve a card by typing and by scanning, ask a question, receive an answer, send a follow-up, start over (card preserved) — with `ASK_AI_PROVIDER=mock` the assistant bubble shows the assembled card-mode prompt
- [ ] Contract stability: existing `{ question, gameContext }` requests validate and behave unchanged; success `{ answer }` / error shapes unchanged for both providers
