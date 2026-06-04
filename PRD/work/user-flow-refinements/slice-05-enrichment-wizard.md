# Slice 05 — Enrichment wizard

## Status: complete

## Goal

One-card-at-a-time enrichment with slide transition; preserve full-list edit toggle.

## Requirements

- Default: wizard shows one card from `buildEnrichmentQueue`
- OK/Next advances; progress "Card N of M"
- CSS slide transition between cards (`enrichment-card-enter` in `index.css`)
- After last card: question + Decrypt Stack
- Toggle "View all cards" / "Card-by-card" for existing grouped list

## Files

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/index.css`
