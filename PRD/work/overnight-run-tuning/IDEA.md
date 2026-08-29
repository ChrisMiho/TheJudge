# Overnight-run tuning

**Problem.** An overnight graph batch is calendar-bound and hands-on: each run
parks *live* at the define gate and must be walked in the terminal, so the owner
has to be present to advance it, and reaching `main` is a second, unremembered
owner PR (the base→main hop) that has already branched a run off a stale `main`
(`user-feedback-spec`, PR #107). There is no single readable summary of what a
night's run(s) did.

**Outcome.** Tune the graph workflow (Package 2 of the docs-refactor) so a night
runs unattended and reviews on the owner's schedule: a two-run split where run
one stops at quality-check PASS with a docs-only PR and a questions file; an
async markdown gate answered in answer slots instead of a live walk; a morning
digest script; and a preflight gate plus digest reminder that make the base→main
hop impossible to skip. Every change is backed by a test, not a prompt.

**Non-goals.** Do not relitigate the settled constraints 11–14 (two runs / two
PRs, async gate, queue continues past a park but halts on failure, Phase A is
calendar-bound). The node table and every graph boundary stay unchanged — only
the stop condition and the gate's answer mechanism move. Not a graph run and not
a sweep: this edits graph-* skills, the contract, and `scripts/`, which an
automated run may not patch on itself.

## Prior context

- Plan of record: `PRD/work/adhoc/refactor-gameplan.md` (Package 2 row +
  Binding constraints 11–14).
- Progress board: `PRD/work/adhoc/PROGRESS.md` (also stale on Package 2's
  blocker — the graph tooling fixes merged as PR #131/#132 — to be corrected
  here).
- Run evidence this tunes against: `PRD/work/adhoc/graph-run-shakedown-report.md`
  (Q7 branch shape, node mistake 2, §5 next-steps).
- Kickoff draft: `PRD/work/adhoc/package-2-kickoff.md`.
