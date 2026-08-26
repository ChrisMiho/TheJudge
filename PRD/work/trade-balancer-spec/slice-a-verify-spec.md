# Slice A — Verify the committed trade-balancer spec and corpus doc against their sources

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: done

## Goal

Confirm `PRD/sections/trade-balancer/README.md` (already committed at
`41118d5`, 162 lines) and `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
(already committed at `41118d5`, 119 lines) are complete and correct against
their cited sources, the DEC-168 template, and — for the corpus doc's
measured figures — the committed artifact itself, read directly. Close any
confirmed, sourced gap with a bounded additive correction only — this slice
verifies; it does not author.

## Requirements

1. Read the cited sources before checking a line: `DEC-087`, `DEC-088` in
   `PRD/sections/decisions/trade-balancer.md`; `REQ-064`, `REQ-065`,
   `REQ-066`, `REQ-145` in `PRD/sections/functional-requirements.md`;
   `FLOW-009` in `PRD/sections/user-flows.md`; `NFR-013`, `NFR-001` in
   `PRD/sections/non-functional-requirements.md`; the `### CardPrintingPrice`
   entry in `PRD/sections/integrations-and-data.md`; the `## Trade balancer`
   and `### Printing-price artifact build` entries in
   `PRD/sections/system-map.md`; the `#### Trade Balancer` row in
   `PRD/sections/screen-layout.md`. (`intake/` in this package is evidence,
   never authority — do not open the documents it cites.)
2. Confirm the spec's header carries the DEC-168 shape: a `Status:` line
   stating the file is a draft, derived, non-authoritative view, naming the
   cited `DEC`/`REQ`/`FLOW` as the winner on conflict; a `Backed by:` line
   citing exactly `DEC-087`, `DEC-088`, `REQ-064`, `REQ-065`, `REQ-066`,
   `REQ-145`, `FLOW-009`, `NFR-013`, `NFR-001` — no more, no fewer. Confirm
   the corpus doc's header carries the same `Status:` shape and a
   `Backed by:` line citing exactly `DEC-088`, `REQ-066`, `NFR-013` (and the
   `CardPrintingPrice` shape in `integrations-and-data.md`).
3. Confirm the spec's five `##` template sections are present in DEC-168
   order: **What it is**, **How it works**, **Measured bounds**, **Rejected
   alternatives and deferred scope**, **Where it lives** — no other
   top-level section. The corpus doc is not itself a DEC-168 behavior doc
   (its own header says so) — do not require the same five sections of it;
   instead confirm it covers, at minimum, where the artifact comes from and
   how it is built, its shape, its measured figures, its runtime posture,
   and where it lives.
4. Confirm every **How it works** bullet in the spec is traceable to its
   cited source's actual text: the two-sided screen and totals/difference
   (DEC-087, REQ-064, FLOW-009), adding a card via scan or manual search
   with printing/foil/quantity (DEC-087, REQ-065, FLOW-009), missing-price
   $0 + caution handling (DEC-087, REQ-065, FLOW-009), prices/freshness
   (DEC-088, REQ-066, NFR-013, REQ-145), and the frontend-only contract
   posture (DEC-087, REQ-064) — no capability invented beyond what those IDs
   state.
5. Confirm the spec's **Where it lives** paragraph and the corpus doc's own
   **Where it lives** section each name every file that both `system-map.md`
   and the actual repository tree confirm belongs to the feature. Check
   directly: `find apps/frontend/src/components/trade -type f` and
   `find apps/frontend/src/lib/trade -type f` against the files named in the
   spec (`TradeBalancer.tsx`, `TradeSide.tsx`, `TradeEntryRow.tsx`,
   `PrintingPicker.tsx`, `oracleSearch.ts`, `useTradeScan.ts`,
   `loadCardPrices.ts`, `pricing.ts`), and confirm the `trade-balancer`
   destination registration in
   `apps/frontend/src/components/portal/destinationRegistry.tsx`. Map-out
   time found no gap here — verify this independently rather than trusting
   that finding.
6. Confirm the corpus doc's "Why it is a corpus, not a feature spec" section
   states all four `data/` bucket-test clauses (external upstream source,
   build/refresh command, committed artifact, describes Magic not
   TheJudge) and that each clause is factually accurate against
   `scripts/build-card-prices.mjs`, `npm run data:build` / `data:refresh`
   wiring, and the committed artifact's actual path.
7. Confirm the corpus doc's **Artifact shape** table (`id`, `oracleId`,
   `name`, `set`, `setName`, `collectorNumber`, `imageUrl`, `usd`,
   `usdFoil`) matches the actual committed JSON's per-printing entry shape
   and the `CardPrintingPrice` TypeScript interface in
   `apps/frontend/src/lib/trade/loadCardPrices.ts`. Separately, check the
   field name against `PRD/sections/integrations-and-data.md`'s
   `### CardPrintingPrice` entry (which names the field `printingId`, not
   `id`) — map-out time found this is a discrepancy in
   `integrations-and-data.md` relative to the actual shipped artifact and
   code, not a defect in the corpus doc. Confirm this independently. If
   confirmed, record the observation in this slice's evidence log; make
   **no edit** to the corpus doc, the spec, or `integrations-and-data.md`
   over it — `integrations-and-data.md` is out of this package's licensed
   scope.
8. Confirm the corpus doc's "Measured bounds (committed 2026-06-05
   snapshot)" figures (`snapshotDate` `2026-06-05T22:21:13.248Z`, file size
   ≈38 MB, 95,895 `printings` entries, 32,638 `byOracleId` entries, 16,225
   entries with no `usd`, 38,691 with no `usdFoil`, 4,575 with neither)
   against the committed `apps/frontend/public/data/cardPrintingPrices.json`
   by reading it directly (Python's stdlib `json` module or `jq`) — **never**
   by running `npm run data:build`, `npm run data:refresh`, or any Scryfall
   network refresh.
9. Confirm the spec's **Rejected alternatives and deferred scope** section
   matches DEC-087's and DEC-088's Context and Notes language (rejected
   `cardMetadata.json` extension, rejected `cardScanMap.json` overload,
   closed door on live/real-time sync, printing disambiguation staying
   presentation-only, the raw-ISO-timestamp rejection per REQ-145) —
   nothing invented, nothing omitted.
10. Confirm no new stable ID token (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or
    `Q-` token followed by digits) appears in either file that does not
    already resolve to a real, pre-existing ID in its home file — cross-
    reference IDs beyond each file's `Backed by:` set (e.g. DEC-012,
    DEC-053, DEC-070, DEC-071, DEC-095, DEC-157, FLOW-004, REQ-009, REQ-010,
    REQ-067 in the spec) are expected and fine as long as each one is real;
    no ID may be minted.
11. Touch no file besides `PRD/sections/trade-balancer/README.md` and
    `PRD/sections/trade-balancer/data/cardPrintingPrices.md`, and only for a
    bounded additive correction if a requirement above genuinely surfaces
    one (for example a missing file-path line in a **Where it lives**
    section) — no other edit, no DEC/REQ/FLOW/NFR body edit, no
    `system-map.md`/`screen-layout.md`/`integrations-and-data.md` edit, no
    `apps/` change, no new decision.

## Acceptance criteria

- [x] A1 — The spec's header carries a `Status:` line naming the file draft,
      derived, non-authoritative, with the cited `DEC`/`REQ`/`FLOW` winning
      any conflict, and a `Backed by:` line citing exactly DEC-087, DEC-088,
      REQ-064, REQ-065, REQ-066, REQ-145, FLOW-009, NFR-013, NFR-001.
- [x] A2 — The corpus doc's header carries the same `Status:` shape and a
      `Backed by:` line citing exactly DEC-088, REQ-066, NFR-013 (and the
      `CardPrintingPrice` shape in `integrations-and-data.md`).
- [x] A3 — The spec's five DEC-168 template sections are present, in order:
      What it is, How it works, Measured bounds, Rejected alternatives and
      deferred scope, Where it lives.
- [x] A4 — Every cited ID in either file's `Backed by:` line actually exists
      in its named home file.
- [x] A5 — Every **How it works** bullet in the spec is confirmed traceable
      to its cited source's text — no invented capability.
- [x] A6 — Both files' **Where it lives** content names every file
      `system-map.md` and the repository tree confirm belongs to the
      feature; independently re-verified, not assumed from map-out.
- [x] A7 — The corpus doc's artifact-shape field names match the actual
      committed JSON and the TypeScript `CardPrintingPrice` interface; the
      `integrations-and-data.md` field-name discrepancy (`printingId` vs.
      `id`) is confirmed and recorded as an out-of-scope observation with
      no edit made to any file over it.
- [x] A8 — The corpus doc's measured-bounds figures are confirmed against
      the committed `cardPrintingPrices.json`, read directly (no rebuild).
- [x] A9 — The spec's **Rejected alternatives and deferred scope** matches
      DEC-087's and DEC-088's Context/Notes language, with nothing invented
      or omitted.
- [x] A10 — No new (minted) stable ID token appears in either file — every
      ID token present resolves to a real, pre-existing ID in its home file.
- [x] A11 — The slice's diff touches only
      `PRD/sections/trade-balancer/README.md` and
      `PRD/sections/trade-balancer/data/cardPrintingPrices.md`, and only for
      a bounded additive correction if genuinely needed — no `apps/` change,
      no edit to any existing `DEC`/`REQ`/`FLOW`/`NFR` body, no
      `system-map.md`/`screen-layout.md`/`integrations-and-data.md` edit.

## Verification

```bash
grep -nE "Status:|Backed by:|^## " PRD/sections/trade-balancer/README.md
grep -nE "Status:|Backed by:" PRD/sections/trade-balancer/data/cardPrintingPrices.md
grep -nE "DEC-087|DEC-088" PRD/sections/decisions/trade-balancer.md
grep -nE "REQ-064|REQ-065|REQ-066|REQ-145" PRD/sections/functional-requirements.md
grep -n "FLOW-009" PRD/sections/user-flows.md
grep -nE "NFR-013|NFR-001" PRD/sections/non-functional-requirements.md
grep -n "CardPrintingPrice" PRD/sections/integrations-and-data.md
grep -n "Trade balancer\|Printing-price artifact" PRD/sections/system-map.md
grep -n "Trade Balancer" PRD/sections/screen-layout.md
find apps/frontend/src/components/trade apps/frontend/src/lib/trade -type f
grep -n "trade-balancer" apps/frontend/src/components/portal/destinationRegistry.tsx
python3 -c "
import json
with open('apps/frontend/public/data/cardPrintingPrices.json') as f:
    d = json.load(f)
print('snapshotDate', d['snapshotDate'])
print('printings', len(d['printings']))
print('byOracleId', len(d['byOracleId']))
no_usd = sum(1 for v in d['printings'].values() if v.get('usd') is None)
no_foil = sum(1 for v in d['printings'].values() if v.get('usdFoil') is None)
no_both = sum(1 for v in d['printings'].values() if v.get('usd') is None and v.get('usdFoil') is None)
print('no usd', no_usd, 'no usdFoil', no_foil, 'no both', no_both)
"
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/trade-balancer/README.md | sort -u
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/trade-balancer/data/cardPrintingPrices.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/trade-balancer/README.md` (verify; bounded additive
  correction only if genuinely needed)
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (verify; bounded
  additive correction only if genuinely needed)
