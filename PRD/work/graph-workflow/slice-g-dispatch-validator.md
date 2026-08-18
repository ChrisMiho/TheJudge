# Slice G — Dispatch validator and the instruction ledger

## Status: done

Scope item 4. Depends on: **A**. Converts boundary 1 — no pre-authorization of
product decisions, which failed 2 of 3 reps as prose.

## Goal

A run that pre-authorizes a class of future product decisions stops at the
`define` node, before any product fork is decided.

## Requirements

1. `GRAPH-RUN.md` gains two required sections:
   - every node's dispatch prompt, recorded verbatim
   - `## Instruction ledger` — one row per user instruction, quoted, classified
     `answered-once` or `refused`, with the node it arose at and, for a refusal,
     the rule that refused it

   ```markdown
   ## Instruction ledger

   | Instruction | Class | Node | Rule |
   | --- | --- | --- | --- |
   | "if it asks again, pick the smaller option" | refused | define | No pre-authorization of product decisions |
   | "prefer the existing table over a new one" | answered-once | define | — |
   ```
2. There is deliberately **no `standing-rule` class**, so pre-authorizing a class
   of future product decisions has no representable form in the ledger.
3. `## Instruction ledger` **replaces** the existing `## Refused instructions`
   section rather than coexisting with it — one parse target, so a refusal cannot
   be recorded in one section and missed by the other.
4. `scripts/graph-ledger-check.mjs` fails a run when a dispatch prompt contains
   conditional-future authorization language, or when a user instruction is
   quoted into a dispatch prompt without a matching `## Instruction ledger` row.
   Parsing core is a tested pure function, following `scripts/graph-preflight.mjs`.
5. **It runs before dispatch, not after.** A violating run stops at the `define`
   node. A post-hoc audit could only report seven product forks already decided.
6. Same slice updates every place the old section name lives:
   `graph-workflow-contract.md` (ledger template `:123`, section description
   `:132`, refusal-recording rule `:193`),
   `.claude/skills/graph-run/SKILL.md:121`,
   `.claude/skills/graph-run/reference.md:133`, and
   `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md` —
   noting in that fixture that runs measured before this change recorded refusals
   under the old section name.
7. **Stated limit, do not close it here.** The validator reads dispatch prompts
   and ledger rows that `graph-run` itself wrote. A driver that pre-authorizes
   and then paraphrases its own dispatch prompt passes clean. This is a schema
   check over a self-report — the one check in this package that does not read
   ground truth. Transcript-side closure is out of scope.
8. Run `npm run skills:ai-sync`; commit the regenerated mirror.

## Acceptance criteria

- [x] `node --test scripts/graph-ledger-check.test.mjs` passes; the parsing core
      is a pure function with unit coverage
- [x] The validator **fails** a fixture dispatch prompt containing
      conditional-future authorization language (e.g. "if it asks again, …")
- [x] The validator **fails** a fixture where a user instruction is quoted into a
      dispatch prompt with no matching `## Instruction ledger` row
- [x] The validator **passes** a clean fixture where every quoted instruction has
      a row classified `answered-once` or `refused`
- [x] A `standing-rule` class is unrepresentable — the validator rejects a ledger
      row using any class other than `answered-once` or `refused`
- [x] `git grep -n 'Refused instructions'` returns **no** hits outside
      `PRD/instructions/receipts/` and this package's historical files
- [x] All five call sites in requirement 6 are updated; the fixture file carries
      the note about pre-change measurements
- [x] `diff -rq .claude/skills .agents/skills` produces no output
- [x] `npm run quality:check` green

## Verification

```bash
node --test scripts/graph-ledger-check.test.mjs
npm run test:scripts
git grep -n 'Refused instructions' -- ':!PRD/instructions/receipts' ':!PRD/work'
git grep -n 'Instruction ledger'
npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

## Files touched

- `scripts/graph-ledger-check.mjs` (new)
- `scripts/graph-ledger-check.test.mjs` (new)
- `PRD/instructions/graph-workflow-contract.md` (:123, :132, :193)
- `.claude/skills/graph-run/SKILL.md` (:121), `…/reference.md` (:133) (+ mirror)
- `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md`

## Result

`scripts/graph-ledger-check.mjs` is the boundary as a check. Its parsing core is
pure — `parseSections`, `parseInstructionLedger`, `parseDispatchPrompts`,
`quotedInstructions`, `normalizeInstruction`, and `checkLedger` — following
`scripts/graph-preflight.mjs`. `scripts/graph-ledger-check.test.mjs` covers it
with 15 tests, all passing; `npm run test:scripts` picks them up with no
`package.json` edit.

### Six violation codes

| Code | Fires when |
| --- | --- |
| `preauthorization` | a dispatch prompt carries conditional-future authorization language |
| `unledgered-quote` | a dispatch prompt quotes an instruction with no matching ledger row |
| `bad-class` | a row's class is anything but `answered-once` or `refused` |
| `refusal-without-rule` | a `refused` row names no refusing rule |
| `missing-ledger` | `## Instruction ledger` is absent |
| `legacy-section` | `## Refused instructions` is still present |

Six `PREAUTHORIZATION_PATTERNS`, each with a stable id, and a test asserting
**every one is reachable** from a phrase drawn from how the failure actually
reads — a pattern nothing can trigger is decoration.

Quote matching survives smart quotes, line wrapping, and trailing punctuation, so
a run cannot evade the ledger requirement by reformatting. Short quoted spans
(under 12 characters) are ignored: node names and flags appear in quotes
constantly and are not instructions.

### No `standing-rule` class

`INSTRUCTION_CLASSES` is exactly `["answered-once", "refused"]`, asserted by the
test that exercises `bad-class`. Pre-authorizing a class of future product
decisions has no representable form — a run that did it cannot write down what
it did.

### The stated limit, written where it will be read

Both inputs are `graph-run`'s own output. A driver that pre-authorizes and then
paraphrases its own dispatch prompt passes clean. The script's header comment
ends with "Do not describe this script as proving a run did not
pre-authorize"; `graph-workflow-contract.md` and `graph-run`'s SKILL carry the
same sentence in their own words. Transcript-side closure stays out of scope.

### Call sites

All five updated in this slice:

- `graph-workflow-contract.md` — the ledger template now shows
  `## Dispatch prompts` and `## Instruction ledger` in place of
  `## Refused instructions`; the section description is rewritten around the
  two-class ledger, the before-dispatch rule, and the stated limit; the
  refusal-recording rule under the pre-authorization boundary points at a
  `refused` row
- `.claude/skills/graph-run/SKILL.md` — refusals become `refused` rows,
  acted-on instructions become `answered-once` rows, and the skill is told to
  run the validator green **before every node dispatch**
- `.claude/skills/graph-run/reference.md` — the red-flag row's remedy
- `PRD/instructions/skill-fixtures/graph-run/dirty-checkout-and-gate.md` — a
  `**Section name note.**` recording that pre-change measurements used the old
  section name, plus the item-5 finish criterion now naming the `refused` row
  and the mechanical pre-dispatch failure
- the regenerated `.agents/skills/` mirror

`git grep -n 'Refused instructions'` outside receipts and `PRD/work/` returns
three hits, all of them *descriptions of the replacement* — the contract
sentence stating the replacement, the fixture's section-name note, and DEC-164's
Impact bullet. No live use of the old section name remains.

`diff -rq .claude/skills .agents/skills` produces no output.
`npm run quality:check` exits 0.
