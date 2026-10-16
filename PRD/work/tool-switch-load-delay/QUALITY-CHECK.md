# Quality check — tool-switch-load-delay

**Verdict: PASS.** Package stays at `STATUS.refined`. No blocking findings, no
advisories. Mode: graph controlling, attempt 3 (re-grade after `define`
attempt 2 and the owner's Q-014 `accept`). Checked: `DESIGN-BRIEF.md`,
`GATE-QUESTIONS.md`, `evidence/measurements.md` against `PRD/sections/`
(no change since `ed3e96b8`; `git diff --stat ed3e96b8 HEAD -- PRD/sections`
is empty) and `PRD/instructions/{technical-design-rules,plain-language-standard}.md`.

## Attempt-2 findings

| # | Finding | Status |
| --- | --- | --- |
| 1 (blocker) | `integrations-and-data.md:165` missing from Diff 4, intro count wrong, grep missed the hyphenated spelling | Resolved. The hunk is in Diff 4 (`GATE-QUESTIONS.md:192-198`); the intro says seven hunks across five files (`:121`), which matches the 3 + 1 + 1 + 1 + 1 hunks present; the grep is widened (`DESIGN-BRIEF.md:251`) and returns 96 hits; the per-file counts in the brief (`:283-288`) sum to 96; each hit has a disposition row (`:262-281`) and the `:165` row points to Diff 4. |
| 2 | Criterion 6 lacked the Q-014 clause | Resolved. `DESIGN-BRIEF.md:345-349` now says a Life Tracker landing requests the list too, exactly once. |
| 3 | Criterion 4 fixed 3 s wait was thin | Resolved. `:334-338` waits until the card-list request has a `responseEnd`, not a fixed delay. |
| 4 | Criterion 3 had no "landing rendered" marker | Resolved. `:327-333` defines the marker per landing (the "Ask a Question" text; the "-player life table" element) and requires every tier-2 `startTime` later than it. |

## Checks run

- Every Diff 1-4 hunk (13 blocks) was extracted and its old and context text
  tested as one exact string against the current file in `PRD/sections/`:
  all 13 match, each exactly once (`non-functional-requirements.md` x4,
  `shared-chrome/README.md`, `screen-layout.md`, `trade-balancer/README.md` x3,
  `functional-requirements.md`, `user-flows.md`, `system-map.md`,
  `integrations-and-data.md`).
- The disposition grep was re-run: 96 hits, same as the brief claims.
- Diff 4 keeps the ping's behaviour (one request on open, no product data,
  never blocking); only the "overlaps the download" wording changes. Amend in
  place, no new stable ID.

## Agreement with the two owner verdicts

- NFR-014 `edit` (tier 1 landing, tier 2 every other tool's code, tier 3 the
  shared card list, last): brief intro (`:10-28`), design item 2 (`:123-136`),
  Diff 1 (`GATE-QUESTIONS.md:52-53`), Diff 2 (`:95-108`) and Diff 3 (`:115`)
  all describe the same three tiers and the same order. Brief scope, A4, A5 and
  the touched-files list agree.
- Q-014 `accept` (a Life Tracker landing downloads the list, about 1.96 MB,
  still last): stated as settled in the brief header (`:3-8`), A6, A8, A10
  (`:234-239`), design item 2 (`:136`), Diff 1's tier-3 sentence and cost line,
  Diff 2 (`:101`, "on every landing including the Life Tracker"), and criteria
  3, 4 and 6.
- Tier order on every landing, Life Tracker included: design item 2 makes every
  tier-2 `preload()` call before the tier-3 request; criterion 3 tests it by
  Resource Timing on both landings; criterion 10 unit-tests the call order.
- No passage hedges on a Q-014 answer the owner did not give. The only "no"
  wording left is the question's own "What happens if you say no" record
  (`GATE-QUESTIONS.md:245-252`), which is the retained question text above the
  recorded verdict, not scope.
- The brief, diffs and criteria agree with each other: the "seven hunks across
  five files" count, the 36 KB / 107 KB / 1.96 MB figures and the criterion
  numbers cited from the dispositions are consistent.

## Other checklist items

- Contradictions with current specs: none; the diffs amend the sentences they
  contradict (NFR-014, shared-chrome routing, screen-layout row, REQ-064
  wording). NFR-013, REQ-066/067, REQ-049 and NFR-019 are dispositioned as
  staying true.
- `technical-design-rules.md`: no new endpoint, no rules engine, no chunk
  config change; the card list file itself is unchanged.
- `screen-layout.md` row: Diff 3 updates the existing fallback row, consistent
  with DEC-149 / REQ-126; no new screen or overlay.
- Implementable without hidden assumptions: design item 7 gives the shared-list
  contract (array only, synchronous read, per-screen state/copy/index, mounted
  guard, failure clears, test reset). Criteria are measurable.
- Plain language: the brief and gate text lead with what the player sees; terms
  are defined at first use.
- Blank-verdict slots are not applicable now: both verdicts are recorded.

## Next step

Hand to map-out via the driver. Truth living only in `GATE-QUESTIONS.md` is the
expected shape for a graph run; implementation applies Diffs 1-4 at build.
