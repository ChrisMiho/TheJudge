#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

aws_region="${AWS_REGION:-us-east-1}"
account_id="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID must be set (GitHub repo variable or shell export)}"
app_name="${APP_NAME:-thejudge}"
bucket_name="${AWS_S3_BUCKET:-$app_name-web-$account_id}"
artifact_bucket_name="${AWS_LAMBDA_ARTIFACT_BUCKET:-$app_name-lambda-artifacts-$account_id}"
lambda_name="${AWS_LAMBDA_FUNCTION_NAME:-$app_name-api}"
distribution_comment="${AWS_CLOUDFRONT_COMMENT:-$app_name-web}"

# Fixed key, overwritten on every deploy. No per-deploy history object,
# versioning, or lifecycle rule — the artifact only needs to outlive the
# single `update-function-code` call that reads it. (DEC-169)
artifact_s3_key="lambda/lambda.zip"

# Resolved here, before packaging or any AWS call, so a missing value fails the
# deploy rather than silently shipping a frontend with feedback disabled. This
# script runs its own frontend build below, so the value must reach *this*
# process — scoping it to the workflow's earlier "Build project" step sends it
# to an artifact that never reaches S3.
feedback_formspree_id="${VITE_FEEDBACK_FORMSPREE_ID:?VITE_FEEDBACK_FORMSPREE_ID must be set (GitHub repository variable)}"

# Non-secret Lambda config. Plain literals, no shell env indirection: to change
# the model (or timeout/retries), edit these values and push — the change
# ships with the deploy that touches them, and `git blame` shows who/why.
openai_model="gpt-4.1"
openai_timeout_ms="15000"
openai_max_retries="2"
openai_api_key_ssm_param="/thejudge/openai-api-key"

artifact_path="$(bash "$repo_root/scripts/package-lambda.sh")"

# Stage in S3 first, then point Lambda at the object instead of uploading the
# zip inline. `update-function-code --zip-file` base64-encodes the whole
# archive into the request body, which AWS's request-size limit effectively
# caps at ~50MB; `--s3-bucket`/`--s3-key` reads the object directly and is
# bounded only by Lambda's 250MB unzipped deployment-package quota. (REQ-165)
aws s3 cp "$artifact_path" "s3://$artifact_bucket_name/$artifact_s3_key" \
  --region "$aws_region" \
  >/dev/null

aws lambda update-function-code \
  --function-name "$lambda_name" \
  --s3-bucket "$artifact_bucket_name" \
  --s3-key "$artifact_s3_key" \
  --region "$aws_region" \
  >/dev/null

aws lambda wait function-updated \
  --function-name "$lambda_name" \
  --region "$aws_region"

api_url="$(aws lambda get-function-url-config \
  --function-name "$lambda_name" \
  --query FunctionUrl \
  --output text \
  --region "$aws_region")"
api_url="${api_url%/}"

distribution_id="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='$distribution_comment'].Id | [0]" \
  --output text)"

if [[ "$distribution_id" == "None" || -z "$distribution_id" ]]; then
  echo "Could not find CloudFront distribution with comment '$distribution_comment'." >&2
  exit 1
fi

cloudfront_domain="$(aws cloudfront get-distribution \
  --id "$distribution_id" \
  --query Distribution.DomainName \
  --output text)"

# The backend allows exactly one browser origin (FRONTEND_ORIGIN -> CORS), so
# it must be the domain players actually type. The live distribution is the
# single source of truth for that: whatever alias aws-bootstrap.sh attached
# (DEC-084) wins, and a distribution with no alias falls back to its
# *.cloudfront.net hostname. No second copy of the domain lives here, so the
# deploy can never disagree with what CloudFront serves.
frontend_alias="$(aws cloudfront get-distribution \
  --id "$distribution_id" \
  --query "Distribution.DistributionConfig.Aliases.Items[0]" \
  --output text)"
if [[ "$frontend_alias" == "None" || -z "$frontend_alias" ]]; then
  frontend_origin="https://$cloudfront_domain"
else
  frontend_origin="https://$frontend_alias"
fi

aws lambda update-function-configuration \
  --function-name "$lambda_name" \
  --environment "Variables={NODE_ENV=production,ASK_AI_PROVIDER=openai,DEBUG_LOGGING=false,LOG_PAYLOADS=false,OPENAI_MODEL=$openai_model,OPENAI_TIMEOUT_MS=$openai_timeout_ms,OPENAI_MAX_RETRIES=$openai_max_retries,OPENAI_API_KEY_SSM_PARAM=$openai_api_key_ssm_param,FRONTEND_ORIGIN=$frontend_origin}" \
  --region "$aws_region" \
  >/dev/null

aws lambda wait function-updated \
  --function-name "$lambda_name" \
  --region "$aws_region"

(
  cd "$repo_root"
  VITE_API_URL="$api_url" \
    VITE_DEBUG_LOGGING=false \
    VITE_FEEDBACK_FORMSPREE_ID="$feedback_formspree_id" \
    npm --workspace apps/frontend run build
  aws s3 sync apps/frontend/dist "s3://$bucket_name" --delete --region "$aws_region"
  aws cloudfront create-invalidation --distribution-id "$distribution_id" --paths "/*" >/dev/null
)

echo "Frontend: $frontend_origin"
echo "API: $api_url"
