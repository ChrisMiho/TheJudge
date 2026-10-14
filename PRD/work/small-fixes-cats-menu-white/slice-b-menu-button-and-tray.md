# Slice B — Bigger glowing menu button, no sideways scrollbar in the menu

## Status: planned

## Goal

The desktop ☰ shows 45px bars with a soft glow (phone keeps its size, gains the
glow), and the open menu never scrolls sideways. Both are CSS in `shell.css`.

## Requirements

1. Desktop (768px+): inside the existing `min-width: 768px` block, before the
   hover/focus rule, draw three bars 45px wide, 2.5px thick, 7px apart, centred;
   no box, fill or outline at rest; button stays 54x54px; header stays 68px.
   Accessible name "Switch feature" kept.
2. Every width: soft glow (about 6px, `--accent` mixed about 55% with white) on
   the bars only (desktop) and on the glyph (phone, 50px box and 1.4rem
   unchanged). Static; takes no pointer events; hover/focus fill unchanged and
   does not glow.
3. `.menu-tray::after` loses its negative `right` offset (line inside the box);
   `.menu-tray` declares `overflow-x: hidden` or `clip`; the line still paints.
4. Build applies its share of the accepted `PRD/sections/` amendments by
   intent, together with the code, in the same PR: the REQ-207 and REQ-113
   blocks of `GATE-QUESTIONS.md`. Nothing ships from inside `PRD/work/`.

## Acceptance criteria

- [ ] B1. Stylesheet assertion: the desktop ☰ rule draws bars 45px wide with the glow and sits inside the `min-width: 768px` block before the hover/focus rule (test).
- [ ] B2. Stylesheet assertion: the phone rule keeps the 50px box and 1.4rem glyph and carries the glow; desktop box stays 54px (test).
- [ ] B3. Stylesheet assertion: `.menu-tray::after` has no negative `right`/`left`, and still has `content`, 1px `width` and `background` (test).
- [ ] B4. Stylesheet assertion: `.menu-tray` declares `overflow-x: hidden` or `clip` (test).
- [ ] B5. Frontend test suite passes.
- [ ] B6. Live at 1440x900 and 390x844: box 54px / 50px, desktop header 68px, 45px bars on desktop, glow visible in all six colours at both widths; hover and keyboard focus still show the accent fill with no glow on the box.
- [ ] B7. Live at 390x844 and 1440x900 with classic scrollbars forced on: open tray `scrollWidth` equals `clientWidth`, no horizontal bar, right-edge line still paints.
- [ ] B8. The REQ-207 and REQ-113 amendments from `GATE-QUESTIONS.md` are applied to `PRD/sections/` in this PR.
- [ ] B9. Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/small-fixes-cats-menu-white/.playwright-mcp/`.

## Verification

```bash
npm --workspace apps/frontend run test
```

## Files touched

- `apps/frontend/src/styles/shell.css`
- a new or existing stylesheet-assertion test beside the other CSS text tests
- `PRD/sections/` (REQ-207, REQ-113)
