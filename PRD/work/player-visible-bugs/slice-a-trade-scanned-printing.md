# Slice A — Trade scan keeps the scanned printing

## Status: done

## Goal

A card scanned onto a Trade side defaults to the printing the player scanned.

## Requirements

1. In `useScanCapture.ts` (held card, near `:482`), store the identify step's
   own candidates (printing ids with distances) as the held card's
   `candidates`. The vote keeps using `votingCandidates`.
2. `useScanCapture.test.ts`: drive the real hook through a lock and a close
   with a scan map where one card has two printings; the committed call's
   `candidates` carry the scanned printing id.
3. `TradeBalancer.scan.test.tsx`: the fake scan hook hands over printing-id
   candidates on the held card, as the real hook now does; the entry defaults
   to the scanned printing.
4. Spec truth already says this (REQ-065; Trade README). No spec edit.
5. Commit slice A on its own, apart from other slices.

## Acceptance criteria

- [ ] `useScanCapture.ts` stores the identify step's candidates on the held card while voting still uses the card-level list
- [ ] The new `useScanCapture.test.ts` case passes and fails against the old line
- [ ] The Trade scan test asserts the entry defaults to the scanned printing and passes
- [ ] The Trade, QuickLookup, ZoneCollectionStep scan tests and the scan hook tests all pass
- [ ] Typecheck and lint pass
- [ ] Slice A commits contain no file outside the Files list

## Verification

```bash
npm --workspace apps/frontend run test -- useScanCapture TradeBalancer.scan ZoneCollectionStep QuickLookupApp
npm run typecheck
npm run lint
```

## Files touched

- `apps/frontend/src/hooks/useScanCapture.ts`
- `apps/frontend/src/hooks/useScanCapture.test.ts`
- `apps/frontend/src/components/trade/TradeBalancer.scan.test.tsx`
