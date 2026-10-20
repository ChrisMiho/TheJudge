# Quality check — browser-smoke-suite

**Result: PASS** (graph run `graph-20261019-190721`, node `gate-qc`, attempt 1 of the build half, the re-grade after the owner's verdicts, 2026-10-19)

Checked: `DESIGN-BRIEF.md`, finalized `GATE-QUESTIONS.md` (NFR-021, REQ-166, NFR-012 all accept), `evidence/measurements.md`, the first grade's result (graph run `graph-20261019-174628`), and the gate-verdicts section of `GRAPH-RUN.md`, against `PRD/sections/` and the repository as cut from today's `origin/main` (`8bf88d17`, which carries code PR #339).

## Blocking findings

None.

## Consistency after the verdicts

- All three verdicts are accept with a Reason line; no diff was edited or rejected. The README intake note and "Brief reconciliation: none" agree.
- The NFR-021 Reason (the extra 20–30 s on the local pre-PR check is acceptable) matches the brief's own design step 3 (joins `quality:check`, roughly 20–30 s locally). Nothing in the brief contradicts a verdict or an accepted diff.
- The two companion edits (system-map, `runtime-process-hygiene.md`) sit inside the accepted NFR-021 block.

## Diffs against main as it is now (#339 merged)

Every line a diff shows as current text now matches `PRD/sections/` (or the instruction file) exactly once, checked with fixed-string counts:

- REQ-166, `functional-requirements.md:3930`: the diff's "-" line (job list with `built-server`) matches once. The line is already the post-#326 text.
- NFR-012, `non-functional-requirements.md:209`: the "-" line (7 jobs, "the seventh is NFR-020's `built-server` job", "plus about one minute for `built-server`") matches once.
- System-map "Deploy and cost guardrails" (`system-map.md:535-538`): Summary, Lives in and Backed by "-" lines each match once.
- NFR-021 append: the file ends with NFR-020's last Notes line ("measured 2026-10-18 on macOS arm64: build 1.2 s ..."), the exact anchor the diff names. NFR-020 is at line 347.
- `PRD/instructions/runtime-process-hygiene.md`: the sentence "This policy introduces no new `@playwright/test` CI harness." and the line before it match once (the file lines are 23–25, not the "22–26" the gate file cites; harmless).
- NFR-021 is unused: it appears nowhere in `PRD/sections/` and nowhere on `origin/main` outside this package's own folder.
- No line moved or changed wording. What changed is only that the "post-#326" text is now the live text, so each diff's "-" side is what is on the page.

## Repository claims re-verified

- Workflow `.github/workflows/quality-check.yml`: jobs `static`, `backend`, `built-server`, `frontend`, `coverage-merge`, `changes`, `deploy`. `built-server` runs on `ubuntu-24.04`, Node 24, `npm ci`, `npm run smoke:built-server`, 10-minute timeout, no secret, no `id-token`. `deploy.needs` is `[static, backend, built-server, coverage-merge, changes]`; `deploy` alone has `id-token: write` and Node 24.
- Root scripts: `quality:check` ends with `npm run smoke:built-server`; `smoke:built-server` is `npm --workspace apps/backend run build && node scripts/smoke-built-server.mjs`; `test:scripts` is `node --test scripts/*.test.mjs scripts/lib/*.test.mjs`, so a new `scripts/smoke-browser.test.mjs` is picked up.
- Frontend build `tsc -b && vite build`; backend build `tsc -p tsconfig.build.json`; the deploy bakes `VITE_API_URL`, `VITE_DEBUG_LOGGING=false` and `VITE_FEEDBACK_FORMSPREE_ID` (`aws-deploy.sh:118-121`); the site calls the backend directly at `VITE_API_URL` (`env.ts:62`); CORS is single-origin when `FRONTEND_ORIGIN` is set (`createApp.ts:47`, `aws-deploy.sh:108`).
- Feedback id: a build with `VITE_FEEDBACK_FORMSPREE_ID` unset resolves to `null` and delivery degrades to a no-op (`env.ts` resolver), as the brief says.
- All six files under `apps/frontend/public/data/` are in `git ls-files`; `.tmp/` is gitignored (`.gitignore:38`).
- `scripts/frontend-public-static-files.test.mjs` still runs a real `vite build` (REQ-198), so the brief's "every PR compiles the bundle but never opens it" claim holds.
- No `playwright` entry in any `package.json` or in `package-lock.json`; `playwright@1.64.1` was confirmed on the registry in the first grade.
- Tool labels and the In-Depth no-Menu-row claim were verified in the first grade and the sources have not changed in the merged diff.
- The parity guard `scripts/ci-workflow-parity.test.mjs` expands `npm run` references into leaf commands, so a `browser-smoke` job running `npm run smoke:browser` that appears in `quality:check` satisfies it with no decomposition entry.

## Agent-readiness

Command and script path, port picking, build and start commands, environment settings (what is set and what is scrubbed), browser (Google Chrome through the `playwright` library), widths (390 × 844 and 1280 × 800), per-step 15 s limit, network blocking (scryfall images answered locally, any other outside host fails), pass/fail rule (zero console errors, page errors, failed or 400+ local requests, no retries), CI job shape (runner, Node 24, preinstalled Chrome, artifact upload kept 7 days, no secrets), and headless limits (fake camera with a fallback, mic and feedback not exercised, card images local) are all stated. Acceptance conditions are measurable. Nothing needs a paid API, `.secrets/`, AWS access or a gitignored dump.

## First grade's four advisories, carried forward

1. Relative `--outDir .tmp/browser-smoke/dist` resolves against `apps/frontend/`, not the repo root. Not settled by the brief; stays advisory for map-out. Pass one absolute path computed by the script to both `vite build` and `vite preview`, and make the CI artifact path match the screenshots path (`.tmp/browser-smoke/` at the repo root).
2. Preinstalled Chrome on the runner comes from the runner-images readme, not from this repo. Not settled; stays advisory. Map-out should add a clear failure message when `chromium.launch({ channel: "chrome" })` cannot start.
3. The one-minute CI time is an estimate, not measured on x86. The brief says so; stays advisory (state it in the receipt).
4. Fake-camera flags were not tried live. The brief's conditional "not Camera unavailable" assertion covers it; stays advisory for map-out to keep that assertion droppable.

## New advisory findings (not blocking)

5. Stale narrative in the brief and gate file. After #339 merged, some sentences are no longer true: the brief's job table lists `deploy.needs` as `[static, backend, coverage-merge, changes]` and six jobs, and says "`built-server` ... is not in the workflow yet (checked 2026-10-19)" (brief lines 62–66); the brief and gate file say #326's build has not written its text into `PRD/sections/` and that NFR-020 is "reserved" and unwritten (brief 220–224, 326–330; gate file 8–19 and each "Today the line reads (#326's diff replaces it)" paragraph). All of that is now written. The diffs themselves are correct and apply; their "-" sides are the live text. Map-out should treat those sentences as superseded and apply each diff's "-" to "+" directly. The brief's park-if-#326-missing rule does not trigger, because the text is present.
6. Reuse from the merged `scripts/smoke-built-server.mjs`. It exports `pickFreePort`, `isPortFree`, `buildChildEnv` (scrubs `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, `OPENAI_API_KEY`, `NODE_ENV`; sets `PORT`), `spawnBuiltServer` (spawn, output capture, SIGTERM then SIGKILL stop), `waitUntilReady` and `SOL_RING_ORACLE_ID`. The brief's design duplicates port picking, env scrubbing and server start/stop and says it "shares no script" with NFR-020 (the accepted NFR-021 text says "shares no command, script or job"). Map-out should decide: either extract those helpers into a small `scripts/lib/` module both scripts import (keeps the accepted wording true, since neither script imports the other), or duplicate them knowingly. Do not import `smoke-built-server.mjs` from `smoke-browser.mjs` directly. Backend-ready polling on `/api/health` can use `waitUntilReady`.
7. `quality:check` will run the backend build twice (once in `smoke:built-server`, once in `smoke:browser`). Harmless (about 1 s); map-out may let `smoke:browser` skip the backend build when `apps/backend/dist` is fresh, or accept the duplicate.

## Status

`STATUS.refined` kept (exactly one marker). The `PRD/work/STATUS.md` board row stays under `## refined`. The README `## Preparation gate` section is left to the driver.
