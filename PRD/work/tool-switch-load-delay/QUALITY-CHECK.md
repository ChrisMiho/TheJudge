# Quality check — tool-switch-load-delay

**Verdict: FAIL.** Package stays at `STATUS.refining`. One blocking finding,
three advisory. Mode: graph controlling, attempt 2 (re-grade after `define`
revised the package for the attempt-1 findings). Checked: `DESIGN-BRIEF.md`,
`GATE-QUESTIONS.md`, `evidence/measurements.md` against `PRD/sections/`
(unchanged since `ed3e96b8`) and `PRD/instructions/{technical-design-rules,plain-language-standard}.md`.

## Attempt-1 findings

| # | Finding | Status |
| --- | --- | --- |
| 1 | Life Tracker landing pays the 1.96 MB list; package said nobody does | Resolved. Brief intro, tier paragraph, A6, A8, A10 and Diff 1's cost line (`GATE-QUESTIONS.md:54`) all state about 1.96 MB for a Life Tracker landing only, backed by the new live measurement (`measurements.md:119-151`). It is asked as Q-014. |
| 2 | No contract for how each screen consumes the shared list | Resolved. `DESIGN-BRIEF.md:158-196` (design item 7) names what is handed over (the parsed array plus a synchronous read), what each screen keeps (state, flag, copy, index), seeding to avoid a loading flash, unmount guard instead of abort, failure clearing, and a test reset. Per-screen behaviour is criterion 9 (`:325-336`). |
| 3 | Stale Trade Balancer / REQ-064 wording with no diff | Partly resolved. Diff 4 applies cleanly to six places (see below), but one spot was missed. See finding 1 now. |
| 4 | Criteria did not pin tier order or the Life Tracker landing | Resolved. Criterion 3 (tier order) and 4 (Life Tracker landing) added; the 41/34 ms figures are labelled the two-tool approximation (`DESIGN-BRIEF.md:22-24`, `measurements.md:147-151`). |
| 5 | Gitignored `measure.js`; noisy 50 ms threshold | Resolved. Script described as unshipped example (`:287-289`); criterion 5 is a trend over three runs. |
| 6 | Dependencies hunk lacked trailing context | Resolved. Hunk now ends with ` - Notes:` and appends after `REQ-066` (`GATE-QUESTIONS.md:67-78`). |

## What passed

- Diff 4 old text matches current `PRD/sections/` exactly for
  `trade-balancer/README.md:59-64`, `:185-189`, `:196-198`,
  `functional-requirements.md:1512` (REQ-064), `user-flows.md:199` and
  `system-map.md:564` (the full old line equals the file's line). The new text
  keeps one ping, on open, no product data, never blocking, so the ping's
  behaviour is unchanged. Amend in place; no new stable ID.
- Diffs 1-3 old text still matches (`non-functional-requirements.md:239`,
  `:245`, `:246`, Dependencies; `shared-chrome/README.md:91-100`;
  `screen-layout.md:73`).
- Design item 7 is implementable and measurable: the contract is explicit
  (array only, sync read, per-screen flag/copy/index, mounted guard, failure
  clears and retries on next caller, test reset in `setup.ts`).
- Criteria 3, 4, 5 and 9 are measurable: 3 and 4 use Resource Timing and the
  rAF tap; 9 is component-level per screen with exact copy.
- Q-014 meets the plain-language standard: opens with the ask, inlines the
  substance of the NFR-014 answer, product terms first, recommendation given.
  Both answers are fully specified: "yes" is the diffs as written; "no" lists
  the Diff 1 tier-3 sentence, the Diff 1 cost clause, the Diff 2 landing
  clause, and brief design item 2 / criterion 4 (`DESIGN-BRIEF.md:136-137`,
  `:310-311`). Blank verdict slots are expected and not a finding.

## Blocking finding

1. The disposition table claims full coverage of the ping-overlap wording but
   misses a seventh place. `PRD/sections/integrations-and-data.md:165` says the
   REQ-064 ping makes "the backend's cold start overlap the card-list download
   instead of the first card's price fetch". With tier 3 the list is usually
   done before the balancer opens, the same staleness Diff 4 fixes elsewhere.
   It is in neither Diff 4 nor `DESIGN-BRIEF.md:253-266`. The brief's claimed
   grep (`"while the card list downloa"`, `DESIGN-BRIEF.md:249-251`) cannot find
   it because the text is hyphenated. Fix: add an `integrations-and-data.md:165`
   hunk to Diff 4 (same wording: overlaps the player's typing, and the
   card-list download when it has not already arrived in the background), add
   it to the disposition table, and widen the quoted grep to include
   `card-list`. Also correct Diff 4's intro "Five places"
   (`GATE-QUESTIONS.md:122`): the package has six hunks across five files, now
   seven with this one.

## Advisory

2. Criterion 6 (`DESIGN-BRIEF.md:316-319`) says the list is requested exactly
   once "whichever landing screen"; under a "no" on Q-014 a Life Tracker landing
   requests it zero times until a card-search screen opens. Criterion 4
   (`:310-311`) states the "no" case; add the same clause to criterion 6.
3. Criterion 4 (`:306-311`) asserts no "Loading card list…" frame on the
   balancer after a fixed 3 s wait on Fast 4G + CPU 4×. The measured list time
   there is about 2.1 s from request start, so the margin is thin. Have the
   script wait until the card-list request has finished (or state the wait
   as "until the list request ends") so the check is deterministic.
4. Criterion 3 (`:300-305`) needs a defined "landing destination has rendered"
   marker (for example the first frame with the landing screen's primary
   control) so the Resource Timing comparison is repeatable.

## Next step

Return finding 1 (advisories 2-4 optional) to `graph-kickoff` refinement; the
fix is a small addition to `GATE-QUESTIONS.md` Diff 4 and the brief's
disposition table. Q-014 stays open for the owner.
