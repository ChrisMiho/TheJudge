# Slice B — Graph tier gated by the run lock

## Status: done

## Goal

A second, stricter tier that fires only while a run holds
`.worktrees/.graph-run.lock`, so always-on enforcement never blocks ordinary
work in this repository.

## Requirements

REQ-153, REQ-152 (the `nohup` and background-`&` denials), NFR-016.

1. `classifyToolCall()` gains a lock-state input. The hook reads
   `.worktrees/.graph-run.lock` and passes "run active" or "no run active"; the
   pure module stays free of filesystem access.
2. The graph tier denies only while the lock exists: writes to `thejudge-*/**`
   in both `.claude/skills/` and `.agents/skills/`, `CLAUDE.md`,
   `.claude/settings*.json`, `.claude/graph-profile.json`, `nohup`, and a
   trailing background `&`.
3. The graph tier also denies agent writes to the hook's own records —
   `.worktrees/.graph-node-calls.json` and `.worktrees/.graph-evidence.jsonl` —
   so a run can neither reset its call count nor forge evidence.
4. Removing the lock is not an escape hatch: a Bash deletion of
   `.worktrees/.graph-run.lock` is denied while the lock is live. Release goes
   through the run's own path in `graph-run`'s `## Terminal states` table.
5. A missing or unparseable lock means "no run active" for the graph tier and is
   never a reason to skip the universal tier.
6. Tier membership is data the hook reads — one table in `boundary-rules.mjs`
   with a `tier` field per rule — not logic duplicated between hook and profile.

## Acceptance criteria

- [x] Unit tests assert every graph-tier rule denies with a lock present and
      allows with no lock, and that every universal-tier rule denies in both
      states.
- [x] Unit tests assert a corrupt lock file and a missing lock both classify as
      "no run active" for the graph tier while the universal tier still denies.
- [x] `nohup <cmd>` and `<cmd> &` are denied with a lock present. These are the
      two boundaries no permission rule can express, so this is the criterion
      that closes REQ-152's last two lines.
- [x] `rm .worktrees/.graph-run.lock` is denied with a live lock present.
- [x] A write to `.worktrees/.graph-node-calls.json` and one to
      `.worktrees/.graph-evidence.jsonl` are denied with a lock present.
- [x] **Live, both directions.** With no lock, edit a `thejudge-*` skill file
      and `CLAUDE.md` in an ordinary session — both succeed. Create a lock,
      attempt the same two edits — both denied, with the reason recorded. Then
      remove the lock. Record all four observations verbatim.
- [x] `npm run test:scripts` green.

## Verification

```bash
npm run test:scripts
node --test scripts/lib/boundary-rules.test.mjs
```

## Verification record

Binary: `claude` 2.1.234 (Claude Code).

### Unit proof

- `node --test scripts/lib/boundary-rules.test.mjs` — 20 pass, 0 fail.
- `node --test scripts/graph-boundary-hook.test.mjs` — 75 pass, 0 fail.
- `npm run test:scripts` — 233 pass, 0 fail.
- `npm run quality:check` — exit 0.

Every graph-tier rule is asserted twice, once with a lock present and once
without, from one table. The universal tier is asserted in both lock states from
the same table slice A wrote, so a rule cannot be quietly demoted into the graph
tier without the test noticing.

### Live proof — both directions

Both runs used `--permission-mode bypassPermissions`, deliberately. The harness
permission layer blocks writes under `.claude/skills/` on its own, which would
have confounded the no-lock direction: a block would have proved nothing about
the hook. Removing that layer leaves the hook as the only gate. Slice A measured
that hook denies survive `bypassPermissions`, which is what makes this isolation
sound.

**No lock — both writes succeed.**

```
(1) printf '<!-- probe -->\n' >> CLAUDE.md                                  → EXIT=0
(2) printf '<!-- probe -->\n' >> .claude/skills/thejudge-map-out/SKILL.md   → EXIT=0
```

Reported verbatim: "Both ran. Neither was blocked. No hook fired, no permission
prompt, no denial on either." `git status` confirmed both files modified.

**Lock present — both writes denied.**

```
PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] Writing `CLAUDE.md` is denied while a graph run holds the lock: a run may not edit its own enforcer or its own instructions.
```

```
PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] Writing `.claude/skills/thejudge-map-out/SKILL.md` is denied while a graph run holds the lock: a run may not edit its own enforcer or its own instructions.
```

`git status` confirmed neither file was modified — the shell never ran. The
probe lock was then removed.

### Design notes worth carrying

`isRunActive()` is deliberately not `classifyLock()` from `graph-preflight.mjs`.
That one decides whether a *new* run may start, so it treats a corrupt lock as a
hard blocker. This one decides whether stricter rules apply to a call already in
flight, where the safe reading of an unreadable lock is the permissive one: a
hook that hardened on garbage would brick ordinary work in this repository. The
universal tier fires either way, which is what keeps that choice cheap.

`mv` moved out of the copy list and into the destructive list. A move writes its
destination *and* removes its source, so a destination-only rule would have
missed half of what `mv CLAUDE.md elsewhere` does.

### Stated limits carried forward

- A stale lock — one whose process is gone — still reads as an active run to
  this hook. That is the conservative direction, and reclaiming it is
  `graph-preflight`'s reported, never-silent path.
- The write-target resolver models a shell rather than being one. A path built
  at runtime, or a write performed inside an interpreter the hook allowed, is
  outside its reach.

## Files touched

- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
