# Feature Queue

Use this file to track which feature plans should be authored next under `PRD/gameplan/features/`.

## Queue

| Priority | Feature slug | Status | Owner | Plan file | Notes |
|---|---|---|---|---|---|
| P0 | context-flow-eval-closure | active | unassigned | `PRD/gameplan/features/context-flow-eval-closure.md` | Wave 1 closure complete (`STORY-071`, `STORY-073`, `STORY-074`, `STORY-077`); next execute `STORY-075` then `STORY-076`; keep deferred `STORY-078` docs-only and no Q-* promotion. |
| P1 | provider-reliability-hardening | done | unassigned | `PRD/gameplan/features/provider-reliability-hardening.md` | Blockers resolved; `STORY-057` to `STORY-060` trackers and story docs reconciled to OpenAI-active roadmap language. |
| P2 | roadmap-deferred-item-promotion | proposed | unassigned | n/a (not created) | Keep deferred until P0/P1 gates are green; do not promote optional scope early. |

## Rules

- Add one row per planned feature slice.
- Keep `Feature slug` in lowercase kebab-case.
- Mark as `active` only when the corresponding feature plan file exists and is being executed.
