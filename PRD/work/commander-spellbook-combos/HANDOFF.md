# Handoff — commander-spellbook-combos

Written 2026-08-12, after `thejudge-implement-all` completed all six slices.

**Package status: `ship-ready`. Implementation is finished and merged-ready. Three
things remain, and the first two are human-authorized actions an agent cannot
perform on its own.**

Read this file, then `README.md`, then the slice doc for whatever you touch. You
do not need to read the code to do the remaining work.

## Where things stand

| | |
|---|---|
| PR | [#89](https://github.com/ChrisMiho/TheJudge/pull/89) — `[THEJUDGE-AUTO][READY]`, OPEN, MERGEABLE |
| Shared branch | `thejudge-auto/commander-spellbook-combos` @ `4591164` |
| Autonomous base | `origin/feature/enhancement-bangers` @ `46b6bc5` |
| Contributor branch | `thejudge-impl/commander-spellbook-combos-20260811-1` |
| Worktree | `.worktrees/implement-commander-spellbook-combos` (clean, retained) |
| Slices | A–F all `done`; six milestone commits, one per slice |
| Verification | 368 backend tests + 48 script tests pass; `npm run quality:check` green on the shared head |

Nothing is blocked. No blocker comment exists on the PR and none is warranted.

## What remains

### 1. Production corpus refresh (owner action, REQ-093)

**The committed corpus is an empty bootstrap artifact** —
`apps/backend/data/commanderSpellbookCombos.json` has `variantCount: 0`. This was
deliberate: fabricating community combo data would have put invented content on
the runtime path. The build pipeline is complete and tested against committed
sample inputs; it just has no real data yet.

Until this runs, the feature loads cleanly and matches nothing. That is correct
fail-open behavior, not a bug — but the feature is inert in production.

```bash
npm run data:refresh-combos -- --confirm-live-calls   # live Commander Spellbook + Scryfall calls
node scripts/build-commander-spellbook-combos.mjs      # deterministic, offline
```

Then commit both artifacts. Notes:

- Use the direct `node scripts/build-...` command, **not** `npm run data:build`.
  The aggregate chain exits 1 at its *first* link (`build-card-metadata.mjs`)
  because the gitignored Scryfall bulk input is absent in a fresh checkout. That
  is pre-existing and unrelated to this work — see slice A's evidence.
- The refresh stages into `apps/backend/data/commander-spellbook.tmp/` and swaps
  on success only, so a failed or partial run cannot corrupt a good snapshot.
- Record the run date and resulting variant count in slice A's verification
  evidence, and tick its owner-action box.
- Expect size: roughly 1.1 MB of detail artifact per 1,000 variants. If it lands
  near 30 MB, read slice B's cold-start measurement before deciding whether to
  narrow the detail artifact — that is a new decision, not a silent change.

### 2. Answer-quality A/B (owner action, REQ-146 / DEC-161)

```bash
ASK_AI_PROVIDER=openai npm run combo:answer-quality -- --confirm-live-calls
```

Needs `OPENAI_API_KEY` and `OPENAI_MODEL` too; without them the script fails with
a message naming the missing variable rather than a stack trace. Without
`--confirm-live-calls` it prints the plan and exits 0 having made zero calls.

**Run this only after the corpus refresh, and read this first.** The curated
scenarios in `scripts/fixtures/combo-answer-quality-scenarios.json` currently
reference the slice E eval fixtures, whose oracle ids are **synthetic**
(`eval-oracle-a`, …) and appear in no real corpus. Run the A/B as-is and both legs
produce identical prompts, costing money to prove nothing.

Fix it one of two ways:

- Confirm the refreshed corpus actually contains the fixture cards (it will not —
  the ids are invented), **or**
- Give the affected scenarios an inline `request` using real oracle ids from the
  refreshed corpus. The scenarios file supports `request` as an alternative to
  `fixture` for exactly this reason; `loadScenarios` handles both.

Then record the dated verdict in slice F's `## Reviewed conclusion` — plainly,
including a negative or inconclusive result. Per DEC-161 this informs the ship
decision and does **not** block it, so a "no measurable improvement" verdict is a
valid outcome to ship on, not a reason to reopen the work.

### 3. Merge, then cleanup

Review and merge PR #89 into `feature/enhancement-bangers` manually. The
implement skill is not authorized to merge and did not.

Then, **from `feature/enhancement-bangers`, not from the worktree**:

```
/thejudge-cleanup PRD/work/commander-spellbook-combos/
```

This package has an `## Autonomous metadata` section, so cleanup applies the
four-condition autonomous merge-proof gate. Anticipating it:

1. **Current branch equals the recorded base.** Run cleanup from
   `feature/enhancement-bangers`. Running it from the implementation worktree
   will refuse.
2. **PR merged into that base**, verified via `gh pr view 89 --json state,baseRefName,mergedAt`.
3. **`.worktrees/implement-commander-spellbook-combos` clean and fully merged.**
   It is clean today. Do not delete it before cleanup — cleanup wants to inspect
   it.
4. **Runtime-cleanup evidence passing.** Not applicable here: this is a
   backend-only package with no browser or dev-server acceptance criteria in any
   slice, so `runtime-process-hygiene.md` never triggered and no
   browser-close/port-release evidence exists to check. Do not go hunting for
   missing evidence — the GAMEPLAN states this explicitly under "Constraints
   carried into every slice".

Slice F carries the PRD promotion checklist cleanup must execute (system-map
`planned` → `shipped`, goals/integrations wording, REQ note reconciliation,
receipt, board row removal). It is written out there so nothing is lost when this
folder is deleted.

## If you are picking this up cold

The design record is `DESIGN-BRIEF.md`; the architecture and module-boundary table
is `GAMEPLAN.md`. Each slice doc carries its own `## Verification evidence`
section explaining what was verified and, where it matters, why a particular
approach was chosen. The three most load-bearing decisions:

- **`EXAMPLE` variants are rejected** because upstream nulls their steps,
  prerequisites, mana, notes, and card state — so a null in a committed variant is
  artifact corruption, not thin data. Note the wire value is `"E"`, not
  `"EXAMPLE"`; upstream `Variant.Status` uses short codes.
- **Nothing is ever rendered as "complete".** Card state, zones, and legality are
  never validated, so the strongest honest claim is "all pieces present; card
  state unverified". Tests assert `\bcomplete\b` never appears in the section, and
  a guardrail line is deliberately phrased to avoid "complete-context" because a
  hyphen is a word boundary. If you change the rendering, keep that assertion.
- **`scryfall_api` is the only authoritative template expansion.** No public
  upstream serializer exposes `Template.replacements`, so a template without a
  query stays unresolved and can never complete a candidate. Do not hand-author a
  replacement map — the design brief lists that as a non-goal.

Upstream field notes verified from source (not the docs site) are in
`apps/backend/src/commanderSpellbook/__fixtures__/README.md`.

## Guardrails

- Do not invent corpus data to make the feature look alive. An empty corpus that
  fails open is the correct pre-refresh state.
- Do not add `combo:answer-quality` to `npm run quality:check` or assert its
  output against a golden. A script test enforces this.
- The Ask AI HTTP contract is unchanged and must stay that way —
  `AskAiRequest`/response, Zod schemas, provider selection, and
  `POST /api/ask-ai` are all untouched, and `app.contract.test.ts` is byte-identical
  to base.
- The eval corpus (`commander-spellbook-eval-catalog.json`) is intentionally
  independent of the production artifact so a refresh cannot churn a golden. That
  independence was verified by experiment, not just by construction. Keep it
  separate.
- Never force-push the shared branch, and never delete the remote branch.
