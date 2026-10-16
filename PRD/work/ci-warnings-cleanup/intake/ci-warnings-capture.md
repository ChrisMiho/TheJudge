# CI warnings capture — Quality Check run 38859813334 (main, 2026-10-16)

Origin: captured by the graph driver from `gh api repos/ChrisMiho/TheJudge/check-runs/<job>/annotations`
for every job of the most recent Quality Check run (push to main after PR #314).
The owner's request: "on the most recent github actions workflow, i can see 17 warnings
listed about ubuntu and some other aspects of the code, can we address these?"

Workflow file: `.github/workflows/quality-check.yml` (the only workflow).
Jobs: changes, backend, static, frontend-shard 1/3, 2/3, 3/3, coverage-merge, deploy.

## Warnings (18 on the finished run; the owner saw 17)

### A. Node 20 action runtime deprecation — 8 warnings (one per job)

> Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced
> to run on Node.js 24: <list>. See
> https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/

Actions named across jobs: `actions/checkout@v4`, `actions/setup-node@v4`,
`actions/upload-artifact@v4`, `actions/download-artifact@v4`,
`aws-actions/configure-aws-credentials@v4`.

### B. React fast-refresh lint (`react-refresh/only-export-components`) — 9 warnings (static job)

- `apps/frontend/src/lib/feedback/FeedbackContextProvider.tsx:104` — "Use a new file to share constants or functions between components"
- `apps/frontend/src/lib/feedback/FeedbackContextProvider.tsx:121` — same
- `apps/frontend/src/components/portal/destinationRegistry.tsx:64` — "Move your component(s) to a separate file. If all exports are HOCs, add them to the `extraHOCs` option"
- `apps/frontend/src/components/portal/destinationRegistry.tsx:65` — same
- `apps/frontend/src/components/portal/destinationRegistry.tsx:66` — same
- `apps/frontend/src/components/portal/destinationRegistry.tsx:67` — same
- `apps/frontend/src/components/SheetShell.tsx:28` — "Use a new file to share constants or functions between components"
- `apps/frontend/src/components/FrozenGameContextDetails.tsx:61` — same
- `apps/frontend/src/components/AmbientScene.tsx:64` — same

(Nine fast-refresh lines. Full count across all 8 jobs = 8 Node-20 + 9 fast-refresh +
1 hook-deps = 18; the owner saw 17, most likely before the deploy job finished and added
its Node-20 warning. Re-count locally with `npm run lint` before scoping.)

### C. React hooks lint (`react-hooks/exhaustive-deps`) — 1 warning (static job)

- `apps/frontend/src/components/ConversationThread.tsx:173` — "React Hook useLayoutEffect has a missing dependency: 'scrollToLatest'. Either include it or remove the dependency array"

## Notices (8 — not counted as warnings, but the owner named "ubuntu")

One per job:

> The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026. See
> https://github.com/actions/runner-images/issues/14748

Every job uses `runs-on: ubuntu-latest`. Today is 2026-10-16, so the migration starts in
three days. The deploy job builds the arm64 Lambda bundle (native onnx/sharp chain — see
prior prod-embedder fallbacks), so a runner OS change is a deploy-risk surface.

## Current pins (from `.github/workflows/quality-check.yml`)

- `runs-on: ubuntu-latest` — lines 33, 64, 83, 125, 160, 227
- `actions/checkout@v4`, `actions/setup-node@v4` (node-version 22; deploy job 24),
  `actions/upload-artifact@v4`, `actions/download-artifact@v4`,
  `aws-actions/configure-aws-credentials@v4`
