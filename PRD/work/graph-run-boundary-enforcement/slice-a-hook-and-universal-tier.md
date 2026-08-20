# Slice A — Hook and universal tier

## Status: done

## Goal

A `PreToolUse` hook, committed to `.claude/settings.json`, that fires in every
session and every subagent with no launch flag and denies the universal tier.

## Requirements

REQ-152, NFR-016.

1. Create `.claude/settings.json` — the repository does not have one today, only
   the personal gitignored `settings.local.json`. It registers one `PreToolUse`
   hook with matcher `*`, invoking
   `node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"`.
2. Create `scripts/lib/boundary-rules.mjs` — pure, no filesystem access. It
   holds the universal tier's rules, the command-text normalizer, and a
   `classifyToolCall()` decision function. Every protected-path and command
   literal in this package lives here. Protected paths come from
   `PROTECTED_PATH_PATTERNS` in `scripts/lib/protected-paths.mjs`, not a second
   copy.
3. Create `scripts/graph-boundary-hook.mjs` — reads the `PreToolUse` JSON from
   stdin, extracts `tool_name`, `tool_input.command`, and file-path fields,
   calls `classifyToolCall()`, and exits 2 with the reason on stderr to deny or
   0 to allow. It contains no protected-path literal, because it performs file
   writes in later slices and `scripts/protected-write-guard.test.mjs` fails any
   non-test script that pairs the two.
4. The normalizer sees what a permission rule cannot: strip `nohup` and other
   wrappers before matching, split on command separators while recording a
   trailing `&`, and resolve the destination of `cp`, `rsync`, and `>` / `>>`
   redirection so a write into a protected path is visible as a write.
5. The universal tier denies in every session, with or without a run lock:
   `.secrets/**` reads and writes, force-push in every flag form and the
   leading-`+` refspec form, remote branch deletion by `--delete` / `-d` / the
   `:branch` refspec, `main` and `master` pushes, `rm -rf`, `sudo`, `pkill`,
   `killall`.
6. `main` / `master` denies carry no trailing wildcard after the branch name, so
   `main-line-feature` and `maintenance` stay pushable — the same false-positive
   boundary `scripts/graph-preflight.test.mjs` already asserts for the profile.
7. An internal hook error prints a diagnostic and exits 0. A hook that fails
   closed bricks every session in the repository; a hook that stops deciding is
   caught by slice E's canary and heartbeat instead.
8. `.claude/settings.json` and `scripts/graph-boundary-hook.mjs` join the
   protected set in `scripts/lib/protected-paths.mjs`, so a run cannot edit its
   own enforcer. `.claude/settings*.json` already covers the first.

## Acceptance criteria

- [x] `node --test scripts/graph-boundary-hook.test.mjs` passes, covering: each
      universal-tier rule denied; `cp`, `rsync`, and `>` redirection into a
      protected path denied; `nohup`-wrapped commands unwrapped before matching;
      a trailing `&` observed; and the `main-line-feature` / `maintenance`
      false-positive check.
- [x] Live proof, not only unit proof: in a session launched with **no**
      `--settings` flag, a `Bash` call the universal tier denies returns the
      hook's reason. Record the exact command tried and the reason text in this
      slice's verification section.
- [x] The same denial fires from inside a dispatched subagent, not only at top
      level. Record the subagent dispatch and the returned reason.
- [x] `grep -n "CLAUDE.md\|\.claude/settings\|thejudge-\|\.secrets/" scripts/graph-boundary-hook.mjs` returns nothing — the literals live in `boundary-rules.mjs`.
- [x] `npm run test:scripts` green, including `scripts/protected-write-guard.test.mjs`.
- [x] **`bypassPermissions` measured, not assumed.** Issue one universal-tier
      denial in a session running `permission_mode: "bypassPermissions"` and
      record the observed result verbatim — denied or allowed — with the binary
      version (`claude --version`). This is the measurement the brief holds
      open; slice I records it in the contract as a measurement, never as a
      claim.
- [x] An ordinary session performs a normal edit, a `git status`, and a
      `npm run test:scripts` with no denial and no perceptible delay (NFR-016).

## Verification

```bash
npm run test:scripts
node --test scripts/graph-boundary-hook.test.mjs
grep -n "CLAUDE.md\|\.claude/settings\|thejudge-\|\.secrets/" scripts/graph-boundary-hook.mjs || echo "clean"
claude --version
```

## Verification record

Binary: `claude` 2.1.234 (Claude Code). Every live check below ran in a session
launched with **no** `--settings` flag, from the implementation worktree.

### Unit proof

- `node --test scripts/graph-boundary-hook.test.mjs` — 42 pass, 0 fail.
- `node --test scripts/lib/boundary-rules.test.mjs` — 15 pass, 0 fail.
- `npm run test:scripts` — 195 pass, 0 fail, including
  `scripts/protected-write-guard.test.mjs`.
- `npm run quality:check` — exit 0.
- `grep -n "CLAUDE.md\|\.claude/settings\|thejudge-\|\.secrets/" scripts/graph-boundary-hook.mjs`
  — no matches. The literals live in `boundary-rules.mjs`.

`scripts/lib/*.test.mjs` was outside the `test:scripts` glob, so
`boundary-rules.test.mjs` would have existed without ever running. The glob is
now `node --test scripts/*.test.mjs scripts/lib/*.test.mjs`.

### Live proof — top level

Command tried: `git push --force origin topic-that-does-not-exist`

Returned verbatim:

```
PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] Force-push is denied in every session (saw `--force`).
```

The push never reached `git`.

### Live proof — inside a dispatched subagent

A general-purpose subagent was dispatched and told to run `sudo ls /var/root`.
It returned verbatim:

```
<error>PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] `sudo` is denied in every session.
</error>
```

The deny fires at subagent depth, not only at top level — which is the property
that matters, because delegating is how a run would otherwise slip past it.

### `bypassPermissions` — measured, not assumed

Session run with `--permission-mode bypassPermissions`. Command tried:
`pkill -f definitely-no-such-process-xyz`.

**Observed result: denied.** Returned verbatim:

```
PreToolUse:Bash hook error: [node "$CLAUDE_PROJECT_DIR/scripts/graph-boundary-hook.mjs"]: [graph-boundary] `pkill` is denied in every session.
```

This is one measurement on one binary version, not a guarantee about the
harness. Slice I records it as a measurement with its version attached.

### NFR-016 — no denial and no perceptible delay

An ordinary session wrote a scratch file with `Write`, ran `git status --short`,
and ran `npm run test:scripts`. All three succeeded; nothing was blocked,
prompted, or denied.

Allow-path hook latency, 15 runs of the hook against a `git status --short`
payload: min 42 ms, median 44 ms, max 46 ms — process startup, effectively all
of it, and below perception against any real tool call.

### Stated limits carried forward

- The hook matches literals and normalized argv. A path or command assembled at
  runtime — through a variable, a heredoc, or an interpreter — evades it.
- The normalizer models a shell; it is not one. Substitution, functions, and
  aliases are out of its reach.
- The hook never fails closed. An internal error prints a diagnostic and exits
  0, so a hook that has stopped deciding is silent. Slice E's canary and
  heartbeat are what catch that, not this slice.

## Files touched

- `.claude/settings.json` (new)
- `scripts/graph-boundary-hook.mjs` (new)
- `scripts/graph-boundary-hook.test.mjs` (new)
- `scripts/lib/boundary-rules.mjs` (new)
- `scripts/lib/boundary-rules.test.mjs` (new)
- `scripts/lib/protected-paths.mjs`
