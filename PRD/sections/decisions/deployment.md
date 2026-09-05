# Deployment decisions

Production hosting, deployment automation, secrets, and operational guardrails.

### DEC-084
- Decision: Production uses a lightweight AWS serverless deployment: the frontend is a private S3 origin behind CloudFront, reached by players at the custom domain `https://mtgjudge.gg` (an ACM certificate and alias on the distribution, Route 53 alias records, all attached idempotently by the bootstrap), with `www.mtgjudge.gg` and the raw CloudFront hostname answering a permanent redirect to it through a CloudFront Function; the backend is Lambda behind a public Function URL on its AWS-provided address. The backend's single allowed browser origin follows the domain: every deploy reads the alias back off the live distribution, falling back to the CloudFront hostname when none is attached, so the domain is stored in AWS once. Production runs the OpenAI provider; Lambda loads `OPENAI_API_KEY` from an SSM SecureString at cold start. Pushes to `main` deploy through a quality-gated GitHub Actions workflow using AWS OIDC rather than static AWS credentials.
- Status: confirmed
- Context: The validated product needed a first inexpensive production deployment without introducing an infrastructure-as-code migration, secret exposure, unbounded Lambda scale, or an untested automatic deploy path.
- Impact:
  - `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, and `scripts/package-lambda.sh` remain the deployment mechanism; CDK/Terraform is deferred
  - the bare apex is the one canonical address: the backend allows one origin, so `www.mtgjudge.gg` (and the old CloudFront URL) redirect to it rather than serving the app; the certificate is free (ACM) and the hosted zone is the only recurring cost
  - `scripts/frontend-origin-source.test.mjs` pins both scripts to the origin-from-alias rule pre-merge, because both rewrite `FRONTEND_ORIGIN` unconditionally and a hand-set value is clobbered by the next deploy
  - Lambda configuration carries only non-secret provider settings and the SSM parameter path; the OpenAI key remains backend-only and outside Git, GitHub, and Lambda environment configuration
  - the deploy workflow runs `npm run quality:check` before assuming the scoped AWS deploy role and deploying
  - Lambda reserved concurrency is set when the account quota permits; otherwise the account concurrency limit is the effective cap until quota increases
  - AWS Budgets provides a low monthly alert, and prepaid OpenAI credits remain the AI-side cost backstop
  - product API, prompt, stack ordering, and local mock-default behavior are unchanged
- Related requirements:
  - GOAL-003
  - NFR-003
  - NFR-004
- Notes:
  - Operational commands and current architecture details live in `docs/aws/`
  - Refines DEC-080's lifecycle status from approaching first deployment to operating it; DEC-080's product framing and scope guardrails remain confirmed
  - Deploy upload mechanism amended by DEC-169 (S3-staged artifact); every other guarantee here stands
  - 2026-09-05: the original "AWS-provided URLs without a custom domain" clause was edited in place when `mtgjudge.gg` (registered in Route 53 that day) was attached; the operational steps live in `docs/aws/deployment.md` ("Custom domain")

### DEC-169
- Decision: The backend Lambda deploys via an S3-staged artifact rather than a direct `--zip-file` upload. `scripts/aws-deploy.sh` uploads `dist/lambda.zip` to a new private artifact bucket (`<app>-lambda-artifacts-<account>`, created by `scripts/aws-bootstrap.sh`, same region as the function) under a fixed overwritten key, then calls `aws lambda update-function-code --s3-bucket/--s3-key`. This lifts the effective package ceiling from AWS's ~50 MB direct-upload zip limit to the 250 MB unzipped deployment-package quota. `scripts/package-lambda.sh` is unchanged.
- Status: confirmed
- Context: The committed Commander Spellbook combo artifacts (DEC-162) grow with the upstream corpus. Direct `--zip-file` upload is capped at a 70,167,211-byte request; because `--zip-file` base64-encodes the archive, the real zip ceiling is ~50 MB. On 2026-08-22 a combo refresh pushed the artifacts past it and `deploy` failed on every push to `main` for two days. The constraint is deploy-artifact size, not runtime memory (the Lambda already reads combo data positionally and never loads it whole) and not a request payload, so neither a second Lambda nor a memory change would resolve it; trimming the corpus (`MIN_VARIANT_POPULARITY`) is a tourniquet that fails again on the next refresh.
- Impact:
  - `scripts/aws-bootstrap.sh` creates a new private artifact bucket; `scripts/aws-deploy.sh` swaps the single `update-function-code --zip-file` call for an `s3 cp` plus `update-function-code --s3-bucket/--s3-key`
  - the GitHub OIDC deploy role gains `s3:PutObject` scoped to the artifact bucket; `update-function-code --s3-bucket` reads the object with the caller's credentials, so no bucket policy or Lambda-side grant is added
  - `scripts/lambda-package-budget.test.mjs` is rewritten to measure the unzipped on-disk package footprint against the 250 MB quota (with a reserve), replacing the base64/request-limit math that only described the direct-upload path
  - the fix keeps one Lambda (DEC-084, NFR-004) and 512 MB runtime memory; combo build and `MIN_VARIANT_POPULARITY` are untouched
  - rollback relies on Lambda's own function-version history; the artifact bucket uses a fixed overwritten key with no S3-side history and no lifecycle rule
- Related requirements:
  - DEC-084
  - REQ-165
  - NFR-017
  - NFR-004
- Notes:
  - Amends DEC-084's deploy upload mechanism only; DEC-084's one-Lambda / Function URL / OIDC-gated / SSM-secret / cost-guardrail guarantees remain confirmed
  - Operational detail for the new bucket and IAM grant lives in `docs/aws/`
