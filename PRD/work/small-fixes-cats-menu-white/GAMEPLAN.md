# Gameplan — small-fixes-cats-menu-white

Four small player-facing fixes, frontend and presentation only (no request
contract, prompt, backend or data change). Source: `DESIGN-BRIEF.md` and the
finalized `GATE-QUESTIONS.md`.

## Slices

| Slice | What a player gets | Depends on |
| --- | --- | --- |
| A | Ten title taps on any in-scope screen show the cats; they hold for the session | none |
| B | Wider glowing desktop ☰ (glow on phone too); no sideways scrollbar in the open menu | none |
| C | First-time visitors land on White; broken saved colour falls back to White. Final slice: whole-package check, promotion checklist, ship gates | none (run last for the whole-package check) |

The three slices touch disjoint files (A: TSX components; B: `shell.css`; C:
theme/tokens/`index.html`/`AmbientScene`), so they are parallel-ready. Order
A, B, C is only so C's final check sees everything.

## Architecture and data flow

- A: a session-scoped tap count lives above the destinations in
  `MtgAssistantApp.tsx` and is passed to each in-scope header. No storage.
- B: CSS only in `shell.css`; stylesheet-text assertions (jsdom has no layout).
- C: `DEFAULT_PALETTE_ID` is the single default; `tokens.css` `:root` carries
  White's values before every colour block; `index.html` placeholder matches.

## Product truth

Each product-changing slice applies its share of the accepted `PRD/sections/`
amendments (REQ-203 in A; REQ-207 and REQ-113 in B; REQ-099, REQ-044,
FLOW-007 in C) by intent, together with the code, in the same PR. The source of
truth is `GATE-QUESTIONS.md`.

## Placement rule

`PRD/work/small-fixes-cats-menu-white/` is deleted before merge. All code,
tests and doc edits land outside it. Only disposable captures go under
`PRD/work/small-fixes-cats-menu-white/.playwright-mcp/`.

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green
- [ ] `npm run quality:check` green
- [ ] Live 390x844 and 1440x900: cats, ☰ look and glow in six colours, tray scrollWidth equals clientWidth
- [ ] Fresh storage lands on White; Blue and Red keep their own `--accent`
- [ ] Browser closed, servers stopped, ports released after every live check
