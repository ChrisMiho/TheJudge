status: refined

# rules-test-harness

Rules test harness, run 1: six-layer-ready case format, offline gate (dropped cards, missed rules), on-demand budget-safe answer grader, owner review flow, about 400 cases (every real mechanic once plus about 120 hard interactions).

- Idea: [IDEA.md](IDEA.md)
- Intake (evidence, never authority): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposed product truth and owner questions: [GATE-QUESTIONS.md](GATE-QUESTIONS.md) — REQ-185–190, NFR-018 amended; REQ-222–225 new; Q-007, Q-008
- Scratch measurement scripts: [measure/](measure/)

Next: `thejudge-quality-check`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/rules-test-harness

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/rules-test-harness/DESIGN-BRIEF.md`
- Findings (attempt 2; all eight attempt-1 findings confirmed resolved):
  1. (Important) Re-approving a stale case has no working path: REQ-224's apply command writes only `review.*` and changes no other field (slice D done-when agrees), yet REQ-225 says a stale approved case is re-approved through the review flow, which re-records its hashes — `snapshot` is not `review.*`. REQ-224's render lists only `draft` (and on request `needs-edit`) cases, so a stale `approved` case is never rendered; it can never leave stale state and the live runner skips it forever. Say which command re-records the hashes, how a stale approved case reaches review, assign it to slice D or E, and amend the apply AC and the D done-when.
  2. (Minor) State-fact check unsatisfiable for the stack zone: A15 and the REQ-222 state-fact AC expect each `owner` as an `owner:` line, but `promptFormatting.ts` prints `owner:` only for non-stack zone items (line 255); stack items print `caster:` and `Stack item N`. Check `owner` for non-stack zones only, or forbid an owner on stack items.
  3. (Minor) No slice owns turning `gameState` into an In-Depth request: REQ-185 (slice A) promises it, slice A's `buildCaseRequest` change names only attaching `cards`, slice B tests through `preparePromptInput`, slice C is silent; slice G's tier-3 tester drafts are the likely first users. Name the owning slice.
  4. (Minor) Slices cite REQ-222–225 before those entries are applied: REQ-185 (slice A) lists them as dependencies; REQ-186–190 (slice C) rely on REQ-225's staleness rule, applied in slice E. Not red, but at odds with the brief's each-slice-applies-only-truth-true-once-it-lands rule. Note it or reorder.
  5. (Minor) Committed `coverage.json` drifts after owner review: slice D's apply changes review statuses that `coverage.json` counts, and REQ-223's gate fails when the file is out of date, so the owner's own review fails the next PR until the coverage command is rerun. Say whether apply rewrites the file or the coverage command must follow it.
  6. (Minor) Up to 13 extra tier-3 cases still has no stated source (it is the intake's ≤15 tier-3 ceiling minus the 2 testers; neither the brief nor Q-008 says so), and Q-008's room-for-up-to-13-more misleads when 58 two-card slots exist.
  7. (Minor) Q-007 miscounts the intake's list: it calls it the three Attraction mechanics, Space Sculptor and Assemble (252), but the intake excluded four mechanics, did not list Assemble, and left 702.186 ∞ undecided — 253 with the intake's real list, 252 with Assemble added. Q-007 and the brief also say the intake without defining it for the owner.
  8. (Minor) Hard-area list differs: the REQ-185 criterion lists eight areas (copies, layers, replacement and prevention, triggers, combat, state-based actions, double-faced, multiplayer); M16 and A16 draw from twelve (adding resolution 608, continuous effects 611, two-headed giant 810, Commander 903) and say all twelve represented. Align them.
