# Slice A — base→main preflight guard

## Status: done

## Goal

Make a fresh graph run refuse to start while a prior package's base→main PR is
still open, so the queue can never branch off a stale `main`.

## Requirements

1. Add a pure function `classifyPendingBaseToMain(openPRs, newBranch)` to
   `scripts/graph-preflight.mjs`, shaped like the existing `classifyLock` /
   `classifyCanary` (pure, no I/O). It returns `{ block: boolean, reason: string }`.
   It **blocks** when any entry in `openPRs` has a `headRefName` matching
   `thejudge-auto/*` that is **not** equal to `newBranch`. It **allows** when the
   only matching head is `newBranch` itself, or there are no matching heads.
2. Wire it into the fresh-run path only: the script runs
   `gh pr list --base main --state open --json headRefName,url`, parses the JSON,
   and calls `classifyPendingBaseToMain` with the branch it is about to create.
   On `block`, exit non-zero with a message naming the offending PR url(s) and the
   fix (merge the prior base→main PR, then retry).
3. **Fail closed:** if the `gh pr list` call errors or returns unparseable
   output, treat it as `block` with a message saying the guard could not verify
   and the run is refused. The safety property is the point.
4. The resume path (`--take-lock`, no `--branch`) **skips** the guard — run two's
   own base→main PR is legitimately open.
5. Cover the decision in `scripts/graph-preflight.test.mjs`: block on a
   different-slug open PR; allow when only `newBranch` is open; allow on an empty
   list; ignore non-`thejudge-auto/*` heads; fail-closed on a malformed list.
6. Add the guard step to `.claude/skills/graph-preflight/SKILL.md` (fresh-run
   path), pointing at the pure function as the tested authority — no re-derived
   prose logic.

## Acceptance criteria

- [x] A1 — `npm run test:scripts` passes with the new `classifyPendingBaseToMain`
  cases in `scripts/graph-preflight.test.mjs`. (413 pass)
- [x] A2 — `classifyPendingBaseToMain` exists in `scripts/graph-preflight.mjs`
  and is a pure function (no `gh`/`git`/fs call inside it).
- [x] A3 — the test suite covers block-on-other-slug, allow-on-own-branch,
  allow-on-empty, ignore-non-graph-head, and fail-closed-on-malformed.
- [x] A4 — `graph-preflight` SKILL documents the guard on the fresh-run path and
  names the pure function rather than restating its logic.

## Verification

```bash
npm run test:scripts
node --test scripts/graph-preflight.test.mjs
```

## Files touched

- `scripts/graph-preflight.mjs`
- `scripts/graph-preflight.test.mjs`
- `.claude/skills/graph-preflight/SKILL.md`
