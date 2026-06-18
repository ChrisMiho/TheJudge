---
name: prompt-context-retrieval-tuning
description: Draw a clear boundary between the card-agnostic curated rule baseline (System 2) and the card/question-driven adaptive retrieval (System 3), then make each pull the right rules and prove it with the eval harness
metadata:
  type: project
---

# Idea: prompt-context-retrieval-tuning

Two rule-retrieval systems feed the prompt with general (non-card-specific) Magic rules, and neither reliably pulls the *right* rules. This work draws a clear responsibility boundary between System 2 and System 3, tunes each side to that boundary, and verifies relevance with measurement.

(The PRD/documentation-hygiene concern that surfaced alongside this is split into its own package: `prd-doc-traceability`.)

## Decision — System 2 / System 3 boundary (locked 2026-06-18)

The boundary is defined **by signal source**:

- **System 2 — card-agnostic, game-context-driven curated baseline.** Answers *"What rules does this game situation always need?"* Selected deterministically from structural game-state signals only — turn phase / combat step, populated zones, stack non-empty, priority — **independent of which specific cards are present.** Human-curated mapping; explainable; no scoring.
- **System 3 — card/question-driven adaptive catch-all.** Answers *"What additional rules do these specific cards and this question need that System 2 didn't already cover?"* Owns **all card-driven retrieval, including oracle-text keyword signals** (e.g. deathtouch, trample, replacement wording). To preserve the quality that curated topics would have given for known keywords, keyword matches must carry **strong scoring weight** in System 3 rather than being curated into System 2.

The code already enforces the catch-all relationship: System 2's curated rule IDs are excluded from System 3's candidate pool (`collectCuratedRuleIds` → `excludeRuleIds`). The systems are therefore **coupled** — slimming System 2 shifts responsibility onto System 3, so they must be tuned and measured together.

System 1 (official card rulings — exact oracle-ID lookup in `cardRulings.ts`) is considered correct and is out of scope, aside from possibly confirming `cardId` is the oracle ID.

## Problem

- **System 2** (`gameRules.ts` + `gameRulesTopicManifest.json`, 23 topics) injects the **same baseline into every prompt regardless of game state**. It is both bloated (phase-irrelevant rules always present) and under-targeted (situation-specific rules never added when conditions warrant). Today it has no game-state awareness at all.
- **System 3** (`gameRulesRetrieval.ts`, lexical scorer over ~3,432 CR rules in `gameRulesRuleIndex.json`) scores rules by raw count of distinct shared words against a query dominated by card oracle text. No rarity/IDF weighting; the rule-ID (`+100`), parent-ID (`+20`), and dotted-token (`+8`) signals almost never fire for real users; ties break toward the lowest rule number. Result: the top-5 skews toward common, general, low-numbered rules rather than the rules these specific cards actually need. (See README "System 3 current behavior" for the mechanics and worked example.)

## Desired Outcome

- **System 2:** a slim always-on core plus conditional expansion driven only by card-agnostic game-state signals (turn phase / combat step, populated zones, stack/priority), so prompts carry the rules the situation needs and fewer irrelevant ones.
- **System 3:** more relevant card/question-driven selection. Candidate levers: rarity/IDF-style weighting; weighting the question above card oracle text; **strong weight for oracle-keyword matches**; a less arbitrary tie-break. Lexical tuning first; semantic/embeddings retrieval only as a measured follow-up if needed.
- **Measurement:** the existing eval harness is extended with scenario fixtures and expected-rule assertions so before/after relevance is verifiable for both systems together, not asserted.

## Non-Goals

- Not a prompt-format redesign.
- Not real-time CR retrieval or external API calls at request time (stays static-artifact based via `scripts/build-game-rules.mjs`).
- Embeddings / semantic retrieval is not committed; it is a possible follow-up to decide after lexical tuning is measured.
- System 1 (official card rulings) behavior is unchanged.
- PRD/documentation hygiene is out of scope here (moved to `prd-doc-traceability`).

## Open scoping questions (for refinement)

- The precise always-on core vs. conditional split for System 2, and the exact game-state → topic mapping.
- The concrete System 3 scoring formula (IDF vs other weighting; keyword weight; question-vs-oracle weighting; tie-break).
- Whether System 2 and System 3 ship as one slice sequence or separately, given their coupling.
- Eval-harness design: which scenarios and how "expected rules" are defined to judge relevance.
