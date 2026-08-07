status: ideation

# frontend-routing-and-code-splitting

Make the frontend's six function areas addressable routes with lazy-loaded
boundaries, so URLs identify features and initial payload scales with what a
user opens rather than with the whole suite.

Captured by `thejudge-kickoff` on 2026-08-07 from the SPA scaling analysis done
during `ci-quality-check-runtime` slice E. See `IDEA.md` for the measured
evidence.

## Open questions for refinement

- Which router: `react-router` vs `@tanstack/react-router` vs a minimal
  hash/history wrapper — the app currently has four runtime dependencies and
  that leanness is worth weighing against router features
- Whether routes are the split boundary, or whether heavy leaves (`scan`'s
  fingerprint/detection path) deserve their own lazy boundary regardless of route
- Whether URL state must round-trip staged `contextFlow` state, or whether
  routes address function areas only and in-flow state stays ephemeral
- Whether the 17 `App.*.test.tsx` files should be regrouped along the new route
  boundaries, and if so whether that is in scope here or a follow-up

## Next step

`/thejudge-refinement PRD/work/frontend-routing-and-code-splitting/`
