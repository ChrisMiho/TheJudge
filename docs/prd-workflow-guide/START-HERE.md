# START HERE — Agent Installation Procedure

**You are an agent. Someone dropped this folder into their repo and asked you to
set up the PRD workflow. This document is your job description. Follow it top to
bottom.**

If you are a human, you can read this too — it tells you what your agent is
about to do and where it will stop to ask you things. Then read `README.md` for
the conceptual tour.

---

## What you are installing

A documentation-plus-skills system that gives coding agents durable product
memory. Product truth lives in an ID-addressed markdown corpus under `PRD/`.
Process lives in invocable skills. Feature planning happens in a disposable
folder that gets deleted when the feature ships, after its conclusions have been
promoted into the permanent corpus.

You do not need to understand all of it before starting. This procedure tells
you which chapter to read at the moment you need it.

## Rules for this installation

1. **Do not install everything at once.** Phases 1–3 are the core. Phase 4 is
   optional and most projects should skip it on the first pass.
2. **Stop at every checkpoint marked STOP.** These need a human answer you
   cannot infer from the repo.
3. **Do not invent product truth.** When you backfill decisions in Phase 2 you
   are transcribing choices that were already made, not making new ones. If you
   cannot find evidence for a decision, ask — do not write it.
4. **Do not modify product code.** This installation touches documentation,
   skill definitions, one shell script, and one `package.json` line.
5. **Work in a branch.** `git checkout -b prd-workflow-setup` before Phase 1.

---

## Phase 0 — Interview

**STOP. Ask the human these questions before writing anything.** You need the
answers to fill placeholders throughout the templates, and guessing wrong means
find-and-replacing twice.

| # | Question | Used for |
| --- | --- | --- |
| 1 | What is the product called, in plain words? | `<Product>` |
| 2 | What short lowercase prefix should the skills use? | `proj-` → e.g. `acme-` |
| 3 | What single command runs lint, typecheck, and tests? | `<quality-command>` |
| 4 | Which directories hold product code? | `<code-roots>` |
| 5 | Which agent runtimes do you use — Cursor, Claude Code, Codex, other? | Whether the sync script is needed, and its destinations |
| 6 | Should `PRD/` live at the repo root, or inside a package? | Install location |
| 7 | How much do you want now: core only, or core plus autonomy? | Whether to run Phase 4 |

If the answer to 3 is "there isn't one," say so plainly and recommend building it
first. Half the value of the slice model comes from every slice ending in a
green, reproducible command. The system will still install without it, but slice
verification will be weaker.

Record the answers. You will reference them in every later phase.

---

## Phase 1 — Scaffold the corpus

Read `02-prd-directory.md` before starting this phase.

1. Copy `templates/PRD/` to the location chosen in question 6.
2. Delete the pieces that do not apply:
   - No UI? Skip the screen-catalog guidance in `sections/system-map.md`.
   - Agents never drive browsers or dev servers? Delete
     `instructions/runtime-process-hygiene.md`.
   - No external services or credentials yet? Keep
     `instructions/secrets-handling.md` anyway. It costs nothing and you will
     want it before you remember to add it.
3. Find-and-replace `<Product>`, `<quality-command>`, and `<code-roots>`
   throughout the copied tree.
4. Fill in `PRD/README.md` — the inventory tables and, most importantly, the
   "Which Files to Read for Which Task" lists. Base the task list on what work
   actually happens in this repo.
5. Leave the `_`-prefixed template files in place for now. They are patterns to
   copy from, and the human can delete them later.

**Verification:** every file in the copied tree either has real content or is
clearly marked as a template. No `<Product>` or `<quality-command>` tokens
remain outside `_`-prefixed files.

---

## Phase 2 — Backfill product truth

This is the phase that determines whether the whole system is worth anything.
Everything else is structure; this is content.

### 2a. Decisions

Read `02-prd-directory.md`'s decisions-router section if you have not.

1. Gather evidence. Look at, in this order: recent pull request descriptions and
   review discussions, existing architecture or ADR documents, README and
   contributing files, commit messages that explain *why*, and comments in code
   that justify a non-obvious approach.
2. Draft a `DEC-###` for every non-obvious choice that is **still in force**.
   Twenty to forty is a realistic first pass.
3. Group them into `sections/decisions/<domain>.md` files by subsystem or topic.
4. Write the router index row for each one in `sections/decisions.md`. Every
   body needs exactly one index row — this is the rule most often broken.

**STOP. Present the drafted decision list to the human before finalizing.** You
are transcribing their past choices; they are the only one who can confirm you
read the evidence correctly, and a wrong decision in the corpus is worse than a
missing one because later work will be built on it.

Anything you could not find evidence for becomes a `Q-###` in
`sections/open-questions.md`, not a guessed decision.

### 2b. Requirements

Do **not** attempt a complete specification of an existing product. You will not
finish, and a half-finished specification is worse than none because it looks
authoritative.

Write `REQ-###` entries only for the areas that are actively worked on. The
corpus grows as features are touched.

### 2c. The rest

- `sections/overview.md` — you can draft this from the repo. Keep it under a
  hundred lines.
- `sections/goals-and-non-goals.md` — draft the goals, but **ask** for the
  Explicit Non-Goals. That list is the highest-value part of the file and it
  lives entirely in the human's head.
- `sections/system-map.md` — you can build this from the code. One row per
  subsystem: status, one-line behavior, coarse location, backing IDs. Mark
  everything `shipped` that exists and is wired in; the receipt half of the
  promotion gate does not apply retroactively, so note in the file that
  pre-existing entries were seeded at install.
- `sections/problem-statement.md` and `sections/personas.md` — **ask.** Do not
  draft these from code. Inferred personas are fiction.

### 2d. Technical design rules

**STOP. Interview the human for `instructions/technical-design-rules.md`.**

The section that matters is **Forbidden Design Drift**. Ask directly: "What
architectures, patterns, or dependencies do you not want anyone adding to this
codebase?" Push for specifics — the microservice split, the plugin system, the
caching layer, the abstraction someone would build "for future flexibility."

A generic "avoid over-engineering" stops nothing. Named prohibitions stop things.

### 2e. Test naming vocabulary

Derive the closed feature vocabulary in `instructions/test-naming.md` from the
existing test suite and directory structure, then confirm it with the human.

**Verification for Phase 2:** ask a fresh agent session, with no context beyond
the repo, to read `PRD/README.md` and describe what the product is and what its
current constraints are. If the answer is wrong or thin, the corpus is not doing
its job yet. Report this result to the human honestly rather than declaring
success.

---

## Phase 3 — Install the skills

Read `04-skills.md` before starting this phase.

1. Copy the **core six** from `templates/skills/` into the canonical skill path
   for the primary runtime from question 5 — usually `.cursor/skills/`:

   `proj-kickoff`, `proj-refinement`, `proj-quality-check`, `proj-map-out`,
   `proj-implement`, `proj-cleanup`

   Leave `proj-implement-all`, `proj-implement-fanout`, `proj-defer`, and
   `proj-prepare` for Phase 4.

2. Rename each folder from `proj-` to the prefix from question 2, and replace
   `proj-` and `<Product>` inside every file. Check the `name:` frontmatter
   field matches the folder name exactly — a mismatch means the runtime will not
   find the skill.

3. Copy `templates/PRD/work/STATUS.md` if Phase 1 did not already place it, and
   confirm `PRD/README.md` has a single-line pointer to the board and no package
   table of its own.

4. Copy `templates/AGENT-SKILLS.md` to the repo root and fill in the catalog.
   Remove rows for skills you did not install.

5. Copy `templates/AGENTS.md` to the repo root. Duplicate it as `CLAUDE.md` if
   Claude Code is in use. Keep the process-precedence section — without it,
   agents will sometimes follow a competing planning convention from another
   skill library and write specs into a directory nobody reads.

6. Multi-runtime only: copy `templates/scripts/sync-agent-skills.sh` to
   `scripts/`, correct its destination list for the runtimes from question 5,
   `chmod +x` it, and add
   `"skills:ai-sync": "bash scripts/sync-agent-skills.sh"` to `package.json`.
   Run it once and verify with `diff -rq` that the trees match.

**Verification:** every installed `SKILL.md` starts with `---`, its `name:`
matches its folder, and its Reads list names only files that exist. Grep for a
leftover `proj-` and for `<Product>`.

---

## Phase 4 — Autonomy (skip unless asked)

Only run this if the answer to question 7 asked for it, and only once the
quality gate from question 3 is genuinely trustworthy. These skills run
unattended; nobody is watching when the gate lies.

Install in this order, stopping when the human has what they need:
`proj-implement-all`, then `proj-defer`, then `proj-implement-fanout`, then
`proj-prepare`.

Each requires repo-level setup the core six do not: a worktree root
(`.worktrees/`) added to your lint and format ignore files, capture directories
added to `.gitignore`, and a branch and PR convention. Read
`04-skills.md` and the relevant skill's `reference.md` before installing.

---

## Phase 5 — Prove it works

Do not declare the installation complete until a real feature has gone through
it. A system that has never been exercised is a system that does not work yet;
you just have not found out how.

1. Ask the human for a small, real piece of upcoming work.
2. Run it through: kickoff → refinement → quality-check → map-out → implement →
   cleanup.
3. Confirm at the end that `PRD/work/<slug>/` is **actually gone** and a receipt
   exists at `PRD/instructions/receipts/<slug>-<date>.md`.

Every gap you hit is a real defect in the installation. Fix it in the
instruction or skill file rather than working around it in the moment — that is
how the system is meant to be maintained, and starting the habit now is the
point of this phase.

---

## Handoff report

When you finish, tell the human:

- Which phases you completed and which you skipped, with the reason
- The decision IDs you backfilled and which ones they should double-check
- Every `Q-###` you opened, because each one is a question you could not answer
- Which files you left as templates for them to fill in
- The result of the Phase 2 fresh-agent test, honestly
- The exact next command to run

Then point them at `05-adoption.md` for the failure modes worth watching in the
first month.

---

## If you get stuck

| Situation | What to do |
| --- | --- |
| The repo already has a planning-doc directory | Do not delete it. Report it, and read the prohibited-patterns section of `templates/PRD/instructions/doc-lifecycle.md` with the human — migrating it is their call |
| There is no quality command | Install anyway, report the gap, and recommend building one before Phase 4 |
| The product is too new to have decisions | Normal. Install the structure with an near-empty decisions file and let it grow. Do not invent decisions to fill it |
| A runtime's skill path is not what the templates assume | Trust the runtime's current documentation over these templates. Discovery paths change |
| The human wants only part of the system | Good instinct. Follow the tiers in `05-adoption.md` and install only that tier |
