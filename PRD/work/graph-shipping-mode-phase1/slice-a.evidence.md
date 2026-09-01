# Slice A evidence log

2026-09-01 A2 — reviewed `graph-workflow-contract.md`, `preparation-contract.md`,
and `workflow-reference.md`: none instructs refinement to write or promote
`PRD/sections/` during define. Contract now describes propose (refinement records
proposal in GATE-QUESTIONS.md) / apply (build writes durable truth + code) / close
(cleanup promotes once); preparation-contract's Refinement row updated to
"proposed durable-PRD edits recorded in GATE-QUESTIONS.md (never written to
PRD/sections/ here)". grep for stale `PRD/sections` diff/gate references returned
only the new propose/apply text.
