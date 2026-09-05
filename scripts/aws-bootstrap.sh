#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

aws_region="${AWS_REGION:-us-east-1}"
account_id="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID must be set (GitHub repo variable or shell export)}"
github_repo="${GITHUB_REPOSITORY:-ChrisMiho/TheJudge}"
app_name="${APP_NAME:-thejudge}"
bucket_name="${AWS_S3_BUCKET:-$app_name-web-$account_id}"
artifact_bucket_name="${AWS_LAMBDA_ARTIFACT_BUCKET:-$app_name-lambda-artifacts-$account_id}"
# Fixed key, overwritten on every run — matches scripts/aws-deploy.sh. (DEC-169)
artifact_s3_key="lambda/lambda.zip"
lambda_name="${AWS_LAMBDA_FUNCTION_NAME:-$app_name-api}"
lambda_role_name="${AWS_LAMBDA_ROLE_NAME:-$app_name-lambda-exec}"
ssm_param_name="${OPENAI_API_KEY_SSM_PARAM:-/thejudge/openai-api-key}"
openai_model="${OPENAI_MODEL:-gpt-4.1-mini}"
openai_timeout_ms="${OPENAI_TIMEOUT_MS:-15000}"
openai_max_retries="${OPENAI_MAX_RETRIES:-2}"
reserved_concurrency="${RESERVED_CONCURRENCY:-5}"
budget_limit_usd="${BUDGET_LIMIT_USD:-5}"
notification_email="${NOTIFICATION_EMAIL:-}"
github_role_name="${AWS_GITHUB_ROLE_NAME:-$app_name-github-deploy}"
distribution_comment="${AWS_CLOUDFRONT_COMMENT:-$app_name-web}"
# The domain players type. Its Route 53 hosted zone must already exist (it does
# when the domain was registered through Route 53). Set FRONTEND_DOMAIN= (empty)
# to run without a custom domain — the app then stays on the CloudFront
# hostname. (DEC-084)
frontend_domain="${FRONTEND_DOMAIN-mtgjude.gg}"
tmp_dir="$repo_root/.tmp/aws-bootstrap"

aws_file_uri() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    path="$(cygpath -w "$path")"
  fi
  printf 'file://%s' "$path"
}

aws_fileb_uri() {
  local path="$1"
  if command -v cygpath >/dev/null 2>&1; then
    path="$(cygpath -w "$path")"
  fi
  printf 'fileb://%s' "$path"
}

mkdir -p "$tmp_dir"

actual_account="$(aws sts get-caller-identity --query Account --output text)"
if [[ "$actual_account" != "$account_id" ]]; then
  echo "AWS CLI is authenticated to account $actual_account, expected $account_id." >&2
  exit 1
fi

if ! aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
  aws s3api create-bucket --bucket "$bucket_name" --region "$aws_region"
fi

aws s3api put-public-access-block \
  --bucket "$bucket_name" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Private staging bucket for the Lambda deploy artifact, in the same region as
# the function. No CloudFront origin — this bucket is never served to
# browsers, only read by `update-function-code --s3-bucket` with the deploy
# role's own credentials. (REQ-165)
if ! aws s3api head-bucket --bucket "$artifact_bucket_name" 2>/dev/null; then
  aws s3api create-bucket --bucket "$artifact_bucket_name" --region "$aws_region"
fi

aws s3api put-public-access-block \
  --bucket "$artifact_bucket_name" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

cat > "$tmp_dir/lambda-trust.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
JSON

if ! aws iam get-role --role-name "$lambda_role_name" >/dev/null 2>&1; then
  aws iam create-role --role-name "$lambda_role_name" --assume-role-policy-document "$(aws_file_uri "$tmp_dir/lambda-trust.json")" >/dev/null
fi

aws iam attach-role-policy \
  --role-name "$lambda_role_name" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  >/dev/null || true

# Least-privilege access to the OpenAI key: read the SSM SecureString and
# decrypt it via the aws/ssm managed key (scoped to the SSM service).
cat > "$tmp_dir/lambda-openai-secret-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:GetParameter",
      "Resource": "arn:aws:ssm:$aws_region:$account_id:parameter$ssm_param_name"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "*",
      "Condition": { "StringEquals": { "kms:ViaService": "ssm.$aws_region.amazonaws.com" } }
    }
  ]
}
JSON

aws iam put-role-policy \
  --role-name "$lambda_role_name" \
  --policy-name "$app_name-openai-secret" \
  --policy-document "$(aws_file_uri "$tmp_dir/lambda-openai-secret-policy.json")"

lambda_role_arn="arn:aws:iam::$account_id:role/$lambda_role_name"

npm run build
artifact_path="$(bash "$repo_root/scripts/package-lambda.sh")"

# Stage the package in S3, then point Lambda at the object instead of uploading
# the zip inline. `--zip-file` base64-encodes the whole archive into the request
# body, which AWS caps around 50MB; the committed data corpus pushes the package
# past that, so the direct upload fails with RequestEntityTooLargeException.
# Reading the object from S3 (`--code S3Bucket=`/`--s3-bucket`) is bounded only by
# Lambda's 250MB unzipped quota — the same path scripts/aws-deploy.sh uses.
# (REQ-165) The artifact bucket is created above, so it exists by here.
aws s3 cp "$artifact_path" "s3://$artifact_bucket_name/$artifact_s3_key" \
  --region "$aws_region" \
  >/dev/null

if ! aws lambda get-function --function-name "$lambda_name" --region "$aws_region" >/dev/null 2>&1; then
  aws lambda create-function \
    --function-name "$lambda_name" \
    --runtime nodejs24.x \
    --architectures arm64 \
    --role "$lambda_role_arn" \
    --handler apps/backend/dist/lambda.handler \
    --code "S3Bucket=$artifact_bucket_name,S3Key=$artifact_s3_key" \
    --timeout 20 \
    --memory-size 512 \
    --environment "Variables={NODE_ENV=production,ASK_AI_PROVIDER=openai,DEBUG_LOGGING=false,LOG_PAYLOADS=false,OPENAI_MODEL=$openai_model,OPENAI_TIMEOUT_MS=$openai_timeout_ms,OPENAI_MAX_RETRIES=$openai_max_retries,OPENAI_API_KEY_SSM_PARAM=$ssm_param_name}" \
    --region "$aws_region" \
    >/dev/null
else
  aws lambda update-function-code \
    --function-name "$lambda_name" \
    --s3-bucket "$artifact_bucket_name" \
    --s3-key "$artifact_s3_key" \
    --region "$aws_region" \
    >/dev/null
fi

aws lambda wait function-updated --function-name "$lambda_name" --region "$aws_region"

# Gap 2 — hard-cap parallel executions so the public Function URL cannot scale
# to runaway compute cost. Excess requests throttle (429) instead of scaling out.
# AWS requires the account's unreserved pool to stay >= 10, so reserving is only
# possible when (account concurrency limit - reserved) >= 10. Brand-new accounts
# ship with a limit of 10, which itself caps parallelism; skip gracefully there.
account_concurrency_limit_raw="$(aws lambda get-account-settings \
  --region "$aws_region" \
  --query 'AccountLimit.ConcurrentExecutions' \
  --output text)"
account_concurrency_limit="${account_concurrency_limit_raw%.*}"
if [[ "$account_concurrency_limit" =~ ^[0-9]+$ ]] \
  && (( account_concurrency_limit - reserved_concurrency >= 10 )); then
  aws lambda put-function-concurrency \
    --function-name "$lambda_name" \
    --reserved-concurrent-executions "$reserved_concurrency" \
    --region "$aws_region" \
    >/dev/null
  echo "Lambda reserved concurrency: $reserved_concurrency"
else
  echo "Skipping reserved concurrency: account concurrency limit ($account_concurrency_limit_raw) is too low to reserve $reserved_concurrency while keeping the required 10 unreserved."
  echo "  The account-wide limit of $account_concurrency_limit_raw is the effective parallelism cap for now."
  echo "  After a Service Quotas increase for Lambda 'Concurrent executions', run:"
  echo "    aws lambda put-function-concurrency --function-name $lambda_name --reserved-concurrent-executions $reserved_concurrency --region $aws_region"
fi

# Gap 2 — cost visibility: a low monthly budget with an email alert. Guarded on
# NOTIFICATION_EMAIL; when unset, print the manual console fallback (no failure).
if [[ -n "$notification_email" ]]; then
  cat > "$tmp_dir/budget.json" <<JSON
{
  "BudgetName": "$app_name-monthly",
  "BudgetLimit": { "Amount": "$budget_limit_usd", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
JSON
  cat > "$tmp_dir/budget-notifications.json" <<JSON
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      { "SubscriptionType": "EMAIL", "Address": "$notification_email" }
    ]
  }
]
JSON
  if aws budgets describe-budget --account-id "$account_id" --budget-name "$app_name-monthly" >/dev/null 2>&1; then
    echo "AWS budget '$app_name-monthly' already exists; leaving it unchanged."
  else
    aws budgets create-budget \
      --account-id "$account_id" \
      --budget "$(aws_file_uri "$tmp_dir/budget.json")" \
      --notifications-with-subscribers "$(aws_file_uri "$tmp_dir/budget-notifications.json")" \
      >/dev/null
    echo "AWS budget '$app_name-monthly' created (\$$budget_limit_usd/mo, alert at 80% -> $notification_email)."
  fi
else
  echo "NOTIFICATION_EMAIL unset: skipping AWS Budgets creation."
  echo "  Manual step: Billing console -> Budgets -> Create budget -> Cost budget,"
  echo "  monthly limit \$$budget_limit_usd, add an email alert at 80% to your address."
fi

if ! aws lambda get-function-url-config --function-name "$lambda_name" --region "$aws_region" >/dev/null 2>&1; then
  aws lambda create-function-url-config \
    --function-name "$lambda_name" \
    --auth-type NONE \
    --region "$aws_region" \
    >/dev/null
fi

aws lambda add-permission \
  --function-name "$lambda_name" \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region "$aws_region" \
  >/dev/null 2>&1 || true

aws lambda add-permission \
  --function-name "$lambda_name" \
  --statement-id FunctionURLInvokeAllowPublicAccess \
  --action lambda:InvokeFunction \
  --principal "*" \
  --invoked-via-function-url \
  --region "$aws_region" \
  >/dev/null 2>&1 || true

oac_id="$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$app_name-oac'].Id | [0]" \
  --output text)"

if [[ "$oac_id" == "None" || -z "$oac_id" ]]; then
  cat > "$tmp_dir/oac.json" <<JSON
{
  "Name": "$app_name-oac",
  "Description": "$app_name S3 origin access control",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
JSON
  oac_id="$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "$(aws_file_uri "$tmp_dir/oac.json")" \
    --query OriginAccessControl.Id \
    --output text)"
fi

distribution_id="$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='$distribution_comment'].Id | [0]" \
  --output text)"

if [[ "$distribution_id" == "None" || -z "$distribution_id" ]]; then
  caller_reference="$app_name-$(date +%s)"
  cat > "$tmp_dir/distribution.json" <<JSON
{
  "CallerReference": "$caller_reference",
  "Comment": "$distribution_comment",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_100",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "$bucket_name-origin",
        "DomainName": "$bucket_name.s3.$aws_region.amazonaws.com",
        "OriginAccessControlId": "$oac_id",
        "S3OriginConfig": { "OriginAccessIdentity": "" }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "$bucket_name-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 0
      }
    ]
  }
}
JSON
  distribution_id="$(aws cloudfront create-distribution \
    --distribution-config "$(aws_file_uri "$tmp_dir/distribution.json")" \
    --query Distribution.Id \
    --output text)"
fi

distribution_arn="arn:aws:cloudfront::$account_id:distribution/$distribution_id"
cat > "$tmp_dir/bucket-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$bucket_name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "$distribution_arn"
        }
      }
    }
  ]
}
JSON

aws s3api put-bucket-policy --bucket "$bucket_name" --policy "$(aws_file_uri "$tmp_dir/bucket-policy.json")"

cloudfront_domain="$(aws cloudfront get-distribution \
  --id "$distribution_id" \
  --query Distribution.DomainName \
  --output text)"
frontend_origin="https://$cloudfront_domain"

# --- Custom domain (DEC-084) ---------------------------------------------
# Players reach the app on $frontend_domain instead of the raw CloudFront
# hostname. Four idempotent steps: an ACM certificate (us-east-1 is the only
# region CloudFront accepts certificates from, whatever $aws_region is),
# its DNS-validation CNAME in Route 53, the alias + certificate on the
# distribution, and A/AAAA alias records pointing the domain at CloudFront.
# aws-deploy.sh then reads the alias back off the distribution to set the
# backend's single allowed origin, so the domain is stored in AWS once.
if [[ -n "$frontend_domain" ]]; then
  hosted_zone_id="$(aws route53 list-hosted-zones-by-name \
    --dns-name "$frontend_domain." \
    --query "HostedZones[?Name=='$frontend_domain.'].Id | [0]" \
    --output text)"
  if [[ "$hosted_zone_id" == "None" || -z "$hosted_zone_id" ]]; then
    echo "No Route 53 hosted zone found for $frontend_domain." >&2
    echo "  Register the domain in Route 53 (or create its hosted zone) first, or run with FRONTEND_DOMAIN= to skip the custom domain." >&2
    exit 1
  fi
  hosted_zone_id="${hosted_zone_id#/hostedzone/}"

  certificate_arn="$(aws acm list-certificates \
    --certificate-statuses ISSUED PENDING_VALIDATION \
    --query "CertificateSummaryList[?DomainName=='$frontend_domain'].CertificateArn | [0]" \
    --output text \
    --region us-east-1)"
  if [[ "$certificate_arn" == "None" || -z "$certificate_arn" ]]; then
    certificate_arn="$(aws acm request-certificate \
      --domain-name "$frontend_domain" \
      --validation-method DNS \
      --query CertificateArn \
      --output text \
      --region us-east-1)"
  fi

  # ACM publishes the validation CNAME a few seconds after the request.
  validation_name=""
  validation_value=""
  for _ in $(seq 1 30); do
    read -r validation_name validation_value < <(aws acm describe-certificate \
      --certificate-arn "$certificate_arn" \
      --query "Certificate.DomainValidationOptions[0].ResourceRecord.[Name,Value]" \
      --output text \
      --region us-east-1)
    if [[ -n "$validation_name" && "$validation_name" != "None" ]]; then
      break
    fi
    sleep 5
  done
  if [[ -z "$validation_name" || "$validation_name" == "None" ]]; then
    echo "ACM did not publish a DNS validation record for $certificate_arn." >&2
    exit 1
  fi

  cat > "$tmp_dir/acm-validation-record.json" <<JSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$validation_name",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{ "Value": "$validation_value" }]
      }
    }
  ]
}
JSON
  aws route53 change-resource-record-sets \
    --hosted-zone-id "$hosted_zone_id" \
    --change-batch "$(aws_file_uri "$tmp_dir/acm-validation-record.json")" \
    >/dev/null

  echo "Waiting for ACM to validate $frontend_domain over DNS (usually a few minutes)..."
  aws acm wait certificate-validated \
    --certificate-arn "$certificate_arn" \
    --region us-east-1

  aws cloudfront get-distribution-config \
    --id "$distribution_id" \
    > "$tmp_dir/distribution-config.json"
  if node "$repo_root/scripts/lib/cloudfront-custom-domain.mjs" check \
    "$tmp_dir/distribution-config.json" "$frontend_domain" "$certificate_arn"; then
    echo "CloudFront distribution already serves $frontend_domain."
  else
    distribution_etag="$(node -p \
      "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).ETag" \
      "$tmp_dir/distribution-config.json")"
    node "$repo_root/scripts/lib/cloudfront-custom-domain.mjs" attach \
      "$tmp_dir/distribution-config.json" "$frontend_domain" "$certificate_arn" \
      > "$tmp_dir/distribution-config-with-domain.json"
    aws cloudfront update-distribution \
      --id "$distribution_id" \
      --if-match "$distribution_etag" \
      --distribution-config "$(aws_file_uri "$tmp_dir/distribution-config-with-domain.json")" \
      >/dev/null
    echo "CloudFront distribution now serves $frontend_domain."
  fi

  # Z2FDTNDATAQYW2 is CloudFront's fixed hosted zone id for alias records.
  cat > "$tmp_dir/route53-alias-records.json" <<JSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$frontend_domain.",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$cloudfront_domain.",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$frontend_domain.",
        "Type": "AAAA",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$cloudfront_domain.",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
JSON
  aws route53 change-resource-record-sets \
    --hosted-zone-id "$hosted_zone_id" \
    --change-batch "$(aws_file_uri "$tmp_dir/route53-alias-records.json")" \
    >/dev/null

  frontend_origin="https://$frontend_domain"
fi

aws lambda update-function-configuration \
  --function-name "$lambda_name" \
  --environment "Variables={NODE_ENV=production,ASK_AI_PROVIDER=openai,DEBUG_LOGGING=false,LOG_PAYLOADS=false,OPENAI_MODEL=$openai_model,OPENAI_TIMEOUT_MS=$openai_timeout_ms,OPENAI_MAX_RETRIES=$openai_max_retries,OPENAI_API_KEY_SSM_PARAM=$ssm_param_name,FRONTEND_ORIGIN=$frontend_origin}" \
  --region "$aws_region" \
  >/dev/null

cat > "$tmp_dir/github-oidc-trust.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$account_id:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$github_repo:ref:refs/heads/main"
        }
      }
    }
  ]
}
JSON

if ! aws iam get-open-id-connect-provider \
  --open-id-connect-provider-arn "arn:aws:iam::$account_id:oidc-provider/token.actions.githubusercontent.com" \
  >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
    >/dev/null
fi

if ! aws iam get-role --role-name "$github_role_name" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name "$github_role_name" \
    --assume-role-policy-document "$(aws_file_uri "$tmp_dir/github-oidc-trust.json")" \
    >/dev/null
else
  aws iam update-assume-role-policy \
    --role-name "$github_role_name" \
    --policy-document "$(aws_file_uri "$tmp_dir/github-oidc-trust.json")"
fi

cat > "$tmp_dir/github-deploy-policy.json" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:GetFunctionUrlConfig",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration"
      ],
      "Resource": "arn:aws:lambda:$aws_region:$account_id:function:$lambda_name"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::$bucket_name"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::$bucket_name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::$artifact_bucket_name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
}
JSON

aws iam put-role-policy \
  --role-name "$github_role_name" \
  --policy-name "$app_name-deploy-policy" \
  --policy-document "$(aws_file_uri "$tmp_dir/github-deploy-policy.json")"

bash "$repo_root/scripts/aws-deploy.sh"

echo "GitHub deploy role: arn:aws:iam::$account_id:role/$github_role_name"
