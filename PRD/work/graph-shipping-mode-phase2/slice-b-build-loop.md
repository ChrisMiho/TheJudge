# Slice B — `graph-implement` becomes the background build loop

## Status: planned

## Goal

Turn `graph-implement`'s single-pass build into a background loop that watches
local `main`, detects approved-but-unbuilt specs, builds one at a time, and
park-one-continues. Applies REQ-171.

## Requirements

1. `graph-implement` accepts a loop invocation (via `/loop graph-implement`,
   self-paced) that on each tick syncs local `main` and scans `PRD/work/*/` on
   `main` for a **ready** spec: `STATUS.refined` marker + every `GATE-QUESTIONS.md`
   verdict slot answered (no blank) + no built code for that slug.
2. On picking a ready spec, set `STATUS.active` **first** as the single claim
   point (commit/record it) so a second tick or a restart never double-picks the
   same slug. A `GATE-QUESTIONS.md` with any blank slot is skipped as not-ready.
3. For the claimed spec, branch off fresh `main` in its own worktree, dispatch
   `graph-gate-review` to finalize the owner's verdicts, re-enter at `gate-qc`,
   and run `plan → build → review`, opening a code PR that grows from the merged
   spec PR. `land` stays human.
4. A build that parks (gate blocker, per-node cap, `gate-qc`/`review` loop-limit)
   sends **that slug** to `owner-action` and the loop continues to the next ready
   spec — one parked build never stalls the queue.
5. When no ready spec is found, the loop reports "no ready spec" and holds/stops
   rather than spinning.
6. Apply **REQ-171** truth to `PRD/sections/functional-requirements.md` by intent.
7. `npm run skills:ai-sync`.

## Acceptance criteria

- [ ] B1: `graph-implement/SKILL.md` documents ready-detection as `STATUS.refined`
      + all slots answered + no code, with `STATUS.active` as the single claim
      point (never double-pick).
- [ ] B2: The skill documents park-one-continue: a parked build → `owner-action`
      for that slug, loop proceeds to the next ready spec.
- [ ] B3: The skill is invocable as a self-paced `/loop graph-implement` and
      handles "no ready spec" without spinning.
- [ ] B4: REQ-171 present in `functional-requirements.md` with the ready-detection
      and park-one-continue criteria.
- [ ] B5: `.agents/skills/` mirrors `.claude/skills/`.
- [ ] B6: `npm run test:scripts` passes.

## Verification

```bash
grep -n "STATUS.active\|ready\|park" .claude/skills/graph-implement/SKILL.md
grep -n "REQ-171" PRD/sections/functional-requirements.md
diff -rq .claude/skills .agents/skills
npm run test:scripts
```

## Files touched

- `.claude/skills/graph-implement/SKILL.md`, `reference.md`
- `.claude/skills/graph-implement/` any loop helper doc
- `.agents/skills/**` (sync)
- `PRD/sections/functional-requirements.md` (REQ-171 by intent)
- `AGENT-SKILLS.md` skill-catalog row for `graph-implement` (loop nature) — full diagram in E
