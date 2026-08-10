# secrets-handling.md

## Purpose

Mandatory handling of credential material by any agent working in this
repository.

## Non-Negotiable Rules

- Never commit a secret to git. Never push one.
- Never print a secret to a terminal, a log, a screenshot, or a commit message.
- All local credentials live under `.secrets/`, which is git-ignored.
- No real secrets in `.env`, `.env.example`, PRD documents, work packages, or
  captures. `.env.example` contains placeholders only.
- Non-secret configuration may live in `.env`; secret values may not.

## Required Storage Location

    .secrets/<service>-<purpose>.<ext>

Examples:

    .secrets/<service>-dev.env
    .secrets/<service>-token-local.txt

## Human Approval Gate

Ask a human before:

- creating or renaming any file under `.secrets/`
- choosing the secret file naming for a new integration
- changing where credentials are loaded from
- adding or changing a secret-bearing environment variable
- any workflow step that touches credential material

## Pre-Commit and PR Safety

Before staging:

- confirm `.secrets/` is git-ignored
- confirm nothing under `.secrets/` is staged
- scan the diff for keys, tokens, and credentials, including in test fixtures
  and documentation examples

If a secret was committed at any point in history, treat the credential as
compromised and rotate it. Removing the file in a later commit is not enough.
