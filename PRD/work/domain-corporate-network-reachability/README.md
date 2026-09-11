status: refined

# Domain corporate network reachability

A player on a corporate network cannot open `mtgjudge.gg` at all — the
company web filter blocks the new custom domain while other gaming sites
load. See `IDEA.md` for the original capture and `intake/request.md` for the
owner's verbatim request.

`DESIGN-BRIEF.md` is the shaped record. Its headline: **no change in this
repository promises the site opens at work.** Corporate filters block by
domain category and reputation, and a six-day-old domain usually sits in a
"newly registered" bucket many company policies block outright. The brief
splits every lever into three buckets — what the repo ships (CloudFront
security headers, a real `robots.txt` and `security.txt`), what only the owner
can do by hand (vendor category lookup and recategorization submission, or
asking IT to allowlist), and what only elapsed time resolves (domain age).

Proposed product truth lives in `GATE-QUESTIONS.md`: new **REQ-197**
(security response headers), **REQ-198** (real `robots.txt` /
`security.txt`), **REQ-199** (the reachability and categorization runbook),
plus in-place amendments to **DEC-084** and the `system-map.md` AWS
deployment entries. No `DEC-###` is minted.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/domain-corporate-network-reachability

## Next step

`/thejudge-quality-check PRD/work/domain-corporate-network-reachability/`
