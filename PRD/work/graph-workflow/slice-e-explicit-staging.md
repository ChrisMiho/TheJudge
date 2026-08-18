# Slice E — Explicit staging: `git add -A` is denied

## Status: planned

Scope item 11. Depends on: **D** (same file — `.claude/graph-profile.json`).

## Goal

The command that committed the 2026-08-17 leak cannot run in a profiled session,
and the rule exists somewhere other than convention.

## Requirements

1. `HANDOFF.md:46-48`: the leak was contaminated by a rep, then **committed** by
   `git add -A PRD/` during an unrelated cleanup. That second failure has no rule
   anywhere — the profile allows `Bash(git add *)` unconditionally
   (`.claude/graph-profile.json:10`), and no `## Boundaries` entry mentions
   staging. `reference.md:77-85` lists explicit publish paths, which is
   convention, and convention is the instrument this work replaces.
2. Profile denies `Bash(git add -A*)`, `Bash(git add --all*)`,
   `Bash(git add .)`, and `Bash(git add . *)`.
3. `graph-workflow-contract.md` `## Boundaries` gains: a graph run stages
   explicit paths, never `-A`, `--all`, or `.` — **with the incident named as the
   reason**, in the same spirit as the rest of that list.
4. Path-scoped `git add <path>` stays broadly allowed. This narrows the wildcard,
   not the operation.

## Acceptance criteria

- [ ] Under `claude --settings .claude/graph-profile.json`, `git add -A` is
      refused; record the refusal text as evidence
- [ ] Under the same profile, `git add .` is refused
- [ ] Under the same profile, `git add PRD/work/<slug>/README.md` **succeeds** —
      the narrowing did not break path-scoped staging
- [ ] `.claude/graph-profile.json` still parses
- [ ] `graph-workflow-contract.md` `## Boundaries` carries the staging rule and
      names the 2026-08-17 incident as its reason
- [ ] `npm run quality:check` green

## Verification

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/graph-profile.json','utf8')); console.log('ok')"
grep -n '"Bash(git add' .claude/graph-profile.json
git grep -n 'git add' PRD/instructions/graph-workflow-contract.md
npm run quality:check
```

Profile refusals are observed in a session launched with `--settings`; record the
three observations (two refusals, one success) as slice evidence.

## Files touched

- `.claude/graph-profile.json`
- `PRD/instructions/graph-workflow-contract.md`
