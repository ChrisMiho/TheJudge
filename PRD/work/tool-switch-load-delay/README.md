---
status: owner-action
---

# tool-switch-load-delay

Players see a few seconds of loading when first opening the Life Tracker, then the Trade Balancer, from the question flow. See `IDEA.md`.

## Evidence (code read only, nothing run or measured)

Facts from the code. Which of these costs the seconds is unmeasured; refinement must measure it live before trusting any of it.

- Each tool is a separate lazy-loaded piece fetched on first open, with a "Loading…" fallback: `apps/frontend/src/components/portal/destinationRegistry.tsx` (`lazyDestination`, lines ~15-55) and `apps/frontend/src/components/portal/DestinationOutlet.tsx` (`DestinationLoadFallback`, `Suspense` per tool).
- Production never preloads the other tools: the preload helper (`preloadPortalDestinations`, destinationRegistry.tsx ~line 61) is called only from `apps/frontend/src/test/setup.ts`. So the first open of each tool starts its download from zero.
- Visited tools stay mounted and hidden, so only the first visit to each tool is slow: `DestinationOutlet.tsx` (`mountedDestinationIds`).
- Trade Balancer on mount downloads `/data/cardMetadata.json` (about 4.9 MB on disk, `apps/frontend/public/data/cardMetadata.json`) and then builds a name search index over every card: `apps/frontend/src/components/trade/TradeBalancer.tsx` (~lines 140-180, `METADATA_URL`), `apps/frontend/src/components/trade/oracleSearch.ts` (`buildOracleSearchIndex`). Search is unusable while `isMetadataLoading`.
- Trade Balancer also fires a fire-and-forget `GET /api/health` on open (REQ-064 warm-up, `TradeBalancer.tsx` ~line 175). It wakes a cold backend but does not block the screen.
- Chunk split config: `apps/frontend/vite.config.ts` `manualChunks` (vendor and scan groups only); no per-tool prefetch hint.
- Life Tracker has no data fetch found on entry in the search done; its delay, if any, is the code download alone (`components/portal/life-tracker/PlayerLifeTrackerApp`). Not confirmed.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/tool-switch-load-delay

## Evidence ranking

Likely sources, in order of suspicion: (1) Trade Balancer's 4.9 MB card list download on open; (2) first-open code downloads with no head start; (3) the scan group shared chunk if the tool pulls it in. All unmeasured. (Superseded by define's live measurements in `evidence/measurements.md`: the code download is 0.2–0.7 s per tool; the multi-second wait is the card list on a slow network.)

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/tool-switch-load-delay/DESIGN-BRIEF.md`
- Findings: none blocking (four advisory notes in `QUALITY-CHECK.md`: the fix removes 0.2–0.7 s per tool, while the only multi-second wait measured — the Trade Balancer card list on Slow 4G, 9.7 s — is follow-up F1, out of scope; NFR-014 dependencies hunk should append REQ-064 after REQ-066; the acceptance script `.playwright-mcp/measure.js` is gitignored and the 50 ms comparison is noise-sensitive; the no-fallback-frame claim is a build-time check covered by criteria 1, 2 and 6)
