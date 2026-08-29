# Design brief — overnight-run-tuning

Package 2 of the docs-refactor. Tune the graph workflow so an overnight batch
runs unattended and reviews on the owner's schedule. Interactive package — not a
graph run, not a sweep — because it edits `graph-*` skills, the graph contract,
and `scripts/`, which an automated run may not patch on itself.

**Plan of record:** `PRD/work/adhoc/refactor-gameplan.md` (Package 2 row +
Binding constraints 11–14). **Run evidence tuned against:**
`PRD/work/adhoc/graph-run-shakedown-report.md` (Q7, node mistake 2, §5).

## The owner experience (repeat-out-loud)

You kick off run one before bed. In the morning you run one command
(`npm run graph:digest`) and read a summary. You open the package's questions
file and mark accept / edit / reject per item, on your own schedule. Later you
kick off run two; it applies your answers and implements. You merge two PRs.
Nothing branches off a stale `main` — the tool refuses to.

## Settled constraints (not relitigated — inputs, not decisions)

- **11 — two runs, two PRs.** Run one stops at quality-check PASS with the
  package `refined`, a docs-only PR, and a questions file. Run two is
  `/graph-run PRD/work/<slug>/`. The only *contract* change is the stop
  condition; the node table and every boundary stay unchanged.
- **12 — async markdown gate.** Gates are answered in a markdown file with
  answer slots, not walked live. The run parks and ends.
- **13 — queue continues past a park, halts on a failure. Sequential only** —
  the run lock is a single path holding one slug.
- **14 — Phase A is calendar-bound** (~7 gate sittings), not compute-bound.

## Owner decisions taken during refinement

| Decision | Choice | Why |
| --- | --- | --- |
| base→main enforcement (Q7) | **Preflight gate + digest reminder; keep the two-branch shape** | Hard-blocks the actual failure (branching off a stale `main`) and surfaces a daily reminder, without touching any boundary |
| CODE-HEALTH.md | **Drop from the gameplan** | Never load-bearing; Phase A shipped without it; Package 0's DUPLICATION-AUDIT already covers code-health observation |
| Morning digest delivery | **Standalone read-only script** | The queue spans multiple packages, so no single run can summarize the others |
| When the base→main PR is opened | **At run one, docs-only, grows later** | Strongest form of "can't be forgotten" — the PR into `main` always already exists — and lets the owner see the design PR the morning after run one |

## Scope — five changes

### 1. Two-run split (the stop condition moves)

Run one drives `preflight → shape → define → gate-qc`. Two behavior changes at
`define` and at the gate-qc PASS boundary; every node's own logic is unchanged.

- **At `define`:** a non-empty `PRD/sections/` diff no longer parks the run
  live. The driver writes the diff into the questions file (§3) and **continues**
  to `gate-qc`. An empty diff (a pure-tooling package) writes no questions file.
- **At gate-qc PASS:** run one **parks** at `owner-action`, opens the docs-only
  base→main PR (§4), records the questions file (if any) as the open gate, and
  ends. The docs PR carries `DESIGN-BRIEF.md`, any `PRD/sections/` truth,
  `GRAPH-RUN.md`, the package `README.md`, and `GATE-QUESTIONS.md`.
- **gate-qc FAIL** loops to `define`, max 3, exactly as today.

Run two resumes with `/graph-run PRD/work/<slug>/`: `graph-gate-review` applies
the answered questions file (§3), which restores `STATUS.refined`; the run then
re-enters at `gate-qc` via the existing `STATUS.refined → gate-qc` entry — so any
owner edit is re-validated for free — then `plan → build → review → land →
close`.

**Ordering note (recorded, not a new question):** gate-qc runs in run one on the
refinement output, and again in run two after the owner's answers are applied.
The second pass is the safety of re-grading human-edited truth; it reuses the
existing entry-point table and needs no special case.

### 2. base→main made impossible to skip (Q7 / constraint 13)

The two-branch shape (`preflight` creates base `thejudge-auto/<slug>`; `build`
opens `-work` → base; owner merges at `land`; base→main is the owner's final
hop) is **kept**. Enforcement is added on two sides:

- **Run one opens the base→main PR** (`gh pr create --base main --head
  thejudge-auto/<slug>`). Opening a PR is not merging, so no boundary is
  touched (`gh pr merge` / `gh pr close` stay denied). The PR exists from run one
  and grows as run two fills the base branch.
- **`graph-preflight` refuses a fresh run while a prior base→main PR is open.**
  A new pure function `classifyPendingBaseToMain(openPRs, newBranch)` in
  `scripts/graph-preflight.mjs` — shaped like `classifyLock` / `classifyCanary`,
  covered by `scripts/graph-preflight.test.mjs` — blocks when any open PR has
  base `main` and a `thejudge-auto/*` head that is **not** `newBranch`. The
  script feeds it `gh pr list --base main --state open --json headRefName,url`.
  The resume path (`--take-lock`, no `--branch`) skips the check — run two's own
  base→main PR is legitimately open.
- The digest (§3) lists every pending base→main PR as a reminder.

### 3. Async markdown gate (constraint 12)

- **`PRD/work/<slug>/GATE-QUESTIONS.md`** — written by the driver at `define`
  when the `PRD/sections/` diff is non-empty. One block per new stable ID:
  the item restated in plain product terms first, then that ID's **complete**
  diff, then an answer slot:

  ```markdown
  ## REQ-XYZ

  <plain-product restatement — what a player would experience or do>

  <the complete diff for this ID>

  - Verdict: <accept | edit | reject>
  - Reason (required for edit/reject):
  ```

  A trailing `## Blocker questions` section holds any genuine decision blocker,
  each with its own answer slot. The file is the single async surface the owner
  fills in.

- **`graph-gate-review` is rewritten from a live walk into a reader.** It parses
  the answered `GATE-QUESTIONS.md`, applies `edit` / `reject` verdicts **inside
  the recorded diff only**, writes `## Gate verdicts` to the ledger, resolves the
  gate, and restores `STATUS.refined`. It **refuses on any blank verdict slot** —
  an unanswered gate cannot resume. `accept` leaves the run's text standing;
  `reject` reverts that ID and burns the number (never reissued), exactly as the
  live walk did. No verdict may be supplied on the command line — the file is the
  input.

### 4. The docs-only PR (run one)

Opened at the gate-qc PASS stop, base `main`, head `thejudge-auto/<slug>`. It is
"docs-only" because no code exists yet: `DESIGN-BRIEF.md`, any `PRD/sections/`
truth refinement proposed, the questions file, and the ledger. It is the same PR
that later carries the implementation (run two pushes to the base branch through
`build`'s `-work` → base PR and `close`'s receipt push), so the owner merges it
once, last. This is the base→main PR of §2 — one artifact, not a second.

### 5. Morning digest

`scripts/graph-digest.mjs` — read-only, no writes, no network mutation. Inputs:
`PRD/work/*/GRAPH-RUN.md` ledgers, `PRD/instructions/receipts/*.md`, and
`gh pr list --base main --state open`. Output per package: terminal state,
current node, the open questions file path if parked at an async gate, and any
pending base→main PR. A pure formatter over parsed inputs, covered by
`scripts/graph-digest.test.mjs`; wired as `npm run graph:digest`.

## Loose ends folded in

- **CODE-HEALTH.md dropped** from `PRD/work/adhoc/refactor-gameplan.md` (the
  Phase A "Each run also emits a `CODE-HEALTH.md`" line and any dependent
  reference).
- **`PRD/work/adhoc/PROGRESS.md` corrected:** Package 2 is no longer "blocked on
  the graph tooling fixes" (merged as PR #131 / #132); the "base→main merge has
  no automation or reminder" loose end is resolved by §2 and struck.

## Non-goals

- No change to the node table, the per-node models, the caps, or any boundary in
  the deny list.
- No collapse of the two-branch shape to direct-to-`main` (the rejected Q7
  option).
- No `PostToolUse` result-inspecting evidence model (shakedown Q3 / stated limit
  3) — out of scope, unchanged.
- No new `REQ`/`FLOW`/`DEC` IDs. This is process truth; the design record is this
  brief. No `PRD/sections/` product-truth edits, so run one on **this** package
  produces an empty define diff and no questions file of its own.

## Files touched (implement phase — map-out slices this)

| File | Change |
| --- | --- |
| `PRD/instructions/graph-workflow-contract.md` | Stop condition (two-run split), async-gate answer mechanism, run-one base→main PR, preflight base→main guard reference |
| `.claude/skills/graph-run/SKILL.md` + `reference.md` | `define` no-live-park + questions-file write; gate-qc-PASS stop + docs PR open; base→main PR at run one |
| `.claude/skills/graph-gate-review/SKILL.md` | Reader rewrite — parse/apply an answered file, refuse blank slots |
| `.claude/skills/graph-preflight/SKILL.md` | Base→main guard step on the fresh-run path |
| `scripts/graph-preflight.mjs` (+ `.test.mjs`) | `classifyPendingBaseToMain` pure function + `gh pr list` wiring |
| `scripts/graph-digest.mjs` (new, + `.test.mjs`) | Digest formatter; `package.json` `graph:digest` script |
| `PRD/work/adhoc/refactor-gameplan.md` | Drop CODE-HEALTH.md |
| `PRD/work/adhoc/PROGRESS.md` | Unblock Package 2; strike base→main loose end |

## Testing

Every enforcement piece is a pure function with a `node --test` file under
`scripts/`, joining `test:scripts` (`node --test scripts/*.test.mjs`) by
existing. `npm run quality:check` is the gate. Skill/contract prose changes are
validated against `PRD/instructions/skill-testing.md` fixtures where one applies;
after skill edits, `npm run skills:ai-sync` mirrors `.claude/skills/` into
`.agents/skills/`.
