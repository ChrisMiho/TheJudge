# Graph-run brief — One card search box

Self-contained intake for `graph-kickoff`. Measured by the 2026-10-17 code health
probe; refinement can go straight to a DESIGN-BRIEF.

## What the player gets

- The card search box works the same on In-Depth, Quick Question and Trade Balancer:
  arrow keys and Enter pick a card everywhere, Escape follows one rule, the browser's
  own autofill list never covers the suggestions, and the loading and failure
  messages read the same.
- If the card list fails to download, In-Depth says so (today it shows only "No
  matching card found"), and a tool retries when the player comes back to it.
- Typing a long card name is faster on phones (about 4× less work per keystroke).

## Why (measured — do not re-derive)

1. **Three search boxes.** The same `.search-pop` / `.search-row` / `⌕` /
   `.search-results` markup is written three times: In-Depth
   `apps/frontend/src/components/ZoneCardPicker.tsx:193-228`, Quick Question
   `portal/quick-lookup/QuickLookupApp.tsx:641-690`, Trade `trade/TradeSide.tsx:294-345`.
   - Keyboard: In-Depth and Quick Question use the shared `useAutocompleteKeyboard`;
     Trade has only Escape (`TradeSide.tsx:305-308`).
   - Escape three ways: In-Depth first press closes the list, second closes search
     (`ZoneCollectionStep.tsx:418-427`); Quick Question one press closes everything
     (`QuickLookupApp.tsx:652-657`); Trade one press closes search.
   - Only Quick Question shows thumbnails (`QuickLookupApp.tsx:81-87, 684`) and sets
     `autoComplete="off"` (`:662`).
   - Loading text: "Loading cards..." (two pages) vs "Loading card list…" (Trade).
2. **The "＋ Add card / ▣ Scan" chip row** is copied three times and slightly drifted:
   `ZoneCollectionStep.tsx:320-348` (has `motion-focus`, `aria-controls`),
   `QuickLookupApp.tsx:588-616` (`aria-controls`, no `motion-focus`),
   `TradeSide.tsx:202-230` (neither).
3. **Card-list loading copied three times**, each failing differently:
   `portal/MtgAssistantApp.tsx:289-307` only `console.error`s; `QuickLookupApp.tsx:255-273`
   shows "Card search is unavailable…"; `trade/TradeBalancer.tsx:141-162` shows copy
   plus the raw reason ("(Card list fetch failed with status 503)"). None retries:
   visited tools stay mounted (`DestinationOutlet.tsx:41-62`) and the effect is
   mount-only. The shared store (`lib/cardMetadataStore.ts`) is healthy and does clear
   failures — only the per-screen effect is copied.
4. **Typo matching allocates a full matrix per name.** `lib/search.ts:26-49`; also used
   by `trade/oracleSearch.ts:58`. Over the real 34,639-card list, desktop:

   | Query | Calls | Today | Two-row typed-array version |
   |---|---|---|---|
   | `lightning bolt` | 14,346 | 21.5 ms | 5.6 ms |
   | `l` | 19,080 | 7.5 ms | 3.2 ms |
   | `urborg tomb of yawgmoth` | 4,058 | 12.4 ms | 3.8 ms |

   Phones are 3–6× slower; REQ-002 says suggestions should feel immediate.
5. **Trade search re-runs on every render.** `TradeSide.tsx:98` calls
   `searchOracleIndex` in render with no memo, on two sides — every price arrival,
   quantity tap and scan update rescans 34,639 entries.
6. **In-Depth rebuilds its search index per Cards-station visit**
   (`ZoneCollectionStep.tsx:104-107`, remounts per visit at `MtgAssistantApp.tsx:1090`;
   16.7 ms per build).

## Decisions already made — do not re-litigate

- The two ranking engines stay separate: REQ-002 says each search keeps its ranking
  (3 results vs 8, different tie-breaks). Consolidate the box, not the ranker.
- Each screen keeps its own search index (NFR-014). Lifting In-Depth's index to the
  screen level keeps that; sharing one index across screens is out of scope.
- The typo-matching rewrite is the same algorithm over the same code units, so every
  ranking stays identical; the existing REQ-002 tests are the check.
- No debounce is added to Trade search (that would change the feel); memoise only.

## Open decisions for the define gate

1. The one Escape rule (recommendation: In-Depth's — first press closes the list,
   second closes the search).
2. Thumbnails in results on every tool, or Quick Question only.
3. One card-list failure message for every tool, and whether it drops Trade's raw
   reason (recommendation: one message, no raw reason).
4. Whether the chip row aligns `motion-focus`/`aria-controls` across tools
   (recommendation: yes, all three get both).

## Design direction (converged)

- One `CardSearchPop` component: input, results list, shared keyboard hook, optional
  thumbnail row, loading/no-match/error notes. Trade's printing step (pending card →
  `PrintingPicker`) stays a slot.
- One `AttachChips` component for the chip row.
- One `useCardMetadata()` hook next to `cardMetadataStore.ts` returning
  `{ cards, isLoading, failed }`, retrying when the tool becomes active again.
- Two-row `Int32Array` Levenshtein; `useMemo` in `TradeSide`; In-Depth's index built
  once in `MtgAssistantApp` and passed down.

## Current-state PRD truth to amend

- REQ-002 (`PRD/sections/functional-requirements.md`) — shared search behaviour
  (keys, Escape, thumbnails), keeping per-search ranking.
- NFR-014 (`PRD/sections/non-functional-requirements.md`) — failed card-list loads
  retry when a tool becomes active, one failure message.
- `PRD/sections/in-depth/README.md`, `quick-lookup/README.md`,
  `trade-balancer/README.md` — the search box sections.

## Constraints (don't rediscover)

- The scanner cluster also edits `QuickLookupApp.tsx`, `ZoneCardPicker.tsx` and
  `TradeSide.tsx` — run the two one after the other.
- `PrintingPicker` ring colour is in the card-rings cluster, not here.

## Evidence + reusable tooling

`PRD/work/probe-codebase-health-pass/FINDINGS-ui-and-personalities.md` (U-03, U-04,
U-08) and `FINDINGS-data-and-clients.md` (D-02, D-05, D-10, D-11).

## What the graph run should produce

A DESIGN-BRIEF, the four gate questions, the REQ-002/NFR-014 and feature-spec
amendments, and slices: the behaviour-identical speedups first (typo matching, memo,
index lift), then `useCardMetadata` with In-Depth's failure message, then
`AttachChips`, then `CardSearchPop` adopted tool by tool.

## How to hand this off

/graph-kickoff "One card search box shared by every tool, with consistent keys, Escape and failure messages" PRD/work/probe-codebase-health-pass/GRAPH-BRIEF-card-search.md
