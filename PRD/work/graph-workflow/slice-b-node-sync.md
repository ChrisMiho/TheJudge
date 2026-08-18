# Slice B — Sync ports to Node through the protected-write helper

## Status: planned

Scope item 2. Depends on: **A** (repointed bash script is the port's source and
its byte-diff baseline).

## Goal

`scripts/sync-agent-skills.mjs` replaces the bash script and routes its write
through `mirrorSkillTrees()` in `scripts/lib/protected-paths.mjs` — the helper's
single declared protected-write — producing output byte-identical to
`rsync -a --delete`.

## Requirements

1. Create `scripts/lib/protected-paths.mjs` declaring the protected set —
   `.secrets/**`, `CLAUDE.md`, `.claude/graph-profile.json`,
   `.claude/settings*.json`, `thejudge-*/**` in both skill trees — and exporting
   `mirrorSkillTrees()` as its single declared protected-write.
2. Create `scripts/sync-agent-skills.mjs` calling `mirrorSkillTrees()` with
   source pinned to `.claude/skills/` and destination pinned to
   `.agents/skills/`. Delete-on-sync semantics must match `rsync -a --delete`:
   a file removed from the canonical tree disappears from the mirror.
3. Point `package.json`'s `skills:ai-sync` at
   `node scripts/sync-agent-skills.mjs`. The script **name** is unchanged.
4. Delete `scripts/sync-agent-skills.sh`.
5. Why this port exists at all, so it is not mistaken for tidying: a bash script
   cannot route through a JS helper and is invisible to a JS-source drift guard.
   Porting it is what lets slice C's guard cover every script it scans with
   exactly one declared exemption and no allowlist of script names.

## Acceptance criteria

- [ ] **Byte-identical proof.** Capture the mirror produced by the bash script
      before the port; run the Node version; `diff -rq` the two produces **no
      output**. Any difference fails the slice
- [ ] `npm run skills:ai-sync` exits 0 and
      `diff -rq .claude/skills .agents/skills` produces no output
- [ ] Delete propagation: removing a file from `.claude/skills/`, running the
      sync, and confirming it is gone from `.agents/skills/` — then restoring it
- [ ] `scripts/sync-agent-skills.sh` no longer exists;
      `git grep -n 'sync-agent-skills.sh'` returns only historical/receipt paths
- [ ] `npm run quality:check` green

## Verification

```bash
# 1. Baseline from the bash script (before deleting it)
rm -rf .tmp/mirror-baseline && mkdir -p .tmp
bash scripts/sync-agent-skills.sh && cp -a .agents/skills .tmp/mirror-baseline

# 2. After the port
rm -rf .agents/skills
npm run skills:ai-sync
diff -rq .tmp/mirror-baseline .agents/skills   # must print nothing

diff -rq .claude/skills .agents/skills          # must print nothing
npm run quality:check
```

## Files touched

- `scripts/lib/protected-paths.mjs` (new)
- `scripts/sync-agent-skills.mjs` (new)
- `scripts/sync-agent-skills.sh` (deleted)
- `package.json`
