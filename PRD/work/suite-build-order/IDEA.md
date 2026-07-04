# suite-build-order

TheJudge is growing into a suite of player-help features (portal, Trade Balancer, lookup tools, collection, and more), but each package lives in its own `PRD/work/<slug>/` folder. Agents that implement a single slug do not see shared-kit dependencies or a safe build order, so they risk inventing bespoke nav, pricing, or Ask AI entry points and shipping features in the wrong sequence.

Outcome: an overarching, agent-facing gameplan in this work package that sequences the suite by shared capability kits (suite chrome, printing/price/scan entry, lightweight Ask AI modes), states eligibility rules, and points implementers at the next individual feature package — without implementing product code here.

Non-goals: not a user-facing product feature; not a permanent backlog in `PRD/README.md` or `sections/`; does not replace per-feature DESIGN-BRIEF / GAMEPLAN / slices; does not implement or refine those features itself — it only orders and unlocks them.
