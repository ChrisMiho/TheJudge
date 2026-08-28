# Sweep finding — capture-and-stack

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/capture-and-stack.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 9

## DEC-004 — absorbed
in-depth/README.md states stack ordering explicitly: "`stack[0]` is the bottom, last element is the top, consistent across UI, payload, and prompt builder," and repeats it for prompt assembly ("Stack ordering (bottom-to-top) is preserved into the prompt builder").

## DEC-005 — absorbed
in-depth/README.md's Step 3 line ("append-only, newest card becomes the top") captures the append/top behavior; the "manual reorder deferred" corollary is implicit in the spec never describing a reorder feature.

## DEC-006 — absorbed
in-depth/README.md Step 3 gives the exact conditional copy: "the add button reads **Begin stackening!** when empty and **Add to Stack** otherwise."

## DEC-007 — absorbed
in-depth/README.md Step 3: "duplicates are blocked with a 'not supported yet' notice," which also preserves the "temporary constraint" framing from the decision's notes.

## DEC-008 — absorbed
in-depth/README.md Step 3 ("the stack is capped at 10 cards") and Measured Bounds ("Stack cap: 10 cards; the 11th add is blocked") both restate the cap and the UI-blocking behavior.

## DEC-015 — absorbed
in-depth/README.md Step 3: "search box says **Type to begin**" matches the empty-state search copy verbatim.

## DEC-018 — absorbed
in-depth/README.md Step 3: the stack details panel lists cards "bottom-to-top with per-card remove and thumbnails-when-available," matching the opportunistic-thumbnail requirement.

## DEC-028 — partial
The core zone-aware fallback text ("Resolve the stack" vs. "Explain the interaction with the provided game state") is captured in in-depth/README.md's Submit section. Missing: the zone-collection step's non-blocking nudge shown when stack is selected-but-empty and another zone has cards, and the enrichment step's pre-decrypt summary of populated zones plus the fallback question shown when the question is left blank — neither UI behavior is mentioned anywhere in the 7 specs.

## DEC-082 — absorbed
in-depth/README.md Step 3 (instanceId paragraph) restates the full decision: `instanceId` assigned once at add time, `cardId` stays the oracle identity, stripped at the `buildAskAiRequest` serialization boundary, and it never enables duplicate stack cards.
