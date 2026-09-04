# Findings: data-layer audit (duplicate? consolidate? RAG pre-work?)

Owner asked, before compressing: is there duplicate data, could a package be
consolidated/enhanced, and is this RAG pre-work?

## The card corpus is already joinable — not fragmented

`cardMetadata.json`'s `cardId` field is **misnamed: it is the oracle id.**
Measured: all 19,542 `cardRulingsByOracleId` keys are a subset of the
`cardId` set; **0** match `cardScanMap` printing-id keys.

So the corpus already joins on oracle id:

```
cardMetadata (oracle id) --+
cardRulingsByOracleId      +-- all keyed by ORACLE ID, join today
combos byOracleId        --+
cardScanMap (printing id) --> value carries oracleId  = printing->oracle bridge
```

Consequence for RAG: the canonical text to embed (`oracleText`, by oracle id)
**already exists and is already keyed consistently.** No corpus-unification
project is required before RAG. The feared fragmentation isn't there.

## Duplication is real but bounded (~3.7 MB of the 16 MB, pre-compression)

Byte-mass inside `cardMetadata.json` (12 MB of content):

| field | share | note |
| --- | --- | --- |
| oracleText | 45.4% (5.4 MB) | irreducible; one authoritative copy; RAG source |
| imageUrl | 25.5% (3.1 MB) | **duplicated** in cardScanMap; full Scryfall URL, templated |
| cardId | 10.1% (1.2 MB) | oracle id (misnamed) |
| typeLine | 6.4% | |
| name | 4.9% (0.6 MB) | **duplicated** in cardScanMap |
| subtypes/mana/colors/… | ~8% | |

- `name` + `imageUrl` (~3.7 MB) are carried in both `cardMetadata` (33k, by
  oracle id) and `cardScanMap` (95k, by printing id).
- `imageUrl` is a full URL like
  `https://cards.scryfall.io/normal/front/5/a/<id>.jpg?<ts>` — mostly
  templated, reconstructable from the id. Dropping or templatizing it saves
  most of 3.1 MB independent of compression.

## What this means for the decision

- **Compression is orthogonal and still the biggest single win.** oracleText
  (5.4 MB) dominates and must ship regardless of dedup; gzip/brotli cuts the
  whole file ~5×. Consolidation cannot replace it.
- **No RAG-blocking pre-work exists.** The corpus is already keyed for
  embeddings. RAG's real prerequisite is the query-construction fix
  (`probe-prompt-data-optimization` finding #1), not a data reshape.
- **A small data-hygiene win is available and can ride with compression:**
  rename `cardId`→`oracleId`, drop/templatize `imageUrl`. Additive, not a gate.

## "Use Scryfall more?" — yes, but only backward, not to the browser

The 516 MB Scryfall bulk (`default-cards.json`) is the canonical source every
builder trims from. Each record has **62 fields; the card-metadata trim keeps
10.** Confirmed `cardId = card.oracle_id` (`build-card-metadata.mjs:235`).

Dropped fields that matter:

- **`keywords`** — the exact field `open-questions.md` flags as needed for the
  System 3 keyword-boost retrieval score. Present in bulk, dropped in trim.
- `all_parts` (combo/token/meld relations), `color_identity`, `produced_mana`,
  `legalities`, `set`, `rarity`, `prices`.

**The direction discipline is the whole point:** the frontend payload and the
backend corpus want opposite things from Scryfall.

- **Frontend 16 MB list → carry LESS.** Every added field ×33k cards ships to
  every browser. Perf wants it smaller (compress + drop templated imageUrl).
- **Backend / build-time corpus → carry MORE.** `keywords`, `all_parts` cost
  the browser nothing, improve retrieval *today*, and are exactly the richer
  substrate RAG embeddings want.

So the "pre-work" instinct is real, but it isn't a blocking consolidation —
it's **extend the build pipeline to pull more Scryfall fields into the backend
corpus (keywords first).** Standalone retrieval win now; RAG groundwork later.

## The path (three distinct pieces, cleanly ordered)

1. **Compression (+ imageUrl trim).** Live perf bug, deploy-layer, orthogonal.
   Ship now.
2. **Query-construction fix + Scryfall keyword enrichment.** Retrieval quality
   now; the real RAG pre-work. Backend-only, no browser cost.
3. **RAG (embeddings / hybrid).** End state; still sits behind piece 2's query
   fix.

## Frontend field usage — what the UI actually needs (verified)

Non-test use-sites per field, and the byte cost:

| field | UI use-sites | payload | keep? |
| --- | --- | --- | --- |
| name | 61 | 0.6 MB | keep — autocomplete/selection core |
| cardId (oracle id) | 37 | 1.2 MB | keep — join key |
| imageUrl | 8 | 3.1 MB | **keep** — renders card image (`CardPresentation.tsx:185`). Not reconstructable cheaply (embeds a printing image id + cache-buster). Earlier "drop it" call was wrong. |
| oracleText | 5 | **5.4 MB** | **the swing** — see below |
| colors | 7 | 0.2 MB | keep — small |
| typeLine | 5 | 0.8 MB | keep |
| manaCost/manaValue/supertypes/subtypes | 4 each | ~0.8 MB | keep — small, shown |

### oracleText (45% of payload) is used two ways

- **Shown to the user** — `CardPresentation.tsx:55`,
  `FrozenGameContextDetails.tsx:140`. Cannot drop without changing UI.
- **Echoed back to the backend** — `lib/contextFlow/flow.ts:149`,
  `lib/zoneCards.ts:28` fold it into the game context POSTed to
  `/api/ask-ai`. The browser ships 5.4 MB partly just to relay it.

**Backend-slack path (the owner's idea, functionality-preserving but not free):**
if the backend resolves oracle text by oracle id itself — it already keys
rulings and combos by oracle id — the frontend need not carry oracleText just
to echo it. Requires: a backend card-text-by-oracle-id table, and rebuilding
the ask-ai context server-side to be **byte-identical** to today's. It changes
the ask-ai contract, so it's a deliberate slice with an equivalence test, not
a freebie. Displayed oracle text (card detail panel) would still need a source
— either kept in a slimmer form or fetched on demand for the selected card.

## Not yet audited (if a full corpus map is wanted)

This pass covered the card/rules/combo core. Not measured for
overlap/consolidation: `cardPrintingPrices.json` (38 MB, Trade Balancer),
`cardhashes.bin` (12 MB, scan), the `gameRules*` index family. Nothing so far
suggests they duplicate the card core, but a full sweep would confirm.
