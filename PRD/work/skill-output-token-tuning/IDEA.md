# Idea

Problem: The `thejudge-*` agent workflow skills produce verbose output (long summaries, full document dumps, restated context) at every step, and output tokens cost roughly 5x input tokens — so verbose skill responses are disproportionately expensive across a long workflow.

Outcome: Add explicit, user-tunable output-verbosity guidance to the skill set (e.g. a verbosity/terseness setting or instruction block referenced by each skill) so the user can dial how much each skill writes back, without changing what work the skills actually do.

Non-goals: Not about reducing input context reads, not about changing the PRD content model, and not about rewriting skill logic/workflow order — purely about the size/shape of agent-facing and user-facing output.
