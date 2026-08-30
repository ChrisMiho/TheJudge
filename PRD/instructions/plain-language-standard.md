# plain-language-standard.md

## Purpose

Every artifact an agent hands the owner — a gate question, a PR body, a receipt,
a status-board row, an in-session summary — must be answerable without decoding
an ID the owner cannot see or evaluating a term they cannot act on.

This is the fix for the founding pain of the docs-refactor: *"some of the
questions are difficult to answer, either due to the shorthand being used to
describe past DECs or myself being unfamiliar with the technology."* An artifact
that forces the owner to look something up before they can answer has failed,
however correct it is.

## Where it binds

**Owner-facing artifacts.** The four rules govern the part of an artifact the
owner reads to decide or to understand what happened. Technical detail is allowed
**below** the plain-language block — an implementer still needs the diff, the
paths, and the IDs. The rule is about what comes first and whether the top of the
artifact stands on its own, not about banning detail.

Forward-only: this binds every artifact written from now on. Past receipts are
historical records and are left as they are.

## The four rules

1. **Open with the ask.** The first line states what the owner must do —
   *Decide*, *Review*, *Merge*, or *Nothing (FYI)*. The owner learns whether
   they are on the hook before they read anything else.
2. **Inline, don't cite.** Any `DEC` / `REQ` / `FLOW` / decision the artifact
   leans on carries its substance in the sentence; the ID stays only as a
   pointer in parentheses. This is the direct fix for the shorthand pain — the
   owner never has to open a file to know what an ID meant.
3. **Product terms first.** Lead with what the owner or a player experiences.
   Any unavoidable technical term is defined on first use, in the same breath —
   not left for the owner to already know.
4. **Repeatable out loud.** From `CLAUDE.md`: if the block cannot be read aloud
   to someone else and land, it has failed, even when every sentence in it is
   short. Write it to be said, not re-parsed.

## Per-artifact opening block

Each owner-facing artifact opens with a fixed header so the owner always knows
where the ask, the plain-language summary, and the consequence live.

| Artifact | Opening block |
| --- | --- |
| Gate question | *What this decides · In plain terms · What happens if you say no* |
| PR body / merge ask | *What this is · What you need to do · What it changes* |
| Receipt / status board | *What happened · What it means for you* |
| In-session summary | Governed by `CLAUDE.md`'s communication style; this standard makes it explicit and binds subagent output too |

The header labels are the contract; the detail beneath each label follows the
four rules. Where a generator already specifies a body format, the plain-language
block sits **above** it and the existing detail stays below unchanged.

## Worked example — a real gate question

The before/after below is a `## <STABLE-ID>` block from a `define` gate, the
highest-value place the standard applies. The requirement is real: `REQ-134`
amends the Quick Lookup character counter so it measures the raw text the owner
types, not the longer string actually sent to the model.

### Before — fails all four rules

```markdown
## REQ-134

- REQ-091 as amended: the visible counter, the textarea `maxLength`, and the
  submit gate measure the raw editable textarea content, not the composed wire
  `question` string. (REQ-091, REQ-011)

- Verdict:
- Reason:
```

The owner cannot answer this without opening `REQ-091` to learn what the counter
did before, and without already knowing that "composed wire `question` string"
means the text that gets sent to the model. It never says what the owner is being
asked to do, and it leads with mechanism, not with what a player sees.

### After — obeys the standard

```markdown
## REQ-134 — the typing counter counts what you type, not what gets sent

**What this decides:** whether the `0/300` counter under the Quick Lookup
question box measures the words the player typed, or the longer message the app
actually sends the AI.

**In plain terms:** when a player attaches a card or a rules topic, the app
quietly adds text to their question before sending it (the "composed" message —
what goes over the wire). Today the counter measures that longer hidden message,
so a player who has typed nothing can already see the counter above zero, and a
full 300-typed-character question can be blocked as too long. This change makes
the counter, the length cap, and the send button all measure only the text in
the box — so an empty box with a card attached reads `0/300`, and 300 typed
characters always sends. (amends REQ-091; character-cap rule REQ-011)

**What happens if you say no:** the counter keeps measuring the hidden composed
message, and the confusing `12/300`-with-an-empty-box behavior stays.

- Verdict:
- Reason:
```

The `after` opens with the decision, inlines what `REQ-091` and `REQ-011` say so
the IDs are pointers not homework, defines "composed" / "over the wire" in the
same breath it uses them, and leads with what the player sees. It can be read
aloud and answered cold.

## Related material

- `PRD/instructions/writing-rules.md` — how product documents are written; this
  standard governs the owner-facing opening of the artifacts agents generate.
- `CLAUDE.md` — communication style, the source of rule 4 and the in-session
  summary binding.
- `PRD/instructions/graph-workflow-contract.md` — the `GATE-QUESTIONS.md` format
  that applies this standard at the `define` gate.
