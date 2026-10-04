# Gameplan — ui-pass-2

Four owner-reported UI polish items. No behaviour, data, or contract change. Frontend only.

## Architecture

All edits are presentation: one SVG component (`TradePile.tsx`) and CSS in
`flow.css`, `index.css`, `shell.css`. One markup slot may be added in
`ConversationHistoryDrawer.tsx`. No backend, no new components, no new tokens.

## Slices

| Slice | Scope | Surface | Depends on |
| --- | --- | --- | --- |
| A | Pile art follows the direction-1 mockup; applies REQ-215 truth by intent | `TradePile.tsx`, `functional-requirements.md` | none |
| B | Add-card search box mirrors the `.q-box` pill | `flow.css` (`index.css` if scoped) | none |
| C | Mobile History Delete gets real chrome and its own slot (600px, REQ-213) | `index.css`, drawer markup | none |
| D | Confirm sheet padding wins over `.drawer-panel` reset; carries PRD checklist and Ship gates | `shell.css` | none |

All four are independent and parallel-ready; each touches disjoint files. C and D
meet on the phone delete flow, so the final live check of D uses the history
delete path and should run after C lands if done sequentially.

## Data flow

None. Pricing, totals, price route, delete behaviour, confirm words and buttons are untouched.

## Product truth

Only REQ-215 changes, accepted at the gate (`GATE-QUESTIONS.md`). It is applied to
`PRD/sections/functional-requirements.md` inside slice A, together with the code.
Items B-D need no PRD edit (REQ-206, REQ-118, REQ-208, NFR-001 stand).

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green
- [ ] `npm run quality:check` green
- [ ] Browser pass (isolated dev server, own ports): desktop 1440x900 for A and B, phone 390x844 for A-D; captures in `PRD/work/ui-pass-2/.playwright-mcp/`
- [ ] Browser closed, server stopped, ports released after each browser slice
- [ ] Manual criteria earned by dated lines in `slice-<letter>.evidence.md`

## Notes from the quality gate

- Item 3 uses the 600px breakpoint (REQ-213).
- The `.drawer-panel` padding override is near `shell.css:872-892`, not the brief's `872`; grep for the real `padding: 0` line.
