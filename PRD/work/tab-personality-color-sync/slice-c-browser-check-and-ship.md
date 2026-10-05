# Slice C — Real-browser check, PRD apply, ship gates

## Status: done

## Goal

Prove in a real browser that the tab re-skins across all six profiles, then apply REQ-219 to product truth.

## Requirements

1. Run the frontend dev server (owned by this slice), open the app in Playwright, and for each of White, Blue, Black, Red, Green, Colorless switch Theme and observe: favicon `href` motif+accent, `document.title`, theme-color `content`. At a phone viewport (390x844) confirm the theme-color meta value matches the accent after each switch. Also set a custom Colorless colour and confirm it is followed. Captures go to `PRD/work/tab-personality-color-sync/.playwright-mcp/`. Real mobile bar tint is not renderable in desktop Chromium; the observable proxy is the meta `content` plus a screenshot of the icon rendered from the data URI. (REQ-219)
2. Apply REQ-219 to `PRD/sections/functional-requirements.md` (append after REQ-217, text from the accepted diff in `GATE-QUESTIONS.md`) and add the one bullet to `PRD/sections/shared-chrome/README.md` as specified there. If REQ-219 already exists with different content, replace it whole.
3. Confirm the in-app UI is unchanged (no new screen; REQ-126 needs no row).

## Acceptance criteria

- [ ] Real browser, six profiles: favicon `href` differs per profile and decodes to the matching motif in the matching accent; recorded in a dated observation line
- [ ] Real browser, six profiles: `document.title` equals `TheJudge · MTG Assistant` after every switch
- [ ] Real browser at 390x844, six profiles: theme-color `content` equals the active accent after every switch, with no page reload
- [ ] Real browser: custom Colorless colour is followed by favicon and theme-color
- [ ] Browser closed, owned dev server stopped, port released; captures written to `PRD/work/tab-personality-color-sync/.playwright-mcp/`
- [ ] `PRD/sections/functional-requirements.md` contains REQ-219 matching the accepted diff
- [ ] `PRD/sections/shared-chrome/README.md` contains the REQ-219 "Built:" bullet
- [ ] `npm run quality:check` passes

## Verification

```bash
grep -n "### REQ-219" PRD/sections/functional-requirements.md
grep -n "REQ-219" PRD/sections/shared-chrome/README.md
npm run quality:check
```

## Files touched

- `PRD/sections/functional-requirements.md`
- `PRD/sections/shared-chrome/README.md`
- `PRD/work/tab-personality-color-sync/.playwright-mcp/` (captures, deleted at cleanup)

## PRD promotion checklist (executed in cleanup)

- [ ] REQ-219 live in `functional-requirements.md`
- [ ] shared-chrome bullet live
- [ ] No leftover refs to the superseded Menu-tray REQ-219 content

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/tab-personality-color-sync/` ready to delete

## Observations

- 2026-10-04 (Playwright Chromium, dev server on :5391 from the build worktree, 390x844, real Theme buttons clicked in the menu, no reload — a window marker survived every switch). Earned C1, C2, C3, C4.
  - White: motif beams, theme-color #ede7d6, favicon contains #ede7d6 and no currentColor, title "TheJudge · MTG Assistant".
  - Blue: runes, #0050d8, same checks.
  - Black: fog, #7c3aed, same checks.
  - Red: embers, #c10230, same checks.
  - Green: leaves, #0a7a42, same checks.
  - Colorless: geometry, #52525b, same checks.
  - Six favicon hrefs differ (lengths 957, 906, 1088, 897, 1447, 909); exactly one icon link and one theme-color meta throughout.
  - Custom Colorless #ff8800: theme-color #ff8800, favicon drawn in #ff8800, title unchanged.
  - Capture: `PRD/work/tab-personality-color-sync/.playwright-mcp/favicon-strip-390.png` (the six live data-URL icons rendered with their theme-color values).
- 2026-10-04 cleanup (C5): `browser_close` called; dev server task stopped; `lsof -iTCP:5391 -sTCP:LISTEN` empty; no vite process left.
