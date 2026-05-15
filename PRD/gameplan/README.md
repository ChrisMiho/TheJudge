# PRD Gameplan

This folder is the execution control plane for "what to build next" and "in what order" without changing product truth.

## Source of Truth Precedence

Apply this order whenever gameplan docs conflict:

1. `PRD/sections/decisions.md`
2. active `PRD/sections/*.md`
3. `PRD/instructions/*.md`
4. `PRD/README.md`
5. files in `PRD/gameplan/`

`PRD/gameplan/` never overrides section truth; it operationalizes it.

## Files

- `MASTER-ROADMAP.md` - now/next/later execution lanes with dependency notes.
- `FEATURE-QUEUE.md` - prioritized feature planning queue and links.
- `OPEN-QUESTIONS-QUEUE.md` - unresolved `Q-*` with impact and owners.
- `features/*.md` - feature-specific execution plans.

## Workflow

1. Use `prd-gameplan-bootstrap` when baseline docs are missing or stale.
2. Use `prd-gameplan-feature-plan` for each new feature slice.
3. Use `prd-gameplan-sync` whenever PRD sections/instructions change.
4. Keep plans thin, traceable, and executable.
