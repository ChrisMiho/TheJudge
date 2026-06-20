#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

aws_region="${AWS_REGION:-us-east-1}"
account_id="${AWS_ACCOUNT_ID:-979135883660}"
app_name="${APP_NAME:-thejudge}"
bucket_name="${AWS_S3_BUCKET:-$app_name-web-$account_id}"
lambda_name="${AWS_LAMBDA_FUNCTION_NAME:-$app_name-api}"
distribution_comment="${AWS_CLOUDFRONT_COMMENT:-$app_name-web}"

aws_fileb_uri() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    path="$(cygpath -w "$path")"
  fi
  printf 'fileb://%s' "$path"
}

artifact_path="$(bash "$repo_root/scripts/package-lambda.sh")"

aws lambda update-function-code \
  --function-name "$lambda_name" \
  --zip-file "$(aws_fileb_uri "$artifact_path")" \
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
frontend_origin="https://$cloudfront_domain"

aws lambda update-function-configuration \
  --function-name "$lambda_name" \
  --environment "Variables={NODE_ENV=production,ASK_AI_PROVIDER=mock,DEBUG_LOGGING=false,LOG_PAYLOADS=false,FRONTEND_ORIGIN=$frontend_origin}" \
  --region "$aws_region" \
  >/dev/null

aws lambda wait function-updated \
  --function-name "$lambda_name" \
  --region "$aws_region"

(
  cd "$repo_root"
  VITE_API_URL="$api_url" VITE_DEBUG_LOGGING=false npm --workspace apps/frontend run build
  aws s3 sync apps/frontend/dist "s3://$bucket_name" --delete --region "$aws_region"
  aws cloudfront create-invalidation --distribution-id "$distribution_id" --paths "/*" >/dev/null
)

echo "Frontend: $frontend_origin"
echo "API: $api_url"
