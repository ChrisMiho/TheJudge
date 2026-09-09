---
status: ship-ready
---

# resilient-weekly-data-refresh

Fix and harden the weekly one-command data refresh (`npm run data:refresh-pr`,
REQ-195). See `IDEA.md`, `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `GAMEPLAN.md`.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| [A](slice-a-scryfall-jsonl-bulk-fix.md) | Scryfall JSONL bulk download fix (unblocker) | — |
| [B](slice-b-fail-loud.md) | Fail-loud on card/rulings download failure | A |
| [C](slice-c-harden-combo-retries.md) | Harden combo retry backoff (keep 200ms pacing) | — |
| [D](slice-d-hash-gated-combos.md) | Hash-gated combo reuse + PRD promotion + ship gates (final) | A, C |

Single-agent order: A → B → C → D.

## Implementation map

- `scripts/refresh-scryfall-data.mjs` — JSONL bulk fix (A), fail-loud (B),
  card-identity hash + combo gate orchestration (D)
- `scripts/refresh-and-open-pr.mjs` — no-PR on card-download failure (B)
- `scripts/refresh-commander-spellbook-data.mjs` — retry hardening (C),
  template-set hash + expansion gate (D)
- `scripts/build-commander-spellbook-combos.mjs` — skip rebuild / reuse `.gz`
  when marker matches (D)
- `apps/backend/data/commanderSpellbookComboSource.meta.json` — committed hash
  marker (D)
- PRD promotion at cleanup: REQ-195 amend, REQ-196 new, integrations-and-data amend

Next: `/thejudge-implement-all PRD/work/resilient-weekly-data-refresh/`
