status: active

# agent-workflow-alignment

Align TheJudge's interactive and autonomous skill paths, worktree and PR ownership, package deferral, and Playwright/dev-server process hygiene.

See [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) for the approved design and [GAMEPLAN.md](./GAMEPLAN.md) for architecture and verification strategy.

## Slices

| Slice | Goal | Depends on | Status |
| --- | --- | --- | --- |
| [A — Skill catalog pruning](./slice-a-skill-catalog-pruning.md) | Delete the two parallel-flavor skills; republish the interim catalog map | — | done |
| [B — Autonomous base and prepare](./slice-b-autonomous-base-and-prepare.md) | `thejudge-prepare` requires an explicit remote base and records it durably | A | planned |
| [C — Autonomous implementation and fanout](./slice-c-autonomous-implementation-and-fanout.md) | `implement-all`/`fanout` inherit the recorded base; fanout assigns preflighted ports | B | planned |
| [D — Cleanup and merge proof](./slice-d-cleanup-merge-proof.md) | Cleanup proves the implementation PR merged into the recorded base before deleting | C | planned |
| [E — Reversible deferral](./slice-e-reversible-deferral.md) | Add `thejudge-defer`; fix the status vocabulary table; publish the final ten-skill catalog | A | planned |
| [F — Playwright and runtime process hygiene](./slice-f-runtime-process-hygiene.md) | Create `runtime-process-hygiene.md`; wire it into `AGENTS.md` and affected skills | D | planned |
| [G — Root dev launcher hardening](./slice-g-dev-launcher-hardening.md) | Harden `scripts/dev.mjs`, add process-manager tests, wire the quality gate | F | planned |

Sequential, single-agent implementation — no wave grouping. Run with
`/thejudge-implement PRD/work/agent-workflow-alignment/ slice A` one at a
time, or `/thejudge-implement-all PRD/work/agent-workflow-alignment/` for one
unattended session covering all seven.

## Implementation map

| Area | Files |
| --- | --- |
| Skill catalog (A, E) | `AGENT-SKILLS.md`, `.cursor/skills/thejudge-map-out-parallel/` (deleted), `.cursor/skills/thejudge-implement-parallel/` (deleted), `.cursor/skills/thejudge-defer/` (new) |
| Autonomous base (B, C, D) | `PRD/instructions/preparation-contract.md`, `thejudge-prepare`, `thejudge-implement-all`, `thejudge-implement-fanout`, `thejudge-cleanup` |
| Deferral (E) | `PRD/instructions/workflow-reference.md`, `.cursor/skills/thejudge-defer/SKILL.md` |
| Runtime hygiene (F) | `PRD/instructions/runtime-process-hygiene.md` (new), `AGENTS.md`, `thejudge-map-out`, `thejudge-implement`, `thejudge-implement-all` |
| Dev launcher (G) | `scripts/dev.mjs`, `scripts/process-manager.mjs` (new), `scripts/process-manager.test.mjs` (new), `apps/frontend/vite.config.ts`, `package.json` |

Every canonical skill edit (A–F) ends with `npm run skills:ai-sync` and a
byte-identical mirror check before moving to the next slice.
