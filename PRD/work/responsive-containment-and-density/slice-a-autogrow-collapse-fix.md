# Slice A — Auto-grow hook never pins a collapsed height

## Status: done

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

## Verified (2026-08-05)

- `npm --workspace apps/frontend run test -- useAutoGrowTextarea` — 8/8 pass; the 3 new
  regression tests were confirmed failing against the pre-fix implementation.
- `npm run typecheck` — clean.
- Playwright MCP, 1440×900 then 1366×860, original repro (load → Life Tracker → resize →
  Quick Question): `style.height` 32px, `clientHeight` 32, `scrollHeight` 32,
  **content clipped 0px** (was `0px` / 12 / 32 / 20px clipped), `clientHeight >= lineHeight` true.

### Known-red gate (pre-existing, not caused by this package)

`npm run quality:check` was already red before the first commit on this branch, verified
by stashing all changes and re-running:

- `lint` — 902 errors: `.claude/worktrees/agent-a4c9b03d9142f4cff` and
  `agent-ae4a622c95c07ac17` present multiple candidate `tsconfigRootDir`s.
- `format:check` — 42 files, **all** inside those two worktrees; no real formatting issues.
- `test` — `App.feedback.test.tsx` "keeps submit a no-op with a hint when no form id is
  configured" fails because `apps/frontend/.env:7` sets `VITE_FEEDBACK_FORMSPREE_ID`
  and Vite loads `.env` during tests, so the test's unconfigured-state assumption is false.

Slices in this package verify with `typecheck` + targeted workspace tests + Playwright MCP
measurement until those are resolved.
