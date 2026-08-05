# Slice A — Auto-grow hook never pins a collapsed height

## Status: planned

## Goal

Stop `useAutoGrowTextarea` from writing a collapsed inline height when its
textarea is unrendered, and re-measure when the field becomes visible again
(REQ-120).

## Requirements

1. When a resize fires while the textarea is unrendered (`scrollHeight === 0`, or
   a zero-size bounding rect), the hook must not apply the measured value.
2. The hook must re-measure when the field becomes visible again, so a height
   written while hidden cannot survive re-activation.
3. Growth behavior from REQ-110 is unchanged: the field still grows with typed
   content and still stops before forcing document scroll.
4. Fix stays in the shared hook — no per-call-site sizing logic (DEC-131).

## Acceptance criteria

- [ ] After load → switch destination → resize window → switch back, the composer's
      `clientHeight` is at least one line of its computed `line-height` and its
      `scrollHeight` does not exceed its `clientHeight` (baseline defect:
      `style.height="0px"`, `clientHeight` 12 vs `scrollHeight` 32, 20px hidden)
- [ ] No inline height below one line is ever written when measured `scrollHeight` is `0`
- [ ] Holds for both call sites (Quick Question question, Enrichment optional
      question) at 390×844 and 1440×900
- [ ] Typing a long question still grows the field and still does not force document scroll
- [ ] A regression test in `useAutoGrowTextarea.test.tsx` covers the hidden-measurement
      case and fails against the current implementation

## Verification

```bash
npm --workspace apps/frontend run test -- useAutoGrowTextarea
npm run quality:check
```

Playwright MCP, both viewports: navigate → switch to Life Tracker → `browser_resize`
→ switch back to Quick Question → `browser_evaluate` reading
`{ style.height, clientHeight, scrollHeight }` on the composer textarea.

## Files touched

- `apps/frontend/src/hooks/useAutoGrowTextarea.ts`
- `apps/frontend/src/hooks/useAutoGrowTextarea.test.tsx`
