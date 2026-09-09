# Gameplan — compact-data-extracts

## What ships

Nothing a player sees changes: same combos, same rulings, same prices, same
answers. What changes is on disk — the committed backend data drops from
~137 MB (over the 120 MB Lambda deploy budget) to ~26 MB, so the weekly
refresh can ship the whole fresh corpus again instead of prices only.

## How

Five committed backend artifacts move from per-variant gzip / gzip / raw JSON
to brotli, with the combo detail file grouped into 128-variant blocks so the
compressor sees the text neighbouring combos share (the DEC-162 fix for when
size became a problem — it has). Every in-memory map and route response stays
byte-identical; this is an encoding change, not a content or behavior change.

| Today | New |
| --- | --- |
| `commanderSpellbookCombos.json.gz` (per-variant gzip) | `commanderSpellbookComboBlocks.br` (concatenated brotli 128-variant blocks) |
| `commanderSpellbookComboIndex.json.gz` | `commanderSpellbookComboIndex.json.br` |
| `cardRulingsByOracleId.json` (raw) | `cardRulingsByOracleId.json.br` |
| `cardDetailByOracleId.json` (raw) | `cardDetailByOracleId.json.br` |
| `cardPrintingPricesByOracleId.json.gz` | `cardPrintingPricesByOracleId.json.br` |

## Data flow

```
raw sources (gitignored)
  apps/backend/data/commander-spellbook/  apps/backend/data/scryfall/  apps/frontend/data/scryfall/
        |
        v
build scripts (brotli, quality 11, no dictionary, fixed size hint)
  build-commander-spellbook-combos.mjs      -> commanderSpellbookComboBlocks.br
                                             -> commanderSpellbookComboIndex.json.br
  build-card-rulings.mjs                    -> cardRulingsByOracleId.json.br
  build-card-detail-by-oracle-id.mjs        -> cardDetailByOracleId.json.br
                                             -> cardPrintingPricesByOracleId.json.br
        |
        v
committed apps/backend/data/*  (the artifacts shipped to Lambda)
        |
        v
backend loaders, decode once at startup or on demand
  catalog.ts (combo blocks: positional read + brotli-decode one block per lookup)
  cardRulings.ts, cardDetail.ts, cardPrices.ts (whole-file brotli-decode at startup)
        |
        v
routes / prompt assembly — responses byte-identical to today
```

## Slices

| Slice | Scope | Depends on | Files (primary) |
| --- | --- | --- | --- |
| A | Combo block layout + index directory in the build script | none | `scripts/build-commander-spellbook-combos.mjs` |
| B | Catalog loader reads the block layout | A | `apps/backend/src/commanderSpellbook/catalog.ts` |
| C | Brotli for rulings / card-detail / prices, build + loader | none (parallel-ready with A/B) | `scripts/build-card-rulings.mjs`, `scripts/build-card-detail-by-oracle-id.mjs`, `apps/backend/src/cardRulings.ts`, `cardDetail.ts`, `cardPrices.ts` |
| D | File-name sweep across path lists and readers | A, B, C, E | `scripts/refresh-and-open-pr.mjs`, `createConfiguredApp.ts`, eval readers, `prompt-fidelity.mjs`, `compare-combo-answer-quality.mjs`, `.gitignore`, root `README.md` |
| E | Positional-int compact index | A, B | `scripts/build-commander-spellbook-combos.mjs` (index writer), `catalog.ts` (load-time mapping) |
| F | Regenerate, verify, amend PRD | A, B, C, D, E | `apps/backend/data/*` (regenerated), `PRD/sections/*` (the 20 accepted diffs) |

Rationale for the dependency shape:

- **A and C are independent files** (combo pipeline vs. rulings/detail/prices
  pipeline) — parallel-ready.
- **B depends on A**: the catalog loader is written against the block
  layout and (pre-compaction) index shape A produces.
- **E depends on A and B**: it adds the positional-int compaction on top of
  the block-directory index A wrote and the loader B wrote — same functions,
  second pass.
- **D depends on A, B, C, E**: the file-name sweep needs every artifact's
  final name settled (E is the last edit to the combo index/build files)
  before it can safely grep-and-replace path strings without immediately
  going stale, and it also touches files A/B/C never touch (refresh wrapper,
  eval readers, prompt-fidelity, answer-quality script, `.gitignore`,
  root README).
- **F depends on everything**: it regenerates from raw sources with the
  finished code, measures the real budget and RSS numbers, and applies the
  PRD amendments — it cannot run correctly against a partially-renamed tree.

Implement in letter order A → B → C → D → E → F (per `thejudge-implement-all`
convention); A/C could run in either order relative to each other since
neither reads the other's output, but the sequence above is simplest to keep
one agent working through without juggling parallel branches.

## Product-truth writes (build applies, not map-out)

Slice F is the only slice that edits `PRD/sections/`. It applies the 20
accepted stable-ID diffs from `GATE-QUESTIONS.md` verbatim (owner verdict:
`accept` on every slot, no `edit` corrections) — see slice F's Requirements
for the full list and target files. No other slice touches `PRD/sections/`.

## Verification checklist (whole package)

```bash
node --test scripts/build-commander-spellbook-combos.test.mjs
node --test scripts/build-card-detail-by-oracle-id.test.mjs
node --test scripts/build-card-rulings.test.mjs 2>/dev/null || true   # if present
npm --workspace apps/backend run test
node --test scripts/refresh-and-open-pr.test.mjs
node --test scripts/lambda-package-budget.test.mjs
npm run quality:check
```

## Non-goals (do not implement)

- No combo, price, or rule content is dropped or trimmed.
- No change to the weekly Scryfall refresh trigger or schedule.
- The 120 MB budget line itself is not raised.
- Cold-start latency work (already addressed by PR #221's memory raise).
- No frontend change; `apps/frontend/public/data` is outside this budget.
- The meta-sidecar snapshot-date gap (REQ-066 follow-up), eval golden regen,
  and the 25 unresolved combo templates are distinct, out of scope here.

## Risk notes

- **Determinism**: brotli params must be fixed and named
  (`BROTLI_PARAM_QUALITY = 11`, `BROTLI_PARAM_SIZE_HINT` set to input length,
  no `dictionary` option — Node 22 CI silently ignores a brotli dictionary
  while Node 24 Lambda honours it, which would make CI and Lambda disagree).
  Slices A and C must set these explicitly, not rely on zlib defaults.
- **`--trim-committed` re-blocking (slice A)**: blocks are fixed groups of
  128 in `variantId` order, so trimming can't splice a block in place — it
  must filter → re-serialize → rewrite through the same build code path a
  fresh build uses. Get this wrong and a trimmed corpus produces corrupt
  block boundaries.
- **Slice D completeness**: a missed path-list entry
  (`COMMITTED_ARTIFACT_PATHS` in `refresh-and-open-pr.mjs` especially)
  silently drops an artifact from the weekly refresh PR with no error. Verify
  with the brief's enumeration grep at the end of slice D, not just the
  files explicitly listed.
- **Slice F ordering**: regenerate before applying PRD diffs, so the
  measured bytes referenced in verification match what actually got built
  — but the PRD diff text itself is applied verbatim as accepted (it already
  carries "re-recorded at build" wording where the owner accepted an
  approximate figure); do not silently tighten numbers beyond what was
  accepted without a fresh gate.
