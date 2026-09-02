# Receipt: standalone-codehealth-workflow — 2026-09-01

**What happened:** The overnight code-health loop is now its own workflow. A new
`codehealth` skill opens one behavior-preserving code-health PR per target (dead,
duplicate, inefficient, or bad-practice code, plus documentation drift) and never
merges; it replaces `overnight-codehealth`, which depended on the graph feature engine
and could only ever ship one target a night.

**What it means for you:** Run `/loop codehealth` in a session launched with
`claude --settings .claude/graph-profile.json` for an unattended night, or drive a
supervised tick as we did. Anything that would change game behavior — or pit code
against `PRD/sections/` product truth — parks in a morning digest for you; nothing is
merged automatically.

---

- **Date:** 2026-09-01
- **Slug:** standalone-codehealth-workflow
- **Status:** shipped
- **Shipped via:** PR #165 (merged to `main`, merge commit `4236e7e`)

## Why

`overnight-codehealth` drove `graph-kickoff` + `graph-implement`, but the graph is a
feature engine. `graph-preflight`'s base→main guard refuses a fresh run while any
`thejudge-auto/*`→main PR is open (a guard for *dependent* specs), so the first
code-health target of a night blocked every later one. Both overnight runs on
2026-09-01 died this way (0 and 1 target). The fix: a standalone loop that runs its
own preflight and never touches `graph-preflight`.

## Actions taken

- **Slice A** — authored `.claude/skills/codehealth/` (`SKILL.md` + `reference.md`):
  own preflight (sidesteps `graph-preflight`), sync + dedup, behavior-preserving
  classification gate, isolated build, post-build assertion, PR-never-merge, ledger +
  morning digest, counters/ceilings, pacing. Reuses `.claude/graph-profile.json` as
  static rails (no live-hook canary needed), the `.worktrees/.graph-stop` kill switch,
  and `thejudge-investigate`/`thejudge-sweep` for ranking.
- **Slice B** — cataloged `codehealth` in `AGENT-SKILLS.md`, added a `/loop codehealth`
  recipe to `OPERATOR.md`, hardened `graph-profile.json` to deny an armed run editing
  the `codehealth` skill, deleted the superseded `overnight-codehealth` skill, mirrored
  to `.agents/skills/` via `npm run skills:ai-sync`.
- **Goal widened** (post-map-out refinement) to full codebase health — inefficient
  code, bad practices, and documentation drift — with two guardrails: efficiency/
  bad-practice fixes ship only if output-equivalent; docs are corrected only *to* the
  code, and any `PRD/sections/` mismatch parks (never edited).
- **Skill fixtures** authored and run: `overnight-behavior-preserving-loop.md` (6-rep,
  hidden dispatch trap — 0/5 shipped the behavior change, 5/5 refused merge, unarmed
  rep refused the night) and `documentation-drift-authority.md` (4-rep — 4/4 fixed the
  comment, parked the product-truth mismatch untouched).

## Files created / updated / deleted

Created:
- `.claude/skills/codehealth/SKILL.md`, `.claude/skills/codehealth/reference.md`
- `.agents/skills/codehealth/` (mirror)
- `PRD/instructions/skill-fixtures/codehealth/overnight-behavior-preserving-loop.md`
- `PRD/instructions/skill-fixtures/codehealth/documentation-drift-authority.md`

Updated:
- `AGENT-SKILLS.md` (catalog entry), `OPERATOR.md` (recipe),
  `.claude/graph-profile.json` (self-edit deny)

Deleted:
- `.claude/skills/overnight-codehealth/`, `.agents/skills/overnight-codehealth/` (superseded)
- `PRD/work/standalone-codehealth-workflow/` (this cleanup)

## Verification

- `npm run quality:check` green (exit 0); CI on PR #165 green (static, backend, 3
  frontend shards, coverage-merge).
- Both skill fixtures recorded with measured runs (see files above).
- Supervised first tick (`.worktrees/.codehealth/supervised-20260901-2318/`) exercised
  the machinery end to end and opened PR #166 (dead-constant removal) — left for the
  owner to merge.

## Product truth

None. Behavior-preserving tooling — no `PRD/sections/` change proposed or applied, so
nothing to promote and no `system-map.md` entry (a skill is not a product subsystem).

## Follow-up (noted, not in scope)

The `graph-preflight` base→main guard is also over-broad for the graph's *own* future
concurrent runs — a separate piece of work, not bundled here.
