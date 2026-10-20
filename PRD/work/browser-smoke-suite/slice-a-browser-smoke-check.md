# Slice A — The browser smoke check, CI job and product truth

## Status: planned

## Goal

Every pull request builds the site, opens it in headless Chrome against the
built backend, and confirms each tool does its most basic action; a red result
stops the deploy.

## Requirements

Read first: `DESIGN-BRIEF.md` (design steps 1-6), `GATE-QUESTIONS.md` (the
three accepted diffs), `evidence/measurements.md`, `QUALITY-CHECK.md`
advisories. Where the brief or gate file says #326's text is unwritten, NFR-020
is only reserved, or `built-server` is not in the workflow, merged #339
supersedes it: plan against the live `PRD/sections/` and
`.github/workflows/quality-check.yml`.

1. New `scripts/smoke-browser.mjs`, run by root script
   `"smoke:browser": "node scripts/smoke-browser.mjs"`. It is its own script:
   it does not import `scripts/smoke-built-server.mjs` or any module extracted
   from it, and that file is not changed (accepted NFR-021: no shared command,
   script or job with NFR-020). Duplicate the small helpers (free-port pick,
   env scrub, spawn/stop, readiness poll) inside the new script or a new
   `scripts/lib/` module only the new script imports.
2. One absolute output directory, computed once by the script (repo root +
   `.tmp/browser-smoke/`), passed as the same absolute `--outDir` to the
   frontend build and to `vite preview`, and used for screenshots. The CI
   artifact path is that same folder (`.tmp/browser-smoke/` at the repo root).
   A relative `--outDir` resolves against `apps/frontend/` and must not be used.
   Never write into `apps/frontend/dist/`.
3. Build and run exactly as brief step 1 and the accepted NFR-021 Constraints:
   frontend built with `VITE_API_URL=http://127.0.0.1:<port>`,
   `VITE_DEBUG_LOGGING=false`, mock and feedback variables unset; backend built
   and started with `FRONTEND_ORIGIN` set and `ASK_AI_PROVIDER`,
   `EMBEDDING_PROVIDER`, `OPENAI_API_KEY`, `NODE_ENV` scrubbed; both servers on
   `127.0.0.1`.
4. Drive headless Chrome with the `playwright` library
   (`chromium.launch({ channel: "chrome" })`), no browser download. If launch
   fails, exit non-zero with one clear message naming the cause: Google Chrome
   is not installed or not launchable, and how to fix it locally. The message
   builder is a pure exported function so a unit test covers it.
5. Run the six steps at 390 x 844 and 1280 x 800, fresh context each, per the
   accepted NFR-021 text. Pass rules: every step within 15 s; zero console
   errors; zero page errors; no local request failing or answering 400+; any
   host other than the two local servers fails, except `cards.scryfall.io`,
   answered locally with a tiny placeholder image. No retries. Assertions use
   visible labels and shapes only, never answer wording, prices or card text.
6. The not-`Camera unavailable` assertion in the scanner step is a separate
   small function behind one named constant or option, so deleting it (if the
   fake-camera flags do not work in CI) is a one-line change and leaves the
   panel-opens and data-files-load checks intact. A unit test proves the other
   scanner checks do not depend on it.
7. On failure print the step, console messages, failed requests and both
   servers' output; save a screenshot under the output folder. Always close the
   browser and stop both servers, on pass and on fail.
8. Unit-test the pure rules in `scripts/smoke-browser.test.mjs` (request
   classification, console filtering, port picking, launch-failure message,
   output-path computation); `npm run test:scripts` picks it up.
9. Add `playwright` as an exact-pinned root devDependency (1.64.1 or the
   version `npm view playwright` shows at least two weeks old; record it);
   update `package-lock.json`. Chrome-only: no `npx playwright install`.
10. Add `npm run smoke:browser` to the end of `quality:check` in root
    `package.json`.
11. In `.github/workflows/quality-check.yml` add a `browser-smoke` job:
    `ubuntu-24.04`, checkout, `setup-node` Node 24 (copy `built-server`'s
    shape), `npm ci`, `npm run smoke:browser`, timeout 10 min, no secrets, no
    `id-token`, no path filter; on failure upload `.tmp/browser-smoke/` as an
    artifact kept 7 days. Add `browser-smoke` to `deploy.needs`.
12. Apply the three accepted diffs to `PRD/sections/` by intent, in this same
    PR: NFR-021 appended after NFR-020 in
    `non-functional-requirements.md`; REQ-166's job list in
    `functional-requirements.md`; NFR-012's job-count note; the system-map
    "Deploy and cost guardrails" entry; and the companion sentence in
    `PRD/instructions/runtime-process-hygiene.md`. Each diff's "-" side is
    live text now; match it, do not guess.
13. Nothing shipped lives under `PRD/work/`. Local output goes to `.tmp/`
    (already gitignored).
14. No paid API, no `.secrets/`, no AWS, no gitignored data dump anywhere in
    the script or its tests.

## Acceptance criteria

- [ ] A1 `playwright` is an exact-pinned root devDependency and `package-lock.json` records it
- [ ] A2 `scripts/smoke-browser.mjs` exists, `npm run smoke:browser` runs it, and it neither imports `scripts/smoke-built-server.mjs` nor any module extracted from it
- [ ] A3 `scripts/smoke-built-server.mjs` is unchanged by this slice
- [ ] A4 One absolute output path is computed by the script and used for the frontend build, `vite preview`, screenshots and the CI artifact; nothing is written to `apps/frontend/dist/`
- [ ] A5 When Chrome cannot launch, the script exits non-zero with a clear message, covered by a unit test
- [ ] A6 The not-`Camera unavailable` assertion is a separate droppable function, and a unit test shows the other scanner checks do not depend on it
- [ ] A7 `scripts/smoke-browser.test.mjs` passes inside `npm run test:scripts`
- [ ] A8 `npm run smoke:browser` passes locally: six steps at both widths, zero console errors, zero failed local requests
- [ ] A9 `quality:check` runs `smoke:browser`, and `typecheck`, `lint` and `format:check` pass
- [ ] A10 `.github/workflows/quality-check.yml` has the `browser-smoke` job (Node 24, no secrets, no `id-token`, 7-day failure artifact of `.tmp/browser-smoke/`) and `deploy.needs` lists it; `ci-workflow-parity` passes
- [ ] A11 The accepted NFR-021, REQ-166, NFR-012, system-map and `runtime-process-hygiene.md` text is in place
- [ ] A12 Browser closed, owned servers stopped, ports released after the local run; the output path is recorded
- [ ] A13 Nothing the PR ships is under `PRD/work/`

## Verification

```bash
npm run test:scripts
npm run smoke:browser
npm run typecheck && npm run lint && npm run format:check
git diff --name-only origin/main...HEAD
```

## Files touched

- `scripts/smoke-browser.mjs` (new)
- `scripts/smoke-browser.test.mjs` (new)
- `package.json`, `package-lock.json`
- `.github/workflows/quality-check.yml`
- `PRD/sections/non-functional-requirements.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/system-map.md`
- `PRD/instructions/runtime-process-hygiene.md`

## PRD promotion checklist (executed at cleanup)

- [ ] Confirm the five PRD edits above are present on `main` after merge
- [ ] Fold `evidence/measurements.md` figures and the measured CI time into the receipt; state that CI time was an estimate until the first run

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/browser-smoke-suite/` ready to delete
