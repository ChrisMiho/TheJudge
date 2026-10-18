# Live scanner measurements — 2026-10-18

What happened: the three scanners were opened live and measured. In-Depth's ✕
covers the caution triangle at both widths; Quick Question and Trade Balancer
do not. A failed scan-data download stays failed after the network recovers.

## How it was measured

- Frontend dev server (Vite) from this worktree on port 5181, frontend only
  (`apps/frontend`, `vite --port 5181 --strictPort`). Stopped afterwards; port
  5181 confirmed free.
- Playwright Chromium. No real camera: `navigator.mediaDevices.getUserMedia`
  was replaced before page load with a canvas stream (a plain coloured frame
  with a white card-shaped rectangle). Every scanner opened and rendered its
  full camera surface.
- Widths: phone 390×844, desktop 1280×800.
- Element boxes are `getBoundingClientRect()` in CSS pixels, rounded:
  `x, y, width × height` (right / bottom edges in brackets).
- "On top at caution centre" is `document.elementFromPoint()` at the centre
  of the caution triangle: what a tap there actually hits.
- Screenshots: `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/`
  (gitignored, local only).

## Exit ✕ versus the caution triangle

| Tool | Width | Exit ✕ box | ✕ control | Caution triangle box | Camera frame box | Head row | Overlap | On top at caution centre |
|---|---|---|---|---|---|---|---|---|
| Quick Question | 390 | 330,77 44×44 (374/121) | `.scan-exit`, 44 px rounded square (radius 11.2 px) | 318,143 44×44 (362/187) | 16,134 359×540 (374/674) | `.flow-head` 16,77 359×44, title "Scan a card" | no | caution |
| Quick Question | 1280 | 848,81 44×44 (892/125) | same | 836,147 44×44 (880/191) | 388,138 504×672 (892/810) | `.flow-head` 388,81 504×44 | no | caution |
| Trade Balancer | 390 | 326,379 40×40 (366/419) | `.icon-round`, 40 px circle | 310,441 44×44 (354/485) | 24,431 342×540 (366/971) | `.scan-head` 24,379 342×40, title "Scanning onto Side A" | no | caution |
| Trade Balancer | 1280 | 583,333 40×40 (623/373) | same | 567,394 44×44 (611/438) | 204,385 419×558 (623/943) | `.scan-head` 204,333 419×40 | no | caution |
| In-Depth (Cards station, Battlefield) | 390 | 313,219 40×40 (353/259) | `.icon-round absolute right-3 top-3 z-10`, 40 px circle, over the camera | 309,217 44×44 (353/261) | 25,207 341×540 (365/747) | none — ✕ sits inside the camera box, no title | **yes — ✕ fully inside the caution box** | **Exit ✕** |
| In-Depth (Cards station, Battlefield) | 1280 | 867,219 40×40 (907/259) | same | 863,217 44×44 (907/261) | 361,207 504×672 (865/879) | none | **yes** | **Exit ✕** |

Readings:

- In-Depth: the 40 px ✕ sits entirely inside the 44 px caution box and
  wins every tap there. The player cannot see or open the "scanning is
  experimental" note in In-Depth. Screenshot `indepth-phone-390.png` shows
  only the ✕ in the corner. The intake's code-read suspicion is confirmed.
- Quick Question and Trade Balancer: the ✕ sits in a row above the camera,
  its right edge lined up with the camera's right edge (374 = 374; 366 = 366;
  892 = 892; 623 = 623). No overlap.
- The ✕ differs between tools: a 44 px rounded square in Quick Question
  (what the mockup `docs/design/ui-reimagining/direction-1/card-scan.html`
  draws as `.scan-exit`) versus a 40 px circle in Trade Balancer and In-Depth.
  REQ-214 calls for "a square box carrying an X".
- Side notes, not in scope: the Quick Question camera frame ends at 810 px
  in an 800 px desktop window; Trade Balancer's camera ends below the phone
  window (971 in 844), inside its side panel.

## Failed scan-data download (Quick Question, 390 wide)

- The fingerprint file `/data/cardhashes.bin` was made to answer `503`, then
  the scanner was opened. The panel showed the raw text
  `Could not load card hash DB: 503 Service Unavailable`
  (screenshot `qq-load-failure-phone-390.png`). That paragraph has no
  `role="alert"` in Quick Question.
- The failure was then lifted (normal file served again). The scanner was
  closed with ✕ and opened again. After four seconds it still showed the same
  `503` text: the failure stuck for the rest of the session, as the intake
  says. The camera picture still rendered beneath the error.

## Scan map shapes (measured from the committed file)

Script: a short Node read of `apps/frontend/public/data/cardScanMap.json` and
`cardMetadata.json`, gzip level 9. Measured because the intake's claim that
`name` is never read is true for the app but not for the repo (see below).

| Shape | Raw | Gzip |
|---|---|---|
| Today `{ oracleId, name, imageUrl }` | 21.57 MB | 6.51 MB |
| `{ oracleId, name }` (image derived from printing id) | 11.21 MB | 5.28 MB |
| `printingId → oracleId` only | 7.48 MB | 3.98 MB |

- 95,895 entries; 32,638 distinct cards (oracle ids).
- Every `imageUrl` equals the printing-id template in `lib/cardImage.ts`
  plus a `?<timestamp>` suffix: 0 mismatches, 0 empty.
- 405 cards (1,045 entries) are absent from `cardMetadata.json`. The local
  practice-suite name lookup (`scripts/lib/practice-suite-card-names.mjs`,
  REQ-232) takes those 405 cards' names from the scan map's `name` field.
  Dropping `name` breaks that lookup for them.
