status: active

# Feedback & Bug Report — GAMEPLAN

Frontend-only "Send feedback" feature. A portal **action entry** (DEC-104) opens an accessible
**modal** over the current screen; the user picks a category, writes a required message, optionally
leaves a reply email, reviews a disclosed app-state snapshot, and submits to **Formspree** via a
public form id. Graceful no-op when no form id is configured.

Sources of truth: DEC-104 (`sections/decisions/navigation.md`), DEC-105 (`sections/decisions/feedback.md`),
REQ-086/087/088 (`sections/functional-requirements.md`), FLOW-014 (`sections/user-flows.md`),
Feedback Delivery Strategy (`sections/integrations-and-data.md`).

## Architecture

### Current portal shape (grounding)

- `apps/frontend/src/lib/portal/types.ts` — `PortalDestination { id, label, render }` (plain interface, **not** a union yet).
- `destinationRegistry.tsx` — `PORTAL_DESTINATIONS: PortalDestination[]` (two v1 destinations).
- `FeaturePortalMenu.tsx` — renders `destinations.map(...)`, calls `onSelect(id)` then closes; owns the slot/fixed-tab trigger.
- `DestinationOutlet.tsx` — keeps destinations mounted, hides inactive via `hidden`.
- `App.tsx` — shell owns `activeDestinationId`; renders `<ThemeControl>` + `<FeaturePortalMenu>` wrapping `<DestinationOutlet>`.
- `lib/env.ts` — env resolvers (`resolveApiBaseUrl`, `resolveIsMockProvider`, etc.); exports evaluated consts from `import.meta.env`.
- No existing modal / focus-trap / `role="dialog"` pattern — built fresh here.

### Target shape

1. **Entry model → discriminated union** (Slice A). `PortalEntry = PortalDestination | PortalActionEntry`, where
   `PortalDestination` gains `kind: "destination"` and `PortalActionEntry = { kind: "action", id, label, onSelect: () => void }`.
   The menu renders both kinds identically; selecting an action runs `onSelect` and closes the menu **without**
   changing `activeDestinationId`. The outlet mounts only `kind === "destination"` entries. Registry stays the single
   place features register (DEC-095/DEC-104).

2. **Decoupling seam for the snapshot** (Slice B + wired in Slice E). The modal never reaches into flow internals.
   A shell-level React context (`FeedbackContextProvider`) exposes `registerFeedbackContributor(fn)` and a
   `getFeedbackContext()` reader. `MtgAssistantApp` (the active flow) registers a lazy contributor returning its
   in-progress flow slice (screen/step, game context + typed question, zones/cards/enrichment, conversation history).
   The shell's `getFeedbackContext()` calls the registered contributor (if any) and merges shell-level fields
   (active destination, provider mode, environment) through the pure `buildFeedbackContext()` builder. If no
   contributor is registered, the snapshot still builds from shell + environment fields only.

3. **Delivery** (Slice C). `submitFeedback(payload)` POSTs a JSON body to `https://formspree.io/f/<id>` where `<id>`
   comes from `VITE_FEEDBACK_FORMSPREE_ID`. Resolves `success` / `network-error` / `rate-limit`. When the id is
   empty/unset, submit is a graceful no-op (`unconfigured`) and never throws.

4. **Modal + form** (Slice D). `FeedbackModal` (theme-aware, focus-trap, Esc, restore focus, CSS-only reduced-motion)
   + `useFeedbackForm` (field state, validation, submit lifecycle, draft preserved on error). The disclosure line +
   expandable summary render the same human-readable summary produced from the snapshot.

5. **Integration** (Slice E). Register the **Send feedback** action entry, mount the modal at the shell, wire
   `getFeedbackContext`, register the `MtgAssistantApp` contributor, restore focus to the portal trigger on close.

## Data flow

```
Portal menu ──select "Send feedback" (action entry, DEC-104)──▶ open FeedbackModal (no view switch)
FeedbackModal ──getFeedbackContext()──▶ shell reader
    shell reader ──registered contributor()──▶ MtgAssistantApp flow slice
    shell reader + env + activeDestination ──buildFeedbackContext()──▶ FeedbackContext (pure)
FeedbackContext ──summarizeFeedbackContext()──▶ disclosure line + expandable summary (shown to user)
submit ──{ category, message, email?, appState: JSON.stringify(FeedbackContext) }──▶ submitFeedback ──POST──▶ Formspree
```

Payload shape (integrations-and-data.md, Feedback Delivery Strategy):
`{ category: "bug"|"suggestion"|"other", message: string, email?: string, appState: string /* JSON-stringified snapshot */ }`.

## Payload / contract guardrails

- No backend route, no contract change: `AskAiRequest`, `GameContext`, prompt assembly, provider boundary,
  `POST /api/ask-ai` all untouched. No server-side state.
- `VITE_FEEDBACK_FORMSPREE_ID` is public config (committed to `.env.example`, shipped in bundle) — **not a secret**.
- Snapshot is read-only: building/sending it never mutates app state.
- v1 non-goals: no screenshots/file uploads, no persistence, no auth, no in-app history, no analytics.

## Slice dependency map

| Slice | Depends on |
| --- | --- |
| A — Portal action-entry union | — |
| B — Snapshot builder + seam contract | — |
| C — Delivery + config | — |
| D — FeedbackModal + form | B, C |
| E — Portal wiring + integration | A, B, C, D |

A, B, C are parallel-ready. D starts once B + C land. E is the integration + PRD-promotion slice.

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green (new specs for A–E plus unchanged portal specs).
- [ ] `npm --workspace apps/frontend run typecheck` green (union type flows through menu/outlet/registry).
- [ ] Existing `destinationRegistry.test.tsx`, `FeaturePortalMenu.test.tsx`, `DestinationOutlet.test.tsx`,
      and `App.*.test.tsx` still pass (destination semantics unchanged, DEC-104 additive).
- [ ] Action entry opens the modal without changing the active destination (no view switch).
- [ ] Modal a11y: focus trapped, Esc closes, focus restored to portal trigger, reduced-motion respected (NFR-006, NFR-001).
- [ ] Validation: empty message blocks submit; malformed email blocks submit; valid email/blank email pass.
- [ ] No form id configured → submit disabled/no-op with hint; never throws.
- [ ] Snapshot shown in expandable summary == content serialized to `appState`.
- [ ] `apps/frontend/.env.example` documents `VITE_FEEDBACK_FORMSPREE_ID`; no secret committed.
- [ ] `npm run quality:check` green for touched areas (final slice).
