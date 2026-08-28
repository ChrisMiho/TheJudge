# Sweep finding — framing
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/framing.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 5

## DEC-001 — absorbed
in-depth/README.md states "It is an assistant, not a rules engine — it validates no legality, simulates no board state, and enforces no format" and frames MTG Assistant as one feature inside the suite (trade-balancer, scan, life-tracker sit alongside it), matching the decision's assistant-not-judge + suite-of-features substance.

## DEC-002 — absorbed
Directly cited by ID: in-depth/README.md line 47-48 carries the decision's own language verbatim — "It is an assistant, not a rules engine."

## DEC-013 — absorbed
Directly cited by ID twice in in-depth/README.md (lines 48, 269) — "validates no legality, simulates no board state, and enforces no format" / "no board-state logic" scope guardrail is stated explicitly.

## DEC-080 — absorbed
The retired "flow-validation" label appears in zero of the 7 specs (grep confirms), superseded everywhere by MTG Assistant/suite framing; the guardrail-preservation half of the decision is intact. The GOAL-003→production-readiness goal swap is goals-and-non-goals.md bookkeeping, not feature-spec content, so its absence here is not a gap.

## DEC-094 — absorbed
Directly cited by ID in in-depth/README.md (lines 59, 63): "MTG Assistant feature, not the whole app," with a "TheJudge / MTG Assistant" brand block (line 65). Trade-balancer and life-tracker specs consistently treat TheJudge as the app and MTG Assistant as one feature among others (scan, life tracker, trade balancer), matching the naming split the decision establishes.
