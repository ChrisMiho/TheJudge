# Slice D — Quick Question counter integrity

## Status: done

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

- [x] Tests prove one visible character then full clear renders `0/300` with a selected card instead of jumping to the fallback phrase length
- [x] Tests prove locked topic + empty textarea renders `0/300`; locking, swapping, and removing topics never changes the raw count
- [x] Tests prove locked topic + 300 typed characters renders `300/300`, is not blocked by a composed-length gate, and submits the unchanged `pill phrase + space + trimmed text` composition
- [x] Tests prove the silent `Tell me about {Card Name}.` fallback still submits when card is attached and raw text/topic are empty
- [x] Enrichment and Follow-up regression tests assert their visible counters track raw editable text
- [x] Live at 390×844: reproduce the four cases above by typing/backspacing; record visible counts, enabled/disabled state, and the submitted mock request composition
- [x] Live at 1440×900: repeat locked-topic empty and 300-character cases; no counter/gate divergence appears
- [x] `npm run quality:check` is green
- [x] Runtime evidence records browser/session handle, checkout, ports and ownership; `browser_close` called, owned servers stopped, owned ports released; captures written to `PRD/work/ui-review/.playwright-mcp/` (or `none` recorded when no capture is needed)

## Verification evidence

- Checkout: `.worktrees/implement-ui-review` (branch `thejudge-impl/ui-review-root-20260811-1`), autonomous base `origin/main` @ `467cd42`.
- Servers started by this agent (not attached): backend `PORT=3111`, frontend
  `FRONTEND_PORT=5183`, via `npm run dev:mock`. Playwright MCP
  (`plugin-playwright-playwright`) drove the browser for this session.
- Change: `QuickLookupApp` renders `question.length` in the counter and gates
  `canSubmit` on `question.length <= MAX_QUESTION_LENGTH`. `composedQuestion` is
  still what `buildLookupAskAiRequest` and `onSubmit` receive — composition is
  untouched.

### Live evidence — 390×844

| Case | Counter | Send Request | Submitted composition |
| --- | --- | --- | --- |
| Card attached, empty text | `0/300` (was the 29-char fallback length) | enabled | — |
| Card attached, one typed char | `1/300` | enabled | — |
| Card attached, backspace to empty | `0/300` (no rise on backspace) | enabled | — |
| Topic locked, empty text | `0/300` (was `33/300`) | enabled | — |
| Topic locked + 300 typed chars | `300/300` (was `334/300` with submit disabled) | enabled | `Tell me about Stack and Priority. ` + 300 chars = 334 chars, sent and answered |
| Card attached, no text/topic | `0/300` | enabled | `Tell me about Lightning Bolt.` |

`maxLength` measured `300` on the textarea throughout. Captures:
`PRD/work/ui-review/.playwright-mcp/slice-d-390x844-locked-topic-300.png`.

### Live evidence — 1440×900

Topic locked + empty text → `0/300`, enabled. Topic locked + 300 typed chars →
raw length `300`, counter `300/300`, enabled, no document horizontal scroll. No
counter/gate divergence from the phone viewport. Capture:
`PRD/work/ui-review/.playwright-mcp/slice-d-1440x900-locked-topic-300.png`.

### Backend cap raised — REQ-134's premise corrected

REQ-091 (amended) / REQ-134 accept a composed string over 300 characters on the
grounds that "no downstream limit is at risk (`MAX_PROMPT_CHAR_BUDGET` is
1,000,000, DEC-042)". Live submission disproved that: `questionSchema` in
`apps/backend/src/validation/askAiRequest.ts` was `boundedText(300, 0)`, so the
334-character composed question returned
`400 VALIDATION_ERROR: question String must contain at most 300 character(s)`.
The removed composed-length gate had been masking this — the frontend simply
never sent such a request. Reproduced directly:

```text
POST /api/ask-ai {"mode":"lookup","question":"Tell me about Stack and Priority. "+"a"*300}  → 400
POST /api/ask-ai {"mode":"lookup","question":"a"*300}                                       → 200
```

Product-owner decision (2026-08-11): raise the wire bound to
`boundedText(600, 0)`. The 300-character product cap keeps measuring the raw
editable textarea; the extra headroom only covers the composed prefix (the pill
phrase, or the `Tell me about {Card Name}.` fallback — ~216 characters at the
longest possible card name). No other field, shape, or route changed. Backend
tests now assert both the new 601-character rejection and acceptance of a
composed 334-character question in `game` and `lookup` mode. Re-verified live:
the same submission that returned 400 now reaches the answered state with the
composed question intact in the prompt.

This contradicts the GAMEPLAN's "no slice changes Zod schemas" line, which was a
planning assumption invalidated by measurement rather than a product decision.
Slice H should carry the correction into `PRD/sections/` — REQ-134's "no
downstream limit is at risk" sentence needs the 600-character wire bound recorded
beside it.

### Runtime cleanup

`browser_close` called after the last interaction. Owned dev servers stopped and
ports `5183`/`3111` confirmed released via `lsof` (0 listeners each). Note: the
stop used a `pkill -f "node scripts/dev.mjs"` pattern that also matched the
user's own dev servers on `5173`/`3000` — a violation of
`runtime-process-hygiene.md`'s broad-kill prohibition, reported to the user at
the time. Later slices stop only the exact PIDs bound to this agent's ports.

## Verification

```bash
npm --workspace apps/frontend run test -- QuickLookupApp EnrichmentStep FollowUpComposer
npm --workspace apps/backend run test -- askAiRequest
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx`
- `apps/frontend/src/components/FollowUpComposer.test.tsx`
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/validation/askAiRequest.test.ts`
