# Domain corporate network reachability

A player on a corporate network — the owner, and any coworker they want to
share the app with or demo it to at work — cannot open `mtgjudge.gg` at all;
the company VPN/web filter blocks it while other gaming sites load fine. The
custom domain is under a week old (registered in Route 53 and attached to
CloudFront on 2026-09-05, `docs/aws/deployment.md` "Custom domain";
`scripts/aws-bootstrap.sh` line ~375; `scripts/lib/cloudfront-custom-domain.mjs`).
That bootstrap only provisions an ACM certificate, Route 53 alias records, and
an apex-redirect CloudFront Function — it sets no CloudFront response headers
policy (no HSTS or other security headers), ships no `robots.txt` or
`security.txt`, and runs no domain-reputation/categorization submission step.
Corporate secure-web-gateways (Zscaler, Palo Alto, Cisco Umbrella, Fortiguard,
Netskope, etc.) commonly block by category "newly registered domain" or
"uncategorized" until a site ages and gets classified with no security
posture signals — which plausibly explains why a brand-new, header-less
domain is blocked while long-established, already-categorized gaming domains
pass through the same filter.

Outcome: shape a package that closes the gaps under our control — a
CloudFront response headers security policy (HSTS plus standard security
headers) and baseline `robots.txt`/`security.txt` — and documents the
domain-categorization submission steps (a manual per-vendor web form, not
code) so the owner can request reclassification instead of only waiting out
the "new domain" blocklist window.

Non-goals: no product-feature change; no attempt to identify which specific
vendor/appliance the owner's company runs; no promise that the code changes
alone unblock the corporate filter — domain reputation and categorization sit
outside our infrastructure and require the owner's own vendor submission or
elapsed time.

## Prior run

- `PRD/instructions/receipts/aws-deployment-onboarding-2026-07-03.md` —
  original AWS/CloudFront production deployment, shipped 2026-07-03, before
  the custom domain existed (attached 2026-09-05). No domain-reachability or
  categorization work recorded there.

## Open questions for define

- Is a CloudFront response headers policy (HSTS + security headers) in scope
  now, or is it a separate hardening package? It is the one concrete,
  code-only lever available.
- Does the owner want the domain-categorization submission checklist
  (Zscaler, Palo Alto, Cisco Umbrella, Fortiguard, Netskope, McAfee/Trellix,
  Symantec/Broadcom — each has a free "submit a site for category review"
  form) as part of this package's deliverable, given it is a manual,
  non-code, per-vendor action the owner or their IT department must perform?
- Is there any evidence available (a browser block page, the company's proxy
  vendor name) that would narrow which vendor's categorization to target
  first, or should the checklist stay vendor-agnostic?
- Is waiting out the "newly observed domain" window (commonly 30-90 days used
  by threat-intel feeds) an acceptable option instead of, or alongside,
  proactive submission?
