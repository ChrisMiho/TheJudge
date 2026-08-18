# DESIGN-BRIEF — graph-workflow hardening

Supersedes `HANDOFF.md` as the scope of record. `HANDOFF.md` stays as the
incident and state narrative; this file is what gets sliced.

Product truth: **DEC-163** (the spine, recorded retroactively), **DEC-164**
(the enforcement model), and **DEC-165** (two runtimes, `.claude/skills/`
canonical) in `PRD/sections/decisions/doc-process.md`.
Open question: **Q-005** (the rescue branch).

## Problem

Every boundary this workflow depends on is written as prose telling an agent to
behave, and prose has now failed to bind three times under measurement:

| Boundary | How it was written | How it failed |
| --- | --- | --- |
| No pre-authorization of product decisions | Rule at three layers | Fixture item 5 failed 2 of 3 reps; one rep decided seven product forks under a standing order, another extended the override to cover the contract's own blocker test |
| Fixture rep isolation | "Work in your clone" in the rep's prompt | A dispatched *subagent* inherited the real working directory and wrote DEC-161/162, REQ-146..151, NFR-015, FLOW-019 into `PRD/sections/` |
| Staging discipline | Convention | `git add -A PRD/` committed the leak during an unrelated cleanup |

A fourth wording is the same instrument that has already failed three times.
`skill-testing.md` says it directly: divergence across reps means the wording is
not binding, even when every individual run is defensible.

**This work converts those three boundaries into checks a run must pass**, on a
skill surface reduced from three runtimes to two.

## Scope

Listed in slice order. Item 1 decides which trees exist, so it lands first;
items 2 and 3 are the write-guard foundation the rest builds on.

Items 1–7 convert the three boundaries above. Items 8–11 close mechanical gaps
found on 2026-08-17 by reading the profile against the node table rather than
against the contract's prohibition list — 8 in particular blocks the first
profiled run at node 9 regardless of how well 1–7 are built, so it lands early.
Items 12–16 are the control decisions the owner made the same day; 12 and 13 are
one gate and ship together, since a park with no way through it is worse than no
park.

### 1. Drop Cursor — two runtimes, `.claude/skills/` canonical

The Cursor subscription is cancelled; the repository is Codex and Claude Code
only. `.cursor/` is deleted entirely — 20 skill files plus
`.cursor/rules/playwright-mcp-cleanup.mdc`, whose rule is already carried by
both `CLAUDE.md` and `AGENTS.md`, so nothing is lost.

```
.claude/skills/   canonical — edit here (Claude Code reads)
      |  npm run skills:ai-sync
      v
.agents/skills/   mirror (Codex reads)
```

#### Every file to scrub

The list is exhaustive as of `fcafd31`, and it is the slice's checklist. It was
built by running the §1 gate below against the tree, not by reading prose.

**Skill trees — 4 files edited in `.claude/skills/`, 8 on disk.** Edit the
canonical tree only; `npm run skills:ai-sync` regenerates `.agents/skills/`, so
the mirror's four copies are never hand-edited (§3's drift rule).

| File (under both trees) | Line | What it says |
| --- | --- | --- |
| `thejudge-kickoff/SKILL.md` | 67 | `(Cursor / Claude Code)` command prefix |
| `thejudge-kickoff/reference.md` | 14, 33 | runtime list; `.cursor/skills/` as canonical |
| `thejudge-map-out/SKILL.md` | 66 | `(Cursor / Claude Code)` command prefix |
| `thejudge-refinement/SKILL.md` | 74 | `(Cursor / Claude Code)` command prefix |

**Repository root and `PRD/`:**

- `AGENT-SKILLS.md` — every occurrence: :8 and :124 (command prefix), :15, :26
  and :31 (catalog table and the three-way mirror), :129–135 (authoring
  workflow, including the two-way `diff -rq` verification), :144 (the
  `.cursor/skills/thejudge-kickoff/reference.md` path)
- `README.md:17` — names `.cursor/skills/` as canonical
- `PRD/README.md:120`
- `PRD/instructions/skill-testing.md:5`
- `PRD/instructions/graph-workflow-contract.md:234` and its "three synced trees"
  boundary
- `PRD/instructions/doc-lifecycle.md:74` — the anti-pattern about out-of-repo
  Cursor skills
- `PRD/instructions/workflow-reference.md:22` — a command-prefix line of exactly
  the kind `AGENT-SKILLS.md:124` carries
- `.claude/graph-profile.json` — deny rules
- `.prettierignore:8`
- `scripts/sync-agent-skills.sh` — repointed, not deleted (see below)

**Portable guide — 6 files, so `docs/prd-workflow-guide/` names only Codex and
Claude Code:** `START-HERE.md`, `04-skills.md`, `templates/AGENT-SKILLS.md`,
`templates/README.md`, `templates/scripts/sync-agent-skills.sh`, and
`templates/PRD/instructions/workflow-reference.md:11` (the guide's own
command-prefix line, in its `/proj-*` placeholder form).

**`scripts/sync-agent-skills.sh` is repointed in this slice, not slice 2.** It
reads `$ROOT/.cursor/skills` and writes both trees, so deleting `.cursor/`
without touching it leaves `npm run skills:ai-sync` (`package.json`) failing
against a source directory that no longer exists. The repoint is three lines of
bash — source becomes `$ROOT/.claude/skills`, and the second `rsync` leg that
wrote `.claude/skills/` is dropped, since that tree is now the source:

```diff
-SRC="$ROOT/.cursor/skills"
+SRC="$ROOT/.claude/skills"

 mkdir -p "$ROOT/.agents/skills"
 rsync -a --delete "$SRC/" "$ROOT/.agents/skills/"

-mkdir -p "$ROOT/.claude/skills"
-rsync -a --delete "$SRC/" "$ROOT/.claude/skills/"
```

`npm run skills:ai-sync` keeps working at every commit, and slice 2 inherits a
correct bash script to port — which is what its byte-identical `diff -rq` proof
compares against. The `skills:ai-sync` script name itself does not change; only
its implementation does, in slice 2.

#### Files that legitimately keep the word — never scrubbed

The word "Cursor" surviving in the tree is not evidence of an incomplete scrub.
Five categories keep it by design, and a slice that edits any of them has done
damage, not work:

| Path | Why it keeps the word |
| --- | --- |
| `PRD/sections/decisions.md:194`, `decisions/doc-process.md:213–228` | DEC-165's own body and router row **describe** deleting `.cursor/`. `doc-process.md:93–100` is DEC-115 recording the superseded canonical clause. Scrubbing these deletes the decision that authorizes the scrub |
| `PRD/sections/decisions/conversation-ux.md:178,200`, `functional-requirements.md:2515` | "Claude/ChatGPT/Cursor" as the **chat-UI reference product** behind DEC-126/DEC-127 — shipped requirement prose about a product's visual design, nothing to do with the agent runtime |
| `PRD/instructions/receipts/*` (8 files) | Durable history; receipts are never rewritten to match later structure |
| `PRD/work/graph-workflow/PLAN-spine.md` | This package's own historical build plan |
| `apps/frontend/src/**`, `apps/frontend/src/index.css` | CSS `cursor:` properties |

Card data (`apps/backend/data/cardRulingsByOracleId.json`,
`apps/frontend/public/data/*.json`) needs no exclusion: every hit is
*Precursor Golem*, which a word-boundary match does not see.

#### The verification gate

Two commands, both of which must pass on the post-slice tree:

```bash
# 1. No tracked path under .cursor/  — exits 1 when clean
git ls-files | grep -i '\.cursor'

# 2. No stray runtime reference — exits 1 when clean
git grep -lwiI cursor -- \
  ':!apps/frontend' \
  ':!PRD/instructions/receipts' \
  ':!PRD/work/graph-workflow' \
  ':!PRD/sections/decisions.md' \
  ':!PRD/sections/decisions/doc-process.md' \
  ':!PRD/sections/decisions/conversation-ux.md' \
  ':!PRD/sections/functional-requirements.md'
```

Three properties this form has and a bare `grep -ri cursor` does not:

- **It can go green.** An unqualified gate never passes, because the five
  legitimate-keep categories above must survive. An implementer chasing it
  green would scrub DEC-165's own body and shipped requirement prose — the
  failure mode this section exists to prevent.
- **`-w` makes the card data a non-issue.** Every JSON hit is *Precursor
  Golem*; a word-boundary match does not see it, so no data-file exclusion is
  needed and none can hide a real reference.
- **`git grep` with pathspecs, not `grep -r` with a `grep -v` pipeline.** On
  macOS `grep -r … .` prints bare paths, so `'^\./apps/frontend/'` anchors
  silently match nothing and every exclusion is a no-op. `git grep` also exits
  non-zero on no match, so the gate is a plain command exit status.

Run against `fcafd31` and against the current tree, command 2 prints **29**
paths, and the decomposition is what makes this section self-verifying:

**29 = the 24 files enumerated in the scrub checklist above + 5 tracked paths
under `.cursor/` that this slice deletes rather than scrubs.** The five are
`.cursor/rules/playwright-mcp-cleanup.mdc` and the four
`.cursor/skills/thejudge-*` files that also carry the word — command 1 catches
the same five, which is why they need no scrub entry. Post-slice both commands
exit 1.

State the pre-slice number as 29, not 24. An implementer running the gate
against a partly-deleted tree mid-slice can only tell an expected discrepancy
from a missed file if the two populations are named separately.

### 2. Sync ports to Node — `scripts/sync-agent-skills.mjs`

The slice-1 script (already repointed, still bash) becomes
`scripts/sync-agent-skills.mjs`, calling `mirrorSkillTrees()` — the write
helper's single declared protected-write — with source pinned to
`.claude/skills/` and destination pinned to `.agents/skills/`. A bash script
cannot route through a JS helper and is invisible to a JS-source drift guard, so
porting it is what lets §3's guard cover every script it scans with exactly one
declared exemption and no allowlist of script names.

The GAMEPLAN states this slice's execution and proof explicitly: capture the
mirror tree before the port, run the Node version, and `diff -rq` the result —
byte-identical to the `rsync -a --delete` output, or the slice fails.

### 3. Protected-path guard — stated reach, three layers

Protected set: `.secrets/**`, `CLAUDE.md`, `.claude/graph-profile.json`,
`.claude/settings*.json`, and `thejudge-*/**` in both remaining skill trees.

| Mechanism | Enforcement | Status |
| --- | --- | --- |
| Agent `Edit` / `Write` | `.claude/graph-profile.json` deny rules (already ship) | Enforced only when the session is launched with `--settings`; DEC-163 already records that as an unverifiable operator responsibility |
| `node scripts/*` | `scripts/lib/protected-paths.mjs` helper, plus a `test:scripts` drift guard asserting no script writes **to a protected path** outside it | Enforced, within the stated scan scope below |
| Raw Bash (`cp`, `rsync`, redirection) | None | Convention, detected after the fact by the rig's before/after snapshot and the sync drift check — recorded as convention, never claimed as enforced |

#### The drift guard's reach and mechanism

**The guard's subject is protected-path writes, not all writes.** Eleven scripts
write to disk today — `build-card-metadata`, `build-card-hashes`,
`build-card-prices`, `build-card-scan-map`, `build-card-rulings`,
`build-game-rules`, `build-scan-vectors`, `retrieval-relevance-report`,
`prompt-preview`, `refresh-scryfall-data`, and `graph-preflight.test` — and none
of them is refactored by this work. They write to `data/`, `.tmp/`, and temp
dirs, none of which is protected. Requiring every disk write in the repository to
route through the helper would be a data-pipeline refactor in no slice here; it
is a non-goal.

`scripts/protected-write-guard.test.mjs` follows
`scripts/ci-workflow-parity.test.mjs` exactly — a source-text scan with a
declared exemption list, where adding an entry is a reviewable act:

```js
const PROTECTED_WRITE_EXEMPTIONS = [
  {
    file: "scripts/lib/protected-paths.mjs",
    why: "the helper itself; mirrorSkillTrees() is the single declared protected-write"
  }
];
```

It scans every non-test `scripts/**/*.mjs` and fails a file that contains **both**
an `fs` write API (`writeFile`, `mkdir`, `rm`, `cp`, `rename`, `appendFile`,
`createWriteStream`, and their `*Sync` forms) **and** a protected-path literal,
unless that file is on the exemption list. A script that only reads a protected
path stays legal; a script that writes anywhere non-protected stays legal.

**Match call forms, not substrings.** This is load-bearing, not style. Those
tokens as bare substrings false-positive on the current tree twice over:
`platform` and `SIGTERM` both contain `rm` (`scripts/dev.mjs:3,29,33`), and
`renameSources` / `renamedFrom` contain `rename`
(`scripts/graph-preflight.mjs:17,18,132`). Both files also carry a
protected-path literal, so a substring implementation fails two clean scripts on
day one — and the failure reads as a dirty tree rather than as a wrong regex,
which is the expensive way to learn it. Anchor each token as a call:
`/\b(fs\.)?writeFileSync?\s*\(/` and the like. The cited
`ci-workflow-parity.test.mjs` already works this way — its `satisfiedBy` is an
anchored `/^npx vitest run --coverage .*--reporter=blob --shard=/`, not a
substring test — so
the discipline is inherited from the pattern; stating it just removes the trap.

It passes on the current tree without a single refactor, which is what makes it
buildable in one slice: the **four** scripts naming a protected path perform no
writes, and none of the eleven writers names a protected path.

| Script | Protected literal | Writes? |
| --- | --- | --- |
| `aws-verify.mjs` | `.secrets/aws-bedrock-dev.env` (:45, :70, :81) | no |
| `openai-verify-credentials.mjs` | `.secrets/openai-dev.env` (:37, :82, :90) | no |
| `graph-preflight.mjs` | `.secrets/` (:88, in a comment) | no |
| `dev.mjs` | `thejudge-implement-fanout` (:5, in a comment) | no |

`dev.mjs` is the fourth. It stays legal either way, but the count is this
section's stated proof of buildability, so it has to be the real one.

Two limits stated rather than assumed, in the same spirit as the table above:

- It matches path **literals**. A protected path assembled at runtime evades it.
- `*.test.mjs` files are out of scan scope — a graph run does not execute them,
  and `graph-preflight.test.mjs` legitimately pairs temp-dir writes with
  `.secrets/` fixture strings. That is a scope boundary, not a second exemption.

Two further clarifications the enforcement depends on:

- The `thejudge-*` deny is a **graph-run boundary, not an authoring
  restriction**. Skill authoring happens in ordinary sessions, which do not load
  the profile. `graph-run` and `graph-preflight` skill files are not denied at
  all, which is how item 4's `SKILL.md` change ships.
- Writes into the mirror tree are the sync path's alone, through
  `mirrorSkillTrees()`. Hand-editing a mirror is the drift failure this guards.

**The permission profile is deliberately not narrowed.** An allowlist of script
names would block agents mid-run every time a script is added, which contradicts
the profile's purpose: autonomy without red tape. `Bash(npm run *)` and
`Bash(node scripts/*)` stay broadly allowed; enforcement moves to
`quality:check`. `test:scripts` runs `node --test scripts/*.test.mjs`, so a new
guard joins the gate by existing.

### 4. Dispatch validator — `scripts/graph-ledger-check.mjs`

`GRAPH-RUN.md` gains two required sections:

- every node's dispatch prompt, recorded verbatim
- `## Instruction ledger` — one row per user instruction, quoted, classified
  `answered-once` or `refused`, with the node it arose at and, for a refusal,
  the rule that refused it

```markdown
## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "if it asks again, pick the smaller option" | refused | define | No pre-authorization of product decisions |
| "prefer the existing table over a new one" | answered-once | define | — |
```

There is deliberately **no `standing-rule` class**, so pre-authorizing a class of
future product decisions has no representable form in the ledger.

`## Instruction ledger` **replaces** the existing `## Refused instructions`
section rather than coexisting with it — one parse target, so a refusal cannot
be recorded in one section and missed by the other. The same slice updates
`graph-workflow-contract.md` (the ledger template at :123, the section
description at :132, the refusal-recording rule at :193),
`.claude/skills/graph-run/SKILL.md:121`,
`.claude/skills/graph-run/reference.md:133`, and
`PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md`, and
notes in that fixture that runs measured before this change recorded refusals
under the old section name.

The validator fails a run when a dispatch prompt contains conditional-future
authorization language, or when a user instruction is quoted into a dispatch
prompt without a matching `## Instruction ledger` row. Parsing core is a tested
pure function, following `scripts/graph-preflight.mjs`.

**It runs before dispatch, not after.** A violating run stops at the `define`
node. A post-hoc audit could only report seven product forks that were already
decided.

### 5. Fixture rig — `scripts/fixture-rig.mjs`

Owns rep setup instead of leaving it to bullet points in a fixture file:

- one clone **and** one bare `origin` per rep — never the real remote, because
  the scenario pushes `feature/collection-manager` and reps collide on a shared
  origin
- the clone path baked into every dispatch prompt it emits
- `node_modules` as a real directory, never a symlink (`.gitignore`'s
  `node_modules/` does not match a symlink, so `stash -u` swept it up and broke
  the toolchain)
- the invoking repository's `HEAD` and `git status --porcelain` snapshotted
  before and after, failing the run on any difference

That last line is the one that matters: it detects a leak mechanically rather
than depending on someone noticing.

### 6. `thejudge-cleanup` fixture

`AGENT-SKILLS.md` lines 129–132 make running a skill's fixture a merge
precondition when an edit changes gates or refusal conditions. `69eaee9`
changed two of cleanup's four merge-proof checks and cleanup has no fixture.

Both scenarios are drawn from what actually happened on 2026-08-17, not
imagined:

- a recorded base branch deleted after merging (routine hygiene made cleanup
  permanently impossible)
- `gh` returning HTTP 5xx during an outage (an outage is not evidence about the
  work)

### 7. Re-measure fixture item 5

Its role changes: it now verifies the validator fires, not that wording
persuades. Deterministic, so 3 of 3 is the expected result rather than the hoped
one, and a violating rep fails at the `define` node in minutes instead of
diverging after 30–60 minutes. Three reps minimum; record variance, not just
pass/fail.

### 8. Profile matches the node table's command surface

The profile was written from the contract's `## Boundaries` list — what a run must
never do — and never from what the nine nodes actually run. Three consequences on
the current tree:

| Node | Command it needs | Profile status |
| --- | --- | --- |
| 9 `close` | delete `PRD/work/<slug>/` (`thejudge-cleanup/SKILL.md:16,57`) | **no permitted mechanism** — six force-form `rm` denies, no `git rm` entry, and bare `rm -r` unlisted so it prompts |
| 6 `build` | `git worktree remove` + `git branch -d` on the prep worktree (`thejudge-implement-all/reference.md:33`) | unlisted — prompts |
| 6 `build` | `git branch`, `git checkout` variants | unlisted — `git switch` is allowed, `git checkout` is not |

**In an autonomous session a permission prompt is a hang, not a park.** The
three terminal states (`COMPLETE`, `PARKED`, `BLOCKED`) have no shape for
"waiting on a prompt nobody will answer", so a profiled run stalls silently at
node 9 with no ledger row and no `## Open gate`.

Where those states live matters for the edit below: they are defined **only** in
`.claude/skills/graph-run/SKILL.md:128-134`, with the recovery guidance at
`:136-149`. `graph-workflow-contract.md` does not name them — a `git grep` for
`COMPLETE`, `PARKED`, `BLOCKED`, or `terminal` in that file returns nothing.

This slice does four things:

1. Enumerates every command each of the nine nodes issues, by reading each
   delegate skill, and records the enumeration in the slice doc as the diff
   basis — not by guessing at the profile.
2. Adds the missing allows (`Bash(git rm -r PRD/work/*)` scoped to the work
   folder, `Bash(git worktree remove *)`, `Bash(git branch -d *)`, and whatever
   else the enumeration surfaces) and names the cleanup delete mechanism
   explicitly in `thejudge-cleanup` rather than leaving it to the implementer.
3. Closes the unlisted `rm` path (see the diff basis below) with two new denies,
   so an unscoped recursive delete fails cleanly instead of stalling.
4. Adds a **`PROMPTED` terminal state** to `graph-run`'s `## Terminal states`
   table: a permission prompt in a graph run is a run-ending condition that
   writes the denied command into `## Open gate` before stopping. A stalled run
   must leave the same evidence a parked one does.
   `graph-workflow-contract.md` gains a **one-line pointer** naming that table
   as the authority — not a second copy. Two tables of terminal states is the
   drift surface this whole brief exists to remove.

`Bash(git rm -r *)` unscoped is not acceptable — the scoped pathspec form is what
keeps node 9's delete from becoming a general tracked-file delete.

#### The `rm` diff basis

This section's method is enumeration-as-diff-basis, so the enumeration has to be
exact. The profile carries **six** `Bash(rm ...)` denies at
`.claude/graph-profile.json:52-57`, and every one is a *force* form:

```
rm -rf        rm -fr        rm -r -f
rm -f -r      rm --recursive --force        rm --force --recursive
```

A bare `rm -r <path>` is **not denied**. It is unlisted, which means it prompts —
and by this section's own thesis a prompt is a hang. So node 9 has two distinct
problems, not one: no permitted delete mechanism, *and* an unlisted recursive
delete that stalls the run rather than failing it.

Item 3 above adds `Bash(rm -r *)` and `Bash(rm --recursive *)` to the deny list.
After that every recursive spelling is denied, the only permitted delete is the
work-folder-scoped `git rm -r PRD/work/*`, and a run that reaches for anything
else terminates `PROMPTED` with the denied command recorded.

### 9. `Profile: unverified` becomes observed evidence

A settings file carries an `env` block, applied to every session launched with
it. `.claude/graph-profile.json` gains:

```json
"env": { "THEJUDGE_GRAPH_PROFILE": "1" }
```

`graph-preflight` reads it and reports the result; `graph-run` writes
`Profile: loaded (env sentinel)` or `Profile: unverified` from that observation
rather than from what the user said at launch. The user-stated-path form stays as
the fallback when the sentinel is absent but the user named the launch command.

This closes `HANDOFF.md` open item 6 and converts the contract's
`:212-218` paragraph from an honest limitation into a check. The deny rules
themselves stay unverifiable — the sentinel proves the file was loaded, not that
any individual rule fired — and the contract says exactly that rather than
overclaiming.

The profile's own deny list already covers `Edit`/`Write` on
`.claude/graph-profile.json`, so a run cannot forge its own sentinel.

### 10. The run ledger survives `close`

`thejudge-cleanup` deletes `PRD/work/<slug>/`, which holds `GRAPH-RUN.md` — the
node ledger, the evidence column, and item 4's `## Instruction ledger`. Receipts
are durable (`thejudge-cleanup/SKILL.md:64`) but the receipt's fields carry no
graph run record, so the proof that a run refused a pre-authorization survives
exactly until the run succeeds.

`thejudge-cleanup` gains one required receipt section, written before the delete,
populated only when `GRAPH-RUN.md` exists:

```markdown
## Graph run

- Run ID: `<id>` | Profile: `<value>` | Terminal state: `<state>`
- <the complete `## Node ledger` table, verbatim>
- <the complete `## Instruction ledger` table, verbatim>
```

Verbatim, not summarized: a summary of a refusal ledger is the driver grading its
own compliance. Cleanup refuses to delete the package folder when `GRAPH-RUN.md`
exists and this section is absent from the receipt.

### 11. Explicit staging — `git add -A` is denied

`HANDOFF.md:46-48`: the leak was contaminated by a rep, then **committed** by
`git add -A PRD/` during an unrelated cleanup. That second failure has no rule
anywhere — the profile allows `Bash(git add *)` unconditionally, and no
`## Boundaries` entry mentions staging. `reference.md:77-85` lists explicit
publish paths, which is convention, and convention is the instrument this work
exists to replace.

- Profile denies `Bash(git add -A*)`, `Bash(git add --all*)`, `Bash(git add .)`,
  and `Bash(git add . *)`.
- `graph-workflow-contract.md` `## Boundaries` gains: a graph run stages explicit
  paths, never `-A`, `--all`, or `.` — with the incident named as the reason, in
  the same spirit as the rest of that list.

Path-scoped `git add <path>` stays broadly allowed; this narrows the wildcard,
not the operation.

### 12. `define` parks on any `PRD/sections/` diff

The run writes durable product truth — `DEC-###`, `REQ-###`, `FLOW-###` — and
`reference.md:77-85` commits it to the base branch before `build`. Node 8
(`land`) is the first human touch, by which point code exists against unreviewed
product truth. That is the exact class of damage the 2026-08-17 leak did.

After the `define` node returns `ok`, the driver diffs `PRD/sections/`. If the
diff is non-empty it parks — the existing park mechanism, no new machinery:

- `STATUS.owner-action`, board row moved
- `## Open gate` carries the **complete diff**, not a summary, plus the list of
  new stable IDs and the resume command
- stop

An empty diff advances straight to `gate-qc`. Refinement that only writes
`DESIGN-BRIEF.md` never interrupts a run.

**The whole diff, not just new `DEC-###`.** The leak wrote DEC-161/162 *and*
REQ-146..151, NFR-015, FLOW-019 — six requirements and a flow are product
behavior as surely as two decisions are.

This is the one place autonomy is deliberately traded for control, and it is the
trade the braindump asked for: the owner steps back to "bigger picture/UI shape
and vision", which is precisely what `PRD/sections/` holds. Everything below the
product layer — branching, stashing, slicing, commits, PR plumbing — stays
unattended.

### 13. `graph-gate-review` — a third graph skill

A park that is only a stop makes the gate expensive enough to route around.
Reviewing a `## Open gate` diff by hand, then hand-editing a `STATUS.*` marker
and a board row to resume, is the friction that turns a gate into a nuisance.

`graph-gate-review` is the owner-facing half of the gate:

1. Reads `GRAPH-RUN.md`'s `## Open gate` and the recorded `PRD/sections/` diff.
2. Walks the pending changes **one stable ID at a time** — the DEC or REQ
   restated in plain product terms first, then the diff — and takes a verdict per
   item: `accept`, `edit` (the owner's correction applied to `PRD/sections/`), or
   `reject` (reverted from `PRD/sections/`, with the reason recorded).
3. Writes every verdict into `GRAPH-RUN.md` under `## Gate verdicts`, quoting the
   reason for each `edit` and `reject`.
4. Marks the gate resolved and restores the `STATUS.*` marker the node table
   expects at that lifecycle position — `refined` after a `define` gate — and
   moves the board row.
5. Ends with the exact resume command: `/graph-run PRD/work/<slug>/`.

Step 4 is what makes it a loop rather than a dead end, and it lands in the
contract's existing seam: `reference.md:60` already says a package at
`STATUS.owner-action` parks again *unless the recorded `## Open gate` is
resolved*. This skill is what resolves it — no new resume path is invented.

Boundaries, so the reviewer cannot become a second author:

- It never advances a node, never dispatches, never writes `DESIGN-BRIEF.md`,
  `GAMEPLAN.md`, or slice docs. It edits `PRD/sections/` only to apply an owner
  verdict, and only within the recorded diff.
- A `reject` reverts the ID from `PRD/sections/` but leaves the stable number
  burned — never renumbered, per the refinement gate.
- It refuses a package whose `## Open gate` is any gate other than one it
  understands. A fourth `gate-qc` FAIL or a Critical review finding is not a diff
  to walk through.

#### Files that state the two-skill world

A third graph skill goes stale in five places, not two — both count-bearing files
carry the number twice:

| File | Line | Currently says | Becomes |
| --- | --- | --- | --- |
| `PRD/instructions/graph-workflow-contract.md` | 20 | "Exactly two graph skills exist in the spine: `graph-preflight` and `graph-run`" | three, naming `graph-gate-review` |
| `AGENT-SKILLS.md` | 6 | "All **13** are model-invocable" | 14 |
| `AGENT-SKILLS.md` | 97-98 | the graph-skill table has a row per skill | a third row — when to use, what it writes, what it delegates to |
| `PRD/instructions/workflow-reference.md` | 6-7 | "both `graph-*` skills — `graph-preflight` and `graph-run` — are model-invocable" | all three, named |
| `PRD/instructions/workflow-reference.md` | 8 | "the full **13-skill** catalog" | 14 |

`PRD/README.md:121` also changes. It is the owner-facing entry point and the
gate is owner-facing, so the invocation line gains the resume command:

```
- Autonomous graph runs: `/graph-preflight` then `/graph-run PRD/work/<slug>/`;
  on a park, `/graph-gate-review PRD/work/<slug>/` walks the recorded diff and
  resumes the run.
```

**Already landed — do not look for it.** DEC-163's catalog count was updated
during refinement: `PRD/sections/decisions/doc-process.md:167` already reads
"the skill catalog becomes fourteen" and already names `graph-gate-review`. An
implementer searching that file for "thirteen" will find nothing, and should
not conclude the edit is missing.

### 14. Working directory pinned in every dispatch

`HANDOFF.md:37` — "Constraining a parent does not constrain its children." Scope
item 5 fixes that for fixture reps. `graph-run/SKILL.md:42-43` passes the package
path, run ID, and predicate, and pins **no working directory** at any node — the
same root cause, on the production path, where a node dispatches its own
subagents.

- Every dispatch prompt `graph-run` emits carries an absolute
  `Working directory:` line, and requires the node to propagate that same line
  into every prompt it writes. Stated in `SKILL.md`'s loop step 3 and in
  `reference.md`'s dispatch table, so a node that fans out inherits the pin.
- After node 6 (`build`) returns, the driver asserts every file the node wrote
  lies inside `.worktrees/implement-<slug>/` or `PRD/work/<slug>/`. A write
  outside that set fails the node and parks with the offending paths as evidence.

The rig's before/after snapshot does **not** port to production — a real run is
supposed to change the repository. The write-scope assertion is its production
equivalent, and it is stated that way rather than reused by name.

### 15. One run at a time — the concurrency lock

Two `graph-run` invocations share one launch checkout. Both commit to it, both
rewrite `GRAPH-RUN.md`, both publish before `build`. That is the same
shared-working-directory hazard that produced the leak, with no rep isolation
between them.

`graph-preflight` takes a lockfile at `.worktrees/.graph-run.lock` recording the
slug, run ID, PID, and start time. A second run refuses while it is held, naming
the holder. A run releases it on **every** terminal state in `graph-run`'s
`## Terminal states` table — `COMPLETE`, `PARKED`, `BLOCKED`, and the `PROMPTED`
state §8 adds there — and a lock whose PID is no longer alive is reported as
stale and reclaimable rather than silently stolen. That table is the single
definitive list (§8); a release path enumerated anywhere else can drift out of
step with it and strand the lock.

Lock acquisition and staleness detection are a tested pure function, following
`scripts/graph-preflight.mjs`.

### 16. The predicate covers nodes 6 and 9

Contract `:32-34` names four predicate-gated skills. Nodes 6
(`thejudge-implement-all`) and 9 (`thejudge-cleanup`) are dispatched by
`graph-run` and check nothing, so their graph-mode behavior is undeclared and
untestable — whether they pause for a human in a run with no human is not
knowable from the skill files.

Both gain the `## Mode` section the other four carry, naming `graph-run is
controlling` and stating what changes under it. `thejudge-cleanup`'s new fixture
(scope item 6) then measures its gated behavior rather than only its merge-proof
checks, and the contract's predicate paragraph names six skills instead of four.

Node 7 (`superpowers:requesting-code-review`) is out of scope — it is not a
`thejudge-*` skill and is not this repository's to gate. Its limits are recorded
below instead.

## Stated limits

Recorded rather than fixed, so a later reader does not mistake absence for
oversight. Each is a boundary this work deliberately does not convert to a check.

- **The dispatch validator polices testimony.** Scope item 4's
  `graph-ledger-check.mjs` reads dispatch prompts and `## Instruction ledger`
  rows that `graph-run` itself wrote. A driver that pre-authorizes and then
  paraphrases its own dispatch prompt passes the validator clean. Items 1, 2, 3,
  5, 8, 11, 14, and 15 are checks over ground truth — source text, byte diffs,
  git state, process state — item 4 is a schema check over a self-report, and it
  covers the failure that actually occurred. The honest closure is transcript-side
  or splitting ledger authorship away from the driver; neither is in scope here.
- **Node 7's independence is nominal.** `superpowers:requesting-code-review`
  reviews work produced by the same run that dispatches it, has no autonomous
  mode, and cannot be gated on the predicate. It is a review, not an independent
  one.
- **No cost or wall-clock budget.** Per-node caps exist (`gate-qc` three,
  `review` two) and per-node models are assigned, but nothing bounds a whole
  run. Accepted by the owner on 2026-08-17: a run that consumes a full session
  window is not a failure worth engineering around before the workflow runs end
  to end. Revisit once the lock and the gate are measured.
- **The env sentinel proves loading, not enforcement.** Scope item 9 proves the
  profile file was loaded. It does not prove any individual deny rule fired, and
  the two unenforceable Bash boundaries (`nohup`, trailing `&`) stay convention
  regardless.

## Non-goals

- Clearing backlog packages — that is what this unblocks, not this
- The UI pack (`graph-ui-shape`) and backend enrichment pack
  (`graph-enrich-define`)
- Rewriting `PRD/instructions/receipts/*` or `PLAN-spine.md` to remove their
  historical Cursor references — receipts are durable history
- Renaming or restructuring `.agents/skills/` beyond its new role as the mirror
- Routing the eleven existing disk-writing scripts through
  `scripts/lib/protected-paths.mjs` — the helper guards protected paths, it does
  not become the repository's general write layer
- PRD corpus reorganization; scheduling
- Re-measuring item 5 as a wording experiment
- Ruling on `rescue/fixture-leak-card-collection-20260817` — tracked as Q-005,
  decided when `card-collection-manager` is next picked up

## Sequencing

1. On `feature/graph-workflow-spine`: DEC-163, DEC-164, DEC-165, Q-005, this
   brief, the package `README.md`, and the preserved build ledger
   (`.superpowers/sdd/PLAN-spine/progress.md` — 26KB, git-ignored, this machine
   only). Then **merge PR #90**, with its two unmeasured gates recorded as
   known-and-accepted in DEC-163's notes.
2. On a fresh branch off `main`: items 1–16 above, in that order. The Cursor drop
   goes first because items 2 and 3 both depend on which trees exist, and it
   must land after #90 merges — those 31 commits touch the skill trees. Item 8
   is the first thing after the write-guard foundation, because a profiled run
   cannot reach node 9 without it.

Owner approved merging #90 before the hardening lands, so the backlog is not
frozen behind an unreviewable 31-commit, +15,373-line PR.

## Decisions already made — do not relitigate

- The "never modify `thejudge-*` skills" constraint was revoked 2026-08-14
- Mockups use the Artifact tool + `artifact-design`; the braindump's
  "superpowers draw skill" does not exist
- Dirty checkout is auto-commit small / auto-stash large, 10 files / 200 lines,
  in a tested pure function
- Human gates park at `owner-action` rather than asking in-session
- The graph delegates; it does not reimplement phases
- Cursor is dropped and `.claude/skills/` is canonical (owner, 2026-08-17)
- The portable guide in `docs/prd-workflow-guide/` is scrubbed too, not left
  generic (owner, 2026-08-17)
- `define` parks on the **whole** `PRD/sections/` diff, not new `DEC-###` alone,
  and `graph-gate-review` ships with it (owner, 2026-08-17)
- Working directories are pinned **and** node 6's write scope is asserted — not
  the prompt fix alone (owner, 2026-08-17)
- A concurrency lock now; no cost or wall-clock budget yet. A run that consumes a
  full session window is acceptable until the workflow runs end to end
  (owner, 2026-08-17)

## Verification

- `npm run quality:check` green, including the new `test:scripts` guards
- `npm run skills:ai-sync` succeeds at the end of **slice 1**, before the Node
  port exists, and `diff -rq .claude/skills .agents/skills` produces no output
  after it — the repoint is proved in the slice that deletes `.cursor/`
- `diff -rq .claude/skills .agents/skills` produces no output after
  `npm run skills:ai-sync`
- `protected-write-guard.test.mjs` passes on the current tree with its exemption
  list holding exactly one entry — including `dev.mjs` and `graph-preflight.mjs`,
  which a substring matcher fails — and fails a deliberately planted script that
  writes to a protected path
- Both §1 gate commands exit non-zero: no tracked path under `.cursor/`, and no
  `cursor` word-match outside the five legitimate-keep categories. The five are
  part of the criterion, not an oversight in it — DEC-165's own body is one of
  them
- The Node sync's output is byte-identical to the bash script's, proved by
  `diff -rq` against the pre-port mirror
- Fixture item 5 measured 3 of 3 against the validator, with variance recorded
- `thejudge-cleanup` fixture measured and recorded
- The node-command enumeration in slice 8 is recorded in the slice doc, and every
  command in it resolves to an `allow` entry in `.claude/graph-profile.json` or
  is deliberately denied with the node's park/`PROMPTED` behavior stated
- A dry-run of node 9's delete mechanism against a scratch package folder
  completes under the profile without a prompt
- `graph-preflight` reports the env sentinel's value; a session launched without
  `--settings` reports absent and the ledger reads `unverified`
- A `thejudge-cleanup` run against a package holding a `GRAPH-RUN.md` refuses to
  delete the folder until the receipt carries `## Graph run` with both tables
  verbatim
- `git add -A` and `git add .` are refused under the profile, and a path-scoped
  `git add PRD/work/<slug>/README.md` still succeeds
- A `define` node that writes nothing to `PRD/sections/` advances to `gate-qc`
  without parking; one that writes a single REQ row parks with that row's
  complete diff under `## Open gate`
- `graph-gate-review` run against a parked package leaves `STATUS.refined`, a
  resolved `## Open gate`, a `## Gate verdicts` section with one row per stable
  ID, and a `/graph-run` that resumes at `gate-qc` rather than parking again
- A `reject` verdict removes the ID from `PRD/sections/` and no later refinement
  reuses that number
- Every dispatch prompt in a completed `GRAPH-RUN.md` contains an absolute
  `Working directory:` line, verified by the ledger check
- A second `graph-run` launched while a run holds the lock refuses and names the
  holding slug, run ID, and PID; a lock held by a dead PID is reported stale
- `thejudge-implement-all` and `thejudge-cleanup` each carry a `## Mode` section
  naming `graph-run is controlling`, and cleanup's fixture measures it
- Every fixture run ends with the rig's after-snapshot asserting
  `git -C <real-repo> status --porcelain` empty. Recording results into
  `dirty-checkout-and-gate.md` under `## Measured runs` happens **after** that
  assertion passes, as a separate deliberate commit — the clean-tree criterion
  applies to the run, not to the act of recording it
