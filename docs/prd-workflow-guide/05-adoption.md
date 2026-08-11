# 05 — Adoption

How to actually put this in a repo, in what order, and what goes wrong.

---

## Adopt in tiers

Do not install all four layers on day one. Each tier is independently useful and
earns the next one.

### Tier 1 — Durable truth (half a day)

Goal: an agent can learn your product from the repo.

1. Create `PRD/sections/` with `decisions.md`, `functional-requirements.md`,
   and `overview.md`.
2. Write `PRD/README.md` — inventory tables plus the "which files to read for
   which task" lists.
3. Backfill decisions. Go through your last few months of pull requests, chat
   history, and arguments, and write a `DEC-###` for every non-obvious choice
   that is still in force. Twenty to forty entries is a realistic first pass and
   the highest-value hour you will spend.
4. Backfill requirements only for the areas that get worked on. Do not attempt
   a complete specification of an existing product; you will not finish, and the
   half-finished version is worse than nothing because it looks authoritative.
5. Add `PRD/instructions/writing-rules.md` and `requirement-format.md` so the
   next entries stay consistent.

**Stop here and use it for two weeks.** Point agents at `PRD/README.md` at the
start of a session and notice how often you stop repeating yourself.

### Tier 2 — Ephemeral work packages (a few hours)

Goal: planning stops accumulating.

1. Create `PRD/work/STATUS.md` with the status headings.
2. Add `PRD/instructions/doc-lifecycle.md` and `workflow-reference.md`.
3. Adopt the three-marker rule and the `IDEA` → `DESIGN-BRIEF` → `GAMEPLAN` →
   slices progression, by hand at first.
4. Run one real feature through it manually, end to end, including the delete
   and the receipt.

Doing one by hand before automating is worth the time. You will discover which
parts your project actually needs and which are ceremony, and you will write
much better skills afterwards.

### Tier 3 — Core skills (a day)

Goal: the process runs itself.

1. Copy `templates/skills/` and rename `proj-` to your prefix.
2. Start with two: map-out and implement. They deliver most of the value.
3. Add kickoff, refinement, quality-check, and cleanup as the pipeline settles.
4. Add `AGENT-SKILLS.md` and the root pointer files.
5. Add the sync script only if you use more than one runtime.

### Tier 4 — Autonomy (as needed)

Goal: unattended runs.

Add `implement-all`, then `defer`, then `fanout`, then `prepare` — in that
order, and only when you feel the specific pain each addresses. This tier
requires that your quality gate is genuinely trustworthy, because nobody is
watching.

---

## Port checklist

Concrete steps once you have decided to adopt.

### Naming

- [ ] Choose the skill prefix. Short, lowercase, matches the project.
      Rename `proj-*` throughout `templates/skills/`.
- [ ] Replace `<Product>` with your product name in all templates.
- [ ] Replace `<quality-command>` with your real single-command gate.
- [ ] Replace `<code-roots>` with your actual code directories.

### Structure

- [ ] Decide where `PRD/` lives. Repo root is right for a single product; a
      package subdirectory is right for a monorepo where one product among
      several needs this.
- [ ] Confirm your runtimes' skill discovery paths and fix the sync script's
      destination list.
- [ ] Add `PRD/work/*/.playwright-mcp/` and any capture directories to
      `.gitignore`. Add worktree roots to your lint and format ignore files —
      an agent worktree containing a full copy of the repo will otherwise get
      linted, doubling every check.

### Content you must write yourself

Four files cannot be templated, because they encode judgments only you have.
Everything else can be copied and edited later.

- [ ] **`sections/decisions/`** — your backfilled decisions. Nothing else in
      the system works without these.
- [ ] **`instructions/technical-design-rules.md`** — especially the *forbidden
      design drift* list. Write down the architectures you do not want. Be
      specific and be blunt.
- [ ] **`sections/goals-and-non-goals.md`** — especially Explicit Non-Goals.
- [ ] **`instructions/test-naming.md`** — the closed feature vocabulary for
      your product.

### Verify

- [ ] Ask a fresh agent session, with no context beyond the repo: "read
      `PRD/README.md` and tell me what this product is and what the current
      constraints are." If the answer is wrong or thin, the corpus is not doing
      its job yet.
- [ ] Run one feature through the full pipeline including cleanup. Confirm the
      work folder is actually gone and a receipt exists.

---

## What to change for your project

| Element | Keep as-is | Adapt |
| --- | --- | --- |
| ID scheme (`DEC`/`REQ`/`NFR`/`FLOW`/`Q`) | Yes | Add prefixes if you have a domain that needs one |
| Entry templates | Yes | Add fields; resist removing Constraints or Notes |
| Decisions router split | Yes | Your domain file names |
| Four-layer precedence | Yes | — |
| Package status vocabulary | Yes | Drop `owner-action` if you never block on humans |
| Three-marker rule | Yes | — |
| Slice doc format | Yes | — |
| Handoff block | Yes | — |
| Receipt convention | Yes | — |
| Secrets handling | Yes | Your service names in examples |
| `technical-design-rules.md` | No | Rewrite entirely |
| `test-naming.md` vocabulary | No | Rewrite the closed vocabulary |
| `runtime-process-hygiene.md` | Only if agents drive browsers | Your tooling |
| System map | Yes, if the product has subsystems | Your subsystem names |
| Screen catalog | Only if you have a UI | — |
| Skill prefix and command syntax | No | Your prefix and runtimes |

---

## Failure modes

These are the ways the system degrades. Each has an early symptom worth watching
for.

### The corpus grows a second source of truth
**Symptom:** someone adds a roadmap table to `PRD/README.md`, or a `docs/specs/`
directory appears, or a work package's design brief starts being cited as truth
after the package shipped.
**Fix:** the navigation file stays navigation-only; the prohibited-patterns list
in `doc-lifecycle.md` names the specific directories; cleanup promotes and then
deletes. When you catch a violation, add it to the prohibited list by name.

### Cleanup gets skipped
**Symptom:** `PRD/work/` has fifteen folders, several `ship-ready`, oldest from
three months ago.
**Fix:** promotion is an acceptance criterion on the final slice, not a policy.
If it is still being skipped, the ship gates are not being read — move them
higher in the slice doc and make the implement skill restate them.

### Decision drift
**Symptom:** two decisions in different domain files contradict each other, and
neither is marked superseded.
**Fix:** this is what the quality-check gate exists for — the "does the brief
contradict a confirmed DEC" question. If drift is still landing, the gate is
being run as a formality. Make it produce a written verdict, and treat a FAIL as
a real stop.

### Slice docs that cannot be executed cold
**Symptom:** an agent handed a slice asks a clarifying question.
**Fix:** that question is a defect in the map-out output. Treat it that way —
answer it *into the slice doc*, not just in chat. Over a few features the
slicing quality improves noticeably, because the gaps become visible.

### Over-documentation
**Symptom:** a two-line CSS fix acquires a design brief, a gameplan, and four
slices.
**Fix:** the pipeline is for work that needs planning. Small changes should
still respect the corpus — read the decisions, honor the constraints — without
generating a package. State this explicitly in your working rules, because
agents will otherwise follow the heaviest available process every time.

### Stale IDs
**Symptom:** an agent renumbers requirements to "clean them up," or deletes a
superseded decision.
**Fix:** state the immutability rule in `writing-rules.md` and in the
prohibited-behaviors list. It is worth repeating in more than one place; this is
one of the few violations that is genuinely expensive to reverse.

### Skills drift from reality
**Symptom:** a skill's `Reads` list names a file that no longer exists.
**Fix:** skills are documentation and rot like documentation. When you move or
rename a durable file, grep the skill tree. Cleanup's corpus-hygiene mode exists
partly for this.

---

## Effort and payoff, honestly

**Setup:** one to two days for tiers 1–3, most of it spent backfilling
decisions rather than writing structure.

**Ongoing:** perhaps fifteen minutes per feature in overhead beyond what you
would spend planning anyway, plus the cleanup step.

**Payoff, in rough order of how quickly you notice it:**

1. Sessions stop with re-explaining the product. Immediate.
2. Multi-session features become resumable by a cold agent. Within a week.
3. Planning documents stop accumulating. Within a month.
4. Decisions stop being re-litigated. Within two months.
5. Unattended implementation runs become trustworthy. Tier 4 only, and only
   after the quality gate has earned trust.

**Where it is not worth it:** short-lived projects, solo scripts, and anything
you will not touch again in three months. The system pays for itself through
repetition. If there is no repetition, the overhead is the whole cost.
