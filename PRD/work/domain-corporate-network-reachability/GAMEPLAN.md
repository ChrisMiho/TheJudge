# Gameplan — Domain corporate network reachability

## What a player experiences

Nothing changes for a player who already reaches `https://mtgjudge.gg`. This
package is entirely about what the site tells a browser, a crawler, or a
corporate security appliance about itself before a player ever opens it — and
about giving the owner a written way to chase the actual blocker, which lives
outside this repository.

## The honest headline, restated for the builder

**No slice here promises `mtgjudge.gg` opens on the owner's company network.**
Corporate web filters block by domain category and reputation; a six-day-old
domain usually sits in a "newly registered" bucket many policies block
outright. Every slice below ships hygiene the repo controls — security
headers, real `robots.txt`/`security.txt`, and a runbook for the manual
recategorization path. Do not let acceptance criteria or commit messages imply
otherwise.

## Architecture / data flow

```
scripts/aws-bootstrap.sh (owner runs it; not run by this build)
  |
  +-- ACM cert, Route 53 alias, redirect function   <- unchanged (DEC-084)
  |
  +-- CloudFront response headers policy (NEW, slice A)
  |     scripts/lib/cloudfront-response-headers.mjs
  |       - pure transform: build/merge a ResponseHeadersPolicy config
  |       - hasResponseHeadersPolicy(): idempotency check, same shape as
  |         cloudfront-custom-domain.mjs's check/attach split
  |     attached to DefaultCacheBehavior.ResponseHeadersPolicyId
  |
  v
CloudFront distribution (live only after the owner runs bootstrap)
  |
  +-- every response now carries 5 security headers (slice A)
  +-- /robots.txt, /.well-known/security.txt serve themselves (slice B)
  |     apps/frontend/public/robots.txt
  |     apps/frontend/public/.well-known/security.txt
  |     -> copied by `vite build` into apps/frontend/dist/ (asserted, not assumed)
  |     -> `aws s3 sync` infers text/plain from the .txt extension
  |     -> a real S3 object wins over the existing 403/404 -> index.html
  |        SPA-fallback mapping, which is untouched by this package
  |
  +-- docs/aws/domain-reachability.md (slice C): the owner's runbook —
        3 buckets, before/after curl commands, vendor-agnostic
        recategorization checklist

PRD/sections/ (slice D, after A/B/C exist)
  +-- functional-requirements.md: + REQ-197, REQ-198, REQ-199
  +-- decisions/deployment.md: DEC-084 amended in place (4th bootstrap step,
        why there is still only one canonical address)
  +-- system-map.md: `## AWS production deployment` + `### Serverless
        hosting` entries gain the new Backed-by IDs, Summary sentence, and
        Lives-in paths
```

The live AWS change — actually attaching the policy to the production
distribution — happens only when the owner runs `scripts/aws-bootstrap.sh`
against the real account. This build proves the transform and the idempotent
attachment logic with unit tests against a fabricated
`get-distribution-config` JSON fixture (the same technique
`cloudfront-custom-domain.test.mjs` already uses), and proves the static
files survive a real `vite build`. It does not, and cannot, touch the live
distribution.

## Slices

| Slice | Goal | Status | Dependencies |
| --- | --- | --- | --- |
| A — response-headers-policy | Add a CloudFront response headers policy (HSTS, nosniff, SAMEORIGIN, referrer-policy, camera-preserving permissions-policy) as a pure tested transform, attached idempotently by `aws-bootstrap.sh` | planned | parallel-ready — REQ-197, DEC-084 |
| B — static-files | Ship real `robots.txt` and `.well-known/security.txt`, proven to survive the frontend build's dotted-directory copy | planned | parallel-ready — REQ-198 |
| C — domain-reachability-runbook | Ship `docs/aws/domain-reachability.md`: the three-bucket framing, before/after verification commands, vendor-agnostic recategorization checklist | planned | parallel-ready — REQ-199 |
| D — prd-truth-apply | Apply REQ-197/198/199 to `functional-requirements.md`, amend DEC-084 in place, amend the two `system-map.md` entries — re-derived against what A/B/C actually shipped. Carries the Ship gates block. | planned | sequential — A, B, C (documents their actual shipped shape, not the proposal text) |

A, B, and C touch disjoint files except for two non-overlapping edits to
`docs/aws/deployment.md` (A edits `### Custom domain`'s numbered step list; C
adds one link line to the `See also` list at the top) — no merge conflict
either way, but implement them in the lettered order to avoid a diff race in
the same file. D reads whatever A/B/C actually produced (exact file names,
header values, dates) rather than replaying `GATE-QUESTIONS.md` verbatim,
per REQ-197/198/199's own instruction that the PRD-truth diffs there are
proposals, not a blind copy source.

## Verification checklist

- No slice needs a browser, Playwright, or a dev server. Slices A and D are
  pure Node/data-transform + doc work; slice B's only "runtime" step is a
  static `vite build` invoked from a test, not a running server; slice C is
  documentation. No runtime-hygiene cleanup criterion applies to this
  package.
- `npm run test:scripts` is the pre-merge signal for slices A and B (new
  `*.test.mjs` files land in `scripts/` or `scripts/lib/`, matching the
  existing glob).
- `npm run quality:check` is the final regression gate (Ship gates, slice D).
- A live `curl https://mtgjudge.gg` before/after check is **not** a build
  criterion anywhere in this package — the distribution isn't touched until
  the owner runs the bootstrap. That check is recorded once, in
  `docs/aws/domain-reachability.md` (slice C, REQ-199), as the owner's
  post-deploy verification.
- The outcome that actually matters — the site opening on the owner's
  company network — is not something any slice here can prove. Say so in the
  runbook; do not imply otherwise anywhere else.

## Next step

`/thejudge-implement PRD/work/domain-corporate-network-reachability/ slice A`
(Claude Code) or `$thejudge-implement PRD/work/domain-corporate-network-reachability/ slice A`
(Codex). For one unattended agent completing every slice,
`/thejudge-implement-all PRD/work/domain-corporate-network-reachability/`.
