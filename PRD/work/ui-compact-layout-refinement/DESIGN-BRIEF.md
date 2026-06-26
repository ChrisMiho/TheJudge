# DESIGN-BRIEF: ui-compact-layout-refinement

## Goal

Reduce vertical scroll across the staged flow through a presentation-only compaction pass: smarter list layouts, scan-mode focus, and an optional global **Chunky / Slim** layout-density toggle in the theme panel. **Chunky** is the default and must match current spacing (regression guard). Zone confirmation (`ZoneConfirmStep`) is explicitly unchanged.

## Problem

Every flow screen duplicates a tall page shell (`min-h-screen` + `max-w-2xl` card with generous padding and gaps). Inner panels repeat padding and unbounded vertical lists. Document scroll is the default everywhere except the conversation thread. Worst offenders: enrichment list mode, zone collection + scan, and game context (hero image, duplicate turn-phase / active-player panels). Users who want tighter layout only have palette control (DEC-066), not spacing density.

## Scope

| Screen / area | Change |
| --- | --- |
| **Game context** | Hide cat-wizard hero by default; reveal after 10 brand clicks (session-only, no hint); merge turn phase + active player into one panel; wider player +/- buttons; remove `(recommended)` from active-player labeling |
| **Zone collection** | 2×2 card tile grid (max 4 visible, scroll rest) for all zones including stack; remove the empty-state **"Select a suggestion to preview and add a card to …"** placeholder; while scan is open, hide search, list, preview, and owner select; **Exit scan** on camera top-right; remove `Scan card` heading |
| **Enrichment** | View all cards: per-zone cap of 4 full-width edit rows then scroll; card-by-card wizard unchanged |
| **Global density** | Chunky / Slim toggle in `ThemeControl`; `data-layout-density` on `document.documentElement`; shared `PageShell` + CSS density tokens; slim pass tightens high-scroll surfaces |
| **Unchanged** | Zone confirmation step; flow logic; `AskAiRequest` / Zod / prompt / backend; scan matching / stabilizer |

### Scroll-cap pattern (both densities)

| Surface | Layout | Cap |
| --- | --- | --- |
| Zone card list | 2-column tile grid | 2 rows = 4 tiles, then scroll |
| Enrichment list mode | Full-width edit rows per zone | 4 rows per zone, then scroll |

Slim density (slice F) tightens spacing further but keeps the same 4-item caps.

### Scan UX (approved)

The low-confidence **"Still no confident scan match / Use manual search"** prompt is removed. While the camera is open, manual search is reached only via **Exit scan** (DEC-050 fallback). Manual tap-to-capture on the scan screen is unchanged (DEC-052).

### Cat Easter egg (approved)

Session-only (`useState` in `App.tsx`); no localStorage; no hint text; game context step only.

## Decisions

- **DEC-075** (new, `decisions/personalization.md`) — global **Chunky / Slim** layout density: mirrors palette pattern (`thejudge.theme.layoutDensity`, `document.documentElement.dataset.layoutDensity`, default `chunky`). Distinct from DEC-066's per-component theme-override non-goal — this is a global density token system.
- **DEC-076** (new, `decisions/personalization.md`) — staged-flow presentation compaction: game-context layout, zone card grid, enrichment list scroll cap, and scan-focused zone-collection chrome (hide redundant UI while camera open; Exit on camera). Presentation only; zone confirmation excluded.

## Requirements / Flows

- **REQ-055** (new) — layout density preference (toggle, persistence, chunky regression, no workflow reset).
- **REQ-056** (new) — staged-flow screen compaction acceptance criteria (game context, zone grid, scan focus, enrichment cap).
- **FLOW-008** (new) — choose and persist layout density alongside palette in the theme panel.
- **FLOW-001**, **FLOW-002**, **FLOW-006** — presentation notes/edge-case updates for compaction and scan chrome (no flow-logic change).

## Non-goals / frozen boundaries

- No change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, provider selection, backend routes, card metadata, or scan matching/stabilizer logic
- No viewport locking, sticky footers, or `dvh` page-shell redesign
- No server-synced preferences or account settings
- No full design-system rewrite of every Tailwind utility
- Touch targets stay ≥ `min-h-[2.75rem]` on primary controls; body text not below existing `text-sm` / `text-xs`
- Chunky mode must match pre-change visuals on reference screens

## Validation

```bash
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run quality:check
```

Manual spot-check: game context (Easter egg, merged panels); zone collection (grid scroll at 5+ cards, scan hides chrome); enrichment list scroll; theme panel Chunky/Slim toggle + reload persistence; answered state unaffected.

## Open questions

None blocking.

## Implementation map

[GAMEPLAN.md](GAMEPLAN.md) and lettered slices remain the implementation plan. Slice G promotes DEC-075/REQ-055/REQ-056 and runs ship gates after slices A–F.
