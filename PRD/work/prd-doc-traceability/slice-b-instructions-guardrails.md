# Slice B — Promotion gate and commit convention in instructions/

## Status: planned

## Goal

Add the two lightweight process guardrails to `instructions/`: a promotion gate (a catalog entry flips to `shipped` only when code **and** a cleanup receipt exist, enforced at cleanup) and a conventional-commits-lite commit convention (`docs(prd):` vs `feat:`/`fix:`).

## Dependencies

- Slice A complete and validated (catalog exists; guardrails reference it).

## Requirements

1. `DEC-044`: document the promotion gate in `instructions/doc-lifecycle.md` — a `sections/system-map.md` entry is marked `shipped` only when product code exists **and** a cleanup receipt has been written; until then it stays `planned` (or `partial`). The gate is enforced at cleanup time.
2. `DEC-044`: document the commit-message convention in `instructions/agent-working-rules.md` — `docs(prd):` for doc/plan-only changes (including PRD edits and `PRD/work/` planning); `feat:`/`fix:` for changes that ship product behavior. Keep it lite (no full conventional-commits enforcement, no tooling).
3. Wire the gate into the cleanup step so it is actually applied: add a line to the `thejudge-cleanup` skill that, on ship, flips the shipped subsystem's catalog entry to `shipped` and references the promotion gate in `doc-lifecycle.md`.
4. Do not introduce new tooling; these are documentation conventions only.

## Files touched

- `PRD/instructions/doc-lifecycle.md`
- `PRD/instructions/agent-working-rules.md`
- `.cursor/skills/thejudge-cleanup/SKILL.md` (canonical) — add promotion-gate reference

## Changes

### `instructions/doc-lifecycle.md`

Add a "System-map promotion gate" subsection under (or adjacent to) "On slice completion":

- A `sections/system-map.md` entry stays `planned`/`partial` until both (a) product code exists and (b) a cleanup receipt at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md` is written.
- At cleanup, flip the relevant entry/entries to `shipped`.
- The shipped-vs-planned signal lives in the catalog only; never edit `DEC`/`REQ` `Status:` fields to express it.

### `instructions/agent-working-rules.md`

Add a "Commit message convention" subsection:

- `docs(prd):` — PRD/doc/plan-only changes (no product behavior change), including edits under `PRD/` and `PRD/work/`.
- `feat:` / `fix:` — changes that ship or fix product behavior (code under `apps/`, `scripts/`, runtime data artifacts).
- Lite by intent: a prefix convention, not a validated commit-lint pipeline.

### `.cursor/skills/thejudge-cleanup/SKILL.md`

Add one bullet to the cleanup actions: on ship, apply the promotion gate — flip the shipped subsystem's `sections/system-map.md` entry from `planned`/`partial` to `shipped` and cite the gate in `doc-lifecycle.md`.

## Acceptance criteria

- [ ] `instructions/doc-lifecycle.md` describes the promotion gate (code + receipt → `shipped`; enforced at cleanup; catalog-only signal).
- [ ] `instructions/agent-working-rules.md` describes the `docs(prd):` vs `feat:`/`fix:` convention.
- [ ] `thejudge-cleanup` (canonical `.cursor/skills/`) references the promotion gate.
- [ ] No new tooling or dependencies are added.
- [ ] No product code changed.

## Verification

```bash
rg -n "promotion gate|system-map" PRD/instructions/doc-lifecycle.md
rg -n "docs\(prd\)|feat:|fix:" PRD/instructions/agent-working-rules.md
rg -n "system-map|promotion gate" .cursor/skills/thejudge-cleanup/SKILL.md

# Skills are synced to .agents/ and .claude/ from the canonical .cursor/ copy
npm run skills:ai-sync
```

After editing any `.cursor/skills/thejudge-*`, run `npm run skills:ai-sync` and commit the synced copies (see `AGENT-SKILLS.md`).
