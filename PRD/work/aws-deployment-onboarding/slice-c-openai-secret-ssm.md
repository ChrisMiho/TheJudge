# Slice C — Secure live OpenAI via SSM SecureString + Lambda cold-start read

## Status: done

## Goal

Enable the deployed Lambda to run `ASK_AI_PROVIDER=openai` by reading `OPENAI_API_KEY` from an SSM Parameter Store SecureString **at cold start**, so the key never enters Git, the repo, GitHub, or the Lambda function configuration. Local `dev` is unchanged.

## Requirements

- **Gap 1 (decided: cold-start read).** The Lambda entrypoint performs a one-time async init: read the SSM parameter (path from env, `OPENAI_API_KEY_SSM_PARAM`, default `/thejudge/openai-api-key`) with `WithDecryption=true`, set `process.env.OPENAI_API_KEY`, then build the app via `createConfiguredApp`. The exported `handler` awaits the init promise before delegating to serverless-express.
- SSM logic lives in the **Lambda entrypoint only** (`lambda.ts` + a Lambda-only helper). `apps/backend/src/index.ts`, `createConfiguredApp.ts`, `config/index.ts`, and the provider boundary are **unchanged** — local dev keeps reading the key from `.secrets/openai-dev.env` (DEC-020: credentials backend-only; provider selection stays explicit via `ASK_AI_PROVIDER`).
- `@aws-sdk/client-ssm` is a **devDependency** (provided by the Node 24 Lambda runtime; excluded from the deploy zip by `npm ci --omit=dev`).
- Deploy/bootstrap env blocks set only **non-secrets**: `ASK_AI_PROVIDER=openai`, `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`, `OPENAI_API_KEY_SSM_PARAM` — and never `OPENAI_API_KEY`.
- `aws-bootstrap.sh` grants the Lambda **execution role** an inline policy: `ssm:GetParameter` on the parameter ARN and `kms:Decrypt` on the `aws/ssm` managed key.
- The SSM parameter value is set out-of-band by the owner (documented in Slice E); no key material in any script.

## Files touched

- `apps/backend/src/lambda.ts` (async init + awaited handler)
- `apps/backend/src/runtime/loadOpenAiKeyFromSsm.ts` (new Lambda-only helper)
- `apps/backend/src/runtime/loadOpenAiKeyFromSsm.test.ts` (new)
- `apps/backend/package.json` (`@aws-sdk/client-ssm` as devDependency)
- `scripts/aws-bootstrap.sh` (Lambda-role IAM policy + non-secret env block)
- `scripts/aws-deploy.sh` (non-secret env block)

## Changes

### `loadOpenAiKeyFromSsm.ts`

Exports `async function loadOpenAiKeyFromSsm(env): Promise<void>` — when `env.ASK_AI_PROVIDER === "openai"` and `env.OPENAI_API_KEY` is not already set, read `env.OPENAI_API_KEY_SSM_PARAM` via `SSMClient.getParameter({ Name, WithDecryption: true })`, set `process.env.OPENAI_API_KEY`, and throw a clear error if the parameter is missing/empty. No-op for `mock`.

### `lambda.ts`

```ts
const init = (async () => {
  await loadOpenAiKeyFromSsm(process.env);
  const backendDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(backendDir, "../../..");
  const runtime = createConfiguredApp(repoRoot, process.env);
  return serverlessExpress({ app: runtime.app });
})();

export const handler = async (event, context) => (await init)(event, context);
```

### `scripts/aws-bootstrap.sh`

- Add inline policy to `$lambda_role_name`: `ssm:GetParameter` on `arn:aws:ssm:$aws_region:$account_id:parameter/thejudge/openai-api-key` and `kms:Decrypt` on the `aws/ssm` key.
- Update the Lambda env block to include `ASK_AI_PROVIDER=openai`, `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`, `OPENAI_API_KEY_SSM_PARAM=/thejudge/openai-api-key` (no `OPENAI_API_KEY`).

### `scripts/aws-deploy.sh`

- Mirror the same non-secret env block (currently hardcodes `ASK_AI_PROVIDER=mock`).

## Acceptance criteria

- [x] `loadOpenAiKeyFromSsm` unit test (mocked `SSMClient`) sets `OPENAI_API_KEY` for `openai`, no-ops for `mock`, throws a clear error on missing/empty parameter, defaults the path, and skips when a key is already present (5 tests)
- [x] `handler` awaits init before handling a request (`lambda.ts`: `const configured = await init; return configured(...args)`)
- [x] `apps/backend/src/index.ts`, `createConfiguredApp.ts`, `config/index.ts`, and provider files are unchanged by this slice (git status scope check)
- [x] `@aws-sdk/client-ssm` is under `devDependencies` (`^3.1079.0`); after `scripts/package-lambda.sh`, `.tmp/lambda-package/node_modules/@aws-sdk/client-ssm` is **absent**
- [x] AWS scripts/workflow carry only `OPENAI_API_KEY_SSM_PARAM`, no bare `OPENAI_API_KEY=` env block or key value (pre-existing local-dev `openai-verify-credentials.mjs` mentions `OPENAI_API_KEY` for `.secrets` validation only — out of scope)
- [x] `aws-bootstrap.sh` policy JSON grants `ssm:GetParameter` + `kms:Decrypt` (KMS scoped via `kms:ViaService=ssm.<region>.amazonaws.com`)
- [x] `npm run quality:check` green (582 tests)

## Verification

```bash
cd apps/backend && npm run quality:check && cd ../..
bash scripts/package-lambda.sh >/dev/null
test ! -d .tmp/lambda-package/node_modules/@aws-sdk/client-ssm && echo "OK: sdk not bundled"
grep -rn "OPENAI_API_KEY=" scripts/ && echo "FAIL: key in env block" || echo "OK: no key env"
grep -n "ssm:GetParameter\|kms:Decrypt" scripts/aws-bootstrap.sh
```
