# Probe — trade-balancer-price-freshness

- Date: 2026-09-07
- Question: The Trade Balancer shows prices "as of 5 June 2026" — 3 months stale.
  What is a reliable way to keep the price data fresh so the feature stays
  useful?
- Mode: two briefs — freshness (GRAPH-BRIEF.md) and size/perf (GRAPH-BRIEF-size.md)
- What ran: inline reads of the feature spec, the price corpus doc, the build
  script, the refresh script, the frontend price loader, the backend card-detail
  endpoint + its artifact, package.json, and CI workflows. No fan-out.
- Evidence: FINDINGS-mechanism.md (freshness), FINDINGS-size-and-backend.md
  (size/perf + backend-endpoint thread), GRAPH-BRIEF.md (freshness build).
