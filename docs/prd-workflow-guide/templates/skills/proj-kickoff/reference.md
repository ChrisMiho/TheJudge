# <Product> PRD quick map

Navigation aid loaded on demand. No writes.

## Source-of-truth precedence

1. `PRD/sections/decisions.md` and the domain files it routes to
2. other `PRD/sections/` files
3. `PRD/instructions/` files
4. `PRD/README.md` — navigation only

## Workflow skills

    kickoff → refinement → quality-check → map-out → implement → cleanup

Optional: `proj-defer` (park/restore), `proj-implement-all` (unattended full
run), `proj-implement-fanout` (concurrent packages), `proj-prepare` (autonomous
preparation).

Full catalog: `AGENT-SKILLS.md`.

## Task → files

| Task | Read |
|---|---|
| Understand the product | `sections/overview.md`, `sections/decisions.md`, `sections/goals-and-non-goals.md` |
| Implement a feature | `sections/decisions.md`, `functional-requirements.md`, `user-flows.md`, `integrations-and-data.md` |
| Plan slices | `sections/decisions.md`, `functional-requirements.md`, `instructions/workflow-reference.md`, `instructions/requirement-format.md` |
| Write tests | `instructions/test-naming.md` |
| Edit PRD docs | `instructions/agent-working-rules.md`, `instructions/writing-rules.md`, `instructions/doc-lifecycle.md` |
| Find what exists | `sections/system-map.md` |

## Out of scope for default reads

Everything under `PRD/work/` unless a package was named, and every section file
not listed for the current task.
