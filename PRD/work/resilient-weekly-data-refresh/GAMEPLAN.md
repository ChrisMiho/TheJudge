# GAMEPLAN: resilient-weekly-data-refresh

## Architecture

All work is in offline data scripts under `scripts/`; no runtime code, no
endpoints, no UI (NFR-013). The weekly wrapper `refresh-and-open-pr.mjs` runs
`data:refresh` → `data:build` and opens a PR. `data:refresh`
(`refresh-scryfall-data.mjs`) downloads Scryfall `default_cards` + `rulings`
bulk, the WotC CR TXT, and the Commander Spellbook combos
(`refresh-commander-spellbook-data.mjs`), then runs `data:build`.

Four code changes, then PRD promotion at cleanup:
1. **Scryfall JSONL bulk fix** — the unblocker. Read `jsonl_download_uri`, gunzip
   the JSONL, convert to the JSON array the builders already consume.
2. **Fail-loud** — a failed card/rulings bulk download becomes a hard error so
   the wrapper opens no PR (distinct from combo/rules degradation).
3. **Harden combo retries** — after a `Retry-After`, retries must actually wait;
   keep the 200ms pacing.
4. **Hash-gated combos** — reuse committed combos unless the card-identity hash or
   the template-set hash changed; on a change, full re-expansion of every
   template.

## Data flow (after this work)

`data:refresh-pr` →
- `data:refresh`:
  - fetch `/bulk-data`; for `default_cards`/`rulings` read `jsonl_download_uri`
    (fallback `download_uri`), download `.jsonl.gz`, gunzip, stream JSONL→array
    to `default-cards.json` / `rulings.json`. **Card/rulings download failure ⇒
    non-zero exit (fail-loud).**
  - CR TXT download (unchanged).
  - combos: download variant export; compute template-set hash; the card build
    (below) yields the card-identity hash. If both hashes match the committed
    marker `commanderSpellbookComboSource.meta.json` ⇒ skip template expansion +
    combo rebuild (reuse committed `.gz`). Else ⇒ full re-expansion (200ms pace,
    hardened retries) + rebuild + rewrite marker.
  - `data:build` (card-identity hash emitted here from the parsed `oracle_id` set).
- wrapper stages changed committed artifacts, commits, pushes, opens PR — or, on a
  fail-loud card failure, exits non-zero with no branch/commit/PR.

## Verification checklist (whole package)

- [ ] `npm run quality:check` green (typecheck, lint, format, coverage, test:scripts).
- [ ] `node --test scripts/refresh-scryfall-data.test.mjs` — JSONL→array + fail-loud.
- [ ] `node --test scripts/refresh-commander-spellbook-data.test.mjs` — retry floor + hash gate.
- [ ] `node --test scripts/refresh-and-open-pr.test.mjs` — no-PR on card-download failure.
- [ ] No live Scryfall/Commander Spellbook network call in any test (REQ-093/DEC-162).
- [ ] PRD promotion (REQ-195 amend, REQ-196 new, integrations-and-data amend) applied at cleanup, matching `GATE-QUESTIONS.md`.

## Slices

| Slice | Objective | Depends on | Parallel? |
| --- | --- | --- | --- |
| A | Scryfall JSONL bulk download fix (unblocker) | — | start here |
| B | Fail-loud on card/rulings download failure | A | after A |
| C | Harden combo retry backoff (keep 200ms pacing) | — | parallel with A/B |
| D | Hash-gated combo reuse + PRD promotion checklist + ship gates (final) | A, C | last |

Single-agent order: A → B → C → D.

## Non-goals (from brief)
No runtime change; not a CI cron; no reversal of the backend price move; no
switch of the downstream builders to a JSONL stream parser; no rewrite of the
template-expansion logic itself.
