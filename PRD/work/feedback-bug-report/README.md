status: active

# Feedback & Bug Report

Frontend-only "Send feedback" feature. A portal **action entry** (DEC-104) opens an accessible
modal that captures a category, a required message, and an optional reply email, discloses an
app-state snapshot, and delivers to the owner's inbox via **Formspree** (DEC-105). No backend
route or contract change.

Sources of truth: DEC-104/DEC-105, REQ-086/087/088, FLOW-014 — see `GAMEPLAN.md` for architecture,
data flow, and the full verification checklist.

## Slice table

| Slice | Name | Depends on | Status |
| --- | --- | --- | --- |
| A | Portal action-entry union | — | done |
| B | Snapshot builder + seam contract | — | done |
| C | Delivery + config | — | done |
| D | FeedbackModal + form | B, C | planned |
| E | Portal wiring + integration | A, B, C, D | planned |

A, B, C are parallel-ready. D starts once B + C land. E is the integration + PRD-promotion slice.

## Implementation map

| Slice | New files | Files edited |
| --- | --- | --- |
| A | — | `lib/portal/types.ts`, `components/portal/destinationRegistry.tsx`, `components/portal/FeaturePortalMenu.tsx` (+ test), `App.tsx` |
| B | `lib/feedback/types.ts`, `lib/feedback/environment.ts`, `lib/feedback/buildFeedbackContext.ts` (+ test), `lib/feedback/FeedbackContextProvider.tsx` (+ test) | — |
| C | `lib/feedback/submitFeedback.ts` (+ test) | `lib/env.ts` (+ test), `.env.example` |
| D | `lib/feedback/summarizeFeedbackContext.ts` (+ test), `hooks/useFeedbackForm.ts` (+ test), `components/feedback/FeedbackModal.tsx` (+ test) | — |
| E | `App.feedback.test.tsx` | `App.tsx`, `components/portal/MtgAssistantApp.tsx` |

All paths relative to `apps/frontend/src/`.

## Next step

Map-out complete — five lettered slices are written with dependencies A/B/C parallel-ready, D
gated on B+C, E gated on all four. Start with slice A (or run A/B/C concurrently).

**Cursor**

```text
/thejudge-implement PRD/work/feedback-bug-report/ slice A
```

**Codex**

```text
$thejudge-implement PRD/work/feedback-bug-report/ slice A
```

**Claude Code**

```text
/thejudge-implement PRD/work/feedback-bug-report/ slice A
```
