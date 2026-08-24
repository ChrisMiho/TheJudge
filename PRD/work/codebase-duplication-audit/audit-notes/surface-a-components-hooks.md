# Surface A — Frontend components and hooks

## Inventory

`git ls-files apps/frontend/src/components apps/frontend/src/hooks | wc -l` →
**108** files (includes `apps/frontend/src/components/.gitkeep`; 107
hand-authored `.ts`/`.tsx` files).

## Seeding searches run

- Repeated exported symbol names: `grep -rhoE '^export (const|function)
  [A-Za-z0-9_]+' apps/frontend/src/components apps/frontend/src/hooks` — no
  symbol exported twice in this surface.
- Repeated literal `className` strings (10+ chars):
  `grep -rhoE 'className="[a-zA-Z0-9 _-]{10,}"' apps/frontend/src/components
  apps/frontend/src/hooks | sort | uniq -c | sort -rn` — top hits are Tailwind
  utility combinations (`text-xs text-zinc-400`, `flex flex-col gap-1`, etc.).
  These are utility-class composition, not a duplicated implementation of a
  need; not written up as findings.
- Parallel handler names (open/close/dismiss/retry):
  `grep -rnoE '\b(handleOpen|handleClose|handleDismiss|handleRetry|onOpen|
  onClose|onDismiss|onRetry)\b' apps/frontend/src/components
  apps/frontend/src/hooks` — surfaced the Escape-dismissal and retry-panel
  clusters below.
- Targeted follow-ups: `event.key === "Escape"` across the surface;
  `useOutsideDismiss` / `OverlayCloseButton` adopters; `setInterval`/
  `longPress` in the life-tracker panel; `StepEyebrow`/`StagedStepHeader`
  adopters.

## Findings

### F-01: Overlay Escape-key dismissal reimplemented per component

**Need:** Close an open overlay (dialog, drawer, menu, modal) when the user
presses Escape.

**Locations:**
- `apps/frontend/src/components/AdaptiveContextDialog.tsx:54-61` —
  `handleDialogKeyDown`
- `apps/frontend/src/components/CardPresentation.tsx:111-116` —
  `handleKeyDown`
- `apps/frontend/src/components/ConversationHistoryDrawer.tsx:108-115` —
  `handleDialogKeyDown`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx:159-172` —
  inline `handleKeyDown` inside a `useEffect`
- `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx:30-44`
  — inline `handleKeyDown` inside a `useEffect`
- `apps/frontend/src/components/portal/life-tracker/CounterPanel.tsx:276-290`
  — inline `handleKeyDown` inside a `useEffect`
- `apps/frontend/src/components/feedback/FeedbackModal.tsx:105-115` — inline
  `handleKeyDown` inside a `useEffect`

**Verdict:** accidental. `apps/frontend/src/hooks/useOutsideDismiss.ts`
already centralizes the *outside-click* half of overlay dismissal for all
seven of these adopters (confirmed: every file above also calls
`useOutsideDismiss`), and its own doc comment states "Each adopter keeps its
own Escape/close-button paths — this hook only covers the outside/scrim
interaction" — so the split is a deliberate boundary, but nothing fills the
Escape half; each adopter re-derives the same `document.addEventListener
("keydown", ...)` / `event.key === "Escape"` / cleanup shape independently.
`OverlayCloseButton.tsx` is shared by these same seven files for the visible
close button, which sharpens the gap: the click path is centralized twice
(button + outside-dismiss hook) and the keyboard path is centralized zero
times.

**Consolidation:** a paired `useDismissOnEscape(onDismiss, enabled)` hook
(same shape and file as `useOutsideDismiss.ts`) that each of the 7 files
calls instead of writing its own effect. Touches 7 component files plus one
new/extended hook file; no prop-shape or behavior change.

**Size:** small.

**Complexity removed:** 7 independent places must currently change together
for any Escape-handling change (e.g. adding `stopPropagation`, or excluding
Escape while an inner text input is focused) — done for `FeaturePortalMenu`'s
menu case already; the other 6 would need to be checked and edited by hand.
If one copy is edited and the others are not, overlays silently diverge in
whether Escape calls `preventDefault()` first (5 of 7 do; `FeaturePortalMenu`
does not) — a real behavioral difference already present today, first
evidence that hand-copying has already begun to drift.

Excluded from this finding as a different need: `GameSetupPanel.tsx:340` and
`PlayerLifeCard.tsx:214` also check `event.key === "Escape"`, but inside a
text `<input>`'s `onKeyDown` to cancel an in-progress numeric edit, not to
close an overlay. Two instances, same narrower need (cancel-edit-on-Escape);
noted here, not written up as its own `F-##` — it sits right at the finding
floor (two locations) but the two edits it would touch are small and
independent enough that a shared hook would be net neutral, not a complexity
win. Left for the reader to decide alongside F-01, not resolved as accidental
or healthy.

### F-02: Duplicated error-and-retry panel markup

**Need:** Render the AI-answer error state — an error message plus a
"Retry"/"Retry in Ns" button, disabled while a retry is in flight.

**Locations:**
- `apps/frontend/src/components/ConversationWorkspace.tsx:70-79` — inline
  JSX inside `ConversationWorkspace`
- `apps/frontend/src/components/EnrichmentStep.tsx:582-591` — inline JSX
  inside `EnrichmentStep`

**Verdict:** accidental. `EnrichmentStep` renders `ConversationWorkspace`
(which owns its own copy of this block, line 70-79) whenever
`isConversationActive` is true, but renders its own second, textually
identical copy of the same block (line 582-591: same `className`s, same
`{retryLabel}` / `disabled={!canRetry}` / `onClick={() => void onRetry()}`)
for the pre-conversation question-building state. Same need, same markup,
two independent call sites that must be hand-kept in sync.

**Consolidation:** extract a small `ErrorRetryPanel({ error, canRetry,
retryLabel, onRetry })` component (candidate home: alongside
`AskAiWaitingPanel.tsx`, the sibling "pending/error state" component) and
have both `ConversationWorkspace` and `EnrichmentStep` render it. Touches 2
files plus 1 new component file; no behavior change.

**Size:** small.

**Complexity removed:** 2 independent copies must currently change together
for any styling or copy change to the error/retry state; already visibly
identical today, so no divergence yet, but the second copy exists purely
because it was pasted rather than imported.

## Healthy reuse

- `apps/frontend/src/hooks/useScanCapture.ts` /
  `apps/frontend/src/components/ScanCameraSurface.tsx` — measured, intended
  reuse per `DEC-157`.
- `apps/frontend/src/hooks/useOutsideDismiss.ts` — single shared
  outside-click/scrim-dismiss implementation for all 7 overlay adopters
  named in F-01 (`AdaptiveContextDialog`, `CardPresentation`,
  `ConversationHistoryDrawer`, `FeaturePortalMenu`,
  `PlayerLifeTrackerApp`, `CounterPanel`, `FeedbackModal`). Module-scoped
  `dismissStack` correctly handles nested-overlay ordering; this is the
  positive control the Escape-side gap in F-01 is measured against.
- `apps/frontend/src/components/OverlayCloseButton.tsx` — single shared
  close-button component, adopted by the same 7 files as
  `useOutsideDismiss.ts`.
- `apps/frontend/src/components/StepEyebrow.tsx` /
  `apps/frontend/src/components/StagedStepHeader.tsx` — shared step-header
  pair, adopted consistently by `EnrichmentStep.tsx`, `ZoneConfirmStep.tsx`,
  and `ZoneCollectionStep.tsx` (same two-component call shape at each site).
- Life-tracker long-press increment (`CounterPanel.tsx`'s
  `longPressTimerRef` timer) is not duplicated by `PlayerLifeCard.tsx`
  (checked: `PlayerLifeCard` has no long-press/timer code of its own) —
  ruled out as a candidate, not a finding.

## Draft coverage-table row

| Directory | Files examined | Findings |
| --- | --- | --- |
| `apps/frontend/src/components/**`, `apps/frontend/src/hooks/**` | 108 | 2 (F-01, F-02) |
