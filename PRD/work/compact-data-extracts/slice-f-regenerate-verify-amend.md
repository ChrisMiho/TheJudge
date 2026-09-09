# Slice F — Regenerate, verify, amend

## Status: planned

## Goal

Regenerate every committed data artifact from the finished code, prove the
Lambda deploy budget and cold-start memory land where the design brief
predicted, and apply the 20 accepted PRD amendments from `GATE-QUESTIONS.md`
so durable product truth matches what actually shipped.

## Requirements

1. Regenerate all committed artifacts from the on-disk raw sources already
   present under `apps/backend/data/commander-spellbook/`,
   `apps/backend/data/scryfall/`, and `apps/frontend/data/scryfall/` (the
   2026-09-08 refresh — no network refresh needed). Run the relevant
   `data:build` steps (`build-commander-spellbook-combos.mjs`,
   `build-card-rulings.mjs`, `build-card-detail-by-oracle-id.mjs`) against
   the finished slice A–E code.
2. Run `node --test scripts/lambda-package-budget.test.mjs` and record the
   new committed-data total in the slice's verification evidence (expected
   ≈25.6 MB against the 120 MB budget, ≈94 MB headroom — the design brief's
   prediction; the real number replaces the estimate here, not in PRD text
   beyond what the accepted diffs already say).
3. Print process RSS after loading every committed artifact at backend
   startup (a one-off script or an existing startup log line); compare
   against the 497 MB post-raise baseline and confirm it stays far below
   the 1769 MB the function now runs at (PR #221). Record the measured
   figure in verification evidence.
4. Apply the 20 accepted `GATE-QUESTIONS.md` diffs verbatim to
   `PRD/sections/` (owner verdict: `accept` on every slot, no `edit`
   corrections to reconcile):
   - `PRD/sections/functional-requirements.md` — REQ-093, REQ-066,
     REQ-175, REQ-195, REQ-196, REQ-185, REQ-167, REQ-180
   - `PRD/sections/non-functional-requirements.md` — NFR-017 (Constraints
     lever wording, a new re-measurement Note, and the existing 2026-09-05
     Note's file-name update)
   - `PRD/sections/integrations-and-data.md` — the 8 diff blocks (combo
     data, rulings, prices endpoint, Trade Balancer pricing ×2, request
     card-shape resolution, `GET /api/cards/:oracleId` purpose, Card Detail
     Data Strategy, Delivery Strategy zone line)
   - `PRD/sections/in-depth/README.md` — combo enrichment clause
   - `PRD/sections/trade-balancer/data/cardPrintingPrices.md` — title,
     committed-artifact line, build/emit paths, degrade-gracefully line,
     compression paragraph, measured-bounds line, "Where it lives" chain
   - `PRD/sections/system-map.md` — five entries (Printing-price artifact
     build, Commander Spellbook combo artifact build, combo retrieval
     `Lives in`, Card rulings encoding note, Artifact builders encoding
     note)
   - `PRD/sections/system-map/game-rules-retrieval.md` — System 3 data line
   - `PRD/sections/quick-lookup/README.md` — lookup request card resolution
   - `PRD/sections/trade-balancer/README.md` — deferred consolidation note
5. Apply the diffs exactly as accepted — do not further tighten the
   approximate figures the diffs already carry (e.g. "~13.0 MB ... (measured
   at build)"); a change beyond what the owner accepted needs a fresh gate,
   not a build-time judgment call.
6. `npm run quality:check` is green (typecheck, lint, format, coverage,
   `test:scripts`).
7. Full test suite (`npm test`: frontend, backend, scripts) is green.

## Acceptance criteria

- [ ] F1 — every committed artifact under `apps/backend/data/` is
      regenerated from the 2026-09-08 raw sources using the finished slice
      A–E code, with the five renamed `.br` files present and the five old
      files absent
- [ ] F2 — `node --test scripts/lambda-package-budget.test.mjs` passes, and
      the measured committed-data total is recorded (expected well under
      120 MB, near the ≈25.6 MB prediction)
- [ ] F3 — post-load process RSS is measured and recorded, and stays below
      the 1769 MB Lambda memory ceiling with meaningful headroom
- [ ] F4 — all 20 accepted `GATE-QUESTIONS.md` diffs are applied verbatim
      to the listed `PRD/sections/` files, and `git diff` over
      `PRD/sections/` matches the accepted diffs with no unaccepted changes
- [ ] F5 — `npm run quality:check` passes
- [ ] F6 — `npm test` passes (frontend, backend, scripts workspaces)

## Verification

```bash
npm run data:build
node --test scripts/lambda-package-budget.test.mjs
npm run quality:check
npm test
```

## Files touched

- `apps/backend/data/commanderSpellbookComboBlocks.br` (new, committed)
- `apps/backend/data/commanderSpellbookComboIndex.json.br` (new, committed)
- `apps/backend/data/cardRulingsByOracleId.json.br` (new, committed)
- `apps/backend/data/cardDetailByOracleId.json.br` (new, committed)
- `apps/backend/data/cardPrintingPricesByOracleId.json.br` (new, committed)
- `apps/backend/data/commanderSpellbookCombos.json.gz` (deleted)
- `apps/backend/data/commanderSpellbookComboIndex.json.gz` (deleted)
- `apps/backend/data/cardRulingsByOracleId.json` (deleted)
- `apps/backend/data/cardDetailByOracleId.json` (deleted)
- `apps/backend/data/cardPrintingPricesByOracleId.json.gz` (deleted)
- `PRD/sections/functional-requirements.md`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/in-depth/README.md`
- `PRD/sections/trade-balancer/data/cardPrintingPrices.md`
- `PRD/sections/system-map.md`
- `PRD/sections/system-map/game-rules-retrieval.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/trade-balancer/README.md`

## PRD promotion checklist (cleanup executes this)

- [ ] Confirm the 20 accepted diffs landed in `PRD/sections/` exactly as
      `GATE-QUESTIONS.md` records them (byte-for-byte, no drift)
- [ ] Confirm `PRD/sections/system-map.md`'s affected entries flip to
      `shipped` once code is wired in and the cleanup receipt exists
      (`doc-lifecycle.md` system-map promotion gate)
- [ ] Write the cleanup receipt under `PRD/instructions/receipts/`
      recording the measured budget total and RSS figure from this slice
- [ ] Delete `PRD/work/compact-data-extracts/` and remove its
      `PRD/work/STATUS.md` row

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/compact-data-extracts/` ready to
      delete
