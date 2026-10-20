# browser-smoke-suite

## Request (owner, verbatim)

> could this approach just be more generalized to say that we have smoke tests for frontend and backend features, that validates basic functionality, and isnt just this? or is the rest of the ui flushed out with tests already?

## Context from the driver (not owner decisions)

The owner asked this about docs PR #326 (`ci-built-server-smoke`), a CI check that builds and boots the backend and requires `/api/health` and one card lookup to answer.

The driver found that feature behavior is already broadly tested from source: about 156 frontend test files (vitest with jsdom, many walking whole player flows in `apps/frontend/src/App.*.test.tsx`) and about 58 backend test files including supertest route tests. But nothing on a pull request runs the shipped artifacts. The production frontend build (`npm --workspace apps/frontend run build`, i.e. `tsc -b && vite build`) runs only inside `scripts/aws-deploy.sh` after merge, and no test runs the app in a real browser.

The driver recommended, and the owner approved starting, a separate idea: a browser smoke suite. The driver also recommended widening #326 to include the frontend production build. That verdict belongs to the owner and is not decided here.

## What it means for a player

A pull request that would ship a site where a tool fails to open, shows a blank screen, or cannot do its most basic action in a real browser is caught before it is merged and deployed. Players never meet the broken build.

## Problem, outcome, non-goals

Problem: source-level tests pass while the built site can still be broken (bad bundle, failed lazy-load, blank screen). Today that is found only after deploy, if at all.

Outcome: each pull request builds the site, opens it in a headless browser, and checks that each tool loads and one basic action works.

Non-goals: re-testing feature behavior already covered by the unit and flow tests; deciding product behavior; changing `PRD/sections/` or code in this package.

## Open questions for refinement

- Which tools and which one basic action per tool does the suite cover?
- Which browser (one or several), and desktop only or phone width too?
- Real backend or mock backend behind the built site?
- CI time budget, and does it block merge or only report?
- Relation to #326: keep separate, or fold the frontend production build into #326? Owner's verdict on #326.
- Does the suite need data files that are absent in CI (the card dump is gitignored)?

## Prior run

- PRD/instructions/receipts/codebase-cleanup-pass-2026-10-18.md
- PRD/instructions/receipts/ci-quality-check-runtime-2026-08-06.md
- PRD/instructions/receipts/ci-warnings-cleanup-2026-10-16.md
- PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md
- PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md
- PRD/instructions/receipts/tool-switch-load-delay-2026-10-16.md
- PRD/instructions/receipts/root-playwright-screenshot-hygiene-2026-08-06.md
- PRD/instructions/receipts/rules-test-harness-2026-10-06.md

## Related ideasForLater (citations only)

- PRD/ideasForLater/codebase-cleanup-followups/IDEA.md
- PRD/ideasForLater/codebase-cleanup-followups/evidence/GRAPH-BRIEF-backend-health.md
- PRD/ideasForLater/codebase-cleanup-followups/evidence/FINDINGS-scripts-tooling-tests.md
