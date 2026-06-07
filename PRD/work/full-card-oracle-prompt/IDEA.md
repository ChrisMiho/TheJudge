# Idea: Full Card Oracle in Every Zone

## Problem

TheJudge sends structured game context to the LLM via a backend-assembled prompt. The PRD contract says every submitted card should include oracle text. In practice:

- **Stack cards** get a rich metadata block including `oracleText`.
- **Non-stack zone cards** (battlefield, hand, graveyard, exile, library, command) only get `name`, `owner`, `details` (context notes), and `targets` — **no oracle text or other card fields**.

Phase-scoped context collection made this gap more visible: default phases often pre-select non-stack zones (e.g. `main_1` → battlefield + hand), so many submissions no longer center on the stack.

The frontend already sends full `ZoneCardItem` payloads with `oracleText` for every zone. The data is dropped during backend normalization and never rendered in the prompt.

Additionally, several prompt-size and truncation limits exist (35k total budget, 480-char oracle cap, conversation history cap, rulings section cap). These do not strip non-stack oracle today — that is a separate formatting gap — but they can truncate stack oracle text and reject oversized prompts. During testing we want limits instrumented but effectively disabled.

## Desired Outcome

1. Every card in every populated zone appears in the LLM prompt with **full card metadata**, including verbatim oracle text.
2. Stack and non-stack zone sections use a **consistent card block format** (zone-appropriate labels for owner vs caster, stack role, mana spent).
3. All existing `MAX_*` limit constants and diagnostics remain in code, but values are raised to very large numbers so behavior is effectively unlimited while we test and tune.
4. `getPromptDiagnostics`, mock budget lines, and structured logging continue to report prompt size and utilization.

## Non-Goals

- Frontend changes (payload is already correct)
- Reverting phase-scoped prompt context or two-zone phase defaults
- Removing limit constants, truncation helpers, or budget rejection code paths
- Changing `POST /api/ask-ai` request/response shapes
- Increasing inbound Zod `oracleText` max beyond 2000 chars (separate from prompt assembly limits)
- Paraphrasing or summarizing oracle text

## Decomposition Intent

Ship as two backend slices: context + prompt formatting first (the functional fix), then limit bumps + retrieval + test/golden refresh + PRD alignment.
