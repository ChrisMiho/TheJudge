# Sweep finding — providers-and-contract

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/providers-and-contract.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 10

## DEC-010 — absorbed
One product-facing `POST /api/ask-ai` endpoint is stated repeatedly and explicitly attributed to DEC-010 in quick-lookup, shared-chrome, and user-feedback (backend-minimal, one product endpoint).

## DEC-012 — absorbed
The static committed metadata file backing local card search/autocomplete shows up as DEC-012 in trade-balancer's manual-search path and as the same "local metadata search" / `CardMetadataItem` behavior described (without runtime sync) in in-depth, quick-lookup, and scan.

## DEC-014 — absorbed
In-depth's failure-handling section states the app preserves game context/zones/cards/enrichment/question on AI failure and offers a retry on a 13-second cooldown, citing DEC-014 directly, matching the decision verbatim.

## DEC-016 — absorbed
In-depth cites DEC-016 for the "Miho is working on it" failure copy, matching the decision text exactly.

## DEC-017 — absorbed
Both in-depth and quick-lookup describe the mock provider returning the assembled prompt text as `answer` for inspection, citing DEC-017 directly.

## DEC-020 — absorbed
The explicit `ASK_AI_PROVIDER` flag, frozen HTTP contract across mock/OpenAI, and backend-only credentials are described at length in in-depth and quick-lookup, both citing DEC-020.

## DEC-033 — partial
In-depth and quick-lookup cite DEC-033 only for "mock returns the assembled prompt as `answer`" (same ground as DEC-017); none of the 7 specs describe the decision's actual substance — the optional `context`/`diagnostics`/`enrichmentDebug` sidecar fields on `askAiResponseSchema` success responses, or that they are mock-only while OpenAI/frontend stay `{ answer }`-only.

## DEC-049 — absorbed
In-depth's provider-boundary section states live answers emit log-only size diagnostics (`correlationId`, `providerElapsedMs`, `answerChars`, `estimatedAnswerTokens`, `charsPerTokenEstimate`) with no sidecar and no prompt/UI/history impact, citing DEC-049 directly.

## DEC-071 — not-absorbed
None of the 7 specs describe the `choosePreferredCard` standard-paper-printing preference/tiebreak that DEC-071 adds to the committed metadata build; DEC-071 is not in any of the 7 specs' "Backed by" lists or body text (scan, trade-balancer, and in-depth cite the base DEC-012 static-metadata decision and downstream `CardMetadataItem` usage, but never this build-time refinement). Missing: the standard-vs-special-treatment tiebreak rule and its rationale.

## DEC-106 — absorbed
Quick-lookup's request-validation section fully describes the `"game" | "lookup"` mode union, optional `card`, `gameContext` rejection on lookup mode, and the DEC-096/DEC-098 supersession, citing DEC-106 directly; in-depth also cites DEC-106 for the same union on its `mode: "game"` branch.
