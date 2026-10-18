# Slice C evidence

- A4 check (C7) 2026-10-18: re-read every `screen-layout.md` row that mentions scan or the exit box (lines 36, 64, 113, 181-185, 205-214, 231). Only the `#### Scan camera surface` Chrome row (213) spoke of the exit box; it is the row replaced. Row 212 (Fit: "region overlays only", count pill must not displace the camera frame) and row 214 (Notes) stay true with a slim row above the camera. No other row edited.
- C9 (manual) 2026-10-18, dev server 127.0.0.1:5391, headless Chromium (no camera, so the camera chrome only). Measured with getBoundingClientRect:
  - In-Depth 390x844: exit 44x44 at right edge 365, camera frame right edge 365, exit bottom 251 above camera top 263, no title; caution 44x44 inside the frame (right 353).
  - Quick Question 390x844: exit 44x44, right 374 = frame right 374, title "Scan a card"; 1280x800: exit right 892 = frame right 892.
  - Trade Balancer 390x844: exit 44x44, right 366 = frame right 366, title "Scanning onto Side A"; 1280x800: exit right 623 = frame right 623.
  - Computed border radius 11.2px (rounded square) on all; one `.scan-exit` per page; caution button sits inside the camera frame on all three.
- C10 (manual) 2026-10-18: In-Depth Cards station scanner. 390x844: exit row top 207, Capture button bottom 794 (viewport 844); 360x740: Capture bottom 690; 360x640: Capture bottom 590. Exit row and Capture are both inside the viewport at scroll position 0 at all three sizes. The document is 176 px taller than the viewport at each size (scrollHeight 1020/916/816), i.e. page content below the camera remains scrollable; nothing needed on screen is pushed below the fold.
- C11 (manual) 2026-10-18: `browser_close` called; the owned dev server (port 5391) stopped with `kill <pid>`; `lsof -ti :5391 -sTCP:LISTEN` printed nothing. Captures: `.playwright-mcp/c-indepth-390x844.png`, `c-indepth-360x740.png`, `c-indepth-360x640.png`, `c-qq-390.png`, `c-qq-1280.png`, `c-trade-390.png`, `c-trade-1280.png`.
