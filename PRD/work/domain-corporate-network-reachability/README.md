status: ideation

# Domain corporate network reachability

A player on a corporate network cannot open `mtgjudge.gg` at all — the
company web filter blocks the new custom domain while other gaming sites
load. See `IDEA.md` for the problem, the evidence, and the candidate outcome:
add a CloudFront response headers security policy plus `robots.txt` /
`security.txt`, and document the manual domain-categorization submission
steps needed to get corporate web filters to reclassify a brand-new domain.

## Autonomous metadata

- Autonomous base: `thejudge-auto/domain-corporate-network-reachability`
  (spec-forming half; graph rewrites this to `origin/main` when the build
  half claims the merged spec)

## Next step

`/thejudge-refinement PRD/work/domain-corporate-network-reachability/`
