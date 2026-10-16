# Gameplan — ci-warnings-cleanup

Players see nothing different. The Quality Check run on GitHub should come back with no warnings and no notices.

## Architecture

Two independent changes, no shared files:

- Slice A edits one file, `.github/workflows/quality-check.yml`: action majors and runner labels.
- Slice B edits frontend/backend source: splits mixed files for fast refresh, one ref in `ConversationThread.tsx`, three deleted comments.

## Data flow

None changes. Contexts keep one `createContext` call each; providers and hooks import the same object from the new sibling file. The scroll effect keeps its trigger (`[messages.length]`) and reads the current render's function through a ref.

## Order

A and B are parallel-ready. Suggested order: B then A, or either; A's workflow edit triggers a deploy on merge, so the merge itself exercises the new deploy job.

## Verification checklist

- [ ] `npm run lint` prints 0 problems (B)
- [ ] `npm run quality:check` passes, no test assertion edited (B)
- [ ] Workflow has no `@v4`, exact pins, six `ubuntu-24.04` (A)
- [ ] PR Quality Check run: zero annotations on every job that runs (A, manual, on the PR)

## Post-merge reading

Owner-run, after merge (a reading, not a gate; `changes` and `deploy` never run on a PR, so the build cannot earn it): the `main` run's `changes` and `deploy` jobs succeed with zero annotations, and one live question is answered with the embedder loaded (CloudWatch shows no lexical-fallback WARN), the usual native-chain check after a deploy.

## Non-goals

No new lint rule, no `--max-warnings 0`, no Ubuntu 26.04 move, no Dependabot config (offered follow-ups, not in scope). No node-version, job-graph, shard, or deploy-script change.
