# Receipt — frontend-routing-and-code-splitting

- Date: 2026-08-17
- Slug: `frontend-routing-and-code-splitting`
- Status: shipped

## Actions taken

- [x] Verified all four slices A–D are `done` and the package carried
      `status: ship-ready` + `STATUS.ship-ready`.
- [x] Applied the autonomous merge-proof gate — all four checks pass; see
      **Merge proof** below.
- [x] Confirmed every durable outcome slice D promoted is present in
      `sections/`; see **Durable truth** below. No further promotion needed.
- [x] Confirmed `system-map.md`'s feature-portal entry is already
      `Status: shipped` and carries the **Routing** line. No status flip needed.
- [x] `npm run quality:check` green.
- [x] Wrote this receipt **before** deleting the work folder.
- [x] Deleted `PRD/work/frontend-routing-and-code-splitting/` and removed the
      slug from `PRD/work/STATUS.md`.

## Shipped behavior

A player can now bookmark a feature and land back on it. The four registered
destinations are addressable at flat top-level URLs — `/quick-lookup`,
`/in-depth`, `/life-tracker`, `/trade-balancer` — so a URL identifies a feature,
browser back and forward work, and an unknown path redirects to `/`. Opening one
destination downloads that destination, not the whole suite.

- **A** — `react-router` supplies location and history; the path is declared on
  each registry entry and the URL is the source of truth for the active
  destination. `sessionStorage` is demoted to the bare-`/` fallback.
- **B** — each destination sits behind its own `React.lazy` boundary with a
  per-destination `Suspense` fallback. A single boundary around the outlet was
  rejected because it blanks already-loaded siblings.
- **C** — `vite.config.ts` declares function-form `manualChunks` groups for the
  scan surface shared across the three scanning destinations and for framework
  code (`react`, `react-dom`, `react/jsx-runtime`, `react-router`).
- **D** — test alignment, CI shard headroom, and the PRD promotions below.

The governing constraint across every slice: `DestinationOutlet` keeps every
visited destination **mounted and hidden** rather than unmounting it, because
DEC-095/REQ-067 guarantee in-session data survives destination switching.
`<Routes>` unmounts non-matching routes, so destinations are deliberately not
wired into `<Routes>` elements.

## Durable truth

Verified present, all promoted by slice D:

| Item | Location |
| --- | --- |
| DEC-157 | `sections/decisions/navigation.md` + router index line in `sections/decisions.md` |
| REQ-140 | `sections/functional-requirements.md` |
| NFR-014 | `sections/non-functional-requirements.md` |
| Destination load fallback | `sections/screen-layout.md` |
| Routing line | `sections/system-map.md` |
| Amendments | REQ-090 and DEC-111, both narrowed by DEC-157 |

## Merge proof

- Recorded autonomous base: `origin/feature/routing`.
- **That base no longer exists.** It was deleted during a repository
  consolidation on 2026-08-14, after being fully merged into `main` (9 behind,
  0 ahead at the time). This is a normal post-merge end state.
- Implementation PR **#85** — `state=MERGED`, `base=feature/routing`,
  `mergedAt=2026-08-07T14:46:00Z`, merge commit **`90caf3a`**. Verified with
  `gh pr view`, which was authoritative and reachable at cleanup time.
- `90caf3a` is an ancestor of both `HEAD` and `origin/main`, so the work is in
  the checkout cleanup ran from and in the trunk.
- `feature/routing` then reached `main` via PR **#87** (2026-08-07).
- No `.worktrees/implement-frontend-routing-and-code-splitting` existed.
- Runtime-cleanup acceptance criteria recorded in all four slice docs.

The recorded base and merge SHA are named here so the deleted branch stays
traceable.

## Gate change made during this cleanup

This was the first cleanup to run against a package whose recorded base had
already been deleted, and it exposed two defects in the merge-proof gate. Both
were fixed before the gate was applied (commit `69eaee9`):

1. **Check 1 demanded the recorded base still exist.** Deleting a base branch
   after it merges is routine hygiene, so cleanup was impossible for any package
   whose base had been tidied up — a permanent block, not a real risk. Check 1
   now accepts a deleted base when the implementation merge is provably an
   ancestor of `HEAD`, and requires the base and merge SHA in the receipt.
2. **Check 2 mandated the GitHub CLI**, so cleanup was impossible during a
   GitHub outage. An outage is not evidence about the work. Check 2 now falls
   back to local merge-commit ancestry when the API returns 5xx, while keeping
   `gh` authoritative whenever it is reachable.

`thejudge-cleanup` has no fixture under `PRD/instructions/skill-fixtures/`, so
this behavior change is unmeasured. Worth one if the gate changes again.
