# Findings — the size/perf thread and the "move pricing to the backend" idea

The owner raised a second thread: the balancer is slow to load, the 38 MB file
is likely why, and maybe pricing should move to a per-card backend lookup on the
existing data endpoint, slimming the frontend.

## Confirmed: the 38 MB file is the load cost

`apps/frontend/src/lib/trade/loadCardPrices.ts` fetches the whole artifact in one
shot on first balancer open: `fetch('/data/cardPrintingPrices.json')` then
`response.json()` — a ~38 MB download plus a full parse of 95,895 printings into
memory, cached for the session. On mobile that is a multi-second first-open
stall. The owner's guess is right.

## The endpoint the owner means: `GET /api/cards/:oracleId`

`apps/backend/src/routes/cardDetail.ts` (REQ-175) is the product's **second**
product-facing endpoint. It serves one card's descriptive block by Scryfall
`oracle_id` from the committed backend artifact
`apps/backend/data/cardDetailByOracleId.json` (~12.9 MB, oracle-keyed),
read-only, no runtime network call, mock-safe. The card-detail popup and Quick
Lookup preview already fetch-per-card and cache for the session (FLOW-024). It is
a real, proven per-card lookup pattern.

## The catch: oracle-level endpoint vs printing-level feature

The endpoint is keyed by **oracle id** — one card identity. The Trade Balancer
is **printing-level** by its whole design (DEC-087): each entry carries a
specific printing (set, collector number, foil), each printing has its own price,
and the picker must list *every* printing of a card. `cardDetailByOracleId.json`
is oracle-level (DEC-071 representative-printing model) and carries no
per-printing price.

So "add more data points to the existing endpoint" is not a drop-in. A backend
price lookup would need to return, per oracle id, the card's full printing list
with per-printing `usd`/`usdFoil` — a new shape, not a field added to the
oracle block. Scan input adds another wrinkle: a scan resolves to a printing id
directly, so the flow must map printing → oracle before the lookup.

## Two ways to cut the size — one reverses product truth, one does not

**Move pricing to the backend (owner's idea).** Frontend fetches per card on
add, backend returns that card's printings-with-prices, cache per session.
Startup/first-open cost drops to near zero. **But this reverses DEC-087** — the
feature's frozen "frontend-only, no backend call" posture — and NFR-013's
runtime-footprint framing. That is a genuine product-truth change and a
meaningfully bigger build. It also needs the granularity decision above resolved.

**Slim the committed frontend artifact (lighter, keeps DEC-087).** Measured
field breakdown of the committed 38 MB file (value bytes, 95,895 printings):

| Field | Value bytes | Share | Slimmable? |
| --- | --- | --- | --- |
| `imageUrl` | 8.6 MB | 44% | **Yes — derivable from `id`** (Scryfall URL template `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg`) |
| `setName` | 1.7 MB | 8% | Yes — from `set` code via a small set→name map |
| `name` | 1.5 MB | 7% | Yes — from oracle metadata the app already loads |
| `id` | 3.3 MB | 17% | No (the key; needed) |
| `oracleId` | 3.3 MB | 17% | Maybe (index lets you drop per-entry) |
| `usd` / `usdFoil` | 0.8 MB | 4% | No — the actual point |
| `set` / `collectorNumber` | 0.6 MB | 3% | No |

Plus ~5–6 MB of repeated JSON **key strings** (9 keys × 95,895), which shrink as
fields are dropped. `imageUrl` is the headline lever: 8.6 MB of value bytes plus
its repeated key, and it is fully reconstructable from the `id` the artifact
already carries — no new data source needed. Dropping imageUrl + setName + name
and their keys plausibly takes the file from ~38 MB toward ~20–24 MB while
staying **frontend-only** (DEC-087 intact). This likely captures most of the load
win without reversing a core decision.

## Recommendation on this thread

With the field breakdown measured, the recommendation sharpens: **slim the
frontend artifact first** — starting with deriving `imageUrl` from `id` (44% of
value bytes, zero new data source, DEC-087 intact) — and only reach for the
backend move if a slimmed file still loads too slowly. The backend move is a
real option but it is a larger reshape that reverses DEC-087, carries an open
oracle-vs-printing granularity fork, and should not be chosen before the cheap
frontend win is measured. Route this as its own graph-kickoff so refinement
resolves, in order: (1) frontend slim (imageUrl-from-id first, then setName/name)
and measure the resulting load; (2) only if still too slow, the backend
per-card move — its printings-with-prices shape, the scan printing→oracle
mapping, and the DEC-087 / NFR-013 amendment. Do not bundle any of this into the
freshness script, which is independent and needed regardless of where the price
data ends up living.
