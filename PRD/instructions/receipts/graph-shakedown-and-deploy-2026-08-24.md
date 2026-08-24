# Receipt — graph-run shakedown and the Lambda deploy

2026-08-23 into 2026-08-24. No work package: this closed out the first
autonomous `/graph-run` and then chased a broken production deploy that
surfaced while doing it.

The durable record of the audit itself is
[`codebase-duplication-audit-2026-08-23.md`](./codebase-duplication-audit-2026-08-23.md).
This receipt covers the tooling and deploy work around it, and hands off what
is still open.

---

## What shipped

Six pull requests, all merged to `main`.

| PR | What |
| --- | --- |
| [#97](https://github.com/ChrisMiho/TheJudge/pull/97) | Audit work branch onto the autonomous base |
| [#98](https://github.com/ChrisMiho/TheJudge/pull/98) | Audit onto `main`; run recorded `COMPLETE` |
| [#99](https://github.com/ChrisMiho/TheJudge/pull/99) | Lock release has a declared path; `unlink` hole closed |
| [#100](https://github.com/ChrisMiho/TheJudge/pull/100) | Lambda package — **insufficient, see below** |
| [#101](https://github.com/ChrisMiho/TheJudge/pull/101) | Graph tooling: lock, canary, retry guard, park budget |
| [#102](https://github.com/ChrisMiho/TheJudge/pull/102) | Lambda package — corrected |

`main` moved `4e8314f → ded3d8a`. Script tests went 371 → 397.

### The deploy was broken for three days

`deploy` failed on every push to `main` from #96 (2026-08-22) until #102.
Nothing caught it because the job only runs on push — every pull request
reported it as `skipping`, so #96 went green as a PR and broke trunk on
landing.

Two independent causes.

**The package counted all data twice.** `npm ci` links
`node_modules/@thejudge/backend` back to `apps/backend`, and `zip -r` follows
that symlink. `zip -qry` stores symlinks instead: 181.6MB became 93.2MB with
no content change. `package-lambda.sh` also never removed a previous
`dist/lambda.zip`, so `zip` appended to it — harmless in a fresh CI checkout,
and the reason an early local measurement was nonsense.

**The combo corpus outgrew the limit.** Variants now need at least two decks
running them (`MIN_VARIANT_POPULARITY = 2`).

| | Before | After |
| --- | --- | --- |
| Variants | 106,182 | 50,686 |
| Detail artifact | 76.9 MB | 35.8 MB |
| Index | 4.8 MB | 2.6 MB |
| Zip | 181.6 MB | 46.2 MB |
| Upload request | — | 61.6 MB against a 66.9 MB limit |

Confirmed by the push-triggered run after #102 merged — `deploy: success`,
first green deploy since 2026-08-21. Frontend and API both published.

### Graph tooling

Six of the seven defects from the shakedown, plus the retry guard.

- **Nothing took the lock.** `takeLock()` and `classifyLock()` had zero
  callers. The script takes it now and refuses rather than stealing a `held`
  or `stale` lock.
- **The resume path had no lock step even in principle.** A resume never
  re-runs the branch work, so nothing armed the graph tier.
  `--take-lock --slug` does that and nothing else.
- **The lock recorded a dead pid.** Node exits when the script returns, so a
  lock carrying `process.pid` reads `stale` to the very next run. `--pid` lets
  the driver name its own session.
- **The canary could not see the tier it claimed to prove.**
  `CANARY_COMMAND` is a universal-tier deny, so it fires whether or not a run
  holds the lock. `GRAPH_CANARY_COMMAND` is denied only while it does.
- **The hook denied prose that named a denied command.** Heredoc bodies were
  split on separators and each segment head matched as a command, so a commit
  message describing a rule could be refused.
- **A denied call could be cleared by trying again.** The hook records its own
  denials and refuses an identical later call as `denied-command-retry`.
- **The cap made its own instruction impossible.** At the cap every tool was
  denied, including `Read`, so the park the contract demands could not be
  written. Dispatches are now denied at the cap with a bounded 30-call park
  budget.

---

## Two mistakes worth keeping

**#100 did not fix the deploy, and the test I wrote to catch that shared the
bug.** `--zip-file fileb://` base64-encodes the archive, so the request is
about 4/3 the zip. The 70,167,211-byte limit applies to the request; the
usable zip ceiling is 50.2MB, which is AWS's documented 50MB direct-upload
quota seen from the other side. #100 measured a 53.8MB zip against 66.9MB,
passed, and failed the real upload at 71.7MB. The budget test encoded the same
wrong constant and certified it.

The ceiling is now derived rather than written down, and a test asserts that
the specific 53.8MB package which failed the real upload does not clear it.

**Defect 7 was found by getting stuck in it.** A verification lock re-armed
the graph tier over a stale `close/1` run-state, the cap fired, and every
subsequent tool call was denied — the park could not be written and the owner
had to remove two files by hand. A stale run-state file is worse than a
missing one: it parses, so the cap fires against a node that finished long
ago. Recorded in the contract's stated limits.

---

## Open, in the order it matters

### 1. The popularity floor is doing the wrong job

55,496 combos are excluded to fit a **packaging** limit, not because they lack
product value. Moving `aws-deploy.sh` from `--zip-file` to an S3 upload
(`--s3-bucket` / `--s3-key`) removes the base64 tax entirely and raises the
ceiling to 250MB unzipped. The floor could then go back to 1, or go away.

The owner asked to revisit this rather than decide it under deploy pressure.
Nothing is broken while it waits.

### 2. Defect 3 — evidence is filed per run, not per node

`readObservedEvidence` matches on `entry.runId` alone, and entries carry
`slice` but no node. Any step's tool calls can satisfy any step's acceptance
criteria: on the audit run, the planning node earned 7 of 21 criteria before
the build node started.

Deliberately out of scope for #101 — the owner scoped it out at the start and
confirmed it again. The narrow fix is stamping evidence entries with the node
that earned them, at the cost that legitimate work by an earlier step stops
counting and some criteria need rewording.

### 3. The `define` gate has still never fired

Every package this session changed zero product truth, so refinement wrote
nothing into `PRD/sections/` and the gate had no diff to stop on. It was
checked three ways on the audit run rather than taken on the node's word.

Testing it needs a package that genuinely writes product truth — the Phase A
spec, not more tooling work.

### 4. Housekeeping

Five merged branches are still present locally and on `origin`:

    feature/graph-tooling-hardening
    feature/graph-tooling-hardening-2
    fix/lambda-package-size
    fix/lambda-package-size-2
    implement-codebase-duplication-audit-1787530258

The last one cannot be deleted with `git branch -d` — squash merges do not
preserve ancestry — and `-D` is denied by the boundary hook. All are local or
remote feature branches with nothing unmerged; content fidelity was verified
before the audit package was deleted.

`PRD/work/adhoc/graph-run-shakedown-report.md` holds the original report with
in-place corrections. That directory used to be gitignored; the rule is removed
in this change so the doc-refactor planning files are visible in the tree and in
review. This receipt is still the durable record of the run.

---

## Resuming

The board is empty and no run is in flight. There is **no lock, no stop
sentinel, and no run-state file** — those three are what a new run checks, and
all three are absent. `.worktrees/` holds only leftovers from the completed
run and from verifying #101: `.graph-evidence.jsonl`, `.graph-node-calls.json`,
`.graph-denials.jsonl`, and `.graph-intake/`. All are gitignored scratch and
none blocks a new run, since evidence and denials are keyed by run id.

A new run starts clean:

    /graph-run "<request>" [intake paths...]

A resumed one now takes the lock first, which it did not before:

    node scripts/graph-preflight.mjs --take-lock --slug <slug> --run-id <id> --pid <driver pid>
