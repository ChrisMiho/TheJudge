# DESIGN-BRIEF: scan-printing-fidelity

## Goal

A scanned card displays the specific printing/art that was scanned (so on-screen
art matches the physical card), and typed-search resolution biases toward a
standard representative printing instead of a special treatment (e.g. Secret Lair).
Two independent, presentation-only levers; no Ask AI / prompt / rules-retrieval change.

## Scope

### Lever 1 — Scan art fidelity (DEC-070 / REQ-048)
- Separate printing-level *image presentation* from oracle-level *identity*.
- `cardScanMap.json` entry shape becomes `{ oracleId, name, imageUrl }`, built by
  `build-card-scan-map.mjs` from the same Scryfall printing object it already reads.
- `resolveScanCandidatesRanked` (REQ-036) threads the best-distance printing's
  `imageUrl` to the locked candidate; the scan hook surfaces it alongside the
  resolved oracle-level `CardMetadataItem`.
- Scan preview shows the scanned printing art; on auto-add (DEC-056) the scanned
  image is written to `ZoneCardItem.imageUrl` so the stack/zone thumbnail
  (REQ-008/DEC-018) matches the physical card.
- Graceful fallback to oracle-level `CardMetadataItem.imageUrl` when the printing
  image is missing/empty.

### Lever 2 — Standard-print bias for typed search (DEC-071 / REQ-049)
- `choosePreferredCard` (`scripts/build-card-metadata.mjs`) adds a standard-print
  preference applied after the metadata-quality score and **before** the
  `released_at` recency tiebreak.
- Standard vs special classified from Scryfall signals (`set_type` for Secret
  Lair/`funny`/promo classes, promo flags, special `frame_effects`/`border_color`
  such as borderless/extended/showcase). Build-time classification, outcome-validated.
- Keeps "most recent among standard prints"; only falls back to a special printing
  when no standard printing exists. Affects `cardMetadata.json` representative image
  for typed search only.

## Decisions
- **DEC-070** (`decisions/scanning.md`) — scan art fidelity; refines DEC-053/REQ-036.
- **DEC-071** (`decisions/providers-and-contract.md`) — standard-print bias; refines DEC-012.

## Requirements / flows touched
- **REQ-048** — Scanned card displays the scanned printing's art.
- **REQ-049** — Standard-print bias in representative-printing selection.
- **FLOW-006** — edge-case + notes lines: displayed art matches the scanned printing,
  with oracle-level fallback.
- References (unchanged): REQ-036 (resolver), REQ-008/DEC-018 (thumbnails),
  REQ-001/REQ-002 (search), REQ-030 (imageUrl omitted from prompt), NFR-010 (lazy load).

## Non-goals (from IDEA, preserved)
- No change to the Ask AI prompt/contract or rules-retrieval (`imageUrl` already
  omitted from prompt per REQ-030; identity stays oracle-level).
- No printing-picker UI.
- Typed search stays "most recent" except for the standard-print bias.
- **Not a scan-robustness lever:** no change to `recipe.ts`, `cardhashes.bin`,
  `identify.ts` matching/distance, the stabilizer/lock gate, or the byte-exact
  parity gates (REQ-034/DEC-051). Distinct from DEC-062/DEC-069.

## Key implementation notes
- The printing whose image is shown is the best-distance candidate that produced
  the winning (locked) oracle identity; the resolver already ranks by distance, so
  carry that candidate's `imageUrl`.
- `imageUrl` is the only printing-level field that flows to `ZoneCardItem`;
  `cardId`/duplicate-key/prompt/rulings remain oracle-level.
- Bridge file grows by one URL per printing; lazy-loaded on first scan (NFR-010),
  so startup is unaffected.

## Open questions
None — both product decisions resolved during refinement (scanned-art scope =
preview + persisted thumbnail; standard-print bias = broad special-treatment demotion).
