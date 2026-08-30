# Prompt Refinement — enhancement intake

Fill this out with the specific refinement enhancements you've observed — the
ones outside RAG's realm (see `promptRefinement-analysis.md` for what RAG does
and doesn't touch). This file becomes the intake a `graph-run` reads, so the
more concrete each item is, the better refinement can shape it.

## How to use this

- One `### Enhancement` block per observation. Copy the block as many times as
  you need.
- Lead each item with **what a player experiences** — the observable problem —
  before the technical change. Refinement shapes better from a player symptom
  than from a code instruction.
- Ground it: name the prompt section or `file:line` from the analysis if you
  know it. If you don't, leave it blank — refinement will locate it.
- Don't pre-decide the fix in stone. This is evidence, not the design. Every real
  product choice still gets confirmed by you at the gate (see "How this runs"
  below). A rough "I think X" is fine and useful; a locked "must be X" isn't
  needed.
- Rank leverage with your gut (High / Med / Low). That's an input to slicing
  order, not a binding call.

## Scope reminder — keep these outside RAG

In scope for this file (refinement levers):
- The prompt's structure — e.g. splitting into system + user roles vs. one string
- Static text — system role, instructions, MTG reference, phase guidance, scope
- How the board object renders to text — fields, labels, stack/zone formatting
- Section order and delimiters in the assembled prompt
- System 2's phase/zone selector rules
- Conversation-history policy

Out of scope here (that's the RAG track):
- How supplemental rules (System 3) get scored/ranked
- Whether/how rulings (System 1) get semantically retrieved

---

### Enhancement: <short name>

- **What a player experiences today:** <the observable symptom, in game terms —
  what does the answer get wrong, miss, or handle awkwardly?>
- **Where it lives:** <prompt section and/or `file:line`, or "unsure — locate">
- **The change you want:** <what should be different — rough is fine>
- **Why it's outside RAG:** <one line — which lever this is>
- **How you'd know it worked:** <observable signal — a better answer on a
  specific question, an eval fixture, a snapshot diff>
- **Leverage:** <High | Med | Low>
- **Open question for the gate:** <anything you're genuinely unsure about and
  want to decide together — leave blank if none>

---

### Enhancement: <short name>

- **What a player experiences today:**
- **Where it lives:**
- **The change you want:**
- **Why it's outside RAG:**
- **How you'd know it worked:**
- **Leverage:**
- **Open question for the gate:**

---

## Worked example (delete or keep)

### Enhancement: Split the prompt into system + user roles

- **What a player experiences today:** The model sometimes treats the rules
  reference and the board state as if they carried the same authority as the
  player's question, and instructions can get "diluted" in a long single block —
  answers occasionally drift from the asked question toward reciting context.
- **Where it lives:** `providers/openAiResponsesProvider.ts:40` — the whole
  prompt is passed as one `input` string; assembly is `prompt/promptAssembly.ts`.
- **The change you want:** Send the system role + instructions + static reference
  as the system message, and the board state + question as the user message,
  instead of one flat string.
- **Why it's outside RAG:** Structural framing of the prompt — RAG only rescoring
  System 3, this touches how the whole thing is delivered to the model.
- **How you'd know it worked:** `.prompt.golden.txt` snapshots show the new
  structure; a set of fixture questions where the old answer drifted now stays on
  the asked question.
- **Leverage:** High
- **Open question for the gate:** Does the OpenAI Responses API call want a
  `system`/`developer` role split here, and does that change the token-budget
  math in `promptDiagnostics.ts`?

---

## How this runs once it's filled (read before you commit to a plan)

A `graph-run` on this intake is *mostly* hands-off, with one deliberate human
touch:

1. **Run one (background):** shapes your items into a design brief and proposes
   product-truth changes, then **parks and opens a docs-only PR** with a
   `GATE-QUESTIONS.md` for you to answer. This is the one place the workflow
   stops for you — no script can decide whether the product behavior it wrote is
   the behavior you want. You answer accept/edit/reject per item on your own
   schedule.
2. **Run two (background):** applies your answers, slices the work, implements
   every slice unattended, and opens the implementation PR.

So "work through it all in the background" is true for the mechanics — branching,
slicing, coding, PRs all run unattended — **except** the one gate where you
confirm the design. That gate is by design, not a limitation to route around.

**One package or several?** If your items all live on the prompt-assembly surface
(most refinement items do), they cohere into **one** `prompt-refinement` package,
carried as separate slices that implement sequentially in the background — which
is exactly the "chew through the spread" shape you want. If some item is really a
different feature, it becomes its own package. We'll decide that together once the
list exists.
