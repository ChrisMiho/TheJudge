# Slice F — `Profile: loaded` becomes observed evidence

## Status: planned

Scope item 9. Depends on: **E** (same file). Closes `HANDOFF.md` open item 6.

## Goal

`Profile: loaded` in the ledger comes from an observation, not from what the user
said at launch.

## Requirements

1. `.claude/graph-profile.json` gains an `env` block, applied to every session
   launched with it:

   ```json
   "env": { "THEJUDGE_GRAPH_PROFILE": "1" }
   ```
2. `graph-preflight` reads it and reports the result.
3. `graph-run` writes `Profile: loaded (env sentinel)` or `Profile: unverified`
   **from that observation**. The user-stated-path form stays as the fallback
   when the sentinel is absent but the user named the launch command.
4. Convert `graph-workflow-contract.md:212-218` from an honest limitation into a
   check — and state the limit plainly rather than overclaiming: **the deny rules
   themselves stay unverifiable.** The sentinel proves the file was loaded, not
   that any individual rule fired. `nohup` and trailing `&` stay convention
   regardless.
5. No forgery path: the profile's deny list already covers `Edit`/`Write` on
   `.claude/graph-profile.json`, so a run cannot write its own sentinel. Confirm
   that deny is present rather than assuming it.
6. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [ ] A session launched with `claude --settings .claude/graph-profile.json`
      has `THEJUDGE_GRAPH_PROFILE=1`; `graph-preflight` reports the sentinel
      present and the ledger reads `Profile: loaded (env sentinel)`
- [ ] A session launched **without** `--settings` reports the sentinel absent and
      the ledger reads `Profile: unverified`
- [ ] Both observations are recorded as slice evidence with the exact launch
      command used
- [ ] The deny on `Edit`/`Write` to `.claude/graph-profile.json` is confirmed
      present in the profile
- [ ] `graph-workflow-contract.md:212-218` states the sentinel proves loading,
      **not** rule enforcement
- [ ] `diff -rq .claude/skills .agents/skills` produces no output
- [ ] `npm run quality:check` green

## Verification

```bash
node -e "const p=JSON.parse(require('fs').readFileSync('.claude/graph-profile.json','utf8'));console.log(p.env)"
grep -n 'graph-profile.json' .claude/graph-profile.json   # the self-write deny
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `.claude/graph-profile.json`
- `.claude/skills/graph-preflight/SKILL.md` (+ reference, + mirror)
- `.claude/skills/graph-run/SKILL.md` (+ reference, + mirror)
- `scripts/graph-preflight.mjs`
- `PRD/instructions/graph-workflow-contract.md`
