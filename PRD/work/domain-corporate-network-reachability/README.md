status: active

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

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/domain-corporate-network-reachability/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Goal | Status | Dependencies |
| --- | --- | --- | --- |
| [A — response-headers-policy](slice-a-response-headers-policy.md) | CloudFront response headers policy (HSTS, nosniff, SAMEORIGIN, referrer-policy, camera-preserving permissions-policy), attached idempotently by `aws-bootstrap.sh` | done | parallel-ready — REQ-197, DEC-084 |
| [B — static-files](slice-b-static-files.md) | Real `robots.txt` and `.well-known/security.txt`, proven to survive the frontend build's dotted-directory copy | done | parallel-ready — REQ-198 |
| [C — domain-reachability-runbook](slice-c-domain-reachability-runbook.md) | `docs/aws/domain-reachability.md`: three-bucket framing, before/after verification commands, vendor-agnostic recategorization checklist | planned | parallel-ready — REQ-199 |
| [D — prd-truth-apply](slice-d-prd-truth-apply.md) | Apply REQ-197/198/199, DEC-084 amendment, and the two `system-map.md` entries into `PRD/sections/`, re-derived against what A/B/C actually shipped. Carries Ship gates. | planned | sequential — A, B, C |

## Implementation map

- `scripts/lib/cloudfront-response-headers.mjs`, `.test.mjs` — slice A, new
- `scripts/aws-bootstrap.sh` — slice A, edited (`### Custom domain` block)
- `docs/aws/deployment.md` — slice A (numbered step list) and slice C (`See also` link), edited
- `apps/frontend/public/robots.txt`, `apps/frontend/public/.well-known/security.txt` — slice B, new
- `scripts/frontend-public-static-files.test.mjs` — slice B, new
- `docs/aws/domain-reachability.md` — slice C, new
- `PRD/sections/functional-requirements.md`, `PRD/sections/decisions/deployment.md`, `PRD/sections/system-map.md` — slice D, edited (durable PRD truth)

Full architecture, data flow, and verification checklist: `GAMEPLAN.md`.

## Next step

Gate verdicts applied 2026-09-12 (see `GRAPH-RUN.md` `## Gate verdicts`): 4
accept, 1 edit (REQ-198 — `security.txt` points to the app's Send feedback
action, no email published). Docs PR #232 is merged; the build half
(`graph-implement`) is running from `main`.

`/thejudge-implement PRD/work/domain-corporate-network-reachability/ slice A`
(Claude Code) or `$thejudge-implement PRD/work/domain-corporate-network-reachability/ slice A`
(Codex). For one unattended agent completing every slice,
`/thejudge-implement-all PRD/work/domain-corporate-network-reachability/`.
