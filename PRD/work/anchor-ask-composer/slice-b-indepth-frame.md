# Slice B — Frame In-depth Enrichment

## Status: done

## Goal

At the In-depth Enrichment station the per-card context list flexes and region-scrolls and the question box is pinned at the bottom, growing upward in place. Game, Zones and Cards stay content-sized (DEC-145).

## Requirements

1. REQ-218 and REQ-110 on the In-depth Enrichment surface.
2. `EnrichmentStep.tsx` composer-surface `PageShell` (line ~737) switches `narrow` to `narrow-fit`. The conversation-active shell (~653) and the earlier steps keep `narrow`.
3. The per-card context list is `flex:1; min-height:0` and region-scrolls; composer pinned; column stays 36rem / 92vw.
4. Reuse slice A's CSS; no new frame.

## Acceptance criteria

- [x] Enrichment composer surface renders `narrow-fit`; Game, Zones and Cards steps and the answered conversation shell still render `narrow`; unit test asserts both
- [x] EnrichmentStep unit tests pass
- [x] At 1440x716 on In-depth Enrichment with a 300-character question and several context cards, document scroll height is no greater than the viewport and the send pill `bottom` is inside the viewport (measured in browser)
- [x] Same at 390x740 (measured in browser)
- [x] At 1440px the In-depth Enrichment column measures 576px (measured in browser)
- [x] Game, Zones and Cards steps remain content-sized with no frame at 1440x716 (browser walk)
- [x] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/anchor-ask-composer/.playwright-mcp/`

## Verification

```bash
npm --workspace apps/frontend run test -- EnrichmentStep MtgAssistantApp
npm run typecheck
```

## Files touched

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/EnrichmentStep.test.tsx`
- `apps/frontend/src/index.css`
