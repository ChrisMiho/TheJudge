# OPERATOR.md — how to drive the system

The owner-facing counterpart to `AGENT-SKILLS.md`. That file tells the *agents*
how the skills chain. This file tells *you* how to operate them: for each thing
you want to do, the one command, what you'll be asked, where you touch the work,
and how you know it's done.

You should never have to read a skill's internals to run the system. If a recipe
here disagrees with what actually happens, the recipe is wrong — fix it.

Every recipe has the same shape:

> **You want to** … · **Do** `<command>` · **You'll be asked** … ·
> **Your touch points** … · **Done when** …

Commands are `/skill-name` in Claude Code (`$skill-name` in Codex). A path like
`PRD/work/<slug>/` is the package folder a run creates; the slug is the short
name the run proposes from your request.

---

## 1. Start a new feature or idea

**You want to:** take a request from nothing to a design you can approve, without
babysitting each step.

**Do:** `/graph-kickoff "<your request>"`

**You'll be asked:** nothing, once it's running. It proposes a short name (slug)
for the work and drives itself from there. If it hits a real product fork it
can't resolve, it stops and writes the question down rather than guessing.

**Your touch points:** one, up front — the **define gate**. The run drives to the
point where it has written the proposed product truth, opens a docs-only pull
request, and parks waiting for you. It does **not** write any code yet. You
review the gate next (recipe 5).

**Done when:** the run reports `PARKED` with a `GATE-QUESTIONS.md` file waiting
and a docs PR open. That's your cue to review the gate.

> This is the fresh-run default: **one command.** You do not run
> `/graph-preflight` yourself — the run dispatches it as its own first step. A
> separate preflight is only for the resume edge cases the skill handles for you.

> The run never touches your checkout. It works in its own folder,
> `.worktrees/kickoff-<slug>`, branched from `origin/main`, and you stay on
> whatever branch you were on with whatever you had uncommitted.

---

## 2. Start a second idea while the first waits

**You want to:** kick off idea B while idea A's docs PR is still waiting for your
answers.

**Do:** `/graph-kickoff "<idea B>"` — the same command, from the same terminal.
Nothing to set up. A parked run holds no lock and left your checkout alone, so
the next run is not refused and does not branch off anything stale.

**You'll be asked:** nothing.

**Your touch points:** the same one as recipe 1, once per idea.

**Done when:** idea B parks with its own docs PR. Answer and merge the two PRs
in any order.

> **Two runs at the same moment** (idea A still executing, not parked) need two
> sessions in two checkouts, because the safety hook charges every tool call in
> one folder to the run that holds that folder's lock. Make a throwaway checkout
> and start the second session there:
>
> ```
> git worktree add --detach .worktrees/session-<name> origin/main
> cd .worktrees/session-<name> && claude --settings .claude/graph-profile.json
> ```
>
> Inside it, `/graph-kickoff` works in place. When both are done,
> `npm run graph:prune` lists the throwaway checkout for removal.

---

## 3. File a bug or add scope

**You want to:** feed new bug reports or scope requests into work that's already
underway, or start a standalone fix.

**Do:**
- Into a package that's already being built (status `active`):
  `/thejudge-amend PRD/work/<slug>/` with your list of items.
- Standalone, or when no package owns it yet: `/graph-kickoff "<the bug>"` (recipe 1).

**You'll be asked:** for the list of items, if you didn't paste one in the same
message.

**Your touch points:** one — the **verdict table**. Every item comes back sorted
into one of three: `FOLD` (folded into an existing planned slice), `RECORD`
(held, because it needs product truth that doesn't exist yet), or `REFUSE`
(off-limits — a non-goal excludes it, or no slice here owns that screen). A mixed
batch with some refusals is the correct result, not a failure.

**Done when:** the verdicts are written — `FOLD`s land in the slice docs, `RECORD`s
land as dated held entries, `REFUSE`s stay as the table row and nothing else.

> Use `thejudge-amend` only once the package is `active` (mapped out, with slice
> docs). Before that — `ideation`, `refining`, `refined` — the cheap path is
> `/thejudge-refinement`, and amend will tell you so and stop.

---

## 4. Run overnight or unattended

**You want to:** let a run work while you're away, safely, with a way to stop it.

**Do:** launch the session with the protective permission profile —
`claude --settings .claude/graph-profile.json` — then start your run inside it
(recipe 1 or 7). To repeat work on a schedule, wrap it with `/loop`.

**Overnight code-health:** `/loop codehealth` is a ready-made overnight loop that
opens one behavior-preserving code-health PR per target and never merges. It uses
this same profile and the same `.worktrees/.graph-stop` kill switch; a target that
would change game behavior parks in its morning digest under `.worktrees/.codehealth/`.

**You'll be asked:** nothing while it runs. A run has no one to answer a
permission prompt overnight, so if it hits an unlisted command it treats that as
a stop and records it, rather than hanging forever.

**Your touch points:** none until you're back. To **stop a run in flight**, create
the file `.worktrees/.graph-stop` (for example, `touch .worktrees/.graph-stop`).
The run finishes its current step, records why it halted, and stops cleanly — no
stranded state. Delete that file before you resume.

**Done when:** the run reaches one of four end states — `COMPLETE` (it finished),
`PARKED` (it needs a decision from you), `BLOCKED` (something outside the repo,
like auth or network, needs fixing), or `PROMPTED` (it hit a command it wasn't
cleared to run). Each one names the exact next step in its report.

> The profile only protects the run when you launch with that `--settings` flag.
> Without it the guardrails are inert. See `PRD/work/adhoc/PROGRESS.md` for the
> morning digest (`npm run graph:digest`) that lists anything waiting on you.

> **One session per folder while a run is executing.** The hook counts every
> tool call in a folder against the running node's budget and applies the run's
> rules to any session in that folder, so an ordinary session opened in the same
> checkout gets denied and eats the run's budget. Work in another checkout
> (recipe 2) until the run parks or finishes.

---

## 5. Review a gate

**You want to:** approve, edit, or reject the product truth a parked run
proposed, so it can carry on.

**Do:** open `PRD/work/<slug>/GATE-QUESTIONS.md`, write your verdict in each
block — `accept`, `edit` (with a reason), or `reject` (with a reason) — then run
`/graph-gate-review PRD/work/<slug>/`.

**You'll be asked:** nothing by the skill — every verdict comes from the file you
just filled in. Each block is written to be answerable out loud, without opening
another file to decode an ID.

**Your touch points:** one — your `accept/edit/reject` calls in the file. An
`accept` keeps the run's text; an `edit` applies your reason as the correction;
a `reject` removes that item entirely (and its ID is retired, never reused).

**Done when:** the skill reports the verdict counts, marks the gate resolved, and
hands you back `/graph-implement PRD/work/<slug>/` to resume (recipe 7).

> The file lives in the run's own folder, `.worktrees/kickoff-<slug>/PRD/work/<slug>/`,
> until you merge the docs PR. Answer it there, or on GitHub in the PR.

> It refuses an unanswered file — every block needs a verdict before it will
> resolve the gate. That's what keeps the resume a single command with nothing
> left to guess.

---

## 6. Merge the code PR — the one merge that lands a package

**You want to:** actually get finished work onto `main`. A run does **not** put
its work on `main` by itself.

**Do:** open the pull request from `thejudge-auto/<slug>-work` into `main` on
GitHub and **merge it.** The run created it, wrote the receipt into it, and
deleted the work folder inside it, then reported `COMPLETE` — it just can't
merge it.

**You'll be asked:** nothing. This is a plain GitHub merge you perform.

**Your touch points:** one — clicking merge on that PR.

**Done when:** `main` contains the code, the applied product truth, the receipt
under `PRD/instructions/receipts/`, and no `PRD/work/<slug>/` folder. There is
nothing after this merge: no second "base to main" PR, no cleanup to run. A
package costs exactly two merges — the docs PR you answered (recipe 5) and this
one. A new run is not blocked by an unmerged PR — every run branches from
`origin/main` as it stands — so it only delays when the work lands, never what
the next run starts from.

> The docs branch `thejudge-auto/<slug>` GitHub deleted when you merged the
> docs PR is finished; nothing re-creates it. What is left on your machine after
> this merge — the build folder `.worktrees/implement-<slug>` and both local
> branches — is what `npm run graph:prune` lists.

---

## 7. Resume a parked run

**You want to:** pick a run back up after you've reviewed its gate or cleared
whatever it was waiting on.

**Do:** `/graph-implement PRD/work/<slug>/`

**You'll be asked:** nothing. It reads where it left off from the run's ledger and
re-enters at the right step.

**Your touch points:** none — this just restarts the machine. Your decision
already happened at the gate (recipe 5).

**Done when:** the run advances to its next end state — usually driving on to
write the code, write the receipt, and open the code PR, then reporting
`COMPLETE`. Your merge of that PR (recipe 6) is the last step.

> If you stopped it with the `.worktrees/.graph-stop` file (recipe 4), delete that
> file first — a run refuses to resume while the stop switch is set.

---

## 8. Audit a corpus

**You want to:** score every item in a body of docs against one question and get
a single report back — not ship a feature, and not a decision per section.

**Do:** `/thejudge-sweep <corpus> <audit question> <verdict labels>` — for
example, audit `PRD/sections/decisions/` against the feature specs, one verdict
per decision.

**You'll be asked:** one question up front — **cost vs. thoroughness.** You pick a
named profile (how strong a model, how much effort, how many sections per agent);
it never makes you reason about raw agent counts. That's the only question.

**Your touch points:** one — the single **pull request** at the end. There are no
gates along the way. The whole point is one review at the finish.

**Done when:** the sweep opens one PR to `main` with a `ROLLUP.md` (every
contested item sorted to the top) plus a finding doc per section. You merge it.

> A sweep never changes what it audits — the verdicts are the deliverable. Acting
> on them (deleting, rewriting) is a separate step you run later.

---

## 9. Run a manual package

**You want to:** do work the automated runs aren't allowed to touch — chiefly
editing the skills or instruction files themselves (like the docs-refactor's
Phase C, or the plain-language standard).

**Do:** there's no slash command. Start an ordinary interactive session, describe
the work, and tell it to **plan first and wait for your approval** before editing
anything.

**You'll be asked:** to approve the plan before any edits, and to review the PR at
the end.

**Your touch points:** two — the plan (before work starts) and the pull request
(before it lands). For irreversible work, insist on seeing the plan first.

**Done when:** one PR to `main` is open for your review, with a receipt written
under `PRD/instructions/receipts/`. You merge it.

> Graph runs and sweeps are forbidden from editing `thejudge-*` skills — this
> manual door is the only way that work happens, and it's deliberately
> plan-first because it's often irreversible.

---

## Where to look while a run is in flight

| You want to see… | Look at |
| --- | --- |
| Live progress of the current run | the ledger `GRAPH-RUN.md` inside the run's own folder: `.worktrees/kickoff-<slug>/PRD/work/<slug>/` while the spec is being formed, `.worktrees/implement-<slug>/PRD/work/<slug>/` while it is being built (your checkout's copy only updates when a PR merges); `npm run graph:digest` reads both |
| A gate waiting on you | `## Open gate` in that run's `GRAPH-RUN.md` |
| The board of active packages | `PRD/work/STATUS.md` |
| What a finished run produced | `PRD/instructions/receipts/<slug>-<date>.md` |
| Leftover branches, run folders, and staging from finished runs | `npm run graph:prune` (lists only; run `npm run graph:prune -- --apply` to delete the safe ones — the `--` is what makes npm pass the flag through) |

## Related

- `AGENT-SKILLS.md` — the same skills from the agent's side (how they chain).
- `PRD/instructions/plain-language-standard.md` — the rule every owner-facing
  artifact (and this file) is written to.
- `PRD/instructions/graph-workflow-contract.md` — the full contract behind the
  graph runs.
