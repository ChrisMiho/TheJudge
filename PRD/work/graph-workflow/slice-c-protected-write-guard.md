# Slice C — Protected-write drift guard

## Status: done

Scope item 3. Depends on: **B** (the helper is the guard's one exemption).

## Goal

`scripts/protected-write-guard.test.mjs` fails any non-test script that both
writes via `fs` and names a protected path, unless it is the helper — passing on
the current tree with **no refactors** and an exemption list holding exactly one
entry.

## Requirements

1. Follow `scripts/ci-workflow-parity.test.mjs` exactly: a source-text scan with
   a declared exemption list, where adding an entry is a reviewable act.

   ```js
   const PROTECTED_WRITE_EXEMPTIONS = [
     {
       file: "scripts/lib/protected-paths.mjs",
       why: "the helper itself; mirrorSkillTrees() is the single declared protected-write"
     }
   ];
   ```
2. Scan every non-test `scripts/**/*.mjs`. Fail a file containing **both** an
   `fs` write API (`writeFile`, `mkdir`, `rm`, `cp`, `rename`, `appendFile`,
   `createWriteStream`, and their `*Sync` forms) **and** a protected-path
   literal, unless exempt. A script that only reads a protected path stays legal;
   a script that writes anywhere non-protected stays legal.
3. **Match call forms, not substrings — this is load-bearing, not style.** As
   bare substrings those tokens false-positive on the current tree twice:
   `platform` and `SIGTERM` both contain `rm` (`scripts/dev.mjs:3,29,33`), and
   `renameSources` / `renamedFrom` contain `rename`
   (`scripts/graph-preflight.mjs:17,18,132`). Both files also carry a
   protected-path literal, so a substring implementation fails two clean scripts
   on day one — and the failure reads as a dirty tree rather than a wrong regex.
   Anchor each token as a call: `/\b(fs\.)?writeFileSync?\s*\(/` and the like.
   `ci-workflow-parity.test.mjs` already works this way; its `satisfiedBy` is an
   anchored `/^npx vitest run --coverage .*--shard=/`.
4. Record the two stated limits in the test file's header comment, not just here:
   it matches path **literals** (a runtime-assembled protected path evades it),
   and `*.test.mjs` files are out of scan scope — a graph run does not execute
   them, and `graph-preflight.test.mjs` legitimately pairs temp-dir writes with
   `.secrets/` fixture strings. That is a scope boundary, not a second exemption.
5. **The guard's subject is protected-path writes, not all writes.** Eleven
   scripts write to disk today — `build-card-metadata`, `build-card-hashes`,
   `build-card-prices`, `build-card-scan-map`, `build-card-rulings`,
   `build-game-rules`, `build-scan-vectors`, `retrieval-relevance-report`,
   `prompt-preview`, `refresh-scryfall-data`, `graph-preflight.test` — writing to
   `data/`, `.tmp/`, and temp dirs, none protected. **Refactoring them is an
   explicit non-goal.**
6. Update `PRD/instructions/graph-workflow-contract.md` and DEC-164's Impact so
   the three-layer table states each layer's reach per writing mechanism, and
   raw Bash is recorded as **convention, never claimed as enforced**.
7. **The permission profile is deliberately not narrowed.** An allowlist of
   script names would block agents mid-run every time a script is added, which
   contradicts the profile's purpose. `Bash(npm run *)` and
   `Bash(node scripts/*)` stay broadly allowed; enforcement lives in
   `quality:check`. `test:scripts` runs `node --test scripts/*.test.mjs`, so the
   new guard joins the gate by existing — no `package.json` change.
8. Also record: writes into the mirror tree are the sync path's alone, through
   `mirrorSkillTrees()`. Hand-editing a mirror is the drift failure this guards.
   And the `thejudge-*` deny is a **graph-run boundary, not an authoring
   restriction** — `graph-run` and `graph-preflight` skill files are not denied
   at all, which is how slice F's `SKILL.md` change ships.

## Acceptance criteria

- [x] `node --test scripts/protected-write-guard.test.mjs` passes on the current
      tree with **zero refactors** to any existing script
- [x] It passes `scripts/dev.mjs` and `scripts/graph-preflight.mjs` specifically
      — the two a substring matcher fails. Assert this as a named test case, not
      as a side effect of the suite being green
- [x] It **fails** a deliberately planted script that writes to a protected path;
      the planted file is removed before commit
- [x] The exemption list holds exactly **one** entry, asserted by the test itself
- [x] The four scripts naming a protected literal are confirmed write-free, and
      the count is the real one:

      | Script | Protected literal | Writes? |
      | --- | --- | --- |
      | `aws-verify.mjs` | `.secrets/aws-bedrock-dev.env` (:45, :70, :81) | no |
      | `openai-verify-credentials.mjs` | `.secrets/openai-dev.env` (:37, :82, :90) | no |
      | `graph-preflight.mjs` | `.secrets/` (:88, in a comment) | no |
      | `dev.mjs` | `thejudge-implement-fanout` (:5, in a comment) | no |
- [x] `npm run test:scripts` picks the guard up with no `package.json` edit
- [x] `npm run quality:check` green

## Verification

```bash
node --test scripts/protected-write-guard.test.mjs
npm run test:scripts
npm run quality:check
```

## Files touched

- `scripts/protected-write-guard.test.mjs` (new)
- `scripts/lib/protected-paths.mjs` (protected-set export, if the guard needs it)
- `PRD/instructions/graph-workflow-contract.md`
- `PRD/sections/decisions/doc-process.md` — DEC-164 Impact

## Result

`scripts/protected-write-guard.test.mjs` scans every non-test
`scripts/**/*.mjs` and fails a file that pairs an anchored `fs` write call with
a protected-path literal, unless it is on `PROTECTED_WRITE_EXEMPTIONS` — one
entry, `scripts/lib/protected-paths.mjs`, asserted by the test itself. The
literals come from the helper's new `PROTECTED_PATH_LITERALS` export, so the
protected set is declared once.

Six tests, all passing with **zero refactors** to any existing script:

1. no script writes to a protected path outside the helper
2. the exemption list holds exactly one entry
3. call-form matching passes `dev.mjs` and `graph-preflight.mjs` — named
   explicitly, asserting each *does* carry a protected literal and performs *no*
   write call
4. a substring matcher would have failed those two, so the anchoring is proved
   load-bearing rather than asserted
5. a planted protected-path writer is caught
6. reading a protected path, or writing a non-protected one, stays legal

**Planted-file check, run for real.** `scripts/planted-offender.mjs`
(`writeFile(".claude/graph-profile.json", …)`) was written into `scripts/`; the
suite went to `pass 5 / fail 1`, naming
`scripts/planted-offender.mjs (writeFile( + ".claude/graph-profile.json")`. The
file was deleted and the suite returned to `pass 6 / fail 0`. The temp-fixture
version of the same case is kept as permanent coverage.

**The four scripts naming a protected literal are the real four.**
`git grep` over non-test `scripts/*.mjs` for every protected literal returns
exactly `graph-preflight.mjs:88`, `aws-verify.mjs:39,45,70,81`,
`dev.mjs:5`, and `openai-verify-credentials.mjs:37,82,90` — plus the helper.
None performs a write call.

`npm run test:scripts` went from 79 tests to 85 with no `package.json` edit.

**Docs.** `graph-workflow-contract.md` gains a
`### Protected paths — three layers, each with a stated reach` subsection under
`## Boundaries`: the three-layer table, the guard's stated reach and two limits,
the mirror-writes rule, the graph-run-boundary-not-authoring-restriction note,
and the deliberate non-narrowing of the profile. DEC-164's Impact gains the
mirror-writes clause; its existing bullets already state reach per mechanism and
already record raw Bash as convention never claimed as enforced.

`npm run quality:check` exits 0.
