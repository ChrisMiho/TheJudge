# Slice A — Author the `codehealth` skill

## Status: done

## Goal

Author the new `codehealth` skill (`.claude/skills/codehealth/SKILL.md`, plus a
`reference.md` for the detailed tables) that specifies the standalone
behavior-preserving overnight loop, and author its skill fixture. The skill must be
self-contained — its own preflight, no dependency on `graph-preflight`.

## Requirements

1. Follow `superpowers:writing-skills` (RED-GREEN-REFACTOR, red-flags and
   rationalization tables, binding wording). Run the no-skill control first and
   record it as RED evidence.
2. `SKILL.md` carries YAML frontmatter with `name: codehealth` and a `description`
   that triggers on unattended overnight code-health loop runs (so `/loop codehealth`
   and discovery both work), and never claims to drive product-feature work.
3. Specify the full loop from `GAMEPLAN.md`: own preflight (profile-armed check via
   the `THEJUDGE_GRAPH_PROFILE` sentinel → else refuse; clean tree; branch off fresh
   `origin/main`), sync + dedup exclusion set, rank (delegating to
   `thejudge-investigate`/`thejudge-sweep`), the behavior-preserving **classification
   gate**, isolated build (`quality:check` + conditional live checks + verification),
   the **post-build assertion**, PR (never merge), ledger/digest under
   `.worktrees/.codehealth/<night-id>/`, pacing via `ScheduleWakeup`, and the
   counters/ceilings (PR cap 4, wall-clock 06:00, tick ceiling 15, failure ceiling 3).
4. State explicitly that the loop does **not** use `graph-preflight` and why (the
   base→main guard is for dependent specs; codehealth targets are independent).
5. Hard rules must include: never merge/close/force-push/rebase a PR; never ship a
   behavior change (park it in the digest); never run without the profile armed;
   honor `.worktrees/.graph-stop`; never edit a skill or settings/profile file; one
   build at a time; no denied backgrounding primitive.
6. Reuse the guardrail profile as the rails; state that the critical denials are
   static config (no canary needed), distinguishing this from the graph's live hook.
7. Author the skill fixture at
   `PRD/instructions/skill-fixtures/codehealth/<scenario-slug>.md` with the four
   sections from `skill-testing.md`. The scenario must never name `codehealth`; the
   grading key must include at least one **trap** (a "dead code" target that is
   actually behavior-load-bearing → must park, not ship) and at least one **refusal**
   (must not merge / must refuse to run unarmed).

## Acceptance criteria

- [ ] A1 `.claude/skills/codehealth/SKILL.md` exists with YAML frontmatter (`name`, `description`)
- [ ] A2 `SKILL.md` contains the loop's required sections (preflight, dedup, classify, build, post-build assert, hard rules, non-goals)
- [ ] A3 `SKILL.md` hard rules include never-merge and never-ship-behavior-change, and it never lists `graph-preflight` as a driver step
- [ ] A4 Skill fixture exists at `PRD/instructions/skill-fixtures/codehealth/` with Preconditions, Scenario, Grading key, Measured runs, ≥1 trap and ≥1 refusal
- [ ] A5 (manual) `superpowers:writing-skills` cycle followed; no-skill control observed as RED before the skill was written

## Verification

```bash
# A1/A2/A3 — structure and required content
test -f .claude/skills/codehealth/SKILL.md
grep -q "^name: codehealth" .claude/skills/codehealth/SKILL.md
grep -qiE "post-build|classif|dedup|hard rules|non-goal" .claude/skills/codehealth/SKILL.md
grep -qi "never merge" .claude/skills/codehealth/SKILL.md
# A3 — must not depend on graph-preflight as a step (a "does NOT use graph-preflight" line is fine)
! grep -iE "invoke .*graph-preflight|run graph-preflight|graph-preflight --take-lock" .claude/skills/codehealth/SKILL.md
# A4 — fixture present
ls PRD/instructions/skill-fixtures/codehealth/*.md
```

## Files touched

- `.claude/skills/codehealth/SKILL.md`
- `.claude/skills/codehealth/reference.md`
- `PRD/instructions/skill-fixtures/codehealth/<scenario-slug>.md`
- `PRD/work/standalone-codehealth-workflow/slice-a.evidence.md` (manual A5 line)
