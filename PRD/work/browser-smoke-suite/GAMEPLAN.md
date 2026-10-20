# Gameplan — browser-smoke-suite

## What a player gets

A pull request can no longer pass while the shipped site is a blank page, a
tool that never opens, or a send button that never gets an answer. Every PR
opens the built site in Chrome and uses each tool once.

## Architecture

One slice. `scripts/smoke-browser.mjs` picks two free ports, builds the
frontend and backend into an absolute output folder (`<repo>/.tmp/browser-smoke/`),
starts the built backend (mock AI, single-origin CORS) and `vite preview`, then
drives headless Chrome through the `playwright` library at 390 x 844 and
1280 x 800. It is independent of the NFR-020 built-backend check: no shared
command, script or job; `scripts/smoke-built-server.mjs` is untouched.

## Data flow

build (absolute outDir) -> backend on 127.0.0.1:<p1> -> preview on
127.0.0.1:<p2> -> Chrome (fake camera, scryfall images answered locally, other
outside hosts fail) -> six steps -> pass or fail (screenshot, logs) -> always
close browser and stop servers.

## Settled from the quality-check advisories

- One absolute output path for build, preview, screenshots and CI artifact.
- Clear failure message when Chrome cannot launch.
- Camera assertion separable and droppable.
- Own script; #339 already merged, so plan against live `PRD/sections/` and the live workflow.
- The CI time estimate (about one minute) stays an estimate in the receipt.
- `quality:check` builds the backend twice (about 1 s); accepted.

## Verification checklist

- [ ] `npm run test:scripts`
- [ ] `npm run smoke:browser` (needs local Google Chrome)
- [ ] `npm run typecheck && npm run lint && npm run format:check`
- [ ] Workflow job and `deploy.needs` present; parity test green
- [ ] Five accepted PRD text edits in place
- [ ] Ports released, browser closed, nothing under `PRD/work/` shipped

## Shipped files

`scripts/smoke-browser.mjs`, `scripts/smoke-browser.test.mjs`, `package.json`,
`package-lock.json`, `.github/workflows/quality-check.yml`, three files under
`PRD/sections/`, `PRD/instructions/runtime-process-hygiene.md`. Local output:
`.tmp/browser-smoke/` (ignored).

## Slices

| Slice | Doc | Depends on |
| --- | --- | --- |
| A | `slice-a-browser-smoke-check.md` | none |
