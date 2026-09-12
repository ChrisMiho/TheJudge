# Domain reachability and categorization

`mtgjudge.gg` can be unreachable from a corporate network while long-established
gaming sites load fine through the same filter. **Read this first: nothing in
this repository, and nothing on this page, guarantees the site opens on any
given corporate network.** Every claim below about what moves a filter is a
likelihood, never a certainty — corporate secure web gateways decide by
*domain category* and *reputation*, evidence that exists only on the vendor's
own servers and on the screen of whoever is blocked.

## The three buckets

Every lever for this problem falls into exactly one of these. Keeping them
separate matters: shipping the first bucket and stopping there would look like
a fix and not be one.

| Bucket | What it covers | Who does it |
| --- | --- | --- |
| **What the repo ships** | A CloudFront response headers policy (REQ-197: HSTS, `nosniff`, `SAMEORIGIN` framing, a referrer policy, a camera-preserving permissions policy) and real `robots.txt` / `security.txt` files instead of the single-page-app shell (REQ-198) | This repository, as code shipped in this package |
| **What only the owner can do by hand** | Look up the domain's current category on each filter vendor's public lookup page, submit a recategorization request, or ask the company's own IT to allowlist the domain | The owner, outside this repository |
| **What only elapsed time resolves** | Domain age. Threat-intel feeds commonly hold a newly registered domain in an "uncategorized" or "newly observed" bucket for weeks, independent of anything the owner does | Nobody; it elapses |

The repo-side work is hygiene: it removes signals that read as "unfinished
site" to a reputation scanner. It is not claimed to unblock any particular
corporate web filter.

## Manual checklist

**Step 0 — capture the evidence that narrows the vendor list.** Before trying
any vendor's lookup page, get one of:

- a screenshot of the block page the browser showed (most secure web gateways
  brand their block page), or
- an answer from the company's own IT department to "which secure web gateway
  do we run?"

Skipping this step means working through every vendor below one at a time with
no way to tell which one actually matters.

### Vendors

Each vendor runs its own public category-lookup and recategorization-request
pages. Page names are given instead of URLs, because vendor URLs move and a
pinned link in this file would rot silently:

- **Zscaler** — look for its "URL Category Lookup" tool, then "Submit a
  URL Category Change Request" (or similar wording; vendors periodically rename
  and relocate this).
- **Palo Alto Networks** — "Test A Site" (URL category lookup), then
  "URL Filtering Change Request" (or similar current naming) for the
  recategorization submission.
- **Cisco Talos / Umbrella** — Talos' public "Reputation Center" / URL
  lookup, then its "Support Ticket" / "Report a Category Error" submission
  path.
- **Fortinet FortiGuard** — "FortiGuard Web Filter" lookup page, then its
  "URL rating / recategorization" submission form.
- **Netskope** — its public URL category lookup / "Cloud Confidence Index"
  style tool, then its recategorization request form.
- **Trellix (formerly McAfee)** — "Trellix URL Ticketing System"
  (historically "McAfee Customer Submission" / "TrustedSource"), the
  category-lookup-and-request tool in one.
- **Symantec / Broadcom** — "Site Review" (Symantec WebPulse / Broadcom
  BlueCoat), the category lookup and recategorization request tool.

**No automation of any submission.** Every vendor's recategorization path is a
human web form, most with a CAPTCHA, and scripting one is both out of scope
here and against the vendor's own terms of use.

**This runbook never names a specific vendor as the owner's actual blocker.**
That evidence exists only on the owner's screen (the block page from step 0)
or from the company's own IT — never from this repository.

## Before/after verification

Run these from any machine with the current production DNS (not necessarily
the blocked corporate network — the goal is confirming the repo-side change
deployed, not testing the corporate filter itself). Run them **after**
`scripts/aws-bootstrap.sh` and a deploy — this package's own build cannot run
them against the live site.

```bash
# 1. Security headers (REQ-197) — measured before (2026-09-11): no output at
#    all. After a deploy: all five headers appear.
curl -sI https://mtgjudge.gg | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'

# 2. Real files, not the app shell (REQ-198) — measured before (2026-09-11):
#    text/html (the SPA fallback). After a deploy: text/plain.
curl -sI https://mtgjudge.gg/robots.txt | grep -i content-type
curl -sI https://mtgjudge.gg/.well-known/security.txt | grep -i content-type
```

## Recorded dates

- **Domain age.** `mtgjudge.gg` was registered in Route 53 and attached to the
  CloudFront distribution on **2026-09-05**. That is the date a "newly
  registered domain" policy measures age from.
- **`security.txt` renewal.** The shipped `security.txt`
  (`apps/frontend/public/.well-known/security.txt`) carries
  `Expires: 2027-09-12T00:00:00.000Z` (RFC 9116 requires this field). Renewing
  the file before that date — picking a new `Expires:` value roughly a year
  out and committing it — is a manual step; nothing in this repository does it
  automatically.

## What actually matters, and what this page cannot prove

The outcome that actually matters — the owner opening `https://mtgjudge.gg` on
their company network and the page loading — is not something any command
above, or any change in this repository, can produce or verify. The repo-side
work removes two "unfinished site" signals; recategorization, if it happens,
happens on a vendor's own timeline; and domain age resolves only by elapsing.
