# Design brief — graph-single-door-workflow

- Slug: `graph-single-door-workflow`
- Decision: DEC-167
- Requirements: REQ-160..164
- Flows: FLOW-021, FLOW-022
- Supersedes in this package: `IDEA.md`, whose first grounded bullet is now
  discharged — `graph-run-boundary-enforcement` deleted the `graph-ui-shape` /
  `graph-enrich-define` line and DEC-166 claims that deletion explicitly

## The outcome

The owner types one thing and nothing else. An idea, an observation, a bug, or
a generated context document all enter at `/graph-run` and walk the same
lifecycle. The owner names no branch, picks no orchestrator, and classifies
nothing before describing it. The only in-flow decision point is the `define`
gate, which parks on any `PRD/sections/` diff and walks new product truth one
stable ID at a time.

## What is already true — do not re-litigate

Verified against the current tree, not from memory.

- **The door half-exists.** `graph-run`'s `## Goal and inputs` already accepts
  "a request plus `--branch <name>` to start a new package from scratch", and
  node 2 (`shape`) delegates to `thejudge-kickoff`, which writes `IDEA.md` and
  the README from a raw description. The lifecycle behind the door needs no
  change.
- **No depth grading is needed, and the idea's reasoning for that holds.** The
  `define` gate parks only on a **non-empty** `PRD/sections/` diff —
  `graph-run` step 5 states that an empty diff advances straight to `gate-qc`
  and that refinement writing only `DESIGN-BRIEF.md` never interrupts a run. So
  a change that touches no product truth costs tokens and wall-clock, never
  owner attention. Uniform depth is affordable.
- **Nothing in the workflow branches on frontend versus backend.** The one
  stray line that did was deleted by `graph-run-boundary-enforcement`.
- **14 skills exist today** — 11 `thejudge-*`, 3 `graph-*`. This package
  deletes none of them.

## What is broken

1. **Two orchestrators compete.** `thejudge-prepare` and `graph-run` both turn
   one request into one package. Choosing between them is the last nuanced
   per-step call the owner makes at intake.
2. **`--branch <name>` is mandatory and never inferred.** The owner invents a
   branch name before describing the thing.
3. **Slug and branch are born at different nodes.** `graph-preflight` is node 1
   and requires `--branch`; the slug is proposed at node 2 by
   `thejudge-kickoff`. Nothing reconciles the two names.
4. **No skill reads `PRD/instructions/receipts/`.** Verified by grep across
   `.claude/skills/`. A run against already-shipped code starts blind to the
   receipt documenting how that code was built.
5. **`NO ACTIONABLE PACKAGE` has no edge in `graph-run`.** Verified by grep:
   the string appears in `thejudge-kickoff` and `thejudge-prepare` and nowhere
   in `graph-run` or the contract. A request too thin to package leaves the
   driver with an outcome it has no rule for.
6. **Context documents cannot be handed to the door.** The
   `graph-run-boundary-enforcement` receipt records this exactly: its six
   findings came from `docs/whatIsGraph/graph-hardening-handoff.md`, the
   promotion checklist expected that file marked closed or retired, and cleanup
   could do neither because the file is untracked local material outside the
   repository. The evidence chain for a shipped package points at a file that is
   not in the repository.

## How this package is built

**An ordinary session, not a graph run.** This is the one package the graph
cannot build.

REQ-161, REQ-162, and REQ-163 all edit `thejudge-*` skills — `thejudge-kickoff`
takes a supplied slug and greps receipts, `thejudge-refinement` reads `intake/`,
`thejudge-cleanup` writes `## Intake`. `graph-workflow-contract.md`'s
`## Boundaries` forbids a graph run from modifying any `thejudge-*` skill in
either synced tree, and `.claude/graph-profile.json` denies
`Edit(./.claude/skills/thejudge-*/**)` and its `.agents/` twin. A graph run
would end `PROMPTED` on most of these slices.

The boundary stays exactly as written. It exists so an autonomous run cannot
rewrite the skills that govern it, and this package is that case — a run
editing its own intake path mid-flight. Map-out plans for a normal session.

## Scope

### 1. `graph-run` is the single door

`--branch <name>` becomes optional. Supplied, it is used verbatim and overrides
derivation. Omitted, the door derives it.

`thejudge-prepare` stops being named as an entry point. Two places in
`AGENT-SKILLS.md` carry that claim, and both are named here because neither is
an "entry point" heading:

- the `## Workflow sequence` mermaid diagram (`AGENT-SKILLS.md:37-38`), whose
  two `prepare` edges — `prepare -. controls .-> kickoff` and
  `prepare -. READY after human merge .-> implementall` — become `graph-run`
  edges. **Yes, `graph-run` joins the diagram**, in `thejudge-prepare`'s place:
  a diagram that drops the retired door and names no replacement shows no door
  at all
- the skill-catalog `When` cell for `thejudge-prepare` (`AGENT-SKILLS.md:72`),
  which stops reading as an intake route and names the skill as callable but
  not an entry point

`PRD/instructions/graph-workflow-contract.md` gains `graph-run` as the named
entry point for new work. Nothing is removed there: the contract never named
`thejudge-prepare` as an entry point. Its six mentions are the
`thejudge-prepare is controlling` predicate and README section ownership, and
they stay.

Also corrected while in the file: `## Graph workflow skills` opens "Two
`graph-*` skills" over a three-row table (`graph-preflight`, `graph-run`,
`graph-gate-review`). It becomes three.

The skill file stays, `PRD/instructions/preparation-contract.md` stays
unchanged, and the `thejudge-prepare is controlling` predicate stays live in all
six phase skills that read it. This retires a door, not a contract.

### 2. The door names the work before node 1

The door proposes the slug from the request and any intake material, then uses
`thejudge-auto/<slug>` as the branch — the convention already in the repository's
merge history. It passes that slug to node 2, which uses it rather than
proposing a second name.

This exists to resolve an ordering problem, not for tidiness: node 1 needs a
branch and node 2 is where slugs are born, so without the door proposing first
the two names are decided independently and can disagree.

### 3. Intake material

`/graph-run "<request>" [paths...]`, or markdown pasted in the same message.

- **Copied, not referenced.** Referencing is the failure the
  boundary-enforcement receipt already recorded.
- **Staged outside the working tree, committed by node 2.** The door mints the
  `--run-id` itself before node 1 and passes that same id to `graph-preflight`,
  which already treats `--run-id` as caller-chosen and optional
  (`graph-preflight/SKILL.md:26-29`). The staging path is derived from it. The
  door writes each item verbatim into `.worktrees/.graph-intake/<run-id>/`
  before node 1. Node 2 reads it there and, once `thejudge-kickoff` has created
  `PRD/work/<slug>/`, copies it into `intake/`, commits it on the branch, and
  deletes the staged copy.

  **The staging path is recorded in the ledger at node 2, not before node 1.**
  The ledger is `PRD/work/<slug>/GRAPH-RUN.md` (contract:239) and the package
  folder is born at node 2, so there is nothing to write to earlier — the same
  ordering trap the intake folder itself hit. Node 2's first ledger write
  carries it.

  Staging has to sit outside the working tree because node 1 resolves the
  working tree before the branch exists. `classifyWorkingTree` in
  `scripts/graph-preflight.mjs:99-113` stashes a tree over 10 files or 200
  changed lines, the untracked scan at line 213 feeds it, and line 246 stashes
  with `git stash push -u`. Written into the package up front, a 276-line
  handoff is stashed off before the branch exists and node 2 reads an empty
  folder; under the threshold it lands only as a side effect of
  `chore(graph): auto-commit working tree before graph run`. The same sweep
  takes the untracked *source* file, so the copy the door stages at launch is
  the only one the run is guaranteed to read. `.worktrees/` is gitignored, and
  `git stash push -u` spares ignored paths.
- **Evidence, not authority.** Refinement weighs intake and still makes every
  product decision with the owner at the `define` gate. Intake may state
  findings, mark matters settled, and propose a slug; it cannot decide product
  truth. Material that could bind refinement would route product truth around
  the gate, which is the one thing this design protects.
- **What is handed in, nothing transitively.** A cited source document is
  recorded as a citation and not fetched. Transitive following is unbounded.

`graph-hardening-handoff.md` is the worked example: it declares itself
kickoff-and-refinement input, states "Nothing here is a decision — refinement
makes those with the owner", and proposes its own slug.

### 4. Prior-run linking

Node 2 greps `PRD/instructions/receipts/` — already named `<slug>-<date>.md` —
for slug and keyword matches and writes one `## Prior run` line per match into
`IDEA.md`. Refinement reads them as input.

A flat list of matches, not a chain walk: receipts carry no parent pointer, so
there is nothing to walk. A miss costs a blind run, not a wrong one.

### 5. A request too thin to package ends `BLOCKED`

`graph-run` gains an edge for `NO ACTIONABLE PACKAGE` returned by node 2.

It is `BLOCKED`, not `PARKED`. `PARKED` means the run resumes from a recorded
gate, and a thin request leaves no artifact to resume from — recovery is a new
run, not a resumption. The mechanical form of the same point holds on the intake
path too: parking needs a package folder for the `## Open gate` ledger section, a
`STATUS.*` marker, and a board row, and none of the three exists, because
`thejudge-kickoff` returns `NO ACTIONABLE PACKAGE` without creating them and
intake stays staged outside the working tree until node 2 has created the
package folder.

**`graph-run`'s own definition has to be widened, and this package does it.**
As written (`graph-run/SKILL.md:328-332`), `BLOCKED` is "an external condition
outside the repository", `PARKED` is "anything requiring a human decision,
judgment, or review", and the tiebreak is "when it is not clear which applies,
park". A thin request is neither external nor outside the repository, so the
paragraph as it stands sends it to `PARKED` — which, per the mechanical
argument above, has nothing to park against. The implementer amends that
paragraph so `BLOCKED` covers a request too thin to package. This is the only
terminal-state text the package changes, and DEC-167 claims it.

`BLOCKED` already requires "what exists, what does not, and recovery action",
which is the right shape. No fifth terminal state is added.

**The report names the branch it left behind.** Node 1 runs before node 2 can
judge the request, so this `BLOCKED` always leaves a pushed
`thejudge-auto/<slug>`. The run does not delete it: `graph-preflight`'s contract
forbids tidying a failed run, and node 1 may have auto-committed real
working-tree changes onto it. So the report names the branch, whether node 1
committed or stashed, and the staging path holding any intake — and the recovery
action is a fuller description **plus an explicit `--branch`**, because the same
description derives the same slug and `graph-preflight` exits 2 on the collision
(`.claude/skills/graph-preflight/SKILL.md:118`).

### 6. Cleanup folds intake into the receipt

`thejudge-cleanup` writes an `## Intake` section naming each intake file and its
stated origin, so deleting `PRD/work/<slug>/` loses nothing traceable. This
discharges the first follow-up on
`PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md`.

### 7. In-flight bugs are unchanged

A new issue against an `active`, already-mapped-out package still goes to
`thejudge-amend`. A second package against the same code gives two branches
touching the same files.

### 8. Files touched

| File | Change |
| --- | --- |
| `.claude/skills/graph-run/SKILL.md` | optional `--branch`; slug and `--run-id` minted before node 1; intake staging; `NO ACTIONABLE PACKAGE` edge; widened `BLOCKED` definition |
| `.claude/skills/thejudge-kickoff/SKILL.md` | **accepts a supplied slug** instead of always proposing one; greps `PRD/instructions/receipts/`; copies staged intake into `intake/` |
| `.claude/skills/thejudge-refinement/SKILL.md` | reads `PRD/work/<slug>/intake/` as an input when the folder exists |
| `.claude/skills/thejudge-cleanup/SKILL.md` | writes `## Intake` into the receipt before deleting the package |
| `PRD/instructions/graph-workflow-contract.md` | names `graph-run` as the entry point; intake rules; ledger's node-2 staging line; `NO ACTIONABLE PACKAGE` edge |
| `AGENT-SKILLS.md` | mermaid diagram (`:37-38`), `thejudge-prepare` catalog `When` cell (`:72`), "Two `graph-*` skills" → three |
| `.agents/skills/**` | mirror of every `.claude/skills/` change, via `npm run skills:ai-sync` |
| `PRD/instructions/skill-fixtures/` | fixtures per `PRD/instructions/skill-testing.md` |

`thejudge-kickoff` gaining a slug input is the one change implied by REQ-161
rather than stated by it, so it is named explicitly here.

## Non-goals

- Deleting any skill. All 14 remain callable. Deletion is revisited only after
  the flow has run several times.
- Depth grading by request size. Every entry takes the full path.
- A separate debug or bug door. Classifying a thing before describing it is the
  nuanced call being removed.
- Any change to what the `define` gate parks on, or to the node table, models,
  caps, loop limits, or boundaries. The `BLOCKED` definition is widened on
  purpose (scope 5) — that is a terminal-state definition, not a boundary, and
  it is the only such text that moves.
- Relaxing the boundary that forbids a graph run from editing `thejudge-*`
  skills. It stays as written; this package is built in an ordinary session
  instead.
- Following intake citations transitively.
- Committing `docs/whatIsGraph/` into the repository. Sweeping untracked working
  material in is the owner's call, as the last receipt recorded.

## Decisions taken

| Decision | Choice | Why |
| --- | --- | --- |
| Number of doors | One | A separate debug door forces classification before description |
| Depth grading | None | The `define` gate never fires on an empty `PRD/sections/` diff, so uniform depth costs no owner attention |
| `thejudge-prepare` | Retired as an entry point; skill and contract kept | The `define` gate is an earlier and finer checkpoint over the same material |
| Branch naming | Derived `thejudge-auto/<slug>`; `--branch` overrides | Node 1 needs a branch before node 2 proposes a slug |
| Intake storage | Verbatim copy into `PRD/work/<slug>/intake/` | Referencing untracked material is a recorded past failure |
| Where intake is staged | `.worktrees/.graph-intake/<run-id>/`, committed into the package by node 2 | Node 1 stashes or auto-commits the working tree before the branch exists, taking the intake and its untracked source with it |
| Intake status | Evidence, never authority | Binding refinement would route product truth around the `define` gate |
| Intake citations | Recorded, not followed | Transitive following is unbounded |
| Prior runs | Grep receipts, flat list of matches | Receipts have no parent pointer to chain |
| Thin request | `BLOCKED` | Nothing exists to resume from; no package folder exists to park against either |
| `graph-run`'s `BLOCKED` wording | Widened to cover a thin request | As written, `BLOCKED` is external-only and the tiebreak parks, so a thin request lands in `PARKED` with nothing to park against |
| Where the staging path is recorded | Node 2's first ledger write | The ledger lives in the package folder, which node 2 creates |
| Who builds this package | An ordinary session, never a graph run | A graph run may not edit `thejudge-*` skills, and three of them change here |
| `graph-run` in the workflow diagram | Yes, in `thejudge-prepare`'s place | Dropping the retired door without naming a replacement leaves the diagram with no door |
| Branch left by a `BLOCKED` run | Reported, never deleted; retry needs `--branch` | Node 1 may have committed real work onto it, and the same slug re-derives into an exit-code-2 collision |
| Shipped work throws an issue | New run, prior-run link | Amend refuses packages that are not `active` |
| In-flight work throws an issue | `thejudge-amend`, unchanged | Two packages against one file set means two branches on the same code |

## Stated limits

- **Prior-run matching is keyword matching over filenames and receipt text.** It
  will miss a receipt whose slug shares no words with the request, and it may
  offer an irrelevant one. Refinement reads matches as input, so a false match
  costs a read rather than a wrong decision.
- **Slug derivation is a guess.** The door proposes; the owner overrides with
  `--branch`. Intake proposing its own slug is honored ahead of derivation.
- **Intake is copied at the size handed in.** A large document is copied whole
  and read by node 2 within its existing tool-call cap. No size gate is added,
  because a gate would refuse exactly the thorough handoff this feature exists
  to accept. Node 1's own 10-file / 200-line thresholds are a size gate the
  first pass of this design did not account for; staging outside the working
  tree is what keeps them off the intake path.
- **A `BLOCKED` run leaves a branch and a staged intake folder behind.** Both
  are named in the report and neither is cleaned up automatically. Retrying
  without `--branch` fails at node 1 rather than silently reusing them.
- **"Evidence, not authority" is a contract rule, not an enforced one.** No
  mechanism prevents refinement from adopting an intake claim wholesale. What
  catches it is the `define` gate: any resulting `PRD/sections/` diff parks for
  the owner to walk one stable ID at a time.

## Verification

- Implemented in an ordinary session — see `## How this package is built`. A
  graph run PROMPTED-parks on the `thejudge-*` edits.
- Every requirement below is satisfied by skill and contract text plus fixtures
  under `PRD/instructions/skill-fixtures/`, per `PRD/instructions/skill-testing.md`.
- `npm run skills:ai-sync` then `diff -rq .claude/skills .agents/skills` produces
  no output.
- `npm run quality:check` green.

## Requirement references

- REQ-160 — `graph-run` is the single intake door
- REQ-161 — the door names the work before node 1
- REQ-162 — intake material is copied, bounded, and non-authoritative
- REQ-163 — prior shipped runs are linked from the receipts corpus
- REQ-164 — a request too thin to package ends the run at `BLOCKED`
- FLOW-021 — owner reports a bug on shipped code
- FLOW-022 — owner hands the door a context document
- DEC-167 — the governing decision
