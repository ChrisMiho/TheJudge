# Gameplan — indepth-chip-collapse

## What the player gets

On Ask a Question, the In-depth chip reads "◈ In-depth" at rest. Once the player
clicks into the question box or types, the chip shrinks to "◈" and hands the width
back to the question. Empty the box and blur it: the label returns. Tabbing onto the
chip, mic or send does not drop the label. Under 480px the chip is glyph-only always.

## Architecture

CSS state rule only. No `ComposerPill.tsx` markup change, no behavior or route change.

Hook: `apps/frontend/src/styles/flow.css` line 281, the existing
`@media (max-width: 479px) { .q-box .deep .lbl { display: none; } ... }`.
Add beside it:

```css
.q-box:has(textarea:focus) .deep .lbl,
.q-box:not([data-fill="0"]) .deep .lbl { display: none; }
```

- Focus trigger is the textarea itself (`:has(textarea:focus)`), never a bare
  `.q-box:focus-within`.
- Non-empty trigger reuses the box's existing `data-fill` attribute (`"0"` when empty,
  set by `ComposerPill.tsx`), so no markup change. Build must confirm `data-fill` is
  non-zero for any non-empty value; if not, fall back to `:has(textarea:not(:placeholder-shown))`
  (the placeholder is always non-empty).
- The chip's padding when collapsed matches the existing `<480px` glyph-only padding
  (`0 0.6rem`) so the chip is a balanced pill.
- Accessible name untouched: `aria-label="Add in-depth details"` stays; `.lbl` is already `aria-hidden`.

PRD: apply the approved REQ-206 change by intent (see slice B). anchor-ask-composer
(PR #262) has merged, so the REQ-206 line already carries its rewrite; substitute only
the sub-clause, never replay the frozen GATE-QUESTIONS replace-anchor.

## Slices

| Slice | Scope | Depends on |
| --- | --- | --- |
| A | CSS state rule in flow.css + unit/CSS tests + live browser verification at 1440 and 390 | none |
| B | Apply REQ-206 sub-clause substitution + Notes bullet; PRD promotion checklist; Ship gates | A |

## Verification checklist

- [ ] Label hides on textarea focus and on a non-empty box at 1440px
- [ ] Label stays when keyboard focus is on chip / mic / send with empty, unfocused textarea
- [ ] Label restores when box emptied and textarea blurred
- [ ] `<480px` glyph-only in every state; accessible name unchanged
- [ ] REQ-206 updated in place; `npm run quality:check` green
- [ ] Browser closed, owned servers stopped, ports released (runtime-process-hygiene)
