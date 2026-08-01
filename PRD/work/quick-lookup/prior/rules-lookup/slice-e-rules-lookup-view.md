# Slice E — Rules Lookup entry, browse fallback, and conversation (ship)

## Status: planned

## Goal

Ship the **Rules Lookup** frontend view: registered as a feature-portal destination,
with a core-topics browse empty state, a freeform rules-question field, `{ mode: "rules" }`
submit, and the shipped conversation chrome with **no frozen context** — under the main
flow's conversation limits (REQ-076, REQ-080, FLOW-012).

## Requirements

1. Rules Lookup registers as a feature-portal destination (DEC-095) and opens as a
   frontend-only view switch with no reload; it ships **no** navigation of its own.
2. The empty state (no question yet) shows a short browsable list of core rules topics
   fetched from `/data/gameRulesCoreTopics.json` (Slice D); reading a topic is fully
   client-side with no backend call; an **"ask about this"** control pre-fills a
   question into the primary path (it does not call the model).
3. The primary control is a freeform question field accepting up to the main flow's cap
   (REQ-011, 300 chars) with the same guardrails; submit is **blocked** when the
   trimmed question is empty (rules mode has no fallback question); there are no zones,
   stack, phase, card, or multi-card controls.
4. Submitting sends `{ mode: "rules", question }` to `POST /api/ask-ai`; follow-ups
   send `{ mode: "rules", question, conversationHistory }` under the shared
   conversation/text limits (REQ-027). There is **no frozen context object**.
5. On first success, reuse the conversation thread, follow-up composer, inline
   Send-button processing, and start over (REQ-025–029). First visible bubble is the
   assistant answer; the initial question is in `conversationHistory` but not shown as
   a bubble. Start over clears the thread and returns to the empty state (core-topics
   visible). AI/follow-up failure reuses the main flow's handling (**Miho is working on
   it**, retry with cooldown, preserved question + history).
6. Mock-provider follow-ups append to the same thread exactly as live responses.

## Acceptance criteria

- [ ] Rules Lookup appears in the portal dropdown and opens as a view switch with no
      reload; selecting it does not reset other modes' state.
- [ ] The empty state lists core topics (title + excerpt) read fully client-side;
      "ask about this" pre-fills the question field without calling the model.
- [ ] Submit is blocked with an empty/whitespace question; a valid question sends
      `{ mode: "rules", question }` (no `gameContext`, no `card`).
- [ ] First answer renders assistant-first in the reused `ConversationThread`; the
      initial question is not a visible bubble; the sent `conversationHistory` includes it.
- [ ] A follow-up appends a user then assistant bubble and sends
      `{ mode: "rules", question, conversationHistory }`; the Send button shows inline
      processing and is disabled in flight; the full waiting panel is not shown for
      follow-ups.
- [ ] Start over clears the thread and restores the empty state with the core-topics
      list visible; no history persists.
- [ ] With `ASK_AI_PROVIDER=mock`, the assistant bubble shows the assembled rules-mode
      prompt and the thread stays visible exactly as for live responses.
- [ ] No zone/stack/phase/card/frozen-context controls appear in Rules Lookup.
- [ ] `npm --workspace apps/frontend run test`, `typecheck`, and `npm run quality:check`
      green.

## Verification

```bash
npm --workspace apps/frontend run test -- RulesLookup
npm --workspace apps/frontend run test          # portal + conversation regressions stay green
npm --workspace apps/frontend run typecheck
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/destinationRegistry.tsx` — append a `rules-lookup`
  destination `{ id, label: "Rules Lookup", render: () => <RulesLookupApp /> }`
- `apps/frontend/src/components/RulesLookupApp.tsx` (new) + test — the view: core-topics
  browse empty state, question field, conversation
- `apps/frontend/src/components/RulesTopicBrowse.tsx` (new) + test — the local
  core-topics list (fetch `/data/gameRulesCoreTopics.json`, render, "ask about this")
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` — extend to a
  no-frozen-context rules mode (activation keys on has-answered + stored initial
  question, not `frozenGameContext !== null`); game/card modes unchanged
- `apps/frontend/src/lib/contextFlow/flow.ts` — `buildRulesAskAiRequest(question,
  conversationHistory?)` → `{ mode: "rules", question, conversationHistory? }`
- `apps/frontend/src/types.ts` — `RulesAskAiPayload` + core-topic types mirroring Slices A/D

## Notes

- **External prereqs:** feature-portal (DEC-095, **shipped** — append one registry
  entry) and card-lookup-qa's conversation reuse (DEC-097). Prefer **extending**
  card-lookup-qa's generalized `useAskAiSubmitOrchestration` / payload builder; if that
  has not merged, this slice performs the frozen-context → optional/nullable
  generalization itself rather than forking the hook.
- Depends on **Slice A** (payload shape) and **Slice D** (browse artifact); a full
  mock-provider E2E of the answer + appended second-pass rules also needs **Slices B/C**.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified (commands above run and green)
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged beyond the Slice A `mode: "rules"` amendment; success
      `{ answer }` / error shapes unchanged for both providers
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/rules-lookup/` ready to delete

## PRD promotion checklist (executed by `thejudge-cleanup`)

- [ ] DEC-098 in `PRD/sections/decisions/providers-and-contract.md`, DEC-099 in
      `PRD/sections/decisions/lookup-suite.md`, and DEC-100 in
      `PRD/sections/decisions/rules-retrieval.md` (with their router index lines in
      `PRD/sections/decisions.md`) reflect shipped reality; no edits to `Status:` for
      the shipped/planned signal (doc-lifecycle system-map gate)
- [ ] `PRD/sections/system-map.md` Rules Lookup entry flipped to `shipped` (product
      code wired + receipt written)
- [ ] REQ-076/077/078/079/080 and FLOW-012 remain accurate to what shipped; the deferred
      two-call regenerate stays noted in DEC-100
- [ ] Cleanup receipt written at `PRD/instructions/receipts/rules-lookup-<YYYY-MM-DD>.md`;
      `PRD/work/rules-lookup/` deleted
