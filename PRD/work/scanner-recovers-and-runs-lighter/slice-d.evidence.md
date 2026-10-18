# Slice D evidence

## Attempt 1 (parked)

- 2026-10-18: a rebuild with `npm run data:scan-map` over the owner's local card dump gave 99,814 entries against the committed 95,895 (3,936 new printing ids, 17 gone, 4 with a changed `oracleId` or `name`). The local dump is a newer Scryfall snapshot than the one behind the committed map and `cardhashes.bin`. The rebuilt map was reverted and never committed. Before it, all 95,895 committed `imageUrl` values were checked: each equals `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg` plus a `?<timestamp>` suffix (0 exceptions).

## Attempt 2 (owner decision, `GRAPH-RUN.md` `## Open gate`)

- 2026-10-18 D3: `npm run data:scan-map:slim` (`scripts/slim-card-scan-map.mjs`, tested by `scripts/slim-card-scan-map.test.mjs`) printed `Entries: 95895`. It reads the committed map, drops only `imageUrl`, writes compact JSON in the same key order.
- 2026-10-18 D4 comparison against `git show HEAD:apps/frontend/public/data/cardScanMap.json` (script run from the worktree `.tmp/`, since removed):
  - committed keys: 95895
  - slim keys: 95895
  - key order identical: true
  - entries differing in oracleId, name, or having extra fields: 0
  - committed entries with imageUrl: 95895
  - slim entries with imageUrl: 0
  - file byte-identical to committed minus imageUrl: true
- Idempotent: the slim step was run repeatedly; the file sha1 stayed `138ff50216b087bf552e6aa16108ca0305b387a3`. The test also asserts a second run changes nothing.
- 2026-10-18 D9 size: `gzip -c apps/frontend/public/data/cardScanMap.json | wc -c` printed 5,310,581 (about 5.31 MB). Committed map before: 6,552,206 (`git show HEAD:... | gzip -c | wc -c`). Raw 11,208,366 bytes. The brief's 5.28 MB figure was an estimate; the measured value is recorded in `PRD/sections/scan/data/cardScanMap.md`.
- 2026-10-18 D5 (manual): no card dump was read or linked this attempt: no symbolic link, no `npm run data:scan-map` over a dump, and nothing from it is staged.
- 2026-10-18 D6 (manual): no `npm run data:refresh` and no Scryfall download was run.
- 2026-10-18 D11 (manual): dev server on 127.0.0.1:5392. In the page, the served `/data/cardScanMap.json` held 95,895 entries and printing `0000419b-0bba-4488-8f7a-6194544ce91e` was `{ oracleId, name: "Forest" }` with no image field. The real `resolveScanCandidatesRanked` returned `scanImageUrl` `https://cards.scryfall.io/normal/front/0/0/0000419b-0bba-4488-8f7a-6194544ce91e.jpg`; loading it in an img element succeeded (naturalWidth 488). A full camera scan was not possible without a camera, so this drives the resolver on live served data. Capture: `.playwright-mcp/d-derived-picture.png`. The `App.zoneFlow` test also asserts the auto-added scanned card shows the derived picture.
- 2026-10-18 D12 (manual): `browser_close` called; the owned dev server (port 5392, pid 22097) stopped with `kill 22097`; `lsof -ti :5392 -sTCP:LISTEN` printed nothing (port free). Capture written under this worktree's `PRD/work/scanner-recovers-and-runs-lighter/.playwright-mcp/` by absolute path.
- 2026-10-18 D10: frontend tests 154 files / 1666 tests passed; `npm run test:scripts` 1061 pass, 0 fail; typecheck, lint, format:check, `quality:check` and the frontend production build exited 0. One fix on the way: `App.zoneFlow.test.tsx` expected the card name as text, but a scanned card now shows its derived picture, so it asserts the picture's address instead.
