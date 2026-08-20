# 04 — The Skill System

Skills are the process layer: named, invocable procedures that turn "help me
build this" into a sequence of bounded steps with explicit file contracts.

---

## What a skill is, mechanically

A folder containing a `SKILL.md` with YAML frontmatter:

```
skills/proj-map-out/
  SKILL.md        # required: frontmatter + the procedure
  reference.md    # optional: templates and detail the skill loads on demand
```

```markdown
---
name: proj-map-out
description: >-
  Creates GAMEPLAN.md and lettered slice docs in PRD/work/<slug>/ for
  sequential agent implementation, and sets STATUS.active. Use after
  quality-check passes, once the work is ready to be sliced.
---

# <Product> Map Out

## Goal
...
```

The `description` is not documentation — it is the **routing key**. Agent
runtimes match user intent against descriptions to decide whether to invoke a
skill automatically. A description must therefore state three things:

1. **What the skill produces** (`GAMEPLAN.md and lettered slice docs`)
2. **When to use it** (`after quality-check passes`)
3. **When not to use it / what it is not** — the disambiguator against the
   neighbouring skill

That third part matters most. Two skills named "implement one slice" and
"implement all slices" will be confused constantly unless each description
explicitly excludes the other. Write descriptions defensively:
`For completing every remaining slice in one unattended session, use
proj-implement-all instead.`

### The SKILL.md body

Keep it short — sixty to a hundred lines. A skill is a procedure, not an essay.
Anything longer goes in `reference.md`, which the skill loads only when it needs
it. Standard headings:

| Heading | Contents |
| --- | --- |
| `## Goal` | One sentence defining done |
| `## Inputs` | What the invoker supplies |
| `## Reads` | Exact file list — reading beyond it is a violation |
| `## Writes` | Exact file list — writing beyond it is a violation |
| `## Status transitions` | Which status values this skill may set |
| `## Gates` | Hard refusals |
| `## Next step` | One sentence plus the literal next command |

The `Reads` list is a context budget as much as a permission. The kickoff skill
reads exactly two files by design; letting it wander the corpus would defeat its
purpose.

---

## Multi-runtime sync

Different agent runtimes discover skills at different paths. Rather than
maintaining parallel copies, pick one canonical tree and mirror it.

| Runtime | Discovery path | Role |
| --- | --- | --- |
| Claude Code | `.claude/skills/` | canonical — edit here |
| Codex | `.agents/skills/` | synced copy |

Verify the paths your runtimes actually use before committing to this table;
they change. The mirror script is ten lines:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/.claude/skills"

for dest in "$ROOT/.agents/skills"; do
  mkdir -p "$dest"
  rsync -a --delete "$SRC/" "$dest/"
done

echo "Synced $SRC -> .agents/skills/ (plain mirror)"
```

Wire it as `"skills:ai-sync": "bash scripts/sync-agent-skills.sh"` and make the
workflow explicit in your repo root doc:

1. Edit under the canonical path only.
2. Run the sync.
3. Verify with `diff -rq .claude/skills .agents/skills` — no output expected.
4. Commit all trees together.

`--delete` is what keeps the mirror honest: a skill removed from the canonical
tree disappears everywhere. Without it, deleted skills linger in one runtime and
you get ghost behavior that is very confusing to debug.

If you only use one runtime, skip all of this and keep a single tree.

---

## The handoff protocol

Every skill that continues into another ends with a **Next step**: one sentence
plus the literal command.

```markdown
## Next step

All slices are done. Run `/proj-cleanup PRD/work/<slug>/` to promote durable
truth, write the receipt, and delete the work folder.
```

Command prefixes differ by runtime — `/skill-name` in Claude Code,
`$skill-name` in Codex. State the rule once in your workflow reference and have
skills substitute the real slug, slice letter, or path rather than leaving
placeholders in the output.

This is a small thing that changes how the system feels to use. Without it, each
phase ends with the user wondering what to do next. With it, the terminal always
shows the next move, and a person returning after a week can just run what the
last session printed.

---

## The ten-skill catalog

Six skills are the core pipeline. Four are optional, and each solves a problem
you will not have on day one.

### Core pipeline

| Skill | When | Writes | Status result | Hands off to |
| --- | --- | --- | --- | --- |
| `proj-kickoff` | New session, or a new idea | `IDEA.md`, package `README.md`, marker, board row | → `ideation` | refinement |
| `proj-refinement` | An idea needs product definition | `DESIGN-BRIEF.md`, `PRD/sections/` updates | `refining` → `refined` on approval | quality-check |
| `proj-quality-check` | After refinement, before slicing | A PASS/FAIL report — nothing else | PASS keeps `refined`; FAIL → `refining` | map-out or back to refinement |
| `proj-map-out` | Quality-check passed | `GAMEPLAN.md`, `slice-*.md`, README slice table | → `active` | implement |
| `proj-implement` | Executing one planned slice | Product code and tests | last slice done → `ship-ready` | next slice, or cleanup |
| `proj-cleanup` | Package is `ship-ready` | Section promotions, receipt, board strip, folder delete | package removed | terminal |

### Optional extensions

| Skill | Problem it solves |
| --- | --- |
| `proj-defer` | Real work that is not next work. Parks a package reversibly, preserving every artifact, branch, and PR; records the previous status so restoring is exact. Refuses `ship-ready` packages and `active` packages with an `in-progress` slice — both indicate work that should be finished, not parked. |
| `proj-implement-all` | Long features you do not want to babysit. Runs every remaining slice in one unattended session inside an isolated worktree, one green milestone commit per slice, pushing to a shared branch and keeping a PR updated so the run stays reviewable while it happens. |
| `proj-implement-fanout` | Two or more packages that should progress at once. Dispatches one isolated worktree and agent per package. Its real work is the safety check: it diffs the `Files touched` lists of every pair and forces overlapping packages to run sequentially. |
| `proj-prepare` | Turning an arbitrary request into an implementation-ready package without a human in the loop. Orchestrates kickoff through map-out autonomously, then publishes a docs-only PR that a human reviews before implementation begins. |

Do not build the optional four until you feel their absence. Each adds real
operational surface — worktrees, branches, PR bodies, race handling — and each
is only worth it once the core loop is a habit.

---

## Two behaviors worth stealing from the autonomous skills

Even if you never build `proj-prepare`, two of its ideas are useful everywhere.

### The assumption ladder

An autonomous agent cannot stop to ask a question, but it also must not invent
scope. The ladder gives it a deterministic order for resolving uncertainty:

1. Active decisions and requirements in `PRD/sections/`.
2. Existing tested behavior and public contracts.
3. Established local code patterns.
4. The smallest reversible scope.
5. Preserve user-visible behavior unless the request explicitly changes it.
6. Never add a dependency, endpoint, contract, layer, or integration without
   authoritative scope backing it.

Every assumption made this way is recorded in the design brief with the evidence
that justified it. This converts "the agent guessed" into "the agent inferred
from line 3 of the ladder, here is the citation" — which is reviewable.

### The genuine-blocker test

Agents stop too often or not often enough. Three conditions must *all* hold for
a real blocker:

1. The unknown materially changes product behavior.
2. No authoritative basis exists to resolve it.
3. Even the smallest viable option still silently decides the question.

If any one fails, proceed using the ladder. If all three hold, stop, write a
`Q-###`, preserve every valid artifact produced so far, and emit a restart
prompt specific enough to resume cold once the human answers.

---

## Repo-root wiring

Three files at the repo root make the system discoverable.

### `AGENT-SKILLS.md`
The skill catalog: the sync table and command, a diagram of the workflow
sequence, the per-skill catalog table, the status signal list, and the handoff
prefix rule. This is the file a new contributor reads to learn the process
exists.

### `AGENTS.md` / `CLAUDE.md`
Short pointers, ten to thirty lines each, that every agent session sees. They
should say: where product truth lives, where the workflow lives, and — the
important part — **which competing process instructions are superseded**.

That last point is not hypothetical. Agent runtimes ship with their own
plan-authoring conventions, and plugin skill libraries add more. If you do not
explicitly state that your pipeline owns the process layer, agents will
sometimes write specs into a parallel directory that nobody reads. Name the
superseded skills and name the ones that still apply:

```markdown
## Process skill precedence

The `proj-*` lifecycle owns the process layer in this repo: kickoff →
refinement → quality-check → map-out → implement → cleanup, with
`PRD/work/<slug>/` as the artifact and `PRD/sections/` as durable truth.

Any plan-authoring skill from another library that duplicates this lifecycle is
superseded here. The design record is `DESIGN-BRIEF.md` plus a `DEC-` entry,
never a parallel spec file.

Non-overlapping skills still apply: debugging, test-driven development,
verification-before-completion, git worktrees, code review.
```

### Rules files
If your runtime supports always-applied rules, use them for the two or three
constraints that must hold in every session regardless of skill — process
precedence, and runtime cleanup if agents drive browsers. Keep the list tiny.
Rules that are always loaded compete for attention with the task, and a
twenty-rule always-on file trains agents to skim.
