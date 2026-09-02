# Slice A — Split `graph-run` into `graph-kickoff` + `graph-implement`

## Status: planned

## Goal

Retire `graph-run`; create `graph-kickoff` (spec-former, nodes 1–4) and
`graph-implement` (build, nodes 5–9) as two skills sharing one `graph` reference
doc; rewrite the contract and the orchestrator predicate to the new names. At the
end of this slice `graph-implement` still does a **single-pass** build for one
spec (today's run-two behavior) — the loop is Slice B.

## Requirements

1. Create `.claude/skills/graph-kickoff/SKILL.md` from `graph-run` run-one: the
   fresh-run intake (slug/branch/intake staging), `preflight → shape → define →
   gate-qc`, stop at gate-qc PASS, open docs-only base→main PR, park
   `owner-action`. Its `## Next step` / resume text names `graph-kickoff`.
2. Create `.claude/skills/graph-implement/SKILL.md` from `graph-run` run-two:
   resume an `owner-action` park, dispatch `graph-gate-review`, re-enter at
   `gate-qc`, run `plan → build → review → land → close`, including the build
   write-scope assertion and the node-7 no-write reviewer. Single-pass here.
3. Extract shared machinery both skills need into
   `.claude/skills/graph-kickoff/reference.md` **or** a shared home both read —
   parking, pre-dispatch sequence, hook liveness, tool-call caps, halting on the
   stop sentinel, delegation boundary, permission profile, and the **Terminal
   states** table. Move the Terminal states table to one canonical home and point
   `graph-preflight.test.mjs` at it (it currently reads `graph-run/SKILL.md`).
4. Delete `.claude/skills/graph-run/` (both trees) after its content is split.
5. Rename the orchestrator predicate from `graph-run is controlling` to one shared
   token (e.g. `graph is controlling`) emitted by **both** new skills; update the
   six `thejudge-*` phase skills, `preparation-contract.md`,
   `workflow-reference.md`, and `graph-ledger-check.mjs` /
   `graph-ledger-check.test.mjs` to recognize the new token. Keep it **one** token
   so phase-skill logic is unchanged — only the string changes.
6. Rewrite `PRD/instructions/graph-workflow-contract.md`: `## The two runs`, the
   node table, entry-point references, `## Run predicate`, `## One run at a time`,
   `## Delegation boundary` ("exactly three graph skills" → four), and every
   `graph-run` name → the correct new skill. The contract stays the authority.
7. Apply **REQ-160** truth to `PRD/sections/functional-requirements.md` by intent:
   retitle to name `graph-kickoff` as the door and `graph-implement` as the build
   entry; update its acceptance criteria and the `AGENT-SKILLS.md`-diagram / skill-
   count criteria accordingly (the `AGENT-SKILLS.md` file itself is edited in E).
8. Run `npm run skills:ai-sync` so `.agents/skills/` mirrors the new tree.

## Acceptance criteria

- [ ] A1: `.claude/skills/graph-kickoff/SKILL.md` and
      `.claude/skills/graph-implement/SKILL.md` exist; `.claude/skills/graph-run/`
      is gone.
- [ ] A2: No `graph-run` name remains in `.claude/skills/`, `.agents/skills/`, or
      `PRD/instructions/graph-workflow-contract.md`.
- [ ] A3: The predicate token is renamed consistently — `graph-run is controlling`
      appears nowhere in `.claude/skills/`, `.agents/skills/`,
      `PRD/instructions/`, or `scripts/`, and the new token appears in both new
      graph skills and all six `thejudge-*` skills.
- [ ] A4: The Terminal states table lives in exactly one canonical file;
      `graph-preflight.test.mjs` reads it there and passes.
- [ ] A5: REQ-160 in `functional-requirements.md` names `graph-kickoff` /
      `graph-implement`; no acceptance criterion still asserts "three graph-*
      skills".
- [ ] A6: `.agents/skills/` mirrors `.claude/skills/` (`diff -rq` clean); the
      boundary hook is byte-unchanged.
- [ ] A7: `npm run test:scripts` passes.

## Verification

```bash
grep -rn "graph-run" .claude/skills .agents/skills PRD/instructions/graph-workflow-contract.md scripts | grep -v receipts || echo "no graph-run refs"
grep -rln "graph-run is controlling" .claude/skills .agents/skills PRD/instructions scripts || echo "predicate renamed"
diff -rq .claude/skills .agents/skills
npm run test:scripts
```

## Files touched

- `.claude/skills/graph-kickoff/SKILL.md` (new), `reference.md` (new/shared)
- `.claude/skills/graph-implement/SKILL.md` (new)
- `.claude/skills/graph-run/**` (deleted)
- `.agents/skills/**` (regenerated via sync)
- `.claude/skills/thejudge-{kickoff,refinement,quality-check,map-out,implement-all,cleanup}/SKILL.md` + reference.md (predicate token)
- `PRD/instructions/graph-workflow-contract.md`, `preparation-contract.md`, `workflow-reference.md`
- `scripts/graph-ledger-check.mjs`, `scripts/graph-ledger-check.test.mjs`, `scripts/graph-preflight.test.mjs`
- `PRD/sections/functional-requirements.md` (REQ-160 by intent)
