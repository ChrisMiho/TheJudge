# Slice C — Harden combo retry backoff (keep 200ms pacing)

## Status: planned

## Goal

When the combo template expansion does run, a Scryfall `429` triggers a genuine
back-off instead of the current "wait 60s once, then fire four retries at ~0ms and
burn out," so every resolvable template resolves. Keep the 200ms request pacing.

## Requirements

1. In `refresh-commander-spellbook-data.mjs`, a `Retry-After` of `0` (or any value
   below a floor) must not cause an immediate retry: the retry wait is
   `max(parsedRetryAfter, backoff)` with a sensible minimum, so `retryAfterMs ??
   backoff` never yields ~0ms after a throttle. Fix the `0 ?? backoff` nullish
   pitfall (a literal `0` currently survives).
2. Each retry after a throttle waits at least the current backoff floor; the
   full-jitter floor already prevents 0, so the change is chiefly: prefer the
   larger of `Retry-After` and the backoff, and treat a `0`/absent `Retry-After`
   as "use backoff."
3. `SCRYFALL_REQUEST_DELAY_MS` stays 200 (from #215); pacing unchanged.
4. Existing `backoffDelayMs` / `parseRetryAfterMs` unit tests stay green; add
   coverage for the `Retry-After: 0` and "retries never wait below the floor"
   cases.

## Acceptance criteria

- [ ] C1: a `Retry-After: 0` (or `"0"`) response results in a retry wait >= the
  backoff floor, never ~0ms (unit test).
- [ ] C2: after a `Retry-After` throttle, subsequent retries each wait at least
  the backoff floor for their attempt (unit test).
- [ ] C3: `SCRYFALL_REQUEST_DELAY_MS === 200` (assertion / unchanged).
- [ ] C4: `node --test scripts/refresh-commander-spellbook-data.test.mjs` passes.

## Verification

```bash
node --test scripts/refresh-commander-spellbook-data.test.mjs
```

## Files touched

- `scripts/refresh-commander-spellbook-data.mjs`
- `scripts/refresh-commander-spellbook-data.test.mjs`
