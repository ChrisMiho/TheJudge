# Slice B — Add-card search box mirrors the question-box pill

## Status: planned

## Goal

Give the card-search input (`.search-row .field`, `.search-pop`) the `.q-box` composer's pill radius, panel fill and soft accent frame, keeping glyph, placeholder, Escape-to-close, suggestions, printing picker and the 44px floor.

## Requirements

1. REQ-206 (composer shape reference)
2. REQ-207
3. REQ-205 (44px floor)

No product-truth change. The `.search-row`/`.field` classes are shared with Ask a Question; scope the change as the implementer judges safest (shared class or `.side .search-row .field`). Either reading is valid. Do not alter the global `.field` rule in shell.css, which other forms use.

Browser risk: yes (geometry, hit area). Dependencies: none (parallel-ready).

## Acceptance criteria

- [ ] B1: The search input's computed `border-radius` matches `.q-box`'s (`1.6rem` pill) and its fill is `--surface-panel` with the soft accent frame, via rules in `flow.css` (or `index.css` `.side` scope)
- [ ] B2: `TradeSide.tsx` markup, the `⌕` glyph, placeholder, Escape-to-close, suggestion list and printing picker are unchanged; existing trade and search tests pass
- [ ] B3: Visual: desktop 1440x900, open Add card on a Trade side; the box and the Ask a Question composer read as one family (same silhouette, fill, frame); input height >= 44px (manual)
- [ ] B4: Visual: phone 390x844, same comparison; no horizontal overflow, glyph stays inside the pill, suggestion list still scrolls (manual)
- [ ] B5: Visual: the Ask a Question card search still looks correct if the shared class was changed (manual)
- [ ] B6: Browser closed, owned dev server stopped, ports released; captures written under `PRD/work/ui-pass-2/.playwright-mcp/` (manual)
- [ ] B7: Frontend typecheck passes

## Verification

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/styles/flow.css`
- `apps/frontend/src/index.css` (only if scoping under `.side`)

Evidence for manual criteria: dated lines in `slice-b.evidence.md`.
