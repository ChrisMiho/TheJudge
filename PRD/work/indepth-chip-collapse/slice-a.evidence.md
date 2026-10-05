# Slice A manual evidence (2026-10-05, build attempt 2)

Observed live on the build worktree's own Vite dev server (port 5391), Playwright, reading the computed display of `.q-box .deep .lbl`.

- A2: 2026-10-05, 1440px, label display was `block` at rest and `none` the moment the textarea was focused.
- A3: 2026-10-05, 1440px, after typing "hello" and blurring the textarea, label display stayed `none`.
- A4: 2026-10-05, 1440px, empty and unfocused, keyboard focus on the In-depth chip, the mic (Dictate question) and the send (Ask TheJudge) button each left label display at `block`.
- A5: 2026-10-05, 1440px, after clearing the text and blurring, label display returned to `block`.
- A6: 2026-10-05, 390px, label display was `none` at rest, on textarea focus, with text after blur, empty after blur, and with the chip focused.
- A10: 2026-10-05, browser closed (browser_close), dev server stopped, `lsof -i :5391` shows nothing listening; captures live in `PRD/work/indepth-chip-collapse/.playwright-mcp/` (rest-1440.png, collapsed-1440.png, collapsed-390.png).
