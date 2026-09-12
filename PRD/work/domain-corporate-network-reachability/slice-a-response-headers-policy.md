# Slice A — response-headers-policy

## Status: planned

## Goal

Every response CloudFront serves for `mtgjudge.gg` carries five standard
security headers, attached as a CloudFront response headers policy on the
distribution's default cache behavior, the same idempotent shell-plus-pure-
transform pattern `scripts/lib/cloudfront-custom-domain.mjs` already uses for
the certificate/alias/redirect attachment.

## Requirements

1. `scripts/lib/cloudfront-response-headers.mjs` exports a pure transform
   (no AWS SDK calls) that builds a `ResponseHeadersPolicyConfig` carrying
   exactly:
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (no
     `preload` — A5 in `DESIGN-BRIEF.md`)
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(self), microphone=(), geolocation=()`
   - No `Content-Security-Policy` header (A3 — deferred hardening, named
     not shipped).
2. The module also exports an idempotency check (mirroring
   `hasCustomDomain`/`attachCustomDomain`'s check/attach split) that can tell,
   from a `get-distribution-config`-shaped fixture and the policy's expected
   header values, whether the distribution's default cache behavior already
   references a response headers policy with this exact header set.
3. `scripts/aws-bootstrap.sh` creates the response headers policy (via
   `aws cloudfront create-response-headers-policy` /
   `update-response-headers-policy`, matching the existing
   create-or-update-then-attach shape used for the redirect function) and
   sets `DefaultCacheBehavior.ResponseHeadersPolicyId` on the distribution,
   guarded by the idempotency check so a distribution that already carries it
   makes no `update-distribution` call — the same guard shape the custom
   domain attachment already uses a few lines above where this hooks in.
4. The attachment touches only `ResponseHeadersPolicyId` on the default cache
   behavior: `Aliases`, `ViewerCertificate`, the redirect
   `FunctionAssociations`, and `CustomErrorResponses` are byte-identical
   before and after.
5. `docs/aws/deployment.md`'s `### Custom domain` section gains a sixth
   numbered step (the intro line changes "five idempotent steps" to "six"),
   describing the response headers policy per the accepted REQ-197 diff in
   `GATE-QUESTIONS.md`.

## Acceptance criteria

- [ ] A1 — `scripts/lib/cloudfront-response-headers.mjs` exports a pure
      function producing the five header values above verbatim, with no
      `Content-Security-Policy` key present anywhere in its output.
- [ ] A2 — `scripts/lib/cloudfront-response-headers.test.mjs` asserts all
      five header values verbatim, explicitly asserts the
      `permissions-policy` value keeps `camera=(self)` (not a blanket
      `camera=()`, which would break `ScanCameraSurface.tsx`'s
      `getUserMedia` call), and asserts no CSP header is produced.
- [ ] A3 — the module's idempotency check is unit-tested: given a fixture
      distribution config that already carries the policy, it reports "no
      change needed"; given one that doesn't (or carries a different header
      set), it reports "attach needed".
- [ ] A4 — a test proves the attach step changes only
      `DefaultCacheBehavior.ResponseHeadersPolicyId` and leaves `Aliases`,
      `ViewerCertificate`, `FunctionAssociations`, and `CustomErrorResponses`
      byte-identical, using a fixture in the same shape as
      `cloudfront-custom-domain.test.mjs`'s `freshConfig()`.
- [ ] A5 — `scripts/aws-bootstrap.sh` calls the create-or-update-policy step
      and the idempotent attach step in the custom-domain block, following
      the existing create/update-then-publish-then-attach shape used for the
      redirect function a few lines above.
- [ ] A6 — `docs/aws/deployment.md`'s `### Custom domain` intro and numbered
      list read "six idempotent steps" with the response headers policy as
      step 6, matching the accepted REQ-197 diff in `GATE-QUESTIONS.md`.
- [ ] A7 — `npm run test:scripts` passes.

## Verification

```bash
npm run test:scripts
```

## Files touched

- `scripts/lib/cloudfront-response-headers.mjs` (new)
- `scripts/lib/cloudfront-response-headers.test.mjs` (new)
- `scripts/aws-bootstrap.sh` (edit — `### Custom domain` block, ~line 375+)
- `docs/aws/deployment.md` (edit — `### Custom domain` numbered list only;
  slice C edits a different part of this same file)
