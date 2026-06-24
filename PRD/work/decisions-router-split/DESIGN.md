# Design: split `decisions.md` into a router + per-domain files

Date: 2026-06-24
Status: approved direction; taxonomy provisional (to be refined before implementation)

## Problem & trigger

`PRD/sections/decisions.md` is ~1,030 lines / 62 decisions (DEC-001 → DEC-062)
and is **Read-First #1** + source-of-truth precedence #1 in every workflow.
Because it is a single monolithic file, **every feature pays the full context
cost of every other feature's decision history**. The trigger was simply seeing
the whole file print into context while working on scan refinement — where the
scan saga (DEC-050→062, ~250 lines) was relevant and the other ~750 lines were
not, but loaded anyway.

Root cause is structural (one file, loaded whole), not a specific readability
bug. Contributing factors: superseded entries kept inline at full length, and
long `Impact:` blocks describing *how code behaves* that now have a home in the
`system-map/` detail files (DEC-044 / DEC-048).

## Approved approach: domain split behind a thin router

Split decision **bodies** into `sections/decisions/<domain>.md`, and keep
`sections/decisions.md` as a **thin index/router** (~60–80 lines): a table of
`DEC-ID → domain file → one-line summary`, plus the precedence/lifecycle preamble.

Why the router (vs. deleting `decisions.md` and renaming the dir):

- Every existing `PRD/sections/decisions.md` path reference stays valid — no
  path surgery across skills, instructions, READMEs, or receipts.
- "Read First #1: decisions.md" now loads a thin map; the agent pulls only the
  one domain file it needs. This directly fixes the observed pain.
- DEC-IDs stay globally unique and resolvable, so cross-references
  (`supersedes DEC-022`) keep working regardless of which file a DEC lives in.

Rejected alternatives:

- **In-place hygiene only** (archive 5 fully-superseded entries + thin Impact
  blocks): too small — the monolith still loads whole and keeps growing.
- **Consolidate the sagas** (collapse supersession chains into one "current
  state" decision per subsystem): best end-state readability but highest
  risk/effort and loses granular provenance. Not justified by the trigger.

## Skill & reference impact (the duplication concern)

The three skill trees are **not** hand-maintained triplicates:

- `.cursor/skills/` is **canonical** (the only place to edit).
- `npm run skills:ai-sync` (`scripts/sync-agent-skills.sh`) regenerates
  `.claude/skills/` (full mirror) and `.agents/skills/` (mirror **minus**
  `thejudge-implement-codex`, excluded by design from the Codex runtime) via
  `rsync --delete`. The 7-vs-8 skill count in `.agents` is intentional, not drift.

Rule for any skill edit: **edit `.cursor/`, run the sync.** The copies regenerate.

References to `decisions.md` fall into three groups:

1. **Skills** (`thejudge-refinement`, `thejudge-kickoff/reference`,
   `thejudge-quality-check`, `thejudge-cleanup`) — reference the path and
   read-order. Fixed once in `.cursor/` + sync.
2. **Durable instruction/README files** — single copies, edited directly:
   `PRD/instructions/writing-rules.md`, `technical-design-rules.md`,
   `requirement-format.md`, `doc-lifecycle.md`, `agent-working-rules.md`;
   `PRD/README.md`; root `README.md`; `apps/backend/src/providers/README.md`;
   `apps/backend/src/eval/fixtures/README.md`.
3. **Receipts** (`PRD/instructions/receipts/*`) — some pin literal line numbers
   (e.g. `decisions.md:593`). These are frozen historical artifacts; leave as-is.

Because `decisions.md` stays as the router path, group-1/2 edits are small
wording tweaks ("promote to the relevant `decisions/<domain>.md` and add the
index line"), not path rewrites.

## Provisional taxonomy (STARTING POINT — to refine)

| File | Covers | DECs (approx) |
|---|---|---|
| `decisions/foundations.md` | assistant-not-judge framing, no rules engine | 001, 002, 013 |
| `decisions/capture-and-stack.md` | entry UX, stack rules, question fallback | 004–008, 015, 018, 009, 028 |
| `decisions/game-context-model.md` | GameContext, zones, phases, players, targets | 003, 019, 021–024, 026, 027, 034, 035, 037 |
| `decisions/prompt-assembly.md` | prompt sections, phase guidance, oracle, notes | 025, 036, 042, 043 |
| `decisions/rules-retrieval.md` | System 1/2/3 rulings + CR retrieval + eval | 029, 030, 032, 045–047 |
| `decisions/providers-and-contract.md` | endpoint, provider modes, contract freeze, debug | 010–012, 014, 016, 017, 020, 033, 049 |
| `decisions/follow-up-and-wait.md` | follow-up chat, frozen context, wait UX | 031, 038–041 |
| `decisions/scanning.md` | the scan saga | 050–062 |
| `decisions/doc-process.md` | system-map, doc lifecycle decisions | 044, 048 |

Open taxonomy questions to revisit: whether `foundations` is too small to stand
alone (could merge into `providers-and-contract` or a `framing` note); whether
`follow-up-and-wait` should fold into `providers-and-contract`; exact home for
DEC-043 (`gameStateNotes` spans prompt-assembly and game-context).

## Lifecycle rule (so it does not regrow)

Fold into `instructions/doc-lifecycle.md`:

- New decisions land in their domain file **and** get an index line in the router.
- Fully-superseded decision **bodies** are trimmed to a one-line tombstone
  (ID + "superseded by DEC-XXX") kept in-domain; the ID stays resolvable.
- Deep "how the code behaves" detail belongs in `system-map/` detail files, not
  in the decision `Impact:` block (DEC-044 / DEC-048 already establish this home).

## Migration outline (not yet approved for execution)

1. Finalize taxonomy (deferred — user will refine).
2. Create `sections/decisions/<domain>.md` files; move DEC bodies verbatim
   (preserve IDs, status, cross-refs).
3. Rewrite `sections/decisions.md` as the router (preamble + DEC-ID index table).
4. Update group-1 skills in `.cursor/` + run `npm run skills:ai-sync`.
5. Update group-2 durable instruction/README files.
6. Update `instructions/doc-lifecycle.md` with the lifecycle rule.
7. Record the change as a new decision (DEC-063) and a cleanup receipt.

## Out of scope

- Rewording or consolidating existing decision content (verbatim move only).
- Editing receipts' frozen line-number references.
- Any `apps/` code, prompt-assembly, API, or UI behavior change.
