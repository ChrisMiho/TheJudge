# Feedback Deployment Configuration Design

## Problem

The production workflow exposes `VITE_FEEDBACK_FORMSPREE_ID` only to its
pre-deploy build step. `scripts/aws-deploy.sh` later rebuilds the frontend
without that variable and uploads the replacement artifact to S3, so the live
bundle enters the intentionally unconfigured feedback state.

## Design

Keep `scripts/aws-deploy.sh` as the authoritative producer of the frontend
artifact uploaded to S3. Expose the GitHub repository variable to the workflow's
`Deploy` step, then have the script validate that the variable is non-empty and
forward it alongside `VITE_API_URL` and `VITE_DEBUG_LOGGING` to the frontend
build command.

The earlier root `Build project` step does not produce the deployed frontend
artifact, so it does not need the feedback variable. Keeping the variable scoped
to `Deploy` prevents it from leaking into the quality gate while making the
configuration available exactly where the production artifact is created.

## Data Flow

1. GitHub resolves the repository variable `VITE_FEEDBACK_FORMSPREE_ID`.
2. The workflow exposes it only to the `Deploy` step.
3. `scripts/aws-deploy.sh` rejects an unset or empty value before changing AWS.
4. The script passes the value into the Vite frontend build.
5. Vite embeds the public Formspree form ID in the static JavaScript bundle.
6. The script syncs that configured bundle to S3 and invalidates CloudFront.

## Failure Handling

A production deploy with a missing feedback form ID must fail before Lambda,
S3, or CloudFront mutations begin. The error should identify
`VITE_FEEDBACK_FORMSPREE_ID` as required deployment configuration. This is
appropriate because production feedback delivery is an enabled, shipped
capability; silently uploading the graceful-no-op build would recreate the
incident.

## Regression Coverage

Add a focused static deployment-contract test that executes without AWS access
and verifies:

- the workflow passes the repository variable to the `Deploy` step;
- the deploy script requires a non-empty value; and
- the actual frontend build command receives the value.

The test must fail against the current pipeline and pass only after the workflow
and script are corrected. Run the focused test first, then the repository's
canonical quality gate.

## Scope

No Formspree ID value is committed, no backend or Lambda contract changes, no
AWS deployment is triggered, and no unrelated build-pipeline refactor is
included.
