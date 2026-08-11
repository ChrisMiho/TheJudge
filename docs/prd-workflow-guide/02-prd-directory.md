# 02 — The PRD Directory

Full anatomy of the two durable layers: `PRD/sections/` (product truth) and
`PRD/instructions/` (agent process), plus the navigation file that binds them.

---

## Directory map

```
PRD/
  README.md                       # navigation only — no truth, no backlog
  sections/                       # LAYER 1 — durable product truth
    decisions.md                  #   router: index of every DEC, one line each
    decisions/                    #   domain files holding full DEC bodies
      <domain>.md
    overview.md
    problem-statement.md
    personas.md
    goals-and-non-goals.md
    user-flows.md
    functional-requirements.md
    non-functional-requirements.md
    integrations-and-data.md
    open-questions.md
    system-map.md                 #   what is BUILT, vs what is merely decided
    system-map/<subsystem>.md     #   optional deep behavior files
  instructions/                   # LAYER 2 — durable agent process
    agent-working-rules.md
    doc-lifecycle.md
    writing-rules.md
    requirement-format.md
    technical-design-rules.md
    secrets-handling.md
    test-naming.md
    runtime-process-hygiene.md
    workflow-reference.md
    receipts/<slug>-<YYYY-MM-DD>.md
  work/                           # LAYER 3 — see 03-work-packages.md
```

---

## The ID system

Every addressable unit of truth has a stable, zero-padded, three-digit ID.

| Prefix | Lives in | Means |
| --- | --- | --- |
| `DEC-###` | `sections/decisions/<domain>.md` | A confirmed product or process decision |
| `REQ-###` | `sections/functional-requirements.md` | A functional requirement with acceptance criteria |
| `NFR-###` | `sections/non-functional-requirements.md` | A quality/performance/security constraint |
| `FLOW-###` | `sections/user-flows.md` | An end-to-end user journey |
| `Q-###` | `sections/open-questions.md` | An unresolved question needing a human |
| `GOAL-###` | `sections/goals-and-non-goals.md` | A product goal |
| `PERSONA-###` | `sections/personas.md` | A user archetype |

Four rules govern IDs, and they matter more than the format:

1. **Assign sequentially, never reuse.** The next requirement is the highest
   existing number plus one, forever.
2. **Never renumber.** IDs are referenced from other section files, from work
   packages, from receipts, from commit messages, and from your issue tracker.
   Renumbering silently invalidates all of it.
3. **Supersede, don't delete.** When a decision is replaced, trim its body to a
   one-line tombstone — `Superseded by DEC-118` — and keep the ID resolvable.
   Anyone who finds an old reference must be able to follow it to the truth.
4. **Cross-reference by bare ID in prose.** Write `DEC-118`, not a markdown
   link and not a line number. Bare IDs survive file moves and reorganizations;
   links and line numbers do not.

This is the single highest-leverage convention in the system. Stable IDs are
what let a work package say "implements REQ-047 under DEC-112" and have that
mean something eighteen months later.

---

## The decisions router pattern

Decisions are the highest-authority content, so they get special structure. A
single flat decisions file works until roughly decision fifty, then it becomes
a thousand-line document that agents load in full to answer one question.

The fix is a **router plus domain files**:

- `sections/decisions.md` holds the resolution rules and one index table. Each
  row is `DEC-ID | domain file | one-sentence summary`. Nothing else.
- `sections/decisions/<domain>.md` holds full decision bodies, grouped by
  subsystem or topic (`auth.md`, `billing.md`, `ui-presentation.md`,
  `doc-process.md`, and so on).

An agent resolving `DEC-112` scans the router index — cheap, one line per
decision — finds the domain file, and reads only that file. The router stays
readable at several hundred decisions.

**Router index rows look like this:**

```markdown
| DEC-ID | Domain file | Decision |
|---|---|---|
| DEC-001 | `decisions/framing.md` | <Product> is an assistant, not an authority. |
| DEC-002 | `decisions/data-model.md` | Ordering is bottom-to-top; index 0 is the bottom. |
| DEC-003 | `decisions/data-model.md` | Superseded by DEC-041. |
```

**A full decision body looks like this:**

```markdown
### DEC-###
- Decision: <the decision, stated as a present-tense fact>
- Status: confirmed
- Context: <what forced the decision; what was true before>
- Impact:
  - <concrete consequence, one per line>
- Related requirements:
  - REQ-###
- Notes:
  - <caveats, scope boundaries, what this explicitly does not change>
```

Two conventions make decision bodies useful rather than decorative:

- **`Impact` is a list of concrete consequences**, not a restatement of the
  decision. If a reader cannot tell which files or behaviors change, the entry
  is not finished.
- **`Notes` names what the decision does *not* do.** Agents over-generalize
  decisions constantly. An explicit "this does not change the API contract" line
  prevents a class of scope creep that is otherwise very hard to catch in review.

### Adding a decision — the two-write rule

Every new decision requires exactly two edits: the body in the domain file, and
the index line in the router. Doing one without the other is the most common
corruption of this pattern. Make it a checklist item in your refinement and
cleanup skills.

---

## Section files, one by one

### `decisions.md` + `decisions/`
Covered above. Read-first, highest authority.

### `overview.md`
The product in one page. Typical headings: Summary, Positioning, Current
Product Status, Product Principles, Key Constraints. This is what a brand-new
agent reads to understand what it is working on. Keep it under a hundred lines;
it is an orientation document, not a specification.

### `problem-statement.md`
Problem, why it matters, opportunity, constraints on the solution. Its real job
is to give agents a basis for rejecting proposals: a feature that does not serve
the stated problem can be declined by pointing here.

### `personas.md`
`PERSONA-###` entries with Name, Role, Environment, Primary Need, Pain Points,
plus a Design Implications section. One or two personas is normal and healthy.
Ten personas means nobody has made a decision.

### `goals-and-non-goals.md`
`GOAL-###` entries, success metrics, shipped capabilities, intentional
constraints, planned capabilities, product risks, and — most importantly —
**Explicit Non-Goals**. The non-goals list is the highest-value part of this
file. It is the thing you point at when an agent proposes building the adjacent
product instead of yours.

### `user-flows.md`
`FLOW-###` entries:

```markdown
### FLOW-###
- Name:
- Trigger:
- Preconditions:
- Main Flow:
  1. ...
- Edge Cases:
  - ...
- Notes:
```

Flows are where end-to-end behavior lives. Requirements describe pieces; flows
describe the journey through them. An agent implementing a UI change reads the
flow to learn what must still be true afterward.

### `functional-requirements.md`
A flat, sequential list of `REQ-###` entries. No grouping headings — the ID is
the address, and grouping invites renumbering pressure.

```markdown
### REQ-###
- Title:
- Priority: high | medium | low
- Description:
- Acceptance Criteria:
  - <observable, checkable statement>
- Constraints:
  - <what the implementation must not do>
- Dependencies:
  - DEC-###, REQ-###, NFR-###
- Notes:
```

The four field distinctions carry real weight:

- **Acceptance Criteria** must be *observable*. "Search works well" is not a
  criterion; "suggestions appear at three or more typed characters" is.
- **Constraints** are the negative space — what a correct implementation must
  not overstep. This is where you stop the agent from solving the requirement
  with an architecture you don't want.
- **Dependencies** are the traceability mechanism. Because they list bare IDs,
  a grep for `REQ-047` finds everything that depends on it. This is why the
  system needs no separate traceability matrix.
- **Notes** carry amendments. When a later decision narrows a requirement, note
  it here rather than rewriting history.

This file will become your largest document — a few thousand lines is normal and
fine. It is read by ID lookup, not linearly.

### `non-functional-requirements.md`
`NFR-###` entries, same shape as REQ minus Priority and Acceptance Criteria:
Title, Description, Constraints, Dependencies, Notes. Performance budgets,
security posture, accessibility floors, maintainability rules.

### `integrations-and-data.md`
Tech stack, data models, API contracts, external integrations, delivery
strategy. This is the file an agent reads before touching a wire format. If you
have a public contract you do not want changed casually, state it here and
reference it from `technical-design-rules.md`.

### `open-questions.md`
`Q-###` entries — the pressure-release valve for ambiguity:

```markdown
### Q-###
- Question:
- Context:
- Why it matters:
- Options under consideration:
  - ...
- Recommended next step:
```

The governing rule is: **when an agent hits genuine ambiguity, it writes a
`Q-###` rather than guessing.** `Recommended next step` is what keeps this from
becoming a graveyard — it usually says "ship the simple option now, revisit when
X." An open question should rarely block implementation; it should scope it.

### `system-map.md` (and `system-map/`)
A catalog of what actually exists, separate from what has been decided. Two
levels — subsystems, with features grouped under them:

```markdown
## <Subsystem name>

- Status: shipped | planned | partial
- Summary: <one line of behavior>
- Lives in: `<coarse path>` (module names, not line numbers)
- Backed by: DEC-###, REQ-###
- Details: `system-map/<subsystem>.md`   # optional
```

This file exists because of a specific failure: decisions are written in the
present tense ("the app does X") the moment they are confirmed, long before code
exists. Readers then cannot tell decided from built. Rather than overload the
decision `Status:` field, shipped-ness lives here and only here.

**The promotion gate:** an entry flips to `shipped` only when *both* the code
exists and wired in, *and* a cleanup receipt exists at
`instructions/receipts/<slug>-<date>.md`. Until then it is `planned` or
`partial`. This is checked at cleanup time, which makes it self-maintaining.

The optional `system-map/<subsystem>.md` detail files carry deep behavioral
prose for the two or three subsystems complex enough to warrant it. Fixed
template: Backed by, How it works, Data flow, Where it lives, Worked example,
Invariants and gotchas. Do not create one per subsystem — the point is that most
subsystems need only the catalog row.

### Optional: a screen or surface catalog
If your product has a UI, a durable per-screen catalog is worth its weight. For
each screen: purpose, size bands per viewport class, what scrolls, and the
backing DEC/REQ ids. Without it, agents asked to "make the card bigger"
routinely produce full-bleed layouts, because a short bug description contains
no sizing reference. With it, fixes converge on a shared intent. Include a
copy-paste "new screen" template inside the file so adding a row is trivial.

---

## Instruction files, one by one

Instruction files govern *method*. They never contain product scope. Most are
short — forty to a hundred lines — and are read on demand by the skill that
needs them.

### `agent-working-rules.md`
Baseline behavior for any agent touching the corpus: read order, general rules,
ambiguity handling (write a `Q-###`), scope discipline, change-management order
(decisions first, then sections), commit message convention, and a prohibited
behaviors list. The prohibitions are the part that earns its keep — write them
as blunt imperatives.

A commit convention worth copying, because it makes "did this change product
behavior?" answerable from `git log` alone:

- `docs(prd):` — documentation or planning only, no behavior change
- `feat:` / `fix:` — product behavior changed under `<code-roots>`

### `doc-lifecycle.md`
The durable-vs-ephemeral contract from `01-architecture.md`, written as rules an
agent can follow: which paths are durable, which are ephemeral, what happens
during work, the ordered cleanup sequence, the decision tombstone rule, the
system-map promotion gate, what to do with abandoned work, and an explicit list
of prohibited patterns (`PRD/analysis/`, `PRD/plans/`, backlog tables in the
navigation file, encoding status by renaming folders).

The prohibited-patterns list is not paranoia. Each entry on it is a directory
that a well-meaning agent will propose creating, and each one re-introduces
planning-doc sprawl.

### `writing-rules.md`
Style and editing discipline: concise markdown, one purpose per file,
self-contained sections, the ID formats, standard field labels, and "make the
smallest change that is correct." Also the editing order — decision body and
router index first, then the affected section files.

### `requirement-format.md`
The canonical templates: REQ, NFR, FLOW, Q, DEC, and the slice document. This is
the file skills cite when they need to write a well-formed entry, so it should
contain literal fenced templates rather than descriptions of them.

It also defines **slice dependency rules**, which are worth stating precisely:

- `parallel-ready` — the slice references only non-blocking IDs and names no
  prerequisite slice.
- `sequential` — the slice names the prerequisite slice letter(s) *and* a
  one-line reason for each.
- Vague values such as "depends on other slices" or "after future work" are
  forbidden. A dependency that cannot be named is not a dependency; it is an
  unfinished plan.

### `technical-design-rules.md`
Your architectural guardrails. This is the most project-specific file in the
system and the one you must write yourself. Four sections:

1. **Allowed design direction** — the stack and patterns already chosen.
2. **Required constraints** — invariants that must survive every change.
3. **Forbidden design drift** — an explicit list of tempting things nobody is
   to build. This is the highest-value section. Name the microservice, the
   plugin system, the rules engine, the caching layer, the abstraction that
   someone will otherwise propose in month four.
4. **Design proposal rules** — reuse before creating; tie every proposal to a
   requirement; prefer the smallest solution that satisfies it; keep
   extensibility separate from scope.

### `secrets-handling.md`
Nearly fully portable. A storage convention
(`.secrets/<service>-<purpose>.<ext>`, git-ignored), non-negotiable rules
(never commit, never print, placeholders only in `.env.example`), a human
approval gate for anything that creates or relocates credential material, and
pre-commit checks. Copy this one almost verbatim.

### `test-naming.md`
A hierarchical test-title convention so that failures are self-locating and
titles do not rot. The pattern that works:

```
<Layer> - <Feature>  >  <Area>  >  <verb-led behavior>
```

Layer is a closed set (`Frontend` / `Backend`, or your equivalent). Feature is a
closed vocabulary you define once. The critical rule: **no planning IDs in test
titles.** `Slice-A: renders the panel` and `renders the panel (REQ-054)` are
both wrong, because slice letters and requirement IDs are ephemeral or
relocatable while tests are permanent. Behavior is the durable name.

### `runtime-process-hygiene.md`
Only needed if agents start browsers or dev servers. It defines when browser
verification is actually required (explicit request, or browser-observable risk
like responsive geometry, overlays, focus and keyboard behavior, navigation and
persistence), and — more importantly — an ownership and cleanup contract:

- Record the owning session, the worktree, and the ports used.
- Close the browser, stop only agent-started processes by their exact handle,
  wait for the process tree to exit, verify ports released.
- Write captures inside the current work package, never the repo root.
- Never use broad `pkill`/`killall`, never `nohup`, never stop user-owned
  servers.

Without this, unattended runs leave orphaned browser trees and occupied ports
that break the next run. It is unglamorous and you will want it by week three.

### `workflow-reference.md`
The operator reference for the skill system itself: the handoff prefix rule, the
package status vocabulary, the three-marker rule, the per-skill status duties,
the work folder lifecycle, and the slice status vocabulary with its handoff
block. Detailed in `03-work-packages.md` and `04-skills.md`.

---

## `PRD/README.md` — the navigation file

The control plane. It contains, and only contains:

1. **Status** — a two-line statement of where the project is.
2. **Purpose** — what this file is for.
3. **Read First** — the default read order for implementation work.
4. **Source-of-Truth Precedence** — the four-level ordering.
5. **Section Inventory** — a table of every section file with a one-line
   description and a maturity marker.
6. **Instruction Inventory** — the same for instruction files.
7. **Which Files to Read for Which Task** — the highest-value part. A short
   ordered read list per task type: product understanding, feature
   implementation, UI work, slice planning, writing tests, editing docs.
8. **Working Rules Summary** — six to ten one-line reminders.
9. **A single-line pointer to the work board.** Not a table of packages — a
   pointer. The board lives in `PRD/work/STATUS.md` and having it in two places
   guarantees one of them is wrong.

Section 7 is what makes the corpus usable at scale. An agent asked to fix a
layout bug should not read nine thousand lines; it should read the four files
this section names. Write it as ordered lists, not prose.

**What must never appear here:** product truth, a backlog, a roadmap, a
multi-row work-package table, or a changelog. Every one of those turns the
navigation layer into a competing source of truth, and it will be the stale one.
