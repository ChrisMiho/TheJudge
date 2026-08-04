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
| D | FeedbackModal + form | B, C | done |
| E | Portal wiring + integration | A, B, C, D | done |

A, B, C are parallel-ready. D starts once B + C land. E is the integration + PRD-promotion slice.

## Implementation map

| Slice | New files | Files edited |
| --- | --- | --- |
| A | — | `lib/portal/types.ts`, `components/portal/destinationRegistry.tsx`, `components/portal/FeaturePortalMenu.tsx` (+ test), `App.tsx` |
| B | `lib/feedback/types.ts`, `lib/feedback/environment.ts`, `lib/feedback/buildFeedbackContext.ts` (+ test), `lib/feedback/FeedbackContextProvider.tsx` (+ test) | — |
| C | `lib/feedback/submitFeedback.ts` (+ test) | `lib/env.ts` (+ test), `.env.example` |
| D | `lib/feedback/summarizeFeedbackContext.ts` (+ test), `hooks/useFeedbackForm.ts` (+ test), `components/feedback/FeedbackModal.tsx` (+ test) | — |
| E | `App.feedback.test.tsx` | `App.tsx`, `components/portal/MtgAssistantApp.tsx` (registry untouched — the action entry closes over shell state, so it is built in `App.tsx`) |

All paths relative to `apps/frontend/src/`.

## Next step

All slices (A–E) are done. Ready for cleanup: promote durable PRD truth (DEC-104/DEC-105 impact,
flip **Feedback & bug report** in `sections/system-map.md` to `shipped`), write the receipt, and
delete this folder.

**Cursor**

```text
/thejudge-cleanup PRD/work/feedback-bug-report/
```

**Codex**

```text
$thejudge-cleanup PRD/work/feedback-bug-report/
```

**Claude Code**

```text
/thejudge-cleanup PRD/work/feedback-bug-report/
```
