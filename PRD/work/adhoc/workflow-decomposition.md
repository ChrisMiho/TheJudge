# Brain dump → work packages

Source: `PRD/work/adhoc/workflow.md` (owner brain dump, 2026-08-22).
This file is analysis and intake material. Nothing here is product truth or a
decision — decisions are made with the owner at refinement.

---

## Measured state

Recorded so the next agent does not re-derive it.

| Thing | Measured |
| --- | --- |
| Decisions | 167 DEC bodies across 18 files in `sections/decisions/`, indexed by a 168-row router |
| Requirements | 159 REQ entries in one 3,767-line `functional-requirements.md`, flat, no feature grouping |
| Flows | 22 FLOW entries in one 503-line `user-flows.md`, flat |
| Feature catalog | `sections/system-map.md`, 580 lines, ~15 subsystems / ~45 features, organized by code location |
| Depth layer | `sections/system-map/` — 2 files only (`prompt-assembly`, `game-rules-retrieval`); template fixed by DEC-048 |
| Data | `sections/integrations-and-data.md`, 447 lines, already carries six per-corpus `## … Data Strategy` sections |
| Layout | `sections/screen-layout.md`, 254 lines, already a per-screen catalog with a template and an agent read contract |
| Read order | `PRD/README.md`: source-of-truth precedence #1 **and** read-first #1 are both `sections/decisions.md` |
| Frozen references | 74 of ~80 cleanup receipts cite DEC-IDs; skills, instructions, and contracts cite them too |
| Graph spine | 3 skills, 9 nodes; `scripts/graph-boundary-hook.mjs` wired as a `PreToolUse` hook in `.claude/settings.json` (fires in every session); `.claude/graph-profile.json` (155 lines) binds only under `claude --settings` |
| Board | `PRD/work/STATUS.md` is empty — 6 packages parked in `PRD/ideasForLater/` |
| Branch | `feature/doc-refactor`, two file deletions ahead of `main` |

---

## Diagnosis

The notes name one problem ("the decision list is growing out of control") that
is really two, and they need different fixes.

**Growth.** The DEC log is append-only by design. 167 entries today, and the
graph workflow makes entries land faster. Nothing about that is broken — a
changelog is supposed to grow. What is broken is that the log sits at
**precedence #1 and read-first #1**, so every task, for every feature, opens the
index of every decision ever made. The cost is not the log's length. It is the
log's position.

**Comprehension.** A DEC records *a change*: "we moved from X to Y, and why."
Current truth for one feature is the sum of a supersession chain — card density
is DEC-151, amended by DEC-158, amended by DEC-160, superseding DEC-148, which
amended DEC-078. An agent citing DEC-158 is citing a diff, not a statement. The
owner cannot hold five amendments in their head, which is exactly Observation 2
in the brain dump.

**So the missing thing is a current-state layer, not a smaller history.** No
file in `sections/` answers "what does Scan do today, why does it work that way,
and what does a player experience?" `functional-requirements.md` is a flat REQ
list. `system-map.md` is organized by where code lives. `user-flows.md` is a
flat FLOW list. Truth about one feature is scattered across four files plus a
supersession chain.

**Recommended reframe:** do not delete the decision history. Deleting it removes
the *why*, which is the thing the notes say is already missing. Instead **invert
precedence** — a per-feature spec becomes read-first #1 and states current truth
in player language; the DEC log drops to a rarely-opened archive that stays
resolvable by ID. The log can grow forever once nobody has to read it.

**The refactor is smaller than it looks.** `sections/system-map/` detail files
already use a fixed template (DEC-048: `Backed by:` / How it works / Data flow /
Where it lives / Worked example / Invariants). That is most of the spec the
notes describe. It is missing three things: coverage (2 of 15 subsystems),
player-facing language and UX intent, and position (it sits below the DEC layer,
not above it). `screen-layout.md` already proves the pattern works — catalog,
template, explicit agent read contract. This is finishing a layer that exists,
not inventing one.

---

## Owner decisions — answered 2026-08-22

### D1 — Does the decision history survive? → **No. Retire it, in three phases.**

Settled by the owner 2026-08-22 after two rounds of challenge. The owner accepts
the rewrite cost and judges it worth paying. This is the direction; the phases
below exist to make it safe, not to relitigate it.

**Coupling check — what actually depends on DEC IDs.** Measured before agreeing,
because the answer changes whether this is boundable work or an open-ended one:

| Depends on DEC IDs | Count | Verdict |
| --- | --- | --- |
| Skills that **write** decisions | 5 — `thejudge-refinement` (7 refs), `thejudge-kickoff` (5), `thejudge-quality-check` (3), `thejudge-cleanup` (3), `thejudge-amend` (1) | Boundable, concentrated |
| Skills that **cite** a DEC | 7 files, 9 citations total | Trivial |
| Instruction files citing DECs | 4 files, 12 citations (8 in `technical-design-rules.md`) | Trivial |
| The DEC template | `requirement-format.md` § Decision Template | One block |
| Source files citing DEC IDs | 101 | Degrades to "read the spec" — acceptable if Phase B does its job |
| `graph-gate-review` | Walks a diff **"one stable ID at a time"** | **Structural — see below** |

**The one thing worth flagging.** `graph-gate-review` is the owner-facing half
of the `define` gate, and the gate is the highest-leverage mechanism in the
workflow (MAST attributes 44.2% of multi-agent failures to specification). It
works by walking a `PRD/sections/` diff one stable ID at a time. Retire DEC IDs
and the gate needs a new unit of review, or it has nothing to walk.

**This resolves itself, but only if REQ IDs survive.** P1-Q1 already moves REQ
bodies into the specs while preserving the IDs — 60 source files and their tests
require it. So specs stay ID-addressed, and the gate walks REQ IDs instead of
DEC IDs. **Retiring DEC IDs while keeping REQ IDs is coherent. Retiring both is
not** — it would silently break the define gate.

**Scheduling constraint.** Phase C edits `thejudge-*` skills, and a graph run may
not edit those (DEC-167). That phase is necessarily an ordinary interactive
session, not an overnight run.

---

#### Phase A — Write the specs (first stab)

Build the three-bucket layout: six `features/` directories, `data/` under the
membership test, `system-map/` as the machinery layer. REQ bodies move in, REQ
IDs preserved. Specs are written from current code, the current DEC bodies, and
`screen-layout.md`'s measured bounds.

**The DEC list is untouched and stays at precedence #1 throughout.** Phase A
retires nothing. A spec that turns out wrong is corrected against a source that
still exists.

Every spec carries the **rejected alternatives / measured bounds** field. This is
the field that captures what would otherwise be lost — not the supersession
narrative, but the measured dead ends like the unbounded-image result.

*Door:* graph-runnable if sliced one feature per run, so each `define` gate parks
on a walkable diff. A single run over the whole corpus parks on hundreds of IDs.

#### Phase B — Audit the decisions against the specs

For each of the 153 `confirmed` DEC bodies, one verdict:

| Verdict | Meaning |
| --- | --- |
| `absorbed` | The spec states this truth completely |
| `partial` | The spec states some of it — name exactly what is missing |
| `not-absorbed` | The spec is silent; the content still needs a home |
| `obsolete` | No longer true of the product; nothing to carry forward |

Output is a coverage table. **Phase B deletes nothing.** Its whole job is to make
Phase C's deletions evidence-backed rather than judged, which is the difference
between this plan and the risky version.

This is also the net that catches measured-rejection content. A DEC ruled
`absorbed` when its measurement did not make it into a spec is exactly the
failure mode; the `partial` verdict exists to name it.

#### Phase C — Retire, on the audit's evidence

1. Flip precedence and read-first in `PRD/README.md` to the spec layer.
2. Delete or tombstone every DEC the audit proved `absorbed`; carry `partial`
   and `not-absorbed` content into the specs first, then retire.
3. Rewrite the DEC-writing step in all 5 skills — what a shipped package
   promotes, and where.
4. Replace the Decision Template in `requirement-format.md`.
5. Point `graph-gate-review` at REQ IDs as its unit of review.
6. Update the 21 DEC citations across skills and instruction files.

*Door:* ordinary session, mandatory — step 3 edits `thejudge-*` skills.

**Gates.** Phase B cannot start until Phase A's specs exist. Phase C cannot start
until Phase B has a verdict on every one of the 153 confirmed DECs.

### D2 — What gets its own directory? → **Every player-facing page**

Plus a data layer, with an explicit rule stopping it from becoming a catch-all.

---

## The three-bucket layout

The catch-all risk is not hypothetical — it already happened.
`integrations-and-data.md` carries a `## Feedback Delivery Strategy` section
that is a Formspree form POST: no upstream source, no build command, no
artifact, no corpus. It is filed under data because the corpus had nowhere else
to put it. Two buckets (`features/` + `data/`) reproduce that: everything a
player cannot see falls into `data/` by default.

**Use three. The third already exists.**

| Bucket | Holds | Test |
| --- | --- | --- |
| `features/<page>/` | One directory per player-facing page | A player can navigate to it |
| `data/<corpus>/` | Bodies of Magic facts the product consumes | See membership test below |
| `system-map/` | The machinery between them — prompt assembly, retrieval, provider boundary, API contract | A player never sees it, and it describes how TheJudge behaves |

`system-map/` is not a new invention. It already holds exactly two files —
`prompt-assembly.md` and `game-rules-retrieval.md` — and both are machinery,
neither data nor page. The bucket exists; it just needs the rest of the
machinery moved into it, and the player-facing subsystems moved out.

`system-map.md` (the catalog) stays as the index across all three buckets. It
keeps DEC-044's shipped/planned promotion gate, which `thejudge-cleanup`
enforces at ship time — that gate is load-bearing and must not be lost in the
move.

### Membership test for `data/`

A file belongs in `data/` only if **all four** hold:

1. It has an **upstream source outside your control** — Scryfall, WotC
   Comprehensive Rules, Commander Spellbook.
2. It has a **build or refresh command** — `data:build` / `data:refresh`.
3. It produces a **committed artifact** with a known path and shape.
4. **It describes Magic, not TheJudge.** The facts would exist whether or not
   this product existed.

Clause 4 is the one that does the work. Card prices, oracle rulings, rules
excerpts, combo variants, card art fingerprints — all facts about Magic.
Formspree delivery, prompt section ordering, and the error taxonomy are facts
about *your product*, and they fail the test.

**Routing rule for anything that fails:** a document explaining how the product
*behaves* is a feature spec (a player sees it) or machinery (they do not). It is
never data.

### Redistributing `integrations-and-data.md` (447 lines, 16 sections)

| Today | Goes to |
| --- | --- |
| Metadata Strategy | `data/card-metadata.md` |
| Rulings Data Strategy | `data/oracle-rulings.md` |
| Game Rules Data Strategy | `data/comprehensive-rules.md` |
| Commander Spellbook Combo Data Strategy | `data/combo-corpus.md` |
| Card Scanning Data Strategy | `data/scan-fingerprints.md` |
| Trade Balancer Data Strategy | `data/printing-prices.md` — **corpus only**; the side-total math, the missing-price indicator, and lazy-loading are Trade Balancer feature behavior and move to its feature spec |
| Feedback Delivery Strategy | `features/feedback/` — fails clause 4 |
| AI Prompt Context Rules | `system-map/prompt-assembly.md` (exists) |
| Data Model, API Design, API Contracts | `system-map/` — one API contract file |
| Zone and Stack Ordering Rules | `system-map/` — consumed by UI, payload, and prompt alike |
| Tech Stack, Delivery Strategy, Dependencies | None of the three. Platform facts — leave them, or start `sections/platform.md`. Naming this explicitly is what stops them sliding into `data/` |

Note the Trade Balancer row: even genuine corpus entries have feature behavior
tangled into them today. Splitting corpus from behavior is real work in this
package, not a file move.

## Package 1 — Feature spec layer

**Outcome.** Every player-facing feature has one directory that states what the
feature does today, what the player experiences, why it works that way, and
which data it consumes. An agent reads one directory and can implement; the
owner reads the same directory and can follow it without an agent.

**In scope**
- Per-feature spec directory shape, template, and an agent read contract
  (mirror `screen-layout.md`'s existing contract)
- The three-bucket layout above: `features/<page>/`, `data/<corpus>/`, and
  `system-map/` as the machinery layer, with the `data/` membership test written
  into `instructions/` so it binds future work rather than being remembered
- Redistributing `integrations-and-data.md` per the table above, splitting
  corpus facts from the feature behavior tangled into them
- Inverting read-first and precedence in `PRD/README.md`
- Migrating REQ/FLOW/system-map content into the feature specs
- Updating the read-order blocks inside every `thejudge-*` and `graph-*` skill
  that names `sections/decisions.md` first
- Promotion rule: what a shipped package writes into a spec, and where the DEC
  still lands

**Out of scope**
- Renumbering any DEC, REQ, FLOW, or Q ID — hard constraint, 74 receipts and
  every skill depend on them
- Editing frozen receipts
- Any `apps/` behavior change

**Open questions for refinement**

D1 and D2 are answered above and are inputs, not questions. These remain:

1. Does a feature spec replace its REQ entries, or link to them? Replacing means
   acceptance criteria move; linking means two places to read.
2. What does a spec say about a feature that is planned but not shipped? Today
   that signal lives only in `system-map.md`'s promotion gate (DEC-044), which
   `thejudge-cleanup` enforces and which must survive the move.
3. Does `screen-layout.md` stay a separate catalog, or does each page's spec
   carry its own layout row? Its per-screen catalog now overlaps `features/`
   one-to-one, so this is a real fork.
4. What keeps a spec honest after a package ships — which skill owns the write,
   and what gate catches a spec that drifted from code?
5. Which pages exist? `screen-layout.md`'s Destinations section and DEC-157's
   four registered routes are the candidate list; confirm it with the owner
   rather than deriving it.

**Door.** ⚠️ Not a good fit for an unattended graph run as-is. Node 3's `define`
gate parks on *any* non-empty `PRD/sections/` diff, and `graph-gate-review`
walks that diff one stable ID at a time. A refactor that rewrites the whole
`sections/` tree would park on a diff of hundreds of IDs. Either run this in an
ordinary interactive session, or slice it so each graph run touches one feature
and produces a walkable diff. Refinement should decide which.

---

## Package 2 — Overnight-run tuning

**Outcome.** A queued overnight run finishes, parks cleanly, or stops safely —
without the owner watching, and without a boundary the owner has to trust on
convention alone.

**In scope**
- Tuning the boundary set. The hook (`scripts/graph-boundary-hook.mjs`) fires in
  every session; the profile (`.claude/graph-profile.json`) is inert without
  `--settings`. The notes say the restrictions are right but need tuning for a
  fully autonomous run — refinement needs the owner's actual observed failures,
  which are not yet written down anywhere
- Queueing more than one package overnight — the notes ask for it; today
  `graph-run` advances exactly one package and `thejudge-implement-fanout`
  only covers the implement phase
- Additional guardrails: what a run should do on repeated failure, on running
  out of usage, on an ambiguity that is not a `define` diff
- Whether the profile survives as a second layer or is retired (DEC-166 kept it
  deliberately)

**Out of scope**
- The node table, the lifecycle, adopting a graph framework — settled, per
  `docs/whatIsGraph/graph-hardening-handoff.md`
- Weakening any existing boundary

**Open questions for refinement**
1. **Which runs actually failed, and how?** This is the blocking input. The
   notes say "new issues with the new graph profile" without naming one. Before
   this package can be shaped, capture the concrete failures — the command that
   was denied, the node that parked, the state the run was left in.
2. Does queueing mean sequential packages in one run, or concurrent runs? DEC-154
   permits concurrency across packages only.
3. What is the owner's morning-after read — the ledger, the receipt, the PR, or
   something new?

**Door.** `/graph-preflight` then `/graph-run`. But note the constraint: a graph
run may not edit `thejudge-*` skills (DEC-167). If tuning turns out to need
skill edits, this becomes an ordinary session.

---

## Package 3 — Operator manual

**Outcome.** One document the owner opens to answer: I have a new idea / I found
a bug / I want to run something overnight — what do I type?

**First, a correction the notes need.** The notes ask whether a skill is missing
for kicking off fresh ideas. No skill is missing. **DEC-167 already made
`graph-run` the single intake door.** It accepts a plain-language request, takes
optional context files copied verbatim into `PRD/work/<slug>/intake/`, derives
its own slug and branch, and ends `BLOCKED` if the request is too thin to
package. What is missing is the *document that says so*.

`docs/prd-workflow-guide/` is not that document — it is an installation guide
for putting this workflow into a *different* repo. Nothing in it tells the owner
of TheJudge how to run a Tuesday.

**In scope**
- How to bring a new idea, and how much context is enough
- How to bring a bug (different intake — a bug has a reproduction, not a goal)
- How to set up an overnight run, and how to read the result the next morning
- What each gate means when it parks, and how to get through it
- Where each kind of truth lives after Package 1 changes the layout

**Out of scope**
- New skills. Prove a gap exists before adding a fourteenth skill.
- Rewriting `docs/prd-workflow-guide/` — different audience, leave it alone

**Door.** Ordinary session. Runs **after** Packages 1 and 2 land, or it
documents a layout and a run procedure that are about to change.

---

## Open-question walkthrough — evidence and recommendations

Measured 2026-08-22. **Superseded for status by `answers.md`** — the owner has
since ruled on most of these, and two rulings overturned the recommendation
below (A6/P1-Q3 `screen-layout.md`, and A9/P1-Q2 status granularity). Retained
here for the evidence and reasoning, not as the current position.

### New measurements

| Fact | Value | Bears on |
| --- | --- | --- |
| Source files citing REQ IDs | 60 under `apps/` + `scripts/` — tests, components, and `index.css` | P1-Q1 |
| REQ citations inside the corpus | 646 in `functional-requirements.md`, 180 in `system-map.md`, 69 in `user-flows.md`, 45 in `screen-layout.md`, plus every decision file | P1-Q1 |
| Registered destinations | 4 — `/quick-lookup`, `/in-depth`, `/life-tracker`, `/trade-balancer` (DEC-157) | P1-Q5 |
| Screen catalog entries | 20 — 8 shared chrome, 12 destination screens | P1-Q3, P1-Q5 |
| Cross-cutting player-facing features | 2 — Scan camera surface (used by 3 destinations per DEC-157's `manualChunks` group) and the Feedback modal (suite-wide) | P1-Q5 |
| Graph run lock | `.worktrees/.graph-run.lock`, one fixed path holding one slug (`scripts/lib/boundary-rules.mjs:95`, `slugFromLock`) | P2-Q2 |

### P1-Q1 — Does a feature spec replace its REQ entries, or link to them?

**Constraint first:** REQ IDs cannot be deleted. 60 source files cite them,
including tests that assert against them. The question is only where the *body*
lives, not whether the ID survives.

**Recommendation: move the body, keep the ID.** `functional-requirements.md`
becomes a thin router exactly as `decisions.md` already is. This is not a new
idea — **DEC-063 already ran this exact play**: a 1,030-line monolith at
read-first #1, split into domain files, bodies moved verbatim, IDs never
renumbered, router path preserved so every existing reference stayed valid. It
worked, and it is now being asked to work again at 159 entries instead of 62.
Reuse the playbook rather than inventing one.

Consequence to accept: acceptance criteria move next to the feature
description, which is what makes "read one directory and implement" true.

### P1-Q2 — What does a spec say about a feature that is planned, not shipped?

**Why it matters:** once specs are read-first #1, a reader must not have to open
a second file to learn whether the thing exists. An agent that reads a planned
feature's spec as current truth will build against fiction.

**Recommendation: every feature spec carries a `Status:` line** using
`system-map.md`'s existing vocabulary (`shipped` / `planned` / `partial`), and
`thejudge-cleanup` stays the only writer, enforcing DEC-044's promotion gate
unchanged. One writer, one gate, two readable places.

**The real difficulty is not the flip — it is granularity.** Per-feature status
is too coarse for what actually exists today. Trade Balancer's price artifact
ships while screenshot upload is deferred; Scan's art fidelity ships while
non-English special treatments sit in `ideasForLater/`. `partial` names that
without resolving it. Refinement should decide whether a spec marks status
per behavior rather than per feature, and that decision is the hard part.

### P1-Q3 — Does `screen-layout.md` survive as a separate catalog?

**Recommendation: keep it whole. Do not dissolve it into the feature specs.**
Two grounded reasons.

First, **8 of its 20 entries are shared chrome** — suite shell, menu rail and
tray, card detail popup, conversation history drawer, View Context overlay,
mock-mode banner, route load fallback. None belongs to a single page. Dissolving
the catalog leaves them homeless, which recreates the catch-all problem one
level up.

Second, **its rows are not layout preferences — they are measured
anti-regression bounds.** The Quick Question row records that an unbounded
image rendered 265×369 at 390×844 and pushed **Send Request** to `top` 868px
with 1004px of document scroll, that the fix is a `25dvh` / `42dvh` host-row
cap, and that REQ-141's "clear majority" is knowingly not met because REQ-129
binds first. It carries explicit "do not reintroduce" instructions. That
knowledge cost browser sessions to obtain and is the easiest thing in the corpus
to lose in a bulk move.

It is also the one file that already works the way the notes ask for — catalog,
fixed template, explicit agent read contract, authoritative per DEC-149. Let the
feature specs link to their rows. Revisit only once the specs exist and the real
overlap is visible rather than predicted.

### P1-Q4 — What keeps a spec honest after a package ships?

**Recommendation: both a writer and a check.**

`thejudge-cleanup` owns the spec write, the same way it already owns the DEC
write and the system-map flip. One writer.

Then add a **mechanical drift check** — every `Where it lives` path resolves,
and every REQ ID cited in `apps/` appears in some spec. This follows the
principle the repo already adopted in DEC-164: boundaries move "from prose into
scripts the run must pass." An unenforced doc-hygiene rule is convention, and
convention is what got this corpus into its current shape. A wrong spec at
read-first #1 is worse than no spec, because every downstream task inherits it.

### P1-Q5 — Which pages exist?

**Recommendation: six directories, not four and not twelve.**

Four are the registered destinations: `quick-lookup`, `in-depth`,
`life-tracker`, `trade-balancer`. Their screens become sections inside — Zone
confirmation and Zone collection are steps of one flow, not separate features,
so a directory per screen is too fine.

Two are cross-cutting but still player-facing, so they pass the "a player sees
it" test and earn their own directory: **Scan** (the player pushes a Scan
button in three different destinations) and **Feedback** (a suite-wide modal).

**This is the same instinct as the data rule, applied to features.** The notes
already said data should not be duplicated across the features that consume it.
Scan is exactly that problem on the feature side: documented once, referenced by
the three destinations that use it. Without its own directory it is either
duplicated three times or homeless.

### P2-Q1 — Which runs actually failed, and how?

Still blocked. This is the one question no amount of reading resolves — the
notes report "new issues with the new graph profile" without naming one, and the
repository holds no record of a failed run.

**Recommendation: capture at the moment of failure, not afterward.** Four
fields are enough: the exact command or tool call, the node it happened at, what
the hook or profile said, and the state the run was left in. Without these,
refinement will guess at boundaries that are already correct.

### P2-Q2 — Sequential queue or concurrent runs?

**Partly answered by the code.** The run lock is a single fixed path,
`.worktrees/.graph-run.lock` (`scripts/lib/boundary-rules.mjs:95`), holding one
slug that `slugFromLock` reads back. Within one checkout, concurrent graph runs
are structurally impossible today — not discouraged, impossible.

**Recommendation: sequential queue first.** One run at a time, next package
starts when the lock releases. It is the cheaper build, it matches the lock that
already exists, and an overnight window is long enough that wall-clock is rarely
the binding constraint.

Concurrency is not ruled out — DEC-154 permits it across packages — but it
requires separate checkouts with separate locks, and whether a git worktree
resolves `.worktrees/` to its own root or the main one is a thing refinement must
**verify by running it**, not reason about.

### P2-Q3 — What is the morning-after read?

**Recommendation: a one-screen digest per run batch.**

The existing artifacts are each right for their own job and wrong for this one.
The ledger (`GRAPH-RUN.md`) is per-run node state. The receipt is written at
cleanup and only for packages that shipped. The PR is per package. A three-package
night produces three PRs, up to three receipts, and three ledgers, with nothing
that answers the actual morning question: **what landed, what parked, and what
needs me.**

That digest does not exist and is genuinely new scope. Note that it is also the
natural home for the kill-switch and cap evidence the hook already records.

### Package 3 has no open questions

Its content is fully determined once Packages 1 and 2 land — it documents the
layout they produce and the run procedure they settle. That is precisely why it
runs last.

## Settled answers — 2026-08-23

Owner rulings. Full text and reasoning in `answers.md`.

| Ref | Ruling |
| --- | --- |
| A3 | DECs remain truth through Phases A and B; specs carry an explicit draft marker until Phase C flips precedence |
| A4 | **Dissolved.** The board is empty and no other work is in flight, so nothing can invalidate the audit |
| A5 | Phase A runs overnight as six sequential graph runs, one per feature |
| A6 | **`screen-layout.md` splits.** Per-screen rows go to their feature spec; shared chrome and the shared layout language become a general doc. *Overturns the "keep it whole" recommendation* |
| A7 | Flow bodies move to the spec owning the flow's starting point; cross-destination flows stay in a shared router; FLOW IDs preserved |
| A8 | Six feature directories confirmed, and the four-part `data/` membership test confirmed |
| A9 | **Status is tracked per behavior, not per feature.** *Overturns the per-feature recommendation.* Owner's reasoning: features are largely working but under continuous refinement, so a single per-feature label misstates reality |
| B1 | The audit splits by the 18 existing domain files |
| B2 | `thejudge-cleanup` owns the spec write; a script asserts path resolution and REQ coverage; advisory first, gate after one clean pass |
| P2-2 | Sequential queueing now; parallel explored later, together with ordering runs to reduce merge collisions |

### Consequences for the phase plan

- **Phase A gains a screen-layout split** (A6). Its hard constraint: every
  measured bound travels with the row it belongs to. A row landing in a feature
  spec stripped of its measurement is the failure this refactor is meant to
  prevent.
- **Phase A gains a per-behavior status field** (A9). The unit is unresolved —
  see N1 in `answers.md`. If it lands on REQ entries it needs a *new* field,
  because `doc-lifecycle.md` forbids overloading REQ `Status:` for
  shipped-vs-planned.
- **Phase A is calendar-bound, not compute-bound** (A5 + A2). Six features means
  roughly six owner gate sittings, so Phase A takes at least six nights however
  fast the agent is.
- **Phase B's cutoff question is moot** (A4). With nothing else shipping, no new
  decisions land mid-audit.
- **`open-questions.md` largely dissolves into the specs** (C1). Measured: four
  of its five entries are deferred feature ideas rather than questions, and
  three have sat 79 days. Only Q-001 is a live question. Q-005 is an unrelated
  operational decision about the fixture-leak rescue branch.

## Package 4 — Plain-language standard (proposed)

Raised by the owner's answer to P2-3, which went well past the morning digest it
was asked about.

**Outcome.** Every owner-facing artifact this workflow produces — pull request
descriptions, analysis documents, and the questions the agent asks — explains
itself in terms the owner can act on, optionally paired with technical detail.
The owner's stated need: *"I want to make sure I can give accurate feedback that
is based in my understanding of the issue."*

**Why it is its own package.** Every other package produces artifacts the owner
has to read. This one changes the quality of all of them, and it closes
Observations 1 and 2 from the original brain dump — the two problems that
started this whole effort and that none of Packages 1–3 actually addresses.

**Precedent already in the repo.** `graph-gate-review` requires the agent to
restate each item "in plain product terms first — what a player would experience
or do — before showing any diff," because "an owner deciding from a unified diff
alone is reading syntax, not product." That rule is correct and exists in
exactly one skill. This package generalizes it.

**Likely scope**
- A written standard in `PRD/instructions/`
- The morning-after digest from P2-3 as its first concrete artifact
- Edits to every skill that produces owner-facing output: PR bodies, gate
  questions, quality-check findings, cleanup receipts, blocker reports

**Open question.** Own package or cross-cutting rule folded into Packages 1–3?
Recommendation is its own package — see N3 in `answers.md`.

**Door.** Ordinary session — it edits `thejudge-*` skills.

## Round 3 rulings — 2026-08-23

Second batch of owner answers. Full text in `answers.md`.

| Ref | Ruling |
| --- | --- |
| A1 | Specs live under `PRD/sections/`; the define gate needs no change |
| A2 | Overnight covers refinement *and* implementation; answering moves to a markdown file, not the terminal |
| C1 | `open-questions.md` retires — Q-001 moves to the rules-retrieval spec as a live item, Q-002/003/004 fold into feature specs as deferred alternatives, Q-005 dropped |
| N1 | **IDs are edited in place, never superseded** — see below |
| N2 | Shared chrome gets its own bucket; screen rows go to their features; measurements retained where still valid |
| N3 | Plain-language standard confirmed as Package 4 |
| N4 | Merge-conflict ordering is a Package 2 sub-question |
| N5 | The overnight queue continues past a park; dependent features are accepted risk |

### Two premise changes

**Package 2 has no evidence base.** The owner has not run the graph on this
project at all. The brain dump's "new issues with the graph profile" was
preemptive reasoning, not observed failure. Package 2 therefore stops being a
parallel track and becomes *observe the first real run, then tune*. The first
Phase A feature doubles as the shakedown.

**A park already ends the run.** The contract is explicit — a parked run "stops.
It does not poll, retry, or continue to the next node," and `PARKED` is a
terminal state that releases the lock. The owner's concern about a session
waiting overnight was based on a wrong premise.

The *interface* is the real gap. Answering a gate today means
`graph-gate-review` walking the owner through it live in the terminal. The owner
stated twice that a markdown file with answer slots is better. Adopted as
direction: the gate writes a questions file and marks the PR blocked; the owner
answers on their own schedule; a follow-up run reads it and continues. Mechanism
belongs to Package 2, wording to Package 4.

### The N1 rule — the one that keeps this from rebuilding the DEC problem

The owner's constraint, verbatim: *"I don't want a defined behavior given a REQ
#, and then a future change creates a new one that says ignore the old one."*

**Rule: an ID names a place in the product, not a moment in time.** When
behavior changes, the entry is rewritten in place. A second entry is never added
to supersede the first. `REQ-129` stays `REQ-129` and its text always states
current truth.

That is precisely what separates this from the decision log. `DEC-151 → DEC-158
→ DEC-160` is three entries read in order to learn one fact. An edited-in-place
entry is one entry that already says it. IDs survive because 60 source files
cite them and the gate needs stable units to walk — but surviving does not
require accumulating.

Consequences: the REQ `Status: confirmed / superseded` field loses its meaning
and is replaced by a `Built:` marker; a removed behavior retires its ID rather
than being superseded, with B2's drift check catching orphaned code citations.

### Consequences for the phase plan

- **Phase A gains a seventh bucket** for shared chrome (N2/NN3), on the same
  rule that gave `scan` and `feedback` their own.
- **Phase A gains a measurement-retention pass.** Proposed test: a measurement
  survives if the surface it constrains still exists in code; ambiguous cases
  stay and are flagged.
- **Phase A's first feature is the shakedown run** — recommended to be `feedback`
  or `life-tracker`, so a guardrail problem surfaces against a small diff.
- **`open-questions.md` is retired**, not merely thinned.
- **Package 2 is resequenced** to run after Phase A's first feature rather than
  alongside it.

### Still open

Four questions in `answers.md`: whether overnight is one run or two (NN1),
whether feature one is an explicit shakedown (NN2), shared chrome as a seventh
directory (NN3), and the measurement-retention test (NN4).

NN1 is the one that shapes the workflow — the owner described two runs with two
PRs, where today's design is one run with two human touchpoints inside it.

## Round 4 rulings — 2026-08-23

| Ref | Ruling |
| --- | --- |
| NN1 | **Two runs, two PRs.** Run one ends when the spec is agreed; run two builds from it |
| NN2 | Shakedown first run confirmed; feature choice and a new code-health request pending in `answers.md` |
| NN3 | Shared chrome is the seventh feature-side directory |
| NN4 | A measurement survives if the surface it constrains still exists in code; ambiguous cases stay and are flagged |

### The two-run split is a stop condition, not a node-table rewrite

Measured before writing it up. `graph-run/reference.md:102-110` already carries
an entry-point table keyed on the package's `STATUS.*` marker, and
`STATUS.refined` already re-enters at `gate-qc`. The resume machinery exists.

**Run one** — `preflight` → `shape` → `define` → `gate-qc`, stopping on PASS
with the package at `STATUS.refined`, a docs-only PR open, and a questions file
written.

**Run two** — `/graph-run PRD/work/<slug>/`, which re-enters at `gate-qc` and
continues through `plan`, `build`, `review`, `land`, `close`.

The only contract change is that `gate-qc` ends the run on PASS instead of
advancing to `plan`. The node table, the gate, and every boundary are unchanged.
This lands in Package 2 alongside the async gate interface.

### New scope — code-health observation during Phase A

Raised by the owner's NN2 answer: they want feedback on duplicate code, general
practices, and cleanup.

Well-timed, because writing a feature's spec requires reading that feature's
code end to end — the agent is already positioned to notice duplication.

**Proposed shape:** each Phase A run writes a `CODE-HEALTH.md` beside the spec
recording duplication, consolidation candidates, and dead code. **Observation
only — the run never acts on it.** Phase A is a documentation phase, and letting
it refactor would make the first PR unreviewable in one sitting and blur the
docs-only boundary the two-run split just established.

The six resulting files become their own backlog once Phase A completes. Serves
goal 3 of the original brain dump: using the workflow to triage, not only build.

Pending owner confirmation, along with which feature runs first — the word
`feedback` is both a candidate feature and what they asked for, so the choice is
genuinely ambiguous. Recommendation if still open: `life-tracker`, being
self-contained, frontend-only, and short enough for a small first gate walk.

## Sequencing

1. ~~Answer D1 and D2.~~ Done — recorded above.
2. **Capture the graph failures** as they happen. Package 2's refinement is
   blocked on evidence that does not exist yet.
3. **Package 1 and Package 2 in parallel** — disjoint file sets, no shared
   truth. Package 1 touches `PRD/sections/`; Package 2 touches
   `scripts/`, `.claude/`, and `PRD/instructions/`.
4. **Package 3 last.**

## Kicking these off today

```
/graph-preflight
/graph-run "<request in your own words>" PRD/work/adhoc/workflow.md PRD/work/adhoc/workflow-decomposition.md
```

Both files are copied verbatim into the package's `intake/` as evidence. Intake
never binds refinement — every product decision it raises is still made with the
owner at the `define` gate.

For Package 1, read the door warning above first.
