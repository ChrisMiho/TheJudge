# Deployment decisions

Production hosting, deployment automation, secrets, and operational guardrails.

### DEC-084
- Decision: Production uses a lightweight AWS serverless deployment: the frontend is a private S3 origin behind CloudFront, the backend is Lambda behind a public Function URL, and the app uses the AWS-provided URLs without a custom domain. Production runs the OpenAI provider; Lambda loads `OPENAI_API_KEY` from an SSM SecureString at cold start. Pushes to `main` deploy through a quality-gated GitHub Actions workflow using AWS OIDC rather than static AWS credentials.
- Status: confirmed
- Context: The validated product needed a first inexpensive production deployment without introducing an infrastructure-as-code migration, secret exposure, unbounded Lambda scale, or an untested automatic deploy path.
- Impact:
  - `scripts/aws-bootstrap.sh`, `scripts/aws-deploy.sh`, and `scripts/package-lambda.sh` remain the deployment mechanism; CDK/Terraform and a custom domain are deferred
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
