# 01 — Architecture

The system has four layers. Every file in the repo belongs to exactly one of
them, and the layer determines the file's lifetime, its authority, and who is
allowed to write it.

---

## The four layers

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1 — PRODUCT TRUTH            PRD/sections/            │
│ What the product is and must do. Durable. ID-addressed.     │
│ Written by: refinement + cleanup. Read by: everything.      │
├─────────────────────────────────────────────────────────────┤
│ LAYER 2 — AGENT PROCESS            PRD/instructions/        │
│ How an agent must behave when reading/writing/building.     │
│ Durable. Written by: humans, rarely. Read by: skills.       │
├─────────────────────────────────────────────────────────────┤
│ LAYER 3 — IN-FLIGHT WORK           PRD/work/<slug>/         │
│ One folder per feature being planned or built. EPHEMERAL.   │
│ Written by: every workflow skill. Deleted at ship time.     │
├─────────────────────────────────────────────────────────────┤
│ LAYER 4 — PROCEDURE                skills/proj-*/           │
│ Invocable, step-by-step agent procedures with file          │
│ contracts. Durable. Read by: the agent, on invocation.      │
└─────────────────────────────────────────────────────────────┘
```

Two supporting artifacts sit outside the layers:

- **`PRD/README.md`** — a pure navigation document. It contains no product
  truth, no backlog, and no roadmap. Its only job is to answer "which file do I
  read for this task?" Keeping it navigation-only is what stops it from becoming
  a second, competing source of truth.
- **`PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`** — permanent records of
  shipped work. These are the memory of the ephemeral layer. They are never
  deleted.

---

## The precedence rule

When two documents disagree, this ordering decides the winner. Agents are told
this explicitly, and it is the first thing in the navigation document.

1. **`PRD/sections/decisions.md`** and the domain decision files it routes to.
   A confirmed decision overrides older prose anywhere else in the corpus.
2. **Other `PRD/sections/` files.** These define current product scope.
3. **`PRD/instructions/` files.** These define how content is processed and
   generated — they govern method, never product scope.
4. **`PRD/README.md`.** Navigation only; never authoritative.

Anything in `PRD/work/` is a *proposal* until it is promoted. It has no
authority over the durable layers. This is what makes it safe to delete.

Why decisions outrank section prose: section files accumulate wording over
months, and rewriting every affected paragraph on each decision is expensive and
error-prone. Letting a dated, ID'd decision override stale prose means the
corpus stays correct even when it is not yet perfectly consistent. Consistency
is repaired opportunistically; correctness is guaranteed immediately.

---

## The load-bearing idea: ephemeral planning with mandatory promotion

Most documentation systems for agents fail because planning documents are
immortal. Someone writes `docs/plans/2024-refactor-auth.md`, the refactor ships,
and the file stays forever. Six months later there are forty of them, three
contradict the code, and no agent can tell which are live. The corpus becomes a
liability and agents start ignoring all of it.

This system makes planning documents **structurally temporary**:

- All planning lives in exactly one place, `PRD/work/<slug>/`.
- The final slice of every plan contains a promotion checklist as an acceptance
  criterion, so promotion is *work that must be completed*, not an aspiration.
- A dedicated skill (`proj-cleanup`) refuses to run unless the package is
  ship-ready, then promotes durable conclusions into `PRD/sections/`, writes a
  receipt, and **deletes the folder**.
- The receipt is written *before* the delete, so the promotion is never lost to
  a failed cleanup.

The corpus therefore has a natural size ceiling. `PRD/sections/` grows slowly
and only with conclusions. `PRD/work/` holds only what is genuinely in flight —
typically three to eight folders. Nothing accumulates.

### The promotion contract

When a feature ships, exactly these things happen, in this order:

1. Durable conclusions are written into `PRD/sections/` — a new `DEC-###` body
   in the right domain file plus its router index line, new or amended
   `REQ-###`, updates to affected flows and catalogs.
2. A receipt is written to `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`
   listing every file created, updated, and deleted, plus verification results.
3. `PRD/work/<slug>/` is deleted in full.
4. The package's row is removed from the board, `PRD/work/STATUS.md`.
5. `PRD/README.md` is touched **only** if navigation or read order changed.

Step 5 is a real rule, not a nicety. If every ship edits the navigation file,
the navigation file becomes a changelog and stops being navigable.

---

## Two orthogonal state machines

The system tracks state in two independent places, and conflating them is the
most common porting mistake.

**Package status** answers "where is this feature in the pipeline?"

```
ideation → refining → refined → active → ship-ready → (deleted)
                 ↕                    ↕
             deferred            owner-action
```

**Slice status** answers "is this specific unit of implementation work done?"

```
planned → in-progress → done
              ↓
           blocked
```

A package is `active` while its slices move individually through their own
states. The package only becomes `ship-ready` when the last slice reaches
`done`. Keeping these separate is what lets one agent implement slice C while
the package as a whole remains legibly mid-flight.

There is a third status-like field that belongs to neither machine: the
`Status: confirmed | superseded` on a `DEC-###` entry. That is *decision*
lifecycle — whether the decision is still in force — and it deliberately does
**not** mean "shipped." Whether code exists is tracked in a separate catalog
(see `02-prd-directory.md`, system map). Overloading one field with "decided"
and "built" is a trap; keep them apart.

---

## Why skills instead of a long rules file

You could put all the process guidance into one `AGENTS.md` and hope the agent
follows it. That degrades badly for three reasons.

1. **Context cost.** A monolithic rules file is loaded on every turn, relevant
   or not. Skills load only when the phase they govern is active. The kickoff
   skill deliberately reads *two* files and nothing else.
2. **Phase-specific gates.** "Do not write a GAMEPLAN" is correct during
   quality-check and wrong during map-out. A single file cannot express that;
   two skills can.
3. **Handoff.** A skill can end by naming the exact next command. That turns a
   vague "what now?" into a literal string the user can run, which is what makes
   multi-session work resumable by a person who has forgotten the state.

The skills are, in effect, a state machine where each state carries its own
context budget and its own prohibitions.

---

## The contract every skill declares

This uniformity is what makes the system auditable. Each skill states:

| Field | Purpose |
| --- | --- |
| **Goal** | One sentence; what "done" means for this skill |
| **Inputs** | What the invoker must supply (usually a slug or path) |
| **Reads** | The exact file list. Reading beyond it is a gate violation |
| **Writes** | The exact file list. Writing beyond it is a gate violation |
| **Status transitions** | Which package/slice status values this skill may set |
| **Gates** | Hard prohibitions — the things this skill must refuse to do |
| **Next step** | One sentence plus the literal command to run next |

When something goes wrong in production use, the diagnosis is almost always
"a skill wrote outside its Writes list" or "a skill skipped its gate." Both are
visible in a diff, which is why the contract is written down rather than implied.

---

## What this architecture assumes about your repo

- A single-command quality gate exists (`<quality-command>`) that runs lint,
  typecheck, and tests. Slice verification leans on it heavily.
- Git is the versioning system and branches are cheap.
- Your agent runtime can read local markdown and can be pointed at a skill by
  name.
- You are willing to review agent-produced planning documents. The system makes
  planning legible; it does not make it correct.

If your quality gate does not exist yet, build it first. Half the value of the
slice model comes from every slice ending in a green, reproducible command.
