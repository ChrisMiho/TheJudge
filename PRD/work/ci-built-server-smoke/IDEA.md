# Idea: ci-built-server-smoke

Owner request, verbatim:

> Add a CI check that starts the built backend and calls /api/health plus one card lookup, so every PR proves the build boots

## What it means for a player

A pull request whose built backend would fail to start, or would start but fail to answer a card lookup, is caught before it can be merged and deployed. Players never get a site whose card lookups are down because of a broken build.

## Problem and outcome

Today a build that compiles and passes tests can still fail to boot once deployed. The outcome is a CI check on every PR that starts the built backend, calls the health endpoint, and looks up one card.

## Non-goals

No change to what players see or to any product behavior. No change to the deploy process itself.

## Open questions for refinement

- Which single card is the lookup, and where does the CI run get its card data (the full corpus is large and not committed)?
- Does the check need the rule-search model or embedder, or only the health endpoint and one card route?
- Should a failure block merge (required check) or only warn?
- Does the check run on every PR or only PRs touching backend or data paths?

## Related material

- `PRD/ideasForLater/codebase-cleanup-followups/evidence/FINDINGS-backend-scripts-and-august-audit.md` (mentions a built-server smoke test)
- `PRD/ideasForLater/codebase-cleanup-followups/evidence/GRAPH-BRIEF-backend-health.md` (mentions a built-server smoke test)

## Prior run: `PRD/instructions/receipts/codebase-cleanup-pass-2026-10-18.md`

## Prior run: `PRD/instructions/receipts/ci-warnings-cleanup-2026-10-16.md`

## Prior run: `PRD/instructions/receipts/trade-balancer-first-card-ux-2026-09-10.md`

## Prior run: `PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md`

## Prior run: `PRD/instructions/receipts/aws-deployment-onboarding-2026-07-03.md`
