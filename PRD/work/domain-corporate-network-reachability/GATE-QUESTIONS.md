# Gate questions — Domain corporate network reachability

**Read this first.** None of the changes below promises that `mtgjudge.gg`
opens on your company network. Corporate web filters block by *category* and
*reputation*, and a six-day-old domain usually sits in a "newly registered" or
"uncategorized" bucket that many company policies block outright. What follows
is the part we control: the site stops looking unfinished to a reputation
scanner, and you get a runbook for the part only you can do by hand.

Five blocks below. Answer each `- Verdict:` with `accept`, `edit`, or `reject`;
`edit` and `reject` need a `- Reason:`.

---

## REQ-197 — the site starts sending the security headers every real site sends

**What this decides:** whether `mtgjudge.gg` tells browsers and corporate
filters how it wants to be treated — always over HTTPS, never embedded in
someone else's page, no content-type guessing — or keeps answering with nothing
but Amazon's own storage headers, which is what it does today.

**In plain terms:** when anything fetches your site right now, the reply carries
no security instructions at all. I measured it on 2026-09-11: `curl -sI
https://mtgjudge.gg` comes back with `content-type`, `etag`, `server: AmazonS3`
and nothing else. A brand-new domain with a completely bare response reads to a
reputation scanner like a site nobody finished setting up. This adds five
standard headers at the CloudFront edge — the delivery layer that sits in front
of your files. The bootstrap script already attaches three things to that layer
(your certificate, your DNS records, and the redirect that sends `www.` to the
bare address — DEC-084); this makes it four. **One of the five matters to
players directly:** the permissions header must keep the camera allowed, or card
Scan stops working. Nothing a player sees changes.

**What happens if you say no:** the site keeps replying with no security
headers. It is one of the few concrete "unset" things about the new domain, and
it stays unset.

### Proposed diff — `PRD/sections/functional-requirements.md` (append)

```markdown
### REQ-197
- Title: Security response headers on the production distribution
- Priority: medium
- Description: Every response CloudFront serves for `mtgjudge.gg` carries a standard set of security headers, attached as a CloudFront response headers policy on the distribution's default cache behavior. Today the distribution attaches only an ACM certificate, Route 53 alias records, and the redirect-to-apex function (DEC-084), so production replies with nothing but S3/CloudFront headers. The policy is attached idempotently by `scripts/aws-bootstrap.sh`, by the same pure-transform-plus-shell pattern the custom-domain attachment already uses. This is site hygiene: it is one input some domain-reputation scanners score, and it is not claimed to unblock any particular corporate web filter (REQ-199).
- Acceptance Criteria:
  - `scripts/aws-bootstrap.sh` attaches a CloudFront response headers policy to the distribution's default cache behavior, and re-running the bootstrap against a distribution that already carries it makes no `update-distribution` call
  - `curl -sI https://mtgjudge.gg` returns all five of:
    - `strict-transport-security: max-age=31536000; includeSubDomains`
    - `x-content-type-options: nosniff`
    - `x-frame-options: SAMEORIGIN`
    - `referrer-policy: strict-origin-when-cross-origin`
    - `permissions-policy: camera=(self), microphone=(), geolocation=()`
  - the `camera=(self)` grant is asserted by a test, because a blanket `camera=()` silently breaks the Scan feature's `getUserMedia` call in `apps/frontend/src/components/ScanCameraSurface.tsx`
  - the policy transform is a pure function unit-tested without AWS, matching `scripts/lib/cloudfront-custom-domain.mjs`; the shell script owns every AWS call
  - the distribution's aliases, ACM certificate, redirect function, and custom error responses are unchanged by the attachment
  - `docs/aws/deployment.md` records the policy as a fourth bootstrap step under `### Custom domain`
- Constraints:
  - no `Content-Security-Policy` is set by this requirement. There is no staging distribution to verify one against, and a wrong policy silently blocks the app's own bundle or its cross-origin call to the Lambda Function URL — a failure invisible in response headers and visible only as a broken page for players. CSP is named as deferred hardening
  - HSTS carries no `preload` directive and the apex is not submitted to the browser preload list; `preload` is effectively one-way and would bind every future subdomain
  - `x-frame-options: SAMEORIGIN` rather than `DENY`, so the app can still frame its own pages
  - the backend's single allowed browser origin, the one-canonical-address rule, and CORS behavior are untouched (DEC-084, NFR-004)
  - adds no endpoint, service, dependency, or architectural layer (NFR-004)
- Dependencies:
  - DEC-084
  - REQ-199 (the runbook that states plainly what these headers do and do not do)
- Notes:
  - measured 2026-09-11 before the change: `curl -sI https://mtgjudge.gg` returned `HTTP/2 200` carrying only `content-type`, `content-length`, `date`, `last-modified`, `etag`, `x-amz-server-side-encryption`, `accept-ranges`, `server: AmazonS3`, `x-cache`, `via`, `x-amz-cf-pop`, `x-amz-cf-id`, `age` — no security header of any kind
```

### Proposed diff — `docs/aws/deployment.md`, `### Custom domain`

The numbered list of bootstrap steps gains a sixth entry and the intro line
changes `five idempotent steps` to `six idempotent steps`:

```markdown
6. A CloudFront response headers policy on the default cache behavior
   (REQ-197): `strict-transport-security`, `x-content-type-options`,
   `x-frame-options`, `referrer-policy`, and a `permissions-policy` that keeps
   `camera=(self)` so card Scan still works. No `Content-Security-Policy` and
   no HSTS `preload` — see REQ-197's constraints for why.
```

- Verdict:
- Reason:

---

## REQ-198 — `robots.txt` and `security.txt` stop returning the app instead of themselves

**What this decides:** whether the two small text files every scanner asks a
site for actually exist, or keep answering with a copy of the app's home page.

**In plain terms:** ask your site for `/robots.txt` today and it replies `200
OK` with `content-type: text/html` — it is handing back the app shell, not a
robots file, because CloudFront is configured to answer any missing file with
the home page so that deep links work in a single-page app. The same happens
for `/.well-known/security.txt`. Neither file exists in the project
(`apps/frontend/public/` holds only `assets/` and `data/`). To a crawler or a
reputation scanner this is a site that answers every question with the same
page — another small "not finished" signal. This ships both files for real.
Nothing a player sees changes. **One thing I need from you:** `security.txt`
must publish a contact address for someone reporting a security problem, and
there is no such address anywhere in the project. Answer `edit` and name the
address you want published — a dedicated mailbox, your GitHub security advisory
page, or your own email if you are comfortable with it being public.

**What happens if you say no:** both paths keep serving the app shell, and the
site keeps having no published way to report a security problem.

### Proposed diff — `PRD/sections/functional-requirements.md` (append)

```markdown
### REQ-198
- Title: Real robots.txt and security.txt on the production domain
- Priority: low
- Description: `https://mtgjudge.gg/robots.txt` and `https://mtgjudge.gg/.well-known/security.txt` are served as their own files with their own content type, instead of returning the single-page-app shell. Today both return `HTTP/2 200` with `content-type: text/html` and the app's `index.html` body, because `scripts/aws-bootstrap.sh` maps CloudFront `403`/`404` to `/index.html` so deep links resolve. Neither file exists in `apps/frontend/public/`. Shipping them removes two "unfinished site" signals and gives the domain a published security contact (REQ-199).
- Acceptance Criteria:
  - `apps/frontend/public/robots.txt` exists and is copied into the built frontend
  - `curl -sI https://mtgjudge.gg/robots.txt` returns `content-type: text/plain` (today: `text/html`) and the body is the robots file, not the app shell
  - `apps/frontend/public/.well-known/security.txt` exists, is copied into the built frontend, and carries at minimum RFC 9116's `Contact:` and `Expires:` fields, with the contact address the owner nominated at the `define` gate
  - `curl -sI https://mtgjudge.gg/.well-known/security.txt` returns `content-type: text/plain` and the body is the security file, not the app shell
  - the build step is verified to copy a dotted directory (`public/.well-known/`) into the deployed output — asserted at build, never assumed, because a bundler that skips dotfiles would leave the path silently falling back to the app shell
  - the SPA deep-link fallback still works for a real app route (a request for an app path that is not a file still returns `index.html` with the app)
  - `docs/aws/domain-reachability.md` (REQ-199) records the `security.txt` `Expires:` date and that it must be renewed
- Constraints:
  - `robots.txt` permits crawling (`User-agent: *` / `Disallow:`); this is a public product and a blanket disallow would be another negative reputation signal
  - no sitemap is declared, because none is generated
  - the CloudFront `403`/`404` → `/index.html` mapping is not removed or narrowed; a real object at these keys wins on its own, because it is a `200` from S3 and the error mapping never fires
  - no new endpoint, route, or backend behavior (NFR-004); these are static files on the existing frontend origin
- Dependencies:
  - DEC-084
  - REQ-197
  - REQ-199
- Notes:
  - measured 2026-09-11: `curl -sI https://mtgjudge.gg/robots.txt` returned `HTTP/2 200`, `content-type: text/html`, `content-length: 470`, `x-cache: Error from cloudfront` — the error-page fallback, byte-identical to the apex response
  - `Expires:` is mandatory in RFC 9116 and the file goes stale on its own; the renewal date is recorded in the runbook rather than left to be discovered when a scanner flags it
```

- Verdict:
- Reason:

---

## REQ-199 — a runbook for the part only you can do

**What this decides:** whether the package ships you a written procedure for
getting the domain reclassified by corporate filter vendors, or stops at the
code changes and leaves the actual problem undocumented.

**In plain terms:** the code changes above are hygiene. The thing most likely to
actually let you open the site at work is asking the filter vendors to
recategorize `mtgjudge.gg` from "newly registered / uncategorized" to something
your company's policy permits — and every vendor does that through a free
public web form, by hand, with no API. This ships a page in `docs/aws/` that
says plainly which three buckets each lever falls into (what we shipped, what
you do by hand, what only time fixes), lists the vendors with the page to look
for on each, and gives you the exact commands to check the headers before and
after. It also states in writing that none of this guarantees the site opens at
work — so nobody reading it later mistakes hygiene for a fix. The first step is
the one that narrows everything: screenshot the block page or ask your IT which
gateway the company runs.

**What happens if you say no:** the code changes ship with no written way to act
on them, and the recategorization path — the lever most likely to work — stays
undocumented.

### Proposed diff — `PRD/sections/functional-requirements.md` (append)

```markdown
### REQ-199
- Title: Domain reachability and categorization runbook
- Priority: medium
- Description: `docs/aws/domain-reachability.md` records why a newly registered domain is commonly unreachable from a corporate network, what this repository ships against it, what only the owner can do by hand, and what only elapsed time resolves. It carries the before/after verification commands and a vendor-agnostic recategorization checklist. Its governing statement is that no change in this repository guarantees the site opens on any given corporate network.
- Acceptance Criteria:
  - `docs/aws/domain-reachability.md` exists and is linked from `docs/aws/deployment.md`
  - it opens with the three buckets, named as such: what the repo ships (REQ-197 headers, REQ-198 static files), what only the owner can do by hand (category lookup, recategorization submission, asking IT to allowlist), and what only time does (domain age; threat-intel feeds commonly hold a newly observed domain for weeks)
  - it states explicitly, not by implication, that no code change here promises the site opens at work, and that every claim about what moves a filter is a likelihood, not a certainty
  - step 0 of the manual checklist is capturing the evidence that narrows the vendor list: the block page the browser showed, or asking the company's IT which secure web gateway they run
  - the manual checklist names the vendors (Zscaler, Palo Alto Networks, Cisco Talos/Umbrella, Fortinet FortiGuard, Netskope, Trellix/McAfee, Symantec/Broadcom) and describes each one's page by its own name — "URL category lookup", "request recategorization" — rather than pinning URLs that rot
  - it carries the runnable verification block, with the measured 2026-09-11 "before" result recorded beside it so the owner can tell the after-state apart:
    - `curl -sI https://mtgjudge.gg | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'` — before: no output
    - `curl -sI https://mtgjudge.gg/robots.txt | grep -i content-type` — before: `text/html`
    - `curl -sI https://mtgjudge.gg/.well-known/security.txt | grep -i content-type` — before: `text/html`
  - it records the domain's registration date (2026-09-05, Route 53, attached to CloudFront the same day) as the age a "newly registered domain" policy is measured from
  - it records the `security.txt` `Expires:` date from REQ-198 and that renewing it is a manual step
- Constraints:
  - the runbook never claims a code change fixes corporate reachability, and never names a specific vendor as the owner's blocker — that evidence exists only on the owner's screen
  - no automated submission: every vendor's recategorization path is a human web form, and scripting one is both out of scope and against their terms
  - documentation only; no code, no infrastructure change of its own
- Dependencies:
  - REQ-197
  - REQ-198
  - DEC-084
- Notes:
  - the original AWS deployment receipt (`PRD/instructions/receipts/aws-deployment-onboarding-2026-07-03.md`) predates the custom domain and records no reachability or categorization work; this is the first such record
```

- Verdict:
- Reason:

---

## DEC-084 — amended in place: the bootstrap attaches a fourth thing, and the one-address rule stays

**What this decides:** two things. First, whether the deployment decision's own
text records the new security headers policy alongside the certificate, the DNS
records, and the redirect. Second — and this is the one worth pausing on —
whether the bare `mtgjudge.gg` stays the **only** address the app runs on.

**In plain terms:** DEC-084 is the decision that says production is CloudFront
in front of S3, reached at `https://mtgjudge.gg`, with `www.mtgjudge.gg` and the
old `d…cloudfront.net` address both bouncing to it. The reason only one address
serves the app is that the backend accepts requests from exactly one browser
origin — so a second address would load the page and then fail every AI answer.
I am recommending we **keep** that rule, and this amendment only adds the
headers policy to the list of what the bootstrap attaches. I am naming it
explicitly because it is the reason you have no alternate address to demo on:
the `cloudfront.net` hostname is not a spare door. If you want one, that is a
real change — it means also changing the backend's allowed-origin rule — and
`edit` here is where you say so. Be aware a `*.cloudfront.net` address is itself
commonly category-blocked by corporate filters as shared infrastructure, so it
is unlikely to be a better demo address even after that work.

**What happens if you say no:** the decision text keeps describing a bootstrap
that attaches three things when it attaches four, and the next person reading it
will not know the headers policy exists.

### Proposed diff — `PRD/sections/decisions/deployment.md`, DEC-084

`- Decision:` — amend the parenthetical so it reads (change in **bold**):

```markdown
- Decision: Production uses a lightweight AWS serverless deployment: the frontend is a private S3 origin behind CloudFront, reached by players at the custom domain `https://mtgjudge.gg` (an ACM certificate and alias on the distribution, Route 53 alias records, **and a response headers policy carrying HSTS and the standard security headers (REQ-197)**, all attached idempotently by the bootstrap), with `www.mtgjudge.gg` and the raw CloudFront hostname answering a permanent redirect to it through a CloudFront Function; the backend is Lambda behind a public Function URL on its AWS-provided address. The backend's single allowed browser origin follows the domain: every deploy reads the alias back off the live distribution, falling back to the CloudFront hostname when none is attached, so the domain is stored in AWS once. Production runs the OpenAI provider; Lambda loads `OPENAI_API_KEY` from an SSM SecureString at cold start. Pushes to `main` deploy through a quality-gated GitHub Actions workflow using AWS OIDC rather than static AWS credentials.
```

`- Impact:` — the existing canonical-address bullet is amended to say why there
is no alternate address, and one bullet is added after it:

```markdown
  - the bare apex is the one canonical address: the backend allows one origin, so `www.mtgjudge.gg` (and the old CloudFront URL) redirect to it rather than serving the app; the certificate is free (ACM) and the hosted zone is the only recurring cost. **This is why there is no alternate address to reach the app on: the raw CloudFront hostname serves a redirect, not the app, and serving the app there would fail every backend call on CORS unless the allowed-origin rule changed too (REQ-199).**
  - **the distribution carries a response headers policy (REQ-197) and the frontend ships a real `robots.txt` and `.well-known/security.txt` (REQ-198). These are site hygiene that some domain-reputation scanners score; neither is claimed to unblock any particular corporate web filter, and the reachability runbook (REQ-199) states that limit in writing**
```

`- Related requirements:` — append:

```markdown
  - REQ-197
  - REQ-198
  - REQ-199
```

`- Notes:` — append:

```markdown
  - 2026-09-11: the domain was measured six days after attachment and was unreachable from a corporate network while established gaming sites loaded. The distribution carried no security headers and both `robots.txt` and `security.txt` returned the app shell; REQ-197/198/199 close the repo-side gaps. Corporate reachability itself depends on domain category, reputation, and age, which sit outside this repository
```

- Verdict:
- Reason:

---

## system-map — the AWS production deployment entry

**What this decides:** whether the map of what exists in the product mentions
the security headers and the two static files, or leaves them undiscoverable.

**In plain terms:** `PRD/sections/system-map.md` is the index an agent reads to
find out what the product already has. If the headers policy is not listed
there, the next change to the deployment will not know it exists and may drop
it. This is bookkeeping — it changes nothing a player or you experiences. It
applies only to whichever of REQ-197, REQ-198 and REQ-199 you accepted above; if
you rejected one, its mention comes out with it.

**What happens if you say no:** the system map keeps describing a distribution
with no headers policy, and the next deployment change works from a stale map.

### Proposed diff — `PRD/sections/system-map.md`

Line 509, `## AWS production deployment` — `- Backed by:` gains the three IDs:

```markdown
- Backed by: DEC-084, GOAL-003, NFR-003, NFR-004, REQ-165, REQ-166, NFR-017, REQ-197, REQ-198, REQ-199
```

Line 514, `### Serverless hosting` — `- Summary:` gains one sentence after the
existing custom-domain clause (change in **bold**):

```markdown
- Summary: Serves the static frontend from a private S3 origin through CloudFront on the custom domain `mtgjudge.gg` (ACM certificate, Route 53 alias records, **and a response headers policy carrying HSTS, `nosniff`, `SAMEORIGIN` framing, a referrer policy and a camera-preserving permissions policy**, attached by the bootstrap) and the backend from Lambda through a public Function URL. **The frontend also ships a real `robots.txt` and `.well-known/security.txt`, which previously returned the single-page-app shell.** The backend's single allowed browser origin is derived from the distribution's live alias on every deploy. The Lambda deploy artifact is staged in a private S3 bucket rather than uploaded inline, raising the effective package ceiling to Lambda's 250MB unzipped quota.
```

Line 515, `### Serverless hosting` — `- Lives in:` gains the new paths:

```markdown
- Lives in: `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, `scripts/lib/cloudfront-custom-domain.mjs`, `scripts/lib/cloudfront-response-headers.mjs`, `scripts/frontend-origin-source.test.mjs`, `apps/backend/src/lambda.ts`, `scripts/lambda-package-budget.test.mjs`, `apps/frontend/public/robots.txt`, `apps/frontend/public/.well-known/security.txt`, `docs/aws/domain-reachability.md`
```

Line 516, `### Serverless hosting` — `- Backed by:` gains the three IDs:

```markdown
- Backed by: DEC-084, NFR-004, REQ-165, REQ-166, NFR-017, REQ-197, REQ-198, REQ-199
```

- Verdict:
- Reason:

---

## Blocker questions

None. Every uncertainty in this package was settled by the assumption ladder and
recorded in `DESIGN-BRIEF.md` under *Material assumptions and their evidence*.
The one input only you hold — the `security.txt` contact address — is asked for
inside REQ-198 rather than raised as a blocker, because the package proceeds
either way.
