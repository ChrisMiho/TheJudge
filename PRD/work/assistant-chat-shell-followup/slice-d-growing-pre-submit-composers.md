# Slice D — Growing pre-submit question composers

## Status: done

## Goal

Make the Enrichment optional-question field and the Quick Question question field grow vertically with typed content, up to the available space before bottom chrome, without ever causing the document/page to scroll — REQ-110 / DEC-131.

## Requirements

1. Both fields are currently fixed `rows={1}` textareas with no grow behavior:
   - `EnrichmentStep.tsx:534-540` — "Optional question" textarea.
   - `QuickLookupApp.tsx:429-437` — "Question" textarea.
2. Product truth prefers one shared fix over two divergent implementations (DEC-131 / package non-goal: "prefer shared workspace / shared composer patterns"). Implement one shared grow-to-fit textarea behavior (e.g. a small hook such as `useAutoGrowTextarea`, or a shared component) and have both call sites consume it, rather than duplicating grow logic.
3. Growth stops when further expansion would force document/page scroll — bottom chrome (the submit row / Start Over-equivalent row) remains the growth ceiling against available viewport space. This must hold on both mobile and desktop (more available space on desktop, but still no unbounded growth).
4. The character counter and submit control must remain usable while the field is expanded (both already render inline in the same row as the textarea; preserve that layout as the field grows — e.g. via `flex`/`items-end` adjustments already present).
5. No Ask AI contract change; existing character caps (`MAX_QUESTION_CHARS` in `EnrichmentStep.tsx`, `MAX_QUESTION_LENGTH` in `QuickLookupApp.tsx`) are unchanged. Does not require filling empty lower-half dead space beyond what field growth naturally occupies (explicit non-goal).

## Acceptance criteria

- [ ] Typing a long question into Enrichment's optional-question field grows the field vertically with the content instead of staying single-line and clipping text.
- [ ] Typing a long question into Quick Question's question field shows the same grow behavior.
- [ ] On both fields, growth stops before it would force the page/document to scroll; bottom chrome (submit row) stays the ceiling.
- [ ] The same behavior holds on a desktop viewport (more available space) and on ~390×844.
- [ ] The character counter and submit button remain visible and usable while either field is expanded.
- [ ] Existing character-cap behavior (300 chars on both fields) is unchanged.
- [ ] `npm --workspace apps/frontend run typecheck` and `npm --workspace apps/frontend run lint` pass.

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run lint
npm --workspace apps/frontend run test -- EnrichmentStep QuickLookupApp
```

Manual check: on Enrichment's pre-submit question form, type several lines of text and confirm the field grows without the page scrolling; repeat on Quick Question. Check both at desktop width and ~390×844.

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/hooks/` (new shared grow-textarea hook, exact filename at implementer's discretion)
- `apps/frontend/src/index.css`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/assistant-chat-shell-followup/` ready to delete
