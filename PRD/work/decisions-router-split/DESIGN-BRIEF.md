# Design Brief: decisions.md router split

Date: 2026-06-24
Status: refined (taxonomy finalized; ready for quality-check)
Decision of record: **DEC-063** (`sections/decisions.md`)

## Scope

Split the ~1,030-line / 62-decision `PRD/sections/decisions.md` monolith into:

- a **thin router** at the existing `sections/decisions.md` path — precedence/lifecycle
  preamble + a `DEC-ID → domain file → one-line summary` index table (~60–80 lines), and
- **nine per-domain decision files** under `sections/decisions/`, organized by
  **topic/subsystem** (not by flow stage), holding the DEC bodies moved **verbatim**.

DEC-IDs stay globally unique and resolvable across files, so existing cross-references
(`supersedes DEC-022`) and every `sections/decisions.md` path reference keep working.

## Why (trigger)

`decisions.md` is Read-First #1 and precedence #1 in every workflow and loads whole, so
every feature pays the full context cost of every other feature's decision history. The
trigger was the scan saga (DEC-050→062) being relevant while ~750 unrelated lines loaded
anyway. Root cause is structural (one file, loaded whole), not a readability bug.

## Finalized taxonomy

Organizing axis: **topic/subsystem.** Each file = one subsystem you load when editing it.
Reusable topics that span the flow (e.g. `game-context-model`) stay unified rather than
scattered across journey stages. All nine files partition the 62 existing DECs exactly once.

| File (`sections/decisions/…`) | Topic | DECs |
|---|---|---|
| `framing.md` | product scope guardrails ("assistant, not judge / no rules engine") | 001, 002, 013 |
| `capture-and-stack.md` | entry & stack UX (front-end capture surface) | 004–009, 015, 018, 028 |
| `game-context-model.md` | structured `GameContext` data model | 003, 019, 021–024, 026, 027, 034, 035, 037, 043 |
| `prompt-assembly.md` | backend prompt-text building | 025, 036, 042 |
| `rules-retrieval.md` | System 1/2/3 enrichment & eval | 029, 030, 032, 045–047 |
| `providers-and-contract.md` | provider boundary & API contract | 010–012, 014, 016, 017, 020, 033, 049 |
| `conversation-ux.md` | response-wait panel + follow-up chat | 031, 038–041 |
| `scanning.md` | card-scan subsystem | 050–062 |
| `doc-process.md` | PRD doc system & process | 044, 048, **063** |

### Open taxonomy questions — resolved (2026-06-24)

- **`foundations` too small?** No — kept standalone and **renamed `framing.md`**. The
  three guardrails (001/002/013) are the most-cited, most-stable decisions; small + stable +
  frequently-loaded is exactly what should be its own file. Merging would bury the
  load-bearing product principle inside infra detail.
- **Should `follow-up-and-wait` fold into `providers-and-contract`?** No — kept standalone
  and **renamed `conversation-ux.md`**. It is a coherent user-facing subsystem (how the user
  converses with and waits on the assistant), not infra. Its only link to the contract
  (DEC-038 amending DEC-020) is a cross-file DEC reference, which stays resolvable.
- **Where does DEC-043 (`gameStateNotes`) live?** **`game-context-model`** — its primary
  artifact is a `GameContext` field, parity with DEC-037 (`combatStep`), which is filed there
  too. A one-line cross-ref to `prompt-assembly` covers the `ADDITIONAL GAME STATE` section.
  (This drops `prompt-assembly` to 025/036/042.)
- **Organizing axis?** Confirmed **topic/subsystem over flow stage.** This matched the
  context-cost trigger, kept cross-cutting subsystems (the data model, the contract) unified,
  and resolved the inconsistency that the two flow-named files had introduced.

## Lifecycle rule (folded into `instructions/doc-lifecycle.md`)

- New decisions land in their domain file **and** get a router index line.
- Fully-superseded decision **bodies** trim to a one-line tombstone (ID + "superseded by
  DEC-XXX") kept in-domain; the ID stays resolvable.
- Deep "how the code behaves" detail belongs in `system-map/` detail files (DEC-044 /
  DEC-048), not in decision `Impact:` blocks.

## Reference-update inventory (for map-out)

1. **Skills** (canonical in `.cursor/`, then `npm run skills:ai-sync`):
   `thejudge-refinement`, `thejudge-kickoff`/reference, `thejudge-quality-check`,
   `thejudge-cleanup` — path + read-order wording only.
2. **Durable instruction/README files** (single copies, edited directly):
   `instructions/writing-rules.md`, `technical-design-rules.md`, `requirement-format.md`,
   `doc-lifecycle.md`, `agent-working-rules.md`; `PRD/README.md`; root `README.md`;
   `apps/backend/src/providers/README.md`; `apps/backend/src/eval/fixtures/README.md`.
3. **Receipts** (`instructions/receipts/*`) — some pin literal line numbers
   (e.g. `decisions.md:593`); frozen historical artifacts, left as-is.

Because the router keeps the `decisions.md` path, groups 1–2 are small wording tweaks
("promote to the relevant `decisions/<domain>.md` and add the index line"), not path rewrites.

## Migration outline (for map-out / implement)

1. Create `sections/decisions/<domain>.md` files; move DEC bodies verbatim (preserve IDs,
   status, cross-refs).
2. Rewrite `sections/decisions.md` as the router (preamble + DEC-ID index table).
3. Update group-1 skills in `.cursor/` + run `npm run skills:ai-sync`.
4. Update group-2 durable instruction/README files.
5. Add the lifecycle rule to `instructions/doc-lifecycle.md`.
6. Move DEC-063 into `doc-process.md` and confirm the router index resolves all 62 + 063.
7. Cleanup receipt at ship.

## Non-goals

- Rewording or consolidating existing decision content (verbatim move only).
- Renumbering or merging existing DEC-IDs.
- Editing receipts' frozen line-number references.
- Any `apps/` code, prompt-assembly, API, or UI behavior change.
- A `system-map.md` entry: the catalog tracks product/code subsystems, not PRD doc tooling
  (consistent with DEC-044 / DEC-048).

## Decisions / requirements referenced

- New: **DEC-063** (`sections/decisions.md`).
- Lifecycle home: DEC-044, DEC-048 (system-map + detail-file precedent).
- No `REQ-###` / `FLOW-###` added or changed — documentation and process only.
