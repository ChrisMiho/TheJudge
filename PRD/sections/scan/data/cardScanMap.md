# Scan-to-metadata bridge corpus — `cardScanMap.json`

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `DEC`/`REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1 and
  Read-First #1. Correct this file against those sources, not the other way
  around.
- Backed by: DEC-053, DEC-070, REQ-036, REQ-048, NFR-010
- Feature that consumes it: `PRD/sections/scan/README.md`

This is a **corpus doc**, not a behavior doc. It records the committed bridge
artifact that turns an art match (a Scryfall printing id) into an oracle
identity the rest of the app already understands, and carries the scanned
printing's own image for display. It is kept separate from the feature spec so
the behavior README describes what a player does, and the artifact's contents
stay a `data/` concern rather than being inlined into that behavior.

## Why it is a corpus, not a feature spec

The docs-refactor `data/` bucket test requires all four clauses; this artifact
passes each one:

- **External upstream source:** Scryfall printing objects (printing ids, oracle
  ids, card names, and per-printing image urls).
- **Build/refresh command:** `scripts/build-card-scan-map.mjs`, part of the data
  pipeline; the Scryfall source refresh is human-approved before it runs.
- **Committed artifact:** `apps/frontend/public/data/cardScanMap.json`.
- **Describes Magic, not TheJudge:** each entry is per-printing Magic card
  identity and image data — `{ oracleId, name, imageUrl }` — not TheJudge product
  configuration or behavior.

## Why this is a second, separate corpus

Scanning loads two distinct committed Magic-data artifacts, and this bridge is
kept in its own `data/` doc alongside `cardhashes.md` rather than folded in with
it. They are genuinely separate corpora: different upstream shapes (card
**images** hashed into a binary library vs. printing **identity/image
metadata**), different build scripts (`build-card-hashes.mjs` vs.
`build-card-scan-map.mjs`), different artifact formats (a ~14 MB `CARDHSH1`
binary vs. a JSON map), and different measured bounds. Each passes the four-clause
`data/` test independently, so each is documented independently — the same
corpus/behavior split the Trade Balancer applied to its single price artifact,
applied here twice because scan has two corpora.

## Where it comes from and how it is built

- Built at data-build time by `scripts/build-card-scan-map.mjs` from the same
  Scryfall printing objects the pipeline already reads; each entry's `imageUrl`
  is that printing's own Scryfall image (DEC-070, REQ-048).
- **Static, no runtime sync:** the on-device app only ever reads the committed
  JSON; the resolver makes no runtime network call (DEC-053, REQ-036). **Do not
  rebuild to read this doc** — regenerating requires the human-approved Scryfall
  refresh.

## How the scanner uses it

- The engine returns a ranked candidate list of Scryfall printing ids. The
  resolver (`resolveScanCandidatesRanked`) maps each `printing id → oracle_id →
  committed CardMetadataItem`, collapses duplicate oracle ids to one candidate by
  best (lowest) distance, and drops candidates that do not resolve to committed
  metadata (DEC-053, REQ-036).
- The best-distance printing's `imageUrl` is threaded through to the locked
  candidate so the scan preview and the added `ZoneCardItem.imageUrl` show the
  **scanned printing's** art, not the oracle-level representative image. A
  missing/empty printing image falls back to the oracle-level
  `CardMetadataItem.imageUrl` (DEC-070, REQ-048).
- **Identity stays oracle-level.** Only the display image is printing-level;
  `cardId`, the duplicate-stack key, prompt context, and rulings remain keyed on
  the oracle id — no other printing-level data is pushed into `ZoneCardItem`,
  prompt, or rulings. `imageUrl` is already omitted from LLM-facing prompt text
  (REQ-030), so the scanned image has no effect on the Ask AI contract (DEC-070).

## Artifact shape

- `apps/frontend/public/data/cardScanMap.json` — a map keyed by Scryfall printing
  id; each entry is `{ oracleId: string, name: string, imageUrl: string }`
  (`imageUrl` `""` when the source has none). Follows the committed
  `cardMetadata.json` static pattern (REQ-036, DEC-070).

## Runtime posture

- **Lazy-loaded only on first scan** — it grows by one url per printing versus a
  bare `{ oracleId, name }`, but loads only when scanning is first used, so app
  startup stays unaffected and the growth stays within the NFR-010 lazy-load
  posture (DEC-070, NFR-010).
- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
  `POST /api/ask-ai`, or any product-facing endpoint (DEC-053, DEC-070).

## Where it lives

`scripts/build-card-scan-map.mjs` (build) →
`apps/frontend/public/data/cardScanMap.json` (committed artifact); runtime read
through `apps/frontend/src/lib/scan/` (`resolveScanCandidates.ts`,
`loadScanMap.ts`) and surfaced by `hooks/useScanCapture.ts`. See
`PRD/sections/system-map.md`'s `### Scan-to-metadata resolver` and
`### Scan art fidelity` entries for the full machinery detail.
