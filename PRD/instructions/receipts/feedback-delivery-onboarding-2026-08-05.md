# Receipt — feedback-delivery-onboarding

- Date: 2026-08-05
- Slug: `feedback-delivery-onboarding`
- Status: shipped (owner-action, force-closed by explicit user request; package never reaches `ship-ready` in the slice sense since it has no slices)

## Actions taken

- [x] Verified all owner checklist items complete: Formspree form created (public id `xdenozlb`), local `.env` configured, live-send smoke passed (modal submit confirmed in Formspree dashboard + email confirmed received in owner inbox with matching `appState`), optional Trade Balancer scan smoke confirmed on-device (correct default printing, editable, side math updates; deny-camera path shows an error code and leaves manual search/edit-printing fully usable with math updating accordingly).
- [x] Wired production build env: added `VITE_FEEDBACK_FORMSPREE_ID: ${{ vars.VITE_FEEDBACK_FORMSPREE_ID }}` to `.github/workflows/deploy-aws.yml`'s build `env:` block, reading a GitHub Actions repository **variable** (not a secret — this id is public, non-secret, build-time config per DEC-105).
- [x] Owner still owns one manual step outside this repo/receipt: setting the `VITE_FEEDBACK_FORMSPREE_ID` repository variable's value (`xdenozlb`) in GitHub repo Settings → Secrets and variables → Actions → Variables. This is a one-time GitHub UI/API action, blocked from automated execution here by the auto-mode classifier (shared repo-settings write), and does not block this package's close-out — the workflow wiring is in place and will pick up the value on the next push-to-`main` once set.
- [x] Recorded live-delivery confirmation in `PRD/sections/system-map.md` (Feedback & bug report summary) and `PRD/sections/decisions/feedback.md` (DEC-105 Notes).
- [x] No `DEC`/`REQ` `Status:` field edited to convey shipped-vs-planned (per doc-lifecycle system-map promotion gate — that signal lives only in system-map.md; DEC-105 was already `confirmed` and stays `confirmed`).
- [x] Reviewed for secrets: only the public Formspree form id and a non-secret GitHub Actions variable name/value are referenced; no private keys, no recipient email in the repo.
- [x] Deleted `PRD/work/feedback-delivery-onboarding/` after this receipt.
- [x] Removed slug from `PRD/work/STATUS.md`.

## Files created

- `PRD/instructions/receipts/feedback-delivery-onboarding-2026-08-05.md`

## Files updated

- `.github/workflows/deploy-aws.yml` (added `VITE_FEEDBACK_FORMSPREE_ID` to build env, sourced from repo var)
- `PRD/sections/system-map.md` (Feedback & bug report summary — live delivery confirmed)
- `PRD/sections/decisions/feedback.md` (DEC-105 Notes — live delivery confirmed)
- `PRD/work/STATUS.md`

## Files deleted

- `PRD/work/feedback-delivery-onboarding/`

## Verification results

- Live-send smoke: modal submission visible in Formspree dashboard (category `bug`, message "This broke", full `appState` payload) and the corresponding email confirmed received in the owner's inbox.
- Trade Balancer scan smoke: on-device confirmation of default printing on scan, printing editability, side-total/difference math updates, and deny-camera fallback (error code shown, manual search/edit-printing fully usable, math still updates).
- Production build env: workflow-level wiring verified by reading `.github/workflows/deploy-aws.yml`; the repo-variable value itself is an outstanding one-time owner action in GitHub settings, tracked here rather than left to rot in a deleted work folder.
- No backend/contract change; no secrets committed.
