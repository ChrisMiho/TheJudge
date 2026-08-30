# Receipt — docs-refactor Package 3: the operator manual

**What happened:** there's now one owner-facing page — `OPERATOR.md` at the repo
root — that answers "I want to do X, what's the one command and what will I be
asked?" for the eight things you actually do to drive the system. You no longer
have to read a skill's internals to run it.

**What it means for you:** when you want to start a feature, file a bug, run
overnight, review a gate, merge to `main`, resume a park, audit a corpus, or run
a manual package, you open `OPERATOR.md`, find the recipe, and run the one
command it names. Every recipe was checked against the actual skill before it was
written, so it describes what really happens — not the ideal.

---

- Date: 2026-08-29
- Slug: docs-refactor-package-3
- Status: shipped (docs)
- Plan of record: `PRD/work/adhoc/package-3-plan.md`

## What shipped

**`OPERATOR.md` (new, repo root).** The owner-facing counterpart to
`AGENT-SKILLS.md` — same shelf, opposite audience. Eight task-recipes, each in one
fixed shape (**You want to · Do · You'll be asked · Your touch points · Done
when**), written to `PRD/instructions/plain-language-standard.md`:

1. Start a new feature or idea — `/graph-run "<request>"`.
2. File a bug or add scope — `/thejudge-amend` into an `active` package, or
   `/graph-run` standalone.
3. Run overnight or unattended — launch with
   `claude --settings .claude/graph-profile.json`, pace with `/loop`, stop with
   the `.worktrees/.graph-stop` file.
4. Review a gate — fill in `GATE-QUESTIONS.md`, then
   `/graph-gate-review PRD/work/<slug>/`.
5. The base→main merge — the recurring miss; called out loudly.
6. Resume a parked run — `/graph-run PRD/work/<slug>/`.
7. Audit a corpus — `/thejudge-sweep`.
8. Run a manual package — a plain plan-first interactive session; no slash command.

**`PRD/README.md` doc-bug fix.** Line 130 had presented
`/graph-preflight` then `/graph-run PRD/work/<slug>/` — the mid-lifecycle *resume*
case — as the general path. Corrected: the fresh-run default is one command,
`/graph-run "<request>"`, which dispatches preflight itself; the separate resume
form is now stated as the resume case, consistent with `OPERATOR.md` recipe 1.

**Pointers.** One line each from `README.md` (Start Here) and `PRD/README.md`
(graph-run line) to `OPERATOR.md`.

## Verify-against-reality notes

Every command was read against its skill before the recipe was written:

- Recipe 1 — a fresh `/graph-run` dispatches `graph-preflight` as node 1; the
  owner does not run preflight (`graph-run/SKILL.md`, `PROGRESS.md` kickoff note).
- Recipe 2 — `thejudge-amend` refuses any status other than `active` and names the
  right skill; captured in the recipe's note.
- Recipe 4 — `graph-gate-review` reads verdicts only from the answered file and
  refuses an unanswered one; the recipe puts filling the file before the command.
- Recipe 8 — confirmed there is no slash command; graph runs and sweeps are both
  forbidden from editing `thejudge-*` skills, so the manual door is the only path.

## Files

Created:
- `OPERATOR.md`
- `PRD/instructions/receipts/docs-refactor-package-3-2026-08-29.md` (this file)

Updated:
- `README.md` (pointer)
- `PRD/README.md` (doc-bug fix + pointer)
- `PRD/work/adhoc/PROGRESS.md` (Package 3 marked done)

## What's left of the refactor

Nothing. With this PR merged, all five packages are done — the whole docs-refactor
arc from the brain dump is finished. See `PRD/work/adhoc/PROGRESS.md`.
