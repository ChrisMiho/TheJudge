# Slice C evidence (manual criteria)

- 2026-10-04 C3 — phone 390x844 with three seeded history entries: Delete sits in its own right-hand column on every row; bounding boxes do not intersect the answer line, the chevron, or the row button. Capture: `c-phone-history.png`.
- 2026-10-04 C4 — Delete box is 66px wide and 92px high (>= 44px); tapping it opened the confirm sheet, Keep closed it with all 3 entries kept, tapping a row resumed the conversation and closed the drawer.
- 2026-10-04 C5 — desktop 1440x900: zero `.history-item-delete` buttons render (isWide path) and `.history-item` stays `display: block`. Capture: `c-desktop-history-unchanged.png`.
- 2026-10-04 C6 — Playwright browser closed, vite and mockup server stopped, ports 5391/5392 free; captures under `PRD/work/ui-pass-2/.playwright-mcp/`.
