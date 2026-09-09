# Idea: compact-data-extracts

## Problem

The committed backend data extracts (combo corpus, price and rule data)
needed for the fresh Magic corpus no longer fit inside the 120 MB Lambda
deploy budget. The current mitigation trims real content — raising
`MIN_VARIANT_POPULARITY` to drop low-popularity combos — to buy back space,
which ships a smaller product than the reviewed data actually supports.

## Outcome

Re-encode the committed extracts — brotli compression over 128-combo blocks —
so the full fresh corpus fits inside the 120 MB Lambda budget without
trimming any combo, price, or rule content.

## Non-goals

- Does not drop or trim any combo, price, or rule content that currently
  ships.
- Does not change the weekly Scryfall refresh trigger or schedule.
- Does not raise the 120 MB Lambda deploy budget itself.

## Intake

Staged brief copied to `PRD/work/compact-data-extracts/intake/GRAPH-BRIEF.md`,
originally staged at
`.worktrees/.graph-intake/graph-20260908-233747/GRAPH-BRIEF.md`. This is
evidence, not settled product truth — any product decision it raises is made
at the `define` gate. Documents it cites were not opened.

## Prior run

- `PRD/instructions/receipts/graph-shakedown-and-deploy-2026-08-24.md` — the
  combo corpus outgrew the Lambda zip packaging limit; `MIN_VARIANT_POPULARITY`
  was raised to 2 as a size valve, excluding 55,496 combos to fit packaging,
  not because they lacked product value.
- `PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md` — moving the
  Lambda deploy to S3-staged upload raised the effective ceiling to 250 MB
  unzipped so the full reviewed combo corpus could ship untrimmed; validated
  against a 230 MB budget test.
- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — NFR-017
  Lambda-budget finding; corpus measured at ~118.1 MB of the 120 MB budget,
  1.9 MB headroom.
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` — Lambda
  package data budget measured at 113.887 MB of the 120 MB budget (6.113 MB
  headroom) after hybrid rule retrieval landed.
- `PRD/instructions/receipts/resilient-weekly-data-refresh-2026-09-08.md` —
  fixed the weekly Scryfall refresh pipeline; recorded a deferred follow-up
  that fresh combos push `apps/backend/data` to 137.6 MB, over the 120 MB
  budget, needing a trim step (raise `MIN_VARIANT_POPULARITY` +
  `--trim-committed`) — the exact budget gap this idea proposes to close
  without trimming.
- `PRD/instructions/receipts/weekly-data-refresh-pr-2026-09-08.md` —
  reconciled the weekly refresh wrapper to the backend gzip combo/price
  artifacts and advanced the price snapshot date; same budget-adjacent
  pipeline.
- `PRD/instructions/receipts/trade-balancer-price-slim-2026-09-08.md` — moved
  the Trade Balancer price corpus to a backend gzip map plus a shared
  card-metadata index, deleting a 38 MB frontend file; a prior precedent for
  shrinking a committed data extract without dropping its content.
