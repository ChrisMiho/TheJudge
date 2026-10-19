# Quality check — browser-smoke-suite

**Result: PASS** (graph run `graph-20261019-174628`, node `gate-qc`, attempt 1, 2026-10-19)

Checked: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md`, against `PRD/sections/`, `PRD/work/ci-built-server-smoke/GATE-QUESTIONS.md`, `.github/workflows/quality-check.yml`, `scripts/`, `apps/frontend`, `apps/backend`.

## Blocking findings

None.

## Checks that passed

Diffs apply cleanly:
- REQ-166 line (`functional-requirements.md:3930`), NFR-012 note (`non-functional-requirements.md:209`) and the system-map "Deploy and cost guardrails" Lives-in line each match the "today" text and occur exactly once.
- The "post-#326" text in all three diffs matches character for character what #326's accepted `GATE-QUESTIONS.md` adds (REQ-166 line, NFR-012 line, system-map Summary / Lives in / Backed by).
- The NFR-021 append anchors on the end of the file. Today that is NFR-019's last Notes line, and #326's accepted NFR-020 block goes after it.
- `runtime-process-hygiene.md` sentence ("This policy introduces no new `@playwright/test` CI harness.") matches the file today; #326 does not touch it.

IDs:
- NFR-021 is unused in `PRD/sections/` (grep for `NFR-02[01]` finds nothing, as #326 has not been built). It does not reuse or redefine NFR-020, and says it shares no command, script or job with it.
- NFR-021, REQ-166 and NFR-012 each have a full diff and their own block. The two companion edits (system-map, runtime-process-hygiene) sit inside the NFR-021 block.
- Verdict and Reason slots are blank in all three blocks.

Plain-language: each block opens with "What this decides", "In plain terms", "What happens if you say no". Cited REQ/NFR/DEC substance is inlined (REQ-237 as "CI never needs AWS or a paid call", REQ-063 as "no mock banner", REQ-166 and NFR-012 explained in the sentence).

Ordering after #326: the brief and gate file both say the edits go on top of #326's accepted changes, show both texts per diff, and say the build parks and asks if #326's text is missing.

Repository claims verified:
- One workflow, `.github/workflows/quality-check.yml`, with jobs `static`, `backend`, `frontend`, `coverage-merge`, `changes`, `deploy`; Node 22 on the PR jobs, 24 on `deploy`.
- `deploy.needs` is `[static, backend, coverage-merge, changes]`.
- `deploy` is the only job with `id-token: write` (parity test enforces it).
- `built-server` is not in the workflow yet, as the brief says.
- The frontend build is `tsc -b && vite build`; the deploy sets `VITE_API_URL` and `VITE_DEBUG_LOGGING=false` (`aws-deploy.sh:118-121`).
- The backend build is `tsc -p tsconfig.build.json` into `dist/`, started with `node dist/index.js`.
- CORS: `cors({origin: frontendOrigin})` when set, all origins otherwise (`createApp.ts:47`); production sets `FRONTEND_ORIGIN` (`aws-deploy.sh:108`).
- All six data files under `apps/frontend/public/data/` are in `git ls-files`; `.tmp/` is gitignored.
- `scripts/frontend-public-static-files.test.mjs` runs `vite build`, and `test:scripts` is `node --test scripts/*.test.mjs`, which will pick up a new `smoke-browser.test.mjs`.
- Tool labels exist in source: "Magic question", "Ask TheJudge", "Decrease life for Player 1", "Decrypt Stack", "Send feedback", "Scan a card", "Camera unavailable".
- The In-Depth destination has no Menu row (`App.tsx` filter), as the brief says.
- `playwright@1.64.1` exists on the npm registry. `playwright` is not yet a dependency.

Agent-readiness: the command, script path, port picking, build and start commands, environment settings, widths (390 × 844, 1280 × 800), 15 s step limit, pass/fail rule (zero console errors, page errors, failed or 400+ local requests, no retries), CI job shape (runner, Node 24, preinstalled Chrome, artifact upload 7 days) and the headless handling (fake camera with a fallback, mic and feedback not exercised, card images answered locally, other hosts blocked) are all stated. Nothing needs a paid API, `.secrets/`, AWS or the gitignored dump.

## Advisory findings (not blocking; the build should settle them)

1. Output folder path. `npm --workspace apps/frontend run build -- --outDir .tmp/browser-smoke/dist` resolves a relative `--outDir` against the Vite root (`apps/frontend/`), not the repo root. The build would write to `apps/frontend/.tmp/browser-smoke/dist`, while screenshots and the CI artifact upload use root `.tmp/browser-smoke/`. Both are gitignored (`.tmp/` matches at any depth), and `vite preview --outDir` has the same rule. The build should pass one absolute path computed by the script, and the CI artifact path should match.
2. Preinstalled Chrome on the runner (Chrome 155 on image 20261012) comes from the runner-images readme, not from this repository, and cannot be checked offline. The brief already states the fake-camera fallback; the build should also fail with a clear message if `channel: "chrome"` cannot launch.
3. The CI timing (about one minute) is an estimate, not measured on x86. The brief says so.
4. The fake-camera flags were not tried live (the MCP browser's flags are fixed). The conditional "not Camera unavailable" assertion covers this.

## Status

`STATUS.refined` kept; board row stays under `## refined`. The README `## Preparation gate` section is left to the driver.
