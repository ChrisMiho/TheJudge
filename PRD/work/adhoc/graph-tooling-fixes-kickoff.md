# Kickoff — graph tooling fixes (do this before Package 2)

Paste the prompt below into a **fresh session on an up-to-date `main`**
(`git checkout main && git pull` first).

This is the prerequisite the shakedown flagged as "fix the tooling, as its own
package" (§5, step 5). The first autonomous run surfaced five live defects in the
graph enforcer and preflight — and two of them mean the second safety tier can be
**silently off**. Every future overnight run, Package 2 included, rides on this
enforcer, so it is fixed first.

It is **not** a `/graph-run` — a run is forbidden from patching the machinery it
runs on. Ordinary interactive session, real code with tests, plan-first.

## The five defects (shakedown §4)

1. **Nothing writes the concurrency lock.** `graph-preflight` is told to take a
   lock file; its script never writes one, so tier-2 safety (call limits,
   protected-path blocking, evidence checks) only arms if the agent remembers.
   The one clean run only worked via a prompt patch, which does not survive.
2. **The liveness probe is blind to the tier that matters.** Startup proves the
   hook is alive with `rm -rf` (universal tier, always on), so the green light
   passes whether or not tier 2 is armed. Needs a second probe with a tier-2
   command, after the lock is taken.
3. **A step can earn its own homework.** The evidence log is filed per-run, not
   per-step, so the planner's file listings satisfied 7 of 21 checks before build
   started. Related: a check sees only that a command *ran*, never what it
   *returned*.
4. **The lock cannot be released cleanly.** The contract says delete the lock as
   the final act; the hook blocks deleting the lock file. Both cannot be true.
5. **The hook denies prose that merely names a denied command.** The normalizer
   does not track heredoc bodies, so a commit message or receipt containing e.g.
   `; nohup` is read as a real invocation and denied — it bites the run's own job
   of recording defects.

## Three of these carry a design question only you can answer

The plan should surface these before writing code (they are shakedown Q3–Q5):

- **Defect 3 → Q3/Q4:** does a check prove an *outcome* (capture results), or is
  per-step evidence filing enough? Capturing outcomes is a real design change.
- **Defect 4 → Q5:** lock release — give release a path the rule recognizes, or
  drop the rule and rely on the run's discipline?

## The prompt

```
The graph tooling fixes — the prerequisite package before docs-refactor
Package 2. This is an ordinary interactive session, NOT a graph run and NOT a
sweep: it patches the graph enforcer and preflight, and a run may not patch the
machinery it runs on. It carries real code and tests.

Read first, in order:
- PRD/work/adhoc/graph-run-shakedown-report.md — the failure evidence. Focus on
  §4 (the five tooling defects), §5 step 5 (fix the tooling as its own package),
  and §6 Q3/Q4/Q5 (the design questions tied to defects 3 and 4).
- PRD/instructions/graph-workflow-contract.md — the contract these defects
  violate or contradict.
- The machinery itself: scripts/graph-preflight.mjs, scripts/lib/boundary-rules.mjs,
  scripts/graph-boundary-hook.mjs, and the graph-preflight skill.

Then plan before touching anything. Fix all five defects in one package, each
backed by a test — the shakedown proved a prompt-only patch does not survive into
the next run (defect 1). Surface the design forks before writing code: defect 3
(does a check prove an outcome or just that a command ran; per-run vs per-step
evidence — Q3/Q4) and defect 4 (lock release: give it a path the rule recognizes,
or drop the rule — Q5). Recommend an answer for each and wait for my call.

Prefer running this as a proper interactive PRD/work/<slug>/ package (kickoff →
refinement → quality-check → map-out → implement) with test-driven fixes — write
the failing test that reproduces each defect first.

What's in scope: the five tooling defects above. What's out: the two node
mistakes (retry-after-block and the branch-shape / PR-diff slip) — the branch
shape is Package 2's merge-safe-ordering work, and the retried block came from
Claude Code's own classifier (Q6, an upstream report), not the hook. Name them,
don't fix them here.

Hard guardrails:
- Interactive only — never a graph run; you are editing the enforcer it would
  load.
- Every fix lands as committed code with a test, never a prompt patch.
- Expect the heredoc false-positive (defect 5) to bite while you write the commit
  message or receipt that discusses a denied command — that friction is itself
  the defect you are fixing; fix it early if it blocks the record.
- PR to main, never push to the trunk — I merge.
```

## How it runs

Not a graph run: the fixes rewrite the very enforcer and preflight a run loads at
startup. Drive it by hand, test-first. When it ships, Package 2 (overnight-run
tuning) proceeds in a fresh session on the fixed tooling —
`PRD/work/adhoc/package-2-kickoff.md`.
