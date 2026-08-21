# Slice B — The door names the work before node 1

## Status: done

## Goal

The owner invokes `graph-run` with a description and nothing else. The door
proposes the slug, derives `thejudge-auto/<slug>` as the branch, mints the run
id, and hands that same slug to node 2 — so the branch and the package share
one name instead of being named independently at two nodes.

## Requirements

REQ-160 (the `--branch` half), REQ-161.

1. `--branch <name>` becomes **optional** in `graph-run`'s `## Goal and inputs`.
   Supplied, it is used verbatim and overrides derivation. Omitted, the door
   derives it. The existing rule that the branch is never inferred from the
   current branch stays.
2. The door proposes a kebab-case slug from the request before dispatching node
   1, and derives the branch as `thejudge-auto/<slug>` — the convention already
   in the repository's merge history.
3. The door mints the `--run-id` before node 1 and passes that same id to
   `graph-preflight`, which already treats `--run-id` as caller-chosen and
   optional (`graph-preflight/SKILL.md:26-29`). `graph-preflight`'s own contract
   is otherwise unchanged.
4. The door passes the proposed slug to node 2. `thejudge-kickoff` **accepts a
   supplied slug** and uses it, instead of always proposing one. With no
   supplied slug — every direct invocation — it proposes as it does today.
5. An explicitly supplied `--branch` overrides the derived branch without
   changing the slug node 2 receives.
6. A branch-name collision surfaces as `graph-preflight`'s existing exit-code-2
   condition. The door reports it with the derived name and does not retry
   silently or invent a variant.
7. Node ordering is unchanged: `preflight` stays node 1, `shape` stays node 2.

## Files touched

- `.claude/skills/graph-run/SKILL.md` — `## Goal and inputs`
- `.claude/skills/thejudge-kickoff/SKILL.md` — `## Inputs`, `## Mode`,
  `## Writes`
- `PRD/instructions/graph-workflow-contract.md` — the door's naming duty stated
  once, beside the node table
- `.agents/skills/**` via `npm run skills:ai-sync`

## Acceptance criteria

- [x] B1 — `graph-run/SKILL.md` states `--branch` is optional, that a supplied
      value is used verbatim, and that an omitted one is derived; the "never
      inferred from the current branch" rule is still present.
- [x] B2 — `graph-run/SKILL.md` states the derived branch is
      `thejudge-auto/<slug>` and that the slug is proposed before node 1 is
      dispatched.
- [x] B3 — `graph-run/SKILL.md` states the door mints the `--run-id` before
      node 1 and passes that same id to `graph-preflight`.
- [x] B4 — `thejudge-kickoff/SKILL.md` accepts a supplied slug and uses it, and
      still proposes one when none is supplied.
- [x] B5 — `graph-run/SKILL.md` states that a supplied `--branch` overrides the
      branch without changing the slug node 2 receives.
- [x] B6 — `graph-run/SKILL.md` states that a collision is `graph-preflight`'s
      exit-code-2 condition, reported with the derived name, never retried.
- [x] B7 — `.claude/skills/graph-preflight/SKILL.md` is unchanged by this
      slice, and the node table in the contract still reads `1 preflight` /
      `2 shape`.
- [x] B8 — `npm run skills:ai-sync` run and
      `diff -rq .claude/skills .agents/skills` prints nothing.
- [x] B9 — hand-trace one launch on paper: request text in, slug out, branch
      out, run id out, and the two node dispatches carrying them. Confirm one
      name reaches both nodes. Record the traced values.

## Verification

```bash
grep -n -- "--branch" .claude/skills/graph-run/SKILL.md
grep -n "thejudge-auto" .claude/skills/graph-run/SKILL.md
grep -n -- "--run-id" .claude/skills/graph-run/SKILL.md
grep -n "slug" .claude/skills/thejudge-kickoff/SKILL.md
git diff --name-only -- .claude/skills/graph-preflight/
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
```

## B9 hand-trace

Request in: `"Add a dark-mode toggle to settings"`, no `--branch`, no `--run-id`.

- Door proposes slug: `dark-mode-settings-toggle`
- Door derives branch: `thejudge-auto/dark-mode-settings-toggle`
- Door mints run id: `graph-20260820-153000`
- Node 1 (`preflight`) dispatched with `--branch thejudge-auto/dark-mode-settings-toggle --run-id graph-20260820-153000`
- Node 2 (`shape`) dispatched with slug `dark-mode-settings-toggle`, used verbatim
  for `PRD/work/dark-mode-settings-toggle/`

One name — `dark-mode-settings-toggle` — reaches both nodes: embedded in the
branch string node 1 receives, and passed directly as the slug node 2
receives.
