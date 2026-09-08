# DESIGN BRIEF: resilient-weekly-data-refresh

## What the owner experiences
`npm run data:refresh-pr` becomes a reliable overnight run. It advances the
player-visible `Prices as of <date>` line whenever Scryfall has fresh card data,
reuses the last combo build unless combos actually changed, and — if it cannot
get fresh cards — fails loudly with no pull request instead of quietly opening a
stale one. Time is not a constraint; 100% success is the goal.

## Why now
The weekly refresh is currently broken. Scryfall retired the old bulk-download
format: the `/bulk-data` records for `default_cards` and `rulings` now expose
`jsonl_download_uri` (a gzipped JSONL file) and no longer carry `download_uri`.
`scripts/refresh-scryfall-data.mjs` reads `record.download_uri`, finds it absent,
and silently skips the card+rulings download — yet the wrapper still exits 0 and
opens a PR. Both 2026-09-08 runs (closed PRs #214, #216) left the June-5 snapshot
unmoved. Verified against the live endpoint: the `default_cards` record's keys are
`object, id, type, updated_at, uri, name, description, jsonl_download_uri,
compressed_size`, and `compressed_size` is ~78 MB.

## Scope — four workstreams

### 1. Scryfall JSONL bulk fix (the unblocker) — implementation only
- `refresh-scryfall-data.mjs`: read `jsonl_download_uri` (fall back to
  `download_uri` if a record still carries it, for forward safety), download the
  `.jsonl.gz`, gzip-decompress, and stream it back out as the JSON **array** the
  downstream builders already consume at
  `apps/frontend/data/scryfall/default-cards.json` and
  `apps/backend/data/scryfall/rulings.json`.
- Decision: **convert JSONL → JSON array on write**, keeping the three builders
  (`build-card-metadata`, `build-card-detail-by-oracle-id`, `build-card-rulings`)
  unchanged — smallest blast radius. The array file is gitignored transient input,
  exactly as today. (Alternative — write `.jsonl` and switch the builders' stream
  parsers to line-delimited — is cleaner long-term but touches three builders;
  deferred as a non-goal here.)
- No product-truth change: the PRD describes the source as "Scryfall bulk
  `default_cards`/`rulings`" (integrations-and-data.md) and never names the field
  or file format, so this needs no gate block.

### 2. Hash-gated combos (the enhancement) — REQ-196 (new) + integrations amend
- Combos change only when new cards release or Commander Spellbook adds a new
  template category; prices change weekly. So the weekly run reuses the committed
  combo artifact unless one of those two things changed.
- **Why not the export version/timestamp** (verified against the live export
  2026-09-08): the export's `timestamp` is a regeneration stamp that moves on every
  rebuild (would never skip), and `version` is a schema/software version like
  `6.4.0` that rarely moves (would skip even when combos changed — a wrong skip).
  Neither tracks "did our combo inputs change." Rejected.
- **Mechanism — two content hashes, both byproducts of data the one command already
  downloads:**
  1. **Card-identity hash** — the sorted set of Scryfall `oracle_id`s from the
     freshly downloaded `default_cards` (collected during the card build we already
     run). A new set adds new oracle ids and flips this hash; a price-only update
     does not. This is the determinant of what the template searches can match.
  2. **Template-set hash** — the sorted set of distinct templates (id +
     `scryfallApi` query) from the combo variant export (`collectTemplates` already
     enumerates these). Covers Commander Spellbook adding a new template category
     without new cards.
- Both hashes are stored in a **committed sidecar marker** (git-tracked, travels
  with the artifacts), e.g. `apps/backend/data/commanderSpellbookComboSource.meta.json`.
  On a run: if **both** hashes match the marker → skip the Scryfall template
  expansion and reuse the committed combo artifacts unchanged (nothing staged). If
  **either** differs → run a **full re-expansion of every template** (old and new —
  existing templates gain new cards, so a partial expansion would be wrong), rebuild
  the combo artifacts, and rewrite the marker.
- Volatile fields (prices, popularity, the export timestamp) are excluded from both
  hashes, so ordinary weekly churn never false-triggers.
- Precedent: the rule-embeddings build already "rebuilds only on CR refresh, skipped
  when a hash of the current rule index matches the committed artifact's"
  (integrations-and-data.md). Same skip-when-unchanged idea, keyed on the two
  determinants of the combo build.

### 3. Fail-loud on headline download — REQ-195 amend
- A failed `default_cards`/`rulings` bulk download becomes a hard error: the
  refresh exits non-zero, the wrapper cuts no branch, commits nothing, and opens
  no PR. This is distinct from (a) the combo version-gated reuse and (b) the
  runtime fail-open in REQ-066. The current "warn and continue" skip is what hid
  the breakage for two runs.
- The wrapper's existing no-op path (nothing changed → no PR) is unchanged; this
  adds a separate hard-failure path for a headline download that did not succeed.

### 4. Harden combo retries + keep pacing — implementation only
- Keep the 200ms Scryfall request pacing (shipped in #215).
- Fix the retry backoff so that after a `Retry-After: 60s` the follow-up retries
  do not fire at ~0ms and burn out (observed: `retry 1/5 in 60000 ms` then
  `2/5..5/5 in 0 ms`). Root: a `Retry-After` of `0` returned by
  `parseRetryAfterMs` is taken literally via `retryAfterMs ?? backoff` (nullish,
  so `0` is kept), and full-jitter backoff can floor low. Give retries a real
  minimum wait so a throttle triggers a genuine back-off, matching the 100%-goal
  for the rare runs when combos actually refresh.
- No product-truth change (pacing/retry are implementation detail under
  technical-design-rules).

## Decisions (owner-approved at refinement)
- **Combo trigger:** auto-detect, bundled in the one command, by two content hashes
  — the card-identity (`oracle_id`) set and the combo template set. Reuse when both
  match; on a mismatch, a **full re-expansion of every template** (old + new). The
  export `version`/`timestamp` was evaluated and rejected as unreliable (see
  workstream 2). The hash marker is a committed sidecar in the repo.
- **Fail-loud:** hard-abort with no PR when the card download fails.
- **Combo reliability:** harden the retry path so a combo run resolves 100% of
  resolvable templates.

## Non-goals
- No runtime change; the app still reads only committed artifacts (NFR-013,
  DEC-087, DEC-088).
- Not a CI cron; still owner-invoked local, and running it is the human approval
  the upstream download requires (REQ-093, DEC-162).
- Not reversing the backend price move (the slim posture stands).
- Not rewriting the combo template-expansion logic itself — only whether/when it
  runs in the weekly cadence, plus retry robustness.
- Not switching the downstream builders to a JSONL stream parser (deferred).

## Product truth touched (proposed in GATE-QUESTIONS.md, not written here)
- **REQ-195** (amend): fail-loud on a failed headline card/rulings download;
  combos version-gated rather than unconditionally rebuilt every run.
- **REQ-196** (new, reserved): hash-gated combo reuse in the weekly refresh
  (card-identity + template-set hashes; full re-expansion on a mismatch).
- **integrations-and-data.md** "Commander Spellbook Combo Data Strategy" (amend
  the `data:refresh` line): the combo refresh is hash-gated and reuses the
  committed artifact when both the card-identity and template-set hashes are
  unchanged.

## Verification approach (for map-out)
- Unit tests over injected fakes (the pattern both scripts already use): JSONL→
  array conversion for a small fixture; a failed headline download → non-zero /
  no-PR; both hashes match marker → combo skip (no template expansion, artifacts
  byte-unchanged), either hash differs → full re-expansion + marker rewrite;
  price-only change (same oracle-id set) does not trigger; retry backoff never
  waits ~0ms after a `Retry-After`.
- Do **not** run the live Scryfall/Commander Spellbook refresh in tests (REQ-093/
  DEC-162) — the owner runs the real refresh.
- `quality:check` green before the PR.
