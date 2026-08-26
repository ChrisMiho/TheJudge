# Graph run — quick-lookup-spec

- Run ID: `graph-20260826-174916`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`
- Graph canary: `denied — graph tier armed (nohup true)`
- Autonomous base: `origin/thejudge-auto/quick-lookup-spec`
- Staging: `.worktrees/.graph-intake/graph-20260826-174916/`
- Current node: `gate-qc` (resumed 2026-08-26; lock re-taken, graph canary re-denied — tier armed)
- Next action: `/graph-run PRD/work/quick-lookup-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/quick-lookup-spec` created from `main` and pushed; classification `clean` (no stash); lock `held` pid 59134; both canaries denied | 2026-08-26 |
| 2 | shape | sonnet | ok | `0 → 34` | package `PRD/work/quick-lookup-spec/` created (`IDEA.md`, `README.md` with backing sources, `STATUS.ideation`); board row added under `## ideation` | 2026-08-26 |
| 3 | define | opus | parked | `0 → 48` | spec authored at `PRD/sections/quick-lookup/README.md` (321 lines, DEC-168 template); `DESIGN-BRIEF.md` + one `PRD/README.md` Section Inventory row; zero new IDs, zero source-body edits; non-empty `PRD/sections/` diff → **parks at define gate** | 2026-08-26 |
| — | gate-review | (owner) | resolved | — | `/graph-gate-review`: 6 sections walked, 6 accept / 0 edit / 0 reject; 0 new IDs; gate resolved, package restored to `refined` | 2026-08-26 |
| 4 | gate-qc | sonnet | ok | `0 → 17` | `thejudge-quality-check`: **PASS**, no findings; all cited IDs resolve (23 DEC, 20 REQ, FLOW-006/011, NFR-001); zero new IDs; documentation-only scope confirmed; `STATUS.refined` kept | 2026-08-26 |
| 5 | plan | sonnet | ok | `0 → 55` | `thejudge-map-out`: `GAMEPLAN.md` + 3 verify-only slices (A UI-content/8 criteria, B backend-path-vs-source/8, C nav+diff-scope/5); `STATUS.active`; no new IDs, no `PRD/sections/` edit. Slice B flags a grounded gap — accepted spec omits Commander Spellbook combo retrieval (DEC-116/REQ-094, `preparation.ts`); bounded additive correction to apply in build if it re-verifies | 2026-08-26 |
| 6 | build | sonnet | ok | `0 → 171` | `thejudge-implement-all`: PR [#116](https://github.com/ChrisMiho/TheJudge/pull/116) (`-work`→base) opened, MERGEABLE; 21/21 criteria `true` (`.graph-evidence.jsonl`); combo-retrieval gap re-verified from source and applied additively (new `### Combo enrichment` subsection, DEC-116/REQ-094/REQ-095 cited, 2 fixtures, `commanderSpellbook/` in Where-it-lives — existing IDs only, no `apps/` edit); `STATUS.ship-ready`. Write-scope PASS: launch checkout untouched (`b730ba5`), all writes inside `.worktrees/implement-quick-lookup-spec/` | 2026-08-26 |

## Open gate

**Resolved:** 2026-08-26 via `/graph-gate-review` — all six spec sections walked
and accepted (6 accept, 0 edit, 0 reject; 0 new stable IDs). The recorded diff
below is retained as the evidence of what was walked.

**Gate:** define gate. `thejudge-refinement` (node 3) authored a current-state
feature spec that writes new player-facing product truth into `PRD/sections/`.
Under the graph-run contract, any non-empty `PRD/sections/` diff parks the run
for owner review before it proceeds — the one deliberate autonomy-for-control
trade in the workflow.

**Question for the owner:** Does the consolidated Quick Lookup spec faithfully
describe current behavior? Walk it one item at a time and accept / edit / reject
via `/graph-gate-review`.

**What changed (product-truth diff scope):**
- New file `PRD/sections/quick-lookup/README.md` (321 lines) — the derived,
  non-authoritative Quick Lookup spec on the DEC-168 template. This is the only
  `PRD/sections/` change, and the whole subject of the gate walk.
- Supporting, not part of the gate walk: `PRD/work/quick-lookup-spec/DESIGN-BRIEF.md`
  (design record) and one navigation row in the `PRD/README.md` Section Inventory.

**New stable IDs introduced: none.** The spec is a pure derived view. It mints
zero new `DEC`/`REQ`/`FLOW`/`NFR` IDs and edits zero existing source bodies —
`decisions.md`, `decisions/*.md`, `functional-requirements.md`, `user-flows.md`,
`system-map.md`, and `screen-layout.md` are all untouched (verified by
`git diff --name-only`). It only cites existing IDs. `Backed by:` consolidates:
DEC-020, DEC-025, DEC-029, DEC-042, DEC-045, DEC-046, DEC-095, DEC-106, DEC-107,
DEC-108, DEC-112, DEC-113, DEC-114, DEC-118, DEC-017, DEC-033, DEC-053, DEC-160,
DEC-096, DEC-097, DEC-098, DEC-099, DEC-100, REQ-072, REQ-073, REQ-074, REQ-075,
REQ-079, REQ-091, REQ-092, REQ-097, REQ-098, REQ-011, REQ-022, REQ-024, REQ-030,
REQ-129, REQ-134, REQ-141, FLOW-006, FLOW-011, NFR-001 (DEC-096/097/098/099/100
recorded as closed doors; REQ-076/077/078/080 merge stubs cited via survivors).

**Resume command:** `/graph-gate-review PRD/work/quick-lookup-spec/` to walk and
record accept/edit/reject verdicts, then `/graph-run PRD/work/quick-lookup-spec/`
to continue the run (gate-qc -> plan -> build -> review -> land -> close).

**Complete diff (the whole new file, verbatim — regenerate with
`git diff --no-index -- /dev/null PRD/sections/quick-lookup/README.md`):**

```diff
diff --git a/PRD/sections/quick-lookup/README.md b/PRD/sections/quick-lookup/README.md
new file mode 100644
index 0000000..a4e9b35
--- /dev/null
+++ b/PRD/sections/quick-lookup/README.md
@@ -0,0 +1,321 @@
+# Quick Lookup — current-state feature spec
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1
+  and Read-First #1. Correct this file against those sources, not the other
+  way around.
+- Backed by: DEC-020, DEC-025, DEC-029, DEC-042, DEC-045, DEC-046, DEC-095,
+  DEC-106, DEC-107, DEC-108, DEC-112, DEC-113, DEC-114, DEC-118, DEC-017,
+  DEC-033, DEC-053, DEC-160, DEC-096, DEC-097, DEC-098, DEC-099, DEC-100,
+  REQ-072, REQ-073, REQ-074, REQ-075, REQ-079, REQ-091, REQ-092, REQ-097,
+  REQ-098, REQ-011, REQ-022, REQ-024, REQ-030, REQ-129, REQ-134, REQ-141,
+  FLOW-006, FLOW-011, NFR-001
+
+## What it is
+
+A feature-portal destination for the short ask: the player either has one card
+in mind or doesn't, and wants a fast Magic rules answer without staging a whole
+game. They optionally attach a single card — by typed search or camera scan —
+then type a question (or pick a rules topic), and get a plain-text answer in the
+same conversation chrome the main MTG Assistant flow uses. Behind that one
+screen runs the entire Ask AI backend: the request rides the shared
+`POST /api/ask-ai` endpoint on a `mode: "lookup"` branch, the backend assembles
+one prompt that always retrieves rules from the question and layers in the
+card's rulings and metadata only when a card is attached, and the same provider
+boundary (mock by default, OpenAI live) generates the answer. Off-domain
+questions get an in-character "I couldn't find that in the rules" reply rather
+than a chatbot answer. It carries no zones, stack, phase, or multi-card
+setup, and it is not a full rules browser or a judge authority.
+
+## How it works
+
+### Entry and pre-submit layout
+
+- Built: Quick Lookup is registered as one feature-portal destination
+  (`quick-lookup`, DEC-095) and opens as a frontend-only view switch with no
+  reload; it ships no navigation menu of its own. (DEC-107, REQ-073, FLOW-011)
+- Built: the pre-submit view is laid out top to bottom as an optional
+  card-attach control, then the Question field, then the "General rules topics"
+  outer disclosure. (REQ-073, DEC-112)
+- Built: the card-attach control's label carries the guidance copy inline after
+  an em dash — "OPTIONAL CARD — Add a card for context or ask any Magic related
+  question." — rather than as a standalone paragraph under the header. (DEC-113,
+  REQ-073)
+- Built: card input is optional and single. The player resolves one card by
+  typed autocomplete search (REQ-001/REQ-002 behavior) or by camera scan (the
+  shared FLOW-006 engine), each resolving to one oracle-level `CardMetadataItem`;
+  the resolved card shows its name, image when available, and oracle text with
+  full metadata before submit, and can be removed or replaced. Only one card is
+  active at a time; there are no zones, stack, phase, or per-card
+  enrichment-editing controls. (DEC-107, REQ-073, FLOW-006, FLOW-011)
+- Built: scan here resolves to exactly one card and is presentation-only at the
+  printing level — the scanned printing's art never reaches the request, prompt,
+  or rulings; identity stays oracle-level. (DEC-053, REQ-073)
+
+### General rules topics browse
+
+- Built: below the Question field sits a collapsed-by-default "General rules
+  topics" outer disclosure whose summary stays visible in every pre-submit state
+  — attaching a card or typing into the Question field does not hide it.
+  Expanding it reveals a short set of core rules topics (the stack & priority,
+  targeting, combat, layers) built from the same curated `gameRulesByTopic`
+  excerpts the prompt uses — one source of truth, no hand-authored second copy.
+  (REQ-079, DEC-112)
+- Built: topic rows are collapsed by default, each showing its title, a "Use
+  this topic" button, and an expand/collapse toggle without expanding the row;
+  expanding one row reveals its rule numbers and excerpt and auto-collapses any
+  other open topic (accordion — at most one excerpt visible at a time). Reading a
+  topic is fully client-side with no AI call. (REQ-079, DEC-112)
+- Built: "Use this topic" locks that topic's fixed phrase (`Tell me about
+  {Topic}.`) into a non-editable pill inline with the Question field's label,
+  with its own remove control; only one pill may be locked at a time and picking
+  a different topic swaps it without touching text already typed. It also
+  smooth-scrolls to the Question field and focuses the textarea. (REQ-091,
+  DEC-112)
+
+### Composing and submitting the question
+
+- Built: the freeform textarea stays independently editable at all times as
+  optional supplementary context; locking, swapping, or removing a pill never
+  overwrites it. Submit is enabled whenever a pill is locked, a card is attached,
+  or the textarea has non-empty trimmed text. (REQ-091, DEC-112)
+- Built: on submit the wire `question` string is composed client-side with no
+  request-shape change — the pill phrase plus trimmed textarea text
+  (space-joined) when both are present; the pill phrase alone; the textarea
+  alone when no pill is locked; or, when no pill is locked and the textarea is
+  empty but a card is attached, the silent fallback `Tell me about {Card Name}.`
+  (never shown to the user). (REQ-091, FLOW-011)
+- Built: the visible counter, the textarea `maxLength`, and the submit gate all
+  measure the raw editable textarea content, not the composed string, so an
+  empty field with a card or topic attached reads `0/300` and a full
+  300-character question stays submittable. (REQ-091 as amended by REQ-134,
+  REQ-011)
+
+### Initial submit wait
+
+- Built: while the initial submit is in flight and no answer has arrived, the
+  Question form (label, pill, textarea, counter, submit button) is hidden and
+  the existing `AskAiWaitingPanel` (live elapsed timer, threshold messages,
+  REQ-023) renders in its place. The Optional card section and the General rules
+  topics disclosure stay visible and interactive throughout. (DEC-114, REQ-092)
+- Built: on error the Question form reappears alongside the retry affordance; on
+  success the pre-submit view swaps to the shared conversation workspace.
+  (DEC-114, REQ-092)
+
+### Answered conversation workspace
+
+- Built: on the first successful answer the surface renders the same shared
+  chat-first `ConversationWorkspace` as In-Depth Question — message log, docked
+  follow-up composer, inline processing animation, retry/error placement, New
+  response affordance, and Start Over — under the same conversation limits as the
+  main flow; Quick Lookup defines no separate limit policy. (REQ-075, DEC-118,
+  REQ-097, REQ-098)
+- Built: the first visible bubble is the assistant's answer; the initial user
+  question rides in `conversationHistory` but is not shown as a visible bubble.
+  Follow-ups are text-only and send `{ mode: "lookup", question, card: frozen
+  (when one was attached), conversationHistory }`. (REQ-075, FLOW-011)
+- Built: when a card was attached it is frozen for the conversation and shown
+  behind a compact adaptive context trigger — a bottom sheet below 768px or a
+  right-side drawer at 768px+; without a card, no empty context trigger or
+  container renders. Start Over clears the thread and any locked pill and
+  returns to the pre-ask state. (REQ-075, DEC-118)
+
+## The full backend path (request → assembly → retrieval → provider → response)
+
+Quick Lookup is the first spec whose subject runs the entire Ask AI backend, not
+a frontend-only surface. The path below is one branch of the shared
+`POST /api/ask-ai` endpoint (DEC-010's single product-facing endpoint); success
+`{ answer }` and error response shapes are unchanged from the game mode and from
+both providers. (DEC-020, REQ-072)
+
+### Request validation (`mode: "lookup"` branch)
+
+- Built: `askAiRequestSchema` is a `mode`-discriminated union
+  (`"game" | "lookup"`). A payload with no `mode` key defaults to `"game"` for
+  back-compat; `mode: "lookup"` is a required literal. The lookup branch is
+  `{ mode: "lookup", question, card?, conversationHistory? }`, `.strict()`, so a
+  `gameContext` field is rejected as an unrecognized key — `card` and
+  `gameContext` are mutually exclusive across modes. (DEC-106, REQ-072)
+- Built: `card` is optional and its presence or absence is what the backend
+  branches on. The lookup card reference is oracle-level (`cardId`, `name`,
+  `oracleText` required; `imageUrl`/`manaCost`/`manaValue`/`typeLine`/`colors`/
+  `supertypes`/`subtypes` optional) and carries no zone, caster, owner, targets,
+  or context-notes fields. (DEC-106, DEC-053, REQ-072)
+- Built: `conversationHistory` is optional and validated identically to the game
+  mode (1–20 turns, first `user`, last `assistant`, strictly alternating,
+  per-message cap). The `question` character bound and control-character
+  guardrails are identical across modes. (REQ-072)
+
+### Branching prompt assembly
+
+- Built: `preparePromptInput` routes `mode: "lookup"` to a single lookup
+  assembly path (`prepareLookupPromptInput` → `buildLookupPromptText`), never
+  forking by whether a card is attached — the card is a conditional layer inside
+  one path, not a second implementation. (DEC-107, REQ-074)
+- Built: three things always run regardless of a card. The static `MTG
+  REFERENCE` block (DEC-025), the always-on core game-rules topics (DEC-045 core
+  set), and question-scored System 3 supplemental rules (DEC-046 / REQ-022).
+  (DEC-107, REQ-074)
+- Built: when a card is attached, per-card enrichment layers in — the card's
+  full metadata including oracle text using the same per-card formatting as
+  populated-zone cards (DEC-042 / REQ-030), the card's WotC rulings (DEC-029),
+  and System 3 additionally scored against the card's oracle text and type line,
+  not only the question. With no card, the rulings section and card section are
+  empty and System 3 scores on the question alone. (DEC-107, REQ-074)
+- Built: game-state-only sections are always omitted — zone sections, `PHASE
+  GUIDANCE` (REQ-024), System 2 game-state topic gating (DEC-045), and the merged
+  zone scope sentence (DEC-025) — because lookup mode never carries game state.
+  These are structurally absent: the lookup assembler does not call the
+  game-context, phase-guidance, or zone-section builders at all. (DEC-107,
+  REQ-074)
+- Built: the prompt instructs the model to quote rule text only from the
+  provided rule-excerpt sections and to present the relevant ones verbatim with
+  an explanation. The user `QUESTION` and, when present, the conversation history
+  section are placed by the existing rules. (REQ-074)
+
+### Off-domain guardrail
+
+- Built: the lookup-mode prompt instructs the model to treat unrecognized or
+  off-domain terms as "not found in the rules corpus," ask the user to check
+  spelling or rephrase toward a Magic term, and never answer the off-domain
+  question directly — the "confused rules lookup" persona, applied identically
+  whether or not a card is attached. (DEC-108, REQ-074)
+- Built: this is prompt-instruction-only. There is no separate classifier,
+  validator, detection branch, or debug/log signal for off-domain input anywhere
+  in the request path — the persona lives entirely as an instruction line in the
+  assembled prompt. (DEC-108)
+
+### Retrieval
+
+- Built: System 3 supplemental rules retrieval (DEC-046) is IDF-scored keyword
+  retrieval over the loaded rule index, excluding the curated rule numbers the
+  always-on core topics already carry, returning a small capped set of the
+  best-scoring rules. For lookup the query is built from the question tokens
+  always, plus the attached card's oracle text and type line when one is
+  present. (DEC-046, REQ-022, DEC-107)
+- Built: the always-on core game-rules topics are a fixed curated set
+  (stack-and-priority, targets, zones, triggered-ability basics), not the
+  state-gated selector the game flow uses — lookup carries no game state to gate
+  on. (DEC-045, REQ-074)
+
+### Provider boundary
+
+- Built: assembly produces one `PreparedPromptInput` and hands it to the same
+  `AskAiProvider.generateAnswer` the game mode uses; the provider consumes the
+  assembled prompt text and never inspects `mode`. Quick Lookup adds no
+  provider-boundary behavior of its own — the only difference from game mode is
+  the prompt text assembled before the boundary. (DEC-020, REQ-074)
+- Built: provider selection is explicit via `ASK_AI_PROVIDER` — mock is the
+  default and returns the assembled prompt text as its `answer` for inspection
+  (DEC-017 / DEC-033); `openai` is the live path behind the same interface.
+  HTTP contracts stay frozen across the swap and upstream failures map to the
+  normalized error shape (the "Miho is working on it" copy). (DEC-020, DEC-017,
+  DEC-033)
+- Built: regression is pinned by golden fixtures under
+  `apps/backend/src/eval/fixtures/quick-lookup-*` — card, no-card, and off-domain
+  scenarios, each with a request fixture plus a context golden and a prompt
+  golden; the off-domain prompt golden pins the guardrail instruction wording
+  verbatim. (DEC-108)
+
+## Measured bounds
+
+Bounds travel with a surface only while that surface still exists in code.
+Retrieval and topic-set figures are outcome-validated calibration recorded here
+as the current shipped configuration, not product truth.
+
+- Wire question bound: `questionSchema` accepts up to 600 characters (min 0).
+  This carries the composed string — the raw textarea is capped at the product
+  300 by the frontend, and 600 covers the locked-pill prefix or the silent
+  `Tell me about {Card Name}.` fallback the client composes on top. (REQ-134,
+  REQ-091, `askAiRequest.ts`)
+- Frontend display cap: the visible counter, textarea `maxLength`, and submit
+  gate measure the raw editable textarea at 300 characters (REQ-011); the
+  composed wire value may exceed 300 by the prefix, accepted against DEC-042's
+  1,000,000-char prompt budget. (REQ-091 as amended by REQ-134)
+- Conversation limits: 1–20 turns, alternating roles starting with user and
+  ending with assistant, per-message cap — shared with the main flow, not a
+  Quick-Lookup-specific policy. (REQ-072, REQ-075)
+- Retrieval: System 3 returns a small capped best-scoring set (top 5), curated
+  core-topic rule numbers excluded; question tokens always score, card
+  oracle/type tokens added only when a card is attached. (DEC-046, REQ-022)
+- Always-on core topics: a fixed four-topic core set (stack-and-priority,
+  targets, zones, triggered-ability basics); the static MTG reference block is a
+  bounded ≤2500-char constant. (DEC-045, DEC-025)
+- Pre-submit card image fit: the shared card-shell image is capped at
+  `max-height: 25dvh` below 768px and `42dvh` at 768px+ so **Send Request** stays
+  in the first viewport with no page scroll — REQ-129's no-scroll fit binds
+  before REQ-141's "clear majority," so at 390×844 the image is ~45% of content
+  width, which REQ-141 is not met on and DEC-160 anticipates. (DEC-160, REQ-129,
+  REQ-141, `screen-layout.md`)
+- Layout/fit: mobile-first and touch-friendly; the pre-submit stack and the
+  answered workspace follow the shared shell width and region-scroll rules of
+  `screen-layout.md`'s "Quick Question — pre-submit" and "— answered workspace"
+  rows. (NFR-001, `screen-layout.md`)
+
+## Rejected alternatives and deferred scope
+
+- **Two separate destinations — Card Lookup (DEC-097) and Rules Lookup
+  (DEC-099) — closed door.** Both were refined and confirmed as their own
+  feature-portal destinations, each with its own wire mode and its own forked
+  backend enrichment path, before either shipped. Quick-lookup refinement
+  reconciled them into one destination because the value proposition — skip
+  staging game state, get a fast answer in the shared chrome — is identical
+  whether or not the player has a card in mind; two destinations and two forked
+  prompt-assembly implementations duplicated surface area for no product benefit
+  and risked the two implementations drifting apart. (DEC-107, framed by its
+  Context)
+- **Two wire modes — `mode: "card"` (DEC-096) and the reserved `mode: "rules"`
+  (DEC-098) — closed door.** DEC-106 replaced the `card` branch and retired the
+  reserved `rules` slot with one `mode: "lookup"` branch carrying an optional
+  `card`, matching the one-ask-path product shape exactly. (DEC-106)
+- **Forked-by-mode backend enrichment — closed door.** DEC-107 ships one
+  branching (not forked) assembly path: enrichment is a conditional card layer
+  inside a single implementation, reusing the same rulings/metadata/System-3
+  helpers the game flow uses, not a second copy. (DEC-107)
+- **"Ask about this" pre-filling a freely editable textarea (original REQ-079)
+  — closed door.** DEC-112/REQ-091 replaced it with the locked non-editable pill
+  so a topic choice always reaches the submitted question and cannot be
+  accidentally edited away. (DEC-112, REQ-091)
+- **Cap and counter measured against the composed question string (original
+  REQ-091/DEC-112) — closed door.** Live measurement found that rule produced an
+  empty field reading `22/300`, a counter that rose on backspace-to-empty, and an
+  unreachable `323/300` submit state; REQ-134 moved the cap and counter to the
+  raw editable text. This bound no longer attaches to the composed string. (REQ-134)
+- **Standalone guidance paragraph under the header — closed door.** DEC-113
+  folded the copy inline onto the "Optional card" label; the wording and layout
+  order are unchanged. (DEC-113)
+- **Answer-seeded second-pass retrieval (DEC-100, former REQ-078) — deferred,
+  not carried into v1.** DEC-100 specified re-querying the rule index with the
+  model's first answer for rules-mode; Quick Lookup ships without it so it can get
+  its own tuning pass as a dedicated future feature. The model still surfaces
+  relevant verbatim rules from the first-pass provided set. Tracked as Q-004;
+  open, not decided here.
+- **Optional lightweight game context on the `card` field — deferred.** The
+  DEC-106 union was shaped so a small amount of surrounding game context could be
+  added to the card branch additively later; v1 keeps the card branch strictly
+  single-card with no `gameContext`. Tracked as Q-003; open, not decided here.
+- **Deferred, not cut:** mid-conversation card/zone-context editing —
+  follow-ups are text-only in v1 with the attached card, if any, frozen for the
+  conversation.
+
+## Where it lives
+
+The frontend destination and lookup-local UI live under
+`apps/frontend/src/components/portal/quick-lookup/` (`QuickLookupApp.tsx`),
+registered in `apps/frontend/src/components/portal/destinationRegistry.tsx`; it
+reuses the shared `apps/frontend/src/components/{ConversationWorkspace,AdaptiveContextDialog}.tsx`,
+the submit orchestration hook `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`,
+and the committed core-topics browse artifact
+`apps/frontend/public/data/gameRulesCoreTopics.json`. The full backend path runs
+through `apps/backend/src/validation/askAiRequest.ts` (the `mode: "lookup"`
+branch), `apps/backend/src/prompt/` (`preparation.ts`, `promptAssembly.ts`,
+`context.ts`, `mtgReference.ts`, `phaseGuidance.ts`),
+`apps/backend/src/gameRulesRetrieval.ts` (System 3), and
+`apps/backend/src/providers/` (`askAiProvider.ts`, `createAskAiProvider.ts`,
+`mockAskAiProvider.ts`, `openAiResponsesProvider.ts`); regression goldens live
+under `apps/backend/src/eval/fixtures/quick-lookup-*` and the core-topics
+artifact is emitted by `scripts/build-game-rules.mjs`. See
+`PRD/sections/system-map.md`'s `## Quick Lookup` block for the full file list,
+`PRD/sections/screen-layout.md`'s `#### Quick Question — pre-submit` and
+`#### Quick Question — answered workspace` rows for the layout bands, and
+`apps/backend/src/providers/README.md` for the provider-boundary config detail.
```

## Gate verdicts

The spec minted zero new stable IDs — a derived, non-authoritative view citing
existing IDs — so the walk unit was the spec's six sections rather than new IDs.
Every section was accepted, so no `PRD/sections/` edit or revert was applied; the
run's authored text stands.

| Section walked | Verdict | Reason |
| --- | --- | --- |
| header + What it is | accept | — |
| How it works | accept | — |
| The full backend path | accept | — |
| Measured bounds | accept | — |
| Rejected alternatives and deferred scope | accept | — |
| Where it lives | accept | — |

## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 1 (`preflight`) of an autonomous graph run. Invoke the `graph-preflight` skill and follow it exactly. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Run parameters:
- Branch to create and push: `thejudge-auto/quick-lookup-spec`
- Run ID: `graph-20260826-174916`
- Base: current branch (`main`)

Do this:
1. Read `PRD/instructions/graph-workflow-contract.md` as the skill instructs, then invoke `graph-preflight`.
2. Take the concurrency lock via the script (do not hand-write it).
3. Run the dry-run: `npm run graph:preflight -- --branch thejudge-auto/quick-lookup-spec --run-id graph-20260826-174916 --dry-run`. Report the classification, the resolved base, the planned commands, and both the `profile sentinel:` / `Profile:` lines verbatim.
4. If the action is `blocked`, stop and report the offending paths — do not hand-resolve.
5. Otherwise run the identical command without `--dry-run`, same `--run-id`.
6. Issue the liveness canary as a real Bash tool call and require the hook to DENY it. Then issue the graph canary (`GRAPH_CANARY_COMMAND`) after the lock is held and require a DENY. Report `classifyCanary()` and `classifyGraphCanary()` ledger lines verbatim. An allowed canary is BLOCKED — report it and stop.
7. Confirm end state: `git status --porcelain` empty, `git branch --show-current` is `thejudge-auto/quick-lookup-spec`.

Do NOT create any package folder, worktree, or write to PRD/. That is node 2's job. Do not remove the stop sentinel. Do not drop/pop/reorder any stash.

Report back, verbatim where the skill says verbatim:
- The `Profile:` line (sentinel present or unverified)
- The `Canary:` ledger line and the graph-canary ledger line
- The classification (clean / commit / stash), and if a stash was taken, the exact `git stash list | grep graph-preflight/graph-20260826-174916` and `git stash apply <ref>` restore lines
- The resolved autonomous base (`origin/thejudge-auto/quick-lookup-spec`)
- Confirmation the branch was pushed and the tree is clean
- The lock state the script reported (free/held/stale/corrupt)

### shape

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 2 (`shape`) of an autonomous graph run. Invoke the `thejudge-kickoff` skill and follow it exactly in graph mode. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Run parameters:
- Slug (use exactly this — do not re-derive): `quick-lookup-spec`
- Run ID: `graph-20260826-174916`
- Branch already created and pushed by node 1: `thejudge-auto/quick-lookup-spec`

The request (the idea to capture, verbatim):
"Write the current-state feature spec for the quick-lookup feature — Phase A #5 of the docs-refactor gameplan. Land it at PRD/sections/quick-lookup/README.md on the DEC-168 template. It runs the full backend path — prompt assembly, retrieval, and the provider boundary — so capture that flow, not just the UI. Keep it draft and non-authoritative."

Do this:
1. Read root `README.md` and `PRD/README.md` for onboarding context as the skill instructs.
2. Create the work package `PRD/work/quick-lookup-spec/` with `IDEA.md` capturing the request above, and set `STATUS.ideation`.
3. This is Phase A #5 of the docs-refactor gameplan (`PRD/work/adhoc/refactor-gameplan.md`). The idea is a **current-state feature-spec** for the quick-lookup feature, written on the DEC-168 template, landing at `PRD/sections/quick-lookup/README.md`. It is draft and non-authoritative — `sections/decisions.md` stays precedence #1. Note in IDEA.md that this is a documentation/consolidation task, not a code change.
4. If the request cannot be turned into an actionable package, return `NO ACTIONABLE PACKAGE` with the reason.

Do NOT run refinement, do NOT write to `PRD/sections/`, do NOT create a worktree. Only shape the package. Do not touch the concurrency lock or the stop sentinel. Do not copy the intake yourself — the driver handles intake staging.

Report back:
- The package path created and the `STATUS.*` marker set
- A one-line summary of what IDEA.md captured
- Confirmation you did not write outside `PRD/work/quick-lookup-spec/`
- Whether the outcome is a normal package or `NO ACTIONABLE PACKAGE`

### define

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 3 (`define`) of an autonomous graph run. Invoke the `thejudge-refinement` skill and follow it exactly in graph mode. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Package: `PRD/work/quick-lookup-spec/`  ·  Run ID: `graph-20260826-174916`

## What this run produces

This is Phase A #5 of the docs-refactor gameplan: a current-state feature spec for the quick-lookup feature, authored on the DEC-168 template, landing at `PRD/sections/quick-lookup/README.md`. A feature spec is a derived, non-authoritative view that consolidates what quick-lookup does today out of the existing decision log, functional-requirements, user-flows, system-map, and screen-layout — so the owner can read one document instead of replaying a supersession chain.

Read first, in this order:
1. `PRD/work/quick-lookup-spec/README.md` and `PRD/work/quick-lookup-spec/IDEA.md` — the shaped package. The README already lists every backing source (DEC/REQ/FLOW/NFR/system-map/screen-layout), the full-backend-path structure to capture, and the rejected-alternatives reconciliation to preserve. Treat it as your starting map.
2. The four prior Phase A specs as worked templates: `PRD/sections/life-tracker/README.md`, `PRD/sections/user-feedback/README.md`, `PRD/sections/trade-balancer/README.md`, `PRD/sections/scan/README.md`. Match their shape exactly: a `Status:` draft/derived/non-authoritative marker, a `Backed by:` line listing every consolidated ID, then What it is, How it works (behavior grouped by surface, each carrying a `Built:` marker), Measured bounds, Rejected alternatives and deferred scope, and Where it lives.
3. DEC-168 in `PRD/sections/decisions/doc-process.md` — the template authority.

## Binding rules for this spec

- Mint NO new stable IDs. This is spec #5; specs #2-4 minted none. The spec is a derived view that CITES existing `DEC`/`REQ`/`FLOW`/`NFR` IDs — it does not add, change, retire, reorder, or renumber any of them, and it does not add a new DEC to authorize itself. Do NOT edit `PRD/sections/decisions.md`, any `PRD/sections/decisions/*.md`, `functional-requirements.md`, `user-flows.md`, `system-map.md`, or `screen-layout.md`. Your only `PRD/sections/` write is the new file `PRD/sections/quick-lookup/README.md`.
- Capture the full backend path, not just the UI: request validation, the branching prompt-assembly path, always-on rules retrieval, and the provider boundary. Read the actual source the package README names (`apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/prompt/*`, `gameRulesRetrieval.ts`, `apps/backend/src/providers/*`) so the current-state description is accurate, and cite the governing DEC/REQ beside each behavior.
- Preserve the rejected-alternatives reconciliation as a closed door: Card Lookup (DEC-097) and Rules Lookup (DEC-099) were designed and confirmed as two separate destinations, then reconciled into one destination / one wire mode (`mode: "lookup"`, DEC-106) / one branching enrichment path (DEC-107) before shipping. Record why (framed by DEC-107's Context), not just a superseded footnote.
- A measured bound travels with the behavior it constrains only if that surface still exists in code; a bound whose surface was replaced is dropped and named as a closed door; an ambiguous bound stays and is flagged.
- Draft and non-authoritative: the `Status:` marker states that a cited `DEC`/`REQ`/`FLOW` wins any conflict, and `PRD/sections/decisions.md` stays precedence #1 and Read-First #1.
- `PRD/README.md` gains one Section Inventory row for the new directory (navigation only) — match how the four prior specs registered theirs. Confirm the exact table location from the existing rows.
- The open questions Q-003 and Q-004 stay open; fold them in as deferred scope, do not decide them.

## Intake and product decisions

Intake at `PRD/work/quick-lookup-spec/intake/refactor-gameplan.md` is evidence, never authority. Do not open or fetch any document it cites — record only its path. This spec consolidates already-confirmed product truth; it must not introduce a new product decision. Apply the assumption ladder in `preparation-contract.md` per question, fresh, if an ambiguity arises. If you hit a genuine decision blocker under the three-condition test (a real fork in current-state truth you cannot resolve from the existing sources), STOP and report it as a blocker — do not invent product truth to keep going.

## Deliverables

- `PRD/work/quick-lookup-spec/DESIGN-BRIEF.md` — the design record.
- `PRD/sections/quick-lookup/README.md` — the spec itself, whole file, on the DEC-168 template.
- `PRD/README.md` — one Section Inventory row.
- The package `STATUS.*` marker per the skill's normal graph-mode transition.

Do NOT commit, push, create a worktree, or touch the concurrency lock, the stop sentinel, or the ledger `GRAPH-RUN.md`. The driver owns all of that and will handle the define-gate park.

Report back:
- The exact list of files you wrote (full paths)
- The `Backed by:` ID list you consolidated
- Confirmation you minted zero new IDs and edited zero existing source bodies
- Whether you hit any genuine decision blocker (and if so, what)
- The `STATUS.*` marker you set

### gate-qc

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 4 (`gate-qc`) of an autonomous graph run. Invoke the `thejudge-quality-check` skill and follow it exactly in graph mode. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Package: `PRD/work/quick-lookup-spec/`  ·  Run ID: `graph-20260826-174916`

Context: Phase A #5 of the docs-refactor gameplan, a current-state feature spec for quick-lookup on the DEC-168 template. Design record `PRD/work/quick-lookup-spec/DESIGN-BRIEF.md`; spec `PRD/sections/quick-lookup/README.md` (owner-accepted at the define gate, 6/6 sections, zero new IDs). Documentation/consolidation package, so downstream implementation is verify-only; validate the brief on those terms — PRD alignment and agent-readiness for a verify-and-correct implementation.

Validate `DESIGN-BRIEF.md` (PASS/FAIL + complete findings). Write no GAMEPLAN or slice docs, no `PRD/sections/` edit, no commit/push/worktree, no touch to the ledger/lock/sentinel. Set the `STATUS.*` marker per the skill (FAIL sets `STATUS.refining`). Report the verdict, findings, marker, and confirmation of scope.

### plan

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 5 (`plan`) of an autonomous graph run. Invoke the `thejudge-map-out` skill and follow it exactly in graph mode. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Package: `PRD/work/quick-lookup-spec/`  ·  Run ID: `graph-20260826-174916`

Context: Phase A #5 of the docs-refactor gameplan. The deliverable already exists and is owner-accepted at the define gate: spec `PRD/sections/quick-lookup/README.md` (untracked; driver commits at publish-before-build), design record `DESIGN-BRIEF.md`, one `PRD/README.md` row. `## Preparation gate` records `Quality-check: PASS`. Documentation/consolidation package, so the slices are VERIFY-ONLY (the pattern the four prior Phase A specs used); a slice verifies the authored spec against its cited sources, the DEC-168 template, and the backend/frontend files it names, and drift is fixed in build as a bounded sourced correction. Do not plan slices that add new product behavior or edit existing DEC/REQ/FLOW bodies.

Write `GAMEPLAN.md`, the lettered slice docs, and one `slice-<letter>.criteria.json` per slice (criteria `false`, real `evidence` block). Scope slices to verify the spec content vs cited sources and DEC-168 shape, the backend-path section vs the actual `apps/backend/src/` files, and the `PRD/README.md` row plus a package-wide diff-scope proof. Set `STATUS.active`. No `PRD/sections/` edit, no commit/push/worktree, no touch to the ledger/lock/sentinel. Report slices/criteria created, per-slice scope, the marker, and confirmation of no new IDs and no `PRD/sections/` edits.

### build

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

You are node 6 (`build`) of an autonomous graph run. Invoke the `thejudge-implement-all` skill and follow it exactly in graph mode. Copy the `Working directory:` line above, unchanged, into every prompt you write to any sub-step.

Package: `PRD/work/quick-lookup-spec/`  ·  Run ID: `graph-20260826-174916`

Branch/worktree: autonomous base (PR target) `thejudge-auto/quick-lookup-spec` (already pushed with the accepted spec + planning artifacts); shared PR head branch `thejudge-auto/quick-lookup-spec-work` (distinct from base); worktree `.worktrees/implement-quick-lookup-spec`.

This build: Phase A #5, a documentation/consolidation package — all three slices (A, B, C) are VERIFY-ONLY, no `apps/` code change. Verify the owner-accepted spec `PRD/sections/quick-lookup/README.md` against its cited sources, the DEC-168 template, and the backend/frontend files it names; apply only bounded, sourced corrections to the spec (not to code), citing existing IDs only, minting no new IDs, editing no existing DEC/REQ/FLOW body and no `thejudge-*` skill. Slice B independently re-verifies a grounded finding (accepted spec may omit Commander Spellbook combo retrieval in lookup mode — `preparation.ts` `resolveLookupComboCandidates`, DEC-116/REQ-094, `commander-spellbook-lookup-*` fixtures); apply the slice's bounded additive correction only if it re-verifies from source, else record why.

Run all remaining slices end to end; earn every criterion in every `slice-*.criteria.json` with real observed evidence; report ok only when every criterion is `true`. Set `STATUS.ship-ready`, then open the `-work`→base PR. Work only inside the worktree and/or `PRD/work/quick-lookup-spec/`; do not push to the base, do not merge/close the PR, do not force-push, do not touch the ledger/lock/sentinel. Report the PR URL, per-slice outcomes, all-criteria-true confirmation, the file list, the combo-correction decision, and the marker.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| Write the current-state feature spec for the quick-lookup feature — Phase A #5 of the docs-refactor gameplan. Land it at PRD/sections/quick-lookup/README.md on the DEC-168 template. It runs the full backend path — prompt assembly, retrieval, and the provider boundary — so capture that flow, not just the UI. Keep it draft and non-authoritative. | answered-once | shape | — |
