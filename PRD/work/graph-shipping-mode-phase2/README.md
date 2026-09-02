status: ideation

# graph-shipping-mode-phase2

Two decoupled tools joined by main: a parallel spec-former (each idea in its own
worktree off one base branch, opens a proposal PR) and a single background
implementation loop (syncs main, picks up approved-but-unbuilt specs, ships each
as its own code PR). Subagent/parallel fan-out is a knob, off by default, with
cost logged. Depends on [[graph-shipping-mode-phase1]]. Shape after Phase 1
lands. See `IDEA.md`.
