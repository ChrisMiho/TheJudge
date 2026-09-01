# Fingerprint library corpus — `cardhashes.bin`

- Status: draft, derived, non-authoritative view. On any conflict, the cited
  `DEC`/`REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1 and
  Read-First #1. Correct this file against those sources, not the other way
  around.
- Backed by: DEC-051, DEC-054, DEC-069, REQ-035, REQ-039, REQ-047, NFR-010
- Feature that consumes it: `PRD/sections/scan/README.md`

This is a **corpus doc**, not a behavior doc. It records the committed
fingerprint library the scanner matches against — where the card art comes from,
how the library is built, and what one committed build holds. It is kept
separate from the feature spec so the behavior README describes what a player
does across the three scan destinations, and the artifact's contents stay a
`data/` concern rather than being inlined into that behavior.

## Why it is a corpus, not a feature spec

The docs-refactor `data/` bucket test requires all four clauses; this artifact
passes each one:

- **External upstream source:** Scryfall card images (Default Cards,
  `default-cards.json`), downloaded per-printing during the build.
- **Build/refresh command:** `scripts/build-card-hashes.mjs`, run via
  `npm run data:scan-fingerprints` (resumable/budget-bounded, DEC-054); every
  run downloads images and is itself the explicit human approval — no
  scheduled/automated refresh.
- **Committed artifact:** `apps/frontend/public/data/cardhashes.bin` (plus its
  manifest and the sidecar `cardhashSkiplist.json`).
- **Describes Magic, not TheJudge:** the artifact is perceptual-hash
  fingerprints of card artwork keyed by Scryfall printing id — Magic card art
  data, not TheJudge product configuration or behavior.

## Where it comes from and how it is built

- Built offline by `scripts/build-card-hashes.mjs` from Scryfall Default Cards,
  hashing each printing's art with the **same authoritative TypeScript recipe**
  (`recipe.ts` `cropRegionA` + `phashRegionPacked`) the on-device scanner uses,
  so parity between library and scanner holds by construction (DEC-051, REQ-035).
- **Resumable by default (`data:scan-fingerprints`):** the run uses the existing
  (or in-progress partial) bin as its record of already-fingerprinted entries,
  diffs against the filtered Scryfall printing ids, downloads only missing images
  to a **transient temp path**, hashes each, and **deletes it immediately** — so
  the full corpus is fingerprinted across many short runs without ever retaining
  the ~100 GB image corpus (DEC-054, REQ-039).
- **Bounded and crash-safe:** optional `--limit N` / `--max-minutes M` budgets
  (independent or combined, a clean stop always checkpointing first); every
  bin/manifest write is atomic (temp file then rename) and checkpointed every
  K entries, so a killed run resumes losslessly; downloads are paced with
  `429`/`5xx` backoff honoring `Retry-After`. Only permanent per-image
  failures (`404`, decode/dimension errors) count toward parking — a printing
  parks after N failed attempts in the skip-list; transient failures
  (`429`/`5xx`/network with the retry budget exhausted) are left missing and
  retried next run without incrementing the park counter. `--retry-parked`
  re-includes parked ids, and parked counts are reported in the run summary
  (DEC-054, REQ-039).
- **Non-destructive fresh rebuild:** `--fresh` (`data:scan-fingerprints:fresh`)
  builds from scratch into a **new** file and never deletes or overwrites the
  live bin; it refuses to clobber an existing target file unless the operator
  explicitly passes `--output <path>` and/or `--force`. Promotion to the live
  path is a deliberate manual step (DEC-054, REQ-039). The prior
  `data:scan-hashes` alias now forwards to `data:scan-fingerprints` so one
  name does not mean two behaviors (DEC-054).
- **Coverage is measurable (DEC-069/REQ-047):** the gameplay/corpus inclusion
  filter is a tested helper (`hashLibBuild.ts` `shouldIncludeScanPrinting`) so
  legitimate art — including non-English-only alt-art — is not silently dropped,
  and the operator can query coverage without network via
  `data:scan-fingerprints --coverage-summary` / `--diagnose-id <id>` /
  `--diagnose-illustration-id <id>`, plus manifest `targetCount` /
  `fingerprintedTargetCount` / `missingCount` / `parkedCount` / `corpusStatus`.
- **Append-only merge:** no pruning of printings removed from a newer Scryfall
  bulk (a `--prune` flag is a separate, later decision); unsupported
  `cardhashes.bin` versions are rejected before any rewrite (DEC-054, REQ-039).
- **Static, no runtime sync:** the on-device app only ever reads the committed
  bin; identification makes no runtime network call. **Do not rebuild to read
  this doc** — regenerating requires the human-approved Scryfall image download.

## Artifact shape

- `apps/frontend/public/data/cardhashes.bin` — binary `CARDHSH1` v1 format read
  by the TS DB reader (`dbformat.ts`), round-tripping byte-identical (REQ-034 /
  DEC-051 parity gate). Each entry is a Scryfall printing id and its packed
  per-channel DCT hash; `<id>`, `<id>__back`, and `_card_back` are distinct
  entry ids.
- A committed manifest carries the coverage counters above. The sidecar
  `apps/frontend/public/data/cardhashSkiplist.json` tracks per-id attempt counts
  and parked ids.
- No canonical `_card_back` reference asset ships, and the engine carries no
  card-back detector — the dormant `isCardBack()` method was removed as dead
  code. The `_card_back` id remains a distinct, DB-excluded entry; re-enabling
  detection needs both a reference asset and a reimplemented detector (DEC-055).

## Measured bounds (current committed build)

Read from the committed artifact; a future coverage-extending build moves these.

- Format/size: `CARDHSH1` v1, ~13 MB on disk (loaded lazily; see runtime posture
  below). The shipped artifact format/size is frozen — a recipe/geometry change
  would force a full re-download/re-hash (DEC-054, REQ-039).
- Corpus status at closeout: `partial` under DEC-054 — 97311/97323 fingerprinted;
  closing the remaining gap is a human-approved coverage-extending build, not a
  code change (`system-map.md`, DEC-069).

## Runtime posture

- **Lazy-loaded only on first scan** — app startup and every non-scanning path
  are unaffected for a user who never scans (NFR-010). The library and the
  scan-to-metadata bridge (`data/cardScanMap.md`) are the two artifacts the scan
  surface pulls on first use.
- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
  `POST /api/ask-ai`, or any product-facing endpoint; identification is
  frontend-only with zero scan-time network calls (DEC-050, DEC-051).

## Where it lives

`scripts/build-card-hashes.mjs` (build; `data:scan-fingerprints` /
`data:scan-fingerprints:fresh`) → `apps/frontend/public/data/cardhashes.bin` +
manifest + `cardhashSkiplist.json` (committed); runtime read through
`apps/frontend/src/lib/scan/` (`dbformat.ts`, `recipe.ts`, `identify.ts`). See
`PRD/sections/system-map.md`'s `### Fingerprint library build` and
`### Identification core` entries for the full machinery detail.
