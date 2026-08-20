# Slice B — Graph tier gated by the run lock

## Status: planned

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

- [ ] Unit tests assert every graph-tier rule denies with a lock present and
      allows with no lock, and that every universal-tier rule denies in both
      states.
- [ ] Unit tests assert a corrupt lock file and a missing lock both classify as
      "no run active" for the graph tier while the universal tier still denies.
- [ ] `nohup <cmd>` and `<cmd> &` are denied with a lock present. These are the
      two boundaries no permission rule can express, so this is the criterion
      that closes REQ-152's last two lines.
- [ ] `rm .worktrees/.graph-run.lock` is denied with a live lock present.
- [ ] A write to `.worktrees/.graph-node-calls.json` and one to
      `.worktrees/.graph-evidence.jsonl` are denied with a lock present.
- [ ] **Live, both directions.** With no lock, edit a `thejudge-*` skill file
      and `CLAUDE.md` in an ordinary session — both succeed. Create a lock,
      attempt the same two edits — both denied, with the reason recorded. Then
      remove the lock. Record all four observations verbatim.
- [ ] `npm run test:scripts` green.

## Verification

```bash
npm run test:scripts
node --test scripts/lib/boundary-rules.test.mjs
```

## Files touched

- `scripts/lib/boundary-rules.mjs`
- `scripts/lib/boundary-rules.test.mjs`
- `scripts/graph-boundary-hook.mjs`
- `scripts/graph-boundary-hook.test.mjs`
