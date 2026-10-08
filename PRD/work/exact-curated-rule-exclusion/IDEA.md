# Idea — exact curated rule exclusion

A player who asks about a triggered ability's fine print (does a "becomes tapped" trigger fire when the permanent enters tapped?) can get an AI that never sees the rule that answers it. The rule search (System 3, the up-to-ten scored rule excerpts) is barred from showing any sub-rule whose parent rule a curated always-on topic (System 2) lists, even though the topic prints only the parent's one sentence (REQ-179).

Outcome: System 3 excludes only the exact rule numbers a selected curated topic lists, so those sub-rules (for example 603.2e and 603.2g) compete like any other rule and appear when relevant, with no rule lost that reaches the prompt today.

Non-goals: no keyword-to-defining-rule lookup, no expansion of colon-ending stem picks, no corpus label hygiene, no raise of the System 3 cap, no new curated topic, no live model call.

Intake: `intake/GRAPH-BRIEF.md` (measured findings and a converged design direction; evidence, not authority — every product decision is still made at the define gate).

## Prior run

- `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md` — introduced REQ-179 (rule-index hygiene and the System 2 / System 3 deduplication this idea narrows).
- `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md` — built the hybrid System 3 retrieval path that carries one of the two exclusion branches.
- `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md` — raised the System 3 excerpt cap from 5 to 10 and touched the three System 3 entries.
- `PRD/instructions/receipts/rules-test-harness-2026-10-06.md` — built the rules-test corpus and rules gate this change is measured against.
- `PRD/instructions/receipts/answer-quality-investigation-2026-10-07.md` — answer-quality investigation whose instruments (REQ-226–230) this change is re-measured with.
- `PRD/instructions/receipts/niche-interaction-rule-tests-2026-10-07.md` — added the replacement-effects curated topic (REQ-220) whose 616.1 listing the brief's numbers include.
