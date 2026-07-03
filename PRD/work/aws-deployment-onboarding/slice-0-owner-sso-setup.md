# Slice 0 — Owner AWS SSO setup (OWNER-RUN, not for agents)

## Status: planned

## Who runs this

**You (the account owner), by hand, in the AWS Console + your terminal.** This slice is *not* handed to an implementation agent — it provisions your personal admin access to the new AWS account, which requires human sign-in and MFA. Every later slice that touches AWS (bootstrap, Slice C SSM, Slice D guardrails, Slice F deploy/verify) assumes the credentials this slice sets up already resolve on your machine.

## Goal

Set up **IAM Identity Center (AWS SSO)** as the way you authenticate the AWS CLI to your new account — short-lived credentials, MFA, no long-lived access keys on disk. End state: `aws sts get-caller-identity` returns your new account's 12-digit ID using an SSO profile, and you know how to re-login when the session expires.

## Why SSO and not access keys

Short-lived tokens that auto-expire + enforced MFA + no permanent secret sitting in `~/.aws/credentials`. This matches the rest of the plan, which is built to keep long-lived AWS keys out of the repo and GitHub (OIDC deploy, Slice B's secret-scan gate). Using SSO locally keeps the same posture on your laptop.

## Prereqs

- New AWS account created; you can sign in to the Console as the **root user** (the email you signed up with).
- AWS CLI v2 installed: `aws --version` should print `aws-cli/2.x`. (macOS: `brew install awscli`.)
- An authenticator app on your phone (e.g. Authy, Google Authenticator, 1Password) for MFA.

## Part 1 — Console setup (one-time)

> Pick **one home region and use it everywhere** in this project. Use **`us-east-1`** (N. Virginia) to match the rest of the gameplan. Set the Console's region selector (top-right) to `us-east-1` before starting.

1. **Enable IAM Identity Center.** Console → search **"IAM Identity Center"** → **Enable**. If it asks about AWS Organizations, accept creating one (it wraps your single account — that's expected and free). Wait for it to finish enabling.
2. **Confirm identity source.** In IAM Identity Center → **Settings**, the *Identity source* should be **"Identity Center directory"** (the built-in default). Leave it — you don't need an external IdP for a solo setup.
3. **Note your portal URL.** On the IAM Identity Center **Dashboard**, copy the **AWS access portal URL** (looks like `https://d-xxxxxxxxxx.awsapps.com/start`). You'll paste this into the CLI in Part 2. (You can optionally customize the subdomain under Settings → but the `d-xxxx` URL is fine.)
4. **Create your user.** Left nav → **Users** → **Add user**.
   - Username: e.g. `chris`
   - Email: your real email (you'll get an invite here)
   - Fill first/last name → **Next** → skip groups → **Add user**.
5. **Create a permission set.** Left nav → **Permission sets** → **Create permission set** → **Predefined** → **AdministratorAccess** → **Next**.
   - (Optional but recommended for convenience) set **Session duration** to `8 hours` so you re-login less often.
   - **Next** → **Create**. *(AdministratorAccess is broad; it's appropriate for the one-time bootstrap. You can create a tighter permission set later — that's a hardening follow-up, not a launch blocker.)*
6. **Assign the user to the account.** Left nav → **AWS accounts** → check the box next to your account → **Assign users or groups** → **Users** tab → select the user from step 4 → **Next** → select the **AdministratorAccess** permission set → **Next** → **Submit**. Wait for provisioning to finish.
7. **Accept the invite + set up MFA.** Open the invite email → **Accept invitation** → set a password → sign in at the portal URL → follow the prompt to **register your MFA device** (scan the QR with your authenticator app). Once in, you should see your account tile with an **AdministratorAccess** role link — that confirms Part 1 worked.

## Part 2 — Wire up the CLI (one-time)

Run in your terminal:

```bash
aws configure sso
```

Answer the prompts:

| Prompt | Answer |
|--------|--------|
| SSO session name | `thejudge` |
| SSO start URL | the portal URL from Part 1 step 3 (`https://d-xxxx.awsapps.com/start`) |
| SSO region | `us-east-1` |
| SSO registration scopes | press Enter to accept the default (`sso:account:access`) |

A browser opens → sign in (with MFA) → **Allow**. Back in the terminal it lists your account and role — pick them, then:

| Prompt | Answer |
|--------|--------|
| CLI default client Region | `us-east-1` |
| CLI default output format | `json` |
| Profile name | `thejudge-admin` |

## Part 3 — Verify + capture the account ID

```bash
export AWS_PROFILE=thejudge-admin          # use this profile in this shell
aws sts get-caller-identity                 # must print your account "Account": "<12 digits>"
```

- The 12-digit **`Account`** value is your **`AWS_ACCOUNT_ID`** — record it. It later goes into the GitHub Actions repo variable `AWS_ACCOUNT_ID` (Slice B) and is passed to the bootstrap/deploy scripts (Slice F). Do **not** commit it to code.
- **Before running any later AWS step**, make sure the profile is active in your shell: `export AWS_PROFILE=thejudge-admin` (the bootstrap/deploy scripts read the default credential chain, so this is how they find your creds).

## Re-login (you'll need this later)

SSO tokens expire (per the session duration you set). When a command fails with an expired-token/SSO error, just:

```bash
aws sso login --profile thejudge-admin
```

## Acceptance criteria

- [ ] IAM Identity Center enabled in `us-east-1`; a user exists with **AdministratorAccess** assigned to the account
- [ ] MFA registered; you can sign in at the portal URL
- [ ] `aws configure sso` completed; profile named `thejudge-admin`
- [ ] `AWS_PROFILE=thejudge-admin aws sts get-caller-identity` returns the new account's 12-digit ID
- [ ] Account ID recorded (for the `AWS_ACCOUNT_ID` repo variable and bootstrap) — **not** committed anywhere

## Hands off to

Slices A–F. Once this passes, the AWS-touching slices (bootstrap, C, D, F) can assume `export AWS_PROFILE=thejudge-admin` gives a working admin credential chain. A/B don't need AWS creds at all.
