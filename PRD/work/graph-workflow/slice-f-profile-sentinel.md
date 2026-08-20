# Slice F — `Profile: loaded` becomes observed evidence

## Status: done

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

- [x] A session launched with `claude --settings .claude/graph-profile.json`
      has `THEJUDGE_GRAPH_PROFILE=1`; `graph-preflight` reports the sentinel
      present and the ledger reads `Profile: loaded (env sentinel)`
- [x] A session launched **without** `--settings` reports the sentinel absent and
      the ledger reads `Profile: unverified`
- [x] Both observations are recorded as slice evidence with the exact launch
      command used
- [x] The deny on `Edit`/`Write` to `.claude/graph-profile.json` is confirmed
      present in the profile
- [x] `graph-workflow-contract.md:212-218` states the sentinel proves loading,
      **not** rule enforcement
- [x] `diff -rq .claude/skills .agents/skills` produces no output
- [x] `npm run quality:check` green

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

## Result

`.claude/graph-profile.json` gains an `env` block beside `permissions`:

```json
"env": { "THEJUDGE_GRAPH_PROFILE": "1" }
```

`scripts/graph-preflight.mjs` exports `PROFILE_SENTINEL_ENV` and a pure
`readProfileSentinel(env)`, and `main()` prints two lines before anything else:

```
profile sentinel: present|absent
Profile: loaded (env sentinel)|Profile: unverified
```

`graph-preflight`'s SKILL tells the node to report those lines verbatim and
gains a `## Profile sentinel` section. `graph-run`'s `## Permission profile`
section is rewritten around a two-row observation table; the user-stated launch
command is demoted to an explicit fallback, used only when the sentinel is
absent and the user named the command — recorded as their testimony, which the
sentinel is not.

### Measured — both session shapes, same command

Launched from the implementation worktree.

| Launch command | `profile sentinel:` | Ledger line |
| --- | --- | --- |
| `claude --settings .claude/graph-profile.json -p '… npm run graph:preflight -- --branch tmp/sentinel-evidence --run-id sentinel-evidence --dry-run'` | `present` | `Profile: loaded (env sentinel)` |
| `claude -p '… npm run graph:preflight -- --branch tmp/sentinel-evidence --run-id sentinel-evidence --dry-run'` | `absent` | `Profile: unverified` |

Both were `--dry-run`, so nothing was mutated.

### No forgery path

`Edit(./.claude/graph-profile.json)` is present in the profile's deny list — a
run cannot write its own sentinel. Note the shape: slice D removed the
`Write(...)` twin because the engine reported `Write(path)` rules inert and
`Edit` rules as covering every file-editing tool, so the `Edit` deny **is** the
protection, not half of it. A test asserts the deny is present, and a second
asserts the sentinel name in the script matches the profile's `env` block —
if those drift, a genuinely profiled session would report `unverified` and the
ledger would understate its own evidence.

### The stated limit, kept stated

Five new tests in `scripts/graph-preflight.test.mjs` (72 total, all passing),
including one asserting that any value other than `"1"` reads as unverified, so
a stray export of the same name is not evidence.

The sentinel proves the **file was loaded**. It does not prove any individual
deny rule fired. Two boundaries can never fire under any profile — `nohup` is
stripped as a wrapper before rules match, and a trailing `&` is consumed as a
separator — so both stay convention. That limit is written into the script's
header comment, both skills, and `graph-workflow-contract.md`, which now ends
its profile paragraph with: treat an unverified profile as absent, and a
verified one as loaded, never as enforced.

`diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
