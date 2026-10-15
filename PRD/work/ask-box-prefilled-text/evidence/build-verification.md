# Build verification — slice A live checks

Dev server: `vite` started by this run from the `implement-ask-box-prefilled-text` worktree on 127.0.0.1:5391 (frontend only), clean storage.

Typed `How does ward work?`, reloaded with no Menu trip: box held the text and the Draft held it. Cleared the box, reloaded: value `""`, Draft absent.

- Desktop 1440x900 at rest: value `""`, hint "What would you like to know?", `data-fill="0"`, not focused, In-depth button 96px with label `display: block`. After clicking into the box: 35px, label `display: none` (folded to ◈).
- Phone 390x844 at rest: value `""`, hint "Your question…", `data-fill="0"`, not focused, Draft absent, In-depth button 35px, label `display: none`.

Cleanup: browser closed (`browser_close`), vite task stopped by its task handle, port 5391 confirmed released (`lsof` empty). Captures only under `PRD/work/ask-box-prefilled-text/.playwright-mcp/` (`desktop-at-rest.png`, `phone-at-rest.png`).
