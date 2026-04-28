# secrets-handling.md

## Purpose

These rules define mandatory secret-handling behavior for agents working in this repository.

## Non-Negotiable Rules

- Secrets must never be committed to git or pushed to GitHub under any circumstances.
- All local credential and secret files must live under `.secrets/`.
- Do not place real secrets in `.env`, `.env.example`, PRD docs, story files, screenshots, or commit messages.
- `.env.example` files may contain placeholders only, never real values.

## Required Storage Location

- Store local secret material only in `.secrets/`.
- Use descriptive file names labeled by service and purpose.
- Naming convention:
  - `.secrets/<service>-<purpose>.<ext>`
  - examples:
    - `.secrets/aws-bedrock-dev.env`
    - `.secrets/github-pat-local.txt`
    - `.secrets/dev-backend-credentials.json`

## Human Approval Gate

For any secret-related task, the agent must pause and validate decisions with the user before proceeding.

The agent must request user confirmation before:
- creating or renaming files in `.secrets/`
- choosing secret file naming conventions for new integrations
- changing where credentials are loaded from
- adding or changing secret-related environment variables
- introducing any workflow that touches credential material

## Pre-Commit and PR Safety

Before any commit or push, verify no secret files or values are included:
- ensure `.secrets/` remains ignored by git
- ensure no files from `.secrets/` are staged
- ensure diffs do not contain keys, tokens, private credentials, or copied secret payloads

If any secret exposure is suspected:
- stop immediately
- notify the user
- do not commit or push until the user confirms remediation
