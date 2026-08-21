# graph-single-door-workflow

## The idea

The owner types one thing. An idea, an observation, or a bug all enter the same
door and walk the same flow — kickoff, refinement, quality-check, map-out,
implement, cleanup — driven autonomously by `graph-run`. The owner's only
in-flow decision point is the `define` gate, which parks on any
`PRD/sections/` diff and walks new product truth one stable ID at a time.

Outcome: the owner steps back from nuanced per-step decisions and reviews the
big picture at one place.

## Grounded current state

- **Nothing in the workflow branches on frontend versus backend.** Not the
  phases, not the gameplan template, not the slice format. The only UI/backend
  split anywhere is one line of `graph-workflow-contract.md` naming
  `graph-ui-shape` and `graph-enrich-define` as domain node packs — never
  built, referenced exactly once. `graph-run-boundary-enforcement` deletes it.
- **There is no debug entry point.** Debugging falls back to
  `superpowers:systematic-debugging`, which fixes code and leaves no receipt.
- **`thejudge-amend` is the bug intake door, but only for `active` packages**
  that are already mapped out. A bug in shipped code has no door.
- **14 invocable skills today**: 3 implement variants, 2 orchestrators
  (`thejudge-prepare`, `graph-run`), 4 pre-implementation phases, plus amend,
  defer, cleanup.

## Decisions taken during capture

| Decision | Choice |
| --- | --- |
| Number of doors | One. A separate debug door would force the owner to classify a thing before describing it, which is the nuanced call being removed |
| Depth grading | None. Every entry takes the full path. The extra documents cost tokens and wall-clock, not owner attention — and the fixed cost buys the `define` gate |
| Shipped work throws an issue | Kick off a new run; do not amend. The front door writes a `## Prior run` line into the new `IDEA.md` pointing at run one's receipt under `PRD/instructions/receipts/`, and refinement reads it as input |
| In-flight work throws an issue | `thejudge-amend`, unchanged. A second package against the same code gives two branches touching the same files |
| The 14 existing skills | Untouched and still callable. The front door dispatches them. Deletion is revisited only after the flow has run a few times |

## What refinement still has to answer

- What the front door is called, and whether it is one skill or a thin entry
  wrapper over `graph-run`
- How the door recognises that an observation names a shipped feature, so it can
  find and link the right receipt — name match, owner statement, or a prompt
- Whether `thejudge-prepare` survives alongside the door, or the door becomes
  the only orchestrator
- What the door does when the observation is too thin to refine — park, ask
  once, or proceed on assumptions
- Whether the receipt link is one prior run or a chain, when run three follows
  run two

## Sequencing

Lands after `graph-run-boundary-enforcement`, which rewrites
`graph-workflow-contract.md`, `AGENT-SKILLS.md`, and `graph-run`'s node table
for an unrelated reason. Skill and doc cleanup is a third pass after this one.
