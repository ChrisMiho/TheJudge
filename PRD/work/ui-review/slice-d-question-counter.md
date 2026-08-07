# Slice D — Quick Question counter integrity

## Status: planned

### Handoff
- Done: nothing started for this slice. Slices A, B, and C are `done`, verified, and merged into `feature/routing`; D is the next dependency-ready slice (it depends on nothing).
- Next: run `$thejudge-implement PRD/work/ui-review/ slice D` — or `$thejudge-implement-all` to take D through H — from a fresh worktree off the then-current autonomous base. Note the base chain moved: A–C shipped to `main` via `feature/routing`, so re-read `## Autonomous metadata` below before branching.
- Stopped because: usage limit. The session was asked to stop after slice C and ship A–C rather than continue.

## Goal

Make Quick Question's counter and submit gate measure the raw editable textarea
without changing question composition.

## Requirements

1. Make the visible counter, textarea `maxLength`, and submit-length gate read the
   same raw `question` state. Do not use `composedQuestion.length` for any of them.
2. Preserve locked-topic composition, swapping/removal, whitespace trimming,
   silent card fallback, request shape, and the accepted possibility that a
   topic-prefixed composed string exceeds 300 characters.
3. Add regression tests for card-selected clearing, locked-topic empty/300-char
   states, submitted composition, and no stale reads after topic swap/removal.
4. Add explicit regression assertions that Enrichment and Follow-up counters
   continue to track their own raw bound values.

## Acceptance criteria

- [ ] Tests prove one visible character then full clear renders `0/300` with a selected card instead of jumping to the fallback phrase length
- [ ] Tests prove locked topic + empty textarea renders `0/300`; locking, swapping, and removing topics never changes the raw count
- [ ] Tests prove locked topic + 300 typed characters renders `300/300`, is not blocked by a composed-length gate, and submits the unchanged `pill phrase + space + trimmed text` composition
- [ ] Tests prove the silent `Tell me about {Card Name}.` fallback still submits when card is attached and raw text/topic are empty
- [ ] Enrichment and Follow-up regression tests assert their visible counters track raw editable text
- [ ] Live at 390×844: reproduce the four cases above by typing/backspacing; record visible counts, enabled/disabled state, and the submitted mock request composition
- [ ] Live at 1440×900: repeat locked-topic empty and 300-character cases; no counter/gate divergence appears
- [ ] `npm run quality:check` is green
- [ ] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/` (or `none` recorded when no capture is needed)

## Verification

```bash
npm --workspace apps/frontend run test -- QuickLookupApp EnrichmentStep FollowUpComposer
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx`
- `apps/frontend/src/components/FollowUpComposer.test.tsx`
