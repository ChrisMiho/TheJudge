# 03 — Work Packages

Everything about `PRD/work/` — the ephemeral layer where features are shaped,
planned, built, and then erased.

---

## The shape of a work package

One feature, one folder, one kebab-case slug:

```
PRD/work/invoice-export/
  README.md                    # package control file — status, slice table, resume point
  IDEA.md                      # the original 3-5 sentence idea
  DESIGN-BRIEF.md              # the approved product definition
  GAMEPLAN.md                  # architecture + slice dependency graph
  slice-a-storage-layer.md     # one implementable unit
  slice-b-export-endpoint.md
  slice-c-ui-and-ship.md
  STATUS.active                # empty marker file — exactly one per package
  braindump.md                 # optional: raw notes, screenshots, references
  mockups/                     # optional
  .playwright-mcp/             # optional: browser captures, git-ignored
```

Files appear as the package matures. At ideation there are three files; at
`active` there are ten. Nothing is created before the phase that needs it.

**The slug is permanent.** Never rename the folder to encode status. Skills,
slice docs, branch names, receipts, and PR bodies all reference it, and a rename
breaks every one of them silently.

---

## Package status vocabulary

| Status | Meaning | Typical next step |
| --- | --- | --- |
| `ideation` | An idea exists; nothing is defined | refinement |
| `refining` | The design brief is actively in flux | keep refining, or quality-check when approved |
| `refined` | Brief approved by a human; ready to gate | quality-check, then map-out |
| `active` | Gameplan and slices exist; implementation underway | implement |
| `ship-ready` | Every slice is `done` | cleanup |
| `owner-action` | Blocked on a human outside the agent loop | a human checklist |
| `deferred` | Parked; explicitly not next work | restore when it becomes next |

Happy path: `ideation → refining → refined → active → ship-ready → deleted`.

`owner-action` and `deferred` are off-path states. `deferred` is important in
practice — without it, packages that are real but not next either get deleted
(losing the work) or sit in `active` (making the board lie about what is in
flight).

---

## The three-marker rule

A package's status is recorded in exactly three places, and every skill that
changes status updates all three in the same edit:

1. **`PRD/work/<slug>/README.md`** — a `status: <value>` field, either as YAML
   frontmatter or as the first line. Preserve whichever format the package
   already uses and change only the value.
2. **`PRD/work/<slug>/STATUS.<value>`** — an empty marker file. Exactly one per
   package; renamed or replaced on every transition, never left doubled.
3. **A row in `PRD/work/STATUS.md`** — under the heading matching the status.

This looks redundant. It is, deliberately, and each copy has a distinct reader:

- The **README field** is what an agent sees when it opens the package it was
  told to work on. It is in-context and unmissable.
- The **marker file** makes status greppable from the filesystem without parsing
  markdown: `ls PRD/work/*/STATUS.*` prints the entire pipeline in one line. It
  is also the cheapest possible gate check for a skill.
- The **board row** is the human view — one screen showing everything in flight.

The redundancy also acts as a checksum. When the three disagree, something
crashed mid-transition, and you can see exactly where. Have your cleanup or
audit skill flag mismatches.

---

## The board — `PRD/work/STATUS.md`

Skill-maintained, and the *only* list of packages in the repo:

```markdown
# Work package status board

Skill-maintained. Glance with `ls PRD/work/*/STATUS.*` or this file.
Vocabulary and transition rules: `PRD/instructions/workflow-reference.md`.
Do not rename package folders to encode status.

## ship-ready

- [invoice-export](./invoice-export/)

## active

- [bulk-import](./bulk-import/)

## refined

## refining

- [audit-log-viewer](./audit-log-viewer/)

## ideation

- [saved-views](./saved-views/)

## owner-action

## deferred

- [multi-tenant-billing](./multi-tenant-billing/)
```

Headings are the status vocabulary in pipeline order, and empty headings stay
in place so the shape of the file is stable across edits. Rows are relative
links, which makes the board clickable in any markdown viewer.

---

## Document types, in lifecycle order

### `IDEA.md` — written at kickoff

Three to five sentences, no more. Three labelled parts:

```markdown
# IDEA: <short title>

**Problem:** <what is broken or missing today, concretely>

**Outcome:** <what is true after this ships>

**Non-goals:** <what this explicitly is not, especially adjacent work
it will be confused with>
```

The non-goals line does the heavy lifting. Ideas are captured in a hurry, and
the single most useful thing a future reader needs is the boundary. If the idea
came from a longer conversation or a raw dump, keep that as `braindump.md` and
keep `IDEA.md` short.

### `DESIGN-BRIEF.md` — written during refinement

The product definition, produced only after the refining agent has asked
clarifying questions and a human has explicitly approved the summary. It covers
scope, the decisions taken, non-goals, and the `REQ`/`FLOW`/`DEC` references it
creates or touches.

The brief is the last point at which product intent can be cheaply changed. It
is also the artifact the quality gate checks. It has no fixed template because
its shape follows the feature — but it must be specific enough that a different
agent could plan implementation from it without asking a question.

Refinement writes durable `PRD/sections/` updates *at the same time* as the
brief. That is intentional: product truth is settled before implementation
begins, not retrofitted after. The brief is the working document; the sections
are the record.

### The quality-check gate

Between refinement and planning sits a skill that only reads and only reports.
It produces an explicit **PASS** or **FAIL** against a checklist:

- Does the brief contradict any confirmed `DEC`?
- Does it use the project's established vocabulary?
- Does it respect the invariants in `technical-design-rules.md`?
- Is it implementable as written — could an agent start without asking?
- Are genuine ambiguities recorded as `Q-###` rather than assumed away?
- Is it consistent with the relevant catalogs?

FAIL sends the package back to `refining` with the complete issue list. PASS
leaves it at `refined`.

The value here is that the gate **cannot fix anything**. Its writes list is
empty apart from recording the verdict. A reviewer that is allowed to edit
becomes an author and stops reviewing. Keeping the gate read-only is what makes
its PASS mean something.

### `GAMEPLAN.md` — written during map-out

Architecture and sequencing, not product definition:

```markdown
# GAMEPLAN: <slug>

Authoritative design: `DESIGN-BRIEF.md`. Durable truth: DEC-###, REQ-###.

## Architecture

<Numbered seams: the shared abstractions to build, and the bounded leaf
changes that consume them>

## What must not change

<Explicit list of contracts, behaviors, and files that stay fixed>

## Slice dependency graph

    A shared foundation ──> B feature one ──┐
                        ──> C feature two ──┤
    D independent fix ──────────────────────┴─> E integration + ship gates

## Verification contract

<Which commands run per slice; which slices need browser verification;
where captures are written>

## Verification checklist

- [ ] <repo-wide checks that must pass before the package is ship-ready>
```

The "What must not change" section is worth calling out. Agents are much better
at respecting an explicit invariant list than at inferring one, and this is
where you stop a refactor from quietly changing a wire format.

### `slice-<letter>-<name>.md` — one per implementable unit

The most important document in the system, because it is the one a cold agent
is handed.

```markdown
# Slice A — <name>

## Status: planned

## Goal

<one objective, one sentence>

## Requirements

1. <specific, checkable requirement>

## Acceptance criteria

- [ ] <verifiable check>

## Verification

    <the exact command that proves it>

## Files touched

- `<path>`
```

Rules that make slices work:

- **One objective per slice.** If the goal sentence needs an "and," split it.
- **Every acceptance criterion is verifiable** — either by a named test command
  or by an explicitly described manual check. "Looks better" is not a criterion.
- **`Files touched` is a real prediction**, not a formality. It is what lets a
  fanout orchestrator detect that two packages would collide, and it is a
  useful accuracy signal in review: a slice that touched twenty files when it
  predicted four was mis-scoped.
- **Slices default to parallel-ready.** Sequential dependencies must name the
  prerequisite slice letter and a one-line reason.
- **The final slice carries the ship gates**, below.

### Ship gates — appended to the final slice

```markdown
## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `<quality-command>` green for touched areas
- [ ] Public contracts unchanged unless this slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
```

Putting promotion and deletion readiness inside a checkbox on the last slice is
what makes cleanup happen. If promotion is merely a policy in an instruction
file, it gets skipped; if it is an unchecked box blocking the package from
`ship-ready`, it does not.

### `README.md` — the package control file

Present from the first moment, updated by every skill:

```markdown
---
status: active
---

# <slug>

<one-paragraph description of the package>

## Slices

| Slice | Title | Status |
| --- | --- | --- |
| A | Storage layer | done |
| B | Export endpoint | in-progress |

## Implementation map

<where the work lands in the codebase>

## Resume point

<what a cold agent should do first>

See `IDEA.md` for the original idea.
```

The `Resume point` section is small and disproportionately useful. It is the
first thing a returning human reads.

---

## Slice status and the handoff block

Slice status is `planned` / `in-progress` / `done` / `blocked`, on a single
line near the top of the slice doc.

When an agent stops a slice before `done` — session end, usage limit, an
unresolved blocker — it appends a handoff block directly under the status line,
replacing any previous one:

```markdown
## Status: in-progress

### Handoff
- Done: <what is verified so far, or "nothing verified yet">
- Next: <the concrete next action, specific enough to start cold>
- Stopped because: <usage limit / blocker / session end>
```

When the slice reaches `done`, the handoff block is removed — the rest of the
document is the durable record once complete.

This tiny convention is what makes the system genuinely resumable. The contract
is: **a fresh agent reads the slice doc's status line and, if present, its
handoff block, and needs nothing else.** No chat history, no memory of the
previous session, no human explanation. Every implement-style skill honors the
same contract, which is why a slice started by one runtime can be finished by
another.

The `Next` field is the one that gets written lazily. "Continue the work" is
useless. "Add the `format` query param to the export handler and extend the
existing contract test" is what you want, and it costs the stopping agent ten
seconds.

---

## Cleanup — the step people skip

Cleanup is a skill, it is gated, and it is the only thing that deletes a
package. Its refusal condition is the point: **it will not run unless the
package is `ship-ready`**, or the human explicitly force-overrides.

The sequence, in order:

1. **Gate.** Verify `ship-ready`, or an explicit override. If the work was done
   through an automated branch/PR flow, additionally verify the work is actually
   merged — the branch matches its base, the PR is merged, the worktree is clean
   and fully merged. Deleting the plan for unmerged work loses it.
2. **Verify the ship checklist.** Acceptance criteria met, quality gate green,
   no secrets committed.
3. **Promote durable outcomes** into `PRD/sections/` — decision bodies plus
   router index lines, requirement additions and amendments, flow updates.
4. **Flip system-map entries** to `shipped` where code now exists.
5. **Write the receipt** to `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`.
   Before the delete, always.
6. **Delete `PRD/work/<slug>/`** in full.
7. **Remove the board row.**
8. **Remove merged local worktrees and branches.** Never remote.
9. **Update `PRD/README.md`** only if navigation or read order changed.

### The receipt

Permanent. Never deleted with the work folder. It is the answer to "what
happened here and when?" long after the plan is gone.

```markdown
# Receipt — <slug>

- Date: <YYYY-MM-DD>
- Slug: `<slug>`
- Status: shipped | partial | corpus-only

## Actions taken
- [x] Slice A — <what shipped>
- [x] Durable promotion: <DEC/REQ ids written or amended>
- [x] System-map: <entries flipped to shipped>

## Files created
- `<path>`

## Files updated
- `<path>`

## Files deleted
- `PRD/work/<slug>/` (entire ephemeral work folder)

## Verification results
- `<quality-command>` — exit 0
- <test counts, manual checks, security scans>

## Notes
- <caveats, follow-ups, anything reconciled against concurrent work>
```

Receipts also serve the system-map promotion gate: an entry may be marked
`shipped` only when both code and a receipt exist. That makes the gate
mechanically checkable rather than a judgment call.

### Corpus hygiene mode

The same skill handles sweeps that are not tied to a shipped feature —
renaming terminology across the corpus, retiring a directory, reconciling stale
navigation. These produce a receipt with `Status: corpus-only` and no code
changes. Having one skill own both keeps every corpus mutation receipted.

---

## Abandoned work

Not every idea ships. When a package is abandoned:

- If nothing durable came of it, delete the folder and the board row. No
  receipt is needed for work that produced no conclusions.
- If it produced a real conclusion — even "we decided not to do this, because
  X" — that is a decision. Write the `DEC-###`, write a receipt with
  `Status: partial`, then delete.

The failure mode to avoid is leaving abandoned packages on the board at
`ideation` forever. Use `deferred` for real-but-not-now; delete for dead.
