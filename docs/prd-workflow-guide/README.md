# Agent-Driven PRD Workflow — Portable Guide

A complete, product-agnostic description of a documentation-plus-skills system
that lets coding agents plan and ship features without a human re-explaining the
product every session.

**Installing this? Go to [`START-HERE.md`](./START-HERE.md).** It is a phased
installation procedure written for an agent to execute — interview, scaffold,
backfill, install skills, prove it works — with explicit stops where a human
answer is required. You do not need to read this guide first; the procedure
tells you which chapter to read at the point you need it.

This file and the numbered chapters are the **explanation**: what the system is
and why each part exists. Read them if you are evaluating whether to adopt the
system, or if you want to understand something the installation procedure told
you to do. A human evaluating adoption should read this file and
`05-adoption.md`, then skim the rest.

---

## The one-paragraph summary

Product knowledge is stored as a small, ID-addressed corpus of markdown under
`PRD/` that agents read before doing anything. Process knowledge — how to shape
an idea, how to slice it, how to implement a slice, how to close it out — is
stored as a handful of invocable **skills** that each read a defined set of
files, write a defined set of files, and hand off to the next skill by name.
Feature work happens inside a disposable folder, `PRD/work/<slug>/`, that is
created at the idea stage, grows planning artifacts as the idea matures, and is
**deleted** when the feature ships — after its durable conclusions have been
promoted into the permanent corpus and a receipt has been written. The result is
a repo where a cold agent can be told "implement slice C" and needs nothing else.

---

## What problem this actually solves

Long-lived agent-assisted projects fail in five predictable ways. Each part of
the system exists to kill one of them.

| Failure mode | What it looks like | What kills it |
| --- | --- | --- |
| **Context amnesia** | Every session re-explains the product; agents re-derive intent from code | A durable `PRD/sections/` truth layer read before any work |
| **Decision drift** | The same question gets re-litigated with a different answer each time | Immutable `DEC-###` decisions with explicit supersession |
| **Planning-doc sprawl** | `docs/plans/`, `docs/analysis/`, 40 stale markdown files nobody trusts | An ephemeral `PRD/work/<slug>/` folder with a mandatory delete step |
| **Half-finished work** | A session dies mid-feature; the next agent can't tell what's done | Slice docs with a status line and a handoff block |
| **Silent scope creep** | The agent "helpfully" adds an endpoint, a dependency, a layer | Explicit forbidden-drift rules and an assumption ladder |

If you only have one of these problems, adopt only the part that fixes it. The
system is designed to be taken in tiers — see `05-adoption.md`.

---

## What is in this folder

| File | Role |
| --- | --- |
| `START-HERE.md` | **Executable** — the phased installation procedure an agent follows |
| `README.md` | This file — orientation and the map |
| `01-` … `05-` | **Explanatory** — the reasoning behind each part of the system |
| `templates/` | **Copyable** — the runnable skeleton you install |

---

## Read order

Read in this order. Each document assumes the previous one.

| # | File | What you get |
| --- | --- | --- |
| 1 | `01-architecture.md` | The four layers, the precedence rule, and why the ephemeral/durable split is the load-bearing idea |
| 2 | `02-prd-directory.md` | Full anatomy of `PRD/sections/` and `PRD/instructions/`, the ID system, the decisions router pattern |
| 3 | `03-work-packages.md` | The `PRD/work/<slug>/` lifecycle, the status vocabulary, the three-marker rule, slice docs |
| 4 | `04-skills.md` | What a skill is, the SKILL.md format, multi-runtime sync, the ten-skill catalog, the handoff protocol |
| 5 | `05-adoption.md` | Tiered port checklist, what to change for your project, failure modes and anti-patterns |

Then use `templates/` as the thing you actually copy.

---

## What is in `templates/`

A runnable skeleton. Copy it into your repo, rename the placeholder prefix, and
delete what you don't want.

```
templates/
  README.md                        # what to copy where, and in what order
  AGENT-SKILLS.md                  # skill catalog + sync doc, for your repo root
  AGENTS.md                        # short root pointer incl. process precedence
  scripts/sync-agent-skills.sh     # mirrors the canonical skill tree to other runtimes
  PRD/
    README.md                      # control-plane / navigation document
    sections/                      # durable product truth (11 starter files)
    sections/decisions/            # domain decision files
    instructions/                  # durable agent process rules (9 starter files)
    instructions/receipts/         # permanent ship receipts + receipt template
    work/
      STATUS.md                    # the work-package board
      _package-template/           # IDEA / README / DESIGN-BRIEF / GAMEPLAN / slice
  skills/
    proj-kickoff/ ... proj-prepare/   # 10 skill definitions
```

Every template file uses these placeholders. Replace all of them before use:

| Placeholder | Meaning | Example |
| --- | --- | --- |
| `proj` / `<proj>` | Short skill prefix, lowercase, no spaces | `acme` → skills become `acme-kickoff` |
| `<Product>` | Human-readable product name | `Acme Billing` |
| `<slug>` | A work package's kebab-case folder name | `invoice-export` |
| `<quality-command>` | Your one-command lint + typecheck + test gate | `npm run quality:check` |
| `<code-roots>` | Where product code lives | `apps/frontend`, `apps/backend` |

A single find-and-replace on `proj-` plus the four angle-bracket tokens gets you
most of the way.

---

## The minimum viable version

If the full system looks like too much, this is the irreducible core. It is
about two hours of setup and delivers most of the value:

1. `PRD/sections/decisions.md` — a numbered, append-only list of confirmed decisions.
2. `PRD/sections/functional-requirements.md` — numbered requirements with acceptance criteria.
3. `PRD/README.md` — a navigation file that tells an agent which file to read for which task.
4. `PRD/work/<slug>/` — one folder per in-flight feature, deleted when it ships.
5. Two skills: one that plans a feature into slices, one that implements a slice.

Everything else in this guide is hardening around those five things.

---

## A note on why this is a docs system and not a tool

There is no runtime, no database, no server, and one 12-line shell script. The
entire system is markdown files plus a naming discipline. That is deliberate:

- Agents already read markdown well; no adapter layer is needed.
- It survives model changes, IDE changes, and vendor changes.
- It is diffable, reviewable, and versioned by git for free.
- A human can fix any part of it with a text editor.

The cost is that nothing is enforced automatically. The rules hold because the
skills restate them at the moment they matter, and because reviewers can see in
a diff when they were broken. Budget for the fact that you will occasionally
need to correct an agent that ignored a rule — and when you do, the fix is to
make the relevant instruction file more explicit, not to add tooling.
