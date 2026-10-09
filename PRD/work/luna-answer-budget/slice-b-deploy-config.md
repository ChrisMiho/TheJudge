# Slice B — Deploy config (model, budget, retries, 40-second Lambda limit)

## Status: done

## Goal

The next deploy and any bootstrap re-run set the live function to gpt-6-luna, a 30000 ms budget, 1 retry and a 40-second Lambda limit.

## Requirements

1. `scripts/aws-deploy.sh` lines 29-31: model `gpt-6-luna`, budget `30000`, retries `1`; its existing `update-function-configuration` call (line ~96) also sets `--timeout 40`, so the limit is applied on every deploy.
2. `scripts/aws-bootstrap.sh`: fallbacks at lines 17-19 become `gpt-6-luna`, `30000`, `1`; `create-function --timeout 20` (line ~148) becomes 40; the `update-function-configuration` call (line ~643-647) also sets `--timeout 40`, so a re-run neither downgrades the model nor resets the limit.
3. `docs/aws/deployment.md:36` diagram 'Lambda 1769 MB, 20 s' becomes 40 s; `apps/backend/.env.example` lines 8, 10, 11 (gpt-6-luna, 30000, 1); root `README.md` lines 116-118 (recommended model, overall answer budget, retries default 1 with 0 allowed and retries only inside the budget); `apps/backend/src/providers/README.md` lines 18-19 (same wording).
4. This slice runs NO aws command and makes no live call. Prove the script edits by reading and by the existing script tests (shell syntax check allowed). The post-deploy check (time one tier-3 question, read `providerElapsedMs` in the CloudWatch tail, confirm semantic retrieval not lexical fallback, confirm function config reads 40 s / gpt-6-luna / 30000 / 1) is an owner step for the receipt, not a criterion.

## Acceptance criteria

- [ ] B1: aws-deploy.sh sets OPENAI_MODEL=gpt-6-luna, OPENAI_TIMEOUT_MS=30000, OPENAI_MAX_RETRIES=1 and passes --timeout 40 in its update-function-configuration call
- [ ] B2: aws-bootstrap.sh fallbacks are gpt-6-luna / 30000 / 1, create-function uses --timeout 40, and the update-function-configuration call also passes --timeout 40
- [ ] B3: Both shell scripts pass a syntax check (bash -n) and no aws command was run
- [ ] B4: docs/aws/deployment.md, apps/backend/.env.example, the root README and apps/backend/src/providers/README.md carry the new model, 30000 budget, retries 1 (0 allowed) and 40 s limit
- [ ] B5: No remaining stale deploy default: a grep of scripts, docs, README and .env.example for 'gpt-4.1-mini', '--timeout 20', and '15000' as an OpenAI default returns only history or unrelated hits
- [ ] B6: The script test suite passes

Every deliverable lives outside `PRD/work/` (node 8 deletes the package). No criterion needs a paid run, live provider call or aws command.

## Verification

```bash
bash -n scripts/aws-deploy.sh && bash -n scripts/aws-bootstrap.sh
git grep -n -E 'gpt-4\.1|--timeout 20|15000' -- scripts docs README.md apps/backend/.env.example apps/backend/src/providers/README.md
npm run test:scripts
```

## Files touched

- `scripts/aws-deploy.sh`
- `scripts/aws-bootstrap.sh`
- `docs/aws/deployment.md`
- `apps/backend/.env.example`
- `README.md`
- `apps/backend/src/providers/README.md`
