# Future-infra finding — networking-edge-api

- Concern-area focus: the edge/API surface — Function URL vs. API Gateway, CloudFront+WAF in front of the API, CORS posture, custom domain/ACM — judged against a scale-to-zero, single-Lambda, no-accounts app.
- Reference read: `docs/aws/deployment.md`, `docs/aws/operations.md`, `docs/aws/secrets.md`, `scripts/aws-bootstrap.sh`, `.github/workflows/quality-check.yml` (deploy job), `PRD/sections/system-map.md`, `apps/backend/src/app/createApp.ts`, `apps/backend/src/config/index.ts`, `apps/backend/src/lambda.ts`, `apps/backend/src/routes/askAi.ts`.

## Current state

The SPA is served through CloudFront (`PriceClass_100`, OAC) from a private S3
bucket, `403`/`404` mapped to `index.html` (`scripts/aws-bootstrap.sh:296-334`).
The API has no CDN, no WAF, and no custom domain: it is a bare public **Lambda
Function URL**, `auth-type NONE`, created by
`aws lambda create-function-url-config --auth-type NONE`
(`scripts/aws-bootstrap.sh:227-231`) with an explicit `lambda:InvokeFunctionUrl`
resource policy allowing principal `*` (`scripts/aws-bootstrap.sh:234-250`).
Live URLs today (`docs/aws/deployment.md:152-153`): frontend
`https://d36yuv4ycof5gd.cloudfront.net`, API
`https://24yhnhknx5sc24cvtb7szdz76q0uruif.lambda-url.us-east-1.on.aws`.

The only throttle on the API is Lambda **reserved concurrency**
(`RESERVED_CONCURRENCY`, default `5`, `docs/aws/operations.md:65-80`) — excess
requests get a blunt `429` instead of scaling out. The account currently sits
at the default account-wide concurrency limit of `10`, so bootstrap skips
reserving 5 and the effective cap is the account limit itself
(`docs/aws/deployment.md:155-161`). There is no per-client throttling, no API
key, and no application-level auth on `POST /api/ask-ai`
(`apps/backend/src/routes/askAi.ts` has no auth/rate-limit middleware). The
only cost backstop is a monthly AWS Budget (`thejudge-monthly`, default `$5`,
alert at 80%) — a post-hoc email, not a preventive control
(`docs/aws/operations.md:51-64`). There is no user-account system anywhere in
the product (`PRD/sections/system-map.md` has no auth/login section), so this
is deliberately an anonymous public endpoint, not an oversight to "add login
to."

CORS is already scoped correctly for production. `createApp.ts:35` —
`app.use(cors(options.frontendOrigin ? { origin: options.frontendOrigin } : undefined))`
— and `config/index.ts:43-64` validates `FRONTEND_ORIGIN` as an absolute
`http`/`https` URL. Bootstrap sets it in the Lambda env block to
`FRONTEND_ORIGIN=https://$cloudfront_domain` (`scripts/aws-bootstrap.sh:371`)
— i.e. CORS is pinned to exactly the CloudFront SPA domain, not a wildcard.
The `cors` package's allow-all default only applies when `FRONTEND_ORIGIN` is
unset, which never happens in the deployed env block.

No custom domain exists at all: no Route 53 zone, no ACM cert, no CloudFront
alternate domain name. Both URLs are the raw AWS-issued ones. `VITE_API_URL`
is rebaked into the frontend build on every deploy
(`docs/aws/deployment.md:129`), so the app has no dependency on the Function
URL staying visually stable — nothing else references it by a fixed name.

## Recommendations

### edge-waf-rate-limit — CloudFront + WAF in front of the API — with-rag

**Current -> Target:** No edge exists in front of the API; the only defense
against an abusive client is the global reserved-concurrency cap (5, or 10 at
the account limit today) and an after-the-fact `$5`/mo budget alert. Target:
put the API behind the existing CloudFront distribution (a second origin /
`/api/*` behavior, or its own distribution) with an AWS WAF WebACL carrying a
rate-based rule (e.g. N requests per 5 minutes per IP) plus an AWS Managed
Rules group for basic bot/anonymous-IP filtering.
**Gap:** AWS WAF cannot attach to a Lambda Function URL directly — it only
attaches to CloudFront, ALB, API Gateway, AppSync, Cognito, or App Runner. So
CloudFront in front of the API is a prerequisite for WAF regardless of
whether the compute front door stays a Function URL or moves to API Gateway.
**Services/tradeoff:** CloudFront request cost at this scale is negligible.
AWS WAF is not: a WebACL is ~`$5`/mo base + ~`$1`/mo per rule +
~`$0.60` per million requests evaluated — on the same order as the entire
current `$5`/mo budget, so it roughly doubles baseline AWS spend for an app
that may see near-zero real traffic. No cold-start or scale-to-zero impact —
this is purely an edge addition; Lambda behavior is unchanged. Operational
cost: one more distribution behavior and WebACL to script into
`aws-bootstrap.sh` and keep correct (the cache policy must forward
`Authorization`/`Origin` and disable caching for `POST /api/ask-ai` while
allowing normal caching for `GET /api/health`).
**Risk:** Without it, one scripted client in a tight loop can exhaust the
5-concurrency pool (real players see `429`) and run up OpenAI spend that the
AWS Budget can't see (OpenAI billing is separate — `docs/aws/operations.md:61-63`).
With it, today, the WAF spend outsizes a threat that hasn't materialized at
this app's current traffic. RAG changes that calculus: it raises cost per
request (embeddings + retrieval, possibly a vector-store call), making the
same abuse pattern economically worse, and it is a natural moment to touch
this layer again — bundle the hardening with that work rather than paying for
it standalone now.

### keep-function-url-no-api-gateway — Function URL vs. API Gateway — later

**Current -> Target:** Lambda Function URL, `auth-type NONE`, adapted via
`@codegenie/serverless-express` (`apps/backend/src/lambda.ts:1,17`). Target
considered: migrate to API Gateway (HTTP API, the cheaper of the two
flavors) for native usage plans, API keys, per-route throttling, and WAF
association without CloudFront as a prerequisite.
**Gap:** none of API Gateway's differentiators map to a real need. There is
no second API consumer, no partner integration, and no user-account system to
assign usage plans to (confirmed absent in `PRD/sections/system-map.md`).
HTTP API costs ~`$1.00`/million requests versus Function URL's `$0`
request-layer cost; migrating means reworking the Lambda event-source
handling, rewriting `thejudge-github-deploy`'s IAM policy (currently scoped
to `lambda:GetFunctionUrlConfig` etc., `scripts/aws-bootstrap.sh:419-469`, not
`apigateway:*`), and rewriting the bootstrap script — all for capability this
app has no consumer for.
**Services/tradeoff:** HTTP API Gateway (~`$1`/million requests, ~10-20ms
added latency) vs. REST API Gateway (older, pricier — not warranted here) vs.
staying on Function URL (free, simplest). If `edge-waf-rate-limit` lands,
CloudFront can front the Function URL directly and deliver the one thing API
Gateway would have added (rate limiting) without the migration.
**Risk:** Migrating now is pure churn — new failure surface (event-shape
differences, IAM policy drift) for zero product benefit. Revisit only if a
real second API consumer (a partner, a non-SPA client) needs per-client API
keys — that hasn't happened.

### cors-hygiene-note — CORS posture — later

**Current -> Target:** `FRONTEND_ORIGIN` already pins CORS to the deployed
CloudFront domain in production (`apps/backend/src/app/createApp.ts:35`,
`config/index.ts:43-64`, set at bootstrap in
`scripts/aws-bootstrap.sh:371`) — not a wildcard. No functional change is
needed; target is a documentation/comment note making the production
guarantee explicit so a future config change can't silently reintroduce the
`cors` package's allow-all default (which only applies when
`FRONTEND_ORIGIN` is unset, and today that never happens in the deployed env
block).
**Gap:** none in production. The real residual gap is that CORS is a
browser-only control — it does nothing to stop a non-browser client (`curl`,
a script) from calling the Function URL directly. That gap is covered by
`edge-waf-rate-limit`, not by anything CORS-shaped; don't chase CORS
tightening as if it were an auth boundary.
**Services/tradeoff:** none — this is a one-line code comment, not
infrastructure.
**Risk:** low either way; flagging only so a future refactor doesn't quietly
drop the origin pin and call it equivalent.

### custom-domain-acm — Custom domain + ACM — later

**Current -> Target:** No custom domain anywhere; live URLs are the raw
`*.cloudfront.net` and `*.lambda-url.us-east-1.on.aws` (`docs/aws/deployment.md:152-153`).
Target: a Route 53 hosted zone for a real domain, an ACM certificate
(must be `us-east-1` for CloudFront) covering the apex/`www` and an `api.`
subdomain, a CloudFront alternate domain name for the SPA, and — if
`edge-waf-rate-limit` lands — a second alternate domain name/behavior for
`api.<domain>` proxying to the Function URL.
**Gap:** purely cosmetic/branding. Nothing in the app depends on a stable API
domain today — `VITE_API_URL` is rebaked into the frontend build on every
deploy (`docs/aws/deployment.md:129`), so the raw Function URL is not a
stability problem for the running system.
**Services/tradeoff:** domain registration (~`$12-15`/yr), Route 53 hosted
zone `$0.50`/mo, ACM certificate free. Low one-time setup burden (DNS
validation); no cold-start or scale-to-zero impact.
**Risk:** none technical — only the ongoing small recurring cost of a domain
+ hosted zone for a benefit (professional look) the product doesn't need yet.
Do this alongside a real public launch/marketing push, and bundle it with
`edge-waf-rate-limit` if that CloudFront work is already in flight.

## Open questions

- Does the roadmap include any second API consumer (a mobile app, a partner
  integration) that would justify API Gateway's usage-plan/API-key model?
  That's the only thing that would flip `keep-function-url-no-api-gateway`.
- What will RAG-era retrieval actually cost per request (embeddings, and any
  vector-store round trip)? That number should size how much WAF spend
  (`edge-waf-rate-limit`, ~`$5-10`/mo) is worth relative to the abuse cost it
  prevents — this study can't price that without RAG's design settled.
- Is a domain name already owned/reserved for TheJudge? `custom-domain-acm`
  needs an owner decision on the domain itself before it can be scoped.
