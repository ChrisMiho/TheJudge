# Graph-run brief — Compact data extracts: the full corpus under the Lambda budget

Self-contained intake for `graph-kickoff`. The investigate-first questions are
**resolved with data below**, so refinement can go straight to a DESIGN-BRIEF.

## What the player gets

The weekly data refresh ships everything again — fresh combos, rulings, card
text, and prices together — instead of prices only. Today the committed data
sits 1 MB under the 120 MB Lambda budget and a fresh combo corpus would push it
to 137 MB, so the last refresh (PR #219) had to leave the new combos behind.
After this change the same full, untrimmed data is ~26 MB, and combo answers,
rulings, and Trade Balancer prices all move forward every week with room to
grow for years. Nothing a player sees changes: same combos, same rulings, same
prices, same responses.

## Why (measured — do not re-derive)

Measured 2026-09-08 on the committed artifacts (`main` 908fd6a) and a fresh
combo build from that day's raw Commander Spellbook export (108,484 variants).
Full tables: `PRD/work/probe-data-extract-size/FINDINGS-extract-size.md`.

The budget: `scripts/lambda-package-budget.test.mjs` caps tracked
`apps/backend/data` files at 120 MB (250 MB Lambda quota − 130 MB non-data
reserve). It counts on-disk bytes, so encoding is what moves it.

The cause: the combo detail file gzips each combo **individually**, so the
compressor never sees the text neighbouring combos share. Everything else is
raw JSON or single-stream gzip where brotli does 2–3× better.

This is not a new discovery. The original combo build
(`PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md`, DEC-162)
chose per-variant gzip so a lookup could read one combo without holding the
corpus, recorded that it forfeits cross-record compression, and named the fix
if size ever became a problem: batch several variants per compressed member.
Size became the problem on 2026-09-08. The block layout below is that fix.

| Artifact (fresh corpus) | Today | Proposed | How |
| --- | ---: | ---: | --- |
| `commanderSpellbookCombos` detail | 90.96 MB | **12.99 MB** | blocks of 128 combos (existing `variantId` order), each block brotli q11; index carries the block directory |
| `commanderSpellbookComboIndex` | 6.30 MB | **2.42 MB** | brotli q11 instead of gzip; minified instead of prettier-formatted (46.6 MB raw → parsed at every cold start) |
| `cardRulingsByOracleId` | 18.61 MB | **1.47 MB** | brotli q11 instead of raw JSON |
| `cardDetailByOracleId` | 12.67 MB | **1.57 MB** | brotli q11 instead of raw JSON |
| `cardPrintingPricesByOracleId` | 4.76 MB | **3.41 MB** | brotli q11 instead of gzip |
| game-rules files (5) | 3.74 MB | 3.74 MB | unchanged |
| **Tracked total** | **137.3 MB** (over) | **≈ 25.6 MB** | ≈ 94 MB headroom |

Random access is preserved: a single combo read through a real file handle
(open, positional read of its block, brotli decode, pick the line) measured
**0.34 ms** versus 0.02 ms today; at most five combos enter a prompt. One
decoded block is ~230 KB and is held only for the read; the DEC-162 memory
posture (never hold the corpus) is unchanged. Cold-start decode for the four
per-card files is 14–40 ms each, the same order as the gunzip prices already
pay. Build time for the combo blocks is ~80 s at brotli q11 (weekly build).

Alternatives measured and rejected:
- Block size 512: 10.63 MB but 1–2.5 ms per read; 32: 17.5 MB. **128 wins.**
- Zstd 19: within 5 % of brotli everywhere, faster to build, but a newer
  `zlib` API. **Brotli** (core `zlib` since Node 11; Lambda is nodejs24.x).
- "Slim" detail records (drop `sourceUrl` and the template `oracleIds` lists
  duplicated from `index.templates` — 37.9 MB raw): saves 4 MB more on the block
  layout. **Not taken**: not needed, and it would make a detail record depend
  on the index to validate. Documented lever only.
- Merging prices + rulings + card detail into one per-card record: **−0.17 MB**
  under brotli, +0.29 MB under gzip. The compressor already removes the
  repeated oracle-id keys. Rejected; it would also put price bytes on the
  ask-ai path (REQ-175) and REQ-093 forbids folding corpora together.
- Raising `MIN_VARIANT_POPULARITY` (the emergency valve): drops combos players
  see. Rejected by the owner's stated goal ("without having to trim data").
- Per-record compression against a **shared dictionary** (keeps today's
  one-record reads): measured at 40–47 MB — 3× the block layout — because the
  savings come from the ~230 KB of neighbouring combos a block shares, which
  no dictionary can carry. Also: Node 22 (CI) silently ignores a brotli
  dictionary while Node 24 (Lambda) honours it, and the dictionary is an
  extra artifact that must stay byte-identical between build and runtime.
  **Rejected** (findings addendum, `tooling/measure-dictionary.mjs`).

Avenues considered and rejected without measurement (each fails on an axis
the numbers cannot change):
- **Range-reading blocks from S3 at runtime** (corpus outside the zip): removes
  the package budget entirely, but adds a network hop to every combo lookup
  and a runtime data dependency the design deliberately avoids (runtime never
  fetches combo data — integrations-and-data, DEC-162). Not worth it for a
  corpus that fits with ≈ 94 MB to spare.
- **Container-image Lambda** (10 GB image limit): replaces the S3-staged zip
  deploy (DEC-169) wholesale and worsens cold start, to solve a problem the
  encoding change already removes.
- **Lambda layers**: count against the same 250 MB unzipped quota. No gain.
- **EFS**: new infrastructure and a monthly charge for a static file.
- **SQLite or any database**: excluded by the owner; would not compress this
  data better than blocks and adds a runtime dependency.
- **Dropping combos to fit** (raising the popularity floor): see above; the
  emergency valve stays in the code, unused.

## Decisions already made — do not re-litigate

- Codec is **brotli quality 11** via Node core `zlib`; no new dependency.
- Combo detail layout is **blocks of 128 variants in `variantId` order**, one
  brotli member per block, concatenated; records inside a block are
  newline-delimited JSON (one variant per line).
- The index carries a **block directory** (`[offset, length]` per block) and
  each variant's `[blockIndex, lineIndex]` (or equivalent) in place of today's
  per-variant `[offset, length]`; the index itself is brotli, minified.
- Rulings, card detail, and prices become brotli files decoded **once at
  startup**, exactly where they are parsed today; the in-memory maps and route
  responses are byte-identical.
- The four per-card files stay **separate** files with their current shapes.
- `MIN_VARIANT_POPULARITY` stays 0; `--trim-committed` keeps working on the
  new layout.
- The budget test keeps its 120 MB line; only its failure hint gains "block
  size" beside the popularity valve.
- No frontend change; `apps/frontend/public/data` is outside this budget.

## Design direction (converged)

- `scripts/build-commander-spellbook-combos.mjs`: `serializeVariantDetail`
  groups sorted variants into 128-line blocks, brotli-compresses each, returns
  the concatenated buffer + block directory + per-variant block/line
  positions; `readVariantDetail` and `trimCommittedArtifacts` read the new
  layout; `writeIndexArtifact` writes minified brotli.
- `apps/backend/src/commanderSpellbook/catalog.ts`: `readVariantDetail` reads
  one block and picks one line; per-variant validation and the 64-entry LRU
  stay; structural load-time check becomes "every block range fits the file".
  Optional: cache the last decoded block to make the five-combos-per-prompt
  case one decode.
- `scripts/build-card-rulings.mjs` and `build-card-detail-by-oracle-id.mjs`
  write brotli; `cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts` swap
  `readFileSync`/`gunzipSync` for `brotliDecompressSync`.
- File names change extension to say what they are (`.json.br`, and a block
  file name for the combo detail). Update every place that names a file:
  `scripts/refresh-and-open-pr.mjs`'s explicit `COMMITTED_ARTIFACT_PATHS`
  (11 paths — a miss silently drops an artifact from the weekly PR),
  `apps/backend/src/runtime/createConfiguredApp.ts`, the eval readers
  (`eval/fixtureCardDetail.ts`, `eval/ragRetrievalBenchmark.ts`,
  `eval/contextEvaluationHarness.ts`, `eval/fixtures/README.md`),
  `scripts/lib/prompt-fidelity.mjs` (loads the raw rulings + card-detail JSON
  by name for the answer-quality scripts), `scripts/compare-combo-answer-quality.mjs`
  (opens both combo `.json.gz` files by path), `.gitignore` comments, root
  `README.md`, `OPERATOR.md` if it names them. The grep that enumerates the set:
  `grep -rln -E 'cardRulingsByOracleId|cardDetailByOracleId|cardPrintingPricesByOracleId|commanderSpellbookCombo' scripts apps/backend/src README.md OPERATOR.md .gitignore`.
- Regenerate all artifacts with the raw sources already on disk
  (`apps/backend/data/commander-spellbook/`, `apps/backend/data/scryfall/`,
  `apps/frontend/data/scryfall/`, all from the 2026-09-08 refresh) — no
  network refresh is needed to build this. Confirm
  `node --test scripts/lambda-package-budget.test.mjs` reports the new total.
- **Required, not optional:** positional-int index (variant ids listed once,
  memberships as integer positions, per-block lengths) — 1.38 MB brotli and,
  more importantly, 12 MB instead of 47 MB of JSON parsed at every cold start.
  Why required: the fresh index is 46.6 MB raw, twice the committed 24 MB,
  and it grows with every weekly refresh. Every cold start parses it whole
  and holds the result; at 47 MB that is on the order of 100 MB more
  resident memory and a proportionally longer first request. The function
  now runs at 1769 MB (raised 2026-09-08, PR #221), so this is no longer an
  out-of-memory ceiling — it is what keeps the cold start from creeping back
  toward the 9–10 s it was at 512 MB as the corpus grows. `catalog.ts` maps
  positions back to variant ids at load (the `byOracleId` /
  `byTemplateOracleId` Maps it exposes keep their `string[]` shape, so the
  matcher is untouched).

## Current-state PRD truth to amend

Amend in place; the decision log is retired (no new DEC).

- `PRD/sections/functional-requirements.md` — REQ-093 criterion "committed
  artifacts are gzipped per variant, measuring 76.9 MB detail + 4.8 MB index …
  gunzips only that slice" → block layout + new sizes; REQ-066 / REQ-175 where
  they say gzip for the price file.
- `PRD/sections/non-functional-requirements.md` — NFR-017: add the 2026-09-08
  re-measurement (137.3 MB fresh → ≈ 25.6 MB) to the Notes.
- `PRD/sections/integrations-and-data.md` — the "stored as concatenated
  individually-gzipped per-variant records" line.
- `PRD/sections/in-depth/README.md` — "gzipped per variant for bounded memory".
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — "Committed
  gzip-compressed" paragraph and the measured-bounds size.
- `PRD/sections/system-map.md` — entries "Card rulings", "Artifact builders",
  "Printing-price artifact build", "Commander Spellbook combo artifact build".
- `PRD/sections/quick-lookup/README.md` and `PRD/sections/trade-balancer/README.md`
  — each names `cardDetailByOracleId.json` once; update the file name only.

## Constraints (don't rediscover)

- Mock-default local dev must still boot with the committed files and with
  them missing (every loader fails open today; keep that).
- Never commit raw sources; `apps/backend/data/models/` stays gitignored.
- `data:build` must preserve a valid committed artifact when raw input is
  absent (REQ-093) — the preserve/validate paths must understand the new
  layout.
- The deploy budget test counts tracked bytes; run it in the build slice.
- Runtime memory is no longer a ceiling, but stay honest about it: the
  Lambda runs at **1769 MB** (raised from 512 MB on 2026-09-08, PR #221;
  `scripts/aws-bootstrap.sh` and the live function agree). Measured after
  the raise: first-invocation `Duration` 2.4 s (was 9–10 s), 5.1 s on the
  wire, peak memory 497 MB, warm calls 2–3 ms. The encoding change is neutral
  for cold start (brotli decode adds ~20 ms on the price file); the smaller
  package shaves a little off the ~2.6 s AWS spends fetching the 137 MB zip
  onto a fresh instance. The build slice should print the process RSS after
  loading every artifact so the review can compare against the 497 MB
  baseline and confirm the fresh corpus stays far below 1769 MB.
- Cold-start latency itself is **not** this build's job. It was measured and
  addressed by the memory raise (findings addendum, 2026-09-08 evening);
  provisioned concurrency or a warm ping remain owner options if it must go
  away entirely. Do not add them here.
- Determinism: identical raw input → identical bytes (brotli is deterministic
  for fixed params; keep params fixed and named).
- Three Node versions touch these files: **22** in CI (`quality-check.yml`
  `node-version: 22`), **24** on Lambda (`nodejs24.x`), **26** locally. Plain
  brotli (no dictionary) is core `zlib` on all three and behaves identically;
  the build and the budget test must pass under 22. Do not use the `dictionary`
  option on either codec — Node 22 ignores it for brotli without an error.
- Related but distinct, do not conflate: the meta-sidecar snapshot-date gap
  (REQ-066), eval golden regen after a Comprehensive Rules refresh, and the 25
  unresolved combo templates — all recorded in the
  `resilient-weekly-data-refresh` receipt as owner follow-ups.

## Evidence + reusable tooling

`PRD/work/probe-data-extract-size/` — `FINDINGS-extract-size.md` (all tables),
`tooling/measure-*.mjs` (the three measurement scripts; they read the committed
files and today's raw combo export, write only to a scratch dir given as
argv[2]) and their logs.

## Two things refinement settles (not gaps, just work to do)

- **One index schema.** The decisions above describe the index twice: the
  block directory (`[offset, length]` per block, variant → block/line) and the
  positional-int compaction (variant ids listed once, memberships as integer
  positions, per-block lengths). They are the same artifact. The DESIGN-BRIEF
  writes the single combined shape, and `catalog.ts` exposes the same Maps it
  does today so the matcher is untouched.
- **Trim re-blocks.** Blocks are fixed groups of 128 in `variantId` order, so
  `--trim-committed` cannot splice records out in place: it filters the
  variant list and re-runs the block serializer, then rewrites the index.
  Same code path as a fresh build, fed the surviving variants.

## What the graph run should produce

A DESIGN-BRIEF that takes the decisions above as settled, the REQ-093 /
NFR-017 / integrations / in-depth / trade-balancer-corpus / system-map
amendments, and slices along the seams: (A) combo detail block layout + index
directory in the build script with `--trim-committed` kept working, (B) the
catalog loader for the block layout, (C) brotli for rulings / card detail /
prices / index in builders and loaders, (D) file-name updates across the
explicit path lists and eval readers, (E) the positional-int compact index in build and
loader, (F) regenerate all artifacts from the on-disk raw sources, run the
budget test, print post-load RSS, and apply the PRD amendments.

## How to hand this off

/graph-kickoff "Re-encode the committed backend data extracts (brotli, 128-combo blocks) so the full fresh corpus fits the 120 MB Lambda budget without trimming" PRD/work/probe-data-extract-size/GRAPH-BRIEF.md
