# Slice E — In-Depth tap floor of 44 px

## Status: planned

## Goal

In-Depth's zone tabs and its Reorder and Copies buttons are 44 px tall; Life
Tracker's segmented buttons stay 42 px.

## Requirements

1. `apps/frontend/src/index.css`: change two values only, `min-height` of
   `.zone-tabs button` (near `:1386`) and `.seg button` (near `:2176`), from
   40 px to 44 px. Do not touch `body`, `html`, `*`, card-tile, printing-picker
   or sheet rules, or `.lt-scope .seg button` (near `:4587-4602`).
2. Stylesheet test (copy the pattern of `ComposerPill.test.tsx:415`, reading
   `appCss`) asserting: `.zone-tabs button` declares `min-height: 44px`; the
   base `.seg button` rule declares `min-height: 44px` using a line-start
   match (`^` with the multiline flag) so it cannot hit `.lt-scope .seg
   button` (quality-check advisory); `.lt-scope .seg button` still declares
   `min-height: 42px`. May live in `ZoneCollectionStep.test.tsx` or beside the
   existing 44 px floor tests.
3. Browser check at 390x844 (REQ-205, REQ-202): In-Depth zone tabs and Reorder
   buttons measure 44 px; Life Tracker Counters tabs measure 42 px.
4. REQ-202 screenshot pair: Life Tracker Counters sheet (Commander damage /
   Counters tabs) and Game Setup (Layout and Card style), before and after, at
   390x844 and 1440x900, plus the In-Depth Cards station at 390x844 before and
   after. Captures go under `PRD/work/player-visible-bugs/.playwright-mcp/`;
   record the file names and measurements in `slice-e.evidence.md`.
5. No spec edit.

## Acceptance criteria

- [ ] `index.css` changes only the two `min-height` values, 40 px to 44 px (diff shows two changed lines in the file)
- [ ] The stylesheet test asserts `.zone-tabs button` is 44 px, the line-anchored base `.seg button` is 44 px, and `.lt-scope .seg button` is still 42 px, and passes
- [ ] Measured at 390x844: In-Depth zone tabs and Reorder buttons are 44 px; Life Tracker Counters tabs are 42 px (manual, dated line in evidence)
- [ ] REQ-202 Life Tracker before/after screenshot pair (Counters sheet and Game Setup, 390x844 and 1440x900) plus the In-Depth Cards station pair (390x844) are captured and named in `slice-e.evidence.md` (manual)
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/player-visible-bugs/.playwright-mcp/` (manual)
- [ ] Typecheck and lint pass

## Verification

```bash
npm --workspace apps/frontend run test -- ZoneCollectionStep ComposerPill
git diff -U0 origin/main...HEAD -- apps/frontend/src/index.css
npm run typecheck
npm run lint
```

## Files touched

- `apps/frontend/src/index.css` (two values)
- `apps/frontend/src/components/ZoneCollectionStep.test.tsx` (or beside `ComposerPill.test.tsx`)
- `PRD/work/player-visible-bugs/slice-e.evidence.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/player-visible-bugs/` ready to delete
