# Slice E — EnrichmentStep integration

## Status: done

## Dependencies

- Slice D (`components/AskAiWaitingPanel.tsx`)

## Goal

Wire `AskAiWaitingPanel` into `EnrichmentStep` so it replaces the submit form exactly while `isSubmitting` is true, then restores the form on completion or error.

## Requirements

1. In `EnrichmentStep.tsx`, import `AskAiWaitingPanel`.
2. When `isSubmitting` is true, render `<AskAiWaitingPanel isSubmitting={isSubmitting} />` in place of the `<form>` block.
3. The existing `showQuestionForm` condition still gates the form when `isSubmitting` is false; do not rearrange the surrounding logic unless required.
4. Card list (wizard or list view above) must remain visible regardless of `isSubmitting`.
5. The "Back to zones" button at the bottom must remain hidden while `isSubmitting` (already hidden via `!hasAnswer` guard — no extra change needed if the submit form and back button share the same visibility scope; verify this).
6. No new props added to `EnrichmentStep` — `isSubmitting` already exists.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx` (edit)
- `apps/frontend/src/App.test.tsx` (edit — add delayed-submit integration test)

## Integration test (in `App.test.tsx` or a new `EnrichmentStep.test.tsx`)

Scenario: delayed submit shows waiting panel

1. Render the app (or `EnrichmentStep` in isolation with `isSubmitting=true`).
2. Assert waiting panel is present (`aria-live` region, initial message visible).
3. Assert submit form (`<button>Decrypt Stack</button>`) is not in the DOM.
4. Assert the card list / wizard section above the form is still visible.

Scenario: completed submit restores form

1. Set `isSubmitting=false` after the panel was shown.
2. Assert `<button>Decrypt Stack</button>` is back (or answer panel shown if answer present).
3. Assert waiting panel is no longer in the DOM.

## Acceptance criteria

- [ ] `AskAiWaitingPanel` renders when `isSubmitting` is true
- [ ] Submit form (`Decrypt Stack` button) is not rendered while `isSubmitting` is true
- [ ] Card context above the form (wizard/list view) stays visible during wait
- [ ] Submit form (or answer panel) is restored when `isSubmitting` becomes false
- [ ] All integration tests pass: `npm --workspace apps/frontend run test`
- [ ] `npm --workspace apps/frontend run typecheck` passes

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run lint
```

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (no API, no AskAiRequest shape changes)
- [ ] No secrets committed
- [ ] REQ-023 acceptance criteria confirmed via manual browser test with `dev:mock`
- [ ] NFR-006 CSS-only motion constraint satisfied (no animation library in `package.json`)
- [ ] Promote REQ-023 and NFR-006 CSS carve-out to `sections/` if not already durable; delete `PRD/work/ask-ai-wait-animation/`
