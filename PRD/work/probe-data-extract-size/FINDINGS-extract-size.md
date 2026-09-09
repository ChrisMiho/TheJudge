# Findings — where the 120 MB goes, and how to get the full data under it

Date: 2026-09-08. Every number below was measured on this machine against the
committed artifacts on `main` (908fd6a) and a fresh combo build from today's raw
Commander Spellbook download (`apps/backend/data/commander-spellbook/`,
snapshot 2026-09-08, 108,484 variants). Nothing committed was changed; the
fresh build was written to the session scratch folder only. Scripts:
`measure-card-artifacts.mjs`, `measure-combo-encodings.mjs`,
`measure-fresh-index-and-file-reads.mjs` (scratch; copied verbatim into
`tooling/` beside this file).

## The answer in one paragraph

The budget problem is a **compression-layout** problem, not a data-volume
problem. The combo detail file is 91 MB fresh because each of the 108k combos is
gzipped on its own, so the compressor never sees the text the combos share.
Grouping combos into blocks of 128 and compressing each block with brotli takes
that file to **13 MB with every field kept**, and a single combo still reads
from disk in 0.34 ms. Re-encoding the four per-card files (rulings, card
detail, prices, combo index) as brotli instead of raw JSON or gzip saves a
further 30 MB. The full, untrimmed corpus lands at **~26 MB of the 120 MB
budget** (from 137 MB today). Merging prices and rulings into one per-card
record — the shape the owner proposed — saves 0.2 MB and is not worth doing.

## What the budget is

`scripts/lambda-package-budget.test.mjs` caps the **tracked files under
`apps/backend/data`** at 120 MB = Lambda's 250 MB unzipped quota minus a
130 MB reserve for code, `node_modules` (ONNX runtime, sharp, transformers) and
the bundled embedding model. The size that counts is the on-disk byte size of
each committed file, so a smaller committed encoding is a direct budget win.
The frontend's `public/data` (38 MB) ships to S3, not the Lambda, and is not
in this budget.

## What is in the budget today (committed on `main`)

| File | Committed | Encoding | Raw JSON | How the runtime reads it |
| --- | ---: | --- | ---: | --- |
| `commanderSpellbookCombos.json.gz` | 74.95 MB | one gzip member per combo, concatenated | 171 MB | positional read + gunzip of one member per requested combo (`catalog.ts`) |
| `cardRulingsByOracleId.json` | 18.61 MB | raw minified JSON | 18.61 MB | whole file parsed at startup (`cardRulings.ts`) |
| `cardDetailByOracleId.json` | 12.67 MB | raw minified JSON | 12.67 MB | whole file parsed at startup (`cardDetail.ts`) |
| `cardPrintingPricesByOracleId.json.gz` | 4.76 MB | single gzip | 16.05 MB | gunzip + parse at startup (`cardPrices.ts`) |
| `commanderSpellbookComboIndex.json.gz` | 4.30 MB | single gzip of **prettier-formatted** JSON | 24.15 MB | gunzip + parse at startup (`catalog.ts`) |
| `gameRulesRuleIndex.json` | 2.04 MB | raw JSON | 2.04 MB | parsed at startup |
| `gameRulesRuleEmbeddings.json` | 1.44 MB | int8-base64 (REQ-183) | 1.44 MB | parsed at startup |
| `gameRulesTokenStats.json` + 3 small files | 0.26 MB | raw JSON | | parsed at startup |
| **Total tracked** | **119.03 MB** | | | budget 120 MB → 0.97 MB headroom |

With today's fresh combo corpus (91.0 MB detail + 6.3 MB index) the same layout
totals **137.3 MB** — the over-budget figure that forced the price-only refresh
(PR #219) and left the fresh combos behind.

## Experiment 1 — codec per file (nothing restructured)

Whole-file compression of each artifact exactly as it is today. Times are
compress / decompress on an Apple laptop; the decompress column is the
cold-start cost the Lambda would pay once.

| File | Raw | gzip -9 | brotli q11 | zstd 19 | brotli decode |
| --- | ---: | ---: | ---: | ---: | ---: |
| rulings | 18.61 MB | 4.71 MB | **1.47 MB** | 1.53 MB | 29 ms |
| card detail | 12.67 MB | 2.87 MB | **1.57 MB** | 1.63 MB | 14 ms |
| prices (raw) | 16.05 MB | 4.65 MB | **3.41 MB** | 3.53 MB | 40 ms |
| combo index (committed, prettier) | 24.15 MB | 4.23 MB | **1.94 MB** | 2.10 MB | 23 ms |
| combo index (fresh, prettier) | 46.64 MB | 6.30 MB | **2.42 MB** | — | — |
| game rules rule index | 2.04 MB | 0.30 MB | 0.20 MB | 0.22 MB | 2 ms |
| rule embeddings | 1.44 MB | 1.04 MB | 1.00 MB | 1.02 MB | 8 ms |

Brotli at quality 11 wins on every file, by 2–3× over gzip on the text-heavy
ones (rulings and card text repeat the same reminder sentences thousands of
times, and brotli's larger window plus built-in English dictionary catches
that). Decode cost is 15–40 ms per file once at cold start — the same order as
the gunzip the prices file already pays. Brotli is in Node's core `zlib` since
v11 (the Lambda runs nodejs24.x); no dependency is added.

Zstd is within 5 % of brotli and compresses 3–4× faster at build time, but its
`zlib` binding is newer (v22.15 / v23.8) and brotli is both smaller and the
more conservative choice. Recommendation: brotli.

## Experiment 2 — the combo detail file (the real lever)

Fresh corpus: 108,484 variants, 191.8 MB of JSON.

**Where the raw bytes go** (share of the 191.8 MB):

| Field | Raw | Share |
| --- | ---: | ---: |
| `cardIngredients` | 55.6 MB | 29 % |
| `steps` | 46.3 MB | 24 % |
| `templateIngredients` | 39.6 MB | 21 % — of which `oracleIds` lists are **37.9 MB**, a verbatim copy of `index.templates[*].oracleIds` (1,017,440 ids across 5,501 template ingredients) |
| `producedEffects` | 16.4 MB | 9 % |
| `sourceUrl` | 5.8 MB | 3 % — derivable from `variantId` |
| everything else | 9.6 MB | 5 % |

**Encodings that keep per-combo random access** ("full" = every field as
today; "slim" = drop `sourceUrl` and the template `oracleIds`/`templateName`/
`scryfallApi`/`unresolved` fields, which the loader can rejoin from the index
it already holds in memory):

| Layout | gzip -9 | brotli q11 | zstd 19 | Random read of one combo |
| --- | ---: | ---: | ---: | ---: |
| per-record (today) | **90.96 MB** full / 65.30 slim | 77.63 / 56.52 | 89.43 / 65.98 | 0.02 ms (file-backed) |
| blocks of 32 | 32.65 / 14.16 | 17.53 / 11.98 | 19.35 / 13.20 | ~0.1–1 ms |
| **blocks of 128** | 30.09 / 11.84 | **12.99 / 8.91** | 14.19 / 9.66 | **0.34 ms** (file-backed, measured) |
| blocks of 512 | 29.44 / 11.26 | 10.63 / 7.28 | 11.45 / 7.76 | ~1–2.5 ms |
| one stream (lower bound, no random access) | 29.20 | — | 6.44 | n/a |

Reading: per-record gzip is 7× worse than block-128 brotli because a single
combo's JSON is ~1.7 KB and gzip's window never sees the neighbouring combos
that share card names, step phrasing, and effect names. Blocks of 128 sorted
by `variantId` (the existing order) recover almost all of that. Going from 128
to 512 saves 2.4 MB more but quadruples the read cost; 128 is the sweet spot.

Random access stays bounded: one block is ~230 KB decompressed, held only for
the duration of the read; the existing 64-entry per-variant LRU cache stays.
At most five combos enter a prompt, so the worst case per request is ~2 ms
versus ~0.1 ms today. Memory posture (the DEC-162 reason for random access —
never hold the whole corpus) is unchanged.

Build cost: brotli q11 over the whole corpus in 128-blocks takes ~80 s on this
laptop (gzip: 2 s; zstd 19: 24 s). That is inside a weekly `data:build` that
already streams a 646 MB export.

**Slim is not needed.** Dropping the duplicated fields saves a further 4 MB on
the block layout (13.0 → 8.9 MB). Against the headroom the block layout
already creates, it is not worth making the detail record depend on the index
for reconstruction; the per-record integrity model in `catalog.ts` ("a variant
record validates on its own") stays intact. Keep it as a documented lever.

## Experiment 3 — the combo index

The fresh index is 46.6 MB of prettier-formatted JSON (6.3 MB gzip), parsed in
full at every cold start. `byTemplateOracleId` is 23.5 MB of it (15,816 keys,
each listing variant-id strings); `byOracleId` 7.6 MB; `detailOffsets` 3.5 MB.

| Index form | Raw | gzip -9 | brotli q11 |
| --- | ---: | ---: | ---: |
| as built today (prettier) | 46.64 MB | 6.30 MB | 2.42 MB |
| minified (committed corpus) | 18.65 MB | 4.02 MB | 1.89 MB |
| positional ints (variant ids listed once, memberships as integer positions, per-block lengths instead of per-variant offsets) | 12.25 MB | 3.09 MB | 1.38 MB |

Brotli alone takes the fresh index from 6.3 MB to 2.4 MB. The positional-int
form is an optional second step whose main payoff is not budget (1 MB) but cold
start and resident memory: it cuts the JSON the Lambda parses at startup from
47 MB to 12 MB. DEC-162 measured ~95 MB RSS for the index alone. Worth doing,
but separable.

## Experiment 4 — the owner's hypothesis: one per-card record for prices + rulings

Merged every oracle id's card detail, rulings, and printings into one object
(`byOracleId[id] = { ...detail, rulings: [...], printings: [...] }`), the shape
"an array applied to each card". 37,564 oracle ids (19,542 have rulings).

| Shape | Raw | gzip -9 | brotli q11 | zstd 19 |
| --- | ---: | ---: | ---: | ---: |
| three separate files | 47.34 MB | 12.23 MB | 5.77 MB | 6.68 MB |
| one merged per-card file | 45.55 MB | 12.51 MB | 5.60 MB | 6.03 MB |
| **difference** | −1.8 MB | +0.29 MB | **−0.17 MB** | −0.65 MB |

The only bytes a merge removes are the repeated 36-character oracle-id keys
(1.8 MB raw), and a compressor already removes those. Under gzip the merge is
actually larger. Product-wise the merge also crosses two standing lines: the
price map is kept off the ask-ai path on purpose (REQ-175, the trade-balancer
corpus doc), and REQ-093 forbids folding combo data into the rulings artifact.
Verdict: keep the files separate; change their encoding.

A restructured price file (set names in a lookup table, printings as tuples)
was also measured: 3.28 MB brotli versus 3.41 MB as-is. Not worth a schema
change.

## The plan that clears the budget, with the numbers

Fresh corpus, no popularity floor, nothing dropped:

| Artifact | Today (fresh) | Proposed | Change |
| --- | ---: | ---: | --- |
| combo detail | 90.96 MB | **12.99 MB** | blocks of 128 combos, brotli q11; index carries block directory |
| combo index | 6.30 MB | **2.42 MB** | brotli instead of gzip (same JSON) |
| rulings | 18.61 MB | **1.47 MB** | brotli instead of raw |
| card detail | 12.67 MB | **1.57 MB** | brotli instead of raw |
| prices | 4.76 MB | **3.41 MB** | brotli instead of gzip |
| game rules (5 files) | 3.74 MB | 3.74 MB | unchanged |
| **Total tracked** | **137.3 MB** | **≈ 25.6 MB** | 94 MB headroom under 120 MB |

Doing **only** the combo detail change already lands at ≈ 59 MB. Adding the
four brotli re-encodes is three lines per loader (`brotliDecompressSync` in
place of `gunzipSync` / `readFileSync`) and is what buys the next 30 MB.

What does not change: runtime memory (the per-card files are already parsed
whole; the combo corpus is still read one block at a time), the artifact
contents, the route responses, the prompt, `MIN_VARIANT_POPULARITY = 0`, and
the budget test — which keeps guarding the 120 MB line and will now report
real headroom.

## What the build must touch (for the brief)

- `scripts/build-commander-spellbook-combos.mjs`: `serializeVariantDetail`
  emits 128-variant brotli blocks and a block directory (`[offset, length]`
  per block, plus variant → block/position); `trimCommittedArtifacts` (the
  emergency valve) and `readVariantDetail` read the new layout; index written
  with brotli, minified (prettier formatting of a 47 MB artifact nobody reads
  is pure cost).
- `apps/backend/src/commanderSpellbook/catalog.ts`: `readVariantDetail` reads
  the block, decompresses, picks the line; validation stays per variant; the
  structural check ("detail file covers every recorded range") moves to blocks.
- `scripts/build-card-rulings.mjs`, `build-card-detail-by-oracle-id.mjs`:
  write brotli; loaders `cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts`
  decode brotli. File names change extension (`.json.br`), so
  `refresh-and-open-pr.mjs`'s explicit 11-path list, `.gitignore` comments,
  `package-lambda.sh` (copies the directory — no change), and every eval
  reader that names a file (`eval/fixtureCardDetail.ts`,
  `eval/ragRetrievalBenchmark.ts`, `eval/contextEvaluationHarness.ts`,
  `eval/fixtures/README.md`) are updated together.
- Tests: the combo build/catalog suites, the three loader suites, the
  refresh-and-open-pr path fixtures, `lambda-package-budget.test.mjs` (the
  failure hint still names `MIN_VARIANT_POPULARITY`; add the block-size hint).
- PRD truth to amend in place (no new DEC): REQ-093's "gzipped per variant …
  76.9 MB detail + 4.8 MB index" criterion; NFR-017's measurement notes;
  `integrations-and-data.md` line on "concatenated individually-gzipped
  per-variant records"; `in-depth/README.md` "gzipped per variant for bounded
  memory"; `trade-balancer/data/cardPrintingPrices.md` (gzip → brotli, size);
  `system-map.md` entries "Card rulings", "Artifact builders", "Printing-price
  artifact build", "Commander Spellbook combo artifact build"; REQ-066 and
  REQ-175 where they say "gzip".

## Addendum — Trade Balancer lookup delay (measured 2026-09-08 evening)

The owner reported price lookups feeling slow after the price slim (PR #212)
moved prices from a frontend file to `GET /api/cards/:oracleId/prices`.
Timed directly against the live Function URL with curl:

| Price route hit | Time |
| --- | ---: |
| cold, first sample | 13.60 s |
| cold, second sample after 15 min idle | 12.30 s |
| warm (11 samples) | 168 – 205 ms, of which ~105 ms is DNS + TLS from a fresh connection |
| `GET /api/health` warm | ~175 ms |

The warm cost is the per-card round trip the slim introduced; it is fine. The
cold start is the problem: 12–14 s against a 20 s function timeout.

Same startup on this laptop (`tooling/time-startup.mts`,
`tooling/time-imports.mts`): rulings parse 59 ms, card detail 66 ms, prices
82 ms, combo index gunzip + parse 112 ms, import of
`@huggingface/transformers` + ONNX + sharp 118 ms, first embedding 70–280 ms —
**about 0.6 s total**, reaching ~660 MB RSS (200 MB V8 heap). The Lambda runs
at 512 MB, i.e. roughly a third of a vCPU, and must hold that same working set
inside 512 MB. CPU starvation plus GC pressure account for the ~20× gap.

The encoding change in this probe is **neutral** for cold start (brotli decode
adds ~20 ms on the price file). Levers that do move it, in order:

1. Raise the function memory (`--memory-size` in `scripts/aws-bootstrap.sh`,
   currently 512) to 1024 or 1769 MB — CPU scales with memory.
2. The positional-int combo index (optional step F in the brief): parse 12 MB
   instead of 24 MB (47 MB after the fresh refresh) at every cold start and
   hold ~100 MB less.
3. Provisioned concurrency or a scheduled warm ping if cold starts must go
   away entirely.

**Confirmed from AWS (CloudWatch `/aws/lambda/thejudge-api`, last 6 h, and
`get-function-configuration`, 2026-09-08 evening):**

| Setting / report field | Value |
| --- | ---: |
| Memory size | 512 MB (timeout 20 s, arm64, nodejs24.x, no provisioned concurrency, no SnapStart) |
| Deployed code size (zip) | 137.1 MB |
| `Init Duration` (module load, 3 cold starts) | 834 – 843 ms |
| First-invocation `Duration` (3 cold starts) | 8,620 / 9,095 / 10,070 / 10,174 ms |
| `Max Memory Used` | 407 – 428 MB warm; **491 MB** during one cold start (21 MB below the cap) |
| Warm invocation `Duration` (17 samples) | 2 – 4 ms |

Reading: the price lookup itself costs 2–4 ms; the ~170 ms warm figure is
entirely network. The cold-start work (SSM key fetch + parsing every artifact
+ loading the embedding model) runs inside the **first invocation**, not the
init phase, and takes 9–10 s at 512 MB while memory peaks at 491 MB of 512.
That is CPU starvation (512 MB ≈ ⅓ vCPU) and near-OOM at the same time.

**Consequence for this probe's plan:** the fresh combo index is 46.6 MB of
JSON (versus 24 MB committed) and would add on the order of 100 MB of resident
memory when parsed — past the 512 MB cap. So the encoding change alone lets
the fresh corpus *deploy*, but the function would then be at real risk of
running out of memory on cold start. Either the function memory is raised
first, or the positional-int index (parse 12 MB, hold far less) is made a
required part of the build, or both. Recommended: both — raise memory to
1769 MB (one full vCPU; per-request cost is dominated by the 2–4 ms warm
calls, so the bill barely moves) and keep the compact index in the build.

### Applied 2026-09-08: memory raised 512 → 1769 MB

The owner chose to raise the dial. `aws lambda update-function-configuration
--memory-size 1769` applied (status `Successful`), then a forced cold start
timed immediately:

| | 512 MB (before) | 1769 MB (after) |
| --- | ---: | ---: |
| cold start over the wire (curl) | 12.3 – 13.6 s | **5.07 s** |
| first-invocation `Duration` (CloudWatch) | 8.6 – 10.2 s | **2.40 s** |
| `Init Duration` | 0.84 s | 0.66 s |
| `Max Memory Used` | 491 MB (of 512) | 497 MB (of 1769) |
| warm over the wire | 168 – 205 ms | 182 – 219 ms |
| warm in-Lambda | 2 – 4 ms | 2 – 3 ms |

The ~2.6 s between the in-Lambda 3.1 s and the 5.1 s on the wire is AWS
fetching the 137 MB package onto the fresh instance plus Function URL
routing — outside the code's control, and the reason a smaller package (the
encoding change) still helps cold start a little. Committed infra synced:
`scripts/aws-bootstrap.sh` `--memory-size 1769`.

Cost at 1769 MB and this traffic (85 invocations / 30 days): a cold start is
~1.769 GB × 3 s ≈ 5.3 GB-s ≈ $0.00007; warm calls are ~0. Inside the
400,000 GB-s/month free tier by four orders of magnitude.

## Loose ends noticed, not in scope

- `apps/backend/data/models/` (23 MB warmed embedding model) sits in the 130 MB
  reserve, not the data budget; unaffected.
- The reserve itself was measured on macOS and NFR-017 still flags it as "to
  be re-measured on the CI runner". With 94 MB of data headroom that no longer
  threatens deploys, but the note stands.
- `gameRulesRuleIndex.json` (2 MB → 0.2 MB brotli) was left alone: it is
  re-hashed by the embeddings build (`ruleIndexHash`) and the gain is small.
