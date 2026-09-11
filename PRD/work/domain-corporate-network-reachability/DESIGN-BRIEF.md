# Design brief — Domain corporate network reachability

## The ask, in plain terms

The owner cannot open `mtgjudge.gg` on their company network, so they cannot
show the app to a coworker or demo it at work. Long-established gaming sites
load fine through the same filter. The question is what about the six-day-old
domain is still unset.

## The honest answer up front

**No change in this repository promises the site opens at work.** Corporate
secure web gateways (the company appliance that inspects and allows or blocks
every site — Zscaler, Palo Alto, Cisco Umbrella, Fortiguard, Netskope and the
rest) decide by *domain category* and *reputation*. A domain registered six
days ago usually sits in a "newly registered" or "uncategorized" bucket, and
many corporate policies block that bucket outright regardless of how the site
is configured. The gaming sites that load have been categorized for years.

So this package separates three things and never blurs them:

| Bucket | What it covers | Who does it |
| --- | --- | --- |
| **What the repo can ship** | A CloudFront response headers policy (HSTS + the standard security headers), a real `robots.txt`, a real `security.txt`, and a runbook | This package, as code + docs |
| **What only the owner can do by hand** | Look up the domain's current category on each vendor's public lookup page, submit a recategorization request, or ask their own IT to allowlist it | The owner, outside this repo |
| **What only time does** | Domain age. Threat-intel feeds commonly hold a domain in a "newly observed" window measured in weeks | Nobody; it elapses |

Every claim below about what moves a filter is phrased as **likely**, never
certain. The repo-side work is hygiene that some reputation scanners score. It
is worth shipping because it is cheap, correct, and removes the only signals we
control that currently read as "unfinished site". It is not a fix.

## Measured evidence (2026-09-11)

All re-measured in this worktree, not taken on trust.

- `curl -sI https://mtgjudge.gg` → `HTTP/2 200` from CloudFront. The response
  carries only S3/CloudFront headers (`content-type`, `etag`, `server: AmazonS3`,
  `x-cache`, `via`, `x-amz-cf-*`). There is **no** `strict-transport-security`,
  **no** `content-security-policy`, **no** `x-content-type-options`, **no**
  `x-frame-options`, **no** `referrer-policy`, **no** `permissions-policy`.
- `curl -sI https://mtgjudge.gg/robots.txt` → `HTTP/2 200`,
  `content-type: text/html`, `content-length: 470`, `x-cache: Error from
  cloudfront`. That is the single-page-app fallback: `scripts/aws-bootstrap.sh`
  lines 321–333 map CloudFront `403`/`404` to `/index.html` with a `200`, so a
  request for a file that does not exist serves the app shell. The same is true
  of `/.well-known/security.txt`.
- `apps/frontend/public/` contains only `assets/` and `data/`. Neither
  `robots.txt` nor `.well-known/security.txt` exists.
- `curl -sI https://www.mtgjudge.gg` → `HTTP/2 301`,
  `location: https://mtgjudge.gg/`, `x-cache: FunctionGeneratedResponse`. The
  redirect-to-apex CloudFront Function works as designed.
- The domain was registered in Route 53 and attached to CloudFront on
  **2026-09-05** (`docs/aws/deployment.md`, `### Custom domain`;
  `PRD/sections/decisions/deployment.md` line 26). It is six days old.
- `scripts/aws-bootstrap.sh` from line 375 and
  `scripts/lib/cloudfront-custom-domain.mjs` attach exactly three things: an
  ACM certificate, Route 53 alias records, and the redirect function. A
  repository-wide grep for `ResponseHeadersPolicy` returns no infrastructure
  hit — **no response headers policy is attached to the distribution.**
- A repository-wide grep across `PRD/` for `hsts`, `strict-transport`,
  `security header`, `robots.txt`, `security.txt`, `content-security-policy`
  returns **zero** hits outside this work folder. This is net-new product truth,
  not an amendment of an existing rule.

## Current product truth this sits on

- The bare apex `https://mtgjudge.gg` is **the one canonical address**. The
  backend allows exactly one browser origin, so `www.mtgjudge.gg` and the raw
  CloudFront hostname answer a permanent redirect to the apex instead of
  serving the app (`PRD/sections/decisions/deployment.md`, DEC-084, lines 6 and
  11). Every deploy reads the apex alias back off the live distribution and
  uses it as the backend's allowed origin.
- `PRD/sections/system-map.md` lines 504–516: `## AWS production deployment`
  and `### Serverless hosting`, backed by DEC-084, GOAL-003, NFR-003, NFR-004,
  REQ-165, REQ-166, NFR-017.
- NFR-004 (lightweight architecture): one main product-facing endpoint, no
  microservices. Nothing here adds an endpoint or a service.
- NFR-003 (secure backend-only model access): unchanged; no header here touches
  how the OpenAI key is loaded.
- Prior ground: `PRD/instructions/receipts/aws-deployment-onboarding-2026-07-03.md`
  — the original AWS deployment, shipped before the custom domain existed. It
  records no domain-reachability or categorization work.

## Scope

### In scope

1. **REQ-197 — security response headers on every page load.** The bootstrap
   attaches a CloudFront response headers policy to the distribution's default
   cache behavior, idempotently, the same shape as the existing certificate and
   function attachment. Headers: `strict-transport-security`,
   `x-content-type-options`, `x-frame-options`, `referrer-policy`,
   `permissions-policy`. The transform is a pure, unit-tested function beside
   `scripts/lib/cloudfront-custom-domain.mjs`.
2. **REQ-198 — `robots.txt` and `security.txt` are real files.** Both are
   served as themselves with their correct content type instead of returning
   the app shell.
3. **REQ-199 — a domain-reachability runbook the owner can actually run.** A
   new `docs/aws/domain-reachability.md` carrying the three buckets above, the
   before/after verification commands, and the vendor-by-vendor category-lookup
   and recategorization steps the owner performs by hand.
4. **DEC-084 amended in place** so the deployment decision names the response
   headers policy as a fourth thing the bootstrap attaches, and restates that
   the one-canonical-address rule is unchanged.
5. **`PRD/sections/system-map.md`** updated so `### Serverless hosting` and
   `## AWS production deployment` name the headers policy and the static files.

### Non-goals

- **No Content-Security-Policy in this package.** A wrong CSP silently blocks
  the app's own scripts, styles, or its API call to the Lambda Function URL,
  and there is no staging environment to verify one against before it reaches
  players. It is named as deferred hardening, not shipped blind. (Assumption A3.)
- **No `preload` on HSTS.** Submitting the apex to the browser preload list is
  effectively one-way and would bind every future subdomain. (Assumption A5.)
- **No second demo address.** The raw CloudFront hostname keeps redirecting to
  the apex. (Assumption A4 — reasoning below.)
- No product-feature change. No new endpoint, dependency, data contract, or
  architectural layer (NFR-004).
- No attempt to identify which specific vendor or appliance the owner's company
  runs from this side. That evidence only exists on the owner's screen.
- No automated categorization submission. Every vendor's submission path is a
  human web form with a CAPTCHA; scripting it is out of scope and against their
  terms.

## The four IDEA.md open questions, answered

Each is answered by the assumption ladder. None of them meets the genuine
decision blocker test, so none is gated.

1. *Is the response headers policy in scope now, or a separate hardening
   package?* **In scope now.** It is the only code-only lever that exists, and
   it is the smallest reversible scope that closes a real gap (ladder #4). A
   response headers policy is detached by a single `update-distribution` call.
2. *Does the owner want the categorization checklist as a deliverable, given it
   is manual?* **Yes, as REQ-199.** It is the lever most likely to actually move
   a filter, and the package would otherwise ship only work that probably does
   not fix the owner's problem.
3. *Is there evidence to narrow which vendor to target first?* **No.** The
   verbatim request (`intake/request.md`) names no vendor and no block page. The
   checklist stays vendor-agnostic, and its **step 0** is the one thing that
   narrows it: capture the block page or ask IT which gateway they run.
4. *Is waiting out the "newly observed" window acceptable instead of, or
   alongside, submission?* **Alongside.** Elapsed time is not a choice the repo
   makes; the runbook records it as the third bucket so the owner knows a
   submission that changes nothing today may still resolve on its own.

## Material assumptions and their evidence

- **A1 — The block is category/reputation-driven, not a misconfiguration on our
  side.** Evidence: the apex returns a clean `HTTP/2 200` over TLS 1.2 (2021)
  from CloudFront with a valid ACM certificate, and `www.` redirects correctly.
  Nothing in the serving path is broken. The site is six days old and carries
  no security headers. This is stated as the *likely* explanation throughout,
  never as a diagnosis — we cannot see the owner's gateway.
- **A2 — `permissions-policy` must allow the camera.** Evidence: the Scan
  feature calls `getUserMedia` in
  `apps/frontend/src/components/ScanCameraSurface.tsx`. A blanket
  `camera=()` policy would break card scanning. The proposed value is
  `camera=(self), microphone=(), geolocation=()` (ladder #5: preserve
  user-visible behavior).
- **A3 — No CSP.** Evidence: no staging environment exists (`docs/aws/deployment.md`
  describes one production distribution), and the app loads its own bundle plus
  calls a cross-origin Lambda Function URL. A CSP error is invisible in
  response headers and only shows as a broken page for players (ladder #5, #4).
- **A4 — The redirect from the raw CloudFront hostname stays.** Evidence:
  DEC-084 makes the bare apex the one canonical address *because the backend
  allows exactly one browser origin*. Serving the app on the `*.cloudfront.net`
  hostname would load the page and then fail every AI answer on CORS — so it was
  never a working demo fallback, only a working page shell. Reversing it would
  mean also changing the backend's allowed-origin rule, which DEC-084 settles
  (ladder #1). The DEC-084 gate block restates this explicitly so the owner can
  answer `edit` if they want a second address; this brief does not silently
  reverse it. **Note:** a `*.cloudfront.net` hostname is itself commonly
  category-blocked by corporate gateways as shared/anonymizing infrastructure,
  so it is unlikely to be a better demo address even if the CORS problem were
  solved.
- **A5 — HSTS `max-age=31536000; includeSubDomains`, no `preload`.** Evidence:
  ladder #4, smallest reversible scope. `preload` requires a submission to a
  browser-maintained list and is slow and awkward to undo.
- **A6 — `security.txt` needs a contact address the repo does not have.** No
  contact address appears anywhere in the repository, and the only address on
  file is the owner's personal email. The gate asks the owner which address to
  publish rather than the brief inventing one; RFC 9116 also requires an
  `Expires` field, so the runbook carries its renewal date.
- **A7 — Vendors are named, exact submission URLs are not asserted.** Vendor
  lookup pages move. The runbook names each vendor and the page by its own name
  ("URL category lookup", "request recategorization") rather than pinning URLs
  that would rot in the docs.
- **A8 — The static files clear the SPA fallback.** A real object at
  `/robots.txt` is a `200` from S3, so the `404 → /index.html` rule never fires
  for it. REQ-198 carries this as a build-time acceptance criterion rather than
  an assumption, because whether the bundler copies a dotted directory
  (`public/.well-known/`) into `dist/` must be verified, not presumed.

## Verification the owner can run (before and after)

This is the package's observable outcome. It is recorded in REQ-199 so it
survives the work folder's deletion.

```bash
# 1. Security headers — before: none of these lines appear. After: all five do.
curl -sI https://mtgjudge.gg | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'

# 2. Real files — before: content-type text/html (the app shell).
#    After: content-type text/plain.
curl -sI https://mtgjudge.gg/robots.txt | grep -i content-type
curl -sI https://mtgjudge.gg/.well-known/security.txt | grep -i content-type

# 3. Category — run by hand on each vendor's public URL-category lookup page,
#    before and after submission. Record the category each one reports.
```

And the outcome that actually matters, which no command here can produce: the
owner opens `https://mtgjudge.gg` on the company network and the page loads.

## Blocker questions

None. Every uncertainty was settled by the assumption ladder above.

## Proposed product truth

Recorded in `GATE-QUESTIONS.md`, never written to `PRD/sections/` here.
Reserved new IDs: **REQ-197**, **REQ-198**, **REQ-199** (highest existing is
REQ-196). Amended in place: **DEC-084** and the two
`PRD/sections/system-map.md` entries. No new `DEC-###` is minted.
