# Graph run — in-depth-spec

- Run ID: `graph-20260827-213634`
- Profile: `unverified`
- Canary: `denied — hook live (rm -rf .worktrees/.graph-canary-nonexistent)`; graph tier `denied — nohup true` while lock held
- Autonomous base: `origin/thejudge-auto/in-depth-spec`
- Staging: `.worktrees/.graph-intake/graph-20260827-213634/`
- Current node: `close` (resumed 2026-08-28 — PR #120 merged, land ok)
- Next action: `/graph-run PRD/work/in-depth-spec/`

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 5` | branch `thejudge-auto/in-depth-spec` created and pushed to origin; base `main`; tree clean; both canaries denied | 2026-08-27 |
| 2 | shape | sonnet | ok | `0 → 22` | package `PRD/work/in-depth-spec/` created; intake folded to `intake/refactor-gameplan.md`; commit `bfe6774`; 6 prior-run receipt matches in `IDEA.md` | 2026-08-27 |
| 3 | define | opus | ok | `0 → 44` | spec `PRD/sections/in-depth/README.md` (514 lines, new file, 0 deletions); `DESIGN-BRIEF.md`; `PRD/README.md` nav row; **0 new stable IDs**; status → refined | 2026-08-27 |
| 4 | gate-qc | sonnet | ok | `0 → 29` | PASS, 0 findings; all 69 DEC / 47 REQ / 5 FLOW / 3 NFR citations verified against index; entanglement ownership confirmed on owning specs; status stays refined | 2026-08-27 |
| 5 | plan | sonnet | ok | `0 → 46` | `GAMEPLAN.md` + 4 verify slices (A staged flow / B submit+conversation / C backend path / D header-nav+diff-proof), 29 criteria; STATUS.active; candidate finding: DEC-018/DEC-047/DEC-122/REQ-033 cited inline but absent from header Backed-by (additive fix in A/C/D) | 2026-08-27 |
| 6 | build | sonnet | ok | `0 → 216` | all 4 slices done, **29/29 criteria `value:true`** (A8/B6/C9/D6); PR [#120](https://github.com/ChrisMiho/TheJudge/pull/120) `thejudge-auto/in-depth-spec-work` → base; write-scope clean (all writes under `.worktrees/implement-in-depth-spec/`, launch checkout untouched); STATUS.ship-ready. Header gaps DEC-018/047/122/REQ-033 confirmed + additively fixed. **3 spec-vs-code discrepancies surfaced, left uncorrected (out of slice license), posted as PR comment for owner:** `gameStateNotes`/ADDITIONAL GAME STATE absent in `apps/` (system-map marks "planned"); `conversationHistory` per-message cap 10000 in code vs 2000 in REQ-027/DEC-038/spec; CONVERSATION HISTORY/SCOPE section order inverted vs `buildPromptText` | 2026-08-27 |
| 7 | review | opus | ok | `0 → 18` | **APPROVE.** No Critical/Important. Independently re-verified: diff purely additive (3164 insertions, 0 deletions, nothing under `apps/`, no DEC/REQ/FLOW/NFR body edit, one `PRD/README.md` nav row); the 4 additive header IDs resolve to real confirmed sources and stayed bounded (DEC-122 correctly header-excluded); slice-C backend labels/schema confirmed against `apps/backend/src/`. Confirmed all 3 deferred discrepancies real and the deferral correct. One non-looping Minor (harmonize the 2000-char cap hedge) | 2026-08-27 |
| 8 | land | — | ok | — | owner merged PR [#120](https://github.com/ChrisMiho/TheJudge/pull/120) 2026-08-28 (merge commit `eb9d737`); base `thejudge-auto/in-depth-spec` reconciled into launch checkout, GRAPH-RUN.md kept as fuller ledger, single marker STATUS.ship-ready | 2026-08-28 |

## Open gate

**Land gate resolved 2026-08-28.** The owner merged PR #120 (merge commit
`eb9d737`) into `thejudge-auto/in-depth-spec`. The run resumed, recorded `land`
ok, reconciled the merged base into the launch checkout, and proceeded to
`close` (`thejudge-cleanup`). No open gate remains.

The 3 spec-vs-code discrepancies below were merged as-is (draft, non-authoritative
spec) and remain a separate owner follow-up — cleanup carries them into the
receipt, it does not resolve them.

<details><summary>Resolved land-gate record (was: PARKED for owner merge)</summary>

Every automated node was `ok`: gate-qc PASS, plan (4 verify slices), build
(29/29 criteria), review **APPROVE** (no Critical/Important).

- **What to do:** review and merge **PR #120**
  (https://github.com/ChrisMiho/TheJudge/pull/120) —
  `thejudge-auto/in-depth-spec-work` → `thejudge-auto/in-depth-spec`. It is
  OPEN, MERGEABLE, CLEAN. The diff is purely additive (3164 insertions, 0
  deletions): the In-Depth spec plus the 4 bounded header-citation fixes
  (DEC-018/DEC-047/DEC-122/REQ-033) and one `PRD/README.md` nav row. Nothing
  under `apps/`, no DEC/REQ/FLOW/NFR body edited.
- **Read before merging — 3 spec-vs-code discrepancies build surfaced and left
  uncorrected** (posted as a PR comment; out of these verify slices' license
  because fixing them needs an authoritative REQ/DEC-body or `apps/` change).
  They are a separate follow-up decision, not blockers for this draft
  non-authoritative spec:
  1. `gameStateNotes` / the `ADDITIONAL GAME STATE` prompt section is absent
     from `apps/backend/src/` (system-map already marks it "planned"), yet the
     spec describes it as Built.
  2. `conversationHistory` per-message cap is `boundedText(10000)` in code vs
     the ≤2000 the spec reports from REQ-027/DEC-038.
  3. The `CONVERSATION HISTORY` / `SCOPE` prompt-section order in the spec is
     inverted relative to real `buildPromptText`.
- **Resume command (after merge):** `/graph-run PRD/work/in-depth-spec/` — it
  confirms PR #120 merged, records `land` ok, reconciles the ledger via a local
  merge of the base, and runs `close` (`thejudge-cleanup`) to promote durable
  truth, write the receipt, and delete the package folder.

</details>

### Prior gate — `define` (resolved 2026-08-27)

Resolved via `/graph-gate-review` — all 11 behavior sections walked one at a
time, every verdict `accept` (0 edits, 0 rejects, 0 new stable IDs); no change
applied to `PRD/sections/`. The recorded diff and per-section verdicts below
stay as the evidence of what was walked. The flagged
`MAX_CONVERSATION_HISTORY_CHARS` conflict (REQ-027 1,000,000 vs FLOW-005 6000)
was accepted as-flagged. See `## Gate verdicts` and the recorded diff.

### Recorded `PRD/sections/` diff

```diff
diff --git a/PRD/sections/in-depth/README.md b/PRD/sections/in-depth/README.md
new file mode 100644
index 0000000..45fedaa
--- /dev/null
+++ b/PRD/sections/in-depth/README.md
@@ -0,0 +1,514 @@
+# In-Depth Question — current-state feature spec
+
+- Status: draft, derived, non-authoritative view. On any conflict, the cited
+  `DEC`/`REQ`/`FLOW`/`NFR` wins — `PRD/sections/decisions.md` stays precedence #1
+  and Read-First #1. Correct this file against those sources, not the other
+  way around.
+- Backed by: DEC-002, DEC-003, DEC-004, DEC-005, DEC-006, DEC-007, DEC-008,
+  DEC-009, DEC-010, DEC-011, DEC-013, DEC-014, DEC-015, DEC-016, DEC-017,
+  DEC-019, DEC-020, DEC-021, DEC-022, DEC-023, DEC-024, DEC-025, DEC-026,
+  DEC-027, DEC-028, DEC-029, DEC-030, DEC-031, DEC-032, DEC-033, DEC-034,
+  DEC-035, DEC-036, DEC-037, DEC-038, DEC-039, DEC-040, DEC-041, DEC-042,
+  DEC-043, DEC-045, DEC-046, DEC-049, DEC-067, DEC-076, DEC-078, DEC-082,
+  DEC-091, DEC-092, DEC-094, DEC-096, DEC-102, DEC-106, DEC-116, DEC-118,
+  DEC-120, DEC-123, DEC-127, DEC-128, DEC-131, DEC-146, DEC-151, DEC-153,
+  DEC-156, DEC-158, DEC-160, DEC-161, DEC-162, REQ-001, REQ-002, REQ-003,
+  REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011,
+  REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019,
+  REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027,
+  REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-045, REQ-056, REQ-058,
+  REQ-061, REQ-069, REQ-070, REQ-093, REQ-094, REQ-095, REQ-100, REQ-106,
+  REQ-110, REQ-121, REQ-130, REQ-132, REQ-136, REQ-137, REQ-138, REQ-139,
+  REQ-144, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, NFR-001, NFR-002,
+  NFR-006
+- Consumed but owned elsewhere (cited, not re-specified here): the shared
+  answered-conversation workspace, View Context overlay, history drawer,
+  suite-wide card-detail popup, Menu rail, suite shell, and shared layout
+  language live in `PRD/sections/shared-chrome/`; the camera scan input path
+  (FLOW-006) lives in `PRD/sections/scan/`; the rules-retrieval and
+  combo-corpus machinery live in `PRD/sections/system-map.md`. In-Depth is a
+  consumer of each — this spec describes how In-Depth mounts and drives them,
+  not their internals.
+
+## What it is
+
+The primary MTG Assistant loop — the destination a player opens to get a real
+ruling on a live board. Instead of one card and one question, In-Depth walks the
+player through a short staged wizard: set the game up (players, life, turn
+phase), confirm which zones matter, add the cards in each zone, optionally
+annotate them, then type a question and hit **Send Request**. Behind that button
+runs the full Ask AI backend on its `mode: "game"` branch — the request carries a
+whole `GameContext`, the backend assembles one large prompt (general context,
+phase guidance, every populated zone with full card text, curated and retrieved
+Comprehensive Rules, per-card WotC rulings, and gated Commander Spellbook combo
+context), and the same provider boundary (mock by default, OpenAI live) returns a
+plain-text answer. The answer opens the shared chat workspace, where the game
+context is frozen and the player can ask text follow-ups that carry the whole
+conversation forward. It is an assistant, not a rules engine — it validates no
+legality, simulates no board state, and enforces no format (DEC-002, DEC-013).
+It is the largest and most entangled destination in the suite: it originates the
+staged flow, the game-mode request contract, the conversation thread, and the
+game-context UI, and it consumes shared chrome, the scan input path, and the
+retrieval/combo machinery that other specs own.
+
+## How it works
+
+### The staged flow, end to end
+
+- Built: In-Depth Question is a feature-portal destination (registry id
+  `in-depth`, DEC-094 / FLOW-010) reached through the shared Menu rail; it is the
+  suite's primary MTG Assistant feature, not the whole app. The staged flow is a
+  four-step wizard — **game context → zone confirmation → zone collection →
+  enrichment** — driven by a frontend state machine, then a submit that opens the
+  answered workspace. (FLOW-001, DEC-094)
+- Built: each staged step renders the active step name as an eyebrow label above
+  the step's own content, and a slim `TheJudge` / `MTG Assistant` brand block; the
+  answered-state header stays brand-only with no step name. (DEC-067, REQ-045; the
+  step name's header-row placement is superseded to the eyebrow by DEC-122, owned
+  by shared chrome.)
+- Built: Back and Continue preserve everything entered — moving back from zone
+  collection to zone confirmation does not delete cards, and changing the turn
+  phase adds newly assumed zones to the checklist without wiping existing cards or
+  enrichment. Progression is blocked when required values are missing or invalid.
+  (REQ-020, FLOW-001)
+
+### Step 1 — Game context
+
+- Built: the player sets the number of players (fixed `Player 1 … Player N`
+  labels), an optional display name per included label, a life total per label,
+  the active player when known, and one required turn phase defaulting to
+  `main_1`. Selects show `Player N (Name)` when a display name is set, but the
+  submitted API values stay fixed `PlayerLabel` strings. (REQ-015, DEC-023,
+  DEC-027)
+- Built: turn phase is one of `untap`, `upkeep`, `draw`, `main_1`, `combat`,
+  `main_2`, `end_step`, `cleanup`. When phase is `combat`, an inline sub-step
+  selector offers `beginning_of_combat`, `declare_attackers`, `declare_blockers`,
+  `combat_damage`, `end_of_combat`, defaulting to `declare_blockers`; the
+  `combatStep` field is submitted only for `combat` and omitted otherwise.
+  (REQ-015, DEC-022, DEC-034, DEC-037)
+- Built: the **Players in game** disclosure is collapsed by default. Each open
+  player card shows display name and life total as its compact baseline; Poison,
+  Energy, Experience, Commander damage, and populated named counters are gated
+  behind a per-player secondary-details arrow that drives **one synchronized,
+  collapsed-by-default all-player state** — activating any arrow expands or
+  collapses secondary fields for every active player, and mixed per-player states
+  cannot be produced. Closing the outer disclosure, or leaving and returning to
+  the destination, resets secondary details collapsed without clearing values.
+  (DEC-120, REQ-100)
+- Built: the per-player counter fields ride the additive optional `GameContext`
+  fields (`poison`, `experience`, `energy`, `commanderDamage` matrix, `counters`
+  list) threaded through Zod and prompt assembly; unset fields are omitted and the
+  wire contract is unchanged. These are the same fields the Player Life Tracker
+  seeds one-way into In-Depth. (DEC-102, REQ-015)
+- Built: an optional collapsible **ADDITIONAL GAME STATE** dropdown captures a
+  single freeform `gameStateNotes` string (collapsed by default) for cross-card,
+  transient context not inferrable from oracle text — active replacement effects,
+  who holds priority, pending delayed triggers, casting restrictions. It is
+  prompt-facing only, capped and control-character-guarded, and omitted from the
+  prompt when blank. (DEC-043, REQ-031)
+- Built: the players-section controls are ergonomic — the expand/collapse toggle,
+  add-player, and remove-last-player each meet a 44×44px touch target, the
+  expander is a prominent triangle, and the add/remove pair reads `−` (remove)
+  left / `+` (add) right. (DEC-091, REQ-069)
+- Built: the "Players in game" helper reads exactly `Tap ▾ to set names and life
+  totals — 2 players start at 20, 3+ at 40.`; the count-driven starting-life
+  behavior (2 → 20, 3+ → 40) is unchanged, this is copy only. (DEC-092, REQ-070)
+
+### Step 2 — Zone confirmation
+
+- Built: after game context, a zone checklist appears preselected from the chosen
+  turn phase (2 zones per phase by default). The player toggles any v1 zone —
+  `stack`, `battlefield`, `hand`, `graveyard`, `exile`, `library`, `command` — on
+  or off; selections are stored in `gameContext.selectedZones`, and at least one
+  zone is required to continue. Phase defaults are UX hints, not legality rules.
+  (REQ-016, DEC-024, DEC-035)
+- Built: the zone-confirmation helper reads exactly `Select all zones that apply
+  to your question.`; the prior turn-phase-defaults clause was intentionally
+  dropped. (DEC-092, REQ-070)
+
+### Step 3 — Zone collection
+
+- Built: for each selected zone the player adds card identities from local
+  metadata search — search box says **Type to begin**, suggestions begin at 3
+  characters, no-match shows **No matching card found**, and selecting a
+  suggestion opens a preview before an explicit Add. Stack cards preserve
+  bottom-to-top append order; a selected zone may hold zero cards individually,
+  but collection cannot continue until at least one selected zone contains a card.
+  (REQ-001, REQ-002, REQ-018, FLOW-001)
+- Built: the stack has its own capture rules — append-only, newest card becomes
+  the top (`stack[0]` is the bottom, last element is the top, consistent across
+  UI, payload, and prompt builder), the add button reads **Begin stackening!**
+  when empty and **Add to Stack** otherwise, duplicates are blocked with a
+  "not supported yet" notice, and the stack is capped at 10 cards. The stack icon
+  shows a live count and opens a details panel listing cards bottom-to-top with
+  per-card remove and thumbnails-when-available. (DEC-004, DEC-005, DEC-006,
+  DEC-007, DEC-008, DEC-009, DEC-018, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008,
+  REQ-009, REQ-010, FLOW-002, FLOW-004)
+- Built: added cards render in a horizontal left-to-right strip in add order with
+  horizontal region scroll (not document scroll), for every zone including stack;
+  each tile keeps Remove, stack-position label, and a card image sized to the
+  tile interior, with the corner detail popup as the read path. Non-stack cards
+  capture an owner. (DEC-151, DEC-160, REQ-130, REQ-058, FLOW-002)
+- Built: each `ZoneCardItem` carries a stable frontend-only `instanceId` assigned
+  once at add time, so adding the same card twice to a non-stack zone yields two
+  independent instances — removing or editing one leaves its siblings intact.
+  `cardId` stays the oracle identity; `instanceId` is stripped at the
+  `buildAskAiRequest` serialization boundary so the `.strict()` payload schema is
+  unchanged, and it never enables duplicate stack cards. (DEC-082, REQ-061)
+- Built: the camera scanner is an optional alternate input into the current zone
+  (owned by `sections/scan/`, FLOW-006): a confident lock auto-adds the scanned
+  card through the same add path (owner, duplicate-stack block, stack cap,
+  `ZoneCardItem` output). While scan is open, zone-collection search, the card
+  list, and outer staged-flow navigation are hidden; **Exit scan** returns to
+  manual collection. Scan resolves to oracle-level identity; the scanned
+  printing's art rides as presentation only. (DEC-050 via scan spec, DEC-070,
+  REQ-061)
+
+### Step 4 — Enrichment
+
+- Built: a default card-by-card wizard (OK advances) with an optional **View all
+  cards** full-list edit mode builds one ordered enrichment list across all
+  populated zones. Per card the player may optionally add a caster, targets, a
+  freeform context note, and mana-spent context for stack entries; the note
+  placeholder names transient annotations (kicker/buyback paid, X value, counters
+  added this turn, tapped status, gained abilities). (REQ-017, DEC-028, FLOW-001)
+- Built: targets use `ContextTarget` — player targets (`targetPlayer`), card
+  targets (`zone` + `cardId` + `cardName`), `{ kind: "none" }`, and freeform
+  (`targetDescription`); the public API never exposes the legacy `StackTarget`.
+  Card targets remain oracle-level even for duplicate instances. (DEC-026,
+  REQ-021, REQ-061)
+- Built: mana-spent context is deterministic for every stack entry — omitted
+  input falls back to `manaValue`, and the prompt emits mana-spent in stable
+  formatting. X-spell clarity is the primary motivation. (REQ-017)
+- Built: In-Depth's game-context counter UI (surfaced in the roster, edited in
+  the expanded secondary details) uses shared row patterns: poison, energy, and
+  experience are content-sized bounded selects stacked vertically at every
+  viewport (ranges 0–11 / 0–100 / 0–100, with an explicit Unset option), and the
+  commander-damage and named-counter rows use one grouped label-and-input pattern
+  rather than a stranded full-width grid; commander damage stays a free-typed
+  unbounded numeric input. (DEC-156, REQ-139, REQ-138, REQ-144)
+
+### Submit — Decrypt Stack
+
+- Built: the initial submit control's visible label is **Send Request**; its
+  accessible name retains Decrypt Stack / Ask semantics. Enrichment ready-state
+  copy points at the button when the optional question is blank. (DEC-153,
+  REQ-132, REQ-012)
+- Built: the optional question field accepts up to 300 characters of raw editable
+  text (trimmed before submit). A blank trimmed question uses a zone-aware
+  fallback in request/prompt logic — **Resolve the stack** when the stack zone has
+  cards, otherwise **Explain the interaction with the provided game state** when
+  another selected zone has cards — which may be shown as a pre-submit hint. The
+  pre-submit composer presents the field as the dominant row element with an
+  inline counter and compact submit, and grows with typed content without forcing
+  page scroll or clipping chrome below it. (REQ-011, DEC-146, DEC-131, REQ-121,
+  REQ-110)
+- Built: submit is allowed only when at least one selected zone holds a card. The
+  frontend sends `AskAiRequest = { question, gameContext }` on `mode: "game"`
+  (the default, back-compatible branch); no top-level `stack` or
+  `battlefieldContext` is sent, `gameContext.zones` includes only non-empty zone
+  arrays, and empty zone keys are omitted. (REQ-012, REQ-019, DEC-096, DEC-106)
+
+### The wait, the answer, and the conversation
+
+- Built: while the decrypt request is in flight, the submit form is replaced by
+  the `AskAiWaitingPanel` — a live elapsed timer with `aria-live` threshold
+  messages at 0s / 3s / 8s / 15s / 25s / 40s (CSS-only motion) — while the card
+  list and wizard context above the form stay visible. (DEC-031, REQ-023)
+- Built: on the first success the enrichment submit form is replaced by the shared
+  chat-first conversation workspace (owned by `sections/shared-chrome/`). The
+  first visible bubble is the assistant's answer; the initial user question is not
+  shown but rides in `conversationHistory`. The frozen game context is reachable
+  through a compact **View Context** trigger (phase + populated-zone count)
+  opening the read-only setup/zone/card/enrichment detail as an adaptive bottom
+  sheet / side drawer. (REQ-025, DEC-040, DEC-118)
+- Built: game context, zones, cards, and enrichment are **frozen** for the
+  duration of the conversation; follow-ups are text-only in v1. The docked
+  composer accepts up to 300 characters, shows an inline processing spinner while
+  in flight (never the full waiting panel), and appends a user bubble then an
+  assistant bubble on success. Assistant turns render as structured markdown; user
+  turns are solid right-aligned bubbles — the wire contract stays plain
+  `{ answer }`. (REQ-026, REQ-028, DEC-039, DEC-040, DEC-041, DEC-118, DEC-123,
+  DEC-127, FLOW-005)
+- Built: follow-up requests send `{ question: followUpText, gameContext: frozen,
+  conversationHistory }`. History is assembled client-side and includes the hidden
+  initial question (including any fallback) and first answer, then all subsequent
+  turns; the current follow-up text goes in `question`, not duplicated in history.
+  The backend inserts a `CONVERSATION HISTORY` section before `QUESTION`. History
+  is ephemeral — no server-side session store — though the workspace's browser-
+  local history drawer (shared chrome) can persist and resume completed
+  conversations. (REQ-027, DEC-038, DEC-039, FLOW-005)
+- Built: **Start Over** is visible once the first decrypt has succeeded and no
+  request is in flight. It clears the thread and returns to the game-context step,
+  clearing staged zones/cards/question/phase, but **preserves the player roster**
+  (count, names, life, poison/energy/experience, commander damage, custom
+  counters) so a game seeded from the Player Life Tracker is not wiped. A leaving
+  conversation with at least one answer auto-saves to completed history first.
+  (REQ-029, DEC-040)
+- Built: on any AI failure the app shows **Miho is working on it**, preserves game
+  context / zones / cards / enrichment / question, keeps the previous successful
+  answer visible, and offers a retry button on a 13-second cooldown. (DEC-014,
+  REQ-014, FLOW-003)
+
+## The full backend path (`mode: "game"`)
+
+In-Depth is the original and primary consumer of the whole Ask AI backend. The
+path below is the `mode: "game"` branch of the single product-facing
+`POST /api/ask-ai` endpoint (DEC-010); success `{ answer }` and error shapes are
+frozen across providers and shared with `mode: "lookup"` (Quick Lookup). The
+retrieval and combo machinery are owned by `system-map.md`; this spec states how
+the game-mode request drives them. (DEC-020, DEC-010)
+
+### Request validation
+
+- Built: `askAiRequestSchema` is a `mode`-discriminated union; a payload with no
+  `mode` key defaults to `"game"` for back-compat. The game branch is
+  `{ question, gameContext }` with no top-level `stack`/`battlefieldContext` and no
+  `card` field; `gameContext.zones` carries only non-empty zone arrays. The route
+  applies the shared Zod validation and error taxonomy. (DEC-096, DEC-106,
+  REQ-019, DEC-013)
+- Built: `gameStateNotes` is optional, trimmed, control-character-guarded, capped
+  at 2000 characters, and omitted by normalization when blank. `conversationHistory`
+  is optional (absent on first decrypt) and validated when present: non-empty,
+  ≤20 turns, ≤2000 chars/message, strictly alternating user/assistant starting
+  with user and ending with assistant. (REQ-031, REQ-027, DEC-043)
+
+### Prompt assembly (ordered sections)
+
+- Built: assembly builds one large prompt in a fixed section order:
+  `GENERAL GAME CONTEXT` → `ADDITIONAL GAME STATE` (when `gameStateNotes` present)
+  → `PHASE GUIDANCE` → populated zone sections → `GAME RULES (reference)` →
+  `ADDITIONAL RELEVANT RULE EXCERPTS` → `OFFICIAL RULINGS` → combo context (when
+  eligible) → `CONVERSATION HISTORY` (when present) → `SCOPE` → `QUESTION`. Stack
+  ordering (bottom-to-top) is preserved into the prompt builder. (DEC-025,
+  DEC-042, REQ-006, REQ-022, REQ-024, REQ-030, REQ-031)
+- Built: every prompt includes the static MTG reference block and a merged
+  zone-scope sentence. (DEC-025)
+- Built: `PHASE GUIDANCE` sits between general context and the zone sections and
+  carries phase-specific reasoning; when `turnPhase` is `combat` it is specific to
+  the submitted `combatStep`, falling back to generic combat framing when absent.
+  It is never omitted for a valid phase and adds no rules-validation behavior.
+  (DEC-036, DEC-037, REQ-024)
+- Built: every card in every populated zone section emits full metadata —
+  `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`,
+  `subtypes`, `targets`, `contextNotes` — not only stack items. Empty oracle text
+  renders `oracleText: (none) — no oracle text recorded for this card`. The stack
+  section keeps stack-specific fields (`stackRole`, `caster`, `manaSpent`);
+  non-stack sections use `owner` and zone item labels and omit `caster`. `cardId`
+  and `imageUrl` stay out of the prompt text. (DEC-042, REQ-030)
+
+### Retrieval enrichment (machinery consumed)
+
+- Built: `GAME RULES (reference)` loads verbatim WotC Comprehensive Rules
+  excerpts from committed artifacts, selected by DEC-045's always-on core plus
+  card-agnostic game-state-gated expansion (System 2, gated on `turnPhase`,
+  `combatStep`, and populated zones only — no card names or oracle text). It is
+  omitted only when the artifact is missing/empty, with a warning logged.
+  (DEC-030, DEC-045, REQ-022)
+- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
+  scored per DEC-046 (IDF-weighted lexical scoring with question and keyword
+  boosts, deduplicated against the System 2 selection), omitted when nothing
+  scores above 0. (DEC-032, DEC-046, REQ-022)
+- Built: `OFFICIAL RULINGS` carries published WotC Oracle rulings for submitted
+  cards. Retrieval relevance (System 2 selection and System 3 recall) is verified
+  by the eval harness against labeled expected outcomes, not structural checks
+  alone. (DEC-029, REQ-032, DEC-047)
+
+### Combo enrichment (machinery consumed)
+
+- Built: a committed, backend-only Commander Spellbook combo corpus (built from
+  the public bulk export, keyed on `oracleId` → `cardId`, gzipped per variant for
+  bounded memory) feeds gated retrieval. In `mode: "game"` without explicit combo
+  intent, retrieval returns only **complete** candidates — every ingredient and
+  quantity assigned to a distinct submitted card instance in a compatible starting
+  zone; with explicit combo intent (a narrow detector: `combo`, `infinite`,
+  `loop`, `win condition`, etc.), complete candidates rank first and partial
+  candidates may also return so the answer can name missing or wrongly-zoned
+  pieces. At most 5 variants are selected, deterministically ordered. (DEC-116,
+  DEC-162, REQ-093, REQ-094)
+- Built: eligible matches enter the prompt as a bounded
+  `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` section after
+  card/rules/rulings enrichment and before conversation history and the question.
+  Per-ingredient card state, `mustBeCommander`, produced effects, steps, mana
+  needed, and prerequisites are surfaced but never deterministically validated;
+  the classification never renders the bare word "complete", and instructions
+  keep WotC rules/card text as higher authority. No selected variants means no
+  section. (DEC-116, REQ-095)
+- Built: enrichment's answer-quality effect is measured only by an opt-in,
+  confirmation-gated, human-reviewed A/B against the live provider — never a
+  golden, never in `quality:check`, never a build gate. (DEC-161)
+
+### Provider boundary and diagnostics
+
+- Built: assembly produces one prepared prompt handed to the shared
+  `AskAiProvider.generateAnswer`; the provider consumes prompt text and never
+  inspects `mode`. Provider selection is explicit via `ASK_AI_PROVIDER` — mock is
+  the default and returns the exact assembled prompt (including
+  `CONVERSATION HISTORY`, frozen `gameContext`, phase guidance, and any combo
+  section) as its `answer` for inspection; `openai` is the live path. HTTP
+  contracts stay frozen across the swap and upstream failures map to the
+  normalized error shape ("Miho is working on it"). (DEC-020, DEC-011, DEC-017,
+  DEC-033, REQ-027)
+- Built: successful live answers emit log-only size diagnostics (`correlationId`,
+  `providerElapsedMs`, `answerChars`, `estimatedAnswerTokens`,
+  `charsPerTokenEstimate`); live responses stay `{ answer }` only with no sidecar,
+  and the stats never touch the prompt, answer, UI, or history. (DEC-049, REQ-033)
+
+## Measured bounds
+
+Bounds travel with a surface only while that surface still exists in code.
+Pixel/rem and calibration figures here are the current shipped configuration,
+outcome-validated, not product truth.
+
+- Stack cap: 10 cards; the 11th add is blocked (token-use/abuse guard). (DEC-008,
+  REQ-010)
+- Question field: up to 300 characters, measured against the **raw editable
+  textarea** content, not the client-composed submitted string. (REQ-011, REQ-121)
+- Player count: fixed `PlayerLabel` identity, bounded by the player-label model
+  (`MIN_PLAYERS`/`MAX_PLAYERS`, 2–8, matching the Life Tracker seed). Starting-life
+  default is count-driven: 2 → 20, 3+ → 40. (REQ-015, REQ-069, REQ-070)
+- Turn phase enum: `untap`, `upkeep`, `draw`, `main_1` (default), `combat`,
+  `main_2`, `end_step`, `cleanup`. Combat sub-steps: `beginning_of_combat`,
+  `declare_attackers`, `declare_blockers` (default), `combat_damage`,
+  `end_of_combat`. (DEC-022, DEC-034, DEC-037, REQ-015)
+- v1 zones: `stack`, `battlefield`, `hand`, `graveyard`, `exile`, `library`,
+  `command`; phase preselects 2 zones by default; empty selected zones are omitted
+  from the payload and prompt. (REQ-016, DEC-024, DEC-035)
+- `gameStateNotes`: capped at 2000 characters, control-character-guarded. (REQ-031,
+  DEC-043)
+- `conversationHistory` validation: 1–20 turns, ≤2000 chars/message, alternating
+  roles starting with user and ending with assistant. (REQ-027)
+- `MAX_PROMPT_CHAR_BUDGET`: `EFFECTIVELY_UNLIMITED_CHARS` = 1,000,000; diagnostics
+  still track prompt size/utilization. (DEC-042, REQ-022)
+- `MAX_CONVERSATION_HISTORY_CHARS`: **ambiguous / flagged.** REQ-027 sets it to
+  `EFFECTIVELY_UNLIMITED_CHARS` = 1,000,000 (DEC-042 amendment, "revisit after
+  latency/cost sampling"); FLOW-005's edge case still reads `6000`, oldest turns
+  truncated first. The two cited sources disagree; per this file's precedence
+  marker the reader should confirm the live constant against
+  `apps/backend/src/**` rather than trust either number. (REQ-027, FLOW-005,
+  DEC-042)
+- Retry cooldown: 13 seconds. (DEC-014, REQ-014)
+- Waiting-panel thresholds: 0s / 3s / 8s / 15s / 25s / 40s escalating copy.
+  (DEC-031, REQ-023)
+- Auto-scroll near-bottom threshold: 64px (shared conversation workspace). (DEC-118,
+  REQ-025)
+- Supplemental rules: up to 5 excerpts (System 3), deduplicated against System 2.
+  (DEC-046, REQ-022)
+- Combo variants: at most 5 selected per prompt — a relevance/noise cap
+  independent of the 1,000,000-char prompt budget. (DEC-116, REQ-094, REQ-095)
+- Enrichment **View all cards** mode: at most 4 full-width edit rows per zone
+  before internal scroll. (DEC-076, REQ-056)
+- Zone-collection strip: fixed `w-40` / 160px tiles, image grows to fill the tile
+  interior (≈92px → ≈144px) under DEC-160, horizontal region scroll. (DEC-151,
+  DEC-160, REQ-130)
+- Game-context player-detail controls (screen-layout In-Depth row, measured
+  identical at 390×844 and 1440×900): one shared 20×20 inline-SVG triangle
+  (rotated 90° when expanded) in an unboxed hit area — 56×44 outer roster toggle,
+  44×44 per-player; poison/energy/experience are 78px content-sized selects with
+  an explicit `Unset` option; three expanded players occupy 720px of
+  secondary-detail height; commander damage stays a free-typed unbounded numeric
+  input. (REQ-137, REQ-138, REQ-139, REQ-144, `screen-layout.md`)
+- Cat-wizard hero image (game-context step) is hidden on initial render and
+  revealed session-only after 10 clicks on the `TheJudge` brand title. (DEC-076,
+  REQ-056)
+- Layout/fit: staged steps are content-sized vertically (no stretch to fill lower
+  viewport); the answered workspace and the zone/enrichment lists region-scroll
+  per `screen-layout.md`'s five In-Depth rows. (DEC-145 via shared chrome, NFR-001)
+
+## Rejected alternatives and deferred scope
+
+- **Selected-cards-only capture model — closed door.** The original capture model
+  submitted only selected cards; DEC-003 replaced it with the structured
+  `GameContext` parent model (DEC-021) that the whole staged flow now builds. This
+  bound no longer attaches to any surface. (DEC-003, DEC-021)
+- **Top-level `stack` / `battlefieldContext` in the request — closed door.** The
+  request contract is `{ question, gameContext }`; validation rejects those legacy
+  top-level fields, and clients omit empty zone keys rather than sending empty
+  arrays. (REQ-019, DEC-096)
+- **Legacy `StackTarget` in the public API — closed door.** DEC-026 replaced it
+  with `ContextTarget`; the public API must not expose `StackTarget`. (DEC-026,
+  REQ-021)
+- **`stack_resolving` turn phase — closed door.** DEC-034 removed it from the
+  `TurnPhase` enum and set the default phase to `main_1`. (DEC-034)
+- **All-curated-topics-on-every-request rules baseline — closed door.** DEC-045
+  replaced it with an always-on core plus game-state-gated conditional expansion;
+  the flat baseline is no longer assembled. (DEC-045, REQ-022)
+- **DEC-032's flat +1-per-shared-word supplemental scoring — closed door.**
+  DEC-046 replaced it with IDF-weighted relevance scoring, question/keyword boosts,
+  and an improved tie-break. (DEC-046)
+- **Phase zone defaults wider than 2 zones — closed door.** DEC-035 trimmed
+  phase-defaulted zones to 2 per phase and excludes empty defaulted zones from the
+  payload and LLM context. (DEC-035)
+- **Structured `gameStateNotes` sub-fields per feedback category — closed door.**
+  DEC-043 made it a single freeform optional string. (DEC-043, REQ-031)
+- **The initial user question shown as a visible chat bubble — closed door.**
+  DEC-040 / REQ-025 hide it; it rides in `conversationHistory` only. (DEC-040,
+  REQ-025)
+- **`AskAiWaitingPanel` for follow-up turns — closed door.** DEC-041 replaced it
+  with an inline composer spinner; the full panel shows only on the initial
+  decrypt. (DEC-041, REQ-028)
+- **Start Over returning to the enrichment step with staged zones/cards preserved
+  — closed door.** REQ-029 now defines a full flow reset to the game-context step
+  that preserves only the player roster; the former "no history persisted after
+  start over" clause is also superseded by the browser-local history rules.
+  (REQ-029, DEC-124 via shared chrome)
+- **Visible **Decrypt Stack** label on the initial submit control — closed door.**
+  DEC-153 made the visible label **Send Request** (the accessible name still reads
+  Decrypt Stack / Ask); the answered follow-up send stays arrow-only. (DEC-153,
+  REQ-132, REQ-012)
+- **Two-column / four-visible-tile zone grid — closed door.** DEC-151 replaced it
+  with the horizontal add-order strip. (DEC-151, REQ-130)
+- **Fixed `max-h-32` card-image cap and image-box-bound (`absolute inset-0`)
+  detail popup — closed doors.** DEC-160 made card images container-relative and
+  DEC-158 freed the detail popup into the content-sized overlay family. (DEC-160,
+  DEC-158, DEC-151)
+- **Wide free-typed poison/energy/experience grid; small-triangle-in-a-box
+  expanders; `grid-cols-[1fr_auto]` stranded label/input rows; independent
+  per-player expansion — closed doors.** DEC-156/REQ-139 made them stacked bounded
+  selects; REQ-137 made the expander an unboxed SVG triangle; REQ-144 grouped the
+  label-and-input rows; DEC-120/REQ-100 made secondary details one synchronized
+  all-player state. (DEC-156, REQ-139, REQ-137, REQ-144, DEC-120, REQ-100)
+- **Snake_case Commander Spellbook wire reader and paginated REST walk — closed
+  doors.** DEC-162 established that upstream renders camelCase (a snake_case reader
+  matches nothing) and that the corpus is built from the bulk export, not a
+  paginated walk; the "complete" combo classification label is forbidden as
+  user-facing text. (DEC-162, REQ-093, REQ-094, REQ-095)
+- **Deferred, not cut:** mid-conversation zone/card-context editing — follow-ups
+  are text-only in v1 with the game context frozen (DEC-040); the prompt-char and
+  conversation-history budgets are set effectively unlimited pending latency/cost
+  sampling (DEC-042 / REQ-027); answer-quality A/B on combo enrichment stays
+  opt-in and informational, never a gate (DEC-161).
+- **Not owned here — consumed from other specs:** the shared answered-conversation
+  workspace, View Context overlay, history drawer, suite-wide card-detail popup,
+  Menu rail, suite shell, mock-mode banner, routing, and the shared layout
+  language are `sections/shared-chrome/`'s; the camera scan input path (FLOW-006)
+  is `sections/scan/`'s; the rules-retrieval System 1/2/3 internals and the combo
+  corpus build are `system-map.md` machinery; theme/personalization is not
+  In-Depth's. This spec cites where In-Depth mounts and drives them, not their
+  bodies.
+
+## Where it lives
+
+The staged flow and In-Depth destination live under
+`apps/frontend/src/lib/contextFlow/` (`flow.ts`, `steps.ts`,
+`phaseZoneDefaults.ts`) and `apps/frontend/src/components/`
+(`ZoneConfirmStep.tsx`, `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`,
+`EnrichmentStep.tsx`, `AskAiWaitingPanel.tsx`) with the destination shell in
+`apps/frontend/src/components/portal/MtgAssistantApp.tsx`, registered in
+`destinationRegistry.tsx`; stack limits, zone-card identity, and request assembly
+in `apps/frontend/src/lib/{stackLimits.ts,zoneCards.ts}` and the
+`buildAskAiRequest` boundary in `contextFlow/flow.ts`. The answered state reuses
+the shared `apps/frontend/src/components/{ConversationWorkspace,ConversationThread,AdaptiveContextDialog,FrozenGameContextDetails,FollowUpComposer}.tsx`
+and `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` (shared chrome). The
+game-mode backend runs through `apps/backend/src/routes/askAi.ts`,
+`validation/askAiRequest.ts` (the `mode: "game"` branch), `apps/backend/src/prompt/`
+(`preparation.ts`, `context.ts`, `normalization.ts`, `mtgReference.ts`,
+`phaseGuidance.ts`), the retrieval modules `apps/backend/src/{cardRulings,gameRules,gameRulesTopicSelection,gameRulesRetrieval}.ts`,
+the combo modules under `apps/backend/src/commanderSpellbook/`, and the provider
+boundary in `apps/backend/src/providers/`. See `PRD/sections/system-map.md`'s
+`## Frontend staged context flow`, `## Prompt assembly`, `## Game rules retrieval`,
+`## Provider boundary`, `## Backend API & validation`, `## Follow-up chat`,
+`## Decrypt waiting panel`, and `## Commander Spellbook combo retrieval` blocks for
+the full file lists, `PRD/sections/screen-layout.md`'s five `#### In-Depth —` rows
+for the layout bands, and `PRD/sections/shared-chrome/README.md` for the
+conversation-frame and layout-language details In-Depth consumes.
```

## Gate verdicts

Zero new stable IDs were minted, so `graph-gate-review`'s ID-centric walk was taken
over the spec's behavior sections, in diff order. One row per section.

| Section (walk item) | Verdict | Reason |
| --- | --- | --- |
| Framing & scope boundary (status marker, backed-by IDs, ownership) | accept | — |
| What it is | accept | — |
| Staged flow + Step 1 Game context | accept | — |
| Step 2 Zone confirmation + Step 3 Zone collection | accept | — |
| Step 4 Enrichment | accept | — |
| Submit — Send Request | accept | — |
| The wait, the answer, and the conversation | accept | — |
| Backend: request validation + prompt assembly | accept | — |
| Backend: retrieval + combo + provider boundary | accept | — |
| Measured bounds (incl. flagged `MAX_CONVERSATION_HISTORY_CHARS`) | accept | — |
| Rejected alternatives & deferred scope + Where it lives | accept | — |

The `MAX_CONVERSATION_HISTORY_CHARS` conflict (REQ-027 = 1,000,000 vs FLOW-005 = 6000)
was accepted as-flagged: the owner kept the spec's "confirm against source" note rather
than pick a number here. The underlying REQ-027/FLOW-005 disagreement is a separate fix,
outside this draft spec's scope.

## Dispatch prompts

### preflight

graph-run is controlling. You are node 1 (`preflight`) of an autonomous graph run. Run the `graph-preflight` skill end to end and report its results.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Branch: thejudge-auto/in-depth-spec
Slug: in-depth-spec

Invoke the graph-preflight skill (read `.claude/skills/graph-preflight/SKILL.md` and `PRD/instructions/graph-workflow-contract.md` first), then execute its procedure:

1. Run `npm run graph:preflight -- --branch thejudge-auto/in-depth-spec --run-id graph-20260827-213634 --dry-run`. Report the classification, the resolved base, the planned commands, and the `profile sentinel:` / `Profile:` lines verbatim.
2. If the action is `blocked`, stop and report the offending paths.
3. Otherwise re-run identically without `--dry-run`, passing the same `--run-id graph-20260827-213634`. This takes the concurrency lock, resolves the working tree, and creates and pushes branch `thejudge-auto/in-depth-spec`.
4. Confirm the end state: `git status --porcelain` (must be empty) and `git branch --show-current` (must be `thejudge-auto/in-depth-spec`).
5. Prove the hook is live with BOTH canaries:
   - Issue `CANARY_COMMAND` (the universal-tier canary the script names) as a real Bash tool call and require the hook to DENY it. Classify with `classifyCanary()` and report its ledgerLine.
   - AFTER the lock is taken, issue `GRAPH_CANARY_COMMAND` (the graph-tier canary) as a real Bash tool call and require a DENY. Classify with `classifyGraphCanary()` and report its ledgerLine.
   An ALLOWED canary of either kind means BLOCKED — report the verbatim message and stop.

Report back, clearly:
- The classification (auto-commit / stash / clean), and if a stash was taken, the exact `git stash list | grep graph-preflight/graph-20260827-213634` and `git stash apply <ref>` restore commands.
- The resolved autonomous base (`base:` line).
- Both canary ledgerLines verbatim.
- The Profile sentinel line verbatim.
- Confirmation the branch was pushed to origin, and the final `git status --porcelain` / `git branch --show-current` output.

Do not dispatch any further node — that is the driver's job. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged. Do not remove the lock; do not touch any stash beyond recording it.

### shape

graph-run is controlling. You are node 2 (`shape`) of an autonomous graph run. Run the `thejudge-kickoff` skill in orchestrated mode and return the created artifacts.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Supplied slug (use verbatim, do NOT propose your own): in-depth-spec
Branch: thejudge-auto/in-depth-spec

The owner's request, verbatim:
"Write the current-state feature spec for the in-depth feature — Phase A #7, the last of the docs-refactor gameplan. Land it at PRD/sections/in-depth/README.md on the DEC-168 template. It is the largest and most entangled feature, so lean on the patterns the earlier six specs established. Keep it draft and non-authoritative."

Staged intake (copied verbatim, evidence only — never authority): `.worktrees/.graph-intake/graph-20260827-213634/refactor-gameplan.md`

Invoke `thejudge-kickoff` (read its SKILL.md; because `graph-run is controlling`, also read `PRD/instructions/preparation-contract.md`). Then:

1. Create the package at `PRD/work/in-depth-spec/` — `IDEA.md` (3–5 sentences: problem, outcome, non-goals for this current-state in-depth spec), `README.md` with `status: ideation` at top, the empty `STATUS.ideation` marker, and a row under `## ideation` in `PRD/work/STATUS.md`.
2. Handle the staged intake ONLY after `PRD/work/in-depth-spec/` exists: copy `.worktrees/.graph-intake/graph-20260827-213634/refactor-gameplan.md` verbatim into `PRD/work/in-depth-spec/intake/`, commit it on branch `thejudge-auto/in-depth-spec`, then delete the staged copy — in that order.
3. Search `PRD/instructions/receipts/` for slug/keyword matches (the earlier six Phase A specs — life-tracker, user-feedback, trade-balancer, scan, quick-lookup, shared-chrome — will likely match). Write one `## Prior run` line per match into `IDEA.md` naming the receipt path. No match writes no section.

Treat the intake as evidence, never authority: do not open any document the intake cites (workflow.md, workflow-decomposition.md, answers.md) — record only paths. Every product decision the intake raises is made with the owner at the define gate.

This is a valid, actionable package (the request is a concrete, self-contained spec-authoring task with intake), so do NOT return `NO ACTIONABLE PACKAGE` unless you find a genuine reason it cannot be turned into one.

Stage explicit paths only — never `git add -A`, `git add .`, or `git add --all`. Never push `main`/`master`. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged.

Report back: the exact paths created, the intake path now inside the package, any `## Prior run` receipt matches found, and confirm the commit landed on the branch. Do not dispatch any further node — that is the driver's job.

### gate-qc

graph-run is controlling. You are node 4 (`gate-qc`) of an autonomous graph run. Run the `thejudge-quality-check` skill end to end against this package's DESIGN-BRIEF.md and return its PASS/FAIL report.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Package: PRD/work/in-depth-spec/
Slug: in-depth-spec

Invoke `thejudge-quality-check` (read its SKILL.md; because `graph-run is controlling`, also read `PRD/instructions/preparation-contract.md` and honor the run predicate — do NOT pause for user questions; apply the assumption ladder and, if a genuine three-condition blocker arises, report it back rather than asking).

Validate `PRD/work/in-depth-spec/DESIGN-BRIEF.md` for PRD alignment and agent-readiness. This is a derived, draft, non-authoritative current-state feature spec (Phase A #7); the deliverable already written is `PRD/sections/in-depth/README.md`, and the `define` gate has already been owner-reviewed (all 11 behavior sections accepted, zero new stable IDs). Judge the brief on its own contract: no new stable IDs, no behavior change, correct entanglement ownership, and a spec that matches the six prior Phase A specs' shape.

Produce ONLY a PASS/FAIL quality-check report — never a GAMEPLAN or slice docs. On FAIL, set STATUS.refining and state every finding concretely. On PASS, leave the package at STATUS.refined.

Do not dispatch any further node — that is the driver's job. Stage explicit paths only — never `git add -A`, `git add .`, or `git add --all`. Never push `main`/`master`. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged.

Report back: PASS or FAIL, the exact findings (or "none"), the artifact checked, and the resulting STATUS marker.

### plan

graph-run is controlling. You are node 5 (`plan`) of an autonomous graph run. Run the `thejudge-map-out` skill end to end and return the GAMEPLAN and slice docs it creates.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Package: PRD/work/in-depth-spec/
Slug: in-depth-spec

Invoke `thejudge-map-out` (read its SKILL.md and reference.md; because `graph-run is controlling`, honor the run predicate — do NOT pause for user questions; apply the assumption ladder and, if a genuine three-condition blocker arises, report it back rather than asking).

First verify the package README's `## Preparation gate` records `Quality-check: PASS` (it does — you may not self-certify it). Then slice this package into GAMEPLAN.md + lettered slice docs + one `slice-<letter>.criteria.json` per slice, and set STATUS.active.

Package context you must respect (do not re-decide it):
- This is Phase A #7, a derived, draft, non-authoritative current-state feature spec. The deliverable `PRD/sections/in-depth/README.md` was already authored and committed at the `define` node (514 lines, 0 new stable IDs), and the `define` gate was owner-reviewed (all 11 behavior sections accepted). `DESIGN-BRIEF.md` and the `PRD/README.md` Section Inventory nav row also already exist.
- Slice the remaining work to carry this package to ship-ready — verification and any not-yet-done PRD integration — not a re-authoring of the spec. Do not mint new stable IDs, change any In-Depth product behavior, or edit any DEC/REQ/FLOW/NFR body. Mirror the slice shape the earlier six Phase A spec packages used.
- Every criterion's evidence block must be earnable by a real tool call (command pattern or file path), or `"manual": true` for a genuine human-eyes check.

Do not dispatch any further node — that is the driver's job. Stage explicit paths only — never `git add -A`, `git add .`, or `git add --all`. Never push `main`/`master`. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged.

Report back: the GAMEPLAN path, every slice doc + criteria.json path created, the slice count and one-line summary each, and confirm STATUS.active is set.

### build

graph-run is controlling. You are node 6 (`build`) of an autonomous graph run. Run the `thejudge-implement-all` skill end to end: implement every remaining slice in the GAMEPLAN in one worktree, then open the pull request.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Package: PRD/work/in-depth-spec/
Slug: in-depth-spec
Autonomous base: origin/thejudge-auto/in-depth-spec
Shared PR head branch (use verbatim): thejudge-auto/in-depth-spec-work

Invoke `thejudge-implement-all` (read its SKILL.md and reference.md; because `graph-run is controlling`, honor the run predicate — do NOT pause for user questions; apply the assumption ladder and, if a genuine three-condition blocker arises, report it back rather than asking). The package README carries `## Autonomous metadata` (base recorded) and `## Preparation gate: PASS`.

Requirements:
- Create the one package worktree at `.worktrees/implement-in-depth-spec` and do all work there. Every path you write must lie inside `.worktrees/implement-in-depth-spec/` or `PRD/work/in-depth-spec/`.
- Use the shared PR head branch `thejudge-auto/in-depth-spec-work` (distinct from the base) so the PR is `-work` → `origin/thejudge-auto/in-depth-spec` and shows the whole deliverable. Do NOT derive the head as the same name as the base.
- These are 4 verify-only slices (A staged flow, B submit+conversation, C `mode:"game"` backend path, D header-nav+diff-proof) over the already-authored, committed spec `PRD/sections/in-depth/README.md`. Each slice VERIFIES the spec section against its cited DEC/REQ/FLOW/NFR sources (and, for C, real `apps/backend/src/` code), and applies only bounded, additive corrections the slice doc and its `criteria.json` authorize — chiefly the header Backed-by citation gap (DEC-018/DEC-047/DEC-122/REQ-033). Do NOT re-author the spec, mint new stable IDs, change In-Depth product behavior, or edit any DEC/REQ/FLOW/NFR body.
- Earn every criterion in every `slice-*.criteria.json` with real tool calls; the node is `ok` only when all 29 criteria across all four slices are `true`. When all slices complete, set STATUS.ship-ready.

Do not dispatch any further node — that is the driver's job. Stage explicit paths only — never `git add -A`, `git add .`, or `git add --all`. Never push `main`/`master`, never force-push, never merge/close the PR. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged.

Report back: the worktree path, the PR URL, the head and base branches, each slice's completion + its criteria all-true confirmation, every path written (to prove write-scope), and the resulting STATUS marker.

### review

graph-run is controlling. You are node 7 (`review`) of an autonomous graph run — a fresh-context, NO-WRITE reviewer. You hold no Write/Edit/NotebookEdit; you read and search only. Do not modify any file. A reviewer that can change the work is not reviewing it.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Package: PRD/work/in-depth-spec/
PR: #120 — head `thejudge-auto/in-depth-spec-work` → base `thejudge-auto/in-depth-spec`

What to review: the build node's work on this package. See the diff with `gh pr diff 120` (and/or `git -C .worktrees/implement-in-depth-spec diff 3045e60...HEAD`). The corrected deliverable is `.worktrees/implement-in-depth-spec/PRD/sections/in-depth/README.md`.

The rubric is the slices' OWN acceptance criteria — nothing else. Read all four slice docs and their criteria files:
- `PRD/work/in-depth-spec/slice-a-verify-staged-flow.md` + `slice-a.criteria.json` (8 criteria)
- `PRD/work/in-depth-spec/slice-b-verify-submit-and-conversation.md` + `slice-b.criteria.json` (6)
- `PRD/work/in-depth-spec/slice-c-verify-backend-path.md` + `slice-c.criteria.json` (9)
- `PRD/work/in-depth-spec/slice-d-header-nav-and-diff-proof.md` + `slice-d.criteria.json` (6)
(Read these from the worktree copies under `.worktrees/implement-in-depth-spec/` — they carry the final `value:true` states and evidence.)

This is a derived, draft, non-authoritative current-state spec (Phase A #7). The slices are VERIFY-ONLY with a single licensed additive correction: adding inline-cited-but-unlisted IDs (DEC-018/DEC-047/DEC-122/REQ-033) to the header. Grade whether: (a) each criterion's claim is actually supported by the cited source it names; (b) the additive header corrections are correct and stayed additive/bounded; (c) the package diff introduced no new stable ID, no behavior change, and no edit to any DEC/REQ/FLOW/NFR body.

Severity rule (binding): a preference, a style note, or any improvement OUTSIDE a slice's stated acceptance criteria is NEVER Critical or Important and never loops back to build — say so explicitly in your report. In particular, the build node surfaced three spec-vs-code discrepancies (`gameStateNotes`/ADDITIONAL GAME STATE not in `apps/`; `conversationHistory` cap 10000-in-code vs 2000-in-source; CONVERSATION HISTORY/SCOPE prompt-order) and deliberately LEFT them uncorrected because fixing them is outside these verify slices' license and would require changing authoritative REQ/DEC bodies or code. Those are correctly deferred owner-follow-up items, NOT defects in this deliverable — do not rate them Critical/Important and do not loop to build over them. You may note in your report whether that deferral was the right call.

Return a clear verdict: APPROVE, or a findings list where each finding has a severity (Critical / Important / Minor) and cites the exact criterion or diff line it fails. Only Critical/Important tied to a slice's own acceptance criteria may loop back to build. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged.

### close

graph-run is controlling. You are node 9 (`close`) of an autonomous graph run. Run the `thejudge-cleanup` skill end to end to close out this ship-ready package.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run ID: graph-20260827-213634
Package: PRD/work/in-depth-spec/ (STATUS.ship-ready)
Base branch (already checked out): thejudge-auto/in-depth-spec — PR #120 is MERGED (commit `eb9d737`).

Invoke `thejudge-cleanup` (read its SKILL.md; because `graph-run is controlling`, honor the run predicate — do NOT pause for user questions). Then:

1. Verify slice completion (all 4 slices done, 29/29 criteria `value:true`) and that the deliverable `PRD/sections/in-depth/README.md` is in place with the merged additive header fixes.
2. Promote any durable PRD truth this package produced. Note: this is a derived, draft, non-authoritative current-state spec; the spec file already lives at `PRD/sections/in-depth/README.md` and the `PRD/README.md` nav row already exists. No new stable IDs, no DEC/REQ/FLOW/NFR body changes.
3. Write the durable receipt under `PRD/instructions/receipts/`. It MUST include a `## Graph run` section carrying this package's `GRAPH-RUN.md` `## Node ledger` and `## Instruction ledger` **verbatim** (the contract's ledger-outlives-the-run rule — the delete is refused if the ledger exists and that section does not). Also record, as an explicit **owner follow-up** item in the receipt, the 3 spec-vs-code discrepancies build surfaced and the owner merged as-is: (a) `gameStateNotes`/`ADDITIONAL GAME STATE` absent from `apps/backend/src/` (system-map marks "planned") though the spec calls it Built; (b) `conversationHistory` per-message cap `boundedText(10000)` in code vs ≤2000 in REQ-027/DEC-038/spec; (c) `CONVERSATION HISTORY`/`SCOPE` prompt-section order inverted vs real `buildPromptText`. These are follow-up, not resolved here.
4. Update `PRD/work/STATUS.md` (remove the ship-ready row) and delete `PRD/work/in-depth-spec/`.
5. Commit the receipt + STATUS.md update + package deletion on branch `thejudge-auto/in-depth-spec`. Do NOT push — the driver performs the final push. Do NOT touch `main`/`master`, do NOT force-push, do NOT merge/close anything.

Stage explicit paths only — never `git add -A`, `git add .`, or `git add --all`. If you write any prompt for a sub-subagent, copy the `Working directory:` line above into it unchanged.

Report back: the receipt path, confirmation the `## Graph run` section is present with both ledgers verbatim, the STATUS.md change, confirmation the package folder is deleted, and the commit hash. Do not dispatch any further node.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "Write the current-state feature spec for the in-depth feature — Phase A #7, the last of the docs-refactor gameplan. Land it at PRD/sections/in-depth/README.md on the DEC-168 template. It is the largest and most entangled feature, so lean on the patterns the earlier six specs established. Keep it draft and non-authoritative." | answered-once | shape | — |
| "ok its merged" | answered-once | land | — |
