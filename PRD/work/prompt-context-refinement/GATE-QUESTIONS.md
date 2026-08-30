# Gate questions — prompt-context-refinement

Refinement turned your five observations into a gameplan. Four of them became
proposed product truth (below); observation #1's definition-injection idea is
RAG-shaped and was **filed for later** in `RAG-DEFERRED.md`, not dropped — its
refusal symptom is kept in scope as REQ-168.

Answer each block by filling its `Verdict:` line with **accept**, **edit**, or
**reject** (add a `Reason:` for edit/reject). Nothing gets built until you
answer and I resume the run. This is a docs-only proposal; the PR that carries
it merges last, after implementation.

Five decisions, in the order they matter:

---

## REQ-167

- **What this decides:** Whether Quick Question lets a player attach *several*
  cards instead of just one, while still carrying no game state.
- **In plain terms:** Quick Question is the fast path — ask a rules question
  without staging a whole game. Today you can attach one card, and if your
  question mentions any *other* card, the AI only reliably knows the one you
  attached, so naming a second card is a gamble. This lets you add every card
  you want to ask about (up to a small cap, suggested ~6), each looked up to its
  exact printed text and official WotC rulings the same way the single card is
  today, and the rules-retrieval scores over your question plus all the cards.
  Still no board — no zones, phases, life totals. The fast, no-setup feel stays;
  the "did it actually see the other card" gamble goes away. It reuses the one
  existing lookup path (a bounded loop over the cards), not a second code path.
- **On combos across your cards:** when you ask "how do these cards combo," a
  combo shows if it uses **at least one** of your attached cards (not only when
  it uses all of them — that would return nothing for most hands), and combos
  that use **more** of your cards are ranked first, ahead of general popularity.
  With one card attached this is exactly today's behavior. This is a real
  behavior choice; it amends the existing single-card combo rule (REQ-094), whose
  diff is shown below as part of this decision.
- **What happens if you say no:** Quick Question stays single-card, and asking
  about how two specific cards interact remains a gamble.

Complete diff — the new requirement (functional-requirements.md):

```diff
+### REQ-167
+- Title: Quick Question accepts several cards with no game state
+- Priority: high
+- Description: In Quick Question today the player attaches at most one card, and pointing the question at any other card is a gamble — the model only reliably knows the single attached card. This lets the player add every card they want to ask about (a bounded list), each resolved to its oracle identity exactly the way the single card is today, while Quick Question still carries no zones, phase, stack, life totals, or other game state. The backend enriches each attached card — full metadata including oracle text, plus its WotC rulings — and scores supplemental rule retrieval over the question plus all attached cards, so every card the player named is fully in context. The fast, no-setup experience stays; the "did it actually see the other card" gamble goes away.
+- Acceptance Criteria:
+  - The lookup request carries an optional **bounded list** of oracle-level cards in place of the single optional card; each entry keeps the current oracle-level shape (`cardId`, `name`, `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/`supertypes`/`subtypes` optional) and carries no zone, owner, caster, targets, or context-notes fields.
+  - The pre-submit view lets the player add, preview, and remove more than one card; an explicit cap is enforced and stated to the player (recommend a small cap such as 6, tuned at implementation) so the prompt stays bounded.
+  - Backend enrichment runs per attached card: each card's full metadata (same per-card formatting as populated-zone cards, DEC-042/REQ-030) and each card's WotC rulings (DEC-029) appear; System 3 supplemental retrieval (DEC-046/REQ-022) scores the question plus every attached card's oracle text and type line.
+  - Combo enrichment (Commander Spellbook) adapts to the card set: the attached cards become the match instances, amending REQ-094's single-card lookup rule. A candidate qualifies when it contains at least one attached card as an exact ingredient or authoritative template match, and candidates covering more of the attached cards rank ahead of those covering fewer (attached-card coverage), applied before popularity — so "how do these cards combo" surfaces the combos using the most of the attached cards first. With exactly one card attached this is identical to today's single-card lookup; with zero cards attached, behavior is unchanged (no combo data without explicit intent and at least one card). (DEC-116/REQ-094 [amended]/REQ-095)
+  - With no cards attached, behavior is identical to today's no-card lookup; with exactly one card attached, identical to today's single-card lookup.
+  - Golden fixtures cover multi-card, single-card, and no-card lookups; the multi-card fixtures pin per-card metadata + rulings and the multi-card System 3 query.
+- Constraints:
+  - No game state enters lookup mode — no `gameContext`, zones, phase, stack, life, or counters. This keeps the deliberate lookup non-goal, and is why this requirement does **not** resolve Q-003 (the separate question of lightweight game context on a card).
+  - One assembly path, not a fork: the card set is a bounded loop inside the single lookup assembly path, reusing the same per-card metadata/rulings/System-3 helpers, never a second implementation (preserves DEC-107's single-path shape).
+  - The frozen-context UI in the answered workspace shows all attached cards; follow-ups stay text-only with the card set frozen.
+- Dependencies:
+  - DEC-106 (the `mode`-discriminated union whose `card` field is the additive point)
+  - DEC-107 (single lookup assembly path — amended here from single-card to a bounded multi-card set)
+  - DEC-116, REQ-094 (amended here — the `mode: "lookup"` match instances generalize from the single attached card to the bounded card set; qualify-on-any-one plus attached-card-coverage ranking), REQ-095 (combo enrichment match instances)
+  - REQ-072, REQ-074 (lookup validation and assembly)
+  - FLOW-023
+- Notes:
+  - Supersedes the single-card constraint (DEC-107 "single card", DEC-106 optional single `card`). The `card` field becomes a bounded list; the exact wire spelling (`cards` array vs. keeping `card` as an array) is a code-shape choice made at implementation — both stay back-compatible through the `mode` union.
+  - Amends REQ-094's `mode: "lookup"` combo criterion: the required match instance was the single attached card; it becomes the bounded attached-card set — a candidate qualifies on containing any one attached card, and attached-card coverage ranks results ahead of popularity. REQ-094 carries the reciprocal "amended by REQ-167" note and lists REQ-167 as a dependency. The zero-card and single-card lookup cases, and all of game-mode retrieval, are unchanged.
+  - Screen-layout's "Quick Question — pre-submit" row records a **single-card** image cap (REQ-129/DEC-160/REQ-141). That row must be re-measured and updated for a multi-card add strip when this ships; it is deliberately not restamped as measured truth here.
+  - Does not resolve Q-003 (lightweight game context) or Q-004 (answer-seeded second-pass retrieval); both stay open.
```

Coupled amendment — the existing single-card combo rule this decision changes (functional-requirements.md, inside REQ-094). Answering this REQ-167 block covers this amendment; it has no separate verdict:

```diff
   - submitted cards whose names are explicitly mentioned in a game-mode question become required anchors for partial candidates; when no submitted card is named, submitted cards seed overlap matching and ranking
-  - for `mode: "lookup"`, combo retrieval runs only when combo intent is explicit and one card is attached; every candidate must contain the attached card as an exact ingredient or authoritative template match
+  - for `mode: "lookup"`, combo retrieval runs only when combo intent is explicit and at least one card is attached; the attached card(s) are the match instances, and every candidate must contain at least one attached card as an exact ingredient or authoritative template match. Candidates that cover more of the attached cards rank ahead of those covering fewer (attached-card coverage), applied before Commander Spellbook popularity. With exactly one attached card this is identical to the prior single-card rule (the one card is the sole required match instance and coverage is uniform, so ordering collapses to popularity/variant-id); with no card attached, no combo data is retrieved (amended by REQ-167, which generalizes the single attached card to a bounded multi-card set)
   - lookup mode with no attached card and lookup questions without combo intent retrieve no combo catalog data
   ...
   - DEC-013
+  - REQ-167 (amends the `mode: "lookup"` combo criterion — see Notes)
 - Notes:
   ...
+  - the `mode: "lookup"` criterion is amended by REQ-167: the single attached card generalizes to a bounded multi-card set. The attached cards become the match instances; a candidate qualifies by containing at least one of them (exact ingredient or authoritative template match); and attached-card coverage orders results ahead of popularity. The zero-card and single-card lookup cases behave exactly as before. Game-mode retrieval (every other criterion above) is unchanged
```

- Verdict: edit
- Reason: I wanna set a cap of 5 cards, and i was a little confused by what you mentioned about the combos, if a user asks how something combos, and it meets the criteria for an identified combo, then explain the combo. If it does not match the criteria for a combo, can we somehow callout what theyre missing or explain what parts do combo but what is possibly missing? Im not sure how complicated that would be, but if we check the boxes for a complete combo, then explain the combo, and if we only have part, explain whats missing and how the combo could work and what would potentially fill that empty row, since we'd be able to tell which part is missing right?

---

## REQ-168

- **What this decides:** Whether the off-domain guardrail is reworded so common
  Magic slang like "combo" is answered instead of refused.
- **In plain terms:** Quick Question carries one instruction line telling the AI
  to treat anything "not in the rules" as not found and ask you to rephrase —
  there's no separate detector, just that line. It over-fires: asking about a
  "combo" came back as "combos isn't a mechanic." This reworks the wording so
  everyday Magic language — combo, infinite combo, aggro, control, ramp, mill,
  blink, sacrifice outlet, and the like — is treated as real Magic and answered,
  and the refusal is reserved for input that genuinely isn't about Magic. It
  stays wording-only (no new classifier), and a maintained list of "phrases we
  must not refuse" becomes durable truth you can extend. This also fixes the
  *symptom* half of observation #1: a mechanic asked by name, with no card
  attached, must not be refused as "not an official mechanic."
- **What happens if you say no:** The guardrail keeps refusing valid community
  phrasing like "combo" as off-domain.

Complete diff (functional-requirements.md):

```diff
+### REQ-168
+- Title: The rules guardrail stops refusing real Magic phrases like "combo"
+- Priority: high
+- Description: Quick Question tells the model to treat off-domain input as "not found in the rules corpus" and ask the player to rephrase — the "confused rules lookup" persona. That guardrail is a single instruction line in the assembled prompt; there is no separate classifier. It currently over-fires: asking about a "combo" came back as "combos isn't a mechanic," even though combo is everyday Magic language. This tunes the instruction so common Magic-adjacent phrasing — combo, infinite combo, aggro, control, ramp, tempo, stax, wheel, mill, blink, sacrifice outlet, and similar community terms — is treated as in-domain and answered, and the "not found in the rules" refusal is reserved for input that is genuinely not about Magic. The guardrail stays prompt-instruction-only.
+- Acceptance Criteria:
+  - The lookup-mode instruction line is reworded so the model answers questions that use common non-official-but-valid Magic phrasing, and returns the "not found in the rules corpus" persona only for input that is genuinely off-domain (not about Magic at all).
+  - A documented, maintained set of common valid-but-unofficial phrasing categories (with examples) exists as durable truth so the owner can see and extend which phrases must not be refused; the prompt instruction reflects that guidance.
+  - A question about "a combo" — with or without cards attached — is answered as a Magic question, not refused as "not a mechanic."
+  - The off-domain golden fixture keeps refusing a genuinely non-Magic input, and a new fixture pins that a common Magic-adjacent phrase is answered rather than refused.
+- Constraints:
+  - Prompt-instruction-only: no classifier, validator, detection branch, or off-domain log signal is added — the guardrail stays a line in the assembled prompt (DEC-108).
+  - This widens what counts as in-domain; it does not remove the guardrail. Genuinely non-Magic input is still refused with the persona.
+- Dependencies:
+  - DEC-108 (the prompt-only off-domain guardrail and its persona)
+  - REQ-074 (lookup prompt assembly and guardrail instruction)
+  - REQ-072
+- Notes:
+  - This also resolves the **symptom** half of the mechanic-keyword observation: a mechanic asked by name with no card must not be refused as "not an official mechanic." The separate idea of guaranteeing every relevant mechanic's **definition** is enriched into the prompt is RAG-shaped and filed to `PRD/work/prompt-context-refinement/RAG-DEFERRED.md`, not built here.
+  - The same persona applies whether or not cards are attached (DEC-108); the reworded line lives on the shared lookup instruction, `apps/backend/src/prompt/promptAssembly.ts`.
```

- Verdict: edit
- Reason: This sounds great, i think this should be expanded on however to explain what these phrases represent.

---

## REQ-169

- **What this decides:** Whether to write one readable spec of the backend
  prompt's layout, with a table of which sections appear on which path.
- **In plain terms:** You wanted to see, at a glance, what the prompt is made of
  and what shows up where — without wading through raw JSON. This is a docs-only
  reference: every prompt section in assembly order, a one-line description each,
  and a present / absent / conditional matrix across the paths (In-Depth game
  mode, Quick Question with cards, Quick Question with no cards, follow-ups). It
  points at the existing `npm run prompt:preview` tool — which already writes a
  readable prompt-text file per fixture — for seeing a live example. Nothing
  about the actual prompt or runtime changes; it's a reference surface to drive
  future prompt-format tuning.
- **What happens if you say no:** No single readable prompt reference exists; you
  keep reading assembly code and raw preview output to understand the layout.

Complete diff (functional-requirements.md):

```diff
+### REQ-169
+- Title: A readable prompt-layout spec with a per-path presence matrix
+- Priority: medium
+- Description: The owner wants to read, at a glance, exactly what the backend prompt is made of and which parts appear on which path — without wading through raw JSON. Past ad-hoc prompt output was "an overwhelming amount of json." This creates one maintained, human-readable prompt-layout spec: every named prompt section in its fixed assembly order, a one-line plain description of each, and a presence matrix showing whether each section is present, absent, or conditional on each path — In-Depth game mode, Quick Question with cards, Quick Question with no cards, and follow-up turns. It points at the existing `npm run prompt:preview` tool, which already writes a readable `production.prompt.txt` per fixture, as the way to see a real assembled prompt: the spec explains the shape and the tool shows a live example.
+- Acceptance Criteria:
+  - A durable doc (recommend `PRD/sections/system-map/prompt-layout-spec.md`) lists every prompt section in its actual assembly order with a plain one-line description each.
+  - The doc carries a presence matrix: rows are the sections, columns are the paths (game mode; lookup with card(s); lookup with no card; follow-up), each cell marked present / absent / conditional with the condition named.
+  - The matrix matches the assembled prompt for each path, verified against the assembly code and the `prompt:preview` output — not authored from memory.
+  - The doc names `npm run prompt:preview` as the tool to inspect a real prompt and states what it emits (readable prompt text plus context / diagnostics / enrichment sidecars).
+  - The doc is cross-linked from `system-map/prompt-assembly.md` and the Quick Lookup and In-Depth feature specs, and is kept in sync when section order or per-path presence changes.
+- Constraints:
+  - Documentation/spec only — no change to the assembled prompt, the request contract, or runtime behavior.
+  - One source of truth: the matrix is derived from the assembly code, not a hand-authored second description that can silently drift.
+- Dependencies:
+  - DEC-025, DEC-042 (prompt section order and budget)
+  - DEC-107, REQ-074 (lookup-path section presence)
+  - `system-map/prompt-assembly.md`; `scripts/prompt-preview.mjs`
+- Notes:
+  - The owner's stated purpose is to drive future prompt-format optimization for better rules resolving; this spec is that reference surface.
```

- Verdict: accept
- Reason: I may expand on explanations after the initial draft, but i like starting with concise explanations to start.

---

## FLOW-023

- **What this decides:** The step-by-step player flow for asking about several
  cards in Quick Question with no game state — the flow companion to REQ-167.
- **In plain terms:** This is the player experience for REQ-167. Open Quick
  Question, add each card you want to discuss by typed search or camera scan
  (each previewed, removable, and capped), type your question, submit; the
  backend enriches every card and the answer workspace freezes all attached
  cards for text-only follow-ups. No board state. It supersedes today's
  single-card flow, keeping the no-card and one-card cases as unchanged special
  cases. It's the same decision as REQ-167 viewed as a flow — if you accept
  REQ-167, accept this; if you reject REQ-167, reject this too.
- **What happens if you say no:** The documented flow stays single-card, and
  REQ-167 ships without its matching player flow.

Complete diff (user-flows.md):

```diff
+### FLOW-023
+- Name: Ask a Quick Question about several cards with no game state
+- Trigger: In Quick Question the player wants to ask how two or more specific cards interact, without staging a game
+- Preconditions:
+  - app is loaded
+  - local card metadata and the committed core-topics browse data are available
+  - for scan input: the device has a usable camera with permission and the fingerprint library loads on first scan (FLOW-006)
+- Main Flow:
+  1. User opens Quick Question from the feature portal; the app switches to the lookup view (frontend-only, no reload).
+  2. The pre-submit view shows, top to bottom: the card-attach control — now able to hold more than one card — then the Question field, then the collapsed-by-default "General rules topics" disclosure.
+  3. User adds each card they want to discuss by typed autocomplete search (REQ-001/REQ-002) or by camera scan (FLOW-006); each resolves to one oracle-level card, previewed then added, and each can be removed. Adds are capped at the stated bound (REQ-167).
+  4. User types the question (or locks a topic pill, REQ-091) and submits; the request carries the list of attached cards and no game state.
+  5. Backend assembles one lookup-mode prompt: per-card full metadata and per-card WotC rulings for every attached card, System 3 supplemental retrieval scored over the question plus all attached cards, and combo enrichment over the card set when explicit combo intent is present; game-state-only sections stay omitted (REQ-167 / DEC-107).
+  6. The answer opens the shared chat-first workspace; the frozen context shows all attached cards; follow-ups are text-only with the card set frozen and send `{ mode: "lookup", question, cards: frozen, conversationHistory }`.
+- Edge Cases:
+  - no cards attached → identical to today's no-card lookup (FLOW-011)
+  - exactly one card attached → identical to today's single-card lookup (FLOW-011)
+  - user tries to add beyond the cap → the add is blocked with a stated limit, mirroring existing bounded-add patterns
+  - an off-domain question → the tuned "confused rules lookup" persona (REQ-168 / DEC-108) still applies whether or not cards are attached
+  - AI failure, follow-up failure, or history over the shared cap → same shared handling as FLOW-011 (FLOW-003 / FLOW-005 / REQ-027)
+- Notes:
+  - Supersedes FLOW-011's single-card constraint by allowing many cards; FLOW-011's no-card and single-card behaviors are unchanged special cases of this flow.
+  - Carries no zones, phase, stack, or life — Quick Question explicitly drops game context, so this flow does **not** resolve Q-003 (lightweight game context on a card).
```

- Verdict: accept
- Reason: sounds great

---

## NFR-018

- **What this decides:** Whether to build a validation set of real hard rules
  questions with published worked solutions, run through the existing eval
  harness, to check and tune the prompt.
- **In plain terms:** Today prompt quality is regression-tested only against
  hand-authored fixtures. This adds a track fed by real-world hard rulings that
  carry published worked solutions (public rules Q&A, judge resources), curated
  into committed test data and run through the eval harness you already have —
  so you can see where the prompt fails hard cases and tune it. It's test data,
  never fed into live prompts (that would be RAG, which is deferred). It's
  non-blocking unless you later promote it, and any source's licensing is
  resolved before data is committed.
- **What happens if you say no:** Prompt quality keeps being validated only
  against hand-authored fixtures, not against how hard real cases actually
  resolve.

Complete diff (non-functional-requirements.md):

```diff
+### NFR-018
+- Title: Prompt quality is validated against real worked rules solutions
+- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by real-world hard rules questions that carry published worked solutions — the kind found in public rules-Q&A and judge resources — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The worked solutions are curated into a committed evaluation set and run through the existing eval harness; they are test data, never runtime retrieval.
+- Constraints:
+  - The worked-solutions set is committed evaluation data (fixtures) fed through the existing eval harness (REQ-032 / DEC-047); it never becomes runtime prompt context and adds no new runtime dependency or external call.
+  - Specific sources and their licensing/attribution are resolved at implementation before any data is committed; only data licensed for this use is committed.
+  - This is a quality/validation track that reports where the prompt fails hard cases and guides tuning; it is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B).
+- Dependencies:
+  - REQ-032, DEC-047 (eval harness and labeled-outcome evaluation)
+  - REQ-022, DEC-046 (retrieval the validation set exercises)
+- Notes:
+  - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; it is not injected into prompts. The mechanic-definition enrichment idea, which would inject a corpus into the prompt, is RAG-deferred (`PRD/work/prompt-context-refinement/RAG-DEFERRED.md`).
```

- Verdict: accept
- Reason: Please make sure to document where these use cases are retrieved from so that they can be validated.

---

## Blocker questions

None. Refinement recorded six material assumptions in `DESIGN-BRIEF.md`, none of
which met the genuine-blocker test, so nothing here is waiting on a decision
outside these five verdicts.
