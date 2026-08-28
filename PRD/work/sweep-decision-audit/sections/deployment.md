# Sweep finding — deployment
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/deployment.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 2

## DEC-084 — not-absorbed
The confirmed serverless architecture (S3+CloudFront frontend, Lambda Function URL backend, no custom domain), the SSM-secret/OIDC-deploy guardrails, and the AWS Budgets/OpenAI-credits cost backstop appear in none of the 7 feature specs; the only trace is shared-chrome/README.md's incidental note that CloudFront maps 403/404 to `/index.html` (a client-routing fact, not the hosting-architecture decision), so the decision's actual substance is missing — expected, since the decision itself says operational/architecture detail lives in `docs/aws/`, not the product specs.

## DEC-169 — not-absorbed
The S3-staged Lambda deploy-artifact mechanism (new artifact bucket, `update-function-code --s3-bucket/--s3-key`, the 250 MB unzipped ceiling, the OIDC role's added `s3:PutObject` scope) is pure deploy-pipeline mechanics with no mention in any of the 7 specs — none of them touch deployment, packaging, or CI, so there is nothing for this decision to have landed in.
