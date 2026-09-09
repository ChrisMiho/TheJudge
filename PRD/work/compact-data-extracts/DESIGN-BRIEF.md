# Design brief — compact-data-extracts

## What the player gets

The weekly data refresh ships the whole fresh corpus again — new combos,
rulings, card text, and prices together — instead of prices only. Nothing a
player sees changes: same combos, same rulings, same prices, same answers. What
changes is on disk: the committed backend data shrinks from ~137 MB (over the
120 MB Lambda deploy budget) to ~26 MB (~94 MB of headroom), so the full,
untrimmed data fits and no combo is dropped to make room.

"Lambda deploy budget" is the size cap on the files the app ships to its cloud
host (AWS Lambda). `scripts/lambda-package-budget.test.mjs` fails the build when
the committed `apps/backend/data` folder exceeds 120 MB. Today a fresh combo
corpus blows past it, so the last weekly refresh (PR #219) had to leave the new
combos behind and ship prices only.

The fix is an encoding change, not a content change: compress the committed data
with brotli (a compressor built into Node — no new dependency) and group the
combo records into blocks so the compressor sees the text neighbouring combos
share. That is where the ~137 MB → ~26 MB comes from.

## Why this shape (measured, from the intake brief — not re-derived here)

The intake `intake/GRAPH-BRIEF.md` measured every artifact on 2026-09-08 against
the committed files and a fresh combo build. Its measurement tables and the three
measurement scripts live at `PRD/work/probe-data-extract-size/`. This brief takes
those numbers as evidence and does not re-run them.

| Artifact (fresh corpus) | Today | Proposed | How |
| --- | ---: | ---: | --- |
| combo detail | 90.96 MB | 12.99 MB | 128-combo blocks, each brotli q11 |
| combo index | 6.30 MB | 2.42 MB | brotli q11, minified; positional-int compaction |
| card rulings | 18.61 MB | 1.47 MB | brotli q11 (was raw JSON) |
| card detail | 12.67 MB | 1.57 MB | brotli q11 (was raw JSON) |
| printing prices | 4.76 MB | 3.41 MB | brotli q11 (was gzip) |
| game-rules files (5) | 3.74 MB | 3.74 MB | unchanged |
| **Tracked total** | **137.3 MB** (over) | **≈ 25.6 MB** | ≈ 94 MB headroom |

The cause of the combo-detail bloat: today the combo file gzips each combo
**individually** (DEC-162 chose per-variant gzip so a lookup reads one combo
without holding the whole corpus, and recorded the fix if size became a problem
— batch several variants per compressed member). Size became the problem on
2026-09-08. The block layout is that recorded fix.

## Design decisions (settled)

These come from the intake brief's converged direction and are taken as the
starting design. Nothing below is a runtime-behavior change — every in-memory map
and route response stays byte-identical.

1. **Codec: brotli quality 11**, via Node core `zlib` (`brotliCompressSync` /
   `brotliDecompressSync`). No new dependency. No `dictionary` option (Node 22 in
   CI silently ignores a brotli dictionary; Node 24 on Lambda honours it — using
   it would make CI and Lambda disagree). Params are fixed and named
   (`BROTLI_PARAM_QUALITY = 11`, `BROTLI_PARAM_SIZE_HINT` set to the input byte
   length) so identical raw input yields identical bytes.
2. **Combo detail: blocks of 128 variants in `variantId` order.** Records inside
   a block are newline-delimited JSON (one variant per line). Each block is
   brotli-compressed as one member; the members are concatenated into a single
   file. A combo read opens the file, positionally reads its block's byte range,
   brotli-decodes that one block (~230 KB), splits on newline, and picks the one
   line. Measured 0.34 ms per read versus 0.02 ms today; at most five combos
   enter a prompt, so the delta is immaterial. The DEC-162 memory posture — never
   hold the corpus resident — is unchanged; one block is held only for the read.
3. **One combined index shape** (settled below) that is at once the block
   directory and the positional-int compaction. It is brotli, minified.
4. **Rulings, card detail, and prices become brotli files decoded once at
   startup**, exactly where they are parsed today. The four per-card files stay
   **separate** files with their current shapes (merging them saves −0.17 MB and
   would put price bytes on the ask-ai path — rejected, intake brief).
5. **`MIN_VARIANT_POPULARITY` stays 0.** The full reviewed `OK` corpus ships
   untrimmed. Raising the floor stays the emergency size valve NFR-017 describes,
   now unused. `--trim-committed` keeps working on the new layout (settled below).
6. **The budget test keeps its 120 MB line.** Only its failure hint gains a
   block-size / re-encode lever beside the popularity valve.
7. **No frontend change.** `apps/frontend/public/data` is outside this budget.

### Settled — the one index schema

The index is a single JSON object, minified and brotli-compressed, written to
`commanderSpellbookComboIndex.json.br`. It carries:

- `variantIds: string[]` — every committed variant id, in `variantId` order.
  A variant's **integer position** in this array is its id everywhere else in the
  index (this is the "positional-int compaction": ids are listed once here, and
  every membership list stores integer positions, not repeated id strings).
- `blocks: [{ offset, length }]` — the block directory: byte `offset` and
  `length` of each block's brotli member inside the blocks file, in block order.
  Block `b` holds `variantIds` positions `[b*128, b*128+128)` (the last block
  holds the remainder), so a variant at position `p` is in block `p >> 7`, line
  `p & 127` — the per-variant `[blockIndex, lineIndex]` is implied by position,
  needs no separate array, and stays correct after a re-block.
- `byOracleId: Record<oracleId, int[]>` — exact-card membership as integer
  positions into `variantIds`.
- `byTemplateOracleId: Record<oracleId, int[]>` — authoritative template
  membership as integer positions.
- template expansion metadata, unresolved-template metadata, and the source
  manifest — unchanged shapes carried through from today's index.

At load, `catalog.ts` maps positions back to variant ids so the Maps it exposes
today — `byOracleId` / `byTemplateOracleId` as `Map<oracleId, string[]>` — keep
their exact `string[]` shape. The matcher is untouched. `catalog.ts` also builds
one `Map<variantId, position>` at load so a detail read can find a variant's
block/line by arithmetic.

Why the positional-int compaction is required, not optional: the fresh index is
46.6 MB raw, twice today's committed 24 MB, and grows every weekly refresh. Every
cold start parses it whole and holds the result. The compaction takes that from
47 MB of parsed JSON to ~12 MB, which keeps the cold start from creeping back
toward the 9–10 s it showed at 512 MB as the corpus grows. It is not an
out-of-memory fix (the function now runs at 1769 MB, PR #221) — it is cold-start
hygiene the growing index needs.

### Settled — how `--trim-committed` re-blocks

Blocks are fixed groups of 128 in `variantId` order, so `--trim-committed` cannot
splice records out of a block in place. It re-blocks: filter the variant list to
the survivors, re-run the block serializer over the filtered sorted list, and
rewrite both the blocks file and the index — the same code path a fresh build
uses, fed the surviving variants. `trimCommittedArtifacts` therefore reads the
committed blocks + index, decodes each surviving variant, and calls the same
`serializeVariantDetail` / `writeIndexArtifact` the build uses.

## File-name changes

Extensions change so the file says what it is. This is a committed-artifact
rename; every doc that names the old file as current fact is amended (see
`GATE-QUESTIONS.md`), and every code/config path list that names it is updated in
slice D.

| Today | New |
| --- | --- |
| `commanderSpellbookCombos.json.gz` (per-variant gzip) | `commanderSpellbookComboBlocks.br` (concatenated brotli block members) |
| `commanderSpellbookComboIndex.json.gz` | `commanderSpellbookComboIndex.json.br` |
| `cardRulingsByOracleId.json` (raw) | `cardRulingsByOracleId.json.br` |
| `cardDetailByOracleId.json` (raw) | `cardDetailByOracleId.json.br` |
| `cardPrintingPricesByOracleId.json.gz` | `cardPrintingPricesByOracleId.json.br` |

## Material assumptions (assumption ladder, `preparation-contract.md`)

- **Combo detail file name `commanderSpellbookComboBlocks.br`.** The intake brief
  says "a block file name for the combo detail" without fixing one. The file is
  not a single JSON document (it is concatenated brotli members of NDJSON), so a
  `.json.br` name would misdescribe it. `commanderSpellbookComboBlocks.br` follows
  the established `commanderSpellbook*` naming and the "extension says what it is"
  rule. Reversible, internal committed artifact, no contract impact — ladder rung
  3 (established local pattern) / rung 4 (smallest reversible). Recorded in
  `GATE-QUESTIONS.md` REQ-093 for the owner to confirm or rename.
- **Per-variant `[blockIndex, lineIndex]` is derived from position, not stored.**
  Blocks are fixed 128 in `variantId` order and `variantIds` is the positional
  dictionary, so block/line is pure arithmetic on a variant's position. Storing
  it would be redundant and could drift from `variantIds` after a re-block. Ladder
  rung 4 (smallest scope). No behavior impact.
- **Historical NFR-017 measurement notes are left as-is.** They record past
  measurements of then-current files; only a new re-measurement note is added.
  Rewriting historical figures would falsify the record. Ladder rung 5 (preserve
  existing truth).
- **Cache the last decoded combo block (slice B).** The five-combos-per-prompt
  case can share one decode. Kept as a measured optimization, not a contract; if
  it does not help, it is dropped. No behavior impact either way.

No question meets the three-condition genuine-blocker test
(`preparation-contract.md`): each open choice is an internal, reversible encoding
or naming detail with an authoritative basis in the intake evidence and local
patterns, and the smaller option decides no player-visible behavior. No
`## Blocker questions` recorded.

## Slices

- **A — Combo block layout + index directory in the build script.**
  `scripts/build-commander-spellbook-combos.mjs`: `serializeVariantDetail` groups
  sorted variants into 128-line NDJSON blocks, brotli-compresses each, returns the
  concatenated buffer + block directory + per-variant positions; `writeIndexArtifact`
  writes the combined index (block directory shape, before the positional-int
  compaction of slice E) minified; `trimCommittedArtifacts` re-blocks (filter →
  re-serialize → rewrite) and stays green. Writes `commanderSpellbookComboBlocks.br`
  + `commanderSpellbookComboIndex.json.br`.
- **B — Catalog loader for the block layout.**
  `apps/backend/src/commanderSpellbook/catalog.ts`: `readVariantDetail` finds the
  variant's position, reads one block's byte range through a file handle, brotli-
  decodes it, and picks one line; per-variant validation and the 64-entry LRU
  stay; the load-time structural check becomes "every block range fits the file".
  Optional: cache the last decoded block. In-memory Maps and route responses stay
  byte-identical.
- **C — Brotli for rulings / card detail / prices in builders and loaders.**
  `scripts/build-card-rulings.mjs` and `scripts/build-card-detail-by-oracle-id.mjs`
  write brotli (the card-detail build emits both card detail and prices brotli);
  `apps/backend/src/cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts` swap
  `readFileSync`/`gunzipSync` for `brotliDecompressSync`. Decoded once at startup,
  maps unchanged.
- **D — File-name updates across path lists and readers.** Update every place that
  names a renamed file: `scripts/refresh-and-open-pr.mjs`'s `COMMITTED_ARTIFACT_PATHS`
  (a miss silently drops an artifact from the weekly PR),
  `apps/backend/src/runtime/createConfiguredApp.ts`, the eval readers
  (`eval/fixtureCardDetail.ts`, `eval/ragRetrievalBenchmark.ts`,
  `eval/contextEvaluationHarness.ts`, `eval/fixtures/README.md`),
  `scripts/lib/prompt-fidelity.mjs`, `scripts/compare-combo-answer-quality.mjs`,
  `.gitignore` comments, root `README.md`, `OPERATOR.md` if it names them. Enumerate
  the set with:
  `grep -rln -E 'cardRulingsByOracleId|cardDetailByOracleId|cardPrintingPricesByOracleId|commanderSpellbookCombo' scripts apps/backend/src README.md OPERATOR.md .gitignore`.
- **E — Positional-int compact index in build and loader.** Build writes
  `variantIds` once and every membership as integer positions plus per-block
  lengths; `catalog.ts` maps positions back to variant ids at load (Maps keep
  their `string[]` shape). Required, not optional (rationale above).
- **F — Regenerate, verify, amend.** Regenerate all artifacts from the on-disk raw
  sources (`apps/backend/data/commander-spellbook/`, `apps/backend/data/scryfall/`,
  `apps/frontend/data/scryfall/`, all from the 2026-09-08 refresh — no network
  refresh needed); run `node --test scripts/lambda-package-budget.test.mjs` and
  record the new total; print process RSS after loading every artifact (compare
  against the 497 MB post-raise baseline, confirm far below 1769 MB); apply the
  PRD amendments proposed in `GATE-QUESTIONS.md`.

## Non-goals

- No combo, price, or rule content is dropped or trimmed.
- No change to the weekly Scryfall refresh trigger or schedule.
- The 120 MB budget line itself is not raised.
- Cold-start latency is not this build's job (addressed by the 2026-09-08 memory
  raise, PR #221; provisioned concurrency / warm ping stay owner options — not
  added here).
- No frontend change; no runtime network dependency; no range-read-from-S3,
  container image, Lambda layer, EFS, or database (all rejected in the intake
  brief on axes the numbers cannot change).

## Constraints (do not rediscover — intake brief)

- Mock-default local dev must still boot with the committed files present and with
  them missing (every loader fails open today; keep that).
- Never commit raw sources; `apps/backend/data/models/` stays gitignored.
- `data:build` must preserve a valid committed artifact when raw input is absent
  (REQ-093) — the preserve/validate paths must understand the new layout.
- The budget test counts tracked bytes; run it in slice F.
- Determinism: identical raw input → identical bytes (brotli deterministic for
  fixed params; keep params fixed and named).
- Three Node versions touch these files: 22 (CI), 24 (Lambda), 26 (local). Plain
  brotli (no dictionary) is core `zlib` on all three and behaves identically; the
  build and budget test must pass under 22.
- Distinct, do not conflate: the meta-sidecar snapshot-date gap (REQ-066), eval
  golden regen after a Comprehensive Rules refresh, and the 25 unresolved combo
  templates — all recorded as owner follow-ups in the resilient-weekly-data-refresh
  receipt, out of scope here.

## Proposed PRD truth

Recorded as complete diffs in `PRD/work/compact-data-extracts/GATE-QUESTIONS.md`,
never written to `PRD/sections/` here (build applies them). Amended stable IDs:
REQ-093, REQ-066, REQ-175, REQ-195, REQ-196, REQ-185, NFR-017; and the prose
sections integrations-and-data.md, in-depth/README.md,
trade-balancer/data/cardPrintingPrices.md, system-map.md (Card rulings, Artifact
builders, Printing-price artifact build, Commander Spellbook combo artifact build,
combo-retrieval entries), system-map/game-rules-retrieval.md, quick-lookup/README.md,
and trade-balancer/README.md.

## Evidence

- `PRD/work/compact-data-extracts/intake/GRAPH-BRIEF.md` — converged direction and
  measurements (evidence, not authority).
- `PRD/work/probe-data-extract-size/FINDINGS-extract-size.md` — full measurement
  tables; `tooling/measure-*.mjs` — the three measurement scripts.
- DEC-162 (per-variant gzip choice + the recorded block-layout fix); PR #221 (the
  1769 MB memory raise); resilient-weekly-data-refresh receipt (the 137.6 MB
  budget-gap follow-up this closes without trimming).
