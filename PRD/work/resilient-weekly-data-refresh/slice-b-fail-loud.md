# Slice B — Fail-loud on card/rulings download failure

## Status: planned

## Goal

A failed `default_cards`/`rulings` bulk download makes the whole weekly run a hard
failure — non-zero exit, no branch, no commit, no PR — instead of the current
"warn and continue" that shipped stale-price PRs.

## Requirements

1. In `refresh-scryfall-data.mjs` `main()`, a failure to download the bulk
   card/rulings targets is a hard error (throws / non-zero exit), no longer
   swallowed by a warn-and-continue. The CR TXT and combo steps keep their own
   graceful handling (they are not the headline).
2. Distinguish "headline download failed" (abort) from the existing no-op/success
   paths. A zero-successful-headline-download run must not proceed to `data:build`
   and must exit non-zero.
3. `refresh-and-open-pr.mjs`: a non-zero `data:refresh` (pipeline step) already
   prevents commit/push/PR — confirm/retain that a pipeline failure cuts no
   branch, stages nothing, opens no PR, and surfaces the failure clearly.
4. Runtime graceful degradation is untouched (REQ-066 fail-open in the backend is
   a separate concern and not modified here).

## Acceptance criteria

- [ ] B1: with an injected fetch where the bulk card/rulings download fails,
  `main()` (or its extracted headline-download step) rejects / exits non-zero and
  does not run `data:build` (unit test).
- [ ] B2: `refresh-and-open-pr.mjs` — a `data:refresh` pipeline failure results in
  no commit, no push, no `gh pr create`, and a clearly-surfaced error (existing
  behavior retained; covered by a test).
- [ ] B3: a successful headline download still proceeds normally (no regression).
- [ ] B4: `node --test scripts/refresh-scryfall-data.test.mjs scripts/refresh-and-open-pr.test.mjs` passes.

## Verification

```bash
node --test scripts/refresh-scryfall-data.test.mjs scripts/refresh-and-open-pr.test.mjs
```

## Files touched

- `scripts/refresh-scryfall-data.mjs`
- `scripts/refresh-scryfall-data.test.mjs`
- `scripts/refresh-and-open-pr.test.mjs` (assertion, if not already covered)

## PRD promotion (applied at cleanup, from GATE-QUESTIONS.md)

- REQ-195 amend — the fail-loud acceptance criterion + description sentence.
