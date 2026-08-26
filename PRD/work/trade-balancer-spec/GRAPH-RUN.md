# Graph run — trade-balancer-spec

- Run ID: `graph-20260825-190858`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — hook live (nohup true)`
- Autonomous base: `origin/thejudge-auto/trade-balancer-spec`
- Fork point: `main` (`f97881b`) — carries Phase A specs #1 (life-tracker) and #2 (user-feedback) and DEC-168; local `main` was fast-forwarded to `origin/main` before this run branched, closing the stale-base gap the docs-refactor PROGRESS.md warns about
- Staging: `.worktrees/.graph-intake/graph-20260825-190858/`
- Current node: `close` — PR #110 merged; running cleanup
- Next action: `/graph-run PRD/work/trade-balancer-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 3` | branch `thejudge-auto/trade-balancer-spec` created + pushed; base resolved `main`; clean tree, no stash; lock `graph-20260825-190858` (PID 3534) held; `CANARY_COMMAND` denied (universal), `GRAPH_CANARY_COMMAND` denied (graph tier) | 2026-08-25 |
| 2 | shape | sonnet | ok | `1 → 33` | package `PRD/work/trade-balancer-spec/` created (`IDEA.md`, `README.md`, `STATUS.ideation`, `intake/refactor-gameplan.md`); board row under `## ideation`; commit `b265e29` pushed; corpus `cardPrintingPrices.json` identified as passing all four `data/`-bucket clauses | 2026-08-25 |
| 3 | define | opus | ok — gate (parked) | `1 → 41` | `DESIGN-BRIEF.md` written; two new files `PRD/sections/trade-balancer/README.md` (162 lines, behavior) and `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (119 lines, corpus) + one `PRD/README.md` nav row; **no new stable IDs**, no existing DEC/REQ/FLOW/NFR body modified; corpus artifact byte-unchanged (no rebuild — Scryfall boundary respected); `git diff -- PRD/sections/` non-empty → parked at the `define` gate; `STATUS.refined` → `STATUS.owner-action` | 2026-08-25 |
| — | gate-review | opus | gate resolved | — | owner walked the `define` diff; 2/2 files accepted, 0 edited, 0 rejected; nested corpus/behavior split confirmed as precedent for #4/#5/#7; `STATUS.owner-action` → `STATUS.refined` | 2026-08-25 |
| 4 | gate-qc | sonnet | failed | `3 → 38` | `thejudge-quality-check` FAIL on `DESIGN-BRIEF.md`: Scope claims "two navigation-only Section Inventory rows" in `PRD/README.md` but only one was accepted/written (assumption #5 body already resolves to one; grep confirms one row). All DEC/REQ/FLOW/NFR citations and corpus figures verified accurate against source. Loop 1/3 → back to `define`; `STATUS.refined` → `STATUS.refining` | 2026-08-25 |
| 3 | define | opus | ok | `1 → 15` | attempt 2 (FAIL loop-back): `DESIGN-BRIEF.md` scope-count corrected two→one in Scope + assumption #5 title; `git diff -- PRD/sections/` **empty** (accepted spec/corpus untouched, no re-park); no new stable IDs; no data build/refresh; `STATUS.refining` → `STATUS.refined` | 2026-08-25 |
| 4 | gate-qc | sonnet | ok | `1 → 19` | attempt 2 PASS on `DESIGN-BRIEF.md`: scope-count fix verified (Scope + assumption #5 now one row; `PRD/README.md` confirmed one Trade Balancer row); all cited IDs resolve, no contradiction with source bodies, corpus figures re-verified against committed artifact (no rebuild), no new IDs; findings none; stays `STATUS.refined` | 2026-08-25 |
| 5 | plan | sonnet | ok | `1 → 50` | `thejudge-map-out`: `GAMEPLAN.md`, `slice-a-verify-spec.md`+`slice-a.criteria.json` (A1–A11, all `false`), `slice-b-diff-proof.md`+`slice-b.criteria.json` (B1–B5, all `false`); both **verify-only** (deliverable already committed at `41118d5`), parallel-ready; slice A covers behavior spec + corpus doc incl. figures re-read from committed artifact (no rebuild); GAMEPLAN notes `integrations-and-data.md` `printingId`-vs-`id` staleness as out-of-scope (not fixed); `STATUS.refined` → `STATUS.active`; board moved to `## active`; all writes inside `PRD/work/trade-balancer-spec/` + board | 2026-08-25 |
| 6 | build | sonnet | ok | `1 → 71` | `thejudge-implement-all`; worktree `.worktrees/implement-trade-balancer-spec`, shared head `thejudge-auto/trade-balancer-spec-work`; both slices verify-only, **no bounded correction needed** (spec + corpus already correct); all measured figures re-confirmed vs committed `cardPrintingPrices.json` (read directly, no rebuild); A1–A11 + B1–B5 all `true` with matching lines in `.worktrees/.graph-evidence.jsonl` for this run; PR [#110](https://github.com/ChrisMiho/TheJudge/pull/110) base `…-spec` head `…-spec-work`, MERGEABLE; **write-scope verified** — launch checkout clean + unchanged at `6142c04`, every write in the worktree; pre-existing `lambda-package-budget.test.mjs` ENOTDIR worktree defect (same as PR #107) confirmed unrelated, noted on PR; `STATUS.active` → `STATUS.ship-ready` (on PR head) | 2026-08-25 |
| 7 | review | opus | ok — APPROVE | `1 → 15` | no-write reviewer (`Plan` agent type, no Write/Edit/NotebookEdit), fresh context, graded PR #110 against `slice-a.criteria.json` (A1–A11) + `slice-b.criteria.json` (B1–B5); verdict **APPROVE**, all 16 criteria PASS, **0 Critical, 0 Important, 0 Minor** — no loop back to `build`; `integrations-and-data.md` `printingId`-vs-`id` staleness confirmed out-of-scope, correctly not a finding | 2026-08-25 |
| 8 | land | — (human PR merge) | ok | — | owner merged PR [#110](https://github.com/ChrisMiho/TheJudge/pull/110) 2026-08-26T02:23:31Z, merge commit `bbf78b0` (`gh pr view 110` → `state: MERGED`, base `thejudge-auto/trade-balancer-spec`); driver ran no `gh pr merge`/`gh pr close`; launch checkout reconciled onto merged base via `git merge origin/thejudge-auto/trade-balancer-spec` (conflicts in `PRD/work/STATUS.md` + package `README.md` resolved to the driver's fuller `GRAPH-RUN.md` ledger and a single `STATUS.ship-ready` marker) | 2026-08-26 |

## Gate verdicts

Walked 2026-08-25 via `graph-gate-review`. No new stable IDs, so the walk mapped
onto the two new files (per-file granularity). Both accepted; no `PRD/sections/`
edit or revert applied. The nested corpus/behavior split shape
(`trade-balancer/data/cardPrintingPrices.md` under the feature directory) is
confirmed as the precedent for specs #4 (`scan`), #5 (`quick-lookup`), and #7
(`in-depth`).

| Stable ID / file | Verdict | Reason |
| --- | --- | --- |
| `PRD/sections/trade-balancer/README.md` (behavior spec) | accept | — |
| `PRD/sections/trade-balancer/data/cardPrintingPrices.md` (corpus doc; nested split shape) | accept | — |

## Open gate

**RESOLVED 2026-08-26 — owner merged PR #110 (merge commit `bbf78b0`).** Land is
`ok`; the run reconciled onto the merged base and continues at `close`.

**Gate:** `land` (node 8) — the human PR merge. A graph run never merges its own
PR, so it parks here for the owner.

**Question for the owner:** merge PR #110 — the Trade Balancer spec verification.
It is a documentation-only Phase A #3 package: the behavior spec, its corpus doc,
and the one `PRD/README.md` nav row were authored and owner-accepted at the
`define` gate (commit `41118d5`) and are already on the base; this PR carries the
two verify-only slices' bookkeeping and proves the spec/corpus/nav-row are
correct against their sources and the committed artifact (no rebuild).

**Evidence:**
- PR: https://github.com/ChrisMiho/TheJudge/pull/110 — base
  `thejudge-auto/trade-balancer-spec`, head `thejudge-auto/trade-balancer-spec-work`,
  state OPEN, MERGEABLE.
- Node 7 reviewer verdict: **APPROVE**, all 16 criteria (A1–A11, B1–B5) PASS,
  0 Critical / 0 Important / 0 Minor.
- Known, unrelated: `lambda-package-budget.test.mjs` ENOTDIR is a pre-existing
  worktree-mechanics defect (same as PR #107), noted on the PR.

**Resume command:** merge PR #110, then `/graph-run PRD/work/trade-balancer-spec/`
— the resumed run confirms the merge and continues to `close` (node 9, cleanup).

---

**Prior gate — RESOLVED 2026-08-25 (`define`): 2/2 files accepted, 0 edited, 0
rejected.** The recorded diff below stays as the evidence of what was walked;
nothing in `PRD/sections/` was changed.

**Gate:** `define` — non-empty `PRD/sections/` diff awaiting owner review.

**Question for the owner:** review the new draft Trade Balancer spec and its
corpus doc below. Accept as written, edit, or reject. It is a current-state
consolidation on the DEC-168 template, kept `draft` / non-authoritative with
`PRD/sections/decisions.md` at precedence #1.

**New stable IDs:** none. Refinement minted no new `DEC`/`REQ`/`FLOW`/`NFR`/`Q`.
The spec cites only existing IDs (DEC-087, DEC-088, REQ-064/065/066/145,
FLOW-009, NFR-013, NFR-001). No existing body was modified, and the committed
corpus artifact was documented from disk without a rebuild (Scryfall network
refresh boundary respected).

**The one decision worth your attention — the corpus/behavior split shape (sets a
precedent for the remaining corpus specs):** the gameplan said "seven feature
directories plus `data/` per corpus." Refinement read that as a **nested**
`PRD/sections/trade-balancer/data/cardPrintingPrices.md` subfile under the
feature directory, rather than a **top-level** `PRD/sections/data/` bucket. Its
reasoning: DEC-168 (landed authority) says a feature-spec dir "may gain further
files without a rename," while the gameplan's top-level bucket is framed as
intake / the Phase-C end-state; the nested shape is smaller and reversible.
Because #4 (`scan`), #5 (`quick-lookup`), and #7 (`in-depth`) also carry data,
your verdict here becomes the pattern they follow — so confirm the nested shape
or send it to the top-level bucket now.

**Two mechanical notes:**

1. **No new stable IDs**, so `graph-gate-review`'s ID-by-ID walk maps onto the two
   new files' sections (behavior: What it is / How it works / Measured bounds /
   Rejected alternatives / Where it lives; corpus: the data/-bucket test, build,
   artifact shape, measured 2026-06-05 figures, runtime posture). Record a verdict
   per file, or per section for finer granularity.
2. **Also in the working tree (outside `PRD/sections/`, not part of this gate's
   diff):** one navigation row added to `PRD/README.md`'s Section Inventory
   (DEC-168 pattern, navigation only).

**Complete `PRD/sections/` diff (verbatim, never summarized):**

```diff
diff --git a/PRD/sections/trade-balancer/README.md b/PRD/sections/trade-balancer/README.md
new file mode 100644
index 0000000..88ad208
--- /dev/null
+++ b/PRD/sections/trade-balancer/README.md
@@ -0,0 +1,162 @@
+# Trade Balancer — current-state feature spec
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1
+  and Read-First #1. Correct this file against those sources, not the other
+  way around.
+- Backed by: DEC-087, DEC-088, REQ-064, REQ-065, REQ-066, REQ-145, FLOW-009,
+  NFR-013, NFR-001
+- Corpus: the printing price artifact this feature loads is documented
+  separately in `data/cardPrintingPrices.md` — its contents are a `data/`
+  concern and are not inlined here.
+
+## What it is
+
+A feature-portal destination where two traders each build a list of cards and
+the app shows, at a glance, each side's total USD value and the difference
+between the sides — so a trade can be balanced without doing the math by hand at
+the table. A player adds a card to a side by scanning it or searching its name;
+each card resolves to a specific printing carrying its own price, with a foil
+toggle and a quantity. The whole thing runs in the browser: it makes no backend
+call, prices from a committed snapshot (not a live quote), and keeps no history
+— close it and the trade is gone. It sits outside the MTG Assistant core loop
+and changes nothing about it.
+
+## How it works
+
+### The two-sided screen
+
+- Built: the view presents two sides — **Side A** and **Side B** — each an
+  ordered list of card entries, each empty when the balancer opens. (DEC-087,
+  REQ-064, FLOW-009)
+- Built: each side shows a running **total** = `Σ qty × (foil ? usdFoil : usd)`
+  across its entries, in USD, updating live as entries are added, removed,
+  re-priced, foil-toggled, or quantity-changed. (REQ-064)
+- Built: the view shows the **difference** between the two totals as an amount
+  and indicates which side is higher, or that the sides are equal ("Even
+  trade"). (REQ-064)
+- Built: the trade state is **ephemeral** — no history, no persistence across
+  reload, no marketplace or transaction handling, and no automated
+  "suggest cards to balance" logic. (DEC-087, REQ-064)
+- Built: reached as the `trade-balancer` feature-portal destination; the MTG
+  Assistant start screen and flow are unaffected. The portal chrome and routing
+  are owned at the feature-portal level (DEC-095 / REQ-067 / DEC-157), not by
+  this feature. (DEC-087, REQ-064)
+
+### Adding a card to a side
+
+- Built: each entry carries a chosen **printing** (printing id, set, collector
+  number, image, non-foil `usd`, foil `usd_foil`), a **foil** flag, and a
+  **quantity** ≥ 1. (DEC-087, REQ-065)
+- Built: **scan input** — the existing scan engine identifies the card and the
+  scanned printing (its `Candidate.card_id`, DEC-070) becomes the entry's
+  default printing; the player can change the printing to any other printing of
+  that card if the scanned print is wrong. Scanning is per-side and one camera at
+  a time. (DEC-087, REQ-065, FLOW-009)
+- Built: **manual search input** — the player finds a card by name via the
+  existing local search (DEC-012), then chooses the correct printing from that
+  card's printing list before it is added; that printing's price applies. Manual
+  search is the permanent fallback and stays fully functional when the camera is
+  unavailable — the surface closes and the reason is surfaced rather than
+  breaking the screen. (DEC-087, REQ-065, FLOW-009)
+- Built: the **foil toggle** switches an entry's contribution between `usd` and
+  `usd_foil`; the default is non-foil. (DEC-087, REQ-065)
+- Built: **quantity / multiples** — the same card or printing may appear more
+  than once on a side, via repeated adds and/or a per-entry quantity control;
+  each unit counts toward the side total. A trade side is a value list, not the
+  stack: the stack duplicate-block (REQ-009 / FLOW-004) and the 10-card cap
+  (REQ-010) do **not** apply. (DEC-087, REQ-065, FLOW-009)
+- Built: each entry can be **removed** from its side. (REQ-065)
+- Built: printing selection is a **pricing/display layer only** — it is never
+  pushed into prompt context, rulings lookup, or the Decrypt-Stack request
+  payload, and it does not reopen the DEC-053 oracle-level scan-identity model.
+  (DEC-087, REQ-065)
+
+### Missing prices
+
+- Built: when the selected foil mode has no price for the chosen printing, the
+  entry's contribution defaults to **$0**, still counts as $0 toward the side
+  total, is rendered in a **distinct color** from priced entries, and carries a
+  **caution-triangle** indicator so the player knows the value is unknown and
+  the side total may be understated. The side total is not otherwise marked
+  incomplete. (DEC-087, REQ-065, FLOW-009)
+- Built: toggling foil on an entry that has no `usd_foil` (or off with no `usd`)
+  applies the same $0 + caution treatment for that mode. (FLOW-009)
+
+### Prices and freshness
+
+- Built: prices come from a committed, lazy-loaded printing price snapshot —
+  there is no live or real-time lookup and no runtime sync. The artifact is
+  documented in `data/cardPrintingPrices.md`. (DEC-088, REQ-066, NFR-013)
+- Built: the UI surfaces the snapshot date as **date-level copy**
+  (`Prices as of 5 June 2026`), formatted from the artifact's ISO `snapshotDate`
+  with no raw `T`, milliseconds, or `Z` suffix, so it cannot read as a live
+  quote; an unparseable value omits the line rather than printing raw artifact
+  data. (REQ-145)
+
+### Contract posture
+
+- Built: **frontend-only and contract-frozen** — no change to `AskAiRequest`,
+  Zod schemas, `GameContext`, prompt assembly, the provider boundary,
+  `POST /api/ask-ai`, or any product-facing endpoint; the feature adds no backend
+  route and no server-side state. (DEC-087, REQ-064)
+
+## Measured bounds
+
+- Currency scope: **USD only** (`usd` / `usd_foil`). EUR, tix, etched-foil, and
+  card grading/condition are out of scope for v1. (DEC-087, REQ-064, REQ-065)
+- Quantity: **≥ 1** per entry; duplicates allowed on a side. Side total =
+  `Σ qty × (foil ? usdFoil : usd)`. (DEC-087, REQ-064)
+- Price freshness line: date-level copy only, e.g. `Prices as of 5 June 2026`;
+  stays on one line at 390×844 (`scrollWidth` 299 = `clientWidth`); an
+  unparseable `snapshotDate` omits the line entirely. (REQ-145, `screen-layout.md`)
+- Layout/fit: sides stack on phone and the entry lists region-scroll; totals and
+  primary actions stay visible with no page scroll; desktop/tablet uses the
+  shell width (92% / 48rem or destination equivalent) rather than unused
+  ultra-wide bands, content-sized vertically. Mobile-first and touch-friendly.
+  (`screen-layout.md`, NFR-001)
+- Data footprint: the price artifact is lazy-loaded only on first open, so a user
+  who never opens the balancer pays no startup cost; its size, load time, and
+  lookup latency stay within a mobile-friendly budget (NFR-013). The committed
+  snapshot's measured figures live in `data/cardPrintingPrices.md`.
+
+## Rejected alternatives and deferred scope
+
+- **Extending `cardMetadata.json` with a single price — closed door.** The IDEA
+  proposed one price on the oracle-level metadata artifact, but `cardMetadata.json`
+  is oracle-level (one representative printing per oracle id, DEC-071) and cannot
+  represent the price of a specific scanned or chosen printing, nor list a card's
+  printings for the picker. DEC-088 chose a dedicated printing-level artifact
+  instead. (DEC-088)
+- **Overloading `cardScanMap.json` with pricing — closed door.** That artifact is
+  already printing-level but scoped to the scan resolver and lazy-loaded only on
+  first scan; adding prices would couple scan-identity resolution to trade
+  pricing. A separate artifact keeps the concerns clean. (DEC-088)
+- **Live / real-time price sync — closed door.** Pricing was narrowed into scope
+  only as a static build-time snapshot (`no live/real-time price sync`); there is
+  deliberately no runtime fetch or scheduled refresh. (DEC-087, DEC-088, NFR-013)
+- **Printing disambiguation reaching gameplay identity — closed door.** The
+  printing pick here is presentation/pricing only; scan identity stays
+  oracle-level per DEC-053 and is not reopened. (DEC-087)
+- **Raw ISO timestamp in the freshness line — closed door.** The measured
+  baseline `Prices as of 2026-06-05T22:21:13.248Z` implied live-quote precision;
+  REQ-145 replaced it with date-level copy. (REQ-145)
+- **Out of scope entirely (v1):** EUR / tix / etched-foil pricing, card
+  grading/condition, trade history or persistence, a marketplace or transaction
+  system, and automated balancing suggestions. (DEC-087)
+
+## Where it lives
+
+Frontend view and trade-local logic live under
+`apps/frontend/src/components/trade/` (`TradeBalancer.tsx`, `TradeSide.tsx`,
+`TradeEntryRow.tsx`, `PrintingPicker.tsx`, `oracleSearch.ts`, `useTradeScan.ts`)
+and `apps/frontend/src/lib/trade/` (`loadCardPrices.ts` lazy loader + indexes,
+`pricing.ts` pure selectors); it reuses the scan resolver and map from
+`apps/frontend/src/lib/scan/` and manual-search primitives from
+`apps/frontend/src/lib/search.ts`, and registers as the `trade-balancer`
+destination in
+`apps/frontend/src/components/portal/destinationRegistry.tsx`. The committed
+price artifact and its build script are documented in `data/cardPrintingPrices.md`.
+See `PRD/sections/system-map.md`'s `## Trade balancer` and
+`### Printing-price artifact build` entries for the full file list, and
+`PRD/sections/screen-layout.md`'s `#### Trade Balancer` row for the layout bands.
diff --git a/PRD/sections/trade-balancer/data/cardPrintingPrices.md b/PRD/sections/trade-balancer/data/cardPrintingPrices.md
new file mode 100644
index 0000000..df5bc03
--- /dev/null
+++ b/PRD/sections/trade-balancer/data/cardPrintingPrices.md
@@ -0,0 +1,119 @@
+# Printing price corpus — `cardPrintingPrices.json`
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1 and
+  Read-First #1. Correct this file against those sources, not the other way
+  around.
+- Backed by: DEC-088, REQ-066, NFR-013 (and the `CardPrintingPrice` shape in
+  `integrations-and-data.md`)
+- Feature that consumes it: `PRD/sections/trade-balancer/README.md`
+
+This is a **corpus doc**, not a behavior doc. It records the committed price
+artifact the Trade Balancer loads — where it comes from, how it is built, and
+what one committed snapshot holds. It is kept separate from the feature spec so
+the behavior README describes what a player does, and the artifact's contents
+stay a `data/` concern rather than being inlined into that behavior.
+
+## Why it is a corpus, not a feature spec
+
+The docs-refactor `data/` bucket test requires all four clauses; this artifact
+passes each one:
+
+- **External upstream source:** Scryfall bulk data
+  (`apps/frontend/data/scryfall/default-cards.json`, gitignored — the same
+  bulk file the scan/metadata pipeline already downloads).
+- **Build/refresh command:** `scripts/build-card-prices.mjs`, wired into
+  `npm run data:build`; the upstream bulk is refreshed via `npm run data:refresh`
+  (the Scryfall download is human-approved before it runs, per DEC-088).
+- **Committed artifact:** `apps/frontend/public/data/cardPrintingPrices.json`.
+- **Describes Magic, not TheJudge:** the artifact is per-printing card price and
+  identity data (prices, sets, collector numbers, images), not TheJudge product
+  configuration or behavior.
+
+## Where it comes from and how it is built
+
+- Built offline by `scripts/build-card-prices.mjs` from the local Scryfall bulk
+  source; emitted to `apps/frontend/public/data/cardPrintingPrices.json` and
+  committed. Raw bulk input stays gitignored; only the trimmed artifact is
+  committed (DEC-088, REQ-066).
+- The build streams the bulk file object-by-object (it exceeds V8's max string
+  length), keeps a printing when it passes the shared scan-printing filter
+  (`shouldIncludeScanPrinting`) and carries an `oracle_id`, and trims each card
+  to the price/identity fields below. A printing with no price is **kept**, not
+  dropped — it stays selectable and the pricing layer treats a null price as $0
+  plus a caution flag (DEC-087/REQ-065).
+- **Static snapshot, no runtime sync:** the committed file is the only source at
+  runtime. There is no live price fetch, no runtime sync, and no scheduled
+  refresh. Refresh happens solely through the human-approved pipeline
+  (`data:refresh` → `data:build`) (DEC-088, NFR-013).
+- The build degrades gracefully: a missing or failed source keeps the prior
+  committed artifact and does not break other artifact builds (REQ-066).
+- **Do not rebuild to read this doc.** These figures are read from the committed
+  artifact; regenerating requires the human-approved Scryfall network refresh
+  and is out of scope for the spec.
+
+## Artifact shape
+
+Top-level object with three keys:
+
+- `snapshotDate: string` — ISO-8601 timestamp of the source snapshot. Resolved
+  from the Scryfall bulk metadata `updated_at` when present, else the source
+  file mtime, else the build date. The UI formats this to date-level copy and
+  never shows the raw string (REQ-145).
+- `printings: Record<printingId, entry>` — one entry per included paper
+  printing, keyed by Scryfall printing id (the key equals `entry.id`). Resolves
+  a scanned printing directly.
+- `byOracleId: Record<oracleId, printingId[]>` — an index from oracle identity to
+  its printing ids, so the manual picker can list every printing of a card.
+
+Each `printings` entry (the `CardPrintingPrice` shape in
+`integrations-and-data.md`):
+
+| Field | Type | Notes |
+| --- | --- | --- |
+| `id` | string | Scryfall printing id (equals the map key) |
+| `oracleId` | string | oracle identity the printing belongs to |
+| `name` | string | card name |
+| `set` | string | set code |
+| `setName` | string | full set name |
+| `collectorNumber` | string | collector number within the set |
+| `imageUrl` | string | normal (or small) front-face image url; `""` if none |
+| `usd` | number \| null | non-foil USD price; `null` when the source has none |
+| `usdFoil` | number \| null | foil USD price; `null` when the source has none |
+
+USD only — Scryfall `usd` / `usd_foil`. EUR, tix, and etched-foil are not
+carried (DEC-087). A trade entry references one `CardPrintingPrice` plus a
+`foil: boolean` and a `quantity: number` (≥ 1); the artifact holds no trade
+state.
+
+## Measured bounds (committed 2026-06-05 snapshot)
+
+Read from the committed `cardPrintingPrices.json`; a future refresh moves these.
+
+- `snapshotDate`: `2026-06-05T22:21:13.248Z`.
+- File size on disk: ≈ 38 MB (loaded lazily; see runtime posture below).
+- `printings`: 95,895 entries.
+- `byOracleId`: 32,638 oracle ids.
+- Price coverage: 16,225 entries have no `usd`, 38,691 have no `usdFoil`, and
+  4,575 have neither — each such entry is still present and selectable, priced
+  at $0 with a caution flag for the missing mode (DEC-087/REQ-065).
+
+## Runtime posture
+
+- **Lazy-loaded only when the Trade Balancer is first opened** — app startup and
+  the MTG Assistant flow are unaffected for a user who never opens the balancer
+  (NFR-013, mirroring the scan-artifact posture). Loader and indexes live in
+  `apps/frontend/src/lib/trade/loadCardPrices.ts`; pure price selectors in
+  `apps/frontend/src/lib/trade/pricing.ts`.
+- Never pushed into `AskAiRequest`, prompt assembly, the provider boundary,
+  `POST /api/ask-ai`, or any product-facing endpoint. Printing identity here is
+  a pricing/display concern only and does not reopen the oracle-level scan
+  identity model (DEC-053, DEC-087).
+
+## Where it lives
+
+`scripts/build-card-prices.mjs` (build, wired into `npm run data:build`) →
+`apps/frontend/public/data/cardPrintingPrices.json` (committed artifact);
+lazy runtime loader `apps/frontend/src/lib/trade/loadCardPrices.ts`. See
+`PRD/sections/system-map.md`'s `### Printing-price artifact build` entry for the
+full machinery detail.
```

**Resume command:** `/graph-gate-review PRD/work/trade-balancer-spec/` — walk the
diff, record verdicts (including the corpus-split shape), resolve the gate, and
it hands back `/graph-run PRD/work/trade-balancer-spec/` to resume at `gate-qc`.

## Dispatch prompts

### preflight

graph-run is controlling. You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run parameters:
- Branch: `thejudge-auto/trade-balancer-spec` (pass verbatim as `--branch`; never infer or reuse the current branch)
- Run ID: `graph-20260825-190858` (pass verbatim as `--run-id` to BOTH the dry run and the real run)
- Slug: `trade-balancer-spec`

The launch checkout is on `main`, up to date with `origin/main` (commit `f97881b`), clean tree. The new branch must be cut from this `main` so it carries Phase A specs #1 (life-tracker) and #2 (user-feedback) and DEC-168.

Do exactly what `graph-preflight/SKILL.md` requires, in order: confirm no stop sentinel; take the concurrency lock via the script; issue `CANARY_COMMAND` and require a DENY (classify with `classifyCanary()`); after the lock is taken issue `GRAPH_CANARY_COMMAND` and require a DENY (classify with `classifyGraphCanary()`) — an allowed graph canary is BLOCKED; run the `--dry-run` preflight then the identical real run with the same `--run-id`; confirm `git status --porcelain` empty and the branch is `thejudge-auto/trade-balancer-spec`; record any stash. Expect a clean classification with no stash and base `main`.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the two canary ledger lines, the `Profile:` line verbatim, the resolved base, the classification, the branch created and whether it was pushed, the final git state, any stash ref + restore commands, and any non-zero exit. Do not dispatch further nodes; do not edit product files.

### shape

graph-run is controlling. You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; capture the idea and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Your job: create the work package for this request as `PRD/work/trade-balancer-spec/`, capturing the idea in `IDEA.md` with a `STATUS.ideation` marker and a package `README.md`. Use the slug `trade-balancer-spec` exactly.

The request to capture, verbatim:
"Write the current-state feature spec for the trade-balancer feature — Phase A #3 of the docs-refactor gameplan. Land it at PRD/sections/trade-balancer/README.md on the DEC-168 template. Frontend-only but it carries a corpus: apply the gameplan's data/ bucket test and split the corpus from the behavior. Keep it draft and non-authoritative."

Reference material (intake — evidence, never authority): a staged copy of the docs-refactor gameplan is at `.worktrees/.graph-intake/graph-20260825-190858/refactor-gameplan.md`. You may read THAT file for context. Do NOT open or fetch any document that file cites. This is a current-state spec on the DEC-168 template; the distinguishing feature of #3 is that it carries a CORPUS, so apply the gameplan's `data/` bucket membership test and split the corpus from the behavior. Identify the backing sources and record them as evidence; do not decide product behavior.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report the files created, the `STATUS.*` marker, a slug confirmation, the backing sources identified, and whether kickoff returned NO ACTIONABLE PACKAGE. Do not create a GAMEPLAN, slice docs, or DESIGN-BRIEF; do not edit `PRD/sections/` product truth; do not dispatch further nodes.

### define

graph-run is controlling. You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill and follow it exactly in graph-controlled (non-interactive) mode.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. Read its `IDEA.md`, `README.md`, and `intake/refactor-gameplan.md` for the full request and scope. This is Phase A #3 of the docs-refactor gameplan: a current-state feature spec for the Trade Balancer feature, to land at `PRD/sections/trade-balancer/README.md`, built on the DEC-168 template that `PRD/sections/life-tracker/README.md` and `PRD/sections/user-feedback/README.md` already established.

Scope constraints (the deliverable definition from the request and gameplan, not product decisions to make): it is a CURRENT-STATE consolidation of existing product truth, kept `draft` and non-authoritative, with `decisions.md` staying precedence #1; frontend-only feature. Consolidate existing behavior from the backing sources the README lists (`PRD/sections/decisions/trade-balancer.md` DEC-087/DEC-088, `functional-requirements.md` REQ-064/065/066/145, `user-flows.md` FLOW-009, `non-functional-requirements.md` NFR-013, `system-map.md` and `screen-layout.md` entries). Do NOT create new product decisions and do NOT modify any existing DEC/REQ/FLOW/NFR body — the spec is a derived, draft view over truth that already exists.

The distinguishing task of #3: this feature carries a CORPUS (`apps/frontend/public/data/cardPrintingPrices.json`, built by `scripts/build-card-prices.mjs`). The README has already verified it passes all four `data/`-bucket clauses. Apply the gameplan's corpus/behavior split: describe the feature behavior in the spec and keep the corpus as a `data/` concern rather than inlining the artifact's contents into the behavior doc. The exact split shape (a `data/` subfile vs another structure) is your authoring decision to make within the skill — record it, do not ask.

BOUNDARY: do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh — a graph run may not, and it is unnecessary. Document the corpus from the existing committed artifact; never rebuild it.

Produce the `DESIGN-BRIEF.md` the skill owns. Follow the intake rule: intake is evidence, never authority; do NOT open any document the intake cites.

Apply the assumption ladder in `preparation-contract.md` per product question, fresh at the moment it arises. If a genuine product blocker remains under the three-condition test, STOP and report it — do not decide it for the owner; the driver will park at the define gate. Do not pre-resolve product questions in advance.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the artifacts you wrote (paths), whether you made any `PRD/sections/` edits (and exactly what), any new stable IDs, how you handled the corpus/behavior split, whether you set `STATUS.refined`, and any genuine blocker you could not resolve. Do not create a GAMEPLAN or slice docs (that is node 5). Do not dispatch further nodes.

### gate-qc

graph-run is controlling. You are node 4 (`gate-qc`) of an autonomous graph run. Invoke the `thejudge-quality-check` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; produce the PASS/FAIL report and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. Validate its `DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and produce a PASS/FAIL report exactly as the skill defines. This is Phase A #3 of the docs-refactor gameplan: a current-state feature spec for the Trade Balancer, whose `define` gate was owner-reviewed and resolved — both new `PRD/sections/` files (`trade-balancer/README.md` behavior spec and `trade-balancer/data/cardPrintingPrices.md` corpus doc) were accepted, and the nested corpus/behavior split shape was confirmed. No new stable IDs were minted; the spec is a derived, draft, non-authoritative view over existing DEC/REQ/FLOW/NFR truth, with `decisions.md` staying precedence #1.

Judge the DESIGN-BRIEF against the accepted deliverable, not against a hypothetical new-feature build: the correct outcome for this consolidation spec is a brief whose scope matches the two accepted files and cites only existing IDs. Do NOT propose new product decisions and do NOT require edits to existing DEC/REQ/FLOW/NFR bodies.

Do NOT write a GAMEPLAN or slice docs (that is node 5). Do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh. On FAIL, set `STATUS.refining` per the skill and report the complete findings; on PASS, report it so the driver can record the preparation gate.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: PASS or FAIL, the checked artifact path, the complete findings list (or none), and the `STATUS.*` marker you set. Do not dispatch further nodes.

### define (attempt 2 — gate-qc FAIL loop 1/3)

graph-run is controlling. You are node 3 (`define`, attempt 2) of an autonomous graph run, looping back from a `gate-qc` FAIL. Invoke the `thejudge-refinement` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. The `define` gate was already owner-resolved: both `PRD/sections/` files (`trade-balancer/README.md` behavior spec, `trade-balancer/data/cardPrintingPrices.md` corpus doc) were accepted and the nested corpus/behavior split was confirmed. Those files are correct and must NOT be reopened or edited.

This loop-back fixes ONE `gate-qc` finding in `DESIGN-BRIEF.md` only, recorded in the package README's `## Preparation gate`:

- The Scope section states a count of **two** navigation-only Section Inventory rows in `PRD/README.md`, and material-assumption #5's title repeats that count of two, but the accepted deliverable and the actual `PRD/README.md` carry exactly **one** Trade Balancer nav row (assumption #5's own body already resolves to one).
- Correct it: change the count from two to **one** in the Scope section, and retitle assumption #5 so its title matches its body (a single navigation-only `PRD/README.md` row). Confirm against the real `PRD/README.md` (grep the Section Inventory) that exactly one Trade Balancer row exists.

BOUNDARIES: Do NOT edit any `PRD/sections/` file — the accepted spec and corpus stand unchanged. Do NOT mint new stable IDs or new product decisions. Do NOT add a second `PRD/README.md` row. Do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh. This is a documentation-accuracy fix to `DESIGN-BRIEF.md`, nothing more. Follow the intake rule: intake is evidence, never authority; do NOT open any document intake cites.

When the fix is applied, set `STATUS.refined` per the skill and report.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the exact `DESIGN-BRIEF.md` edits you made, confirmation that no `PRD/sections/` file was touched, confirmation of the one-row count in `PRD/README.md`, whether you set `STATUS.refined`, and any blocker. Do not create a GAMEPLAN or slice docs; do not dispatch further nodes.

### gate-qc (attempt 2 — re-check after scope-count fix)

graph-run is controlling. You are node 4 (`gate-qc`, attempt 2) of an autonomous graph run. Invoke the `thejudge-quality-check` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; produce the PASS/FAIL report and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. Re-validate its `DESIGN-BRIEF.md` for PRD alignment and agent-readiness, and produce a PASS/FAIL report exactly as the skill defines. This is Phase A #3 of the docs-refactor gameplan: a current-state feature spec for the Trade Balancer, whose `define` gate was owner-resolved (both new `PRD/sections/` files accepted; nested corpus/behavior split confirmed). No new stable IDs; the spec is a derived, draft, non-authoritative view over existing DEC/REQ/FLOW/NFR truth, with `decisions.md` staying precedence #1.

The prior `gate-qc` FAIL (loop 1/3) found one blocking issue: the Scope section and material-assumption #5 title stated a count of two navigation-only `PRD/README.md` Section Inventory rows, while only one was accepted and written. That has been corrected in `DESIGN-BRIEF.md` (Scope and assumption #5 now say one row; `PRD/README.md` confirmed to carry exactly one Trade Balancer row). Verify that fix landed and re-run the full check.

Judge the DESIGN-BRIEF against the accepted deliverable, not against a hypothetical new-feature build: the correct outcome for this consolidation spec is a brief whose scope matches the two accepted files and cites only existing IDs. Do NOT propose new product decisions and do NOT require edits to existing DEC/REQ/FLOW/NFR bodies.

Do NOT write a GAMEPLAN or slice docs (that is node 5). Do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh. On FAIL, set `STATUS.refining` per the skill and report the complete findings; on PASS, report it so the driver can record the preparation gate.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: PASS or FAIL, the checked artifact path, the complete findings list (or none), and the `STATUS.*` marker you set. Do not dispatch further nodes.

### plan

graph-run is controlling. You are node 5 (`plan`) of an autonomous graph run. Invoke the `thejudge-map-out` skill and follow it exactly in graph-controlled (non-interactive) mode — do not stop to ask the user questions; produce the GAMEPLAN and slice docs and return.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. Its `## Preparation gate` records Quality-check: PASS. This is Phase A #3 of the docs-refactor gameplan — a documentation-only current-state feature spec for the Trade Balancer, the third instance of the DEC-168 spec layer after Phase A #1 (life-tracker) and #2 (user-feedback).

CRITICAL SHAPE — the deliverable is already committed on the base. At the `define` gate (commit `41118d5`, owner-accepted via graph-gate-review) all three deliverables were authored and committed directly onto the recorded autonomous base `origin/thejudge-auto/trade-balancer-spec`:
- `PRD/sections/trade-balancer/README.md` — the behavior spec (162 lines, DEC-168 template).
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — the corpus doc (nested `data/` subfile; this package is the FIRST Phase A spec to carry a corpus).
- One `PRD/README.md` Section Inventory row for `sections/trade-balancer/`.

So this maps out exactly like #2 (user-feedback): produce **verify-only** slices, not authoring slices. Model the slices on that proven pattern:
- A verify-only slice covering the already-committed behavior spec AND the corpus doc: verify each against its cited sources (DEC-087, DEC-088, REQ-064/065/066/145, FLOW-009, NFR-013, NFR-001; the `CardPrintingPrice` shape in `integrations-and-data.md`; the `system-map.md` and `screen-layout.md` entries) and against the DEC-168 template. Verify the corpus doc's measured figures against the committed artifact `apps/frontend/public/data/cardPrintingPrices.json` by reading it directly — NEVER by rebuilding. Permit ONLY bounded additive corrections to the two trade-balancer spec/corpus files themselves (for example a missing file-path line in Where-it-lives), never a change to product behavior, never a new decision.
- A verify-only slice covering the `PRD/README.md` nav row and a diff-scope proof: exactly one `sections/trade-balancer/` row exists, and the package-wide diff since the fork point (`main`, `f97881b`) touches nothing outside the licensed set (the two spec/corpus files, the one nav row, and `PRD/work/trade-balancer-spec/`).

Emit one `slice-<letter>.criteria.json` beside each slice doc with every criterion initialised `false` and an evidence block, per `thejudge-map-out/reference.md`. Set `STATUS.active` per the skill.

BOUNDARIES: Do NOT mint new stable IDs. Do NOT edit any existing DEC/REQ/FLOW/NFR body, nor `system-map.md`, `screen-layout.md`, `integrations-and-data.md`. Do NOT author authoring/rewrite slices — the spec and corpus are accepted and stand. Do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh. Do NOT change `apps/` code. All writes stay inside `PRD/work/trade-balancer-spec/` plus the `PRD/work/STATUS.md` board row.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the GAMEPLAN and slice/criteria files created (paths), the number and nature of slices (confirm verify-only), whether you set `STATUS.active`, and any blocker. Do not dispatch further nodes.

### build

graph-run is controlling. You are node 6 (`build`) of an autonomous graph run. Invoke the `thejudge-implement-all` skill and follow it exactly in graph-controlled (non-interactive) mode — complete every remaining slice in one unattended session; do not stop to ask the user questions.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Package: `PRD/work/trade-balancer-spec/`. `STATUS.active`, `## Preparation gate` records Quality-check: PASS, `## Autonomous metadata` records base `origin/thejudge-auto/trade-balancer-spec`. Implement both slices from `GAMEPLAN.md`:
- Slice A (`slice-a-verify-spec.md`, criteria A1–A11) — verify-only over the already-committed behavior spec and corpus doc.
- Slice B (`slice-b-diff-proof.md`, criteria B1–B5) — verify-only over the `PRD/README.md` nav row and the package diff-scope.

SHARED HEAD BRANCH — pass this explicitly: use `thejudge-auto/trade-balancer-spec-work` as the shared implementation branch (the PR head). Do NOT derive the shared branch from the slug: the default `thejudge-auto/trade-balancer-spec` is the SAME name as the recorded autonomous base, and a PR cannot go from a branch into itself. The PR is head `thejudge-auto/trade-balancer-spec-work` → base `thejudge-auto/trade-balancer-spec`. Use the repo-local worktree `.worktrees/implement-trade-balancer-spec`.

SHAPE — the deliverable is already committed on the base (spec README, corpus doc, and the `PRD/README.md` nav row landed at commit `41118d5`, owner-accepted at the define gate). These are verify-only slices, exactly like Phase A #2 (user-feedback-spec). Nothing new is authored. Permit ONLY a bounded additive correction to the two trade-balancer spec/corpus files themselves if a slice-A check surfaces a confirmed, sourced gap (for example a missing file-path line). Verify the corpus figures by reading the committed artifact `apps/frontend/public/data/cardPrintingPrices.json` directly.

BOUNDARIES: Do NOT mint new stable IDs. Do NOT edit any existing DEC/REQ/FLOW/NFR body, nor `system-map.md`, `screen-layout.md`, `integrations-and-data.md` (the `printingId`-vs-`id` staleness GAMEPLAN notes is out of scope — leave it). Do NOT change `apps/` code. Do NOT run `npm run data:build`, `npm run data:refresh`, or any Scryfall network refresh. Every path you write must lie inside `.worktrees/implement-trade-balancer-spec/` or `PRD/work/trade-balancer-spec/`. Do NOT push to `origin/thejudge-auto/trade-balancer-spec` (the base) after the PR is open — the base is frozen once the PR opens; push slice work to the `-work` head and open the PR against the base.

Every criterion in both `slice-a.criteria.json` and `slice-b.criteria.json` must be earned to `true` through observed evidence before the node reports ok; set `STATUS.ship-ready` when both slices are complete.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report: the worktree path and shared head branch used, each slice's completion and any bounded correction made, the full criteria state (A1–A11, B1–B5 all true), the PR URL with its base and head branches, confirmation the launch checkout is clean and all writes stayed in-scope, and whether you set `STATUS.ship-ready`. Do not dispatch further nodes.

### review

graph-run is controlling. You are node 7 (`review`) of an autonomous graph run: a fresh-context, NO-WRITE reviewer. You hold no Write/Edit/NotebookEdit tools and must not modify anything — you read and grade only.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Grade PR #110 (`gh pr diff 110`; base `thejudge-auto/trade-balancer-spec`, head `thejudge-auto/trade-balancer-spec-work`) for `PRD/work/trade-balancer-spec/`, a documentation-only Phase A #3 spec package. Read the PR diff, the slice docs and criteria files (`slice-a-verify-spec.md` + `slice-a.criteria.json`, `slice-b-diff-proof.md` + `slice-b.criteria.json`), `GAMEPLAN.md`, `DESIGN-BRIEF.md`, and the two committed deliverable files (`PRD/sections/trade-balancer/README.md`, `PRD/sections/trade-balancer/data/cardPrintingPrices.md`) plus `PRD/README.md`. Do NOT read the build node's transcript.

RUBRIC — grade strictly against each slice's own acceptance criteria, nothing else:

Slice A (verify spec + corpus): A1 header Status + Backed-by cites exactly DEC-087/088, REQ-064/065/066/145, FLOW-009, NFR-013, NFR-001. A2 corpus header Status + Backed-by cites exactly DEC-088, REQ-066, NFR-013 and the CardPrintingPrice shape. A3 five DEC-168 sections present in order. A4 every cited ID exists in its home file. A5 every How-it-works bullet traces to its cited source. A6 Where-it-lives names the real feature files. A7 artifact-shape field names match the committed JSON and the TS interface, and the integrations-and-data.md field-name staleness is recorded as out-of-scope with no edit. A8 measured figures confirmed against the committed cardPrintingPrices.json read directly (no rebuild). A9 Rejected-alternatives matches DEC-087/088 language. A10 no newly minted stable ID in either file. A11 slice diff touches only the two trade-balancer files, additive-correction only if needed, no apps/ or existing-body edits.

Slice B (nav row + diff proof): B1 exactly one PRD/README.md Section Inventory row for sections/trade-balancer/. B2 that row states derived/non-authoritative, cites DEC-168, notes the corpus at data/cardPrintingPrices.md. B3 no other inventory row added/removed/reordered. B4 full package diff shows no apps/ change and no edit to any existing DEC/REQ/FLOW/NFR body, system-map.md, screen-layout.md, integrations-and-data.md, or open-questions.md. B5 is a manual human-confirmation criterion; in this unattended run it is satisfied by a dated agent observation — treat that as a known unattended-run pattern, NOT a finding.

SEVERITY RULE: grade only correctness against these criteria. A style note, a preference, or an improvement outside the slice's stated requirements is NEVER Critical or Important and must NOT trigger a loop back to build. The `integrations-and-data.md` printingId-vs-id staleness is explicitly out of this package's scope — noting it is fine, but it is not a finding against this PR. Manufacturing findings spends a build loop the run cannot recover.

If you write any prompt yourself, copy the `Working directory:` line above unchanged into it.

Report a verdict of APPROVE or REQUEST CHANGES, the per-criterion pass/fail for A1–A11 and B1–B5, and any findings each rated Critical / Important / Minor with the criterion it maps to. Do not dispatch further nodes and do not modify any file.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the trade-balancer feature — Phase A #3 of the docs-refactor gameplan. Land it at PRD/sections/trade-balancer/README.md on the DEC-168 template. Frontend-only but it carries a corpus: apply the gameplan's data/ bucket test and split the corpus from the behavior. Keep it draft and non-authoritative. | answered-once | shape | — |
| its merged | answered-once | land | — |
