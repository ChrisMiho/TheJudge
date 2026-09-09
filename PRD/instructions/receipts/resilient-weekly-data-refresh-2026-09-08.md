# Receipt: resilient-weekly-data-refresh (2026-09-08)

**What happened:** The weekly one-command data refresh (`npm run data:refresh-pr`)
was silently broken — Scryfall retired its old bulk-download format, so cards and
rulings stopped downloading and prices never advanced. This fixed it and hardened
the pipeline: it reads Scryfall's new JSONL export, fails loudly instead of shipping
a stale-price PR, survives Scryfall's rate limits, and reuses the committed combos
unless they actually changed.

**What it means for you:** `npm run data:refresh-pr` works again and reliably moves
the `Prices as of <date>` line. The fresh prices shipped (snapshot advanced to
2026-09-08, off June 5). Two pipeline gaps this refresh exposed — the fresh combos
overflow the Lambda package budget, and fresh Comprehensive Rules break the backend
eval golden fixtures — are deferred to a follow-up; the price refresh went out on
its own.

- Date: 2026-09-08
- Slug: resilient-weekly-data-refresh
- Status: shipped
- Code PR: https://github.com/ChrisMiho/TheJudge/pull/217 (merged)
- Data PR (price-only): https://github.com/ChrisMiho/TheJudge/pull/219 (merged)

## Slices (all done, 21/21 criteria)

- **A — Scryfall JSONL bulk fix.** `createBulkDownloadTargets` prefers
  `jsonl_download_uri` (falls back to a legacy `download_uri`); the download path
  gunzips the gzipped JSONL and stream-converts it to the JSON array the builders
  consume. New `scripts/refresh-scryfall-data.test.mjs`.
- **B — Fail-loud.** `runHeadlineBulkDownloads` throws on any card/rulings download
  failure; `main()` no longer swallows it, so the run exits non-zero and the wrapper
  opens no PR. CR + combo steps stay graceful.
- **C — Harden combo retries.** `max(retryAfterMs ?? 0, backoff)` in both retry
  functions, so a `Retry-After: 0` (or a bodiless 429) no longer causes an instant
  retry that burns the attempt budget. 200ms pacing kept.
- **D — Hash-gated combos.** New `scripts/lib/combo-source-marker.mjs` (card-identity
  hash over the `default_cards` oracle-id set + template-set hash, a committed marker,
  and a `combosNeedRefresh` gate that treats a missing marker or uncomputable hash as
  changed). The refresh skips the throttled Scryfall expansion when both hashes match;
  the marker is written only after a successful build.

## Durable truth confirmed (applied at build, in #217)

- **REQ-195** amended — fail-loud on a failed headline download; combos hash-gated
  rather than rebuilt every run.
- **REQ-196** added — hash-gated Commander Spellbook combo reuse.
- **integrations-and-data.md** "Commander Spellbook Combo Data Strategy" — the
  `data:refresh` line notes the hash gate.
- **system-map.md** combo-build entry — reconciled at this cleanup to note the hash
  gate (REQ-196); the build applied REQ-196 to functional-requirements and
  integrations-and-data but not to this coarse catalog entry.

## Verification

- `npm run quality:check` green (569 script tests plus all frontend/backend suites)
  on #217; re-run green on the price-only data (#219): 1318 frontend + 503 backend.
- Unit suites: `refresh-scryfall-data.test.mjs` 10/10, `combo-source-marker.test.mjs`
  7/7, `refresh-commander-spellbook-data.test.mjs` 21/21, frontend
  `scryfallRefreshPolicy.test.ts` 5/5.
- No test hits the live network (REQ-093/DEC-162). The owner ran the real refresh:
  `default_cards` downloaded, snapshot advanced to 2026-09-08, combos 148 resolved /
  25 unresolved (24 no upstream query + 1 upstream 404 — 0 lost to throttling).

## Deferred follow-ups (owner to solution)

- **Lambda budget:** the fresh combos grew ~77 MB → 91 MB, pushing `apps/backend/data`
  to 137.6 MB over the 120 MB budget. Every combo refresh needs a budget-trim step
  (raise `MIN_VARIANT_POPULARITY` + `--trim-committed`, dropping low-popularity
  combos — a product tradeoff).
- **Eval goldens:** fresh Comprehensive Rules change rule text the backend golden
  fixtures pin exactly; a refresh that touches rules needs a golden-regeneration step.
- **Meta-sidecar (REQ-066):** nothing writes `default-cards.meta.json`, so the price
  snapshot date is build-time, not the Scryfall feed's `updated_at`. ~3-line fix in
  the download path.
- **25 unresolved combo templates:** owner to investigate; documented as the
  irreducible floor (no upstream query / stale upstream query), not a bug.

## Files

- Created: this receipt.
- Updated (build, #217): `scripts/refresh-scryfall-data.mjs`,
  `scripts/refresh-commander-spellbook-data.mjs`,
  `scripts/build-commander-spellbook-combos.mjs` (untouched — the existing
  no-fresh-input preserve path covers reuse), `scripts/lib/combo-source-marker.mjs`
  (new), tests, `apps/frontend/src/lib/scryfallRefreshPolicy.test.ts`,
  `PRD/sections/functional-requirements.md`, `PRD/sections/integrations-and-data.md`.
- Updated (this cleanup): `PRD/sections/system-map.md` (REQ-196 note),
  `PRD/work/STATUS.md` (row removed).
- Deleted (this cleanup): `PRD/work/resilient-weekly-data-refresh/` (entire package).
