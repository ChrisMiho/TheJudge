---
name: thejudge-cleanup
description: >-
  Closes out a ship-ready work package: verifies slice completion, promotes
  durable PRD truth, writes a receipt, updates PRD/work/STATUS.md, and deletes
  PRD/work/<slug>/. Also handles explicit corpus-hygiene sweeps. Use when a
  feature has shipped (STATUS.ship-ready), when the user force-overrides for
  cleanup, or when the user explicitly asks for PRD corpus hygiene — not for
  general code tidying requests.
---

# TheJudge Cleanup

## Goal

Close out a work package: verify what's done, promote durable docs, write the receipt, delete `PRD/work/<slug>/`.

## Inputs

Work slug. Optional force override when the user explicitly requests cleanup of a non-`ship-ready` package.

## Reads

1. `PRD/work/<slug>/README.md` + `GAMEPLAN.md` + slice docs
2. `PRD/work/<slug>/STATUS.*` marker and `PRD/work/STATUS.md`
3. `PRD/instructions/doc-lifecycle.md`
4. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties
5. Relevant codebase paths from slice implementation maps

## Writes

- Promoted durable outcomes in the affected `PRD/sections/*.md`; new decisions go into the relevant `PRD/sections/decisions/<domain>.md` file plus the router index line in `PRD/sections/decisions.md`
- Receipt at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md` — **written before delete** — containing date, slug, status (shipped | partial | corpus-only), actions taken, every file created/updated/deleted, verification results
- `PRD/sections/system-map.md` entry flipped `planned`/`partial` → `shipped`, only once both code and the receipt exist
- `PRD/work/STATUS.md` — remove the slug from every section
- `PRD/README.md`, only if navigation changed (never re-introduce a multi-row work-package table)

## Ship checklist

- Package is `ship-ready` (`status: ship-ready` + `STATUS.ship-ready`) **or** user explicitly forced cleanup
- Slice acceptance criteria satisfied and verified
- Tests updated; `npm run quality:check` green for touched areas
- Public contract unchanged unless a slice scoped a change
- No secrets committed
- Durable outcomes promoted; `PRD/work/<slug>/` ready to delete

## Gates

- **Status gate:** refuse cleanup unless the package is `ship-ready`, or the user explicitly ordered a force override. If refusing, report the current status and next skill.
- Receipt is written **before** `PRD/work/<slug>/` is deleted. Receipts are durable — never deleted with the work folder.
- The shipped-vs-planned signal lives only in `sections/system-map.md` — never edit a `DEC`/`REQ` `Status:` field to convey it.
- `npm run quality:check` green for touched areas, and no secrets committed, before delete.
- Never start new features or slices from this skill; never delete `PRD/instructions/receipts/`.

## Corpus hygiene mode

When the user explicitly requests a terminology/sections sweep (no feature slug): apply the terminology table below, and record every edit in a receipt named `skill-migration-<date>.md` or `<slug>-<date>.md`.

| Retire | Replace with |
| --- | --- |
| old milestone labels | core product |
| old provider-stage labels | provider modes (`mock` / `openai`) |
| retired provider names | current provider boundary language |
| simplification language | intentional constraints |

## Next step

Terminal — no required handoff. If the user wants to start new work, offer `/thejudge-kickoff` (`$thejudge-kickoff` in Codex).
