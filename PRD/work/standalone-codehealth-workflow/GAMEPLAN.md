# Gameplan: standalone code-health workflow

## Objective

Ship a new `codehealth` skill — a self-paced overnight loop that opens one
behavior-preserving code-health PR per target, never merges, and needs **zero
changes to the graph**. Supersede `overnight-codehealth`.

## Architecture

**The skill owns a thin loop; it reuses tools, not the graph lifecycle.**

- **Own preflight** (does NOT call `graph-preflight`): confirm the guardrail
  profile is armed (env sentinel `THEJUDGE_GRAPH_PROFILE` present — else refuse the
  night), clean working tree, branch off fresh `origin/main`. Sidestepping
  `graph-preflight` is the entire fix for the base→main-guard conflict that limited
  the old loop to one target per night.
- **Reuses, unmodified:**
  - `.claude/graph-profile.json` — the permission profile. Its deny list (no
    force-push, no push to `main`/`master`, no `gh pr merge`/`close`, no `rm -rf`,
    no `pkill`/`killall`/`nohup`, no edits to settings/profile/CLAUDE.md/`thejudge-*`
    skills/`.secrets`) is the loop's crown-jewel rails. Because these are **static
    harness config, not a live hook, they cannot silently stop firing** — so the
    loop needs no canary or hook-liveness heartbeat, unlike the graph.
  - `thejudge-investigate` / `thejudge-sweep` — target ranking.
  - `npm run quality:check` — the canonical build gate; plus conditional
    live-backend checks only when a target touches a live path.
  - `verification-before-completion` / `test-driven-development` — build discipline.
  - The stop sentinel `.worktrees/.graph-stop` — one shared kill switch the loop
    checks itself at each tick boundary.
- **Ledger + digest:** one file per night at
  `.worktrees/.codehealth/<night-id>/ledger.md` (`.worktrees/` is gitignored). Its
  rows include targets **skipped for touching behavior** — that list is the morning
  digest.

## Data flow (one tick)

```
sync + dedup (open codehealth PRs + ledger, non-overlapping files only)
  → rank (thejudge-investigate/sweep, excluding the set)
  → classify: behavior-preserving? -- no/uncertain --> skip + digest row
        │ yes
  → branch off fresh origin/main (codehealth/<night-id>-<n>-<short>)
  → build: apply refactor → quality:check (+ conditional live) → verify
  → post-build assert: tests pass UNCHANGED, no behavior-covering test deleted,
        no PRD/sections REQ/FLOW-backing file altered visibly -- fail --> discard
        │ pass
  → gh pr create (never merge) → ledger row → pace next tick
```

## Slices

| Slice | Objective | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| A | Author the `codehealth` skill (SKILL.md + reference.md) and its skill fixture | — | — |
| B | Integrate: catalog it, supersede `overnight-codehealth`, harden the profile, mirror to `.agents/`, docs | A | after A |

Two slices, sequential (B needs A's skill to exist to catalog, delete the old one,
and mirror). One unattended agent can run both via `thejudge-implement-all`.

## Key decisions (owner reviews at the PR)

1. **Delete `overnight-codehealth`, don't stub it.** References outside worktrees
   are only the two skill copies + historical receipts; it is not in AGENT-SKILLS.md.
   The new entry point is `/loop codehealth`. The two must never both drive overnight
   runs.
2. **Reuse the graph permission profile as-is for v1.** A codehealth-specific profile
   that tunes caps is possible later; the existing deny list already covers every
   dangerous action. Slice B adds one deny (editing the `codehealth` skill itself) so
   an armed run cannot self-modify.
3. **Fixture authored, not run unattended.** The multi-rep RED→GREEN validation
   (superpowers:writing-skills) costs real subagent tokens and is an owner-gated
   pre-merge check, matching `skill-testing.md`'s "deliberate, not CI" stance. The
   slice authors the fixture and records the no-skill control; the full 3-rep run is
   a manual owner step.

## Verification checklist

- [ ] `.claude/skills/codehealth/SKILL.md` present with frontmatter + required sections
- [ ] Skill never depends on `graph-preflight`; defines its own preflight
- [ ] Hard rules include never-merge and never-ship-behavior-change
- [ ] Skill fixture authored with ≥1 trap and ≥1 refusal in the grading key
- [ ] `overnight-codehealth` removed from `.claude/skills/` and `.agents/skills/`
- [ ] `codehealth` cataloged in AGENT-SKILLS.md
- [ ] `graph-profile.json` denies editing the `codehealth` skill dirs
- [ ] `npm run skills:ai-sync` run; `diff -rq .claude/skills .agents/skills` clean
- [ ] `npm run quality:check` green

## Product-truth promotion

**None.** This is behavior-preserving tooling; it proposes and applies no
`PRD/sections/` change. Cleanup deletes the work folder and writes a receipt only.
