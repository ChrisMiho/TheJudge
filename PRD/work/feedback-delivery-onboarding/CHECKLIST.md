# Owner checklist — feedback delivery onboarding

Run top to bottom. Nothing here requires an engineer, and nothing here is blocking a deploy.

## 1. Create the Formspree form

- [ ] Sign up / sign in at <https://formspree.io>.
- [ ] Create a new form. The **recipient email you enter there** is where feedback lands — it is
      registered with Formspree and never enters this repo.
- [ ] Copy the form id from the form's endpoint URL: `https://formspree.io/f/<id>` → `<id>`.

> The id is public (it ships in the frontend bundle by design). It is **not** a secret and must not
> go in `.secrets/`.

## 2. Configure the id

- [ ] Local: add `VITE_FEEDBACK_FORMSPREE_ID=<id>` to `apps/frontend/.env` (not `.env.example` —
      that file documents the variable with an empty value and stays that way).
- [ ] Production: set the same build-time variable in the deploy's build environment. It is read at
      build time by Vite, so a rebuild is required for it to take effect.
- [ ] Restart the dev server / rerun the build.

## 3. Live-send smoke check

- [ ] Open the app, open the feature portal, choose **Send feedback**.
- [ ] Confirm the modal no longer shows the "feedback delivery isn't configured" hint and that
      submit is enabled.
- [ ] Pick a category, type a message, optionally add a reply email.
- [ ] Expand the app-state disclosure and confirm the summary looks right and contains nothing you
      wouldn't want emailed.
- [ ] Submit. Expect a success state in the modal.
- [ ] Confirm the email arrives at the Formspree recipient address, and that `appState` in the body
      matches what the disclosure showed.
- [ ] Formspree's first submission may require a one-time confirmation click in your inbox —
      complete it if prompted.

## 4. Optional — Trade Balancer scan smoke check

Component tests cover the scan-input path, but only a human with a phone and real cards can confirm
the end-to-end feel.

- [ ] Open the Trade Balancer on a phone, add a card to a side via **Scan**.
- [ ] Confirm the scanned printing is the default, that it can be changed, and that the side total
      and difference update.
- [ ] Confirm the deny-camera path still leaves manual search fully usable and explains why.

## 5. Close out

- [ ] Record the outcome in the relevant `sections/` entry (delivery live + date).
- [ ] Delete `PRD/work/feedback-delivery-onboarding/` per `instructions/doc-lifecycle.md`.
