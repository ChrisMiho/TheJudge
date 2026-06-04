# Slice 06 — UI enrichment and submit

status: complete

**Prerequisites:** [slice-05-ui-zone-collection.md](./slice-05-ui-zone-collection.md)  
**Next slice:** [slice-07-promote-and-closeout.md](./slice-07-promote-and-closeout.md)

## Goal

Single **enrichment** pass, wire **Decrypt Stack** to new payload, remove legacy 4-step flow.

## Scope

### Enrichment

- Build queue via `buildEnrichmentQueue(gameContext)` — one list, all zones
- If **zero cards** total: skip enrichment UI or show question-only panel → submit allowed
- Per card: caster (where relevant), `ContextTarget` picker (player / any zone card / none / other), notes, mana spent (stack zone)
- Target picker uses **context index** from all players + all zone cards

### Submit

- Question field (300 char); blank → fallback **Resolve the stack** (existing behavior) unless zero-card flow needs different copy — document choice in PR
- **Decrypt Stack** calls `POST /api/ask-ai` with `{ question, gameContext }`
- Error/retry behavior unchanged (**DEC-014**, **DEC-016**)
- Remove old `battlefield-context` / `stack-assembly` / `context-enrichment` flow paths from `App.tsx`

### Cleanup

- Delete dead props from old `StackBuilderStep` call sites where possible
- Update `App.test.tsx` / story tests for new flow

## Tasks

- [ ] `EnrichmentStep` component
- [ ] `ContextTarget` UI + serialization
- [ ] Submit orchestration update (`useAskAiSubmitOrchestration`)
- [ ] Remove legacy flow steps
- [ ] End-to-end frontend tests

## Validation gate

```bash
npm run quality:check
npm --workspace apps/backend run test:eval
npm run dev
npm run dev:openai   # optional smoke with real provider
```

Manual E2E:

- [ ] Full flow: game setup → zones → add stack card → enrich → decrypt (mock shows prompt-shaped answer)
- [ ] Zero-card flow: timing/layer question with only turn phase + empty zones → submit succeeds
- [ ] Retry preserves state on failure

## Done when

- Old 4-step UX fully replaced
- All quality gates green
- Mock and OpenAI paths accept new contract

## Out of scope

- PRD promotion (slice 07)
- Duplicate-card unblock, stack reorder
