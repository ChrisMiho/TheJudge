# AWS Secrets & Identity

What may live in Git, how the OpenAI key is stored, and why GitHub needs **no**
static AWS credentials.

See also: [deployment.md](./deployment.md) and [operations.md](./operations.md).

## What may live in Git vs. not

| Value                                | Where it lives                                  | In Git? |
| ------------------------------------ | ----------------------------------------------- | ------- |
| `OPENAI_API_KEY`                     | SSM Parameter Store SecureString (KMS)          | **No**  |
| AWS account ID                       | GitHub Actions repo variable `AWS_ACCOUNT_ID`   | **No**  |
| Non-secrets (`ASK_AI_PROVIDER=openai`, `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `OPENAI_MAX_RETRIES`, `OPENAI_API_KEY_SSM_PARAM`, `NODE_ENV`, `FRONTEND_ORIGIN`, logging flags) | Lambda function env block (set by the scripts) | Yes (script literals; no secret values) |
| Parameter **path** `/thejudge/openai-api-key` | Scripts + this doc                     | Yes (a name, not a value) |

Rule of thumb: the scripts and Lambda env carry only **names and non-secrets**.
No key material and no account-ID literal is ever committed. (Local development
is unaffected: `dev` reads the key from `.secrets/openai-dev.env`, which is
git-ignored — see the root README.)

## The OpenAI key: SSM SecureString + cold-start read

The key is stored as an encrypted SSM `SecureString` (KMS key `aws/ssm`), and the
Lambda reads it **once per container at cold start** and places it on
`process.env.OPENAI_API_KEY` before the app is built. This means:

- The key never enters Git, the repo, GitHub, or the Lambda **function
  configuration** (only the parameter path travels via env).
- Redeploys never touch or clobber the key — they only rewrite the non-secret
  env block.

Set or rotate the value:

```bash
aws ssm put-parameter \
  --name /thejudge/openai-api-key \
  --type SecureString \
  --value <your-openai-key> \
  --overwrite \
  --region us-east-1
```

The Lambda execution role (`thejudge-lambda-exec`) is granted least-privilege
access via an inline policy (`thejudge-openai-secret`): `ssm:GetParameter` on the
parameter ARN and `kms:Decrypt` scoped to the SSM service
(`kms:ViaService = ssm.us-east-1.amazonaws.com`). The GitHub deploy role gets
**no** key access.

If the parameter is missing or empty when the Lambda starts with
`ASK_AI_PROVIDER=openai`, cold-start init throws a clear error — set the value
before deploying live.

## Why GitHub needs no AWS keys (OIDC)

GitHub Actions authenticates to AWS via **OIDC federation**, not stored access
keys. The bootstrap creates:

- A GitHub OIDC identity provider (`token.actions.githubusercontent.com`).
- A deploy role (`thejudge-github-deploy`) whose trust policy only allows this
  repository's workflows to assume it, and whose permission policy
  (`thejudge-deploy-policy`) is scoped to exactly what a deploy needs:
  `lambda:UpdateFunctionCode/Configuration` + `GetFunction`/`GetFunctionUrlConfig`
  on `thejudge-api`, S3 read/write on the frontend bucket, and CloudFront
  invalidation.

At deploy time the workflow calls `aws-actions/configure-aws-credentials` to
assume that role for short-lived credentials. There are **no** long-lived AWS
secrets in GitHub.

## Required GitHub Actions repository variable

Set one repository **variable** (not a secret) so the account ID stays out of
committed files:

- **Name:** `AWS_ACCOUNT_ID`
- **Value:** your 12-digit AWS account ID
- **Where:** GitHub -> Settings -> Secrets and variables -> Actions -> Variables

`deploy-aws.yml` reads `${{ vars.AWS_ACCOUNT_ID }}` and builds the role ARN and
S3 bucket name from it. The scripts fail fast if `AWS_ACCOUNT_ID` is unset.
