---
name: aws-deployment-onboarding
description: Adopt and harden the cousin's AWS serverless deployment, then ship durable operator docs for running TheJudge live on OpenAI
metadata:
  type: project
---

TheJudge is validated past MVP and ready for a first production deployment, but there is no deployment path in `main` yet. A collaborator's `aws_web_app` branch provides a strong, cheap serverless foundation (Lambda + Function URL backend, private S3 + CloudFront frontend, GitHub Actions deploy via OIDC), but it launches in mock mode and is missing three things a live-OpenAI, publicly-reachable deployment needs: secure `OPENAI_API_KEY` handling, cost/scale guardrails, and a test gate before auto-deploy.

Outcome: adopt the collaborator's branch, close the three gaps, and go live on the AWS-provided URLs (no custom domain yet) running the real OpenAI provider — with durable operator documentation so the owner can deploy, monitor, rotate secrets, and control cost on an ongoing basis.

Non-goals: no custom domain or ACM certificate yet (use the CloudFront and Function URL default URLs); no Infrastructure-as-Code migration (CDK/Terraform) — the collaborator's idempotent bash scripts are appropriate at this scale; no changes to product behavior, prompt logic, or the API contract.
