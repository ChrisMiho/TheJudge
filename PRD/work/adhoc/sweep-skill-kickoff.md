# Kickoff — build the "sweep" skill (session 1 of 2)

Paste this whole note into a fresh session, or tell that session to read
`PRD/work/adhoc/sweep-skill-kickoff.md`. **This session builds the skill only.
It does NOT run Phase B** — a later session does that with the finished skill.

## What to build

A reusable skill (working name **`thejudge-sweep`** — confirm or rename while
building) that packages the "audit a corpus, section by section, review once at
the end" pattern. It is the off-graph counterpart to `graph-run`: same idea of
encoded judgment + dispatched agents, but for tasks that **investigate and
report** rather than ship a feature.

Why it's separate from `graph-run`: the graph is a fixed feature lifecycle
(refine → gate → build → merge) with a human gate per run. A sweep has **no
implementation leg** — the investigation *is* the whole job — and the owner
wants **one review at the very end**, not a gate per section. Running the full
graph per section would be the opposite of that. See the discussion captured in
`PRD/work/adhoc/refactor-gameplan.md` (Phase B) and `PROGRESS.md`.

## The shape the skill must encode

1. **Input:** a corpus that splits cleanly by section (e.g. the 18 files under
   `PRD/sections/decisions/`) plus an audit question.
2. **Fan out:** one subagent per section, via a **single background Workflow**
   (this skill is the explicit opt-in to call the `Workflow` tool). Subagents
   keep the main session's context clean — that is a core goal.
3. **Per-section output:** each subagent writes a **structured finding doc** for
   its section — one verdict per item with a short reason, in a fixed schema.
4. **Synthesize:** a rollup that lists every item → verdict → one-line reason,
   with the contentious items sorted to the top so the end-review is skimmable.
5. **Land:** write the section docs + rollup under a work folder
   (`PRD/work/<sweep-slug>/`), then open **one PR** — a single review gate.
6. **Touch points:** exactly one, at the end (the PR). No mid-run gates.

Keep it **thin**. This is a first cut to be shaken out on Phase B, then
hardened — do not over-build guardrails before the first real run.

## Cost controls — ask before launching the fleet

Before it kicks off the Workflow, the skill asks the owner a **single upfront
question** to curb usage (this is an allowed touch point — it's configuration,
not a mid-run gate). Expose the real cost levers, not a bare "how many agents":

- **Model tier** for the per-section audit workers (default a cheaper/faster
  tier; the reads are mechanical). Optionally a stronger tier just for the
  synthesis/rollup pass, mirroring `graph-run`'s cheapest-capable-model-per-node
  rationale.
- **Reasoning effort** for the workers (`low` fits mechanical section reads).
- **Batching granularity** — sections per agent. One-agent-per-section is the
  most parallel; batching several sections into one agent means **fewer, cheaper
  agent spins**, which is the main usage lever when N is large.

Design rules for the question:
- Offer a **recommended default** for each so an unattended run proceeds without
  input; only ask when the values aren't already passed as skill args.
- Frame the choice as **cost vs. thoroughness**, and translate the owner's pick
  into the Workflow's per-agent `model` / `effort` and the batch size — don't
  make the owner reason about raw agent counts.
- Print the resulting plan back before launching: model, effort, agent count,
  sections per agent, so the owner sees the spend shape before the fleet starts.
- Accept these as explicit skill args too, so a later run can skip the question
  entirely.

## Design against this first use case (Phase B) — but do NOT run it

The skill's first run will be the docs-refactor **Phase B decision audit**, so
make sure the shape fits it:

- **Corpus:** the 18 domain files in `PRD/sections/decisions/`
  (`scanning`, `trade-balancer`, `prompt-assembly`, `providers-and-contract`,
  `player-life-tracker`, `ui-presentation`, `navigation`, `framing`,
  `feedback`, `personalization`, `rules-retrieval`, `combo-retrieval`,
  `capture-and-stack`, `conversation-ux`, `game-context-model`, `lookup-suite`,
  `deployment`, `doc-process`).
- **Items:** the ~158 `Status: confirmed` decisions across those files.
- **Verdict per decision:** `absorbed` / `partial` / `not-absorbed` / `obsolete`,
  scored against the 7 current-state specs now on `main` under
  `PRD/sections/<feature>/README.md` (life-tracker, user-feedback,
  trade-balancer, scan, quick-lookup, shared-chrome, in-depth).
- **Reason depth:** one line per decision by default; for `partial` /
  `not-absorbed` / `obsolete`, name exactly what is missing.
- **Deletes nothing.** The verdicts are the deliverable; they gate the later
  Phase C cleanup. Do not edit `decisions.md` or any spec.

Design the skill so this run is expressed as roughly:
`/thejudge-sweep` over the decisions corpus with the audit question above —
but leave the actual run to the next session.

## Conventions to follow

- Obey `CLAUDE.md`: concise/direct style; process-skill precedence; **PR to
  `main`, never push** (the owner merges); write evidence to artifacts, not the
  reply.
- Use the skill-authoring process (`superpowers:writing-skills`) — it's
  non-overlapping with the thejudge lifecycle and allowed here.
- Borrow the good conventions from `graph-run` / `thejudge-*` without copying
  the lifecycle: give every dispatched subagent an absolute `Working directory:`
  line; put outputs in a defined work folder; keep a small on-disk record of
  what ran.
- Note the repo's workflow-size guideline (medium, ~15 agents) — 18 sections is
  a slight, acceptable overage; the skill should handle N sections generally.

## Deliverable for this session

- The `thejudge-sweep` skill, thin and reviewable.
- A one-line record of how to invoke it for Phase B (for the next session).
- Do **not** launch the Workflow or run Phase B here.
