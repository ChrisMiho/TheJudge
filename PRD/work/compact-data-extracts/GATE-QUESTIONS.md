# Gate questions — compact-data-extracts (define gate)

These are proposed edits to durable product truth in `PRD/sections/`. They are
**not** written to `PRD/sections/` yet — build applies the accepted ones. Answer
each block's `Verdict` with `accept`, `edit` (say what to change), or `reject`.

Every change here is encoding-only: how the committed backend data is compressed
and named on disk. No combo, ruling, price, or answer a player sees changes. The
figures cited come from the 2026-09-08 measurement in the intake brief; slice F
re-records the exact committed bytes when it regenerates the artifacts.

Renamed committed files (the thread running through every block below):

| Today | New |
| --- | --- |
| `commanderSpellbookCombos.json.gz` (per-variant gzip) | `commanderSpellbookComboBlocks.br` (concatenated brotli 128-combo blocks) |
| `commanderSpellbookComboIndex.json.gz` | `commanderSpellbookComboIndex.json.br` |
| `cardRulingsByOracleId.json` (raw JSON) | `cardRulingsByOracleId.json.br` |
| `cardDetailByOracleId.json` (raw JSON) | `cardDetailByOracleId.json.br` |
| `cardPrintingPricesByOracleId.json.gz` | `cardPrintingPricesByOracleId.json.br` |

---

## REQ-093 — combo data stored as brotli blocks, not one-combo-at-a-time gzip

**What this decides:** how the committed Commander Spellbook combo corpus is
compressed on disk — one gzip per combo (today) or brotli over blocks of 128
combos (proposed) — and the file names that carry it. It also names the combo
detail file `commanderSpellbookComboBlocks.br`.

**In plain terms:** REQ-093 is the requirement that TheJudge ships a committed
snapshot of Commander Spellbook's combos so answers never call an outside service
at runtime. Today it compresses each combo on its own, which means the compressor
never sees the text neighbouring combos share, so the file is large (a fresh
corpus is ~91 MB and overflows the 120 MB deploy budget). The change groups
combos into blocks of 128 and compresses each block with brotli (a compressor
built into Node), so shared text compresses once per block instead of never — the
same combos in ~13 MB. A single-combo lookup still reads just its own block
(~230 KB) and decodes only that, so memory stays bounded exactly as DEC-162
requires. DEC-162 is the original combo-build decision; it chose per-combo gzip
for bounded memory and recorded this exact block-batching as the fix if size
became a problem — it has.

**What happens if you say no:** the combo corpus stays per-combo gzip, a fresh
corpus stays ~91 MB, the deploy budget stays blown, and the weekly refresh keeps
shipping prices only (or trimming combos players see) to fit.

```diff
@@ REQ-093 Acceptance Criteria @@
-  - committed artifacts are gzipped per variant, measuring 76.9 MB detail + 4.8 MB index over the real corpus; the loader reads only the requested variant's byte range and gunzips only that slice, so resident memory stays bounded regardless of corpus size (DEC-162)
+  - committed combo detail is stored as brotli-compressed blocks of 128 variants in `variantId` order (records inside a block are newline-delimited JSON, one variant per line; each block is one brotli member, the members concatenated into one file), measuring ~13.0 MB detail + ~2.4 MB index over the fresh corpus (re-recorded at build); a lookup reads only the requested variant's block byte range and brotli-decodes that one block (~230 KB), holding a single block resident only for the read, so resident memory stays bounded regardless of corpus size (DEC-162)
```

```diff
@@ REQ-093 Constraints @@
-  - do not fold combo data into `cardMetadata.json`, `cardRulingsByOracleId.json`, or the WotC rules artifacts; each corpus keeps one authoritative shape
+  - do not fold combo data into `cardMetadata.json`, `cardRulingsByOracleId.json.br`, or the WotC rules artifacts; each corpus keeps one authoritative shape
```

```diff
@@ REQ-093 Notes @@
-  - planned paths are gzipped `apps/backend/data/commanderSpellbookCombos.json.gz` and `apps/backend/data/commanderSpellbookComboIndex.json.gz`, built from gitignored raw inputs under `apps/backend/data/commander-spellbook/`
+  - committed paths are `apps/backend/data/commanderSpellbookComboBlocks.br` (concatenated brotli 128-variant blocks) and `apps/backend/data/commanderSpellbookComboIndex.json.br` (a single minified-brotli index carrying, in one shape: `variantIds` listed once in `variantId` order as a positional dictionary, a per-block byte `[offset, length]` directory, and exact/template oracle membership as integer positions into `variantIds`), built from gitignored raw inputs under `apps/backend/data/commander-spellbook/`. Brotli is Node core `zlib` at fixed quality 11 with no dictionary (Node 22 in CI silently ignores a brotli dictionary while Node 24 on Lambda honours it), so identical raw input yields identical bytes across CI, Lambda, and local
```

- Verdict:
- Reason:

---

## REQ-066 — the committed price file is brotli, named `.json.br`

**What this decides:** the committed backend price file's name and compression —
gzip `.json.gz` today, brotli `.json.br` proposed.

**In plain terms:** REQ-066 is the requirement that TheJudge builds a committed
price list (every printing's USD price, keyed by card) so the Trade Balancer can
price cards without any live price service. The file is compressed today; this
switches it from gzip to brotli, which packs the same prices smaller, and renames
it `.json.br` so the name states the compression. The prices themselves, the
snapshot date, and the on-demand price route are unchanged.

**What happens if you say no:** the price file stays gzip and the requirement's
named path stays out of step with the brotli the rest of this change adopts.

```diff
@@ REQ-066 Acceptance Criteria @@
-  - the committed price artifact is **backend-only** (working name `apps/backend/data/cardPrintingPricesByOracleId.json`), keyed by **oracle id**; per oracle it carries the card's list of printings, each with printing id, set code, set name, collector number, `usd` (non-foil), and `usd_foil`; it records a **snapshot date**. Card name and image url are **not** stored per printing — name comes from the shared `cardMetadata` index (REQ-174) and image url is derived from the printing id (Scryfall template)
+  - the committed price artifact is **backend-only**, brotli-compressed (`apps/backend/data/cardPrintingPricesByOracleId.json.br`), keyed by **oracle id**; per oracle it carries the card's list of printings, each with printing id, set code, set name, collector number, `usd` (non-foil), and `usd_foil`; it records a **snapshot date**. Card name and image url are **not** stored per printing — name comes from the shared `cardMetadata` index (REQ-174) and image url is derived from the printing id (Scryfall template)
```

```diff
@@ REQ-066 Acceptance Criteria @@
-  - the backend loads the committed price map into memory at startup and serves one card's printings on demand (REQ-175) with **no runtime network call**, exactly like `cardDetailByOracleId.json`; the former `apps/frontend/public/data/cardPrintingPrices.json` is deleted and is no longer downloaded up front
+  - the backend brotli-decodes the committed price map into memory once at startup and serves one card's printings on demand (REQ-175) with **no runtime network call**, exactly like `cardDetailByOracleId.json.br`; the former `apps/frontend/public/data/cardPrintingPrices.json` is deleted and is no longer downloaded up front
```

- Verdict:
- Reason:

---

## REQ-175 — the committed card-detail file is brotli, named `.json.br`

**What this decides:** the committed card-detail file's name and compression —
raw JSON `.json` today, brotli `.json.br` proposed.

**In plain terms:** REQ-175 is the requirement behind the card-detail popup and
the `GET /api/cards/:oracleId` route: one committed file holds each card's rules
text and type line, served on demand. Today that file is uncompressed JSON
(~12.7 MB); brotli takes it to ~1.6 MB with no change to what it holds or serves.
The backend decodes it once at startup, so the route response is byte-identical.

**What happens if you say no:** the card-detail file stays raw JSON, ~11 MB
heavier than it needs to be, eating deploy-budget headroom for nothing.

```diff
@@ REQ-175 Acceptance Criteria @@
-  - the map is committed once, backend-only, under `apps/backend/data/cardDetailByOracleId.json`; no card-detail copy is committed under `apps/frontend/public/data/` and none is downloaded up front (NFR-019)
+  - the map is committed once, backend-only, brotli-compressed under `apps/backend/data/cardDetailByOracleId.json.br` and brotli-decoded into memory once at startup; no card-detail copy is committed under `apps/frontend/public/data/` and none is downloaded up front (NFR-019)
```

- Verdict:
- Reason:

---

## REQ-195 — the weekly-refresh note names the brotli price file

**What this decides:** the file name the weekly-refresh requirement records for
the price artifact it commits — `.json.gz` today, `.json.br` proposed.

**In plain terms:** REQ-195 is the weekly one-command refresh that opens a pull
request with fresh data. A note in it names the exact price file the cadence
commits. Since that file becomes brotli, the note is updated to match.

**What happens if you say no:** the weekly-refresh note names a file that no
longer exists, and the refresh wrapper's path list (slice D) drifts from the spec.

```diff
@@ REQ-195 Notes @@
-    option no longer has a standalone script and the full refresh is the only
-    path. The price artifact the cadence now commits is the gzip
-    `apps/backend/data/cardPrintingPricesByOracleId.json.gz`
-    (`build-card-detail-by-oracle-id.mjs`, REQ-066/REQ-175), a few MB rather
+    option no longer has a standalone script and the full refresh is the only
+    path. The price artifact the cadence now commits is the brotli
+    `apps/backend/data/cardPrintingPricesByOracleId.json.br`
+    (`build-card-detail-by-oracle-id.mjs`, REQ-066/REQ-175), a few MB rather
```

- Verdict:
- Reason:

---

## REQ-196 — the hash-gate criterion names the brotli combo files

**What this decides:** the two combo file names the hash-gated-reuse criterion
records — `commanderSpellbookCombos.json.gz` / `...ComboIndex.json.gz` today, the
brotli block file / index proposed.

**In plain terms:** REQ-196 lets the weekly refresh skip rebuilding combos when
nothing changed, leaving the committed combo files byte-unchanged. It names those
files; since the detail file becomes `commanderSpellbookComboBlocks.br` and the
index `commanderSpellbookComboIndex.json.br`, the criterion is updated to name
them.

**What happens if you say no:** the hash-gate criterion names files that no
longer exist, so "leaves them byte-unchanged" points at nothing.

```diff
@@ REQ-196 Acceptance Criteria @@
-  - when both hashes match the freshly downloaded inputs, the run performs no
-    Scryfall template expansion and no combo rebuild, and leaves
-    `commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`
-    byte-unchanged (so nothing is staged for them)
+  - when both hashes match the freshly downloaded inputs, the run performs no
+    Scryfall template expansion and no combo rebuild, and leaves
+    `commanderSpellbookComboBlocks.br` / `commanderSpellbookComboIndex.json.br`
+    byte-unchanged (so nothing is staged for them)
```

- Verdict:
- Reason:

---

## REQ-185 — the answer-quality note names the brotli rulings file

**What this decides:** the rulings file path cited in the answer-quality gold-set
requirement — `cardRulingsByOracleId.json` today, `.json.br` proposed.

**In plain terms:** REQ-185 defines the committed set of hard rules questions with
published correct answers used to score answer quality. One criterion cites the
committed rulings file by path as the source of tier-2 reference answers. Since
that file becomes brotli, the path is updated; nothing about the gold set or the
scoring changes.

**What happens if you say no:** the requirement cites a rulings file path that no
longer exists.

```diff
@@ REQ-185 Acceptance Criteria (tier 2) @@
-  - **tier 2** — the reference answer is a WotC card ruling verbatim from `apps/backend/data/cardRulingsByOracleId.json` (76,605 rulings over 19,542 cards, measured 2026-09-06), cited by card name, oracle id, and ruling date;
+  - **tier 2** — the reference answer is a WotC card ruling verbatim from `apps/backend/data/cardRulingsByOracleId.json.br` (76,605 rulings over 19,542 cards, measured 2026-09-06), cited by card name, oracle id, and ruling date;
```

(The rest of the tier-2 criterion is unchanged; only the file path in its first
clause moves.)

- Verdict:
- Reason:

---

## REQ-167 — the multi-card lookup names the brotli card-detail file

**What this decides:** the file name REQ-167 records for where the backend reads
each attached card's rules text — `cardDetailByOracleId.json` today, `.json.br`
proposed. File name only.

**In plain terms:** REQ-167 is the Quick Question feature that lets a player
attach several cards at once with no game state, and the backend fills in each
card's oracle text and type line server-side rather than trusting the request.
One acceptance line names the committed card-detail file it reads those fields
from. That file becomes brotli and is renamed `.json.br`, so the line is updated
to match. Nothing about the multi-card behaviour, the 5-card cap, or the
enrichment changes. This block exists because the earlier proposal renamed the
card-detail file but left this line naming the old name, which would then point at
a file that no longer exists.

**What happens if you say no:** REQ-167 names a card-detail file that no longer
exists after the rename, and the multi-card lookup requirement drifts from the
committed artifact it reads.

```diff
@@ REQ-167 Acceptance Criteria @@
-  - The lookup request carries an optional **bounded list** of cards in place of the single optional card; each entry carries only identity — `cardId` (oracle id) and `name` — and carries no zone, owner, caster, targets, or context-notes fields. The descriptive block (`oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json` (REQ-175, REQ-176). The per-card enrichment below is unchanged — it resolves each attached card's metadata server-side rather than from the request.
+  - The lookup request carries an optional **bounded list** of cards in place of the single optional card; each entry carries only identity — `cardId` (oracle id) and `name` — and carries no zone, owner, caster, targets, or context-notes fields. The descriptive block (`oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json.br` (REQ-175, REQ-176). The per-card enrichment below is unchanged — it resolves each attached card's metadata server-side rather than from the request.
```

- Verdict:
- Reason:

---

## REQ-180 — the keyword-build criterion names the brotli card-detail file

**What this decides:** the file name REQ-180 records as the artifact its build
writes per-card Scryfall keywords into — `cardDetailByOracleId.json` today,
`.json.br` proposed. File name only.

**In plain terms:** REQ-180 is the requirement that the card-data build stores
each card's Scryfall `keywords` list inside the committed card-detail file, which
the rule-retrieval scorer then reads to build its keyword signal. One acceptance
line names that file as the build's output. Since the card-detail file becomes
brotli and is renamed `.json.br`, the line is updated to match; the keyword data,
the build, and the retrieval behaviour are unchanged. This block exists because
the earlier proposal renamed the card-detail file but left this build-output line
naming the old name, which would then describe a file the build no longer writes.

**What happens if you say no:** REQ-180 says the build writes keywords into a file
that no longer exists after the rename, so the build-output description points at
nothing.

```diff
@@ REQ-180 Acceptance Criteria @@
-  - the card-data build writes each card's Scryfall `keywords` array into the committed backend card-detail artifact (`cardDetailByOracleId.json`), alongside the fields it already resolves server-side (REQ-176)
+  - the card-data build writes each card's Scryfall `keywords` array into the committed backend card-detail artifact (`cardDetailByOracleId.json.br`), alongside the fields it already resolves server-side (REQ-176)
```

- Verdict:
- Reason:

---

## NFR-017 — record the re-measurement and add a re-encode lever to the budget hint

**What this decides:** whether the deploy-budget requirement records the
2026-09-08 re-measurement (137.3 MB fresh → ≈25.6 MB after this change) and names
block-size / re-encoding as a size lever beside the emergency popularity valve.

**In plain terms:** NFR-017 is the guardrail that fails the build when the
committed data would overflow the 120 MB Lambda deploy budget. Its failure hint
today points at two levers: ship less data, or (as an emergency) raise
`MIN_VARIANT_POPULARITY` to drop low-popularity combos. This change makes the
encoding itself the primary lever, so the hint should say so, and the Notes should
record that a fresh corpus measured 137.3 MB before this change and ≈25.6 MB after
— the measurement that justified the work. The 120 MB line itself does not move.

One existing NFR-017 Note (the 2026-09-05 re-measurement) names the card-detail
file by its old `.json` name; after the rename that reference points at a file
that no longer exists, so the file name in that dated note is updated to
`.json.br` — the date and the measured figures are untouched, only the artifact's
current name. If you would rather leave the historical name exactly as written,
`reject` this one diff; the rest of the block stands on its own.

**What happens if you say no:** the guardrail keeps pointing only at trimming
combos as the size valve, and the record omits the measurement that closed the
budget gap without trimming.

```diff
@@ NFR-017 Constraints @@
-  - the full combo corpus is the standing state (`MIN_VARIANT_POPULARITY` = 0, REQ-093); the failure message names the largest data contributors and points at the levers (reduce committed data, or as an emergency size valve raise `MIN_VARIANT_POPULARITY` to re-trim), consistent with the current test's guidance
+  - the full combo corpus is the standing state (`MIN_VARIANT_POPULARITY` = 0, REQ-093); the failure message names the largest data contributors and points at the levers (re-encode the committed artifacts — smaller combo block size or higher brotli quality — reduce committed data, or as an emergency size valve raise `MIN_VARIANT_POPULARITY` to re-trim), consistent with the current test's guidance
```

```diff
@@ NFR-017 Notes (append a new note) @@
+  - re-measured 2026-09-08 against a fresh combo corpus (108,484 variants) and the committed price/rulings/card-detail artifacts: the fresh, untrimmed corpus was 137.3 MB tracked (over the 120 MB budget) under the old encoding, and ≈25.6 MB after re-encoding the committed extracts to brotli with the combo detail in 128-variant blocks (REQ-093), leaving ≈94 MB of headroom with no combo, price, or rule content dropped. The encoding change is neutral for cold start (brotli decode adds ~20 ms on the price file); slice F prints post-load process RSS to confirm the fresh corpus stays far below the 1769 MB the function now runs at (497 MB baseline, PR #221)
```

```diff
@@ NFR-017 Notes (existing 2026-09-05 re-measurement note) @@
-  - re-measured again 2026-09-05 once REQ-180's committed keyword data actually landed (`cardDetailByOracleId.json` rebuilt with real per-card Scryfall keywords) and the committed rule-embeddings artifact gained its `ruleIndexHash` field (REQ-181/E12): tracked data is now 118.1 MB against the 120 MB budget — 1.9 MB headroom, materially less than before. This is a real, measured constraint, not a comfortable margin; the next data-artifact growth must re-check it before merging
+  - re-measured again 2026-09-05 once REQ-180's committed keyword data actually landed (`cardDetailByOracleId.json.br` rebuilt with real per-card Scryfall keywords) and the committed rule-embeddings artifact gained its `ruleIndexHash` field (REQ-181/E12): tracked data is now 118.1 MB against the 120 MB budget — 1.9 MB headroom, materially less than before. This is a real, measured constraint, not a comfortable margin; the next data-artifact growth must re-check it before merging
```

- Verdict:
- Reason:

---

## integrations-and-data.md — combo/price/rulings/card-detail encoding and file names

**What this decides:** the data-integrations section's description of how the
committed combo, price, rulings, and card-detail artifacts are stored —
per-variant gzip / gzip / raw / raw today, brotli blocks / brotli / brotli /
brotli proposed — and their file names. Card detail is the committed file behind
the card-detail popup and the `GET /api/cards/:oracleId` route: one map holding
each card's rules text and type line, served on demand.

**In plain terms:** this section is the durable description of TheJudge's data
sources and committed artifacts. It states the combo files are "concatenated
individually-gzipped per-variant records," the price file is gzip, and the rulings
and card-detail files are raw JSON. All four change to brotli (combos in
128-variant blocks), so the descriptions and file names are updated to match. This
section names the card-detail file in four separate places — the
`GET /api/cards/:oracleId` endpoint purpose, the request card-shape resolution
line, the Card Detail Data Strategy paragraph, and the Delivery Strategy zone
line — and each is updated so none names a file that no longer exists after the
rename. No source or field changes.

**What happens if you say no:** the section describes an encoding the artifacts no
longer use, and names files that no longer exist — including the card-detail file
in the four places above.

```diff
@@ Endpoint: GET /api/cards/:oracleId/prices @@
-- serve one card's printings and prices by Scryfall `oracle_id`, read-only, from the committed `cardPrintingPricesByOracleId.json.gz` artifact (REQ-066, REQ-175), kept separate from the descriptive block so the card-detail/ask-ai path carries no price bytes
+- serve one card's printings and prices by Scryfall `oracle_id`, read-only, from the committed `cardPrintingPricesByOracleId.json.br` artifact (REQ-066, REQ-175), kept separate from the descriptive block so the card-detail/ask-ai path carries no price bytes
```

```diff
@@ Rulings Data Strategy @@
-- the committed backend artifact is `apps/backend/data/cardRulingsByOracleId.json`, a trimmed map keyed by Scryfall `oracle_id`
+- the committed backend artifact is `apps/backend/data/cardRulingsByOracleId.json.br`, a brotli-compressed trimmed map keyed by Scryfall `oracle_id`, brotli-decoded into memory once at startup
```

```diff
@@ Commander Spellbook combo data @@
-- the committed backend artifacts are gzipped: `apps/backend/data/commanderSpellbookCombos.json.gz` (trimmed variant detail + source manifest, stored as concatenated individually-gzipped per-variant records) and `apps/backend/data/commanderSpellbookComboIndex.json.gz` (inverse oracle membership, template expansions, unresolved-template metadata, and a `variantId` → byte offset/length directory into the detail artifact). They measure 76.9 MB + 4.8 MB as committed, so no variant is dropped for size. The index is parsed once at first use; a detail lookup reads only that variant's byte range and gunzips only that slice, keeping resident memory bounded — which is the constraint that mattered, not load time or repository footprint (DEC-162)
+- the committed backend artifacts are brotli-compressed: `apps/backend/data/commanderSpellbookComboBlocks.br` (trimmed variant detail, stored as blocks of 128 variants in `variantId` order — records inside a block are newline-delimited JSON, each block one brotli member, the members concatenated) and `apps/backend/data/commanderSpellbookComboIndex.json.br` (a single minified-brotli index carrying inverse oracle membership, template expansions, unresolved-template metadata, `variantIds` listed once in `variantId` order as a positional dictionary, a per-block byte `[offset, length]` directory into the detail artifact, and memberships as integer positions into `variantIds`). They measure ~13.0 MB + ~2.4 MB over the fresh corpus (re-recorded at build), so no variant is dropped for size. The index is parsed once at first use; a detail lookup reads only the requested variant's block byte range and brotli-decodes that one block (~230 KB), keeping resident memory bounded — which is the constraint that mattered, not load time or repository footprint (DEC-162)
```

```diff
@@ Trade Balancer pricing @@
-- pricing uses a committed, printing-level static price artifact, backend-only under `apps/backend/data/` (`cardPrintingPricesByOracleId.json.gz`), built in the same pass as the card-detail build (`scripts/build-card-detail-by-oracle-id.mjs`, unified — no separate build script) alongside `data:build` / `data:refresh` (REQ-066)
+- pricing uses a committed, printing-level static price artifact, backend-only under `apps/backend/data/` (`cardPrintingPricesByOracleId.json.br`), built in the same pass as the card-detail build (`scripts/build-card-detail-by-oracle-id.mjs`, unified — no separate build script) alongside `data:build` / `data:refresh` (REQ-066)
```

```diff
@@ Trade Balancer pricing @@
-- raw downloaded bulk data remains gitignored; only the trimmed, gzip-compressed price artifact is committed
+- raw downloaded bulk data remains gitignored; only the trimmed, brotli-compressed price artifact is committed
```

```diff
@@ Request card shape (descriptive-block resolution) @@
-- the descriptive block (`oracleText`, `manaCost`, `manaValue`, `typeLine`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields by `cardId` from `cardDetailByOracleId.json` (REQ-175, REQ-176)
+- the descriptive block (`oracleText`, `manaCost`, `manaValue`, `typeLine`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields by `cardId` from `cardDetailByOracleId.json.br` (REQ-175, REQ-176)
```

```diff
@@ Endpoint: GET /api/cards/:oracleId — Purpose @@
-- serve one card's descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`) by Scryfall `oracle_id`, read-only, from the committed `cardDetailByOracleId.json` artifact (REQ-175)
+- serve one card's descriptive block (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`, `subtypes`) by Scryfall `oracle_id`, read-only, from the committed `cardDetailByOracleId.json.br` artifact (REQ-175)
```

```diff
@@ Card Detail Data Strategy @@
-- the map is committed once, backend-only, under `apps/backend/data/cardDetailByOracleId.json`; there is no frontend copy
+- the map is committed once, backend-only, brotli-compressed under `apps/backend/data/cardDetailByOracleId.json.br` and brotli-decoded into memory once at startup; there is no frontend copy
```

```diff
@@ Delivery Strategy — populated zone sections @@
-- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; the card-intrinsic fields are resolved server-side by `cardId` from `cardDetailByOracleId.json` (REQ-176), targets and context notes come from the request; empty oracle emits `(none) — no oracle text recorded for this card`
+- populated zone sections — each card in every populated zone (stack and non-stack) includes the full card metadata block: oracle text, mana cost/value, type line, colors, supertypes/subtypes, targets, and context notes; the card-intrinsic fields are resolved server-side by `cardId` from `cardDetailByOracleId.json.br` (REQ-176), targets and context notes come from the request; empty oracle emits `(none) — no oracle text recorded for this card`
```

(Unchanged: line naming the raw upstream **input** `variants.json.gz` — that is
Commander Spellbook's bulk export, not a committed artifact, and stays gzip.)

- Verdict:
- Reason:

---

## in-depth/README.md — combo storage description

**What this decides:** the in-depth overview's one-line description of how the
committed combo corpus is stored — "gzipped per variant" today, brotli blocks
proposed.

**In plain terms:** this overview mentions the combo corpus is "gzipped per
variant for bounded memory." That becomes brotli blocks of 128 variants, which
keeps memory bounded the same way. One clause updated.

**What happens if you say no:** the overview describes the old per-variant gzip.

```diff
@@ Combo enrichment (machinery consumed) @@
-- Built: a committed, backend-only Commander Spellbook combo corpus (built from
-  the public bulk export, keyed on `oracleId` → `cardId`, gzipped per variant for
-  bounded memory) feeds gated retrieval.
+- Built: a committed, backend-only Commander Spellbook combo corpus (built from
+  the public bulk export, keyed on `oracleId` → `cardId`, stored as brotli-
+  compressed blocks of 128 variants so a lookup decodes one block and memory stays
+  bounded) feeds gated retrieval.
```

- Verdict:
- Reason:

---

## trade-balancer/data/cardPrintingPrices.md — the price corpus doc

**What this decides:** the price-corpus document's title, file name, encoding
paragraph, and measured on-disk size — gzip throughout today, brotli proposed.

**In plain terms:** this is the reference doc for the committed price file: where
it comes from, its shape, and its size on disk. Every mention of gzip and the
`.json.gz` name becomes brotli and `.json.br`. The prices, shape, and route are
unchanged; only the compression and the disk size move (~4.6 MB gzip → ~3.4 MB
brotli, re-recorded at build).

**What happens if you say no:** the corpus doc names a gzip file that no longer
exists and reports a stale on-disk size.

```diff
@@ title @@
-# Printing price corpus — `cardPrintingPricesByOracleId.json.gz`
+# Printing price corpus — `cardPrintingPricesByOracleId.json.br`
```

```diff
@@ Why it is a corpus, not a feature spec @@
-- **Committed artifact:** `apps/backend/data/cardPrintingPricesByOracleId.json.gz`
-  (backend-only; there is no frontend copy).
+- **Committed artifact:** `apps/backend/data/cardPrintingPricesByOracleId.json.br`
+  (backend-only; there is no frontend copy).
```

```diff
@@ Where it comes from and how it is built @@
-  `cardDetailByOracleId.json` — no fourth extract of the bulk file. Emitted to
-  `apps/backend/data/cardPrintingPricesByOracleId.json.gz` and committed. Raw
-  bulk input stays gitignored; only the trimmed, gzip-compressed artifact is
-  committed (REQ-066).
+  `cardDetailByOracleId.json.br` — no fourth extract of the bulk file. Emitted to
+  `apps/backend/data/cardPrintingPricesByOracleId.json.br` and committed. Raw
+  bulk input stays gitignored; only the trimmed, brotli-compressed artifact is
+  committed (REQ-066).
```

```diff
@@ Where it comes from and how it is built @@
-- The build degrades gracefully: a missing or failed source keeps the prior
-  committed artifacts (both `cardDetailByOracleId.json` and this file) and does
-  not break other artifact builds (REQ-066).
+- The build degrades gracefully: a missing or failed source keeps the prior
+  committed artifacts (both `cardDetailByOracleId.json.br` and this file) and does
+  not break other artifact builds (REQ-066).
```

```diff
@@ Where it comes from and how it is built @@
-- **Committed gzip-compressed, not raw JSON.** The raw shape is ~15.6 MB for the
-  current corpus — inside the Lambda package's committed-data budget, but with
-  under 1 MB of headroom once the other committed backend artifacts (rules
-  text, rulings, game rules, the Commander Spellbook combo corpus) are counted.
-  Gzipped it is ~4.6 MB, mirroring the existing
-  `commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`
-  committed-gzip pattern already in `apps/backend/data/`; the backend
-  decompresses it once at startup (REQ-175), the same way
-  `apps/backend/src/commanderSpellbook/catalog.ts` already does. See
-  `scripts/lambda-package-budget.test.mjs`.
+- **Committed brotli-compressed, not raw JSON.** The raw shape is ~15.6 MB for the
+  current corpus. Brotli-compressed it is ~3.4 MB (re-recorded at build), mirroring
+  the brotli committed-artifact pattern the backend data folder now uses across the
+  combo blocks (`commanderSpellbookComboBlocks.br`), the combo index
+  (`commanderSpellbookComboIndex.json.br`), rulings, and card detail; the backend
+  brotli-decodes it once at startup (REQ-175), the same way
+  `apps/backend/src/commanderSpellbook/catalog.ts` already reads its blocks. See
+  `scripts/lambda-package-budget.test.mjs`.
```

```diff
@@ Measured bounds (current committed snapshot) @@
-Read from the committed `cardPrintingPricesByOracleId.json.gz`; a future
-refresh moves these.
-
-- File size on disk (gzip-compressed): ≈ 4.6 MB.
+Read from the committed `cardPrintingPricesByOracleId.json.br`; a future
+refresh moves these.
+
+- File size on disk (brotli-compressed): ≈ 3.4 MB (re-recorded at build).
```

```diff
@@ Where it lives @@
-`scripts/build-card-detail-by-oracle-id.mjs` (build, wired into `npm run
-data:build`, unified with the card-detail build) →
-`apps/backend/data/cardPrintingPricesByOracleId.json.gz` (committed artifact,
-gzip-compressed) → `apps/backend/src/cardPrices.ts` (in-memory loader) →
+`scripts/build-card-detail-by-oracle-id.mjs` (build, wired into `npm run
+data:build`, unified with the card-detail build) →
+`apps/backend/data/cardPrintingPricesByOracleId.json.br` (committed artifact,
+brotli-compressed) → `apps/backend/src/cardPrices.ts` (in-memory loader) →
```

- Verdict:
- Reason:

---

## system-map.md — Printing-price artifact build entry

**What this decides:** the system-map entry for the price-artifact build —
"committed gzip-compressed ... mirroring the existing Commander Spellbook gzip
artifacts" and the `.json.gz` path today, brotli proposed.

**In plain terms:** the system map is the index of what lives where. This entry
says the price map is committed gzip and names it `.json.gz`. Both become brotli.

**What happens if you say no:** the map describes gzip and names a file that no
longer exists.

```diff
@@ ### Printing-price artifact build — Summary @@
-Committed gzip-compressed to keep the Lambda package inside its 250 MB unzipped quota (`scripts/lambda-package-budget.test.mjs`), decompressed once at backend startup, mirroring the existing Commander Spellbook gzip artifacts in the same directory.
+Committed brotli-compressed to keep the Lambda package inside its 250 MB unzipped quota (`scripts/lambda-package-budget.test.mjs`), brotli-decoded once at backend startup, mirroring the brotli Commander Spellbook artifacts in the same directory.
```

```diff
@@ ### Printing-price artifact build — Lives in @@
-- Lives in: `scripts/build-card-detail-by-oracle-id.mjs` → `apps/backend/data/cardDetailByOracleId.json` + `apps/backend/data/cardPrintingPricesByOracleId.json.gz` (wired into `npm run data:build`); weekly refresh-and-PR wrapper `scripts/refresh-and-open-pr.mjs` (wired as `npm run data:refresh-pr`, runs the `data:refresh` → `data:build` pipeline then opens a pull request to `main`)
+- Lives in: `scripts/build-card-detail-by-oracle-id.mjs` → `apps/backend/data/cardDetailByOracleId.json.br` + `apps/backend/data/cardPrintingPricesByOracleId.json.br` (wired into `npm run data:build`); weekly refresh-and-PR wrapper `scripts/refresh-and-open-pr.mjs` (wired as `npm run data:refresh-pr`, runs the `data:refresh` → `data:build` pipeline then opens a pull request to `main`)
```

- Verdict:
- Reason:

---

## system-map.md — Commander Spellbook combo artifact build entry

**What this decides:** the system-map entry for the combo build — "each variant
is gzipped as its own member ... 76.9 MB detail + 4.8 MB index" and the `.json.gz`
paths today, brotli 128-variant blocks proposed.

**In plain terms:** this entry describes how the combo corpus is built and stored.
It says each variant is gzipped on its own with a byte-offset directory, at
76.9 MB + 4.8 MB. That becomes brotli blocks of 128 variants with the combined
index, at ~13.0 MB + ~2.4 MB, and the file names change.

**What happens if you say no:** the map describes per-variant gzip and the old
sizes and file names.

```diff
@@ ### Commander Spellbook combo artifact build — Summary @@
-Each variant is gzipped as its own member and the index carries a byte-offset directory into the detail artifact, so a lookup decompresses one record rather than the corpus — 76.9 MB detail + 4.8 MB index committed over 106,182 real variants, well above a same-corpus single-stream estimate: per-record gzip forfeits the cross-record compression a shared stream gets almost free across repeated JSON keys, traded for bounded per-lookup memory (18 MB index-only heap vs. 254 MB holding the full detail catalog resident) rather than an optimization deferred (DEC-162).
+Variants are brotli-compressed in blocks of 128 in `variantId` order (each block one brotli member, the members concatenated) and the index carries a per-block byte `[offset, length]` directory into the detail artifact, so a lookup decodes one block (~230 KB) rather than the corpus — ~13.0 MB detail + ~2.4 MB index committed over the fresh corpus (re-recorded at build). Block batching recovers the cross-record compression per-variant gzip forfeited (repeated JSON keys and the text neighbouring combos share), while keeping per-lookup memory bounded — the constraint DEC-162 chose per-variant gzip for, and named block batching as the fix if size became a problem (DEC-162).
```

The `commanderSpellbookComboSource.meta.json` hash marker keeps its `.json` name
(it is small JSON, not a compressed corpus) — no change.

```diff
@@ ### Commander Spellbook combo artifact build — Lives in @@
-- Lives in: `scripts/refresh-commander-spellbook-data.mjs` (wired into the `data:refresh` chain), `scripts/build-commander-spellbook-combos.mjs`, `scripts/lib/stream-json-array.mjs`, gitignored `apps/backend/data/commander-spellbook/`, committed `apps/backend/data/commanderSpellbookCombos.json.gz` and `apps/backend/data/commanderSpellbookComboIndex.json.gz`
+- Lives in: `scripts/refresh-commander-spellbook-data.mjs` (wired into the `data:refresh` chain), `scripts/build-commander-spellbook-combos.mjs`, `scripts/lib/stream-json-array.mjs`, gitignored `apps/backend/data/commander-spellbook/`, committed `apps/backend/data/commanderSpellbookComboBlocks.br` and `apps/backend/data/commanderSpellbookComboIndex.json.br`
```

- Verdict:
- Reason:

---

## system-map.md — combo retrieval entry (Lives in)

**What this decides:** the combo-retrieval runtime entry's `Lives in` list, which
names the two combo files by their old `.json.gz` names.

**In plain terms:** this entry maps the runtime combo matcher and names the combo
data files it reads. The names change to the brotli block file and brotli index.

**What happens if you say no:** the retrieval entry names combo files that no
longer exist.

```diff
@@ combo retrieval — Lives in @@
-... `apps/backend/src/runtime/createConfiguredApp.ts`, `apps/backend/src/eval/fixtures/commander-spellbook-*`, `apps/backend/data/commanderSpellbookCombos.json.gz`, and `apps/backend/data/commanderSpellbookComboIndex.json.gz`; the opt-in answer-quality comparison lives in `scripts/compare-combo-answer-quality.mjs` ...
+... `apps/backend/src/runtime/createConfiguredApp.ts`, `apps/backend/src/eval/fixtures/commander-spellbook-*`, `apps/backend/data/commanderSpellbookComboBlocks.br`, and `apps/backend/data/commanderSpellbookComboIndex.json.br`; the opt-in answer-quality comparison lives in `scripts/compare-combo-answer-quality.mjs` ...
```

- Verdict:
- Reason:

---

## system-map.md — Card rulings entry (encoding note)

**What this decides:** whether the runtime "Card rulings" system-map entry records
that the rulings artifact is now brotli-decoded at startup.

**In plain terms:** this entry maps the per-card rulings lookup (`cardRulings.ts`).
It carries no encoding fact today, so it is not wrong — but the rulings file moves
from raw JSON to brotli and its loader now brotli-decodes at startup. Adding a
short note keeps the map complete. This is an optional addition, not a correction;
`reject` leaves the entry as-is with no contradiction.

**What happens if you say no:** the entry stays as-is (still accurate, just silent
on the encoding).

```diff
@@ ### Card rulings — Summary @@
-- Summary: Looks up per-card rulings for cards present in the game context.
+- Summary: Looks up per-card rulings for cards present in the game context, from the committed `apps/backend/data/cardRulingsByOracleId.json.br` map brotli-decoded into memory once at startup.
```

- Verdict:
- Reason:

---

## system-map.md — Artifact builders entry (encoding note)

**What this decides:** whether the "Artifact builders" system-map entry records
that card-rulings (and card-detail) artifacts are now written brotli.

**In plain terms:** this entry maps the build scripts that produce the committed
artifacts. It carries no encoding fact today. The rulings and card-detail builds
now write brotli; a short note keeps the map complete. Optional addition, not a
correction; `reject` leaves it as-is with no contradiction.

**What happens if you say no:** the entry stays as-is (still accurate, silent on
the encoding).

```diff
@@ ### Artifact builders — Summary @@
-- Summary: Builds card-metadata, card-rulings, and game-rules artifacts consumed at runtime.
+- Summary: Builds card-metadata, card-rulings (brotli-compressed), and game-rules artifacts consumed at runtime.
```

- Verdict:
- Reason:

---

## system-map/game-rules-retrieval.md — card-detail file name

**What this decides:** the game-rules-retrieval doc's reference to the card-detail
file that supplies per-card keywords — `cardDetailByOracleId.json` today,
`.json.br` proposed.

**In plain terms:** System 3 rule retrieval reads each card's keywords from the
committed card-detail file. That file becomes brotli, so the path is updated. No
retrieval behavior changes.

**What happens if you say no:** the doc names a card-detail file that no longer
exists.

```diff
@@ System 3 data @@
-- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact (REQ-181), and per-card `keywords` resolved from `apps/backend/data/cardDetailByOracleId.json` (REQ-180)
+- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact (REQ-181), and per-card `keywords` resolved from `apps/backend/data/cardDetailByOracleId.json.br` (REQ-180)
```

- Verdict:
- Reason:

---

## quick-lookup/README.md — card-detail file name

**What this decides:** the Quick Lookup doc's one reference to the card-detail
file — `cardDetailByOracleId.json` today, `.json.br` proposed. File name only.

**In plain terms:** Quick Lookup resolves attached-card fields server-side from the
committed card-detail file. That file becomes brotli, so the name is updated.
Nothing else in the flow changes.

**What happens if you say no:** the doc names a card-detail file that no longer
exists.

```diff
@@ lookup request card resolution @@
-  card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json`
+  card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json.br`
```

- Verdict:
- Reason:

---

## trade-balancer/README.md — card-detail file name

**What this decides:** the Trade Balancer doc's one reference to the card-detail
file, in the deferred rules+prices consolidation note — `cardDetailByOracleId.json`
today, `.json.br` proposed. File name only.

**In plain terms:** a note about a future consolidation says this run keeps the RAG
answer path's card-detail file byte-for-byte untouched. That file becomes brotli,
so its name is updated; the note's meaning is unchanged.

**What happens if you say no:** the note names a card-detail file that no longer
exists.

```diff
@@ deferred consolidation note @@
-`cardDetailByOracleId.json` stays byte-for-byte untouched; the consolidation
+`cardDetailByOracleId.json.br` stays byte-for-byte untouched; the consolidation
```

- Verdict:
- Reason:
