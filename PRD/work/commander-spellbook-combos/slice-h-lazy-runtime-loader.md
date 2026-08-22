# Slice H — Lazy runtime catalog loader

## Status: done

## Goal

Replace slice B outright. Load the index eagerly, but never hold the full
105k-variant detail corpus resident — fetch a variant's detail only when a
request actually needs it, by decompressing only that variant's gzip member
from its recorded byte range.

## Requirements

1. DEC-162 (measured 2026-08-12 amendment) — the full detail catalog costs
   ~868MB RSS / 254MB retained heap versus ~95MB RSS / 18MB retained heap for
   the index alone, and at most five variants ever enter a prompt. The
   deployment target's real memory ceiling is unknown (no Lambda function is
   currently live in the account), so the loader is designed to be safe
   regardless of that number rather than assuming a generous one.
2. REQ-093 — a committed variant with null steps, prerequisites, mana, or
   card state is an artifact-integrity failure; that check must still apply
   at the point of lazy decompression.
3. Existing fail-open behavior is preserved: missing, empty, or malformed
   artifacts disable only combo enrichment, with one warning per process/path,
   never a request failure.
4. `COMBO_ENRICHMENT_ENABLED` (backend env, default enabled) still gates
   whether the catalog is consulted at all.

## Acceptance criteria

- [x] H1 — the index artifact is decompressed and parsed fully once, at first
      use; its byte-offset directory (`variantId → { offset, length }`, from
      slice G) is held in memory.
- [x] H2 — a lookup for one variant's detail reads only that variant's byte
      range from the detail artifact (via a positional `fs` read) and
      `gunzipSync`s only that slice — never the whole detail file.
- [x] H3 — a test proves the lazy property concretely: with a real gzip member
      for variant A followed immediately by deliberately corrupt bytes at
      variant B's recorded range, fetching A still succeeds. A spy/counter on
      the decompression call would only prove *how many times* decompression
      ran; this proves independence directly — decompressing A cannot have
      touched B's bytes, or the corrupt bytes would have surfaced as an error
      on A's fetch instead of B's.
- [x] H4 — a variant whose lazily-decompressed detail carries a null steps,
      prerequisites, mana-needed, or card-state field is treated as an
      artifact-integrity failure. **Refined during implementation:** the prior
      eager check poisoned the *whole catalog* on one bad variant; the lazy
      design intentionally narrows this to fail open for *that variant only*
      (`getVariant` returns `undefined`, one warning, the rest of the catalog
      keeps working) — true whole-catalog poisoning would require decompressing
      every variant at load time, defeating the format's purpose. A missing
      index, missing detail file, or a detail file too short for the index's
      recorded ranges still disables the whole catalog, since those are cheap
      to catch without decompression.
- [x] H5 — missing, empty, or malformed index or detail artifacts disable
      combo enrichment only, with one warning per process/path, and the
      normal Ask AI request continues.
- [x] H6 — `COMBO_ENRICHMENT_ENABLED=false` suppresses the loader entirely —
      the index is never read, let alone any detail lookup performed.
- [x] H7 — repeated lookups for the same variant within one process do not
      redundantly re-read and re-decompress its bytes (a small bounded cache
      is acceptable; unbounded retention of every seen variant is not — that
      would silently reintroduce the eager-load memory cost this slice
      exists to avoid).

## Verification

```bash
npm --workspace apps/backend run test -- commanderSpellbook
npm --workspace apps/backend run typecheck
npm run lint
```

## Files touched

- `apps/backend/src/commanderSpellbook/catalog.ts`
