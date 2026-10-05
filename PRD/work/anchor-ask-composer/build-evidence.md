# Build evidence — anchor-ask-composer

Measured in a Playwright browser against this worktree's own Vite dev server (port 5391), card data from the local dev data, `/api/ask-ai` answered by a route stub (no backend). Captures: `PRD/work/anchor-ask-composer/.playwright-mcp/`.

## Slice A
2026-10-05 A4 — Ask a Question, 1440x716, 5 cards + 300-char question: document scrollHeight 716 = viewport, send pill bottom 675.8, stage still visible (363px, region-scrolls). `ask-5cards-1440x716.png`
2026-10-05 A5 — Ask a Question, 390x740, 300-char question: document 740 = viewport, send pill bottom 699.8, stage visible. `final-ask-390x740.png`
2026-10-05 A6 — 1440px: Ask column 576px (36rem); scanner open column 504px (31.5rem). `scanner-1440x716.png`
2026-10-05 A7 — Phone search-fold hides the stage while search is open (display none), restores on close; answered view shows the follow-up composer (stubbed answer) and the card-detail popup opens and closes from the View chip. `answered-390x740.png`, `popup-390x740.png`
2026-10-05 A8 — Browser closed, Vite on 5391 stopped, port released (lsof shows no listener).

## Slice B
2026-10-05 B3 — In-depth Enrichment, 1440x716, 5 context cards + 300-char question: document 716 = viewport, send pill bottom 675.8, review list region-scrolls (scrollHeight 298 in 243). `indepth-enrichment-5cards-1440x716.png`
2026-10-05 B4 — Same at 390x740: document 740, send pill bottom 699.8. `indepth-enrichment-5cards-390x740.png`
2026-10-05 B5 — In-depth Enrichment column 576px at 1440. `final-indepth-1440x716.png`
2026-10-05 B6 — Game, Zones and Cards stations render plain `page-shell` (content-sized, no frame) at 1440x716 and 390x740. `indepth-cards-5-1440x716.png`, `indepth-zones-390x740.png`
2026-10-05 B7 — Browser closed, Vite on 5391 stopped, port released.

## Slice C
2026-10-05 C3 — Keyboard simulated with a stub `visualViewport` (height 400 on a 390x740 window): frame height 400; Ask send pill bottom 359.8, In-depth send pill bottom 397.6, both inside 400. Found and fixed during this check: `.page-shell`'s `min-height: 100dvh` kept the frame tall, and the 176px text cap pushed the pill past 400; frame now `min-height: 0` and the cap is 22% of the visible height. `keyboard-ask-390x400.png`, `keyboard-indepth-390x400.png`
2026-10-05 C4 — Browser closed, Vite on 5391 stopped, port released.

## Slice D
2026-10-05 D6 — Final pass after the last CSS change, fresh browser context: Ask 1440x716 doc 716 / pill 675.8 / stage 363; Ask 390x740 doc 740 / pill 699.8 / stage 359; In-depth 390x740 doc 740 / pill 699.8; In-depth 1440x716 doc 716 / pill 675.8; cards visible in each. `final-*.png`
2026-10-05 D7 — Browser closed, Vite on 5391 stopped, port released.
