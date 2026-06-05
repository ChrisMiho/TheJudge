## Status

- status: **active**
- canonical plan: [GAMEPLAN.md](GAMEPLAN.md)
- purpose: Roll out 5-agent-workflow skills to `.cursor/`, `.codex/`, `.claude/`; modernize kickoff; sections terminology pass; migration receipt

## Purpose

Package and execute the **lean PRD workflow** for a solo engineer: five skills (`thejudge-kickoff`, `thejudge-refinement`, `thejudge-quality-check`, `thejudge-map-out`, `thejudge-cleanup`) deployed identically to Cursor, Codex, and Claude Code project skill paths.

**Implementing agents:** treat this folder as the single source of truth. Do not rely on Cursor-only plan files under `.cursor/plans/`.

## Agent read order

1. This README
2. [GAMEPLAN.md](GAMEPLAN.md)
3. The slice doc for the slice you are implementing (**A → F** unless told otherwise)
4. `PRD/instructions/doc-lifecycle.md`
5. Staged skill drafts: `skills/` (slice B authors; slice C deploys)

## Slices

| Slice | File | Status | Depends on |
| --- | --- | --- | --- |
| A | [slice-a-reference.md](slice-a-reference.md) | planned | — |
| B | [slice-b-author-skills.md](slice-b-author-skills.md) | planned | A |
| C | [slice-c-tri-platform-deploy.md](slice-c-tri-platform-deploy.md) | planned | B |
| D | [slice-d-delete-old-kickoff.md](slice-d-delete-old-kickoff.md) | planned | C |
| E | [slice-e-sections-terminology.md](slice-e-sections-terminology.md) | planned | — (parallel with B–D OK) |
| F | [slice-f-migration-receipt.md](slice-f-migration-receipt.md) | planned | A, B, C, D, E |

## Implementation map

| Slice | Primary deliverables |
| --- | --- |
| A | `PRD/instructions/workflow-reference.md`, `PRD/instructions/receipts/` |
| B | `PRD/work/prd-workflow-skills/skills/*/SKILL.md` (+ kickoff `reference.md`) |
| C | `.cursor/skills/`, `.codex/skills/`, `.claude/skills/` (5 skills × 3 = 15 folders) |
| D | Delete `kickoff/` from `.claude`, `.codex`, `.cursor` if present |
| E | `PRD/sections/*`, `PRD/README.md`, root `README.md` terminology |
| F | `PRD/instructions/receipts/skill-migration-<date>.md`; **delete this work folder** |

## Locked decisions

| Topic | Decision |
| --- | --- |
| Skill count | 5 only — no orchestrator, no slice-execute skill |
| Platforms | Identical copies in `.cursor/skills/`, `.codex/skills/`, `.claude/skills/` |
| Old kickoff | Delete entirely — no deprecation stub |
| Skill naming | `thejudge-*` prefix (replaces `kickoff`) |
| Receipts | Durable under `PRD/instructions/receipts/` — never in `work/` |
| Staging | Author in `PRD/work/prd-workflow-skills/skills/` before tri-platform copy |

## Rolling agent prompt

```
Implement slice <LETTER> from PRD/work/prd-workflow-skills/
```

## When done

- Mark each slice **Status** at top of its file: `planned` → `in progress` → `complete`
- Update this README slice table
- Slice F: write migration receipt, then **delete** this entire folder per `doc-lifecycle.md`
