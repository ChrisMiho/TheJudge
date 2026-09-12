# Slice C — domain-reachability-runbook

## Status: planned

## Goal

Give the owner a written procedure for the part of this problem no code
change touches: getting `mtgjudge.gg` recategorized by corporate filter
vendors, plus the exact commands to tell before from after.

## Requirements

1. New `docs/aws/domain-reachability.md`, linked from `docs/aws/deployment.md`'s
   `See also` list (the line naming `operations.md` and `secrets.md`).
2. Opens with the three buckets, named as such:
   - what the repo ships (REQ-197 headers, REQ-198 static files)
   - what only the owner can do by hand (category lookup, recategorization
     submission, asking IT to allowlist)
   - what only elapsed time resolves (domain age)
3. States explicitly — not by implication — that no change in this
   repository guarantees the site opens at work, and that every claim about
   what moves a filter is a likelihood, never a certainty.
4. Step 0 of the manual checklist: capture the evidence that narrows the
   vendor list — the block page the browser showed, or asking the company's
   IT which secure web gateway they run.
5. The manual checklist names the vendors — Zscaler, Palo Alto Networks,
   Cisco Talos/Umbrella, Fortinet FortiGuard, Netskope, Trellix/McAfee,
   Symantec/Broadcom — and describes each vendor's relevant page by its own
   name ("URL category lookup", "request recategorization") rather than
   pinning a URL that will rot.
6. Carries the runnable verification block with the measured 2026-09-11
   "before" result recorded beside each command, so the owner can tell an
   after-state apart:
   - `curl -sI https://mtgjudge.gg | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'` — before: no output
   - `curl -sI https://mtgjudge.gg/robots.txt | grep -i content-type` — before: `text/html`
   - `curl -sI https://mtgjudge.gg/.well-known/security.txt | grep -i content-type` — before: `text/html`
   - and states plainly that the owner runs these *after* running
     `scripts/aws-bootstrap.sh` and deploying — this package's own build
     cannot run them against the live site.
7. Records the domain's registration date (2026-09-05, Route 53, attached to
   CloudFront the same day) as the age a "newly registered domain" policy is
   measured from.
8. Records the `security.txt` `Expires:` date shipped in slice B and states
   that renewing it before that date is a manual step.
9. Never names a specific vendor as the owner's actual blocker (that
   evidence exists only on the owner's screen) and never proposes automating
   a vendor's recategorization submission (every one is a human web form).

## Acceptance criteria

- [ ] C1 — `docs/aws/domain-reachability.md` exists and is linked from
      `docs/aws/deployment.md`'s `See also` list.
- [ ] C2 — it opens with the three named buckets (repo ships / owner by hand
      / time only), matching `DESIGN-BRIEF.md`'s framing.
- [ ] C3 — it states explicitly that no code change here guarantees the site
      opens at work, and phrases every filter-behavior claim as a
      likelihood.
- [ ] C4 — step 0 of the checklist is capturing the block page or asking IT
      which gateway the company runs.
- [ ] C5 — the checklist names all seven vendors, each described by page
      name rather than a pinned URL.
- [ ] C6 — the runbook carries the three verification commands with the
      measured 2026-09-11 "before" result beside each, and states the owner
      runs them post-deploy (this package cannot run them against the live
      site).
- [ ] C7 — it records 2026-09-05 as the domain's registration/attachment
      date.
- [ ] C8 — it records slice B's `security.txt` `Expires:` date and states
      renewal is a manual step.

## Verification

Manual read-through against the checklist above; no command exercises prose
content. File existence and the doc's presence in `See also` are the only
mechanically checkable parts:

```bash
test -f docs/aws/domain-reachability.md
grep -q "domain-reachability" docs/aws/deployment.md
```

## Files touched

- `docs/aws/domain-reachability.md` (new)
- `docs/aws/deployment.md` (edit — `See also` list only; slice A edits a
  different part of this same file)
