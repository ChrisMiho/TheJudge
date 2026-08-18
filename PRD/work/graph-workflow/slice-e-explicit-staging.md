# Slice E — Explicit staging: `git add -A` is denied

## Status: done

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

- [x] Under `claude --settings .claude/graph-profile.json`, `git add -A` is
      refused; record the refusal text as evidence
- [x] Under the same profile, `git add .` is refused
- [x] Under the same profile, `git add PRD/work/<slug>/README.md` **succeeds** —
      the narrowing did not break path-scoped staging
- [x] `.claude/graph-profile.json` still parses
- [x] `graph-workflow-contract.md` `## Boundaries` carries the staging rule and
      names the 2026-08-17 incident as its reason
- [x] `npm run quality:check` green

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

## Result

Four denies added to `.claude/graph-profile.json`: `Bash(git add -A*)`,
`Bash(git add --all*)`, `Bash(git add .)`, `Bash(git add . *)`. The allow
`Bash(git add *)` is untouched, so path-scoped staging is unchanged — this
narrows the wildcard, not the operation.

### Measured under `claude --settings .claude/graph-profile.json`

Run in an isolated scratch repository carrying a copy of the profile, a
`PRD/work/demo/README.md`, and a stray untracked file, so a wildcard that got
through would have had something to sweep up.

| Command | Result | Text |
| --- | --- | --- |
| `git add -A` | **denied** | `Permission to use Bash with command git add -A has been denied.` |
| `git add .` | **denied** | `Permission to use Bash with command git add . has been denied.` |
| `git add PRD/work/demo/README.md` | **allowed** | completed with no output |

`git status --porcelain` afterwards showed `A  PRD/work/demo/README.md` with
`.claude/` and `stray.txt` still untracked — the narrowing works and the
path-scoped path still stages. The session reported attempting no workaround for
the two denials. The scratch repository is removed.

### One `git add -A` survives, and it is stated rather than hidden

`scripts/graph-preflight.mjs:204` emits `git add -A` for node 1's auto-commit
and executes it through `execFileSync`, so the Bash deny never sees it. Left
in place deliberately — auto-commit exists to capture a whole dirty tree — but
recorded in `graph-workflow-contract.md` alongside the boundary, with the bounds
that make it safe: a tested classification (at or below 10 changed files and 200
changed lines), a `--dry-run` preview of every planned command, and the secret
gate ahead of it. It is not the ad-hoc cleanup that caused the leak. The
contract states no other script may add one.

Claiming the deny covers every `git add -A` in the repository would have been
exactly the kind of overclaim this package exists to remove.

### Contract

`## Boundaries` gains the staging entry in the list, plus a paragraph naming the
2026-08-17 incident as the reason: a rep's dispatched subagent contaminated the
live checkout, and `git add -A PRD/` during an unrelated cleanup is what turned
that into a commit.

`npm run quality:check` exits 0.
