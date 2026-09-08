# Gate questions — trade-balancer-price-slim

Answer each block: set `- Verdict:` to `accept`, `edit`, or `reject`, and fill
`- Reason:` (required for edit and reject). These are proposed edits to product
truth in `PRD/sections/`; nothing is written to `PRD/sections/` until the build
step applies your verdicts. Two existing requirements are amended; no new REQ or
FLOW is minted, and no new DEC.

---

## REQ-066 — the price file stops storing the card image, name, and set name, and rebuilds them when the balancer opens

**What this decides:** whether the committed Trade Balancer price file keeps a
copy of each printing's image URL, card name, and full set name on all ~96,000
printings — or drops those and rebuilds them in the browser when the balancer
opens, to make the file small enough to open fast.

**In plain terms:** today the balancer downloads one ~38 MB file before the
screen is usable, a multi-second stall on mobile. Nearly half of that file is a
web address for each card's image, and it can be rebuilt exactly from the
printing's own id (Scryfall builds every image address from the id). The card
name and set name are also repeated on every printing even though they are the
same across a card's printings and across a set. This change drops the image
address, the name, and the set name from each printing, and instead: rebuilds the
image address from the id when a card is shown, stores each name once per card and
each set name once per set in two small lookup tables, and has the loader stitch
them back together so the picker, the search box, and the entry rows look and
behave exactly as they do now. It is still a single committed file, still loaded
only when the balancer is first opened, still no live price lookup — only smaller.
The requirement being amended (REQ-066) is the one that says the price file must
carry, per printing, the id, oracle id, card name, set code, set name, collector
number, image url, and the two USD prices.

**What happens if you say no:** the price file keeps a full image address, name,
and set name on every printing, stays ~38 MB, and the balancer keeps its
multi-second first-open stall on mobile.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-066

```diff
 ### REQ-066
 - Title: Printing-level price data artifact
 - Priority: high
 - Description: Add a build step that emits a committed, printing-level USD price artifact from the existing Scryfall bulk source, covering every paper printing with its non-foil and foil price plus the fields needed to identify, display, and list printings, so the trade balancer can price scanned and manually chosen printings with no runtime network calls (DEC-088).
 - Acceptance Criteria:
   - a build script (alongside `data:build` / `data:refresh`) emits a committed printing-level price artifact under `apps/frontend/public/data/` from the local Scryfall bulk source
-  - per printing the artifact carries at least: printing id, oracle id, card name, set code, set name, collector number, image url, `usd` (non-foil), and `usd_foil`
+  - per printing the artifact carries: printing id, oracle id, set code, collector number, `usd` (non-foil), and `usd_foil`. Card name, set name, and image url are **not** stored per printing — they are reconstructed at load: image url is derived from the printing id via the Scryfall URL template `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg`; card name is carried once per oracle id in a compact `namesByOracleId` map; set name is carried once per set code in a compact `setNames` map. The loader rehydrates the full per-printing view (name, set name, image url) so consumers are unchanged
+  - the derived image url resolves for both single-faced and **double-faced** printings — Scryfall composes a double-faced card's front-face image url from the printing id with the `front` path segment, so no per-face handling is needed at runtime; this is verified against a real double-faced printing at build
   - entries are **indexable by oracle id** (to list a card's printings for the manual picker) and resolvable **by printing id** (so a scanned printing prices directly)
   - missing prices are stored as null/absent (consumed as $0 + caution per REQ-065); the artifact records a **snapshot date**
   - the artifact is **lazy-loaded only when the Trade Balancer is first opened**; app startup and the MTG Assistant flow are unaffected for users who never open it
   - `npm run data:build` regenerates the artifact from local inputs; `npm run data:refresh` refreshes the Scryfall bulk source (download is human-approved before it runs) then rebuilds
   - the build degrades gracefully: a missing/failed source keeps the prior committed artifact and does not break other artifact builds
 - Constraints:
   - static committed snapshot; no runtime price fetch and no runtime metadata/library sync (DEC-012 posture)
   - raw downloaded bulk data remains gitignored and is not committed; only the trimmed price artifact is committed
   - no change to `cardMetadata.json`, `cardScanMap.json`, `cardhashes.bin`, the scan recipe/identify/lock boundary, `AskAiRequest`, prompt assembly, the provider boundary, or any endpoint
 - Dependencies:
   - DEC-088
   - DEC-012
   - REQ-065
   - NFR-013
   - data pipeline (`scripts/`)
 - Notes:
   - source-bulk choice and the exact filter/field set are build-time details validated by outcome (every priced gameplay printing present, prices display correctly); `all-cards` (every language) is unnecessary because prices are per printing
+  - the `namesByOracleId` and `setNames` maps ride **inside** `cardPrintingPrices.json`; no new committed file and no change to `cardMetadata.json`. The name-reconstruction source is these in-artifact maps, not a separate metadata fetch — the trade flow does not load `cardMetadata.json`, and adding that download to first open would defeat the size win
```

- Verdict:
- Reason:

---

## NFR-013 — the price file is deliberately slimmed to hit the mobile size budget, and stays frontend-only

**What this decides:** whether the requirement that governs the price file's size
budget records that the file is deliberately slimmed (image rebuilt from the id,
name and set name stored once instead of per printing) to stay within a mobile-
friendly first-open budget — while keeping the current frontend-only, no-backend-
call posture.

**In plain terms:** NFR-013 today says the price file must be lazy-loaded and
that its size, load time, and lookup latency "should stay within a mobile-
friendly budget," without saying how. This change names the mechanism used to
meet that budget — deriving the image address from the id and deduplicating the
name and set name — and reaffirms that this is a delivery-size change only: the
prices still come from one committed snapshot loaded in the browser, with no live
price fetch and no per-card backend lookup (the feature's frontend-only posture,
DEC-087). A separate, larger step — moving pricing to a per-card backend lookup —
is explicitly *not* taken here; it would reverse that posture and is a fresh
decision only if the slimmed file is measured and still too slow.

**What happens if you say no:** NFR-013 keeps a size budget with no stated
mechanism, and the slim's intent (why the file shape changed) is not recorded in
the requirement that owns the footprint — leaving the corpus doc and the code as
the only trace of it.

### Proposed diff — `PRD/sections/non-functional-requirements.md`, NFR-013

```diff
 ### NFR-013
 - Title: Trade-price data footprint and freshness
 - Description: The printing-level price artifact (REQ-066) must not cost users who never open the Trade Balancer, and its static-snapshot nature must be honest and clearly bounded.
 - Constraints:
   - the price artifact is lazy-loaded only when the Trade Balancer is first opened; app startup and the MTG Assistant flow are unaffected for users who never open it (mirrors the NFR-010 scan-artifact posture)
   - prices are a static build-time snapshot: no runtime price fetch, no runtime sync, and no automated/scheduled refresh; the committed snapshot is refreshed only through the human-approved data pipeline (`data:refresh` then `data:build`)
   - the artifact records a snapshot date, and the UI may surface it so users understand prices are point-in-time, not live
-  - artifact size, lazy-load time, and lookup latency should stay within a mobile-friendly budget; loading and pricing must not block or jank the trade UI
+  - artifact size, lazy-load time, and lookup latency should stay within a mobile-friendly budget; loading and pricing must not block or jank the trade UI. To keep the first-open download within that budget the artifact is deliberately slimmed: the per-printing image url is derived at load from the printing id (not stored), and card name and set name are stored once per oracle id and per set code (not repeated per printing) and reconstructed by the loader. This is a delivery-size change only — the frontend-only, no-runtime-fetch posture (DEC-087) is unchanged, and reconstruction stays on the accessor path so the full 96k-entry set is not eagerly transformed on open
   - USD-only price fields (`usd`, `usd_foil`); no live market integration
 - Dependencies:
   - DEC-087
   - DEC-088
   - REQ-066
   - NFR-001
   - NFR-004
   - NFR-010
 - Notes:
   - the trade balancer is an optional top-level feature; like scanning, its data budget is scoped to users who actually use it
+  - a per-card backend price lookup (moving pricing off the committed frontend snapshot) would reverse the DEC-087 frontend-only posture and is **not** in scope here; it is a separate decision, considered only if the slimmed committed artifact is measured and still exceeds the first-open budget
```

- Verdict:
- Reason:

---

## Blocker questions

None. The one decision this run owns — sequencing — is resolved in the
DESIGN-BRIEF: ship Step 1 (the frontend slim) and defer Step 2 (a per-card
backend lookup) until a measured Step-1 result justifies revisiting the
frontend-only posture. Step 2 is not raised as a blocker because it is a
well-defined deferral, not a genuine ambiguity: keeping the current posture is
the conservative default and does not silently decide the disputed behavior. If
you want Step 2 pre-authorized regardless of the Step-1 measurement, say so in
either verdict Reason above and it will be picked up as a fresh scope decision.
