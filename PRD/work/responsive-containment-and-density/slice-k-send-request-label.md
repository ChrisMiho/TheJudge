# Slice K — Send Request label + Enrichment ready copy

## Status: done

## Goal

Make the initial pre-submit Ask/Decrypt control show a visible **Send Request**
label at every width, keep the answered-view follow-up composer icon-only, and
add a concise Enrichment ready-state helper line pointing at the button when the
optional message is blank (REQ-132, DEC-153).

## Requirements

1. `EnrichmentStep.tsx:554` (`<ComposerSubmitButton label="Decrypt Stack" ...>`)
   and `QuickLookupApp.tsx:537` (`<ComposerSubmitButton label="Ask TheJudge" ...>`)
   both change their visible label to **Send Request** for the initial submit.
   Accessible name may keep Ask/Decrypt semantics (`aria-label` need not literally
   say "Send Request" if that reads worse for a screen reader, but must remain a
   clear, distinct name).
2. `ComposerSubmitButton.tsx` currently hides its text label below `sm` (`hidden
   sm:inline`) and shows only the icon. The initial-submit label must be visible
   at every width per DEC-153 — either add a variant prop (e.g. `showLabelBelowSm`)
   used only by the two initial-submit call sites, or otherwise make the label
   visible at all widths without changing the answered-view follow-up composer's
   call site (`FollowUpComposer.tsx`, explicitly not touched by this package).
3. Keep the control compact enough that the field still meets REQ-121's ≥65%
   row-width floor at 390px (do not let the wider label starve the field again).
4. `EnrichmentStep.tsx:478` ("Ready to decrypt." / "Card context reviewed. Use
   View all cards to make more edits.") gets a concise addition, shown only when
   the optional question is blank, that tells the user to use the send button
   unless they add an optional message. Implementer chooses exact wording per
   DEC-153's Notes ("concise wording; implementer may choose exact sentence").
5. The answered-view follow-up composer (`FollowUpComposer.tsx`) is not modified
   — its send control stays arrow/icon-only at every width (DEC-153 non-goal).
6. Character caps and the blank-question fallback payload/text are unchanged.

## Acceptance criteria

- [ ] At 390×844 and 1440×900, the Enrichment decrypt control and the Quick
      Question first-ask control both show visible text reading **Send Request**
      (baseline: icon-only below `sm`, "Decrypt Stack"/"Ask TheJudge" text only at
      `sm+`)
- [ ] After the first answer, the follow-up composer's send control remains
      arrow/icon-only at every width — unchanged from today
- [ ] REQ-121's field-width floor (≥65% of the composer row at 390px) still holds
      with the wider label present
- [ ] When the Enrichment optional question is blank, the ready-state helper text
      includes a concise pointer to the send control; when non-blank, the added
      sentence does not appear (or reads consistently — implementer's concise
      wording choice)
- [ ] Accessible names still carry Ask/Decrypt semantics; `aria-label` is present
      and distinct
- [ ] Character caps and blank-question fallback text/payload are byte-for-byte
      unchanged
- [ ] `ComposerSubmitButton`, `EnrichmentStep`, and `QuickLookupApp` existing tests
      pass with updated label assertions

## Verification

```bash
npm --workspace apps/frontend run test -- ComposerSubmitButton EnrichmentStep QuickLookupApp
npm run quality:check
```

Playwright MCP at 390×844 and 1440×900: Enrichment ready state and Quick Question
pre-submit — `browser_evaluate` for visible submit-button text and composer field
width ratio; screenshot the Enrichment ready-copy addition. Call `browser_close`
when finished.

## Files touched

- `apps/frontend/src/components/ComposerSubmitButton.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/ComposerSubmitButton.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx` (or equivalent)

## Non-goals

- Renaming the answered follow-up control or touching `FollowUpComposer.tsx`.
- Changing the blank-question fallback payload text.
- Theme/brand restyling beyond the label becoming visible.
