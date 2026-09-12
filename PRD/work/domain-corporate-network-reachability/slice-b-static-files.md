# Slice B — static-files

## Status: planned

## Goal

`robots.txt` and `.well-known/security.txt` are real files the frontend
build ships, instead of falling through CloudFront's `403`/`404` → `/index.html`
single-page-app mapping and returning the app shell.

## Requirements

1. `apps/frontend/public/robots.txt` exists, permits crawling
   (`User-agent: *` / `Disallow:`), and declares no sitemap (none is
   generated).
2. `apps/frontend/public/.well-known/security.txt` exists and carries, per
   RFC 9116:
   - `Contact: https://mtgjudge.gg/` (a URI, not an email — REQ-198's
     owner-edited verdict: the security contact is the app's own Send
     feedback action, which has no direct URL)
   - a comment line directing reporters to the Send feedback action in the
     app's shared action menu
   - `Expires:` with a concrete renewal date (RFC 9116 requires it; pick one
     roughly a year out and record it — slice D's runbook cross-reference and
     slice C's runbook both need this exact date)
   - no email address anywhere in the file
3. A build-time test proves the frontend build (`vite build`, via
   `apps/frontend`'s own `build` script or a direct `vite build` invocation)
   copies the dotted `apps/frontend/public/.well-known/` directory into
   `apps/frontend/dist/.well-known/` — this must be asserted against a real
   build output, never presumed, because a bundler that silently skips
   dotfiles would leave the path falling back to the SPA shell with nobody
   noticing until the owner curls it in production.
4. The test also asserts `apps/frontend/dist/robots.txt` exists and matches
   the `public/` source.
5. This slice does not touch `scripts/aws-bootstrap.sh`'s `403`/`404` →
   `/index.html` error-response mapping — it is not narrowed or removed. A
   real S3 object at these keys already wins over that mapping because it is
   a `200`, not a `403`/`404`. (No acceptance criterion needs a live curl to
   prove this — it is a property of the existing, unmodified CloudFront
   config, not of this slice's code.)

## Acceptance criteria

- [ ] B1 — `apps/frontend/public/robots.txt` exists, contains `User-agent: *`
      and `Disallow:` (crawling permitted), and contains no `Sitemap:` line.
- [ ] B2 — `apps/frontend/public/.well-known/security.txt` exists, contains
      `Contact: https://mtgjudge.gg/`, a comment line naming the Send
      feedback action in the app's shared action menu, and an `Expires:`
      line with a concrete date; the file contains no `@` email address.
- [ ] B3 — a build-time test (`scripts/frontend-public-static-files.test.mjs`)
      runs the frontend production build and asserts
      `apps/frontend/dist/.well-known/security.txt` exists with content
      identical to the `public/` source — proving the dotted directory
      survives the copy.
- [ ] B4 — the same test asserts `apps/frontend/dist/robots.txt` exists with
      content identical to the `public/` source.
- [ ] B5 — `npm run test:scripts` passes.

## Verification

```bash
npm run test:scripts
```

## Files touched

- `apps/frontend/public/robots.txt` (new)
- `apps/frontend/public/.well-known/security.txt` (new)
- `scripts/frontend-public-static-files.test.mjs` (new)
