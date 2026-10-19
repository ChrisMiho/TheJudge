# Live measurements — browser-smoke-suite (define, 2026-10-18)

**What happened:** the production frontend was built, served next to the built
backend (mock AI), and opened in a real Chrome through Playwright MCP. Every
tool opened and its most basic action worked, at desktop and phone width, with
zero console errors and zero failed requests to the two local servers.

**What it means for you:** a browser smoke check is practical: the site builds
in about 4 seconds, boots in under a second, and each tool's basic action
finishes in milliseconds against the mock AI. Nothing on a PR runs it today.

Environment: macOS arm64, Node v26.0.0, Chrome 155 (Playwright MCP), worktree
`.worktrees/session-ci-smoke`, branch `thejudge-auto/browser-smoke-suite`.

## 1. Frontend production build

Command (the same script the deploy runs, `scripts/aws-deploy.sh:118-121`,
with a local API address):

```
VITE_API_URL=http://localhost:4317 VITE_DEBUG_LOGGING=false ASK_AI_PROVIDER=mock \
  npm --workspace apps/frontend run build      # = tsc -b && vite build
```

| Run | Wall | `vite build` alone | Notes |
| --- | --- | --- | --- |
| first (no `dist/`, `tsconfig.tsbuildinfo` written by this run) | 4.80 s | 1.39 s | 441 modules |
| second (warm `tsbuildinfo`) | 3.73 s | 1.35 s | |

A clean-slate rerun (delete `dist/` and `tsbuildinfo` first) was not possible:
`rm -rf` is denied by the graph boundary hook. The first run's
`tsconfig.tsbuildinfo` carried that run's timestamp, so it is treated as cold.

Output, `apps/frontend/dist/` (gitignored by `dist/`, `.gitignore:33`): **33 MB**
total — 29 MB `data/`, 4.0 MB `assets/`, plus `fonts/`, `robots.txt`,
`.well-known/`, `index.html`.

Chunks (raw / gzip):

| Chunk | Raw | Gzip |
| --- | --- | --- |
| `index.html` | 0.75 kB | 0.45 kB |
| `index-*.css` | 201.06 kB | 33.82 kB |
| `index-*.js` (shell) | 79.82 kB | 27.59 kB |
| `vendor-*.js` (react, react-dom, react-router) | 178.06 kB | 58.35 kB |
| `ConversationWorkspace-*.js` | 182.25 kB | 56.18 kB |
| `MtgAssistantApp-*.js` (In-Depth) | 59.19 kB | 18.09 kB |
| `scan-*.js` | 43.01 kB | 15.63 kB |
| `PlayerLifeTrackerApp-*.js` | 25.94 kB | 7.78 kB |
| `TradeBalancer-*.js` | 22.30 kB | 7.88 kB |
| `QuickLookupApp-*.js` | 11.36 kB | 4.20 kB |
| `ScanPanel-*.js` | 11.21 kB | 3.80 kB |
| `playerLabels-*.js` | 0.20 kB | 0.17 kB |

The API address is baked into the shell chunk at build time:
`grep -o localhost:4317 dist/assets/*.js` → `index-Can870Y0.js`.

Data files the built site downloads, all **committed** (`git ls-files
apps/frontend/public`):

| File | Size in `dist/data/` | Fetched when |
| --- | --- | --- |
| `cardMetadata.json` | 5.1 MB (1.97 MB over the wire, gzip) | card search, and the idle background download on every page |
| `cardhashes.bin` | 13 MB | scanner opens |
| `cardScanMap.json` | 11 MB (5.3 MB over the wire) | scanner opens |
| `gameRulesCoreTopics.json` | 12 KB | rules topics |
| `cardhashManifest.json`, `cardhashSkiplist.json` | 4 KB each | scanner |

## 2. Backend build and boot

`npm --workspace apps/backend run build` — 1.08 s wall; `apps/backend/dist/`
388 KB (gitignored).

Started with the Bash tool's background option (owned by this agent):

```
env -u ASK_AI_PROVIDER -u EMBEDDING_PROVIDER -u OPENAI_API_KEY -u NODE_ENV \
  PORT=4317 node apps/backend/dist/index.js
```

Startup log: `askAiProvider: "mock"`, `frontendOrigin: "(unset)"`, 37,854 card
details, 37,854 price entries, 19,996 rulings, 24 rules topics, 2,894 rules.
No warning or error lines in the whole run. `GET /api/health` → `200
{"ok":true}` in 3.5 ms.

With `FRONTEND_ORIGIN` unset the backend's `cors()` allows every origin
(`apps/backend/src/app/createApp.ts:47`). Production sets one allowed origin
(`scripts/aws-deploy.sh:108`). This run therefore did not exercise the
single-origin CORS path; the design sets `FRONTEND_ORIGIN` so it does.

## 3. Serving the built site

`npx vite preview --port 4318 --strictPort --host 127.0.0.1` from
`apps/frontend` (owned, background). Deep links `/trade-balancer` and
`/in-depth` answered `200` with the app shell (single-page fallback, the same
effect as CloudFront's 403/404 → `/index.html` mapping in
`scripts/aws-bootstrap.sh`).

## 4. Browser run, desktop (1200 × 672)

First load of `/` (redirects to `/quick-lookup`): DOMContentLoaded 44 ms, first
contentful paint 164 ms. After idle, the background download fetched every
other tool's chunk plus `cardMetadata.json` (137 ms) — NFR-014's tiers working
in the real bundle.

| Tool | Basic action performed | Result | Requests seen |
| --- | --- | --- | --- |
| Ask a Question (Quick Question, `/quick-lookup`) | typed "Does Sol Ring have summoning sickness?" in "Magic question", pressed Enter | mock answer rendered in the conversation log ("MOCK RESPONSE …"), follow-up box appeared | `POST /api/ask-ai` 200 |
| Menu → Life Tracker (`/life-tracker`) | opened ☰ "Switch feature", chose "Life Tracker", tapped "Decrease life for Player 1" | URL changed; four players at 40; Player 1 read "Player 1, 39 life" | none (local only) |
| Trade Balancer (`/trade-balancer`, deep link) | Side A "Add card", typed "Sol Ring", picked "Sol Ring", tapped the first printing's nonfoil price ($1.19) | Side A total and scale read $1.19 | `GET /api/health` 200, `GET /api/cards/6ad8011d-…/prices` 200 |
| In-Depth Question (`/in-depth`, deep link) | "Confirm game context" → Continue (zones) → "Add a card to Battlefield", "Sol Ring", "Add card" → Continue → "OK — finish context" → "Decrypt Stack" | mock answer rendered; screen returned to the answered conversation | `GET /api/cards/6ad8011d-…` 200 (2 ms), `POST /api/ask-ai` 200 (46 ms) |
| Scanner (from Ask a Question, "Scan a card") | opened the scan panel | panel and camera frame rendered; scan data downloaded: `cardhashes.bin` 13.0 MB in 26 ms, `cardScanMap.json` 5.3 MB in 252 ms; camera permission stayed at "prompt", so no video frames (video 0 × 0) and no error indicator | static only |

The menu has no In-Depth row: it is reached through the "In-depth" chip in the
question box or the `/in-depth` URL (`apps/frontend/src/App.tsx:35-36`).

Card images load from `https://cards.scryfall.io/…` — an outside host. Locally
they loaded; a CI run should not depend on it (see the design).

## 5. Browser run, phone (390 × 844)

| Check | Result |
| --- | --- |
| Trade Balancer deep link, ☰ → "Send feedback" | feedback dialog opened; it read "Feedback delivery isn’t configured in this build, so sending is unavailable right now." (no Formspree id in this build) |
| Ask a Question, typed "What is the stack?", Enter | mock answer rendered |
| Horizontal scroll | `scrollWidth` 390 = `innerWidth` 390 on both screens |

## 6. Console and network over the whole session

`browser_console_messages` (level warning, all messages since session start):
**0 errors, 0 warnings.** No local request returned 4xx/5xx.

## 7. Screenshots

Under `PRD/work/browser-smoke-suite/.playwright-mcp/` (gitignored, not
committed):

- `01-quick-question-answered.png`
- `02-life-tracker-minus-one.png`
- `03-trade-balancer-sol-ring-added.png`
- `04-in-depth-answered.png`
- `05-scanner-opened.png`
- `06-phone-feedback-modal.png`

## 8. The production build already runs on every PR — it is just never opened

`scripts/frontend-public-static-files.test.mjs:54-90` runs a real `vite build`
inside `npm run test:scripts`, which the `static` CI job runs on every PR. It
asserts only that `robots.txt` and `.well-known/security.txt` were copied into
`dist/` (REQ-198). The frontend `typecheck` (`tsc -p tsconfig.json --noEmit`)
covers the same single `tsconfig.json` that `tsc -b` builds. So a PR already
proves the production bundle *compiles*; nothing proves it *runs*.

## 9. CI cost and what may differ on the runner

GitHub's `ubuntu-24.04` image (runner-images readme, image version
20261012.334.1) ships **Google Chrome 155.0.8059.39**, Chromium 155, Edge 155
and Firefox 157 preinstalled, with Node 22.23.3 default and Node 24.21.0
cached. The local Playwright MCP browser was also Chrome 155.

| Item | Cost |
| --- | --- |
| `playwright` npm package 1.64.1 | 5.0 MB unpacked + `playwright-core` 13.7 MB; no install script, so `npm ci` downloads no browser (`npm view playwright@1.64.1 scripts` is empty) |
| Using the preinstalled Chrome (`channel: "chrome"`) | no download |
| Alternative: Playwright's own headless browser | `chromium_headless_shell-1228` is 192 MB unpacked in the local cache (macOS arm64); would need a download per run or an `actions/cache` entry |
| Frontend build on the runner | ~4–5 s locally; not measured on x86 |
| Backend build + boot | ~1.6 s locally (#326 measured 1.2 s build, 0.5 s boot) |
| Browser steps | each action finished in well under a second locally; not measured on x86 |

Things that may behave differently on x86 Linux than on this Mac:

- **No GPU.** Headless Chrome on the runner renders on the CPU. The ambient
  background once fell to 4.7 fps under CPU rendering before the fix in #245.
  The suite must not time animation or assert frame rates; generous per-step
  timeouts only.
- **No camera.** The runner has no video device. Chrome's fake-device flags
  (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`)
  supply a synthetic test pattern and auto-grant permission. Not verified live
  here (the MCP browser's launch flags are fixed); the camera-frame assertion is
  conditional in the design.
- **`localhost` resolution.** The backend listened on IPv6 `*:4317`; the preview
  bound `127.0.0.1`. Using `127.0.0.1` for both the baked API address and the
  servers avoids a `localhost` → `::1` mismatch on Linux.
- **Floating-point last bits.** arm64 and x86 differ in `Math.log` last bits
  (bit PR #322). The suite asserts no scan recognition or numeric output, so
  this cannot affect it.
- **Fonts.** Linux renders different fonts; the suite asserts no pixels.

## 10. Process cleanup

| Item | Value |
| --- | --- |
| Owning session | this `define` subagent, graph run `graph-20261018-233939` |
| Worktree | `.worktrees/session-ci-smoke` |
| Backend | port 4317, pid 42632, started by the agent |
| Frontend preview | port 4318, pid 42667, started by the agent |
| `browser_close` | called |
| Stop | `kill 42632 42667`; both background tasks exited |
| Ports | `lsof -iTCP:4317 -iTCP:4318 -sTCP:LISTEN` → nothing listening; `ps -p 42632,42667` → no process |
| Captures | `PRD/work/browser-smoke-suite/.playwright-mcp/` |
