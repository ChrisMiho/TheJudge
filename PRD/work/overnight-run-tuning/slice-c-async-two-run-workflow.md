# Slice C — async two-run workflow

## Status: done

## Goal

Turn the graph run into a two-run, async-gated flow: run one stops at
quality-check PASS with a docs-only base→main PR and a questions file; the owner
answers the file on their own schedule; run two applies the answers and
implements. Node table and every boundary stay byte-unchanged.

## Requirements

Edit three surfaces — the contract is the authority, the two skills mirror it.

1. **`PRD/instructions/graph-workflow-contract.md`:**
   - The `## Overall flow` and the `define`/gate rows describe the two-run split:
     at `define`, a non-empty `PRD/sections/` diff is written into
     `GATE-QUESTIONS.md` and the run **continues** to `gate-qc` (it no longer
     parks live); at `gate-qc` PASS run one parks at `owner-action`, opens the
     docs-only base→main PR, and ends.
   - Document `GATE-QUESTIONS.md`: one `## <STABLE-ID>` block — plain-product
     restatement, the complete diff, `- Verdict: <accept | edit | reject>`,
     `- Reason:` — plus a trailing `## Blocker questions` section.
   - State that the base→main PR is opened by run one with
     `gh pr create --base main --head thejudge-auto/<slug>` (create, not
     merge — no boundary touched) and is the same PR the implementation later
     grows into.
   - State the only contract change is the stop condition and the gate's answer
     mechanism; the node table, per-node models, caps, and the deny list are
     unchanged.
2. **`.claude/skills/graph-gate-review/SKILL.md`** — rewrite from a live walk into
   a **reader**: parse the answered `GATE-QUESTIONS.md`, apply `edit`/`reject`
   verdicts inside the recorded diff only, write `## Gate verdicts`, resolve the
   gate, restore `STATUS.refined`. **Refuse on any blank verdict slot** — an
   unanswered gate cannot resume. `reject` still burns the ID. No verdict is
   supplied on the command line; the file is the input.
3. **`.claude/skills/graph-run/SKILL.md` + `reference.md`:**
   - At `define`: write `GATE-QUESTIONS.md` on a non-empty diff and continue; do
     not live-park. An empty diff writes no file.
   - At `gate-qc` PASS: park at `owner-action`, open the base→main PR, record the
     questions file (if any) as the `## Open gate`, end.
   - Run two: on resume at an `owner-action` park whose `GATE-QUESTIONS.md` is
     **fully answered**, the driver dispatches the `graph-gate-review` applier
     itself (restoring `STATUS.refined`), then re-enters at `gate-qc` via the
     existing entry-point table; a **blank** slot re-parks (still `owner-action`),
     so run two stays a single owner command.
   - Reference the preflight base→main guard (slice A) as the fresh-run gate.

## Acceptance criteria

- [x] C1 — the contract's `## Overall flow` states run one stops at quality-check
  PASS with a docs-only base→main PR and a questions file, and run two resumes.
- [x] C2 — the contract documents the `GATE-QUESTIONS.md` answer-slot format and
  the run-one `gh pr create --base main` (create-not-merge) step.
- [x] C3 — `graph-gate-review` SKILL reads and applies an answered file and
  refuses on a blank slot; it no longer walks the diff live.
- [x] C4 — `graph-run` SKILL writes `GATE-QUESTIONS.md` at `define` (non-empty
  diff), stops at `gate-qc` PASS with the base→main PR, and describes run two
  auto-applying the answered file then re-entering `gate-qc`.
- [x] C5 — the node table, per-node models, caps, and the `## Boundaries` deny
  list are byte-unchanged (grep-assert; contract +51/-8, all in prose).
- [x] C6 — coherence read across all four files (see `slice-c.evidence.md`);
  owner sign-off is the checkpoint review below.

## Verification

```bash
# C5 — the node table row set and boundary deny list are untouched
git diff main -- PRD/instructions/graph-workflow-contract.md | grep -E '^[-+].*\| `(preflight|shape|define|gate-qc|plan|build|review|land|close)`' && echo "NODE TABLE CHANGED — investigate" || echo "node table rows unchanged"
git diff main -- PRD/instructions/graph-workflow-contract.md | grep -E '^[-+].*(force-push|rm -rf|pkill|killall|gh pr merge|gh pr close)' && echo "DENY LIST CHANGED — investigate" || echo "deny list unchanged"
npm run quality:check
```

## Files touched

- `PRD/instructions/graph-workflow-contract.md`
- `.claude/skills/graph-gate-review/SKILL.md`
- `.claude/skills/graph-run/SKILL.md`
- `.claude/skills/graph-run/reference.md`
