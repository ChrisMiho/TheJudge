status: refining

# graph-shipping-mode-phase1

Foundation of the two-tool shipping model: move durable writing out of refinement.
Refinement *proposes* (work-folder only); implement *applies* the durable
`PRD/sections/` truth and the code together; cleanup promotes once at close. Makes
spec-forming conflict-free and kills the spec-ahead-of-code window — the base→main
guard and auto-bridge then retire. Agent-workflow change only — no `PRD/sections/`
product truth. See `DESIGN-BRIEF.md`.
