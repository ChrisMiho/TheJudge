# GAMEPLAN: scan-printing-fidelity

Two independent, presentation-only levers. Identity, prompt context, rulings, and
the scan engine stay frozen. Source of truth: `DESIGN-BRIEF.md`, DEC-070
(`sections/decisions/scanning.md`), DEC-071 (`sections/decisions/providers-and-contract.md`),
REQ-048 / REQ-049 (`sections/functional-requirements.md`).

## Architecture

### Lever 1 — Scan art fidelity (DEC-070 / REQ-048)

Separate printing-level *image presentation* from oracle-level *identity*. The
printing whose art is shown is the best-distance engine candidate that produced
the locked oracle identity; the resolver already ranks by distance, so we carry
that candidate's `imageUrl` through to the locked card.

Data flow:

```
build-card-scan-map.mjs                  (Slice A)
  Scryfall printing object
  -> { oracleId, name, imageUrl }   ──►  apps/frontend/public/data/cardScanMap.json

scan time (frontend, zero network):      (Slice B)
  identify() Candidate(card_id=printing id, distance)
  -> resolveScanCandidatesRanked(candidates, scanMap, cardMetadata)
       collapse by oracle id (best distance)         [unchanged]
       carry scanMap[best].imageUrl as printing image [NEW]
  -> ResolvedScanCandidate { card, distance, scanImageUrl }   [scanImageUrl NEW]
  -> useScanCapture lock: surface card + scanned image
  -> ZoneCollectionStep auto-add: buildZoneCardFromMetadata(card, scanImageUrl)
       ZoneCardItem.imageUrl = scanImageUrl ?? card.imageUrl   [fallback]
  -> stack/zone thumbnail (REQ-008/DEC-018) + scan-session preview show scanned art
```

Invariants held: `cardId`, duplicate-stack key, `buildPromptContext`/`buildPromptText`,
rulings lookup stay oracle-level. `imageUrl` is the **only** printing-level field
that reaches `ZoneCardItem`. No change to `recipe.ts`, `cardhashes.bin`,
`identify.ts`, the stabilizer/lock gate, or the REQ-034/DEC-051 parity gates.
`imageUrl` is already omitted from prompt text (REQ-030), so the Ask AI contract
is untouched.

### Lever 2 — Standard-print bias (DEC-071 / REQ-049)

`choosePreferredCard` (`scripts/build-card-metadata.mjs`) gains a standard-print
preference inserted **after** the metadata-quality score and **before** the
`released_at` recency tiebreak. "Standard" vs "special" is a build-time predicate
over Scryfall signals (`set_type` Secret Lair / `funny` / promo classes, promo
flags, special `frame_effects` / `border_color` such as borderless/extended/showcase).
Behavior stays "most recent among standard prints"; a special printing wins only
when no standard printing exists. Affects the typed-search representative
`CardMetadataItem` only — the scan path (Lever 1) shows scanned art directly and
does not depend on the representative print.

## Slice dependency

| Slice | Lever | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| A — Scan-map image bridge | 1 | — | yes |
| B — Scanned-art carry-through | 1 | A (entry shape + data) | after A |
| C — Standard-print bias | 2 | — | yes (independent of A/B) |

A and C have no shared state and may run concurrently. B consumes the
`imageUrl` field that A adds to the scan-map entry shape, so it follows A.

## Verification checklist (whole package)

- [ ] `npm --workspace apps/frontend run test` green (resolver, hook, zone-collection, scan-map, metadata-policy tests)
- [ ] `npm run quality:check` green for touched areas
- [ ] `cardScanMap.json` entries are `{ oracleId, name, imageUrl }`; bridge stays lazy-loaded (NFR-010)
- [ ] Scanned card's preview + persisted thumbnail show the scanned printing's art; oracle fallback when printing image missing
- [ ] `cardMetadata.json` representative images bias to standard prints; special-only cards still resolve
- [ ] Oracle identity / prompt / rulings unchanged; scan-engine + parity gates (REQ-034/DEC-051) untouched

## Regeneration note

Both `npm run data:scan-map` and `npm run data:build` read
`apps/frontend/data/scryfall/default-cards.json` (~516MB, present locally).
Regeneration is required to land the data-file changes for Slices A and C.
