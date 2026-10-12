# Gate questions — follow-ups keep their rules, and the eval learns to push back

**Decide:** eleven slots below. Two new requirements, nine small amendments. No blocker.

How the slots hang together:

- **REQ-246** is the product change: a follow-up keeps the rules its opening question
  found. The amendments to REQ-178, REQ-022, REQ-074, REQ-027, REQ-024, REQ-238 and
  REQ-242 are its pointers in each place that today says "the question". Rejecting
  REQ-246 means rejecting all seven.
- To keep only the excerpt search carried (System 3) and leave curated topics and step
  guidance on the follow-up's words, reject REQ-024, REQ-238 and REQ-242, and edit REQ-246
  and REQ-022 to drop their topic and step lines. Not recommended: today 6 of 9 In-Depth
  follow-ups lose curated topics.
- **REQ-247** is the eval's pushback mode. REQ-226 and REQ-228 are its two pointers.

Derived docs that restate these rules (`system-map/` pages, the In-Depth and Quick Lookup
feature specs, `user-flows.md`, `integrations-and-data.md`) follow the approved slots at
build. They are the 13 rows marked `build` in `evidence/amendment-grep.md`.

Every diff is against `PRD/sections/functional-requirements.md` at `0461969f`. Line
numbers are where the hunk starts today.

## REQ-246 — a follow-up keeps the rules its opening question found

**What this decides:** whether a follow-up such as "that's wrong, check again" is
answered with the same rules Luna had for the opening question, instead of rules searched
from the follow-up's own words.

**In plain terms:** today, when a player pushes back, rule search runs on the follow-up's
words. Those words name no rules, so most of what Luna quoted the first time is gone, and
in the intake's paid probe she told the player a rule she had just quoted "wasn't
provided" in 29 of 186 follow-ups. Measured offline today, a pushback follow-up keeps 357
of the opening question's 836 search excerpts on the word-matching half alone, and 6 of 9
In-Depth follow-ups lose curated topics. With this change the backend re-runs rule
selection on the opening question (the first entry of the conversation history the app
already sends), so the follow-up's three rules sections — step guidance, curated topics
("System 2") and the up-to-15 searched excerpts ("System 3") — match the opening
question's exactly. The follow-up's words still go to Luna as the question. Nothing the
app sends changes, and nothing is stored on the server. A follow-up that raises a new
topic gets no new rules; that is a known limit, parked.

**What happens if you say no:** follow-ups keep searching on their own words. Luna keeps
re-checking pushback with mostly different rules, and the "wasn't provided" answers stay.

```diff
@@ functional-requirements.md — new entry appended after REQ-245 (end of file) @@
+
+### REQ-246
+- Title: A follow-up keeps the rules its conversation's opening question found
+- Priority: high
+- Description: When a player sends a follow-up — any request carrying `conversationHistory` — every rules choice that reads the player's question reads the conversation's opening question instead: the first turn of `conversationHistory`, exactly as it was first sent, including any fallback. The cards and game context are already frozen for the conversation, so the follow-up's rules are the opening question's rules: the same System 3 supplemental excerpts in the same order, the same curated topics, and the same step guidance. The follow-up text is still the prompt's `QUESTION`, and `CONVERSATION HISTORY` is unchanged. The backend stays stateless: it re-runs rule selection on the opening question rather than storing turn 1's rules or receiving them in the request.
+- Acceptance Criteria:
+  - one function decides the question that rule selection reads — `conversationHistory[0].content` when history is present, otherwise `question` — and every reader below calls it; there is no second copy
+  - System 3: the main search query — its word half (tokens, rule-number and question rule ids, obsolete-term definitions, REQ-233) and its embedded text — is built from that question through the one shared query builder (REQ-178), in both modes; `buildRetrievalQueryText` and `buildPerCardSearchTexts` return the opening request's values for a follow-up, so the route embeds the opening question's query (REQ-181)
+  - In-Depth: the question-word triggers of the curated-topic table read that question (REQ-242)
+  - Quick Lookup: the turn steps named for `PHASE GUIDANCE` read that question (REQ-238)
+  - for a follow-up built from an opening request — same cards or game context, its question as `conversationHistory[0]` — the prompt's `PHASE GUIDANCE`, `GAME RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS` sections are byte-identical to the opening request's, in both modes; unit tests prove it, including an opening question that names a turn step and one whose words trigger an In-Depth topic that the follow-up's words do not
+  - over the 62 cases of the committed diagnostic manifest, each built as a two-turn request with a fixed pushback follow-up and ranked with the committed frozen vectors (REQ-222), the follow-up's System 3 selection equals its opening question's, in order, in 62 of 62; its curated topics equal the opening's in 9 of 9 In-Depth cases; its `PHASE GUIDANCE` equals the opening's in 53 of 53 lookup cases
+  - a request without `conversationHistory` produces a prompt byte-identical to today's: every existing prompt test and fixture and the offline prompt gate (REQ-222) pass unchanged
+  - with `ASK_AI_PROVIDER=mock`, a follow-up's answer prints the assembled prompt carrying the opening question's rules (REQ-027)
+  - with the local model cache warm, embedding the same text twice in one process returns the same vector; the build records the check
+- Constraints:
+  - no `AskAiRequest`, Zod schema, response, route, endpoint or frontend change; no server-side session store or cache (REQ-027)
+  - the follow-up text never feeds rule selection, and follow-up results are never merged with the opening question's; a follow-up that raises a new topic gets no new rules
+  - card rulings, per-card search and keyword sets (REQ-235), card-wording topics (REQ-220, REQ-234) and In-Depth's current-step guidance are unchanged; they already come from the frozen cards and game context
+  - the combo section (REQ-094) is unchanged and still reads the follow-up text
+  - no change to scoring, the excerpt cap (REQ-190), the corpus, the embeddings or the answer budget (REQ-231)
+- Dependencies:
+  - REQ-027 (the follow-up contract; its first history turn is the opening question as sent)
+  - REQ-178 (System 3 query construction)
+  - REQ-238 (Quick Lookup step guidance)
+  - REQ-242 (In-Depth question-word topic triggers)
+  - REQ-074 (Quick Lookup prompt assembly)
+  - REQ-022 (rules enrichment)
+  - REQ-247 (the eval mode that measures it)
+- Notes:
+  - measured offline at refinement, 2026-10-12 at `0461969f`, on the 62 diagnostic cases (the `follow-ups-keep-their-rules` package's offline measurement): the follow-up's search text differed from the opening's in 62 of 62; on the word-matching half alone a pushback follow-up kept 357 of the opening question's 836 search excerpts, all of them in 1 case; 6 of 9 In-Depth cases changed curated topics, losing 8; re-running the opening question with the history attached selected turn 1's rules in 62 of 62
+  - measured at intake on pre-#293 code (cited; paid; `gpt-6-luna`; 186 two-turn conversations per arm): reusing turn 1's excerpts took follow-ups that called a quoted rule "not provided" from 29 to 0, kept turn-2 grounding at turn 1's level (0.69 against 0.64, where today's fell from 0.66 to 0.26), and fixed the most wrong rulings, with outcome flips level within small counts; searching on "first question plus follow-up" instead doubled side-detail flips. The post-merge pushback run (REQ-247) re-measures this on today's code
+  - known limit, parked: in the owner's live three-turn Necropotence conversation (2026-10-12), the third turn's own words ("what about end step cleanup?") found 514.1, 514.2 and 514.3a; under this requirement that turn keeps the opening question's rules instead
```

- Verdict:
- Reason:

## REQ-247 — the eval can push back on Luna's first answer and score what happens

**What this decides:** whether the answer-quality eval gets an on-demand two-turn mode
that asks a case, pushes back with "I don't think that's right. Can you check it
again?", and grades both answers.

**In plain terms:** today the eval only ever asks one question per case, so nobody can
measure whether Luna holds a right ruling under pushback or fixes a wrong one. This mode
adds a second turn built exactly the way the app builds a follow-up, grades each answer
alone against the case's approved answer, and reports how many right answers held,
flipped on the outcome, flipped on a side detail, and how many wrong ones got fixed. It
also reports turn-2 grounding (whether Luna's reasoning uses the attached rules), turn-2
speed against the 30-second answer budget, and how many answers disown a rule turn 1
quoted. It runs only as a named experiment (REQ-226: its own run folder, a manifest of
case ids, a spending cap, never the committed scorecard), only when you launch it with
the confirmation flag, and it never decides anything.

**What happens if you say no:** pushback stays unmeasurable from committed tooling; the
post-merge check of REQ-246 has no instrument, and the probe scripts stay untracked.

```diff
@@ functional-requirements.md — new entry appended after REQ-246 @@
+
+### REQ-247
+- Title: An answer-quality experiment can push back on the first answer and score the follow-up
+- Priority: medium
+- Description: An experiment run (REQ-226) can ask each case as a two-turn conversation: turn 1 is the production request as today, and turn 2 is a production follow-up carrying a fixed pushback text, built the way the app builds a follow-up. Each answer is judged alone against the case's reference answer, and the run reports how often a right first answer held or flipped and how often a wrong one was fixed, with turn-2 grounding, turn-2 latency and the count of turn-2 answers that disown a rule turn 1 cited. It reports and never decides.
+- Acceptance Criteria:
+  - `--follow-up pushback` selects follow-up mode; it is accepted only in experiment mode (`--run-id` with `--manifest`) and refused, naming the reason, in a routine run, with `--regrade-from`, with a local practice-suite run (`--suite practice`), and with any arm but `A` (REQ-230)
+  - the pushback text lives in one committed place under a revision id — `pushback.1`: "I don't think that's right. Can you check it again?" — and the identity record (REQ-226) records that revision id; a later wording is a new revision, never an edit of `pushback.1`
+  - turn 2's request is turn 1's request with `question` set to the pushback text and `conversationHistory` set to `[{ role: "user", content: <turn 1's question exactly as sent> }, { role: "assistant", content: <turn 1's answer> }]`, the shape the app sends (REQ-027); the route's request schema (`askAiRequestSchema`) parses it before preparation, and a request the schema rejects is recorded as an `error` record naming the reason and is never sent
+  - turn 2 is embedded from `buildRetrievalQueryText` and `buildPerCardSearchTexts` of the turn-2 request, prepared by the checkout's unmodified `preparePromptInput`, and answered by the same model with the same request options (model and input only, REQ-188); REQ-188's refusals on a missing vector or a silent lexical pass apply to both turns
+  - each turn's answer is judged alone by the lone judge (REQ-186) against the case's reference answer, with that turn's own attached excerpts; the judge is not told which turn it grades or that a pushback happened; records carry the turn (REQ-226) and each turn writes its own transcript
+  - the spending check (REQ-227) covers a whole conversation — two answers and two grades — so a run never pays for a turn 1 it cannot follow up; a resume never repeats a completed turn, and a conversation whose turn 1 completed resumes at turn 2 from the stored turn-1 answer
+  - per answer model and excerpt cap, `summary.json` and the printed report give, each with its denominator: held (turn 1 Correctness 2, turn 2 Correctness 2); flipped on outcome (2 then 0); flipped on a side detail (2 then 1); fixed (0 or 1, then 2); still wrong (0 or 1, then 0 or 1); missing (an error or undetermined on either turn); mean Grounding on turn 1 and on turn 2; turn-2 latency mean, p50, p95 and maximum, and the count over the 30,000 ms answer budget (REQ-231); the turn-2 System 3 rule ids shared with turn 1, over turn 1's count; and the count of turn-2 answers that disown a rule turn 1 cited, each with its transcript path
+  - an answer disowns a rule when one of its sentences names a rule number the turn-1 answer cited and, by one fixed committed phrase list (for example "not provided", "wasn't provided", "not included", "not among the excerpts"), says that rule was not given; tests pin positive and negative sentences
+  - with `--repeat`, each repeat is its own conversation; the transition counts count every conversation, and the report also lists the cases whose repeats land in different transitions
+  - the run writes only to its own run folder and never reads or writes the committed scores file (REQ-226, REQ-189); `summary.json` holds numbers and ids only
+  - unit tests with an injected fake client prove: the turn-2 request shape and its schema parse; every refusal; that turn 2 is embedded from the turn-2 request's own query text; each transition; the disowning check; the whole-conversation spending check; resume at turn 2; and that no test makes a network call
+- Constraints:
+  - REQ-188's confirmation gate, credential loading, sequential calls, mock-first default and never-in-a-gate rules apply unchanged, and a live run requires REQ-227's spending cap
+  - evaluation tooling only: no change to `preparePromptInput`, routes, providers or any runtime code; the follow-up retrieval change is REQ-246's own
+  - no practice-suite data enters any committed file
+- Dependencies:
+  - REQ-226 (experiment mode, the record key and the identity record)
+  - REQ-227 (checkpoint, resume and the spending cap)
+  - REQ-186 (the lone judge)
+  - REQ-187 (Correctness and Grounding)
+  - REQ-228 (the paired report, which selects one turn)
+  - REQ-027 (the follow-up request shape)
+  - REQ-246 (the follow-up retrieval it measures)
+- Notes:
+  - motivated by the intake probe (2026-10-10, pre-#293, cited, committed corpus cases only): the same pushback text on the 62 diagnostic cases with 3 repeats; right first answers held 176 of 181 and flipped on the outcome once, and 2 or 3 of 4 side flips were judge errors on unchanged answers — the reason the report keeps outcome flips and side flips apart
+  - measured 2026-10-12 at `0461969f`: the 62 diagnostic cases are all approved with matching hashes, 9 In-Depth and 53 lookup; a turn-1 answer longer than the 10,000-character history-message cap the code enforces would make a request the app itself could not send, which is why a schema rejection is recorded as an error rather than sent
+  - the lone judge never sees attached cards' oracle text (noted by the cap-15 answer check, #295); that holds for both turns and is not changed here
```

- Verdict:
- Reason:

## REQ-178 — the excerpt search query uses the opening question on a follow-up

**What this decides:** whether the requirement that defines the System 3 search query
(the player's question plus a short signal per card: name, type line, keywords, concept
terms, and in In-Depth the current turn step) says which question a follow-up uses.

**In plain terms:** this requirement says the search is built from "the player's
question". On a follow-up that is today the follow-up's words. The amendment says it is
the conversation's opening question, which is what REQ-246 does.

**What happens if you say no:** REQ-178 stays silent on follow-ups and reads as if the
follow-up's words still drive the search, contradicting REQ-246 if that is accepted.

```diff
@@ functional-requirements.md REQ-178, line 4198 @@
-- Description: The System 3 supplemental-rules search query is built from the player's question plus a compact per-card signal — each submitted or attached card's name, type line, and keyword list — plus fixed rule-book terms: the concept terms the committed concept map draws from each card's wording (REQ-234) and, in In-Depth, the name of the game's current turn step; never every card's full oracle text, context notes, or zone ids. The assembled prompt is unchanged by this requirement; only the internal retrieval query changes.
+- Description: The System 3 supplemental-rules search query is built from the player's question plus a compact per-card signal — each submitted or attached card's name, type line, and keyword list — plus fixed rule-book terms: the concept terms the committed concept map draws from each card's wording (REQ-234) and, in In-Depth, the name of the game's current turn step; never every card's full oracle text, context notes, or zone ids. On a follow-up, the player's question is the conversation's opening question, not the follow-up text (REQ-246). The assembled prompt is unchanged by this requirement; only the internal retrieval query changes.
@@ functional-requirements.md REQ-178, line 4200 @@
-  - the retrieval query carries the player's question and, per card, that card's name, type line, and keyword list, plus the card's concept terms (REQ-234) and, in In-Depth, the current turn step's rule-book name (for example "cleanup step"), both at the concept weight in the word query and both appended to the embedded text; it never concatenates full oracle text or context notes into the query or its embedding
+  - the retrieval query carries the player's question — on a follow-up, the conversation's opening question, in both the word query and the embedded text (REQ-246) — and, per card, that card's name, type line, and keyword list, plus the card's concept terms (REQ-234) and, in In-Depth, the current turn step's rule-book name (for example "cleanup step"), both at the concept weight in the word query and both appended to the embedded text; it never concatenates full oracle text or context notes into the query or its embedding
@@ functional-requirements.md REQ-178, line 4215 @@
   - REQ-074 (lookup prompt assembly)
+  - REQ-246 (the question a follow-up's query is built from)
```

- Verdict:
- Reason:

## REQ-022 — rules enrichment names the opening question on a follow-up

**What this decides:** whether the general rules-enrichment requirement says that, on a
follow-up, both its search query and its In-Depth question-word topic triggers read the
opening question.

**In plain terms:** REQ-022 is the umbrella for the rules Luna gets in every prompt:
the curated topics ("System 2") and the searched excerpts ("System 3"). Two of its lines
say "the player's question" and "the question's words". The amendment adds "on a
follow-up, the opening question" to both, matching REQ-246.

**What happens if you say no:** REQ-022 keeps reading as if a follow-up's own words pick
its rules, contradicting REQ-246 if that is accepted.

```diff
@@ functional-requirements.md REQ-022, line 382 @@
-  - the System 3 retrieval query is built from the player's question plus a compact per-card signal — name, type line, and keyword list — plus the concept terms the fixed concept map draws from each card's wording (REQ-234) and, in In-Depth, the current turn step (REQ-178); never from raw concatenated card oracle text, which only per-card search reads, as its own separate query (REQ-235)
+  - the System 3 retrieval query is built from the player's question (on a follow-up, the conversation's opening question, REQ-246) plus a compact per-card signal — name, type line, and keyword list — plus the concept terms the fixed concept map draws from each card's wording (REQ-234) and, in In-Depth, the current turn step (REQ-178); never from raw concatenated card oracle text, which only per-card search reads, as its own separate query (REQ-235)
@@ functional-requirements.md REQ-022, line 389 @@
-  - System 2 selection uses game-state signals (`turnPhase`, `combatStep`) plus card wording in two fixed forms: whether two or more cards' oracle text carries replacement or prevention wording as REQ-220 defines it (the whole word "instead", "prevent", "prevents", or "prevented"), which selects the replacement-effect interaction topic (REQ-220); and, in In-Depth only, the concept terms of the cards and the question's words matched against a fixed trigger table for the topics populated zones used to select (REQ-242); card names and keywords never select a System 2 topic
+  - System 2 selection uses game-state signals (`turnPhase`, `combatStep`) plus card wording in two fixed forms: whether two or more cards' oracle text carries replacement or prevention wording as REQ-220 defines it (the whole word "instead", "prevent", "prevents", or "prevented"), which selects the replacement-effect interaction topic (REQ-220); and, in In-Depth only, the concept terms of the cards and the question's words (on a follow-up, the conversation's opening question's words, REQ-246) matched against a fixed trigger table for the topics populated zones used to select (REQ-242); card names and keywords never select a System 2 topic
@@ functional-requirements.md REQ-022, line 399 @@
   - REQ-220 (the card-wording gate for the replacement-effect interaction topic)
+  - REQ-246 (a follow-up's rules come from the opening question)
```

- Verdict:
- Reason:

## REQ-074 — Quick Lookup follow-ups carry the opening question's rules

**What this decides:** whether the Quick Lookup prompt requirement says a follow-up's
excerpt search and step guidance come from the opening question while the follow-up text
stays the question Luna answers.

**In plain terms:** REQ-074 defines what a Quick Lookup prompt contains: the always-on
rules, the searched excerpts "scored against the question", step guidance "for turn
steps the question names", and the question plus conversation history. The amendment
says that on a follow-up "the question" for the first two means the opening question,
and adds that the follow-up's rules sections are the opening question's.

**What happens if you say no:** REQ-074 keeps describing follow-ups as searched on their
own words, contradicting REQ-246 if that is accepted.

```diff
@@ functional-requirements.md REQ-074, line 1784 @@
-  - when a card is attached, the assembled prompt additionally includes that card's full metadata including oracle text using the same per-card formatting as populated-zone cards (REQ-030), that card's WotC rulings directly under its block (DEC-029, REQ-241), and System 3 scored against the question plus a compact signal for each attached card — name, type line, and keyword list — plus the concept terms of its wording (REQ-234), rather than the card's full oracle text (REQ-178); each attached card's own text is searched separately for the two reserved per-card slots (REQ-235)
+  - when a card is attached, the assembled prompt additionally includes that card's full metadata including oracle text using the same per-card formatting as populated-zone cards (REQ-030), that card's WotC rulings directly under its block (DEC-029, REQ-241), and System 3 scored against the question (on a follow-up, the conversation's opening question, REQ-246) plus a compact signal for each attached card — name, type line, and keyword list — plus the concept terms of its wording (REQ-234), rather than the card's full oracle text (REQ-178); each attached card's own text is searched separately for the two reserved per-card slots (REQ-235)
@@ functional-requirements.md REQ-074, line 1785 @@
-  - the assembled prompt omits zone sections, System 2 game-state topic gating (DEC-045), and the merged zone scope sentence (DEC-025), because this path never carries game state; it includes `PHASE GUIDANCE` only for turn steps the question names or an attached card's concept terms name (REQ-024, REQ-238)
+  - the assembled prompt omits zone sections, System 2 game-state topic gating (DEC-045), and the merged zone scope sentence (DEC-025), because this path never carries game state; it includes `PHASE GUIDANCE` only for turn steps the question (on a follow-up, the conversation's opening question, REQ-246) names or an attached card's concept terms name (REQ-024, REQ-238)
@@ functional-requirements.md REQ-074, line 1788 @@
-  - the assembled prompt includes the user `QUESTION` and, when present, the `CONVERSATION HISTORY` section (REQ-027) using the existing placement rules
+  - the assembled prompt includes the user `QUESTION` and, when present, the `CONVERSATION HISTORY` section (REQ-027) using the existing placement rules; on a follow-up, `QUESTION` carries the follow-up text while the rules sections are the opening question's (REQ-246)
@@ functional-requirements.md REQ-074, line 1804 @@
   - DEC-046
+  - REQ-246
```

- Verdict:
- Reason:

## REQ-027 — the follow-up contract states where a follow-up's rules come from

**What this decides:** whether the follow-up contract, which defines what the app sends
on a follow-up, also states that the backend picks the follow-up's rules from the opening
question, with no change to what is sent.

**In plain terms:** REQ-027 says a follow-up sends the follow-up text as `question` plus
the whole prior conversation, opening question first, and the backend adds a
`CONVERSATION HISTORY` section. The amendment adds one line: the follow-up's rules come
from that opening question. The request itself does not change.

**What happens if you say no:** the follow-up contract says nothing about rules, and
REQ-246 alone carries the rule.

```diff
@@ functional-requirements.md REQ-027, line 503 @@
   - backend inserts `CONVERSATION HISTORY` section before `QUESTION` when history is present
+  - on a follow-up, the backend chooses the prompt's rules — System 3 excerpts, curated topics and step guidance — from the conversation's opening question (the first `conversationHistory` turn), not from the follow-up text; the payload is unchanged (REQ-246)
@@ functional-requirements.md REQ-027, line 514 @@
   - REQ-026
+  - REQ-246
```

- Verdict:
- Reason:

## REQ-024 — step guidance on a Quick Lookup follow-up follows the opening question

**What this decides:** whether Quick Lookup's step guidance on a follow-up is chosen by
the turn steps the opening question names, rather than the follow-up's words.

**In plain terms:** Quick Lookup adds a short "what happens in this step" summary when
the question names a turn step, such as the cleanup step, or a card's wording points at
one. REQ-024's line says "its question". The amendment says that on a follow-up this is
the opening question, so a pushback keeps the step summary the opening question earned.
Measured today on the 62 test cases, no follow-up lost its summary, because those
summaries came from card wording; a question that names a step only in words would lose
it.

**What happens if you say no:** a follow-up's step guidance keeps following the
follow-up's own words, while its searched excerpts follow the opening question.

```diff
@@ functional-requirements.md REQ-024, line 437 @@
-  - a Quick Lookup prompt carries `PHASE GUIDANCE` right after `MTG REFERENCE` when its question names a turn step or an attached card's concept terms do, with one summary per named step, at most three, from the same strings (REQ-238)
+  - a Quick Lookup prompt carries `PHASE GUIDANCE` right after `MTG REFERENCE` when its question (on a follow-up, the conversation's opening question, REQ-246) names a turn step or an attached card's concept terms do, with one summary per named step, at most three, from the same strings (REQ-238)
@@ functional-requirements.md REQ-024, line 444 @@
   - REQ-015
+  - REQ-246
```

- Verdict:
- Reason:

## REQ-238 — Quick Lookup step summaries on a follow-up come from the opening question

**What this decides:** the same choice as REQ-024, in the requirement that owns Quick
Lookup's step summaries.

**In plain terms:** REQ-238 gives Quick Lookup the step summary for any step "its
question names". The amendment says the opening question on a follow-up, and adds a
check that a follow-up's step guidance equals the opening question's.

**What happens if you say no:** as for REQ-024: step guidance on a follow-up follows the
follow-up's words.

```diff
@@ functional-requirements.md REQ-238, line 6303 @@
-- Description: The phase-guidance summaries — the short "what happens in this step" paragraphs — are corrected against the Comprehensive Rules, and Quick Lookup now receives the summary for any turn step its question names, or that an attached card's wording points at through the concept map (REQ-234), the same help In-Depth gets for its current step.
+- Description: The phase-guidance summaries — the short "what happens in this step" paragraphs — are corrected against the Comprehensive Rules, and Quick Lookup now receives the summary for any turn step its question names (on a follow-up, the conversation's opening question, REQ-246), or that an attached card's wording points at through the concept map (REQ-234), the same help In-Depth gets for its current step.
@@ functional-requirements.md REQ-238, line 6311 @@
   - In-Depth keeps its current-step summary in its current place, with the corrected text
+  - on a follow-up, the named steps are read from the conversation's opening question, so a follow-up's `PHASE GUIDANCE` equals its opening question's (REQ-246)
@@ functional-requirements.md REQ-238, line 6319 @@
   - REQ-234 (the concept terms that can name a step)
+  - REQ-246 (a follow-up reads the opening question)
```

- Verdict:
- Reason:

## REQ-242 — In-Depth curated topics on a follow-up come from the opening question

**What this decides:** whether In-Depth's question-word topic triggers read the opening
question on a follow-up, so pushback keeps the curated rule topics the opening question
earned.

**In plain terms:** since #293, In-Depth adds some curated rule topics (spell casting,
copying, layers, replacement effects, zone-change triggers) when a card's wording or the
question's words match the topic. On a pushback the follow-up's words match nothing, so
those topics drop out. Measured today: 6 of the 9 In-Depth test cases change topics on a
pushback, losing 8 topics in total. The amendment makes the trigger read the opening
question on a follow-up.

**What happens if you say no:** In-Depth follow-ups keep losing question-triggered
topics, while their searched excerpts follow the opening question.

```diff
@@ functional-requirements.md REQ-242, line 6411 @@
-- Description: In In-Depth, the curated topics that used to be added because the stack or the battlefield held cards are instead added when the cards' wording (through the concept map, REQ-234) or the question's words match the topic. The always-on core, the turn-phase and combat-step topics, the delayed-trigger topic and REQ-220's replacement-interaction gate are unchanged. Quick Lookup is unchanged.
+- Description: In In-Depth, the curated topics that used to be added because the stack or the battlefield held cards are instead added when the cards' wording (through the concept map, REQ-234) or the question's words (on a follow-up, the conversation's opening question's words, REQ-246) match the topic. The always-on core, the turn-phase and combat-step topics, the delayed-trigger topic and REQ-220's replacement-interaction gate are unchanged. Quick Lookup is unchanged.
@@ functional-requirements.md REQ-242, line 6418 @@
   - acceptance: on the 9 corpus cases that exist in both versions, In-Depth keeps at least 17 of their 30 deciding rules in the prompt (measured at build, 2026-10-12: 27 of 30; `inDepthTopicGuard.test.ts`)
+  - on a follow-up, the question-word triggers read the conversation's opening question, so a follow-up's curated topics equal its opening question's (REQ-246; measured 2026-10-12 on the 9 In-Depth diagnostic cases: today 6 change topics on a pushback follow-up, losing 8)
@@ functional-requirements.md REQ-242, line 6425 @@
   - REQ-234 (the concept terms)
+  - REQ-246 (a follow-up reads the opening question)
```

- Verdict:
- Reason:

## REQ-226 — experiment records carry the turn in a pushback run

**What this decides:** whether the experiment-run requirement learns that a pushback run
stores two answers per case, keyed apart by turn, and that `--follow-up` is an
experiment-only flag.

**In plain terms:** an experiment run (a named, frozen eval run kept apart from the
committed scorecard) keys each saved answer by case, model, cap, arm and repeat. A
pushback run saves two answers per conversation, so the key gains the turn, the
experiment-only flag list gains `--follow-up`, and the run's identity record notes which
pushback wording it used.

**What happens if you say no:** REQ-226's record key stays five-part and a pushback run
(REQ-247) has no defined way to keep its two answers apart.

```diff
@@ functional-requirements.md REQ-226, line 5962 @@
-  - `--repeat <n>` (default 1) answers each case `n` independent times per answer model, excerpt cap, and arm; every record is keyed by case id, model, excerpt cap, arm (REQ-230), and repeat index
+  - `--repeat <n>` (default 1) answers each case `n` independent times per answer model, excerpt cap, and arm; every record is keyed by case id, model, excerpt cap, arm (REQ-230), and repeat index, and in a follow-up run (REQ-247) also by turn
+  - `--follow-up <name>` (REQ-247) is an experiment flag: it is refused without `--run-id`, never silently run as a routine run, and the identity record names the follow-up text's revision id
@@ functional-requirements.md REQ-226, line 5978 @@
   - REQ-232 (the local practice-suite run that reuses this machinery)
+  - REQ-247 (the follow-up run that adds the turn to a record's key)
```

- Verdict:
- Reason:

## REQ-228 — the paired report compares one turn at a time

**What this decides:** whether the paired comparison report gets a `--turn` selector so
a pushback run's two answers per case are never pooled.

**In plain terms:** the paired report lines up two runs case by case and shows which
answers went right to wrong or wrong to right. A pushback run holds a first answer and a
pushback answer per case. The selector picks one turn — the first answer by default — so
the report compares like with like. The pushback mode's own summary is where held,
flipped and fixed are read.

**What happens if you say no:** the paired report has no defined behavior for pushback
runs and could mix first answers with pushback answers.

```diff
@@ functional-requirements.md REQ-228, line 6009 @@
-  - `npm run eval:answer-quality:compare -- <run-a> <run-b>` reads two run folders, with optional `--arm`, `--model`, `--cap` and `--repeats <from>-<to>` selectors (and `--arm-a`, `--arm-b`, `--model-a`, `--model-b`, `--repeats-a`, `--repeats-b` for one side); `--repeats` keeps only the records whose repeat index is in the range, so one arm's repeats can be split into halves and compared with each other within one run (`<run> <run> --arm A --repeats-a 1-3 --repeats-b 4-6`), which the report labels a noise-floor comparison; a bare run id resolves under `output/answer-quality/runs/`, and a side defaults to arm A, to the run's only model, and to every repeat; it makes no network call
+  - `npm run eval:answer-quality:compare -- <run-a> <run-b>` reads two run folders, with optional `--arm`, `--model`, `--cap`, `--repeats <from>-<to>` and `--turn <1|2>` selectors (and `--arm-a`, `--arm-b`, `--model-a`, `--model-b`, `--repeats-a`, `--repeats-b`, `--turn-a`, `--turn-b` for one side); `--repeats` keeps only the records whose repeat index is in the range, so one arm's repeats can be split into halves and compared with each other within one run (`<run> <run> --arm A --repeats-a 1-3 --repeats-b 4-6`), which the report labels a noise-floor comparison; `--turn` keeps only one turn's records of a follow-up run (REQ-247), so a case's first answer and its pushback answer are never pooled, and a run without follow-up records has only turn 1; a bare run id resolves under `output/answer-quality/runs/`, and a side defaults to arm A, to the run's only model, to every repeat, and to turn 1; it makes no network call
@@ functional-requirements.md REQ-228, line 6026 @@
   - REQ-227 (unpriced cost reporting)
+  - REQ-247 (the follow-up runs whose turns it selects)
```

- Verdict:
- Reason:

## Blocker questions

None. Every open choice was resolved by the assumption ladder; each is recorded with its
evidence in `DESIGN-BRIEF.md`, `## Assumptions and evidence`.
