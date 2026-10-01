# Gate questions — ui-reimagining-build

**What you need to do: Decide.** Answer each block below with `accept`, `edit`, or `reject` (a reason is required for `edit` and `reject`). Nothing here is live product truth yet: every diff is a proposal that the build applies to `PRD/sections/` together with the code, only for the ids you accept.

**What this is:** the product rules for building the owner-approved direction-1 look (fourteen mockup rounds, 2026-09-24 → 2026-09-29) into the shipped app — the colour's ambient scene, one Ask a Question door with the four-station In-depth flow, the two-pile Trade Balancer, the re-dressed scanner, and the shared pop-up sheets. The brief behind it is `DESIGN-BRIEF.md` in this folder.

**How to answer quickly.** There are 57 blocks in three groups.

1. **Real choices (9 blocks).** Each changes what a player can do or what the AI receives. Each carries a recommendation. REQ-211 (Copies) is the one I recommend rejecting for now.
2. **The build's shape (8 blocks).** New requirements for the look and layout the owner approved in the mockups, plus Life Tracker's back menus. Recommended: accept.
3. **Follow-on wording (40 blocks).** Each updates an older entry so it stops contradicting a block above. Each names the block it follows: accept it when you accepted that one, reject it when you rejected that one.

New ids reserved here (not yet in `PRD/sections/`): REQ-206, REQ-207, REQ-208, REQ-209, REQ-210, REQ-211, REQ-212, REQ-213, REQ-214, REQ-215. Every other id is an in-place amendment of an existing entry. No new `DEC-###` is proposed; the decision log is retired.

---

**Group 1 — real choices** (not a stable id; blocks follow)

## REQ-167 — Ask a Question holds up to 10 cards, not 5

**What this decides:** whether a player can attach up to ten cards to one question instead of five.

**In plain terms:** Today Quick Question takes at most five cards, and the server refuses a sixth (REQ-167; the owner set five at a gate review on 2026-08-30, down from a suggested six). The approved mockup attaches up to ten, the same as the Stack's ten-card limit, so every card on the new card stage can be carried into In-depth details. Saying yes raises the cap to ten on the page and in the server's check of the request (the request validation). The prompt already loops over however many cards arrive, so nothing else in the answer path changes.

**What happens if you say no:** the cap stays five; the stage's count pill reads "n / 5", and carrying cards into In-depth details carries at most five.

**Recommendation:** accept — it is one number on each side, and it keeps the carry into a ten-card Stack whole.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -3878,3 +3878,3 @@
   - The lookup request carries an optional **bounded list** of cards in place of the single optional card; each entry carries only identity — `cardId` (oracle id) and `name` — and carries no zone, owner, caster, targets, or context-notes fields. The descriptive block (`oracleText`, `imageUrl`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`, `subtypes`) is no longer part of the request; the backend resolves the card-intrinsic fields server-side by `cardId` from `cardDetailByOracleId.json.br` (REQ-175, REQ-176). The per-card enrichment below is unchanged — it resolves each attached card's metadata server-side rather than from the request.
-  - The pre-submit view lets the player add, preview, and remove more than one card; an explicit cap of **5 cards** is enforced and stated to the player so the prompt stays bounded.
+  - The pre-submit view lets the player add, preview, and remove more than one card; an explicit cap of **10 cards** — the same number as the Stack's limit (REQ-010) — is enforced and stated to the player so the prompt stays bounded.
   - Backend enrichment runs per attached card: each card's full metadata (same per-card formatting as populated-zone cards, DEC-042/REQ-030) and each card's WotC rulings (DEC-029) appear; System 3 supplemental retrieval (DEC-046/REQ-022) scores the question plus a compact signal for every attached card — name, type line, and keyword list. It no longer scores over each card's full oracle text, which was measured to drop supplemental recall@5 from 0.577 to 0.026 on a labelled benchmark (REQ-178).
@@ -3898,5 +3898,6 @@
   - Amends REQ-094's `mode: "lookup"` combo criterion: the required match instance was the single attached card; it becomes the bounded attached-card set — a candidate qualifies on containing any one attached card, and attached-card coverage ranks results ahead of popularity. REQ-094 carries the reciprocal "amended by REQ-167" note and lists REQ-167 as a dependency. The zero-card and single-card lookup cases, and all of game-mode retrieval, are unchanged.
-  - Screen-layout's "Quick Question — pre-submit" row was re-measured for the multi-card add strip on 2026-08-30 and again on 2026-09-24. The 2026-08-30 reading accepted page scroll past the composer with 2+ cards attached; the `ui-reimagining` pass withdraws that (REQ-129 as amended) and binds the attached-card region so Send Request stays in the first viewport at all five cards. That row is the authority; this note is no longer an instruction to re-measure.
+  - Screen-layout's "Quick Question — pre-submit" row was re-measured for the multi-card add strip on 2026-08-30 and again on 2026-09-24. The 2026-08-30 reading accepted page scroll past the composer with 2+ cards attached; the `ui-reimagining` pass withdrew that (REQ-129 as amended), and the `ui-reimagining-build` card stage (REQ-206) keeps the send in the first viewport at every card count up to the cap. That row is the authority; this note is no longer an instruction to re-measure.
   - Does not resolve Q-003 (lightweight game context) or Q-004 (answer-seeded second-pass retrieval); both stay open.
   - Gate review (2026-08-30) tightened the add cap from a suggested ~6 to a fixed 5, and directed that lookup-mode combo answers explain a completed combo when the attached cards fully assemble it, and otherwise name the missing piece(s) and describe what would fill them. The define loop (2026-08-30) settled those mechanics in REQ-094 (amended): "complete" = every ingredient slot filled by an exact/template match in the attached set, with REQ-094's zone/quantity checks dropped for a board-less mode; "partial" = qualifies on at least one attached card but leaves a slot unmatched; lookup selection order is complete-before-partial, then attached-card coverage, then fewer missing, then popularity, then variant id. The answer is REQ-095's existing present/missing rendering, and "what would fill the role" is the missing ingredient's own identity/template from the combo catalog, not a card recommendation. No new stable ID was needed.
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the cap rises from 5 to 10 so every card on the Ask a Question stage can be carried into In-depth details, whose Stack holds 10 (REQ-206, REQ-010). The 2026-08-30 gate review had set 5; the owner's direction-1 mockup rounds set 10. The request validation's bound moves with it; the single lookup assembly loop is unchanged.
 
--- a/PRD/sections/quick-lookup/README.md
+++ b/PRD/sections/quick-lookup/README.md
@@ -21,3 +21,3 @@
 more cards in mind or doesn't, and wants a fast Magic rules answer without
-staging a whole game. They optionally attach up to 5 cards — each by typed
+staging a whole game. They optionally attach up to 10 cards — each by typed
 search or camera scan — then type a question (or pick a rules topic), and get
@@ -49,3 +49,3 @@
   header. (DEC-113, REQ-073, REQ-167)
-- Built: card input is optional and bounded to at most 5 cards (REQ-167). The
+- Built: card input is optional and bounded to at most 10 cards (REQ-167). The
   player adds each card by typed autocomplete search (REQ-001/REQ-002 behavior)
@@ -170,4 +170,4 @@
   REQ-167)
-- Built: `cards` is an optional bounded list of at most 5 entries (REQ-167,
-  amending DEC-106's single optional `card`); a 6th entry is rejected by
+- Built: `cards` is an optional bounded list of at most 10 entries (REQ-167,
+  amending DEC-106's single optional `card`); an 11th entry is rejected by
   validation. Each entry carries only `cardId` (oracle id), `name`, and
@@ -336,3 +336,3 @@
   (DEC-046, REQ-022, REQ-178, REQ-181, REQ-182, REQ-167)
-- Card attach cap: the pre-submit card-attach strip accepts at most 5 cards
+- Card attach cap: the pre-submit card stage accepts at most 10 cards
   (REQ-167); an add attempted past the cap is blocked with a stated limit
```

- Verdict: accept
- Reason:

## REQ-025 — Your own question opens the conversation

**What this decides:** whether the chat shows the player's first question as their own bubble above the judge's ruling.

**In plain terms:** Today the first thing in a conversation is the judge's answer; the question you asked is sent to the AI but never drawn (REQ-025, and the In-depth spec lists showing it as a closed door). The approved mockup draws your question on the right in the colour's accent, then the ruling under it, for both kinds of question. Saying yes shows the first question the same way follow-ups already show, exactly as it was sent — so a blank question box shows the fallback the app sent, such as "Resolve the stack". Nothing sent to the AI changes. REQ-075, FLOW-005 and FLOW-011 carry the same change for Ask a Question and follow-ups.

**What happens if you say no:** the thread keeps opening on the judge's answer with your first question hidden.

**Recommendation:** accept — the owner approved this look across the rounds, and it makes a reopened conversation readable on its own.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -433,3 +433,3 @@
 - Priority: high
-- Description: After a successful Decrypt Stack, the enrichment step must replace the submit form with the shared chat-first conversation workspace, whose first visible message is the assistant's initial answer and whose frozen game context is available through an adaptive read-only context trigger/sheet/drawer.
+- Description: After a successful Decrypt Stack, the enrichment step must replace the submit form with the shared chat-first conversation workspace, whose first visible message is the player's own question as sent (including any fallback) followed by the assistant's initial answer, and whose frozen game context is available through an adaptive read-only context trigger/sheet/drawer.
 - Acceptance Criteria:
@@ -440,4 +440,4 @@
   - open frozen context remains read-only and does not allow zone, card, or enrichment edits; close/Escape restores focus to the trigger
-  - a scrollable accessible conversation log is the workspace's dominant surface; its first visible bubble is the assistant's answer
-  - the initial user question is not shown in the thread
+  - a scrollable accessible conversation log is the workspace's dominant surface; its first visible bubble is the player's question as sent, followed by the assistant's answer
+  - the initial user question is shown in the thread as a right-aligned user bubble, exactly as sent (the zone-aware fallback when the question box was blank)
   - error/retry, composer, and Start Over occupy stable shared-workspace rows; the composer is docked within the workspace and is not fixed to the viewport
@@ -445,3 +445,3 @@
 - Constraints:
-  - thread opens with the assistant answer only; do not show the initial user question as a visible bubble
+  - the initial question bubble is presentation only: `conversationHistory` assembly, request payloads, and prompt text are unchanged
   - layout changes must not change request payloads, prompt assembly, answer rendering, or conversation-history behavior
@@ -454,2 +454,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): reverses the "initial question hidden" rule — the owner's direction-1 mockup shows the player's question first on both question kinds; REQ-075 carries the Ask a Question side
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -240,7 +240,8 @@
   chat-first conversation workspace (owned by `sections/shared-chrome/`). The
-  first visible bubble is the assistant's answer; the initial user question is not
-  shown but rides in `conversationHistory`. The frozen game context is reachable
-  through a compact **View Context** trigger (phase + populated-zone count)
-  opening the read-only setup/zone/card/enrichment detail as an adaptive bottom
-  sheet / side drawer. (REQ-025, DEC-040, DEC-118)
+  thread opens with the player's question as sent (the fallback when the box was
+  blank) as a right-aligned bubble, then the assistant's answer; the question also
+  rides in `conversationHistory` exactly as before. The frozen game context is
+  reachable through a compact **View Context** trigger beside the title, opening
+  the read-only setup/zone/card/enrichment detail as an adaptive bottom sheet /
+  side drawer. (REQ-025, DEC-040, DEC-118, REQ-209)
 - Built: game context, zones, cards, and enrichment are **frozen** for the
@@ -484,5 +485,6 @@
   DEC-043 made it a single freeform optional string. (DEC-043, REQ-031)
-- **The initial user question shown as a visible chat bubble — closed door.**
-  DEC-040 / REQ-025 hide it; it rides in `conversationHistory` only. (DEC-040,
-  REQ-025)
+- **The initial user question hidden from the thread — superseded.** DEC-040 kept
+  the thread opening on the answer alone; the `ui-reimagining-build` pass (REQ-025
+  as amended, 2026-09-30) shows the question first, as the owner's approved design
+  does. The request and history contract never changed.
 - **`AskAiWaitingPanel` for follow-up turns — closed door.** DEC-041 replaced it
```

- Verdict: accept
- Reason: owner wrote "approved"

## REQ-099 — A custom Colorless colour is kept readable

**What this decides:** whether the app nudges a player's custom Colorless colour just enough to keep text readable.

**In plain terms:** Colorless lets a player pick any colour. Today that colour is applied exactly as picked with no contrast check, even when it makes text hard to read (REQ-099; the colour rules in REQ-200 exempt it on purpose). The approved mockup applies a custom colour to every themed surface and lifts it only where it would fail readability — accent text and the scene's dust to 7:1 against the ground, filled controls to 2.4:1, and text on a filled control switched to white or near-black — keeping the hue the player chose. Saying yes replaces "exactly as picked" with "your hue, made readable". REQ-200 and FLOW-007 carry the same change.

**What happens if you say no:** a custom Colorless colour keeps applying exactly as picked, readable or not.

**Recommendation:** accept — the new scene and surfaces make an unreadable pick far more visible than today.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2379,4 +2379,4 @@
   - selecting Colorless with no saved custom value applies its fixed gray tokens and exposes an inline native full-spectrum color input plus `Reset to gray`
-  - choosing a custom color assigns the exact RGB unchanged to `accent`, `accent-strong`, and `accent-soft`, leaves `accent-contrast` white, applies immediately, persists separately, and is restored after switching away from and back to Colorless
-  - custom Colorless applies with no validation, warning, rejection, derived tint/shade, or contrast correction; low-contrast custom results are accepted
+  - choosing a custom color applies its hue to every token-driven surface, applies immediately, persists separately as the exact RGB picked, and is restored after switching away from and back to Colorless
+  - custom Colorless is lifted only where it would fail readability, keeping its hue: accent text and decorative dust reach at least 7:1 against the page ground, filled controls at least 2.4:1, and text on a filled control is white or near-black, whichever reads; there is no warning or rejection, and a readable pick is applied unchanged
   - `Reset to gray` removes only the saved custom RGB and immediately reapplies the fixed Colorless values
@@ -2408,2 +2408,3 @@
   - amended for the `ui-reimagining` pass (2026-09-24): REQ-200 adds surface roles per profile without changing any published hex value or the Colorless custom-RGB contract. Colorless's "artifact" reading — steel, brushed metal, a hint of warmth — is expressed through those new roles and REQ-201's motif language, not by editing Colorless's four published values
+  - amended for the `ui-reimagining-build` pass (2026-09-30): "deliberately uncorrected" custom Colorless becomes "your hue, made readable" (REQ-207); the stored value is still the exact pick, so Reset to gray and persistence are unchanged. The constraint's "no custom-Colorless contrast guarantee" is superseded by the lift above; the lift is a fixed rule, not a generated theming engine
 
```

- Verdict: accept
- Reason:

## REQ-210 — Mana spent can be set on any zone's card (new, owner-edited: every zone)

**What this decides:** whether every zone's card gets the same "Mana spent" box a Stack card has, and whether a changed value reaches the AI.

**In plain terms:** Today only Stack cards have a Mana spent box; a blank box falls back to the card's printed mana value in the prompt (REQ-017). Some permanents and cards in other zones care how much mana was spent to cast them (X creatures, converge, sunburst), so the box goes on every zone's card, prefilled with the printed cost. Saying yes adds the box everywhere — Battlefield, Graveyard, Hand, and the rest — and adds a mana-spent line to that card in the prompt — only when the player changes the number. An untouched box sends nothing, so today's prompts stay byte-for-byte the same. The request already accepts the field on any card; only the prompt and the form change. The owner chose the broad version now and expects the use cases to be narrowed later.

**What happens if you say no:** the box stays on Stack cards only.

**Recommendation:** accept — small, and an untouched box changes nothing.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,20 @@
 
+### REQ-210
+- Title: Mana spent for every zone's cards
+- Priority: low
+- Description: Every zone's card in In-depth details' Context station carries the same optional Mana spent box as a Stack card, so a question about a card that cares how much mana was spent to cast it (X, converge, sunburst), in any zone, can say so. The box is prefilled with the card's printed mana value and hints its printed cost; only a value the player changes is sent and emitted in the prompt.
+- Acceptance Criteria:
+  - the Context sheet shows a plain number box labelled Mana spent on every zone's card, prefilled with the card's printed mana value and hinting its printed cost (for example "printed {R}")
+  - a box left at its prefilled value sends no `manaSpent` for that card: a Stack card's prompt keeps today's fallback to `manaValue` (REQ-017) and a non-Stack card's prompt emits no mana-spent line, so an untouched form produces today's prompt byte-for-byte
+  - a changed value (0–99, the existing `manaSpent` bound) is sent on that card; a non-Stack card with a sent value emits `manaSpent: <n>` in its zone entry in the same stable formatting as the Stack's
+  - golden fixtures pin a non-Stack card with and without a sent value
+- Constraints:
+  - no new request field: `manaSpent` already exists on every zone card in the request schema; this adds the non-Stack prompt line and the form box, on every zone, only
+  - no mana-source legality checks (REQ-017)
+- Dependencies:
+  - REQ-017
+  - REQ-030
+  - REQ-209
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30) from the owner's direction-1 mockup; broadened from Battlefield-only to every zone by the owner's gate-review edit (2026-10-01) — "sometimes it does matter" on Graveyard and other zones too; use cases to be refined later
+
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -202,3 +202,6 @@
   input falls back to `manaValue`, and the prompt emits mana-spent in stable
-  formatting. X-spell clarity is the primary motivation. (REQ-017)
+  formatting. X-spell clarity is the primary motivation. Every zone's card carries
+  the same optional box; a non-Stack value is sent and emitted only when the
+  player changes the prefilled printed value, so an untouched box leaves the
+  prompt unchanged. (REQ-017, REQ-210)
 - Built: In-Depth's game-context counter UI (surfaced in the roster, edited in
```

- Verdict: edit
- Reason: Mana spent on the cards for the battlefield, graveyard, and some of the other locations that seem odd to call it out, but sometimes it does matter, so i think its fine to just include in all the zones for now, we can refine the use cases later

## REQ-211 — Copies on a Stack card (new) — recommend waiting

**What this decides:** whether a Stack card can say "this spell has N copies" (the storm case) in this build.

**In plain terms:** Today the Stack refuses a second copy of the same card ("Duplicate cards are not supported", REQ-009), so a question about storm or copied spells has no clean way to say how many copies exist. The mockup adds a rarely used More details sheet on a Stack card holding a Copies picker (0–99; the review reads "+3 copies"). Saying yes adds a new optional copies number to the Stack card in the request, a line in that card's prompt entry, and new golden fixtures (the saved prompts the tests compare against). It is the only brand-new field this build would add to what the AI receives.

**What happens if you say no:** Copies is not built; the More details sheet is left out until a second rare setting needs it, and the note row stands alone. It can come back as its own small package.

**Recommendation:** reject for this build — it is the one change that adds a field to the AI request, and it deserves its own answer check rather than riding a visual rebuild.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,24 @@
 
+### REQ-211
+- Title: Copies on a Stack card
+- Priority: low
+- Description: A Stack card in In-depth details' Context station may record how many copies of that spell are on the stack besides the original (storm, copy effects), through a More details sheet that slides over the card's context sheet. The count reaches the request and the prompt so the ruling can account for the copies.
+- Acceptance Criteria:
+  - a Stack card's Context sheet shows a **More details** row beside **＋ Add a note**; it opens a sheet over the card sheet holding **Copies** (a five-row picker, 0–99, default 0); **Done** slides it away
+  - a Stack card with copies above 0 sends an optional integer `copies` (1–99) on that card; 0 sends nothing
+  - the prompt's Stack entry for that card emits `copies: <n>` in stable formatting; with no copies sent the prompt is unchanged byte-for-byte
+  - the review row reads "+N copies"
+  - golden fixtures pin a Stack card with and without copies; the request schema test rejects `copies` outside 1–99 and on non-Stack cards
+- Constraints:
+  - additive, optional field on the Stack card only; the duplicate-card block (REQ-009) and the 10-card Stack cap (REQ-010) are unchanged
+  - copies are prompt context, never validated or simulated
+- Dependencies:
+  - REQ-009
+  - REQ-010
+  - REQ-017
+  - REQ-019
+  - REQ-030
+  - REQ-209
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30); the owner kept it as a "Try" in mockup rounds 7–8. More details is the home for future rare settings
+
```

- Verdict: accept
- Reason:

## REQ-212 — Speak a question into the box (new)

**What this decides:** whether the send button gets a microphone half so a player can speak a question instead of typing it.

**In plain terms:** The mockup splits the round send button into a microphone on the left and the arrow on the right, in every question box. A tap on the mic listens (the box reads "Listening…") and the words appear as typed text the player can fix before sending — nothing sends by itself. It uses the browser's own speech recognition, the same engine as the phone keyboard's dictation key. TheJudge's server never receives audio; the browser maker's speech service may, as with any keyboard dictation. Where the browser has no speech recognition the mic is simply absent. Saying yes adds this as its own late slice.

**What happens if you say no:** the send stays an arrow; players can still dictate with their keyboard's own mic key.

**Recommendation:** accept — no server, no new dependency, and it falls back to today's arrow.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,21 @@
 
+### REQ-212
+- Title: Dictate a question from the send pill
+- Priority: low
+- Description: Every question box's send pill has a microphone half beside the arrow. A tap listens through the browser's built-in speech recognition and types what is said into the box, where it counts toward the 300-character budget and can be edited before sending.
+- Acceptance Criteria:
+  - where the browser exposes speech recognition (`SpeechRecognition` or `webkitSpeechRecognition`), the send pill shows a microphone half at the left and the arrow at the right in every question box (Ask a Question, its follow-up, In-depth details' question and its follow-up); where it does not, the pill is the arrow alone and nothing else changes
+  - a tap on the mic starts listening: the mic half glows, the box reads "Listening…", and recognised words are inserted as typed text, never sent automatically; a second tap, a send, or silence stops listening
+  - dictated text is clipped at the 300-character budget exactly as typed text is (REQ-011)
+  - a denied microphone permission or a recognition error stops listening with a one-line message and leaves the typed text intact
+  - both halves meet the 44px touch floor (REQ-205) and carry accessible names ("Dictate question", "Send")
+  - tests cover the pill with and without the browser API, insertion into existing text, the cap, and the error path, using a stubbed recognition object
+- Constraints:
+  - browser-native only: no audio reaches TheJudge's backend, no new endpoint, no speech library or dependency, and nothing is stored beyond the text in the box
+- Dependencies:
+  - REQ-011
+  - REQ-205
+  - REQ-206
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30). Some browsers process the audio in the vendor's own speech service, as keyboard dictation does; the app itself never handles audio
+
```

- Verdict: accept
- Reason:

## REQ-017 — The per-card context form becomes one compact sheet

**What this decides:** how a card's context form looks and which fields each zone shows in In-depth details.

**In plain terms:** Today a card-by-card form, plus a "View all cards" list mode, lets a player add a caster, targets, a note and — on the Stack — mana spent (REQ-017). The mockup makes it one compact sheet per card: the card's art at the left, Owner on every zone but the Stack, Cast by on the Stack, Mana spent prefilled with the printed cost on every zone (REQ-210, owner-edited to every zone), one Targets picker, and the note folded behind "＋ Add a note". "View all cards" goes; the review list, with ✎ on each row to jump back, replaces it. One difference from the mockup: it hid Targets on Hand and Library cards. This proposal keeps Targets on every zone, because cards can target from a hand (channel abilities, for example) and dropping it would delete a detail today's form carries.

**What happens if you say no:** the context step keeps today's form and View all cards mode inside the new chrome.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -265,6 +265,7 @@
 - Acceptance Criteria:
-  - app builds one ordered enrichment list across all populated zones
-  - user can optionally enter context notes per card; stack item `contextNotes` UI uses placeholder copy that names transient card-level annotations: kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn
-  - user can optionally set targets using `ContextTarget`
-  - user can optionally enter mana-spent context for stack entries
+  - app builds one ordered enrichment list across all populated zones and presents it as one compact sheet per card (the card's art beside a short form, an `n / total` counter, Skip to review); the review list with a ✎ jump-back per row replaces the former View all cards list mode
+  - user can optionally enter context notes per card behind a folded **＋ Add a note** row (a card that has a note opens with it showing); the note placeholder names transient card-level annotations: kicker or buyback paid, X value used, counters added this turn, tapped status, gained abilities this turn
+  - user can optionally set targets using `ContextTarget` through one Targets picker (REQ-021) on every zone, Hand and Library included
+  - user can optionally enter mana-spent context in a plain number box prefilled with the printed mana value and hinting the printed cost, on every zone's card; an untouched box sends nothing (every zone beyond the Stack: REQ-210)
+  - fields are selects, not chips: Owner on every zone but the Stack, Cast by on the Stack
   - backend prompt context always emits deterministic mana-spent value per stack entry
@@ -279,2 +280,3 @@
   - X-spell clarity is a primary motivation for this field
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the form becomes the direction-1 context sheet (REQ-209); every field today's form carries is kept, including Targets on Hand and Library cards — the mockup's omission there is not adopted
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -186,8 +186,13 @@
 
-- Built: a default card-by-card wizard (OK advances) with an optional **View all
-  cards** full-list edit mode builds one ordered enrichment list across all
-  populated zones. Per card the player may optionally add a caster, targets, a
-  freeform context note, and mana-spent context for stack entries; the note
-  placeholder names transient annotations (kicker/buyback paid, X value, counters
-  added this turn, tapped status, gained abilities). (REQ-017, DEC-028, FLOW-001)
+- Built: the Context station shows one compact sheet per card across all
+  populated zones, in one ordered list: the card's art at the left (210px desktop,
+  96px phone with the form below), a small `n / total` counter, and **Skip to
+  review** in the eyebrow. Fields are selects, not chips: Owner on every zone but
+  the Stack, Cast by on the Stack, Mana spent on every zone's card (a number box
+  prefilled with the printed mana value, hinting the printed cost, REQ-210), and one Targets picker on
+  every zone. The note is folded behind a slim **＋ Add a note** row (a card with a
+  note opens with it showing); its placeholder names transient annotations
+  (kicker/buyback paid, X value, counters added this turn, tapped status, gained
+  abilities). **Finish context · next: your question** leads to the review.
+  (REQ-017, REQ-021, REQ-209, FLOW-001)
 - Built: before submit, enrichment shows a pre-decrypt summary of which
@@ -435,4 +440,5 @@
   independent of the 1,000,000-char prompt budget. (DEC-116, REQ-094, REQ-095)
-- Enrichment **View all cards** mode: at most 4 full-width edit rows per zone
-  before internal scroll. (DEC-076, REQ-056)
+- Review list: stops at about a third of the screen and region-scrolls with a
+  fade and an `N cards · scroll the list for the rest` line (REQ-209); the former
+  View all cards mode and its 4-row cap are retired. (REQ-017)
 - Zone-collection strip: fixed `w-40` / 160px tiles, image grows to fill the tile
```

- Verdict: accept
- Reason:

## REQ-021 — One Targets list that sends exactly what today's form sends

**What this decides:** how the new one-list Targets picker maps onto what the app already sends, so the AI request stays the same.

**In plain terms:** Today a player builds each target in three steps — pick a kind (player, card, none, other), pick a value, press Add (REQ-021). The mockup makes it one list: No target · Just on the board · each player · All players · every other card in context (with its zone) · Something else (one line). Each pick becomes a removable pill. This proposal sends every pick as one of today's four target kinds, so the request does not change: a player is a player target, a card is a card target with its zone, No target is "none", and Just on the board, All players and Something else are written-out targets (the "other" kind with that text). Naming every player one by one folds into All players; No target and Just on the board clear the other picks.

**What happens if you say no:** the three-step kind → value → Add rows stay, restyled.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -340,3 +340,5 @@
   - other targets include `targetDescription`
-  - target picker can reference players and collected zone cards
+  - one Targets picker lists No target · Just on the board (Battlefield / Command Zone) · each player by typed name · All players · every other card in context with its zone · Something else (one line); each pick becomes a removable pill (a card pill carries its thumbnail) and the picker resets to "Add another target…"
+  - picks map onto today's kinds with no contract change: a player → `{ kind: "player", targetPlayer }`; a card → `{ kind: "card", zone, cardId, cardName }`; No target → `{ kind: "none" }`; Just on the board → `{ kind: "other", targetDescription: "Just on the board" }`; All players → `{ kind: "other", targetDescription: "All players" }`; Something else → `{ kind: "other", targetDescription: <typed text, ≤200 characters> }`
+  - a target can be picked once; naming every player folds into All players; No target and Just on the board each replace every other pick; an empty list sends no targets, exactly as today; the eight-target bound is unchanged
 - Constraints:
@@ -347,2 +349,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the kind → value → Add rows become one picker (REQ-209); the request contract is unchanged
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -198,4 +198,6 @@
   (`targetDescription`); the public API never exposes the legacy `StackTarget`.
-  Card targets remain oracle-level even for duplicate instances. (DEC-026,
-  REQ-021, REQ-061)
+  Card targets remain oracle-level even for duplicate instances. The Context sheet
+  sets them through one Targets picker whose picks map onto these kinds — Just on
+  the board, All players, and Something else ride `other` with that text.
+  (DEC-026, REQ-021, REQ-061)
 - Built: mana-spent context is deterministic for every stack entry — omitted
```

- Verdict: accept
- Reason:

## REQ-005 — Players can reorder the Stack

**What this decides:** whether a player can reorder the Stack, which changes which spell the AI treats as resolving first.

**In plain terms:** Today the Stack only grows: each new card goes on top and it can't be reordered (REQ-005 "append-only"; REQ-008 "no manual reordering"). The mockup lets a player drag a Stack card to a new place (hold first on a phone), or use Down / Up / To top, with BOTTOM … TOP tags renumbering as they go. The order sent to the AI is the order shown, so reordering changes the ruling — that is the point: a player fixes a mis-ordered Stack without deleting and re-adding cards. Cards in other zones can be dragged too, but that order is cosmetic. REQ-006, REQ-008 and REQ-018 carry the same change.

**What happens if you say no:** the Stack stays add-order only; a wrong order is fixed by removing and re-adding cards.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -69,3 +69,3 @@
 - Constraints:
-  - stack is append-only in the core product
+  - adding always appends; after adding, the player may reorder the Stack by drag or by Down / Up / To top (REQ-209), and the array order sent is the order shown (REQ-006)
 - Dependencies:
@@ -73,2 +73,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): "append-only" becomes append-on-add plus player reorder
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -155,11 +155,12 @@
   suggestion list are sufficient affordance on their own. (DEC-076, REQ-056)
-- Built: the stack has its own capture rules — append-only, newest card becomes
-  the top (`stack[0]` is the bottom, last element is the top, consistent across
-  UI, payload, and prompt builder), the add button reads **Begin stackening!**
-  when empty and **Add to Stack** otherwise, duplicates are blocked with a
-  "not supported yet" notice, and the stack is capped at 10 cards. The stack icon
-  shows a live count and opens a details panel listing cards bottom-to-top with
-  per-card remove and thumbnails-when-available. (DEC-004, DEC-005, DEC-006,
-  DEC-007, DEC-008, DEC-009, DEC-018, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008,
-  REQ-009, REQ-010, FLOW-002, FLOW-004)
+- Built: the stack has its own capture rules — each add appends, so the newest
+  card becomes the top (`stack[0]` is the bottom, last element is the top,
+  consistent across UI, payload, and prompt builder); the player may then reorder
+  it by drag or Down / Up / To top, and the order shown is the order sent. The add
+  button reads **Begin stackening!** when empty and **Add to Stack** otherwise,
+  duplicates are blocked with a "not supported yet" notice, and the stack is
+  capped at 10 cards. The Stack tab shows a live count, and its shelf tags cards
+  BOTTOM … TOP, with per-card remove in the card menu. (DEC-004, DEC-005,
+  DEC-006, DEC-007, DEC-008, DEC-009, DEC-018, REQ-004, REQ-005, REQ-006, REQ-007,
+  REQ-008, REQ-009, REQ-010, REQ-209, FLOW-002, FLOW-004)
 - Built: added cards render in a horizontal left-to-right strip in add order with
```

- Verdict: accept
- Reason:

---

**Group 2 — the build's shape** (not a stable id; blocks follow)

## REQ-206 — Ask a Question: one door for every question (new)

**What this decides:** whether Quick Question and In-Depth Question become one Menu entry, Ask a Question, with the attached cards carried into In-depth details.

**In plain terms:** Today the Menu has two question doors, Quick Question and In-Depth Question. The mockup has one, Ask a Question: attach cards on a lit stage (the front card full size, a neighbour peeking each side), type into one pill-shaped box with the send button inside it, and — when the ruling needs more — tap "Add in-depth details" to carry the same cards (and anything typed) into the step flow, where each card is placed in a zone. The two underlying screens and their two kinds of AI request stay exactly as they are (the page is today's Quick Question; the step flow is today's In-Depth); what changes is the door, the page layout, and the carry. The ruling view gains a Cards strip, card names in the ruling become tappable chips, and ✎ Edit cards / ↺ Start over sit beside the title. The General rules topics list stays on the page.

**What happens if you say no:** both doors stay in the Menu and nothing carries cards between them; each page takes only the new colours.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,39 @@
 
+### REQ-206
+- Title: Ask a Question — one door for every question, with the cards carried into In-depth details
+- Priority: high
+- Description: The Menu offers one question destination, **Ask a Question**, in place of the separate Quick Question and In-Depth Question rows. The Ask a Question page is today's Quick Question page (route `/quick-lookup`, `mode: "lookup"` request) recomposed around the attached cards: the front card full size on a lit stage with one neighbour peeking out each side, a one-pill question box with the send inside it, and an **Add in-depth details** pill that carries the attached cards and any typed question into In-depth details (route `/in-depth`, `mode: "game"` request), where each carried card is placed in a zone at the Cards station (REQ-209). The two routes, the two request modes and their prompts are unchanged; what changes is the door, the page composition, and the carry.
+- Acceptance Criteria:
+  - the Menu lists **Ask a Question** once (a card-silhouette glyph) and no longer lists Quick Question or In-Depth Question; it opens `/quick-lookup`; `/in-depth` stays addressable by deep link and by the carry, and the Menu marks Ask a Question current on both routes
+  - with no card attached there is no stage; with cards attached the front card renders full size on a solid-panel stage with one neighbour peeking out each side and the rest off-stage; arrows, ←/→ and a tap on a neighbour turn the ring; no caption sits under a card except the name-only fallback when its image is unavailable (FLOW-001)
+  - ✕ Remove straddles the front card's top-left corner and ⓘ Details its top-right, half above the frame, so the printed name is never covered; the ring's dots sit in a small dark pill with an `n / <cap>` count, where the cap is REQ-167's
+  - **Add card** and **Scan** sit beside the title; Add card opens the search above the question box (thumbnail, name, type line per result) and a pick slides the card onto the stage; below `768px` with search open the ring folds into a strip of thumbnails so search, results and the question box share one screen
+  - the question box is one pill: the Add in-depth details pill at its left end (glyph only below `480px`), the text, the character count, and the send; one line of text is one row; once the text wraps, the text takes the full top row and the controls step down to their own row (Add in-depth details left, count and send right); the box grows to about seven lines, then scrolls; the empty-box hint shortens to fit one line ("What would you like to know?" → "Ask your question…" → "Ask…")
+  - the 300-character budget (REQ-011, measured on the raw typed text per REQ-134) is drawn as a ring round the send pill's edge in the profile's accent light over a faint track, brighter in the last 30 characters and closed at 300; it starts at the top of the pill's split and runs clockwise; at 0 characters no track, fill or dot is drawn and the numeric count is hidden; there is no separate Send Request button, no bar under the box, and no hint line under the title
+  - the send is one pill used by every question box (this page, its follow-up, In-depth details' question and follow-up): a microphone half and the arrow when dictation ships (REQ-212), otherwise the arrow alone
+  - **Add in-depth details** opens In-depth details at its current station, carrying every attached card not already in In-depth's staged zones or waiting to be placed, plus the typed question when In-depth's question box is empty; carried cards wait for a zone at the Cards station (REQ-209); no explanatory line accompanies the pill
+  - the answered view is the shared conversation workspace with a **Cards strip** at the top (every attached card once, one tap from its detail); the judge's message never shows thumbnails; a card name in the judge's message that exactly matches a card attached to this conversation renders as a chip (a tint of the accent, a hairline, a solid underline, brighter on hover/press) that opens that card's detail
+  - two actions sit top-right beside the title once a ruling exists: **✎ Edit cards** returns to the pre-submit page with the cards and question exactly as they were (the conversation is saved to history first, REQ-103), and **↺ Start over** clears cards, question and any locked topic to the empty page
+  - the General rules topics disclosure (REQ-079) and the locked topic pill (REQ-091) stay on the page, unchanged in behaviour
+  - tests cover the single Menu entry and current-marking on both routes, turning the ring, the carry adding only uncarried cards, the ring at 0 / 1 / 270 / 300 characters, Edit cards restoring cards and question, and a chip opening the card detail
+- Constraints:
+  - no change to either request mode, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, or routes, except the lookup card cap (REQ-167)
+  - the carry is in-memory frontend state using the existing cross-destination hand-off pattern (`seedContext.tsx`); the Ask a Question Draft (REQ-108) begins the moment the first card is attached, and every carried card — placed in In-depth details or still waiting for a zone — is written into the Draft slot, so the whole request survives a reload
+  - keep-alive mounting and URL-as-truth routing are unchanged (DEC-157, REQ-140)
+- Dependencies:
+  - REQ-011
+  - REQ-079
+  - REQ-091
+  - REQ-103
+  - REQ-108
+  - REQ-134
+  - REQ-140
+  - REQ-167
+  - REQ-207
+  - REQ-209
+  - REQ-212
+  - FLOW-011
+- Notes:
+  - "Quick Question" in older requirements names the Ask a Question page (route `/quick-lookup`) and "In-Depth Question" names In-depth details (route `/in-depth`); older entries keep those names as internal labels rather than being rewritten
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30) from the owner-approved direction-1 mockup (rounds 2–14)
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -128,7 +128,7 @@
 |---|---|
-| Purpose | Up to 5 cards (bounded add strip, REQ-167) + question → Ask AI |
-| Phone | Shell 100% width band; content-sized vertically (DEC-145); each attached card image sizes to the content column (DEC-160) — with the corner detail popup for metadata (DEC-151/DEC-158); only **Remove card** beside/below each image (REQ-133); **the attached-card list is a bounded region — a horizontal strip and/or region-scrolled list — so total attached-card height does not grow with the card count (REQ-129 as amended, REQ-167's 5-card cap)**; primary fields and **Send Request** stay in the first viewport at every attached-card count up to five; topics/lists may region-scroll |
-| Desktop/tablet | Shell 92%/48rem cap; content-sized vertically; card images grow with the wider column rather than holding the phone size (DEC-160); composer/field growth must not force page scroll or clip chrome below the field (REQ-110 / DEC-146 / DEC-153) |
-| Fit | No page scroll for primary submit path — this bounds card image growth (REQ-129); if the two conflict, the Fit rule wins and a bounded cap is recorded on this row. **Measured bound (ui-review, 2026-08-07):** the two did conflict. An unbounded content-column image rendered 265x369 at 390x844 and pushed **Send Request** to `top` 868px with 1004px of document scroll. The shared shell column (`.card-shell-column img`) is therefore capped at `max-height: 25dvh` below 768px and `42dvh` at 768px+ — a host-row height bound, never a reinstated component `max-h-32` or a per-surface variant. Result: 151x211 at 390x844 with Send Request fully inside the first viewport (`bottom` 754px) and document scroll back to 846px vs the 844px baseline; 271x378 at 1440x900 with Send Request `bottom` 892px. Consequence to accept: at 390x844 the image is 45.3% of content width (151px of a 333px column, re-measured on ship 2026-08-11), so REQ-141's "clear majority" is **not** met on this surface — REQ-129 binds first, exactly as DEC-160 anticipates. It remains 1.65x the superseded 92x128 render and grows with the viewport (271x378 at 1440x900). Closing the gap requires changing the surrounding Quick Question column, not this cap. **Re-measured for the multi-card add strip (ui-review, 2026-08-30, REQ-167):** the existing per-image cap already holds unchanged — each stacked card is its own `.card-shell-column img` instance, so five attached cards at 390×844 render as five independent ~211px-tall images (confirmed via live snapshot, no new overflow), and three attached cards at 1440×900 render at the same ~378px-tall desktop size as the single-card case. Stacking multiple capped images necessarily grows total document height, so the page scrolled past the composer with 2+ cards attached. **That consequence is withdrawn by the `ui-reimagining` pass (REQ-129 as amended, 2026-09-24):** re-measured live at 390×844 with two cards attached, the document was 1159px against an 844px viewport and Send Request sat at `top` 1023 / `bottom` 1067 — 179px below the fold, which is the owner-reported friction, not an acceptable trade. The bound is now on the attached-card **region**, not each image: the list becomes a bounded strip and/or region-scrolled list so Send Request's `bottom` stays ≤ 844px at 390×844 with up to five cards attached. The per-image `25dvh` / `42dvh` host-row cap is unchanged; no per-surface component variant or reinstated `max-h-32` is introduced. |
-| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-153, DEC-158, DEC-160, REQ-129, REQ-132, REQ-133, REQ-141, REQ-167, REQ-174, REQ-200, FLOW-024. **On-demand load state (REQ-174 / FLOW-024):** the pre-submit card preview's descriptive metadata now loads on demand, so it shows the same quiet in-overlay loading state as the `#### Card detail popup (suite-wide)` row — no branded splash, spinner takeover, progress bar, or motion beyond the existing CSS-motion rules (NFR-006), and no image/strip resize or layout jump when the block resolves; a minimal inline placeholder only, failing soft to the name identity fallback (FLOW-001) |
+| Purpose | Ask a Question: attach cards up to the lookup cap (REQ-167) on a card stage + one-pill question box → Ask AI; Add in-depth details carries the cards into In-depth details (REQ-206) |
+| Phone | Shell 100% width band; content-sized vertically (DEC-145). **Card stage** (only when a card is attached): the front card full size on a solid-panel stage, one neighbour peeking each side, the rest off-stage — so the stage height does not grow with the card count; ✕ Remove / ⓘ Details straddle the front card's top corners; dots in a dark pill with an `n / cap` count. With search open the ring folds into a thumbnail strip so search, results and the question box share one screen. **Question box:** one pill (Add in-depth details · text · count · send pill), growing to about seven lines, then scrolling |
+| Desktop/tablet | Shell 92%/48rem cap; content-sized vertically; the front card grows with the wider column; box growth must not force page scroll or clip chrome below the box (REQ-110 / DEC-146) |
+| Fit | No page scroll for the primary submit path: at 390×844 and 1440×900 the send pill's `bottom` stays inside the first viewport at every attached-card count up to the cap, and with search open. The stage replaces the stacked per-image list whose measured overflow (2026-09-24: two cards pushed Send Request 179px below the fold at 390×844) this row previously bounded; the per-image `25dvh` / `42dvh` cap retires with that list |
+| Notes | DEC-107, DEC-145, DEC-146, DEC-151, DEC-158, DEC-160, REQ-129, REQ-133, REQ-141, REQ-167, REQ-174, REQ-200, REQ-206, FLOW-024. The on-demand card-detail load state follows the `#### Card detail popup (suite-wide)` row (REQ-174 / FLOW-024): quiet, in-region, no layout jump, failing soft to the name fallback |
 
@@ -138,7 +138,7 @@
 |---|---|
-| Purpose | Chat-first follow-up after first answer |
-| Phone / Desktop | Thread fills **available shell/workspace height**; composer docked in workspace; thread region-scrolls |
+| Purpose | Ask a Question — answered: chat follow-up after the first ruling, with the attached cards in a Cards strip (REQ-206, REQ-075) |
+| Phone / Desktop | Thread fills **available shell/workspace height**; composer (the shared one-pill question box with the send pill, REQ-206) docked in workspace; thread region-scrolls. Top to bottom: the title row with **✎ Edit cards** and **↺ Start over** at its right once a ruling exists; the **Cards strip** when any card is attached (every attached card once, one tap from its detail; one row that never becomes document horizontal scroll; no strip without a card); then the thread — the player's question first as a right-aligned bubble (REQ-025), the judge's messages in a solid bubble under the colour's seal with no card thumbnails, and a card name that exactly matches an attached card rendered as a tappable chip opening that card's detail |
 | Fit | No page scroll; thread is the scroll region (DEC-127/131) |
-| Rail clearance | The corner rail participates in layout (`.portal-menu-rail` is `position: relative`, giving the header's left column a real 44px band), so the first element under the header needs **no compensating clearance**. `.adaptive-context-trigger`'s `margin-top: calc(2.75rem - var(--layout-panel-padding))` is retired; spacing is plain `--layout-surface-gap` — measured 8px at 390x844 and 16px at 1440x900, with the rail's bottom 12px / 32px above View Context and no overlap. Do not reintroduce a rail-sized clearance constant here (ui-review, 2026-08-11) |
-| Notes | DEC-118, DEC-127, DEC-131, REQ-139 |
+| Header clearance | The banner header (REQ-207) is in flow and replaces the corner rail, so the title row under it needs **no compensating clearance**; spacing is plain `--layout-surface-gap`. `.adaptive-context-trigger`'s retired `margin-top: calc(2.75rem - var(--layout-panel-padding))` stays retired (REQ-136). The ☰ button's hit area never overlaps ✎ Edit cards, ↺ Start over or the Cards strip at 390×844 or 1440×900. Do not reintroduce a header-sized clearance constant here. Superseded geometry: the corner `.portal-menu-rail` band (`position: relative`, a 44px left-column band, its bottom 12px / 32px above View Context, gap 8px / 16px at 390x844 / 1440x900; ui-review, 2026-08-11) |
+| Notes | DEC-118, DEC-127, DEC-131, REQ-139, REQ-025, REQ-075, REQ-136, REQ-206, REQ-207 |
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -118,10 +118,12 @@
   not in header chrome. (DEC-122, DEC-109, DEC-133)
-- Built: the tray lists the registered destinations in registry order — **Quick
-  Question, In-Depth Question, Life Tracker, Trade Balancer** — then the **Send
-  feedback** action entry (which opens the feedback modal without switching the
-  active destination), then the palette-only Theme section. Rows render full-bleed,
-  separated by rules that meet the tray's left wall; the active entry keeps a check
-  mark and quiet fill. Registry order also supplies the no-stored-preference
-  default: **Quick Question** leads and is the default destination. (DEC-135,
-  DEC-104, DEC-095)
+- Built: the tray lists **Ask a Question** (a card-silhouette glyph), **Question
+  History** directly under it, **Life Tracker**, and **Trade Balancer**, each with a
+  small accent glyph; the current screen is lit with a bar and a ✓, and Ask a
+  Question is current on both `/quick-lookup` and `/in-depth`. **Send feedback**
+  sits at the foot of the list past a slim hairline (it opens the feedback sheet
+  without switching destination), then the Theme band. Registry order still
+  supplies the no-stored-preference default: Ask a Question (`/quick-lookup`)
+  leads. In-depth details (`/in-depth`) stays a registered, deep-linkable route
+  with no row of its own; the Ask a Question page's **Add in-depth details** pill
+  is its door. (DEC-135, DEC-104, DEC-095, REQ-206, REQ-213)
 - Built: the tray fills the visible shell side (viewport ∩ shell on tall
--- a/PRD/sections/quick-lookup/README.md
+++ b/PRD/sections/quick-lookup/README.md
@@ -39,12 +39,21 @@
 
-- Built: Quick Lookup is registered as one feature-portal destination
-  (`quick-lookup`, DEC-095) and opens as a frontend-only view switch with no
-  reload; it ships no navigation menu of its own. (DEC-107, REQ-073, FLOW-011)
-- Built: the pre-submit view is laid out top to bottom as an optional
-  card-attach control, then the Question field, then the "General rules topics"
-  outer disclosure. (REQ-073, DEC-112)
-- Built: the card-attach control's label carries the guidance copy inline after
-  an em dash — "OPTIONAL CARDS — Add up to 5 cards for context, or ask any
-  Magic related question." — rather than as a standalone paragraph under the
-  header. (DEC-113, REQ-073, REQ-167)
+- Built: Quick Lookup is the **Ask a Question** page — the Menu's single question
+  destination (`quick-lookup`, route `/quick-lookup`, DEC-095) — and opens as a
+  frontend-only view switch with no reload; it ships no navigation menu of its
+  own. Its **Add in-depth details** pill carries the attached cards and any typed
+  question into In-depth details (`/in-depth`). (DEC-107, REQ-073, REQ-206,
+  FLOW-011)
+- Built: the pre-submit view is laid out top to bottom as the title row (with
+  **Add card** and **Scan** beside the title), the card stage when any card is
+  attached, the one-pill Question box, then the "General rules topics" outer
+  disclosure. The front card renders full size on a lit solid-panel stage with one
+  neighbour peeking out each side; arrows, ←/→ or a tap on a neighbour turn the
+  ring; ✕ Remove and ⓘ Details straddle the front card's top corners; the ring's
+  dots sit in a small dark pill with an `n / cap` count (REQ-167). With no card
+  attached there is no stage. (REQ-073, DEC-112, REQ-206)
+- Built: no guidance line sits under the title; Add card opens the search above
+  the question box (thumbnail, name, type line per result) and a pick slides the
+  card onto the stage. Below `768px` with search open the ring folds into a strip
+  of thumbnails so search, results and the box share one screen. (REQ-206; the
+  former "OPTIONAL CARDS — …" label of DEC-113 is retired)
 - Built: card input is optional and bounded to at most 5 cards (REQ-167). The
@@ -105,7 +114,9 @@
   REQ-011)
-- Built: the composer row gives the Question textarea the full row width with
-  an inline character counter, replacing a wide labelled submit button with a
-  compact circular submit control at narrow viewports where a labelled button
-  would starve the field; wider viewports may keep a labelled control so long
-  as the field keeps the dominant share of the row. (DEC-146, REQ-121)
+- Built: the Question box is one pill — the Add in-depth details pill at its left
+  end (glyph only below `480px`), the text, the count, and the round send pill. One
+  line of text is one row; once the text wraps it takes the full top row and the
+  controls step down to their own row. The 300-character budget is a ring traced
+  round the send pill, starting at the top of its split and running clockwise,
+  brighter in the last 30 characters, closed at 300; at 0 characters nothing is
+  drawn and the count is hidden. (DEC-146, REQ-121, REQ-206)
 - Built: the Question textarea grows with typed content up to the space
@@ -146,8 +157,9 @@
 - Built: when one or more cards were attached, every one of them is frozen for
-  the conversation and shown behind a compact adaptive context trigger — a
-  bottom sheet below 768px or a right-side drawer at 768px+; the trigger label
-  names the single card or states the count (`"N cards"`) for several. Without
-  a card, no empty context trigger or container renders. Start Over clears the
-  thread and any locked pill and returns to the pre-ask state. (REQ-075,
-  REQ-167, DEC-118)
+  the conversation and shown in a **Cards strip** at the top of the answered view
+  (each card once, one tap from its detail); a card name in the judge's message
+  that matches an attached card renders as a tappable chip opening that card's
+  detail. **✎ Edit cards** (beside the title) returns to the pre-submit page with
+  the cards and question kept; **↺ Start over** clears the thread, the cards, the
+  question and any locked pill and returns to the empty pre-ask state. (REQ-075,
+  REQ-167, DEC-118, REQ-206)
 
@@ -342,12 +354,8 @@
   bounded ≤2500-char constant. (DEC-045, DEC-025)
-- Pre-submit card image fit: the shared card-shell image is capped at
-  `max-height: 25dvh` below 768px and `42dvh` at 768px+, applied independently
-  per attached card — with one card, **Send Request** stays in the first
-  viewport with no page scroll; REQ-129's no-scroll fit binds before REQ-141's
-  "clear majority," so at 390×844 the image is ~45% of content width, which
-  REQ-141 is not met on and DEC-160 anticipates. With 2+ cards (REQ-167), each
-  stacked image still holds the same per-image cap — confirmed unchanged by
-  re-measurement (ui-review, 2026-08-30) — so the strip now scrolls the page
-  past the composer, an accepted consequence of the per-image bound, not a new
-  cap value. (DEC-160, REQ-129, REQ-141, REQ-167, `screen-layout.md`)
+- Pre-submit card stage: the front card is the only full-size image; neighbours
+  peek and the rest are off-stage, so the stage's height does not grow with the
+  card count, and the send pill stays in the first viewport at every count up to
+  the cap at 390×844 and 1440×900. The former per-image `25dvh` / `42dvh` stacked
+  cap retires with the stacked list. (REQ-129, REQ-141, REQ-167, REQ-206,
+  `screen-layout.md`)
 - Layout/fit: mobile-first and touch-friendly; the pre-submit stack and the
```

- Verdict: edit
- Reason: Start the Draft at the very beginning, when the player attaches their first card on Ask a Question, so every request survives a reload — cards carried into In-depth details included, placed or not yet placed. Better for the player: it saves time and effort, and since history is stored locally on their own device they can clear it on their own schedule. (Owner, 2026-10-01; replaces the brief's assumption that unplaced carried cards are not written to the Draft.)

## REQ-207 — The new frame: banner header, Menu, Theme band, and the colour's scene (new)

**What this decides:** the look of everything around the screens — the header, the Menu, the Theme picker, and the slow colour scene behind every page.

**In plain terms:** Pick a colour in the Menu and the whole app becomes that colour's place: a flat dark ground; a slow, faint scene of the colour's element behind every screen (falling leaves for Green, runes for Blue, fog for Black, embers for Red, beams for White, turning shapes for Colorless); the colour's own badge faint in the centre. The header becomes a banner with ☰ at the left and the brand centred. The Menu slides in from the left and floats as a card on desktop. Theme becomes a band of six colour cells with no names. This also builds the colour rules agreed on 2026-09-24 and not yet in the code: named colour roles with contrast floors (REQ-200) and the app's own drawn symbols with no Wizards of the Coast art (REQ-201). One change from the mockup: it animated the scene with a script loop; the motion rule (NFR-006, "motion stays CSS-based") means this build draws the same scene with CSS animation, and everything holds still under reduced motion.

**What happens if you say no:** the app keeps today's header, corner Menu rail, round Theme orbs and plain background; REQ-200 and REQ-201 would still need their own build.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,41 @@
 
+### REQ-207
+- Title: Direction-1 shared chrome — banner header, Menu tray, Theme band, and the colour's ambient scene
+- Priority: high
+- Description: The shared frame every destination lives in takes the owner-approved direction-1 look and delivers the REQ-200 token set and REQ-201 motif kit in code. A banner header carries the Menu (☰) at the left and the brand centred; the Menu tray slides in from the left; Theme is a six-cell band; and a restrained, CSS-animated scene of the chosen colour's element plays behind every page.
+- Acceptance Criteria:
+  - one typeface, Inter, for body and titles (titles heavier with tighter tracking), served as a self-hosted local font file with the system stack as fallback — no runtime request to a font CDN, no display face
+  - the page ground is flat: one colour per profile from the REQ-200 token set, no gradient; neutral ground and panel fills stay the visual majority; no corner decoration, hairline bracket or flourish on any surface
+  - the header is a banner: ☰ at the left (at least 44px; about a quarter larger than today's trigger on a phone and a third on desktop), the brand centred (a breathing orb holding the colour's badge, the wordmark, "MTG Assistant") on a lit band with a hairline of the colour's light along its foot, and each profile's element drawn across the band (White low-sun rays at half strength; Blue a scatter of arcane shapes; Black fog pooling at the ends; Red a hot band with embers; Green a scatter of leaf and tree shapes; Colorless small triangles, rings, arcs, dots and crosses); the right-hand slot shows Trade Balancer's price date at `768px`+; the brand keeps the cat-wizard Easter egg (REQ-203)
+  - the Menu tray slides in from the left at every width: full height of the visible shell side below `768px`; at `768px`+ a floating card inset from the edges, rounded, sized to its content; it closes on its ✕, a tap outside it, and Escape; it stays fully opaque over destination content (REQ-122)
+  - the destination list is REQ-206's: Ask a Question, Question History (REQ-213), Life Tracker, Trade Balancer, then Send feedback past a hairline
+  - **Theme** is one segmented band the tray's width with six equal cells in catalog order (White, Blue, Black, Red, Green, Colorless): an unchosen cell is a faint wash of its colour with its symbol in the colour's light; the chosen cell is filled with the colour's light, the symbol dark on it, with a small glow; no colour names or blurb (each cell's hover title and accessible name name the colour); a cell is never narrower than 40px — when six no longer fit, the band slides with an arrow at each end nudging two cells at a time (the exhausted end's arrow fades) and the chosen cell is scrolled into view when the Menu opens; from 320px up all six fit and no arrow shows; with Colorless current, a colour well and **Reset to gray** show beneath, wrapping cleanly
+  - behind every page plays the chosen colour's **ambient scene**: two slowly drifting haze sheets, a field of glowing dust, the colour's badge large, blurred and faint in the centre, and the colour's element moving (White beams, Blue runes and constellations, Black fog and brambles, Red heat and embers, Green falling leaves, Colorless turning geometry); the same scene plays at a whisper inside the Menu tray over a pool of the colour's light fading in at its foot (Colorless's tray gets a fuller scatter of slightly brighter shapes)
+  - each scene's density and opacity are one number each, so it can be tuned down without redrawing; the scene is decorative, never carries meaning, and sits behind solid panels (the card stage, every In-depth plate) so the badge shows around them, never through them
+  - under `prefers-reduced-motion` the scene is still and every decorative motion stops (NFR-006)
+  - the REQ-200 contrast floors hold over the scene in all six profiles; a custom Colorless colour follows REQ-099
+  - every card keeps its colour-identity ring (REQ-058) on every card surface; the theme owns the glow behind a card, never its edge
+  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the font loading from the app's own origin, and the contrast floors per profile
+- Constraints:
+  - CSS-only motion (NFR-006): the scene is layered static SVG and gradients animated with CSS transforms and opacity — no script-driven animation loop, no canvas render loop, no animation library
+  - the six symbols, badges, banner elements and scene art are the app's own drawings shipped as local static files (REQ-201); no Wizards of the Coast glyph, icon font, logo, set symbol or card art
+  - the font file and scene art stay within the frontend asset budget (REQ-201, NFR-013); if a self-hosted Inter cut cannot fit, the system stack stands and no font file ships
+  - presentation only: no change to request contracts, prompts, backend routes, card metadata, or the data pipeline
+  - Life Tracker inherits this chrome, reviewed by the screenshot pair on every touching slice (REQ-202)
+- Dependencies:
+  - REQ-058
+  - REQ-099
+  - REQ-122
+  - REQ-200
+  - REQ-201
+  - REQ-202
+  - REQ-203
+  - REQ-205
+  - REQ-206
+  - REQ-213
+  - NFR-006
+  - NFR-013
+  - FLOW-007
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30); the approved mockup drew the element on a script-driven canvas — this build keeps the look and moves it to CSS to stay inside NFR-006
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -88,5 +88,7 @@
 | Purpose | Suite navigation + Theme |
-| Phone / Desktop | Rail: corner band (hit box capped per DEC-137) when tray closed. Open tray: full-height of **visible shell side**, width per navigation DECs (not a free full-viewport panel past shell). Theme orbs on one row (DEC-152). |
-| Fit | Overlay; no page scroll. Opaque over destination content; rail Menu/History icons hidden/unclickable while open; close via outside click / Escape (DEC-140/147/150) |
-| Notes | DEC-122, DEC-133, DEC-137, DEC-147, DEC-150, DEC-152, REQ-127, REQ-131 |
+| Phone | ☰ Menu button (≥44px) at the left of the banner header. Open tray: slides in from the left, full height of the **visible shell side**; opaque over destination content |
+| Desktop/tablet | Same ☰ trigger; the open tray is a floating card inset from the viewport edges, rounded, sized to its content (not full height) |
+| Theme band | Six equal cells, each ≥40px; when six no longer fit, the band slides with an arrow at each end nudging two cells, the chosen cell scrolled into view on open; from 320px up all six fit with no arrows; Colorless's colour well and Reset to gray sit beneath, wrapping |
+| Fit | Overlay; no page scroll. The tray closes on its ✕, a tap outside it, and Escape; the ☰ trigger is covered and not hit-testable while it is open (REQ-127) |
+| Notes | DEC-122, DEC-133, DEC-137, DEC-147, DEC-150, REQ-127, REQ-131, REQ-207. The destination list is REQ-206's |
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -108,12 +108,11 @@
 
-- Built: the suite's single navigation affordance is a **top-left corner rail** —
-  a radial-gradient glow anchored at the header corner that fades to fully
-  transparent well inside its own box, with no border and no separate button on
-  top; the glow area itself is the trigger. Selecting it opens a **full-height
-  left tray** of the outer shell that slides in from the left edge
-  (`transform: translateX`), staying docked inline per-screen and never fixed to
-  the viewport (a `fixed` fallback survives in code only as a defensive net for a
-  hypothetical headerless destination). The brand block centers in the header row;
-  the step-name text renders as an in-flow eyebrow above each step's own content,
-  not in header chrome. (DEC-122, DEC-109, DEC-133)
+- Built: the suite's single navigation affordance is the **☰ Menu button** at the
+  left of a banner header — at least 44px, about a quarter larger than the former
+  corner rail on a phone and a third on desktop — with the brand centred (a
+  breathing orb with the colour's badge, the wordmark, "MTG Assistant") on a lit
+  band carrying a hairline of the colour's light and the profile's own element.
+  Selecting ☰ opens the Menu tray, which slides in from the left: full height of
+  the visible shell side below `768px`, a floating inset rounded card sized to its
+  content at `768px`+. The step-name text renders as an in-flow eyebrow above each
+  step's own content, not in header chrome. (REQ-207, DEC-109, DEC-133)
 - Built: the tray lists the registered destinations in registry order — **Quick
@@ -329,2 +328,11 @@
   NFR-006)
+- Built: behind every page plays the chosen colour's **ambient scene** — two
+  drifting haze sheets, a field of glowing dust, the colour's badge large, blurred
+  and faint in the centre, and the colour's element (White beams, Blue runes, Black
+  fog, Red embers, Green leaves, Colorless turning geometry) — CSS-animated with
+  transform/opacity only, one density and one opacity number per scene, still
+  under reduced motion, and at a whisper inside the Menu tray. The ground is one
+  flat colour per profile from the REQ-200 token set; one typeface (Inter,
+  self-hosted) serves titles and body; no surface carries corner decoration.
+  (REQ-207, REQ-200, REQ-201, NFR-006)
 
```

- Verdict: accept
- Reason:

## REQ-208 — One pop-up shape for card detail, history, printings, feedback and "are you sure?" (new)

**What this decides:** whether the card detail, Question History, the printing picker, Send feedback and every confirmation share one pop-up shape.

**In plain terms:** Today these pop-ups each have their own shape: card detail slides in from the right on desktop (REQ-128), history is a full-height drawer on the left (REQ-103), feedback is a centred box. The mockup gives them one shell: a sheet rising from the bottom on screens narrower than 600px, and a floating card in the centre from 600px up, with the title and buttons fixed and only the middle scrolling. The card detail opens in the centre on desktop. A shared confirm sheet asks before a destructive action (New trade, Reset life totals, New game). View Context — the frozen game summary in the ruling view — keeps its own shape.

**What happens if you say no:** each pop-up keeps today's shape and only takes the new colours.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,31 @@
 
+### REQ-208
+- Title: One shared sheet for card detail, Question History, the printing picker, Send feedback, and confirmations
+- Priority: medium
+- Description: The suite's small overlays share one sheet shell so they open, size, scroll and close the same way: a bottom sheet below `600px` and a floating card centred in the viewport from `600px` up, with a fixed head and foot and only the body scrolling. The shell hosts the card-detail box, Question History (REQ-213), Trade Balancer's printing picker (REQ-065), Send feedback (REQ-087), and a shared confirm sheet.
+- Acceptance Criteria:
+  - one shell component presents as a bottom sheet below `600px` and as a floating card centred in the viewport from `600px` up; the head (title and ✕) and foot (actions) stay fixed and only the body region-scrolls; the sheet sizes to its content up to the viewport
+  - it opens with a short fade-up (immediate under reduced motion), traps focus, closes on ✕, Escape and a tap outside, and returns focus to its trigger (REQ-143)
+  - the **card-detail box** uses it everywhere a card image appears: art leads, the name over it with the mana cost, one type line with colour pips, oracle text in a framed box, and three fact tiles (mana value · subtypes · price where a price is known), close top-right; REQ-128's on-demand load state is unchanged
+  - the **confirm sheet** asks before a destructive action with a plain question, one line on what will be cleared, a keep action and a clear action; an action with nothing to clear opens no sheet
+  - Question History, the printing picker and Send feedback render in the shell with their own bodies (REQ-213, REQ-065, REQ-087)
+  - View Context keeps its own bottom sheet / right drawer at the `768px` boundary (REQ-135), and Life Tracker's counter panel keeps its full-height overlay (DEC-139)
+  - the shared close control (REQ-142) and the 44px floor (REQ-205) apply
+  - tests cover the shell at 390px and 1024px, focus trap and restore, outside dismiss, and body-only scroll with a long body
+- Constraints:
+  - one shared component; no per-overlay fork or size prop; presentation only
+  - the `600px` switch is a structural media query (DEC-117, NFR-011), not device detection; it applies to this overlay family only and the suite's `768px` phone/tablet band is unchanged
+- Dependencies:
+  - REQ-065
+  - REQ-087
+  - REQ-128
+  - REQ-135
+  - REQ-142
+  - REQ-143
+  - REQ-205
+  - REQ-213
+  - NFR-006
+  - NFR-011
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30)
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -102,2 +102,12 @@
 
+#### Shared sheet (card detail, Question History, printing picker, Send feedback, confirm)
+
+| | |
+|---|---|
+| Purpose | One overlay shell for the suite's small sheets (REQ-208) |
+| Phone | Below `600px`: bottom sheet, content-sized up to the viewport; fixed head (title, ✕) and foot (actions) |
+| Desktop/tablet | From `600px`: floating card centred in the viewport, content-sized; Question History widens to two panes (REQ-213) |
+| Fit | Overlay; only the body region-scrolls; never a second page-length scroll for the host screen |
+| Notes | REQ-208, REQ-128, REQ-142, REQ-143, REQ-205. View Context keeps its own row; Life Tracker's counter panel keeps DEC-139 |
+
 #### Conversation history drawer
@@ -228,5 +238,5 @@
 | Purpose | Send feedback / bug report |
-| Phone / Desktop | Modal centered within viewport; width capped for readability (not full-bleed) |
+| Phone / Desktop | The shared sheet (REQ-208): bottom sheet below `600px`, floating centred card from `600px` up, width capped for readability; fixed head and foot, body scrolls |
 | Fit | Overlay; form body may region-scroll if needed |
-| Notes | DEC-105 |
+| Notes | DEC-105, REQ-087, REQ-208 |
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -315,2 +315,13 @@
   floor. (DEC-159, DEC-156, REQ-142)
+
+### The shared sheet
+
+- Built: the card-detail box, Question History, Trade Balancer's printing picker,
+  Send feedback, and the confirm sheet share one sheet shell — a bottom sheet below
+  `600px`, a floating card centred in the viewport from `600px` up (fading up into
+  place), with a fixed head and foot and only the body scrolling. It traps focus,
+  closes on ✕, Escape and outside tap, and restores focus. The confirm sheet asks
+  before destructive actions (New trade, Reset life totals, New game) and opens
+  nothing when there is nothing to clear. View Context keeps its own `768px`
+  sheet/drawer. (REQ-208, REQ-128, REQ-213, REQ-065, REQ-087)
 
--- a/PRD/sections/user-feedback/README.md
+++ b/PRD/sections/user-feedback/README.md
@@ -38,5 +38,6 @@
 
-- Built: the modal opens over the current screen, so the user keeps their
-  place — no view switch, no reload, no loss of in-progress state. (REQ-087,
-  FLOW-014)
+- Built: the feedback form opens in the shared sheet (REQ-208) over the current
+  screen — a bottom sheet below `600px`, a floating centred card from `600px` up —
+  so the user keeps their place: no view switch, no reload, no loss of in-progress
+  state. (REQ-087, REQ-208, FLOW-014)
 - Built: capture fields are a category select (Bug / Suggestion / Other), a
```

- Verdict: accept
- Reason:

## REQ-209 — In-depth details: four stations, the Cards shelf and the card menu (new)

**What this decides:** how In-depth details walks a player through the game, the zones, the cards and each card's context before the question.

**In plain terms:** Today's four steps (game context, zones, cards, per-card context) stay, and every detail they collect is kept. They become four stations on a tappable progress rail — Game · Zones · Cards · Context — each with a lit "Continue · next: …" bar built into its panel instead of a separate button. The Cards station shows real card images on a lit shelf, one tab per chosen zone; tapping a card opens a small menu to move it to another zone, reorder it, read its details or remove it (each Move-to button wears a small drawn sign, shuffled each time). Cards carried from Ask a Question are placed one at a time ("Which zone is it in?"), and nobody passes the Cards station until each carried card has a zone or is left out. A review lists each card's context in words before the question. The ruling arrives in the same chat as Ask a Question, with View Context (the frozen game) beside the title.

**What happens if you say no:** the four steps keep today's layout, restyled only by the new frame, and carried cards have nowhere to land.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,42 @@
 
+### REQ-209
+- Title: In-depth details — four stations, the Cards shelf, and the card menu
+- Priority: high
+- Description: In-Depth Question's four staged steps become **In-depth details**: four stations on a progress rail — 1 Game · 2 Zones · 3 Cards · 4 Context — with the way forward built into each panel, a lit shelf of real card images per zone, a card menu for moving, ordering, reading and removing a card, one-at-a-time placement of cards carried from Ask a Question (REQ-206), and a review before the question. Every detail today's staged flow collects is kept.
+- Acceptance Criteria:
+  - the title reads "In-depth details"; the Menu marks Ask a Question current; a round ‹ beside the title goes back one card inside Context, then to Cards, and from station 1 back to the Ask a Question page
+  - a progress rail shows the four stations; stations are tappable, but Context bounces back to Cards while any carried card is unplaced; the ruling is not a station — when it arrives the rail and flow give way to the chat
+  - each station's panel ends in a lit bar naming the next step ("Continue · next: which zones are in play", "Next card", "Finish context · next: your question"); there is no floating confirm button; Back and Continue are equal width where both show, Continue full width below `768px` and right-aligned at `768px`+
+  - **Game** is one plate under a "Game context" heading: players (a square −/+ stepper, 2–8) with names and life totals behind an expander, then turn phase (with the combat sub-step when phase is combat) and active player; one shared "More details for all players" toggle reveals each player's Poison · Energy · Experience, commander damage from each other player, and named counters with "Add a named counter" (REQ-100's synchronized state); the Additional game state notes (REQ-031) stay; a typed player name carries through every later mention (active player, owner, cast by, targets, commander damage, review, frozen context, ruling); no round steppers anywhere
+  - **Zones** shows the seven-zone checklist as tiles that glow when chosen; zone tiles and summary chips are solid and empty zones dashed; at least one zone is still required (REQ-016)
+  - **Cards** puts **Add card** and **Scan** on their own row under the rail (equal halves below `480px`), one tab per chosen zone with its count, and a lit shelf of real card images for the chosen tab; a walk from station 1 starts with empty zones ("Begin stackening!" on an empty Stack); cards arrive by search, scan, or carried from Ask a Question
+  - **Stack tags**: one card reads TOP; two read BOTTOM / TOP; from three the ends read BOTTOM and TOP and the cards between count down from the top (TOP, 2ND, 3RD … BOTTOM); only the Stack wears tags; on the Stack a lit reminder sits between the tabs and the shelf ("Top resolves first, then 2nd, 3rd… down to the bottom. Drag a card to reorder it (hold first on a phone), or tap it for Move up / Move down")
+  - **every zone reorders by drag** (a mouse drags at once; touch after a short hold, while a plain swipe still scrolls the shelf; the image never starts the browser's own image drag); the Stack also offers ↓ Down · ↑ Up · ⤒ To top and other zones ‹ Left · Right ›; tags renumber live; Stack order is sent as shown (REQ-005, REQ-006); order in other zones is cosmetic and changes no prompt meaning
+  - **carried cards are placed one at a time** in the context-sheet shell: the card as hero, "Which zone is it in?", one tile per zone chosen at Zones, "Other zones ▾" for the rest (picking one adds that zone to the chosen set), a "1 / n to place" counter, and "Leave this card out"; nothing passes Cards until every carried card has a zone or is left out; search excludes carried cards; a carried card the Stack refuses (duplicate or cap, REQ-009 / REQ-010) shows the existing notice and stays unplaced
+  - **a tap on a shelf card opens its menu** (a pop-over pointing at the card at `768px`+, a bottom sheet below): the card's thumbnail, zone and name; **Move to** as a wrap of small pills with the current zone lit; the order control as one segmented pill; **Card details** and **Remove from the <zone>** as rows under a hairline; each Move to pill wears a small line-drawn sign (15–16px, stroked in the accent at 0.5 opacity; the current zone's at full with a small glow) dealt at random each time the menu opens from a pool of fourteen (a pile of cards, a shield, a fan of cards, a headstone, a spark, a closed book, a crown, a crescent moon, an eye, a key, an hourglass, a rune, a comet, a sigil ring), no two alike, none naming its zone
+  - **Context** is REQ-017's compact sheet per card
+  - **the review** lists each card's context in words ("cast by Chris · targets Counterspell") with ✎ to jump back; the list stops at about a third of the screen and scrolls with a fade and an "N cards · scroll the list for the rest" line; zone tags at its foot (All · Stack 3 · …) light that zone's rows and dim the rest, never hiding any; once reviewed it collapses to one line of names so the question box has room; the question box is REQ-206's pill (blank hint "How does this resolve?"); no "Sending to TheJudge" line
+  - **the chat** is the shared workspace with the Cards strip, **View Context** beside the title, and the same bubble, wait, chips and send pill as Ask a Question; **✎ Edit** returns to the review with everything kept (the conversation is saved to history first); **↺ Start over** follows REQ-029
+  - tests cover rail navigation and the Context bounce, the carried-card guardrail and Leave out, drag and button reorder with tag renumbering, the Stack order reaching the request, the menu's Move to and Remove, and a sign draw with no repeats
+- Constraints:
+  - every field today's staged flow collects is kept; the request contract is unchanged except as REQ-210 and REQ-211 separately decide
+  - drag reorder is built on pointer events with no drag-and-drop library (NFR-004, NFR-006)
+  - staged state stays in the destination's existing state and Draft slot (REQ-108); no new store
+- Dependencies:
+  - REQ-005
+  - REQ-006
+  - REQ-009
+  - REQ-010
+  - REQ-016
+  - REQ-017
+  - REQ-021
+  - REQ-029
+  - REQ-031
+  - REQ-100
+  - REQ-108
+  - REQ-206
+  - REQ-208
+  - FLOW-001
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30) from the owner's direction-1 mockup rounds 2–14
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -148,3 +148,3 @@
 |---|---|
-| Purpose | Players, phase, notes before zones |
+| Purpose | Station 1 · Game: players, phase, notes before zones — one plate under "Game context" (REQ-209) |
 | Phone | Shell width band; roster/controls in first viewport when practical; expanded secondary details stay within width and align to their player row (DEC-128) |
@@ -152,4 +152,4 @@
 | Fit | Prefer no page scroll for primary confirm path; dense multiplayer may region-scroll inside roster panel if needed |
-| Player-detail controls | Shipped shapes (ui-review, 2026-08-11), measured identical at 390x844 and 1440x900: both disclosures paint **one shared 20x20 inline-SVG triangle** rotated 90 degrees when expanded, inside an unboxed hit area (56x44 outer roster, 44x44 per-player) — no text glyph, no border/fill box. Commander-damage, named-counter, and scalar rows share **one grouped row pattern**: content-sized leading element, one declared 8px gap, then the control (the retired `grid-cols-[1fr_auto]` stretched that gap to 457px on desktop). Poison / energy / experience are **stacked 78px content-sized selects** with an explicit `Unset` option and fixed ranges 0-11 / 0-100 / 0-100; a seeded out-of-range value stays selectable. Three expanded players occupy 720px of secondary-detail height. Commander damage stays a free-typed unbounded numeric input |
-| Notes | DEC-120, DEC-128, REQ-106, DEC-145, REQ-137, REQ-138, REQ-144 |
+| Player-detail controls | One shared "More details for all players" toggle (REQ-209, REQ-100) reveals every player's secondary details. Commander-damage, named-counter, and scalar rows keep **one grouped row pattern** (content-sized leading element, one declared 8px gap, then the control). Poison / energy / experience stay **content-sized bounded selects** with an explicit `Unset` option and fixed ranges 0-11 / 0-100 / 0-100; a seeded out-of-range value stays selectable. Commander damage stays a free-typed unbounded numeric input. Superseded geometry: per-player 20x20 triangle toggles (56x44 roster, 44x44 per player) and 78px selects measured 2026-08-11 |
+| Notes | DEC-120, DEC-128, REQ-106, DEC-145, REQ-137, REQ-138, REQ-144, REQ-209 |
 
@@ -159,3 +159,3 @@
 |---|---|
-| Purpose | Select zones for the question |
+| Purpose | Station 2 · Zones: choose the zones for the question as glowing tiles (REQ-209) |
 | Phone / Desktop | Shell width bands as suite shell; content-sized vertically (DEC-145); primary confirm reachable in the first viewport when practical |
@@ -168,3 +168,3 @@
 |---|---|
-| Purpose | Add cards to selected zones (search/scan) |
+| Purpose | Station 3 · Cards: add cards per zone (search / scan / carried), a shelf per zone tab, the card menu, and placement of carried cards (REQ-209) |
 | Phone | Shell width band. **Search / scan:** the flexible search input and labeled Scan button share one non-wrapping row; Scan keeps the 44px touch floor while search takes remaining width (DEC-050/REQ-125). **Selected-card/add preview:** image uses the legibility-first shell-column treatment (clear majority of content width); the search field shows the exact selected name; no duplicate name/title renders below the art; Add action sits directly below and remains in the first viewport (REQ-125/129/141). The row height reclaimed from Scan may support the larger image but does not relax that Add bound. **Added cards:** horizontal L→R strip with region scroll (REQ-130), tiles sized so **at least three are visible at 390×844 without scrolling the strip**, with images filling tile interiors under DEC-160. Superseded geometry: fixed `w-40` / 160px tiles, measured live on 2026-09-24 as 146×203 images in a 256px-tall region with a 265px visible width against a 326px scroll width — about 1.8 tiles visible, which is the owner-reported "cards get too big once a zone fills" friction. Detail uses the corner popup everywhere (REQ-128/DEC-158) |
@@ -174,2 +174,12 @@
 
+#### In-depth details — card menu and carried-card placement
+
+| | |
+|---|---|
+| Purpose | Act on one shelf card (Move to · order · Card details · Remove); place carried cards one at a time |
+| Phone | Card menu: bottom sheet. Placement: the context-sheet shell with the card as hero and one tile per chosen zone |
+| Desktop/tablet | Card menu: a pop-over beside the card (under, over, or beside it) pointing at it. Placement: as phone, within the shell width |
+| Fit | Overlay; no page scroll; the placement body region-scrolls when many zone tiles show |
+| Notes | REQ-209, REQ-205. Move-to signs are the app's own line drawings (REQ-201) |
+
 #### In-Depth — Enrichment
@@ -178,6 +188,6 @@
 |---|---|
-| Purpose | Optional per-card notes + question before decrypt |
-| Phone / Desktop | Shell width bands; content-sized vertically (DEC-145); card images size to the content column (DEC-160) — a clear majority of column width at 390×844, growing further at desktop — with the corner detail popup for metadata (DEC-151/DEC-158) and only **Remove card** beside/below the image (REQ-133); question composer matches FollowUp composition with initial **Send Request** label (DEC-146/153); lists region-scroll |
+| Purpose | Station 4 · Context: one compact sheet per card, then the review and the question (REQ-017, REQ-209) |
+| Phone / Desktop | Shell width bands; content-sized vertically (DEC-145). Context sheet: the card's art at the left (210px desktop, 96px phone with the form below) beside a short form, with the corner detail popup for metadata (DEC-151/DEC-158). Review: the list stops at about a third of the viewport and region-scrolls with a fade, collapsing to one line of names once reviewed; the question box is the shared send pill composer (REQ-206) |
 | Fit | Composer growth must not force page scroll or clip chrome below the field (REQ-110); card image growth is bounded by the same no-page-scroll rule (REQ-129), with any needed cap recorded on this row |
-| Notes | DEC-146, DEC-153, REQ-110, REQ-132, DEC-145, DEC-151, DEC-158, DEC-160, REQ-133, REQ-141 |
+| Notes | DEC-146, DEC-153, REQ-110, REQ-132, DEC-145, DEC-151, DEC-158, DEC-160, REQ-133, REQ-141, REQ-017, REQ-209 |
 
@@ -187,6 +197,6 @@
 |---|---|
-| Purpose | Frozen game context + chat follow-ups |
-| Phone / Desktop | Same shared conversation workspace rules as Quick Question answered |
+| Purpose | In-depth details — answered: frozen game context + chat follow-ups; when the ruling arrives the station rail and the flow give way to the chat (REQ-209) |
+| Phone / Desktop | Same shared conversation workspace rules as the Ask a Question answered row (REQ-206): the same Cards strip, question-first thread, solid judge's bubble under the colour's seal, tappable card-name chips, and docked send-pill composer. The title row carries **View Context** (opening the frozen setup/zone/card/enrichment detail in the `#### View Context / adaptive context overlay` row), **✎ Edit** (back to the review with everything kept; the conversation is saved to history first) and **↺ Start over** (REQ-029). The banner header (REQ-207) is in flow, so the title row needs no compensating top clearance, and the ☰ button's hit area never overlaps View Context at 390×844 or 1440×900 (REQ-107, REQ-116, REQ-136 as amended) |
 | Fit | No page scroll; thread region-scrolls |
-| Notes | DEC-118, DEC-127, DEC-131 |
+| Notes | DEC-118, DEC-127, DEC-131, REQ-025, REQ-029, REQ-107, REQ-116, REQ-136, REQ-206, REQ-207, REQ-209 |
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -59,8 +59,10 @@
 
-- Built: In-Depth Question is a feature-portal destination (registry id
-  `in-depth`, DEC-094 / FLOW-010) reached through the shared Menu rail; it is the
-  suite's primary MTG Assistant feature, not the whole app. The staged flow is a
-  four-step wizard — **game context → zone confirmation → zone collection →
-  enrichment** — driven by a frontend state machine, then a submit that opens the
-  answered workspace. (FLOW-001, DEC-094)
+- Built: In-Depth Question is **In-depth details** (registry id `in-depth`, route
+  `/in-depth`, DEC-094 / FLOW-010), reached through the Ask a Question page's **Add
+  in-depth details** pill or a deep link; the Menu marks Ask a Question current
+  while it is open. The staged flow is four stations on a tappable progress rail —
+  **1 Game · 2 Zones · 3 Cards · 4 Context** — driven by a frontend state machine,
+  then a review and the question; each station's panel ends in a lit bar naming
+  the next step, and Context bounces back to Cards while a carried card is
+  unplaced. (FLOW-001, DEC-094, REQ-209)
 - Built: each staged step renders the active step name as an eyebrow label above
@@ -129,8 +131,10 @@
 
-- Built: after game context, a zone checklist appears preselected from the chosen
-  turn phase (2 zones per phase by default). The player toggles any v1 zone —
-  `stack`, `battlefield`, `hand`, `graveyard`, `exile`, `library`, `command` — on
-  or off; selections are stored in `gameContext.selectedZones`, and at least one
-  zone is required to continue. Phase defaults are UX hints, not legality rules.
-  (REQ-016, DEC-024, DEC-035)
+- Built: after game context, the Zones station shows the seven-zone checklist as
+  tiles, preselected from the chosen turn phase (2 zones per phase by default); a
+  chosen tile glows, zone tiles and summary chips are solid, and empty zones are
+  dashed. The player toggles any v1 zone — `stack`, `battlefield`, `hand`,
+  `graveyard`, `exile`, `library`, `command` — on or off; selections are stored in
+  `gameContext.selectedZones`, and at least one zone is required to continue.
+  Phase defaults are UX hints, not legality rules. (REQ-016, DEC-024, DEC-035,
+  REQ-209)
 - Built: the zone-confirmation helper reads exactly `Select all zones that apply
@@ -164,7 +168,10 @@
   REQ-009, REQ-010, FLOW-002, FLOW-004)
-- Built: added cards render in a horizontal left-to-right strip in add order with
-  horizontal region scroll (not document scroll), for every zone including stack;
-  each tile keeps Remove, stack-position label, and a card image sized to the
-  tile interior, with the corner detail popup as the read path. Non-stack cards
-  capture an owner. (DEC-151, DEC-160, REQ-130, REQ-058, FLOW-002)
+- Built: the Cards station puts **Add card** and **Scan** on their own row under
+  the rail, one tab per chosen zone with its count, and a lit, horizontally
+  region-scrolling shelf of real card images for the chosen tab, in the order the
+  player set (add order until reordered); a tap on a card opens its menu (Move to,
+  order, Card details, Remove). Only the Stack wears BOTTOM … TOP tags. Cards
+  carried from Ask a Question are placed one at a time before the player can move
+  on. Non-stack cards capture an owner. (DEC-151, DEC-160, REQ-130, REQ-058,
+  REQ-209, FLOW-002)
 - Built: each `ZoneCardItem` carries a stable frontend-only `instanceId` assigned
@@ -192,5 +199,6 @@
   added this turn, tapped status, gained abilities). (REQ-017, DEC-028, FLOW-001)
-- Built: before submit, enrichment shows a pre-decrypt summary of which
-  selected zones are populated and the fallback question that will be sent if
-  the player leaves the question field blank. (DEC-028, REQ-011, REQ-017)
+- Built: before submit, the review lists every card's context in words with ✎ to
+  jump back, zone tags that light one zone's rows, and the question box; a blank
+  question shows the hint "How does this resolve?" and sends the zone-aware
+  fallback. (DEC-028, REQ-011, REQ-017, REQ-209)
 - Built: targets use `ContextTarget` — player targets (`targetPlayer`), card
```

- Verdict: accept
- Reason:

## REQ-213 — Question History: one list for every question, reopened live (new)

**What this decides:** whether Question History shows every past question in one list and reopens any of them live.

**In plain terms:** Today each question screen's history shows only its own kind, from a drawer opened by a small History icon beside the Menu (REQ-103, REQ-107). The store already keeps the last 20 of both kinds together; each screen filters. The mockup makes Question History a Menu row under Ask a Question, opening the shared sheet with one list of both kinds ("n of 20"). Each row shows the cards as a small fan, the question, the first line of the ruling and one line of detail. On a phone a tap reopens that conversation straight away, ready for a follow-up; from 600px wide the sheet has two panes — the list, and the chosen conversation in full with Open conversation and Delete this question. The History icon beside the Menu goes away.

**What happens if you say no:** history stays split per screen in today's drawer, with the History icon on the rail.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,28 @@
 
+### REQ-213
+- Title: Question History — one list for every question, reopened live
+- Priority: medium
+- Description: Question History is a Menu row directly under Ask a Question that opens the shared sheet (REQ-208) with one list of the last 20 saved conversations from both question kinds, each row reopening its conversation live in its own flow. It replaces the per-flow History drawer and the History zone on the Menu rail.
+- Acceptance Criteria:
+  - the list holds both kinds (Ask a Question and In-depth details) most-recent-first from the one existing store, capped at 20 across both (a 21st prunes the oldest); the head shows the title and "n of 20"; each flow's Draft (REQ-108) shows as its own row above the saved conversations
+  - every row shows the conversation's cards as a small fan of thumbnails (three, then "+n"; a dashed frame for none), the question, the first line of the ruling, and one meta line (Ask or In-depth · cards · the game context for In-depth · follow-ups · when)
+  - below `600px` a tap closes the sheet and reopens that conversation live in its own flow — an Ask a Question conversation on the Ask a Question page with its cards in the strip, the thread, and "Reopened from your history" under the title; an In-depth conversation in In-depth details' chat with View Context — with the follow-up box ready
+  - from `600px` the sheet has two panes: the list, and the chosen conversation read in full with **Open conversation** and **Delete this question** at its foot; below `600px` each row keeps its delete control; deleting confirms first and deleting the active conversation clears it without re-saving (REQ-118)
+  - opening a conversation from mid-flight staging snapshots the Draft first, as today (REQ-108)
+  - tests cover the merged list across both kinds, the cap, reopening each kind into its own flow, and the two-pane layout from `600px`
+- Constraints:
+  - frontend-only, browser-local; no storage key, entry shape or cap change — only the per-flow list filter is removed
+  - no request or prompt change
+- Dependencies:
+  - REQ-103
+  - REQ-104
+  - REQ-107
+  - REQ-108
+  - REQ-118
+  - REQ-206
+  - REQ-207
+  - REQ-208
+  - FLOW-016
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30)
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -106,7 +106,7 @@
 |---|---|
-| Purpose | List/restore/delete saved conversations |
-| Phone | Left-edge full-height; width ≈ `min(22rem, 88% viewport)` (DEC-134) |
-| Desktop/tablet | Left-edge full-height; width ≈ `min(30rem, 90% viewport)` |
-| Fit | Overlay; list may region-scroll inside drawer |
-| Notes | DEC-124, DEC-134, DEC-126. Mutually exclusive with Menu tray |
+| Purpose | Question History: list, reopen and delete saved conversations of both question kinds (REQ-213) |
+| Phone | The shared sheet (REQ-208) as a bottom sheet below `600px`; one list; a tap reopens the conversation |
+| Desktop/tablet | The shared sheet as a floating centred card from `600px` up, in two panes: the list and the chosen conversation with Open conversation / Delete this question. Superseded geometry: a left-edge full-height drawer, `min(22rem, 88vw)` phone / `min(30rem, 90vw)` desktop (DEC-134) |
+| Fit | Overlay; the list and the reading pane region-scroll inside the sheet body; head and foot fixed |
+| Notes | DEC-124, DEC-126, REQ-208, REQ-213. Opened from the Menu's Question History row; no rail History zone |
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -227,19 +227,20 @@
   FLOW-016, DEC-103-precedent)
-- Built: the drawer opens from the **History zone of the Menu corner rail** on
-  In-Depth Question and Quick Question, always present — including empty history,
-  every pre-submit step, and immediately after Start Over — and must not overlap
-  View Context. It presents as a left-edge, full-height drawer at every viewport,
-  mutually exclusive with the Menu tray via `LeftEdgeDrawerContext`. Selecting a
-  saved conversation on In-Depth from any staged step lands the flow on the answered
-  workspace in the same action. (DEC-126, DEC-129, DEC-134, DEC-125, FLOW-016)
+- Built: **Question History** is a Menu row directly under Ask a Question, present
+  on every destination, opening the shared sheet (REQ-208) with one list of both
+  question kinds — the 20 most recent saved conversations, "n of 20" in the head.
+  Each row shows a fan of the conversation's cards, the question, the ruling's
+  first line and one meta line. Below `600px` a tap reopens that conversation live
+  in its own flow; from `600px` the sheet shows the list beside the chosen
+  conversation with Open conversation and Delete this question. (REQ-213, DEC-124,
+  FLOW-016)
 - Built: each conversation-bearing destination keeps exactly one browser-local
   **Draft** slot snapshotting mid-flight staging (typed question, optional card,
-  staged game/zones/enrichment, current step) so Menu navigation, reload, or opening
-  a saved conversation do not wipe pre-submit work. The drawer lists Draft as its own
-  row, distinct from completed entries; selecting it restores staged state. Draft
-  auto-hydrates the mid-flight UI on destination mount (reload or Menu return). The
-  first successful submit clears Draft and the conversation enters completed history;
-  Draft does not count toward the 20-entry cap. Opening a saved conversation from
-  mid-flight staging silently snapshots Draft first, in both destinations. (DEC-130,
-  DEC-138, FLOW-017)
+  staged game/zones/enrichment, current step) so Menu navigation, reload, or
+  opening a saved conversation do not wipe pre-submit work. Question History lists
+  each Draft as its own row above the saved conversations; selecting it restores
+  staged state. Draft auto-hydrates the mid-flight UI on destination mount (reload
+  or Menu return). The first successful submit clears Draft and the conversation
+  enters completed history; Draft does not count toward the 20-entry cap. Opening a
+  saved conversation from mid-flight staging silently snapshots Draft first, in
+  both destinations. (DEC-130, DEC-138, FLOW-017, REQ-213)
 - Built: each completed row exposes a delete control, distinct from select-to-resume,
```

- Verdict: accept
- Reason:

## REQ-214 — The card scanner in the new frame, with a holding list (new, owner-edited)

**What this decides:** how the card scanner looks, how a scanned card reaches its destination, and how a player leaves it, without changing how it recognises cards.

**In plain terms:** The scanner keeps everything it does today: continuous auto-scan, the lock-on, the "ding", manual capture, the Debug overlay, and the list of cards scanned this session. It is re-dressed: a lit viewfinder in the colour's light with three bands (status and count on top, the card guide in the middle, sound · credit · Debug at the foot), a camera-shutter button for manual capture, an ✕ box above the camera's top-right corner as the only way out, one count pill, and a yellow caution triangle explaining that scanning is experimental. The count pill, today only on In-Depth's zones, joins Ask a Question and Trade Balancer too. A scanned card now waits in the scanner's own holding list, shown by the count pill with Remove on each entry; it joins the zone or trade side only when the player closes the scanner and thereby accepts the list — not the instant it is recognised. This restores the mockup's original "join your question when you close the scanner" behaviour, which an earlier pass of this proposal had replaced with add-on-recognition.

**What happens if you say no:** the scanner keeps today's "Capture" and "Exit scan" text buttons in the new colours.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,32 @@
 
+### REQ-214
+- Title: Card scan in the direction-1 chrome
+- Priority: medium
+- Description: The shared camera scanner (FLOW-006) keeps its engine and behaviour and takes the direction-1 presentation on every host (In-depth details' Cards station, Ask a Question, Trade Balancer): a lit viewfinder with three non-overlapping bands, a shutter for manual capture, an ✕ as the only exit, one count pill holding this session's scanned cards until the scanner closes, an experimental-feature caution, and a themed Debug panel.
+- Acceptance Criteria:
+  - the viewfinder is a frame lit in the colour's edge with three bands that never overlap: the indicator pill and the count pill on top, the card guide in the middle, sound · "Powered by Cardomancer" · Debug at the foot
+  - the guide is a thin line of the colour's light that breathes slowly while locking (no flashing glow); the lock outline is a thin, slow marching dash of the colour's light; the indicator ("Locking on <card>" with the vote bar, "Good — hold steady", "Camera unavailable", the searching hints) is a themed pill
+  - manual capture is a camera shutter centred in the foot band (a 54px ring of the colour's light round a 40px filled disc that sinks when pressed; accessible name "Capture"); it still reads one frame by hand, and the hint says so
+  - the only way out is a box with an ✕ above the camera's top-right corner (accessible name "Exit scan"); the flow's ‹ back arrow is absent while the camera is open
+  - one count pill in the frame's top right lists the scanner's own holding list for this session, each entry with Remove; its foot names the destination the list will join when the scanner closes ("Joins the Stack", "Joins Side A"); there is no "✓ n added" chip; the pill appears on every host
+  - a yellow caution triangle beside the count opens a pop-up — "Card scanning is experimental — this feature is experimental and isn't fully functioning yet…" — with **Got it**
+  - Debug dresses the shipped overlay in the colour: the detected outline and art region on the feed, and the live numbers (match, thresholds, frame, camera) as a grouped panel under the frame with small bars for votes, glare, sharpness and quality
+  - closing the scanner (✕) adds every card in the holding list to the zone or side the scanner was opened from, in one step, then returns to where it was; Remove in the pill before closing drops a card from the holding list with nothing added for it
+  - every Scan button opens the scanner at an empty holding list and returns to where it was once closed
+  - tests cover the exit path committing the holding list to its destination, the pill as a per-session holding list on each host, Remove from the holding list, the caution pop-up, and that detection, lock and capture behaviour are unchanged
+- Constraints:
+  - presentation only: detection, fingerprint matching, lock thresholds, the stabilizer, the ding, mute persistence and debug frame export are unchanged (DEC-052…062; NFR-006's scan-motion exclusion covers lock and confirmation motion, not the new chrome)
+  - a recognised card is added to the scanner's own holding list (a scan-local store), not the destination, the moment it is recognised; Remove in the pill removes from the holding list; the destination's own card list only changes when the scanner closes and commits the held cards
+- Dependencies:
+  - REQ-037
+  - REQ-040
+  - REQ-041
+  - REQ-042
+  - REQ-068
+  - REQ-200
+  - REQ-205
+  - REQ-206
+  - REQ-209
+  - FLOW-006
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30), from the mockup's own "join your question when you close the scanner" pill foot; an earlier pass of this proposal had kept today's add-on-recognition instead, which the owner's gate-review edit (2026-10-01) reversed back to the mockup's rule
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -200,2 +200,3 @@
 | Fit | Scan UI is its own full-bleed workspace; region overlays only. The review list region-scrolls — larger images mean more scrolling, which is accepted (DEC-160) — but the review bubble must not displace or overlap the camera frame (DEC-090/REQ-129) |
+| Chrome | Lit viewfinder with three non-overlapping bands (indicator + count pills · guide · sound/credit/Debug); shutter centred in the foot band; ✕ exit box above the camera's top-right corner; Debug panel under the frame (REQ-214) |
 | Notes | DEC-090, DEC-160, REQ-129, DEC-052 family — do not re-layout scanner internals from generic “stretch” feedback. Scan review was outside `ui-review`'s original scope and is affected only because `ScanReviewBubble` consumes the shared `CardPresentation`; the density trade is documented in DEC-160. **Verify live at 390×844**: if the enlarged review bubble starves the camera frame, record a bounded image cap on this row — never fork the shared component |
--- a/PRD/sections/scan/README.md
+++ b/PRD/sections/scan/README.md
@@ -40,6 +40,8 @@
 
-- Built: the scanner opens a full-screen camera surface with a card-shaped
-  guide reticle (`745/1040`) and a dimmed surround; it auto-scans continuously
-  and a manual **Capture** button is always available. (DEC-052, REQ-037,
-  FLOW-006)
+- Built: the scanner opens a full-screen camera surface with a card-shaped guide
+  reticle (`745/1040`) inside a viewfinder lit in the colour's edge, with three
+  non-overlapping bands (indicator and count pills on top, the guide in the middle,
+  sound · credit · Debug at the foot); it auto-scans continuously, and a manual
+  camera-shutter control (accessible name **Capture**) sits centred in the foot
+  band. (DEC-052, REQ-037, REQ-214, FLOW-006)
 - Built: the camera is requested at a higher-resolution mode — `getUserMedia`
@@ -106,12 +108,14 @@
   unmuted if storage is unavailable). (DEC-057, DEC-061, REQ-040, REQ-042)
-- Built: a top-right **scanned-cards review bubble** shows the running count of
-  this-session adds and expands to a viewport-capped 320px panel listing each
-  card with a single-tap, no-confirmation **Remove**. It operates on the
-  destination's own card list (no scan-only store), and each entry uses the
-  shared container-relative image + corner-detail presentation. The corner detail
-  popup fetches its descriptive fields on demand by oracle id (REQ-175, FLOW-024)
-  when opened and the network allows, degrading gracefully offline; when no image
-  is available the entry falls back to the card name only, with no fetch triggered
-  by image failure, so the scan-review surface stays usable offline (DEC-078).
-  (DEC-058, DEC-078, DEC-151, REQ-040, REQ-175, FLOW-006, FLOW-024)
+- Built: a top-right **count pill** holds this scanning session's own list of
+  scanned cards (a scan-local store, not the destination's own card list) and
+  expands to a viewport-capped 320px panel listing each card with a single-tap,
+  no-confirmation **Remove**; its foot names the destination the list joins when
+  the scanner closes. Each entry uses the shared container-relative image +
+  corner-detail presentation. The corner detail popup fetches its descriptive
+  fields on demand by oracle id (REQ-175, FLOW-024) when opened and the network
+  allows, degrading gracefully offline; when no image is available the entry
+  falls back to the card name only, with no fetch triggered by image failure, so
+  the scan-review surface stays usable offline (DEC-078). Closing the scanner
+  commits every held card to the destination's own card list in one step. A
+  yellow caution triangle beside the pill opens a pop-up saying card scanning is
+  experimental, with Got it. (DEC-058, DEC-078, DEC-151, REQ-040, REQ-175,
+  REQ-214, FLOW-006, FLOW-024)
 - Built: the scan preview and the added card's thumbnail show the **scanned
@@ -167,2 +171,6 @@
   intercept the correction path. (DEC-060, DEC-065, REQ-041)
+- Built: the Debug view is dressed in the profile's colour: the detected outline
+  and art region on the feed, and the live numbers (match, thresholds, frame,
+  camera) as a grouped panel under the frame with small bars for votes, glare,
+  sharpness and quality. Read-only as before. (REQ-041, REQ-214)
 - Built: while the overlay is enabled, the existing **Capture** button also
@@ -185,14 +193,13 @@
 - Built: while scan is open the destination's own search input, card list, and
-  outer staged-flow navigation are hidden; scan-local controls including
-  **Capture** remain, and **Exit scan** (top-right on the camera surface) is the
-  path back to manual search or normal navigation. (DEC-076, REQ-056, FLOW-006)
-- Built: the scanner's accent visuals (reticle, lock/progress indicator,
-  confirmation popup, review bubble) restyle with the selected app palette
-  rather than fixed sky/emerald — an approved presentation-only exception to
-  DEC-050's separate scoping that changes no capture, matching, or lock
-  behavior. The lock indicator and the add-to-stack confirmation popup were
-  among the previously-fixed emerald "semantic-green" states DEC-068 moved
-  onto the palette app-wide; the dominant page background behind the staged
-  scan screens stays neutralized to slate rather than palette-tinted, same as
-  elsewhere in the app. (DEC-068, REQ-046)
+  outer staged-flow navigation (including the ‹ back arrow) are hidden; scan-local
+  controls including the **Capture** shutter remain, and an ✕ box above the
+  camera's top-right corner (accessible name **Exit scan**) is the only path back to
+  manual search or normal navigation. (DEC-076, REQ-056, REQ-214, FLOW-006)
+- Built: the scanner's accent visuals (viewfinder edge, guide, lock outline,
+  indicator pill, confirmation popup, count pill) restyle with the selected
+  profile — the guide breathes slowly while locking and the lock outline is a slow
+  marching dash — an approved presentation-only exception to DEC-050's separate
+  scoping that changes no capture, matching, or lock behavior. The page behind the
+  scan screens follows the REQ-200 token set like every other screen. (DEC-068,
+  REQ-046, REQ-200, REQ-214)
 
@@ -224,8 +231,8 @@
 
-- Built: scan is **one of two ways** to resolve the optional single card before
-  asking a rules question — typed autocomplete search or camera scan, using the
-  same FLOW-006 engine — and card input is optional (the player may ask with no
-  card attached). A scan resolves to exactly one oracle-level `CardMetadataItem`;
-  only one card is active at a time, and there are no zones, stack, or
-  per-card enrichment controls. (DEC-107, REQ-073, FLOW-011)
+- Built: scan is **one of two ways** to attach a card before asking a rules
+  question — typed autocomplete search or camera scan, using the same FLOW-006
+  engine — and card input is optional (the player may ask with no card attached).
+  Each scan resolves to one oracle-level `CardMetadataItem` held in the scanner's
+  holding list until the scanner closes, when it joins the card stage, up to the
+  lookup cap (REQ-167); there are no zones, stack, or per-card enrichment
+  controls on this page. (DEC-107, REQ-073, REQ-167, REQ-214, FLOW-011)
 - Built: printing-level scan identity stays presentation-only and is not pushed
```

- Verdict: edit
- Reason: Scanned cards go to their own holding list inside the scanner first, and join the destination (zone or trade side) only when the player closes the scanner and thereby accepts the list — not the instant each card is recognised. The count pill shows that holding list. (Owner, 2026-10-01; replaces today's add-on-recognition rule for the scanner's new frame.)

## REQ-215 — Trade Balancer: piles of gold, a verdict line, New trade, named sides (new)

**What this decides:** how Trade Balancer shows who is ahead, and whether it gets a New trade button and renamable sides.

**In plain terms:** Today the balance is a line of text: "Even trade" or "Side A is ahead by $1.85" (REQ-064). The mockup draws two piles of gold that grow with each side's value — the richer side is always the biggest hoard, and the lighter side's pile is sized by its share of the richer — with a plain verdict under them: "Fair trade" (95% or closer), "Slightly favors …" (85–95%), "Leans toward …" (60–85%), "Lopsided — … by NN%" (under 60%), or "Even", and the dollar difference beneath. It adds a ↺ New trade chip that asks first ("Start a new trade?") and clears both sides, and a side can be renamed by tapping its name. Neither exists today. Prices, totals and the no-history rule are unchanged.

**What happens if you say no:** the text line stays; clearing a trade means removing each card; the sides stay "Side A" and "Side B".

**Recommendation:** accept.

Proposed `PRD/sections/` diff (new, reserved):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5158 +5158,32 @@
 
+### REQ-215
+- Title: Trade Balancer — two piles of gold, a verdict line, New trade, and named sides
+- Priority: medium
+- Description: Trade Balancer shows the balance as two piles of gold that grow with each side's value and a verdict line in plain words, adds a New trade action that asks first, and lets the players rename a side. Totals arithmetic, pricing, the price route and the ephemeral posture are unchanged (REQ-064, REQ-065).
+- Acceptance Criteria:
+  - the whole screen fits the viewport at 390×844 and 1440×900 with only the entry lists scrolling (one per side); at `768px`+ each side's total sits in its foot, the sides stopping about 36px short of the viewport foot; nothing sits below the fold
+  - every entry shows its card image (a tap opens the card detail); entries keep add order; changing a printing or finish edits the row in place; foil entries carry a moving sheen (still under reduced motion)
+  - two piles of gold sit on a solid panel (the side panels' fill, no glow or wash); each pile has five tiers — loose coins and a two-coin stack · two taller stacks · a mound with a stack at its peak · a larger mound with a purple gem and taller side stacks · a hoard with a chalice on the largest mound and scattered coins — drawn in flat gold and amber with a bronze outline and one purple gem
+  - tiers are relative: the richer side is tier 5; the lighter side's tier is its share of the richer (95%+ → 5, 75%+ → 4, 50%+ → 3, 25%+ → 2, under → 1); the richer pile glows and the lighter dims a step; a tier-up drops in from above with a slight overshoot (550ms, ~90ms stagger), a tier-down lifts and fades, nothing loops idle, and the piles update live; empty state: the bare ground line and "Add cards to weigh the trade"
+  - the verdict line under the piles, by the smaller side's share of the larger: 95%+ "Fair trade" · 85–95% "Slightly favors <side>" · 60–85% "Leans toward <side>" · under 60% "Lopsided — <side> by NN%"; "Even" when the totals are equal to the cent; the plain dollar difference sits beneath ("Side A +$1.85")
+  - a **↺ New trade** chip sits top-right beside the title; with cards on either side it opens the shared confirm sheet (REQ-208) — "Start a new trade?", how many cards and how much value it clears, side names kept; **Keep this trade** / **↺ Clear both sides**; with both sides empty it does nothing
+  - a side is renamed by tapping its name (a short inline text field, 1–20 characters; blank restores the default); the name is used in the verdict, the difference, the tabs and the scan pill, and lives only as long as the trade
+  - the price date sits in the header's right-hand slot at `768px`+ and under the title below `768px` (REQ-145 copy unchanged)
+  - below `768px` Side A / Side B are tabs sharing one panel with both totals in the tab labels (REQ-204)
+  - tests cover each tier boundary, each verdict band and Even, the New trade confirm and its no-op when empty, renaming, and totals unchanged by any of it
+- Constraints:
+  - totals, pricing, printing selection, the price route, the warm-up ping and the ephemeral no-persistence posture are unchanged (REQ-064, REQ-065, REQ-066, REQ-175); side names are not persisted
+  - the piles are the app's own flat drawings shipped as local static files (REQ-201); CSS-only motion (NFR-006)
+- Dependencies:
+  - REQ-064
+  - REQ-065
+  - REQ-145
+  - REQ-201
+  - REQ-204
+  - REQ-205
+  - REQ-208
+  - NFR-006
+  - FLOW-009
+- Notes:
+  - reserved and proposed by the `ui-reimagining-build` package (2026-09-30); the mockup also tried Add cash, Swap sides and Copy summary and removed them — none ships
+
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -221,2 +221,3 @@
 | Price freshness | Date-level copy only — `Prices as of 5 June 2026`, formatted from the artifact's ISO `snapshotDate` with no raw `T`, milliseconds, or zone suffix, so it never reads as a live quote. One line at 390x844 (`scrollWidth` 299 = `clientWidth`). An unparseable artifact value omits the line entirely rather than printing raw data (ui-review, 2026-08-11, REQ-145) |
+| Balance | Two piles of gold on a solid panel with the verdict line and dollar difference beneath; the whole screen fits 390×844 and 1440×900 with only the entry lists scrolling; at `768px`+ the sides stop about 36px short of the foot with each total in its foot (REQ-215) |
 | Notes | DEC-087, DEC-145, REQ-145, REQ-065, REQ-204. Desktop/tablet paired sides are protected scope — the phone tab treatment must not reach the `768px`+ composition |
--- a/PRD/sections/trade-balancer/README.md
+++ b/PRD/sections/trade-balancer/README.md
@@ -45,2 +45,10 @@
   "suggest cards to balance" logic. (REQ-064)
+- Built: the balance is drawn as **two piles of gold** on a solid panel, each grown
+  through five tiers relative to the richer side (the richer is always tier 5; the
+  lighter's tier is its share: 95%+ → 5, 75%+ → 4, 50%+ → 3, 25%+ → 2, under → 1),
+  with a verdict line beneath — "Fair trade", "Slightly favors …", "Leans toward
+  …", "Lopsided — … by NN%", or "Even" — and the plain dollar difference under
+  it. A **↺ New trade** chip asks first through the shared confirm sheet and clears
+  both sides; a side is renamed by tapping its name, for this trade only.
+  (REQ-215, REQ-208)
 - Built: reached as the `trade-balancer` feature-portal destination; the MTG
@@ -137,2 +145,4 @@
   resolved. (REQ-145)
+- Built: the price date sits in the header's right-hand slot at `768px`+ and under
+  the title below `768px`. (REQ-215, REQ-145)
 
```

- Verdict: accept
- Reason:

## REQ-202 — Life Tracker's back menus take the new look; the table stays untouched

**What this decides:** whether Life Tracker's Game Setup and a player's Counters panel take the new look, while the life table itself stays exactly as it is.

**In plain terms:** Today's rule (REQ-202) says the redesign leaves all of Life Tracker's own screens alone — including Game Setup, Reset / New Game, the commander-damage grid and the counter palette. The owner asked for those back menus to be redrawn (mockup round 11) and approved the result (rounds 13–14). This narrows the rule: the table — seats, life numbers, layout, day/night, the seat map, and all saved state and behaviour — stays untouched to the pixel. The sheets that open from it take the shared look: Game Setup fits one phone screen, Reset and New game ask first through the shared confirm sheet, and a player's Counters has two tabs (commander damage as the seat map with LETHAL at 21; counters as tiles with a ⋯ menu to take one away, set or clear). Every control, option, default and range stays the same. The before/after screenshot pair still gates every slice that touches it.

**What happens if you say no:** Life Tracker's sheets keep today's look; only the header above the table changes.

**Recommendation:** accept.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -4965,4 +4965,7 @@
   does — the menu rail, brand mark, theme section, overlays, and page shell.
-  Life Tracker's own screens, counters, layout, and `lib/lifeTracker/` state
-  are untouched by the redesign. Every slice that touches shared chrome, the
+  Life Tracker's table (seats, life numbers, layout, day/night, the seat map), its
+  `lib/lifeTracker/` state, persistence and behaviour are untouched by the
+  redesign; the sheets that open from it (Game Setup, a player's Counters, the
+  confirm) take the shared look with every control, option, default and range
+  unchanged (REQ-208). Every slice that touches shared chrome, the
   token set, or the shared stylesheet attaches a Life Tracker before/after
@@ -4984,6 +4987,8 @@
     its full-height counter panel (DEC-139) are unaffected
-  - `lib/lifeTracker/` state, persistence, the commander-damage matrix, the
-    counter palette, day/night, Game Setup, Reset/New Game, and the one-way MTG
-    Assistant seed are untouched by the redesign packages
-  - automated coverage asserts Life Tracker's own screens, counters, layout,
+  - `lib/lifeTracker/` state, persistence, commander-damage and counter values,
+    day/night, and the one-way MTG Assistant seed are untouched; Game Setup,
+    Reset / New Game and a player's Counters change only their presentation
+    (the shared sheet, REQ-208), keeping every control, option, default and range
+    unchanged
+  - automated coverage asserts Life Tracker's table, counter values, layout,
     and `lib/lifeTracker/` state are unchanged by each redesign slice; the
@@ -4995,3 +5000,3 @@
     other destination does
-  - no Life Tracker behaviour, copy, layout, or state change of any kind in the
+  - no change to Life Tracker's rules, state, or table layout of any kind in the
     redesign packages
@@ -5009,4 +5014,4 @@
     ships, reviewed by the screenshot pair; there is no separate deferred
-    pass for shared chrome. Life Tracker's own screens remain a distinct,
-    not-yet-scheduled redesign, same as before
+    pass for shared chrome. Life Tracker's table remains out of scope; its sheets
+    are restyled by the `ui-reimagining-build` pass
   - the baseline captures taken during refinement live in the work package's
@@ -5015,2 +5020,3 @@
     pixel-diff gate
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the owner asked for the back menus to be redrawn (mockup round 11) and approved them (rounds 13–14). Game Setup becomes one phone screen — Reset life totals and New game as rows that ask first through the shared confirm sheet; a Players stepper (2–8) with name fields two to a row, each carrying its seat number; Starting life pills (20 · 25 · 30 · 40 · Custom 1–999) under Players with its rule line; Layout (Grid · List) and Card style (Ombre · Flat) as a labelled pair of segmented pills. A player's Counters has two tabs: Commander damage · lethal at 21 (the seat map alone — a tile per other seat with name, number and one joined −/+ pill, a red edge and LETHAL tag at 21, the player's own seat drawn like their card) and Counters (the eleven named counters as tiles that add one on a tap and light above zero, a ⋯ on each tile to take one away, set a number or clear — long-press stays — and custom counters as the same tiles with a remove ✕ and today's add field and three errors)
 
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -209,2 +209,3 @@
 | Fit | No page scroll for the life table; counter panel is full-height overlay (DEC-139) |
+| Sheets | Game Setup fits one phone screen; a player's Counters panel keeps its full-height overlay (DEC-139) with two tabs; Reset / New game confirm in the shared sheet (REQ-208). The table itself is pixel-untouched; every touching slice attaches the 390×844 and 1440×900 before/after pair (REQ-202) |
 | Notes | DEC-101, DEC-136, DEC-139 |
--- a/PRD/sections/life-tracker/README.md
+++ b/PRD/sections/life-tracker/README.md
@@ -49,9 +49,13 @@
 
-- Built: tapping a player's counter area opens that player's counter panel.
-  It tracks a per-opponent commander-damage matrix (a "me" cell marks the
-  player's own seat plus one cell per opponent), the named-counter palette —
-  Monarch, Treasure, Initiative, Poison, Ascend, Rad, Day/night, C.Tax, K.O.,
-  Energy, Exp — and user-added generic named counters.
+- Built: tapping a player's counter area opens that player's counter panel, with
+  two tabs: **Commander damage · lethal at 21** — the per-opponent seat map alone (a
+  tile per other seat with the player's name, the number and one joined `−`/`+`
+  pill; at 21 the tile's edge lights red with a small LETHAL tag; the player's own
+  seat drawn like their card, marked "your seat") — and **Counters** — the
+  named-counter palette (Monarch, Treasure, Initiative, Poison, Ascend, Rad,
+  Day/night, C.Tax, K.O., Energy, Exp) as tiles that light above zero, plus
+  user-added generic named counters as the same tiles with a remove ✕. (REQ-202)
 - Built: tap increments a named or custom counter; a hold/secondary action
-  exposes decrement and set.
+  exposes decrement and set, and a ⋯ on each counter tile opens the same row (take
+  one away, set a number, clear). (REQ-202)
 - Built: each opponent commander-damage cell exposes always-visible `−`/`+`
@@ -88,5 +92,6 @@
   chosen a different starting life for this game.
-- Built: display names are edited from Game Setup's Edit names disclosure,
-  a tracker-local UI. In-Depth continues to use the shared
-  `PlayerRosterEditor` — the tracker does not mount it.
+- Built: display names are edited in Game Setup's name fields — compact boxes
+  carrying the seat number, two to a row under the Players stepper. In-Depth
+  continues to use the shared `PlayerRosterEditor` — the tracker does not mount
+  it. (REQ-202)
 
@@ -99,2 +104,6 @@
   presentation preferences (layout mode, card style) may survive New Game.
+- Built: Reset life totals and New game each ask first through the shared confirm
+  sheet (REQ-208) with today's confirmation copy; Game Setup fits one phone screen,
+  with Layout and Card style as a labelled pair of segmented pills at its foot.
+  (REQ-202)
 
```

- Verdict: accept
- Reason:

---

**Group 3 — follow-on wording** (not a stable id; blocks follow)

## REQ-006 — Stack order stays bottom-to-top when players reorder

**What this decides:** whether this entry's wording is updated to match REQ-005 (players can reorder the Stack).

**In plain terms:** REQ-006 keeps the Stack's order the same everywhere: the first card in the list is the bottom, the last is the top, in the screen, the request and the prompt. That stays. The only wording change: the Stack is shown as a shelf with BOTTOM … TOP tags rather than a bottom-to-top list, and a player's reorder changes the list itself, so the same meaning holds after a drag.

**What happens if you say no:** the old "details UI displays bottom-to-top" line stays, describing a list that no longer exists.

**Recommendation:** accept if you accepted REQ-005 (players can reorder the Stack); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -81,3 +81,3 @@
   - the last item in the array is the top of the stack
-  - stack details UI displays bottom-to-top
+  - the Stack shelf tags its cards BOTTOM … TOP (REQ-209); a player's reorder rewrites the array itself, so the bottom-first meaning holds after any drag or Down / Up / To top
   - prompt builder preserves the same order
@@ -89,2 +89,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): follows REQ-005's player reorder
 
```

- Verdict: accept
- Reason:

## REQ-007 — The Stack's count lives on its zone tab

**What this decides:** whether this entry's wording is updated to match REQ-209 (In-depth details' Cards shelf).

**In plain terms:** REQ-007 asks for a stacked-cards icon with a count. In In-depth details the Stack is a zone tab on the Cards station that shows its live count, so the tab is that icon.

**What happens if you say no:** the entry keeps asking for a separate icon the new Cards station does not have.

**Recommendation:** accept if you accepted REQ-209 (In-depth details' Cards shelf); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -95,4 +95,4 @@
 - Acceptance Criteria:
-  - icon is visible when stack contains cards
-  - icon badge reflects current stack size
+  - the Stack's zone tab on the Cards station (REQ-209) is the icon: it shows whenever the Stack is a chosen zone
+  - the tab's count reflects the current stack size
 - Constraints:
@@ -102,2 +102,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the stacked-cards icon becomes the Stack's zone tab with its count
 
```

- Verdict: accept
- Reason:

## REQ-008 — Stack details live on the shelf and the card menu

**What this decides:** whether this entry's wording is updated to match REQ-005 and REQ-209.

**In plain terms:** REQ-008 describes a Stack details box listing cards bottom-to-top with Remove, and forbids manual reordering. In In-depth details the Stack's shelf is that view — tags read BOTTOM … TOP, and tapping a card opens its menu with Remove — and reordering is allowed (REQ-005).

**What happens if you say no:** the entry keeps forbidding reordering and describing a separate details box.

**Recommendation:** accept if you accepted REQ-005 and REQ-209; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -108,5 +108,5 @@
 - Acceptance Criteria:
-  - clicking stack icon opens a box, panel, or modal
-  - cards are listed bottom-to-top
-  - each row shows card name and remove button
+  - the Stack's shelf on the Cards station (REQ-209) is the details view; tapping a card opens its menu
+  - cards are tagged BOTTOM … TOP
+  - each card's menu shows its name and **Remove from the Stack**
   - thumbnail is shown when available
@@ -115,3 +115,3 @@
 - Constraints:
-  - no manual reordering in the core product
+  - reordering is available by drag or Down / Up / To top (REQ-005, REQ-209)
 - Dependencies:
@@ -119,2 +119,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the details box becomes the shelf plus card menu; the no-reorder constraint is lifted by REQ-005
 
```

- Verdict: accept
- Reason:

## REQ-018 — Card collection keeps bottom-to-top order and places carried cards

**What this decides:** whether this entry's wording is updated to match REQ-005 and REQ-206.

**In plain terms:** REQ-018 says Stack cards keep the order they were added. With reordering (REQ-005) they keep bottom-to-top order as the player sets it. It also gains one rule: cards carried from Ask a Question must each get a zone, or be left out, before the player moves past the Cards station.

**What happens if you say no:** the entry keeps "append order" and says nothing about carried cards.

**Recommendation:** accept if you accepted REQ-005 and REQ-206; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -289,3 +289,4 @@
   - no-match state shows **No matching card found**
-  - stack-zone cards preserve bottom-to-top append order
+  - stack-zone cards keep bottom-to-top order: appended on add, then as the player reorders them (REQ-005)
+  - cards carried from Ask a Question are each placed in a zone, or left out, before collection can continue (REQ-206, REQ-209)
   - selected zones with zero cards are allowed individually
@@ -298,2 +299,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): follows REQ-005's reorder and REQ-206's carry
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -144,6 +144,8 @@
   characters, no-match shows **No matching card found**, and selecting a
-  suggestion opens a preview before an explicit Add. Stack cards preserve
-  bottom-to-top append order; a selected zone may hold zero cards individually,
-  but collection cannot continue until at least one selected zone contains a card.
-  (REQ-001, REQ-002, REQ-018, FLOW-001)
+  suggestion opens a preview before an explicit Add. Stack cards keep
+  bottom-to-top order — appended on add, then as the player reorders them; cards
+  carried from Ask a Question are each placed in a zone or left out before
+  collection can continue; a selected zone may hold zero cards individually, but
+  collection cannot continue until at least one selected zone contains a card.
+  (REQ-001, REQ-002, REQ-018, REQ-209, FLOW-001)
 - Built: zone collection shows a non-blocking nudge when the stack zone is
```

- Verdict: accept
- Reason:

## REQ-023 — The wait inks itself in, inside the judge's bubble

**What this decides:** whether this entry's wording is updated to match REQ-207 (the new frame) and the approved wait treatment.

**In plain terms:** The wait keeps today's words and timings exactly (0, 3, 8, 15, 25 and 40 seconds; "Consulting the stack…" to "If this were F6…"). What changes is how it looks: it is drawn as the judge's bubble under the colour's seal, each line inks itself in letter by letter with a fading glow, the previous line lifts away, the elapsed clock ticks at its foot, two motes of the colour's light drift up, a faint ring turns round the seal, and the bubble's edge breathes. The absurd lines lean into italics. It still sits where the question box was while you wait. Under reduced motion each line simply appears.

**What happens if you say no:** the wait keeps today's plain panel in the new colours.

**Recommendation:** accept if you accepted REQ-207 (the new frame) and the approved wait treatment; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -402,2 +402,3 @@
   - message region uses `aria-live` so screen readers announce updates
+  - the panel is drawn as the judge's bubble under the colour's seal: each threshold line inks itself in letter by letter with a glow that fades, the line before lifts and fades, the elapsed clock ticks at the bubble's foot, two motes of the colour's light drift up through it, a faint dashed ring turns round the seal, and the bubble's edge breathes in the colour's light; the absurd-tone lines are set in italics; under reduced motion each line appears whole and nothing drifts or turns
 - Constraints:
@@ -410,2 +411,3 @@
   - approved threshold copy: 0s "Consulting the stack…" (calm), 3s "Priority is passing to the LLM." (calm), 8s "The judge is reading every layer. Twice." (curious), 15s "Still waiting? The servers are scrying 1." (curious), 25s "At this point we're basically in a MUD subgame." (absurd), 40s "If this were F6, we'd have resolved by now." (absurd)
+  - amended for the `ui-reimagining-build` pass (2026-09-30): thresholds and copy unchanged; the panel takes the direction-1 inscription treatment, CSS-only (NFR-006)
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -237,3 +237,5 @@
   messages at 0s / 3s / 8s / 15s / 25s / 40s (CSS-only motion) — while the card
-  list and wizard context above the form stay visible. (DEC-031, REQ-023)
+  list and wizard context above the form stay visible. It is drawn as the judge's
+  bubble under the colour's seal, each line inking itself in letter by letter.
+  (DEC-031, REQ-023)
 - Built: on the first success the enrichment submit form is replaced by the shared
```

- Verdict: accept
- Reason:

## NFR-006 — Motion rule: the new wait and the colour scene stay CSS-only

**What this decides:** whether this entry's wording is updated to match REQ-023 (the inked wait) and REQ-207 (the colour scene).

**In plain terms:** NFR-006 keeps motion light and CSS-based, and says the wait's existing motion is unchanged. The new wait treatment changes that motion, and the colour scene adds a new decorative layer. Both stay inside the rule — CSS transforms and opacity, no animation library, still under reduced motion — so the only edit is naming them.

**What happens if you say no:** NFR-006 keeps saying the wait's motion is unchanged, contradicting REQ-023's new treatment.

**Recommendation:** accept if you accepted REQ-023 (the inked wait) and REQ-207 (the colour scene); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/non-functional-requirements.md
+++ b/PRD/sections/non-functional-requirements.md
@@ -69,3 +69,4 @@
   - scan camera surface convergence/lock/thumbs-up motion is excluded and stays as tuned (DEC-057, DEC-062, DEC-072, DEC-073)
-  - existing functional wait-state motion (DEC-031, DEC-041) is unchanged
+  - functional wait-state motion keeps its thresholds and copy (DEC-031, DEC-041); the waiting panel's inscription treatment (REQ-023 as amended) is CSS-only and reduced-motion-aware
+  - the colour's ambient scene (REQ-207) is CSS-animated layers with one density and one opacity number per scene, held still under reduced motion
   - focused conversation motion (DEC-118 / REQ-098) reuses the shared CSS vocabulary, animates only newly entering content, preserves a scrolled-up reader's position, and becomes effectively immediate under reduced motion
```

- Verdict: accept
- Reason:

## REQ-029 — Start over lands on a clean Ask a Question page

**What this decides:** whether this entry's wording is updated to match REQ-206 (one question door).

**In plain terms:** Today Start over in In-Depth clears the conversation and returns to the game-context step, keeping the player roster (REQ-029). With one door, ↺ Start over lands on a clean Ask a Question page; the next In-depth walk starts at station 1 (Game), and the roster — names, life, counters — is still kept, so a game seeded from Life Tracker is not wiped. The new ✎ Edit returns to the review with everything kept.

**What happens if you say no:** Start over keeps returning to In-Depth's first step.

**Recommendation:** accept if you accepted REQ-206 (one question door); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -524,3 +524,3 @@
   - start over button is visible whenever the first decrypt has succeeded and no request is in flight
-  - clicking start over clears the conversation thread and returns the user to the game context step (first step of the flow)
+  - clicking start over clears the conversation thread and returns the user to a clean Ask a Question page (REQ-206); In-depth details' next walk starts at station 1 (Game)
   - staged game context, selected zones, zone cards, question text, and turn-phase/combat-step staging are cleared
@@ -540,2 +540,3 @@
   - the former "no conversation history is persisted after start over" clause is superseded by DEC-124/DEC-130 persistence rules
+  - amended for the `ui-reimagining-build` pass (2026-09-30): Start over lands on the one question door; roster preservation is unchanged; ✎ Edit (REQ-209) is the keep-everything path
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -261,5 +261,6 @@
   conversations. (REQ-027, DEC-038, DEC-039, FLOW-005)
-- Built: **Start Over** is visible once the first decrypt has succeeded and no
-  request is in flight. It clears the thread and returns to the game-context step,
-  clearing staged zones/cards/question/phase, but **preserves the player roster**
+- Built: **↺ Start over** (beside the title) is visible once the first decrypt has
+  succeeded and no request is in flight. It clears the thread and staged
+  zones/cards/question/phase and lands on a clean Ask a Question page; In-depth
+  details' next walk starts at station 1. It **preserves the player roster**
   (count, names, life, poison/energy/experience, commander damage, custom
@@ -267,3 +268,4 @@
   conversation with at least one answer auto-saves to completed history first.
-  (REQ-029, DEC-040)
+  **✎ Edit** instead returns to the review with everything kept. (REQ-029,
+  DEC-040, REQ-209)
 - Built: on any AI failure the app shows **Miho is working on it**, preserves game
@@ -491,3 +493,3 @@
 - **Start Over returning to the enrichment step with staged zones/cards preserved
-  — closed door.** REQ-029 now defines a full flow reset to the game-context step
+  — closed door.** REQ-029 now defines a full flow reset (to a clean Ask a Question page since REQ-206)
   that preserves only the player roster; the former "no history persisted after
```

- Verdict: accept
- Reason:

## REQ-064 — Trade Balancer's difference gets a verdict and New trade

**What this decides:** whether this entry's wording is updated to match REQ-215 (piles of gold and New trade).

**In plain terms:** REQ-064 says the screen shows the difference and which side is higher, and that a trade keeps no history. Both stay. The wording gains the verdict line ("Fair trade", "Leans toward …", …) and the New trade action that clears both sides after asking first.

**What happens if you say no:** the entry keeps describing only an amount and "which side is higher".

**Recommendation:** accept if you accepted REQ-215 (piles of gold and New trade); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -1466,3 +1466,3 @@
   - each side shows a running **total** = `Σ qty × (foil ? usdFoil : usd)` across its entries, updating live as entries are added, removed, re-priced, foil-toggled, or quantity-changed
-  - the view shows the **difference** between the two totals as an amount and indicates which side is higher (or that the sides are equal)
+  - the view shows the **difference** between the two totals as an amount under a verdict line that names the side ahead in plain words, or "Even" when equal to the cent (REQ-215)
   - totals and the difference are displayed in USD
@@ -1470,3 +1470,3 @@
   - the view is reachable from the top-level navigation menu (REQ-067) and the MTG Assistant flow is unaffected
-  - the trade state is **ephemeral**: no history, no persistence across reload, no marketplace/transaction handling, and no automated balancing suggestions
+  - the trade state is **ephemeral**: no history, no persistence across reload, no marketplace/transaction handling, and no automated balancing suggestions; a **New trade** action clears both sides after the shared confirm sheet (REQ-215, REQ-208)
   - when the view opens it issues **one fire-and-forget warm-up request** to the backend's existing health check (`GET /api/health`) alongside its `cardMetadata` load, so a cold backend wakes while the card list downloads and the player types instead of that wait landing on the first card's price fetch. It sends and reads no product data, renders no UI, and never blocks, disables, or surfaces an error on search when it fails or when no backend is running (mock-default local dev unaffected)
@@ -1486,2 +1486,3 @@
   - a trade side is a value list, not the stack: the duplicate-block (REQ-009/FLOW-004) and 10-card cap (REQ-010) do not apply
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the difference readout becomes REQ-215's piles and verdict line; totals and pricing unchanged
 
--- a/PRD/sections/trade-balancer/README.md
+++ b/PRD/sections/trade-balancer/README.md
@@ -40,4 +40,4 @@
 - Built: the view shows the **difference** between the two totals as an amount
-  and indicates which side is higher, or that the sides are equal ("Even
-  trade"). (REQ-064)
+  under a verdict line that names the side ahead in plain words, or "Even" when
+  the totals match to the cent. (REQ-064, REQ-215)
 - Built: the trade state is **ephemeral** — no history, no persistence across
```

- Verdict: accept
- Reason:

## REQ-065 — The printing picker gets a price pill per finish

**What this decides:** whether this entry's wording is updated to match REQ-208 (the shared sheet) and the approved picker.

**In plain terms:** Today the printing picker lists printings with a text price and a separate Foil toggle on the row, and adds a set filter above eight printings (REQ-065). The mockup puts the picker in the shared sheet with the card's art and name, and gives each printing a Nonfoil and a Foil price pill — one tap picks that printing and that finish; a printing without a foil price shows a disabled Foil pill. The filter appears past five printings, and a card with one printing reads "only printing". The foil toggle on each trade row stays.

**What happens if you say no:** the picker keeps today's rows and its filter above eight printings.

**Recommendation:** accept if you accepted REQ-208 (the shared sheet) and the approved picker; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -1496,3 +1496,3 @@
   - the **foil toggle** switches the entry's contribution between `usd` and `usd_foil`. Whenever an entry receives a printing — picked before an add, resolved from a scan, changed, or re-fetched on retry — the mode is **re-derived from that printing's own prices**: non-foil when the printing has a `usd` price, and foil only when `usd` is null and `usd_foil` is not (a new entry starts non-foil). The player may still toggle into a mode with no price, which keeps the $0-plus-caution treatment below
-  - the **printing picker** — the same component used before an add and by "Change printing" — heads with the card's printing count (`N printings`, computed from the fetched list, never from a stored field), lists printings **newest release first** (REQ-066), **region-scrolls** inside a short box instead of growing the page with the card's printing count, lazy-loads its row images, offers a **set-name/set-code filter** once a card has more than eight printings, and scrolls the currently selected printing into view when it opens
+  - the **printing picker** — the same component used before an add and by "Change printing" — opens in the shared sheet (REQ-208) with the card's art and name, one line of instruction, and one row per printing **newest release first** (REQ-066): set name, code · year, a thumbnail, and **Nonfoil** and **Foil** price pills; a tap on a pill picks that printing and that finish; a printing with no foil price shows a disabled Foil pill; the head counts the printings (`N printings`, computed from the fetched list, never from a stored field) and a card with one printing reads "only printing"; the body **region-scrolls** instead of growing the page, lazy-loads its row images, offers a **set-name/set-code filter** once a card has more than five printings, and scrolls the currently selected printing into view when it opens
   - **quantity/multiples:** the same card (or printing) may appear multiple times on a side, via repeated adds and/or a per-entry quantity control; each unit counts toward the side total; the stack duplicate-block does not apply
@@ -1514,2 +1514,3 @@
   - reuses the existing scan resolver (REQ-036) and manual search (REQ-002/REQ-003) as input; the printing pick and pricing are the new layer
+  - amended for the `ui-reimagining-build` pass (2026-09-30): pills per finish, the shared sheet, and the filter threshold from eight to five printings; prices and selection rules unchanged
 
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -219,3 +219,3 @@
 | Fit | No page scroll for totals/primary actions; entry lists **and the printing picker** region-scroll |
-| Printing picker | Region-scrolls inside the side at about 5-6 rows, capped near `40vh`; the page never grows with a card's printing count (Sol Ring 128, corpus maximum 771). Row images lazy-load instead of all loading on open, a set-name/code filter appears above 8 printings, and the selected printing is scrolled into view on open (REQ-065, live observation 2026-09-09: 128 rows previously rendered 10,748 px tall on an 844 px viewport and pushed Side B to y≈11,500) |
+| Printing picker | Opens in the shared sheet (REQ-208); rows of set name, code · year, thumbnail, and Nonfoil / Foil price pills; the body region-scrolls at about 5-6 rows so the page never grows with a card's printing count (Sol Ring 128, corpus maximum 771); row images lazy-load; a set-name/code filter appears past 5 printings; the selected printing is scrolled into view on open (REQ-065; live observation 2026-09-09: 128 rows once rendered 10,748 px tall on an 844 px viewport) |
 | Price freshness | Date-level copy only — `Prices as of 5 June 2026`, formatted from the artifact's ISO `snapshotDate` with no raw `T`, milliseconds, or zone suffix, so it never reads as a live quote. One line at 390x844 (`scrollWidth` 299 = `clientWidth`). An unparseable artifact value omits the line entirely rather than printing raw data (ui-review, 2026-08-11, REQ-145) |
--- a/PRD/sections/trade-balancer/README.md
+++ b/PRD/sections/trade-balancer/README.md
@@ -77,8 +77,10 @@
 - Built: the **printing picker** — the same component before an add and behind
-  "Change printing" — heads with the card's printing count (`N printings`,
-  counted from the fetched list), lists printings **newest release first**
-  (REQ-066), **region-scrolls** in a short box instead of growing the page,
-  lazy-loads its row images, filters by set name or code once a card has more
-  than eight printings, and scrolls the selected printing into view on open.
-  (REQ-065, `screen-layout.md`)
+  "Change printing" — opens in the shared sheet with the card's art and name, heads
+  with the card's printing count (`N printings`, counted from the fetched list;
+  "only printing" for one), lists printings **newest release first** (REQ-066) as
+  rows of set name, code · year and a thumbnail with **Nonfoil** and **Foil** price
+  pills — a tap picks that printing and finish, and a missing foil price shows a
+  disabled Foil pill — **region-scrolls** instead of growing the page, lazy-loads
+  its row images, filters by set name or code past five printings, and scrolls the
+  selected printing into view on open. (REQ-065, REQ-208, `screen-layout.md`)
 - Built: the **foil toggle** switches an entry's contribution between `usd` and
@@ -163,3 +165,3 @@
   B out of reach. Row images are lazy-loaded rather than all requested on open,
-  and a set filter appears above eight printings. (REQ-065, `screen-layout.md`)
+  and a set filter appears past five printings. (REQ-065, `screen-layout.md`)
 - First-card wait: the balancer's warm-up ping on open overlaps the backend's
```

- Verdict: accept
- Reason:

## REQ-067 — The feature portal lists the one question door

**What this decides:** whether this entry's wording is updated to match REQ-206 and REQ-207.

**In plain terms:** REQ-067 is the Menu itself: which destinations it lists and where its button sits. It still says the button is "top-middle" (outdated since the corner rail) and lists four destinations with two question doors. The update puts the ☰ button at the banner's left and lists Ask a Question, Question History, Life Tracker and Trade Balancer; In-depth details stays a working route without its own row.

**What happens if you say no:** the Menu entry keeps listing both question doors and a top-middle button.

**Recommendation:** accept if you accepted REQ-206 and REQ-207; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -1548,8 +1548,8 @@
 - Priority: high
-- Description: The app must provide a first-class **feature portal** that owns top-level navigation chrome — one icon-only Menu button docked in the **top-middle** of every destination header — opening the registered destinations, action entries, and palette-only Theme section. Destinations come from an extensible registry rather than shipping their own entry chrome; registered destinations include **In-Depth Question**, **Quick Question**, **Trade Balancer**, and **Life Tracker**. Switching is a frontend-only view switch that preserves each destination's in-session data (with DEC-120's presentation-only exception for In-Depth secondary-player-details), while only the active destination id persists across reload in the same tab (DEC-095 as amended by DEC-104/DEC-107/DEC-109/DEC-110/DEC-111/DEC-117/DEC-120).
-- Acceptance Criteria:
-  - an icon-only navigation Menu button sits in the **top-middle** of every destination header, docks through the destination's inline `PortalSlot`, and scrolls with that header; the viewport-fixed path remains only a defensive fallback for a future headerless destination
+- Description: The app must provide a first-class **feature portal** that owns top-level navigation chrome — one ☰ Menu button at the left of every destination's banner header (REQ-207) — opening the registered destinations, action entries, and palette-only Theme band. Destinations come from an extensible registry rather than shipping their own entry chrome; the Menu lists **Ask a Question** (`quick-lookup`, also current while `in-depth` is open), **Question History**, **Life Tracker** (`player-life-tracker`), and **Trade Balancer** (`trade-balancer`) (REQ-206, REQ-213).
+- Acceptance Criteria:
+  - an icon-only ☰ Menu button sits at the left of every destination's banner header (REQ-207), docks through the destination's inline `PortalSlot`, and scrolls with that header; the viewport-fixed path remains only a defensive fallback for a future headerless destination
   - the portal button, brand block, step-name column where present, and opened Menu have non-overlapping visual bounds and pointer hit areas across automatic responsive widths
   - destinations come from an **extensible registry** (a feature registers a destination entry rather than adding its own nav chrome); adding a destination requires no portal redesign
-  - opening the Menu lists **In-Depth Question** (`mtg-assistant`), **Quick Question** (`quick-lookup`), **Trade Balancer** (`trade-balancer`), and **Life Tracker** (`player-life-tracker`) with the current destination indicated
+  - opening the Menu lists **Ask a Question** (`quick-lookup`; current also while `in-depth` is open), **Question History** (an action row opening REQ-213's sheet), **Life Tracker** (`player-life-tracker`), and **Trade Balancer** (`trade-balancer`) with the current destination indicated; `in-depth` stays registered and routable with no row of its own (REQ-206)
   - the Menu may include action entries that invoke handlers without switching destination (DEC-104; v1: **Send feedback**), plus a Theme section containing palette swatches only; no layout/profile control is shown (DEC-110/DEC-117)
@@ -1578,2 +1578,3 @@
   - amended by DEC-133 / REQ-113: the open Menu panel is a full-height left tray of the outer shell (visible-bounds on tall shells, matching bottom-left radius); registry, Theme, and docking guarantees otherwise unchanged
+  - amended for the `ui-reimagining-build` pass (2026-09-30): one question door (REQ-206), Question History as a Menu row (REQ-213), and the ☰ banner trigger (REQ-207); registry, action entries, state preservation and reload persistence unchanged
 
```

- Verdict: accept
- Reason:

## REQ-075 — Ask a Question's ruling view: your question first, cards in a strip

**What this decides:** whether this entry's wording is updated to match REQ-025 and REQ-206.

**In plain terms:** REQ-075 describes Quick Question's ruling view: the judge's answer first, and attached cards behind a small context button. It updates to show your question first (if REQ-025 is accepted) and the attached cards in a Cards strip at the top, each one tap from its detail.

**What happens if you say no:** the entry keeps the hidden first question and the context button.

**Recommendation:** accept if you accepted REQ-025 and REQ-206; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -1786,4 +1786,4 @@
   - the frozen "context" is the attached card if the user resolved one before asking; otherwise there is no frozen context object (no `GameContext` either way); a card, once submitted, is frozen for the duration of the conversation and follow-ups are text-only
-  - when a card is frozen, a compact trigger naming the card opens its existing read-only card presentation in a bottom sheet below `768px` or right-side drawer at `768px+`; without a card, no empty context trigger or container is rendered
-  - the first visible thread bubble is the assistant's answer; the initial user question is included in `conversationHistory` sent to the API but is not shown as a visible bubble
+  - attached cards are frozen and shown in a **Cards strip** at the top of the answered view, each one tap from its detail (REQ-206); without a card, no strip renders
+  - the first visible thread bubble is the player's question as sent (REQ-025 as amended), then the assistant's answer; the question is also included in `conversationHistory` sent to the API
   - follow-up requests send `{ mode: "lookup", question, card: frozen (when one was attached), conversationHistory }` and reuse the same message-count and per-message/character limits as the main flow (REQ-027); Quick Lookup defines no separate limit policy
@@ -1805,2 +1805,3 @@
   - during quick-lookup refinement this requirement was rewritten to merge the prior Card Lookup thread (this ID) and Rules Lookup thread (former REQ-080) into one; see REQ-080
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the question shows first and attached cards move to the Cards strip; follow-up contract unchanged
 
--- a/PRD/sections/quick-lookup/README.md
+++ b/PRD/sections/quick-lookup/README.md
@@ -140,7 +140,7 @@
   REQ-097, REQ-098)
-- Built: the first visible bubble is the assistant's answer; the initial user
-  question rides in `conversationHistory` but is not shown as a visible bubble.
+- Built: the thread opens with the player's question as sent, then the
+  assistant's answer; the question also rides in `conversationHistory`.
   Follow-ups are text-only and send `{ mode: "lookup", question, cards: frozen
   (the full attached set, when any were attached), conversationHistory }`.
-  (REQ-075, REQ-167, FLOW-011, FLOW-023)
+  (REQ-075, REQ-025, REQ-167, FLOW-011, FLOW-023)
 - Built: when one or more cards were attached, every one of them is frozen for
```

- Verdict: accept
- Reason:

## REQ-087 — Send feedback: type as three pills, snapshot folded

**What this decides:** whether this entry's wording is updated to match REQ-208 (the shared sheet) and the approved feedback form.

**In plain terms:** The feedback form keeps every field and rule it has today (REQ-087). It moves into the shared sheet; the Bug / Suggestion / Other choice becomes three pills with the message hint changing to match; the app-snapshot notice folds behind one dashed row that opens to what it holds; and sending turns the sheet into a thank-you under the colour's seal.

**What happens if you say no:** the form keeps its dropdown and open notice in the new colours.

**Recommendation:** accept if you accepted REQ-208 (the shared sheet) and the approved feedback form; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2022,7 +2022,7 @@
   - the modal opens over the current screen without switching the active destination or resetting in-progress state
-  - fields: a category select (Bug / Suggestion / Other), a required freeform message, and an optional reply email; blank email = anonymous
+  - fields: the category as three pills (Bug · Suggestion · Other) with the message box's hint changing with it, a required freeform message, and an optional reply email; blank email = anonymous
   - validation: submit is blocked until the message is non-empty (after trim); when a reply email is present it must be a valid email format; validation messages are shown inline
-  - the modal shows a one-line disclosure that current app state is attached, plus an **expandable human-readable summary** of what is included (screen/step, game context + typed question, zones/cards/enrichment, conversation history, provider mode, active destination, environment)
+  - the form shows that current app state is attached as one dashed row, folded by default, that opens to an **expandable human-readable summary** of what is included (screen/step, game context + typed question, zones/cards/enrichment, conversation history, provider mode, active destination, environment)
   - accessibility: focus is trapped within the modal, Esc closes it, focus is restored to the trigger on close, and open/close motion is CSS-only and reduced-motion-aware (NFR-006)
-  - submit lifecycle: idle → sending → success acknowledgement or inline error; the draft (fields) is preserved on error so the user can retry
+  - submit lifecycle: idle → sending → success acknowledgement (a thank-you under the colour's seal) or inline error; the draft (fields) is preserved on error so the user can retry; an empty message is flagged before anything sends
   - the modal is theme-aware and touch-friendly on mobile (NFR-001)
@@ -2040,2 +2040,3 @@
   - the expandable summary shows the same content that REQ-088 serializes for delivery
+  - amended for the `ui-reimagining-build` pass (2026-09-30): renders in the shared sheet (REQ-208); fields, validation, snapshot content and delivery unchanged
 
--- a/PRD/sections/user-feedback/README.md
+++ b/PRD/sections/user-feedback/README.md
@@ -41,5 +41,5 @@
   FLOW-014)
-- Built: capture fields are a category select (Bug / Suggestion / Other), a
-  required freeform message, and an optional reply email (blank = anonymous).
-  (DEC-105, REQ-087)
+- Built: capture fields are the category as three pills (Bug · Suggestion ·
+  Other, the message hint changing with it), a required freeform message, and an
+  optional reply email (blank = anonymous). (DEC-105, REQ-087)
 - Built: validation is inline — submit is blocked until the message is
@@ -59,7 +59,6 @@
   build/version). (DEC-105, REQ-088)
-- Built: the snapshot is disclosed to the user before submit — a one-line
-  notice that current app state is attached, plus an expandable
-  human-readable summary showing exactly what is included. The summary shows
-  the same content that is serialized for delivery. (REQ-087, REQ-088,
-  FLOW-014)
+- Built: the snapshot is disclosed to the user before submit — one dashed row,
+  folded by default, that opens to a human-readable summary showing exactly what
+  is included. The summary shows the same content that is serialized for
+  delivery. (REQ-087, REQ-088, FLOW-014)
 - Built: the modal reads app state only through a lazy `getFeedbackContext()`
```

- Verdict: accept
- Reason:

## REQ-100 — One "More details for all players" toggle

**What this decides:** whether this entry's wording is updated to match REQ-209 (In-depth details' Game station).

**In plain terms:** REQ-100 makes every player's extra details (poison, energy, experience, commander damage, named counters) open and close together, from an arrow on any player. The Game station replaces the per-player arrows with one shared "More details for all players" toggle driving that same all-or-nothing state.

**What happens if you say no:** the entry keeps describing an arrow on every player.

**Recommendation:** accept if you accepted REQ-209 (In-depth details' Game station); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2443,2 +2443,3 @@
   - approved visual direction: `PRD/work/excess-ui/mock-a-nested-player-accordion.png`; the mock's generated text is non-normative
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the per-player arrows become one shared **More details for all players** toggle (REQ-209) that drives this same synchronized state; criteria that name "any player's arrow" read as that toggle, and the collapse-on-leave rule is unchanged
 
```

- Verdict: accept
- Reason:

## REQ-103 — History: one list in the shared sheet, opened from the Menu

**What this decides:** whether this entry's wording is updated to match REQ-213 (Question History).

**In plain terms:** REQ-103 is the saved-conversation history itself — auto-save, the 20-entry cap, the Draft row. All of that stays. Its wording about a per-screen left drawer opened from a rail icon changes to Question History: a Menu row opening the shared sheet with both kinds of question in one list.

**What happens if you say no:** the entry keeps describing the left drawer and rail icon.

**Recommendation:** accept if you accepted REQ-213 (Question History); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2498,6 +2498,6 @@
 - Priority: high
-- Description: In-Depth Question and Quick Question must offer a left history drawer (always-on History rail, including pre-submit steps) listing auto-saved past conversations and any mid-flight **Draft**, persisted browser-locally on the current device, so a user can browse conversations from earlier in the session or a previous visit.
+- Description: Both question flows share one **Question History** (REQ-213) listing auto-saved past conversations and any mid-flight **Draft**, persisted browser-locally on the current device, so a user can browse conversations from earlier in the session or a previous visit.
 - Acceptance Criteria:
   - any conversation that reaches at least one successful answer auto-saves to a browser-local history list; saving happens on first answer and updates on each subsequent follow-up in that conversation
-  - a history drawer, opened from the shared conversation workspace, lists saved conversations most-recent-first, each showing originating flow, timestamp, and the first question as a preview snippet
+  - Question History (REQ-213), opened from the Menu, lists saved conversations of both question kinds most-recent-first, each showing its cards, the question, the ruling's first line, and a meta line
   - the list is capped at the 20 most recent conversations; saving a 21st entry prunes the oldest
@@ -2505,9 +2505,9 @@
   - storage reads are guarded; a missing, corrupted, or invalid stored value is dropped without breaking the app, mirroring the existing theme-preference fallback pattern
-  - the drawer opens/closes with an explicit control and Escape, contains keyboard focus while open, and returns focus to its trigger on close (outside/scrim dismiss added by REQ-117 / DEC-142; user delete by REQ-118 / DEC-143)
+  - the history sheet opens from the Menu, closes with ✕, Escape and outside tap, contains keyboard focus while open, and returns focus to its trigger on close (REQ-208; user delete by REQ-118 / DEC-143)
   - no server-side store, account system, or cross-device sync is introduced; history is scoped to one browser on one device
-  - the drawer's trigger is a small icon integrated into the feature-portal Menu's corner rail (DEC-122), stacked below the Menu icon within the same fluid-height ambient glow hit-area, and is always rendered on In-Depth Question and Quick Question (DEC-129), including when the list is empty and after Start Over
-  - below `768px` the drawer presents as a bottom sheet; at `768px`+ it presents as a left-side drawer, mirroring DEC-118's context sheet/drawer breakpoint and affordance types (DEC-125)
-  - opening the history drawer while the feature-portal Menu drawer is open closes the Menu drawer first, and vice versa, so the left edge never shows two overlapping panels (DEC-125)
-  - saved-conversation entries render as plain, unboxed grouped rows with a quiet active/hover highlight rather than a bordered card per entry (DEC-126)
-  - when a mid-flight Draft exists for the destination, the drawer shows a distinct **Draft** row (REQ-108 / DEC-130) in addition to completed conversations
+  - the trigger is the Menu's **Question History** row, directly under Ask a Question, on every destination (REQ-213)
+  - it presents in the shared sheet: a bottom sheet below `600px`, a floating centred card with two panes from `600px` up (REQ-208, REQ-213)
+  - choosing Question History closes the Menu tray before its sheet opens, so the two never overlap
+  - saved-conversation rows show a fan of the conversation's cards, the question, the ruling's first line, and one meta line (REQ-213)
+  - each flow's mid-flight Draft shows as a distinct **Draft** row above the saved conversations (REQ-108 / DEC-130)
 - Constraints:
@@ -2528,2 +2528,3 @@
   - trigger placement and entry row styling refined by DEC-126; always-on visibility and Draft slot added by DEC-129/DEC-130
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the drawer becomes Question History in the shared sheet (REQ-213); persistence, cap, auto-save and Draft rules unchanged
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -380,6 +380,6 @@
   (DEC-133, DEC-147, REQ-113, REQ-122, REQ-131)
-- History drawer width: phone `min(22rem, 88vw)`; desktop `min(30rem, 90vw)`; left-edge
-  full-height at every viewport, no `max-height` cap. Completed-history retention: 20
-  entries, oldest pruned; plus at most one Draft row per destination (not counted toward
-  the 20). (DEC-134, DEC-124, DEC-130)
+- Question History: the shared sheet — bottom sheet below `600px`, floating centred
+  card with two panes from `600px`. Completed-history retention: 20 entries across
+  both question kinds, oldest pruned; plus at most one Draft row per flow (not
+  counted toward the 20). (DEC-124, DEC-130, REQ-208, REQ-213)
 - View Context overlay: phone bottom sheet caps so a dismissible scrim of **≥25% of
```

- Verdict: accept
- Reason:

## REQ-107 — History is always one tap away in the Menu

**What this decides:** whether this entry's wording is updated to match REQ-213 (Question History).

**In plain terms:** REQ-107 keeps History always available, even with an empty list or right after Start over, and keeps its icon from overlapping the View Context button. With History moved into the Menu, "always available" means the Question History row is on every screen, and the overlap rule now covers the ☰ button.

**What happens if you say no:** the entry keeps requiring a History rail icon that no longer exists.

**Recommendation:** accept if you accepted REQ-213 (Question History); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2597,12 +2597,12 @@
 - Priority: high
-- Description: On In-Depth Question and Quick Question, the History corner-rail control must always be available (including empty history and after Start Over), and must not overlap the answered-state View Context trigger or its chrome at any supported viewport.
-- Acceptance Criteria:
-  - History rail zone is visible on every In-Depth Question and Quick Question screen state (all pre-submit steps and the answered workspace), including when no completed conversations or Draft exist
+- Description: Question History must always be reachable from every destination through the Menu's Question History row (REQ-213), including with empty history and after Start Over; the banner header's ☰ button must not overlap the answered-state View Context trigger or its chrome at any supported viewport.
+- Acceptance Criteria:
+  - the Menu's Question History row is present on every destination and every screen state, including when no completed conversations or Draft exist
   - immediately after Start Over, History remains visible and openable without requiring a new successful submit
   - opening History with an empty list shows an empty/zero-state drawer rather than hiding or disabling the control
-  - at desktop widths and at ~390×844 mobile widths, the History icon/hit-target does not overlap, clip into, or sit on the border of the View Context trigger
+  - at desktop widths and at ~390×844 mobile widths, the ☰ button's hit-target does not overlap, clip into, or sit on the border of the View Context trigger
   - answered-workspace top clearance used to satisfy the prior criterion must not leave a large empty band after DEC-137's shorter side-by-side rail (REQ-116 / DEC-141)
-  - Life Tracker and Trade Balancer continue to show Menu-only rails (no History zone)
-- Constraints:
-  - presentation and availability only; drawer open/close, breakpoint sheet/drawer, and Menu mutual exclusivity remain DEC-125
+  - every destination shows the same ☰ header control; no destination shows a History rail zone
+- Constraints:
+  - presentation and availability only; the history sheet's shape is REQ-208's
   - no Ask AI contract or backend change
@@ -2616,2 +2616,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the History rail zone is retired; availability moves to the Menu row (REQ-213)
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -132,10 +132,7 @@
   (DEC-133, DEC-147, REQ-113, REQ-122)
-- Built: on the two conversation-bearing destinations (In-Depth Question, Quick
-  Question) the rail splits into **side-by-side Menu + History zones** in a single
-  `2.75rem`-tall band, Menu leading and History trailing. Life Tracker and Trade
-  Balancer keep the single-zone Menu-only rail. Suite chrome's interactive box may
-  not extend past the affordance it paints: the single-zone rail's interactive box
-  is `5.5rem × 3.5rem` while its gradient keeps painting at `5.5rem × 10.5rem` as
-  `pointer-events: none` decoration; compliance is verified by hit-testing, not by
-  eye. (DEC-137, DEC-126, REQ-114, REQ-113)
+- Built: every destination shows the same ☰ header control; the former split
+  Menu + History rail is retired, and Question History is a Menu row (REQ-213).
+  Suite chrome's interactive box may not extend past the affordance it paints;
+  the banner's decoration takes no pointer events, verified by hit-testing.
+  (REQ-107, REQ-114, REQ-213)
 - Built: while the tray is open, neither the Menu trigger nor the History zone is
@@ -374,5 +371,2 @@
   variant's appearance is byte-for-byte unchanged. (DEC-137, REQ-114)
-- Split Menu+History rail (In-Depth, Quick Question): two zones side-by-side, each
-  `2.75rem × 2.75rem`, in one `2.75rem` band — required because only 70px exists between
-  the rail top and the step eyebrow while two stacked 44px zones need 88px. (DEC-137)
 - Menu tray: full height of the visible shell side; opaque across its painted bounds;
```

- Verdict: accept
- Reason:

## REQ-113 — The Menu tray floats as a card on desktop

**What this decides:** whether this entry's wording is updated to match REQ-207 (the new frame).

**In plain terms:** REQ-113 makes the open Menu the full height of the app's left side. On phones that stays. From 768px wide the mockup shows it as a floating, rounded card inset from the edges and sized to what it holds, and the space at its foot shows the colour's scene rather than a brand mark.

**What happens if you say no:** the tray stays full height at every width.

**Recommendation:** accept if you accepted REQ-207 (the new frame); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2738,3 +2738,3 @@
 - Acceptance Criteria:
-  - on a standard `.page-card` destination, the open Menu tray fills the card's left side from top to bottom even when destination/Theme content is shorter than that height
+  - below `768px`, on a standard `.page-card` destination, the open Menu tray fills the card's left side from top to bottom even when destination/Theme content is shorter than that height; at `768px`+ it is a floating card inset from the viewport edges, rounded, and sized to its content (REQ-207)
   - the tray's bottom-left corner is flush with the shell's bottom-left and uses the same bottom-left border radius as the shell so the curved edge is preserved (no square overhang into the page background)
@@ -2742,7 +2742,7 @@
   - Life Tracker (full-bleed shell) receives the same full left-side height and bottom-left radius treatment as standard destinations
-  - unused lower tray space may show a quiet, non-interactive decorative TheJudge brand mark; the mark must not be a second navigation control and may be omitted only when a short shell cannot host it cleanly
-  - left-edge slide open/close, corner-rail trigger, destination/action/Theme behavior, reduced-motion, and Menu↔History mutual exclusivity remain unchanged from DEC-122/DEC-125/DEC-126
+  - unused lower tray space shows the colour's scene at a whisper over a pool of the colour's light (REQ-207); nothing there is a second navigation control
+  - left-edge slide open/close, destination/action/Theme behavior and reduced-motion remain; the trigger is REQ-207's ☰ button and History is a Menu row (REQ-213)
   - tests or stylesheet assertions cover full-shell height (or visible-bounds equivalent), matching bottom-left radius, and Life Tracker parity
 - Constraints:
-  - presentation only; shell-docked chrome (DEC-109) — tracking the shell's visible rectangle is allowed; a free-floating overlay disconnected from the shell is not
+  - presentation only; below `768px` the tray is shell-docked (DEC-109), tracking the shell's visible rectangle; at `768px`+ it is a floating card inset from the viewport edges and sized to its content (REQ-207)
   - no change to destination registry, action entries, Theme section contents, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, backend routes, card metadata, scan behavior, or data pipeline
@@ -2759,2 +2759,3 @@
   - follow-up to shipped `center-menu-tab-prominence` (DEC-122); EnrichmentStep brand-block consolidation remains parked
+  - amended for the `ui-reimagining-build` pass (2026-09-30): full height below `768px`, floating card at `768px`+
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -126,8 +126,9 @@
   DEC-104, DEC-095)
-- Built: the tray fills the visible shell side (viewport ∩ shell on tall
-  scrollable pages), with matching top- and bottom-left shell radii and an optional
-  quiet, non-interactive brand mark in unused lower space. It is opaque across its
-  full painted bounds — no destination text, control, or artwork remains legible
-  through it — and its painted content does not overflow the shell/viewport bottom.
-  (DEC-133, DEC-147, REQ-113, REQ-122)
+- Built: below `768px` the tray fills the visible shell side (viewport ∩ shell on
+  tall scrollable pages), with matching top- and bottom-left shell radii; at
+  `768px`+ it is a floating card inset from the viewport edges, rounded, sized to
+  its content. Either way it is opaque across its full painted bounds — no
+  destination text, control, or artwork remains legible through it — its painted
+  content does not overflow the shell/viewport bottom, and its lower space carries
+  the colour's scene at a whisper. (DEC-133, DEC-147, REQ-113, REQ-122, REQ-207)
 - Built: on the two conversation-bearing destinations (In-Depth Question, Quick
@@ -377,5 +378,7 @@
   the rail top and the step eyebrow while two stacked 44px zones need 88px. (DEC-137)
-- Menu tray: full height of the visible shell side; opaque across its painted bounds;
-  painted content does not overflow the shell/viewport bottom. Theme orbs on one row.
-  (DEC-133, DEC-147, REQ-113, REQ-122, REQ-131)
+- Menu tray: below `768px` full height of the visible shell side; at `768px`+ a
+  floating card sized to its content; opaque across its painted bounds; painted
+  content does not overflow the shell/viewport bottom. Theme band cells ≥40px,
+  sliding with arrows when six do not fit. (DEC-133, DEC-147, REQ-113, REQ-122,
+  REQ-131, REQ-207)
 - History drawer width: phone `min(22rem, 88vw)`; desktop `min(30rem, 90vw)`; left-edge
```

- Verdict: accept
- Reason:

## REQ-114 — The ☰ button's tap area matches what it paints

**What this decides:** whether this entry's wording is updated to match REQ-207 (the new frame).

**In plain terms:** REQ-114 stops the Menu control from catching taps outside what it visibly draws — it once opened the Menu when a player tapped their life total. That rule carries over to the new ☰ button: its tap area is exactly the button (at least 44px), and none of the banner's decoration catches taps. The old corner-rail measurements go.

**What happens if you say no:** the entry keeps measuring a corner rail that no longer exists.

**Recommendation:** accept if you accepted REQ-207 (the new frame); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2763,11 +2763,8 @@
 - Priority: high
-- Description: Suite chrome must not accept taps outside the affordance it visibly paints. The feature-portal corner rail's interactive box is capped to its icon band while its radial gradient continues to paint at its current `5.5rem × 10.5rem` extent as non-interactive decoration, and the two-zone split rail's zones sit side-by-side so they clear the step-name eyebrow while holding NFR-001's per-zone touch floor (DEC-137).
-- Acceptance Criteria:
-  - the single-zone rail's interactive element is `5.5rem` wide × `3.5rem` tall; the region between that box and the gradient's painted extent does not accept pointer events
-  - the single-zone rail's rendered appearance is unchanged at every viewport and in every state (rest, hover, `aria-expanded`), including the top-left radius treatment, both gradient stops, and the icon's rendered position — the icon must not shift as a result of the smaller interactive box
-  - on Life Tracker, `document.elementFromPoint` over the region previously shadowed by the rail returns the player card's life control, not the Menu trigger — asserted at multiple points across the former `75 × 111` overlap, not a single sample, and the measured remaining overlap between the rail's interactive box and the "Decrease life for Player 1" control is exactly zero
-  - the split rail renders its Menu and History zones side-by-side within the rail's `5.5rem` width, each at least `2.75rem × 2.75rem`, with Menu leading and History trailing
-  - on a destination carrying a History zone, `document.elementFromPoint` over the step-name eyebrow's leading characters returns the eyebrow's own content, not a rail zone, and the rail's interactive box ends above the eyebrow's top edge
-  - both split-rail zones meet NFR-001's 44px-per-zone floor without either zone overflowing the rail's stated box
-  - the single-zone rail retains a touch target meeting NFR-001 at every viewport
+- Description: Suite chrome must not accept taps outside the affordance it visibly paints. Under the direction-1 banner header (REQ-207) the Menu trigger is the ☰ button, whose interactive box equals its painted button (at least 44px), and no header decoration — the lit band, its element art, the ambient scene — accepts pointer events.
+- Acceptance Criteria:
+  - the ☰ button's interactive box equals its painted bounds and is at least 44px in each dimension; the banner's decorative band and element art are `pointer-events: none`
+  - on Life Tracker, `document.elementFromPoint` over the life controls nearest the header returns the life control, never the Menu trigger or header decoration, asserted at several points
+  - `document.elementFromPoint` over the step-name eyebrow's leading characters returns the eyebrow's own content, not header chrome
+  - the ☰ button meets NFR-001 at every viewport
   - no destination's content is inset, repositioned, or resized to accommodate the rail
@@ -2777,3 +2774,3 @@
   - no change to the destination registry, drawer contents, Theme section, `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, providers, or backend routes
-  - do not redesign the rail's visual language or alter its gradient values
+  - the rail's radial-gradient visual language is retired by REQ-207; this requirement's hit-area rule carries over to the ☰ button
 - Dependencies:
@@ -2792,2 +2789,3 @@
   - the side-by-side split arrangement is forced, not stylistic: only 70px exists between the rail's top and the eyebrow, while two stacked 44px zones require 88px
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the corner-rail geometry is superseded; the painted-equals-interactive rule stands
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -371,5 +371,6 @@
   `screen-layout.md`)
-- Single-zone Menu rail (Life Tracker, Trade Balancer): interactive box `5.5rem × 3.5rem`;
-  gradient paints at `5.5rem × 10.5rem` as `pointer-events: none` decoration, so the
-  variant's appearance is byte-for-byte unchanged. (DEC-137, REQ-114)
+- Menu trigger: the ☰ button at the banner's left, at least 44px, interactive box
+  equal to its painted bounds; the banner's band and element art take no pointer
+  events. Superseded geometry: the single-zone corner rail (`5.5rem × 3.5rem`
+  interactive, gradient painted at `5.5rem × 10.5rem`). (REQ-114, REQ-207)
 - Split Menu+History rail (In-Depth, Quick Question): two zones side-by-side, each
```

- Verdict: accept
- Reason:

## REQ-115 — Menu-over-History occlusion has nothing left to cover

**What this decides:** whether this entry's wording is updated to match REQ-213 (Question History).

**In plain terms:** REQ-115 made sure the History icon under the open Menu couldn't be tapped through it. With the History icon gone, that rule has no subject; the open Menu still covers the ☰ button (REQ-127). This adds a note saying so.

**What happens if you say no:** the entry keeps testing a History icon that no longer exists.

**Recommendation:** accept if you accepted REQ-213 (Question History); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2816,2 +2816,3 @@
   - prior "Menu trigger still toggles the tray closed" criterion is superseded by REQ-127
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the History rail zone is retired (REQ-213), so the History-occlusion criteria have no subject; the open tray still covers the ☰ trigger (REQ-127) and stays opaque over destination content (REQ-122)
 
```

- Verdict: accept
- Reason:

## REQ-127 — The open Menu hides the ☰ button and closes three ways

**What this decides:** whether this entry's wording is updated to match REQ-207 (the new frame).

**In plain terms:** REQ-127 hides the Menu and History icons while the Menu is open and closes it by a tap outside or Escape. Now there is one ☰ button to hide, and the tray also gets its own ✕.

**What happens if you say no:** the entry keeps naming rail icons that no longer exist.

**Recommendation:** accept if you accepted REQ-207 (the new frame); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -3065,8 +3065,8 @@
 - Priority: high
-- Description: While the feature-portal Menu tray is open, Menu and History rail icons are not visible and not clickable; the user closes the tray by clicking/tapping outside it or pressing Escape (DEC-150).
-- Acceptance Criteria:
-  - with the tray open on History-bearing and Menu-only destinations at 390×844 and 1440×900, `document.elementFromPoint` over the former Menu and History icon centers does not hit those controls
-  - Menu and History rail affordances do not paint through/over the open tray
-  - outside-click (and existing Escape) closes the tray; opening History by other means still honors Menu↔History mutual exclusivity
-  - rest-state rail (tray closed) keeps DEC-137 hit-area rules and NFR-001 floors
+- Description: While the feature-portal Menu tray is open, the ☰ Menu trigger is covered and not clickable; the user closes the tray with its ✕, by clicking/tapping outside it, or by pressing Escape (DEC-150, REQ-207).
+- Acceptance Criteria:
+  - with the tray open at 390×844 and 1440×900, `document.elementFromPoint` over the ☰ button's center does not hit it
+  - the ☰ button does not paint through or over the open tray
+  - the tray's ✕, outside-click and Escape each close it; choosing Question History closes the tray before its sheet opens
+  - the rest-state ☰ (tray closed) keeps REQ-114's hit-area rule and NFR-001's floor
 - Constraints:
@@ -3081,2 +3081,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): one ☰ trigger, a ✕ on the tray
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -140,9 +140,7 @@
   eye. (DEC-137, DEC-126, REQ-114, REQ-113)
-- Built: while the tray is open, neither the Menu trigger nor the History zone is
-  visible or hit-testable (`aria-hidden`, `tabIndex={-1}`, `visibility: hidden`,
-  `pointer-events: none`), and the tray fully occludes the under-rail History zone.
-  The tray closes exclusively by outside click / Escape — the rail icons are not
-  the open-state close control. Menu↔History mutual exclusivity still applies when
-  History is opened by other means. (DEC-150, DEC-140, DEC-147, REQ-115, REQ-127,
-  REQ-122)
+- Built: while the tray is open, the ☰ trigger is covered and not hit-testable
+  (`aria-hidden`, `tabIndex={-1}`, `visibility: hidden`, `pointer-events: none`).
+  The tray closes on its ✕, an outside click, or Escape; choosing Question History
+  closes the tray before its sheet opens. (DEC-150, DEC-140, DEC-147, REQ-115,
+  REQ-127, REQ-122, REQ-213)
 - Built: the active-destination choice persists across a refresh within the same
```

- Verdict: accept
- Reason:

## REQ-128 — The card detail opens in the centre on desktop

**What this decides:** whether this entry's wording is updated to match REQ-208 (the shared sheet).

**In plain terms:** REQ-128 is the card detail box that opens from the corner of any card image. Today it slides in from the right on screens 768px and wider. In the shared sheet it rises from the bottom below 600px and floats in the centre from 600px up, with art first, then name and cost, type line, oracle text in a frame, and three fact tiles. Loading it on demand is unchanged.

**What happens if you say no:** the detail keeps sliding in from the right on desktop.

**Recommendation:** accept if you accepted REQ-208 (the shared sheet); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -3085,6 +3085,6 @@
 - Priority: high
-- Description: Whenever a card image is displayed in the suite, a compact corner control on the image opens a dismissible, portal-hosted overlay with oracle text and other descriptive fields fetched on demand by oracle id (REQ-175, FLOW-024). The overlay follows DEC-158 and the `AdaptiveContextDialog` family: it is sized to its own content outside the image bounds, presenting as a bottom sheet below `768px` and a side panel at `768px`+ (DEC-151, DEC-158).
+- Description: Whenever a card image is displayed in the suite, a compact corner control on the image opens a dismissible, portal-hosted overlay with oracle text and other descriptive fields fetched on demand by oracle id (REQ-175, FLOW-024). The overlay is the shared sheet (REQ-208): sized to its own content outside the image bounds, a bottom sheet below `600px` and a floating card centred in the viewport from `600px` up.
 - Acceptance Criteria:
   - every suite card-image surface that shows an available image exposes the corner detail control (top-right of the image)
-  - activating the control opens a portal-hosted, content-sized overlay outside the card image's bounding box: a bottom sheet below `768px` and a side panel at `768px`+, following `screen-layout.md` → *Card detail popup (suite-wide)*
+  - activating the control opens a portal-hosted, content-sized overlay outside the card image's bounding box: the shared sheet (REQ-208) — a bottom sheet below `600px`, a floating centred card from `600px` up that fades up into place — following `screen-layout.md` → *Card detail popup (suite-wide)*
   - the popup has an X close control; Escape and/or outside dismiss may match other overlays
@@ -3107,2 +3107,3 @@
   - **amended during the `ui-review` pass (2026-08-06)**: DEC-158 supersedes the original "popup over the card" geometry. The top-right image trigger remains; the popup's content is now fetched on demand by oracle id (REQ-175, FLOW-024) rather than read from locally carried fields, and the popup itself is portal-hosted and independent of the image bounds.
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the side panel at `768px`+ becomes REQ-208's centred card from `600px`; the on-demand fetch and fallbacks are unchanged
 
--- a/PRD/sections/screen-layout.md
+++ b/PRD/sections/screen-layout.md
@@ -97,4 +97,4 @@
 | Purpose | Read oracle/local card detail without stacking it under the image |
-| Phone | Bottom sheet in the overlay family (DEC-158), **sized to its own content — not to the card image's bounding box**; opened from the top-right corner control on the image |
-| Desktop/tablet | Side panel at `768px`+ matching `AdaptiveContextDialog`'s composition; width tracks the View Context row, not a free full-viewport panel |
+| Phone | The shared sheet (REQ-208): a bottom sheet below `600px`, **sized to its own content — not to the card image's bounding box**; opened from the top-right corner control on the image |
+| Desktop/tablet | From `600px`: a floating card centred in the viewport, fading up into place; content-sized (REQ-208) |
 | Fit | Overlay; popup body may region-scroll if detail is long; the close control lays out **inside** the overlay's own bounds at every width; must not invent a second page-length scroll for the hosting step |
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -282,12 +282,13 @@
 - Built: whenever a card image is shown anywhere in the suite, a compact corner control
-  (top-right of the image) opens a **dismissible detail popup** carrying oracle text and
+  (top-right of the image) opens a **dismissible detail box** carrying oracle text and
   other descriptive fields fetched on demand by oracle id (REQ-175, FLOW-024) behind a
   brief loading state; a missing image keeps the name-first fallback, which shows the card
-  name only (FLOW-001). The popup renders through a portal into the `AdaptiveContextDialog`
-  overlay family — a bottom sheet below `768px`, a side panel at `768px+`, sized to its
-  **own content** — not `absolute inset-0` over the image's box. Stacked oracle/detail
-  under the image is not the default density path. This is one shared component across all
-  six card surfaces (Quick Question card search, In-Depth Enrichment, the card inside View
-  Context, the In-Depth zone selected-card/add preview, the In-Depth zone strip, and Scan
-  review). (DEC-151, DEC-158, REQ-128)
+  name only (FLOW-001). The box renders in the shared sheet (REQ-208) — a bottom sheet
+  below `600px`, a floating card centred in the viewport from `600px` up, fading up into
+  place — sized to its **own content**, not `absolute inset-0` over the image's box: art
+  leads, the name over it with the mana cost, one type line with colour pips, oracle text
+  in a framed box, and three fact tiles (mana value · subtypes · price). It is one shared
+  component across every card surface (the Ask a Question stage and Cards strip, In-depth
+  details' shelf and context sheet, the card inside View Context, and Scan review).
+  (DEC-151, DEC-158, REQ-128, REQ-208)
 - Built: the shared `CardPresentation` renders only a small **Remove card** control beside
@@ -394,3 +395,3 @@
   REQ-116, DEC-118, `screen-layout.md`)
-- Card detail popup: bottom sheet below `768px` / side panel at `768px+`, content-sized,
+- Card detail popup: the shared sheet — bottom sheet below `600px` / floating centred card at `600px+`, content-sized,
   close control laid out inside its own bounds at every width. Superseded geometry:
```

- Verdict: accept
- Reason:

## REQ-131 — Theme orbs become the six-cell Theme band

**What this decides:** whether this entry's wording is updated to match REQ-207 (the new frame).

**In plain terms:** REQ-131 keeps the six Theme colours on one row. The row becomes a band of six cells that never wraps: each cell is at least 40px, and on a very narrow screen the band slides sideways with an arrow at each end instead of shrinking. The Colorless colour picker and Reset to gray stay centred under it.

**What happens if you say no:** the entry keeps describing round orbs.

**Recommendation:** accept if you accepted REQ-207 (the new frame); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -3166,8 +3166,8 @@
 ### REQ-131
-- Title: Theme orb single-row layout
-- Priority: medium
-- Description: The Menu Theme section keeps all six profile orbs on one row and centers Colorless options under that row when Colorless is selected (DEC-152).
-- Acceptance Criteria:
-  - at 390×844 and 1440×900 with the Menu tray open, the six Theme orbs share one row (the last orb is not alone on a second row)
-  - when Colorless is selected, custom color + Reset controls appear centered under the orb row
+- Title: Theme band single-row layout
+- Priority: medium
+- Description: The Menu Theme section is one six-cell band (REQ-207) that never wraps: each cell is at least 40px, and when six no longer fit the band slides with an arrow at each end; Colorless options sit centred beneath it when Colorless is selected (DEC-152).
+- Acceptance Criteria:
+  - at 390×844 and 1440×900 with the Menu tray open, the six Theme cells share one row with no arrows; below the width where six 40px cells fit, the band slides with an arrow at each end nudging two cells, the exhausted end's arrow fading, and the chosen cell scrolled into view on open
+  - when Colorless is selected, custom color + Reset controls appear centered under the band, wrapping cleanly
   - selecting other profiles does not show Colorless-only controls; DEC-119 catalog/persistence unchanged
@@ -3181,2 +3181,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): orbs become band cells (REQ-207)
 
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -168,5 +168,6 @@
   NFR-011)
-- Built: the Theme section's palette orbs sit on one row within the tray; the
-  section takes a normal inset rather than the rail-clearing row inset (it sits well
-  below the rail's icon zone). (REQ-131, DEC-135)
+- Built: the Theme section is one segmented band the tray's width, six equal cells
+  (never narrower than 40px), sliding with an arrow at each end when six no longer
+  fit; it takes a normal inset rather than the rail-clearing row inset. (REQ-131,
+  REQ-207, DEC-135)
 - Built: the catalog is six globally shared MTG-color profiles, ordered **White,
@@ -174,3 +175,3 @@
   `accent` / `accent-strong` / `accent-soft` / `accent-contrast` values through the
-  existing four-token contract, and each orb swatch shows that profile's
+  existing four-token contract, and each Theme cell's light shows that profile's
   `accent-soft` value. Colorless alone exposes an inline full-spectrum custom-color
@@ -182,6 +183,8 @@
   value and falls back to Blue. (DEC-119, REQ-099)
-- Built: all six Theme orbs render on a single row, with the Theme block/tray
-  extending as needed so the last orb never wraps to a second row on its own; when
-  Colorless is selected, its custom-color input and Reset control render **centered
-  underneath** the orb row rather than beside it. (DEC-152, REQ-131)
+- Built: an unchosen cell is a faint wash of its colour with its symbol in the
+  colour's light; the chosen cell is filled with the colour's light, the symbol
+  dark on it, with a small glow; no colour names or blurb (hover titles and
+  accessible names carry them). When Colorless is selected, its custom-color input
+  and Reset control render **centered underneath** the band, wrapping cleanly.
+  (DEC-152, REQ-131, REQ-207)
 
```

- Verdict: accept
- Reason:

## REQ-132 — No separate Send Request button: send from inside the box

**What this decides:** whether this entry's wording is updated to match REQ-206 (the one-pill question box).

**In plain terms:** REQ-132 put a visible "Send Request" label on the first send button. In the mockup every question box sends from a round send pill inside the box, with no text label; screen readers still hear "Ask" / "Decrypt Stack". Older entries that say "Send Request" now mean this send control.

**What happens if you say no:** the first send keeps its "Send Request" label, next to the pill design.

**Recommendation:** accept if you accepted REQ-206 (the one-pill question box); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -3185,6 +3185,6 @@
 - Priority: medium
-- Description: The initial pre-submit Ask/Decrypt control shows visible **Send Request** text; the answered follow-up send control stays arrow/icon-only; Enrichment ready-state copy briefly directs the user to that button when the optional message is empty (DEC-153).
-- Acceptance Criteria:
-  - Enrichment decrypt and Quick Question first-ask submit controls show the visible label **Send Request**
-  - after the first answer, the follow-up composer send control remains arrow/icon-only
+- Description: Every question box sends from the round send pill inside the box (REQ-206) — there is no separate labelled **Send Request** button, and older entries' **Send Request** names this send control. Enrichment ready-state copy briefly directs the user to that control when the optional message is empty (DEC-153).
+- Acceptance Criteria:
+  - the Enrichment and Ask a Question first-ask submit controls are the send pill inside the question box, with no visible text label
+  - the follow-up composer uses the same send pill
   - Enrichment ready-state helper text (when the optional question is blank) concisely tells the user to use the send button unless they add an optional message
@@ -3202,2 +3202,3 @@
 - Notes:
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the visible Send Request label is retired for the send pill; accessible names and caps unchanged
 
--- a/PRD/sections/quick-lookup/README.md
+++ b/PRD/sections/quick-lookup/README.md
@@ -116,6 +116,6 @@
   (DEC-131, REQ-110)
-- Built: the initial submit control shows the visible label **Send Request**
-  (accessible name may keep Ask/Decrypt semantics); the answered-view
-  follow-up composer keeps its separate compact arrow/icon-only send control.
-  (DEC-153, REQ-132, DEC-146)
+- Built: the initial submit control is the round send pill inside the question
+  box, with no visible text label (its accessible name keeps Ask semantics); the
+  answered-view follow-up composer uses the same send pill. (DEC-153, REQ-132,
+  REQ-206)
 
--- a/PRD/sections/in-depth/README.md
+++ b/PRD/sections/in-depth/README.md
@@ -40,3 +40,3 @@
 phase), confirm which zones matter, add the cards in each zone, optionally
-annotate them, then type a question and hit **Send Request**. Behind that button
+annotate them, then type a question and tap send. Behind that button
 runs the full Ask AI backend on its `mode: "game"` branch — the request carries a
@@ -213,6 +213,6 @@
 
-- Built: the initial submit control's visible label is **Send Request**; its
-  accessible name retains Decrypt Stack / Ask semantics. Enrichment ready-state
-  copy points at the button when the optional question is blank. (DEC-153,
-  REQ-132, REQ-012)
+- Built: the initial submit control is the round send pill inside the question
+  box, with no visible text label; its accessible name retains Decrypt Stack / Ask
+  semantics. Review ready-state copy points at the send when the optional
+  question is blank. (DEC-153, REQ-132, REQ-012, REQ-206)
 - Built: the optional question field accepts up to 300 characters of raw editable
```

- Verdict: accept
- Reason:

## REQ-012 — The submit action is the send pill

**What this decides:** whether this entry's wording is updated to match REQ-132 as amended.

**In plain terms:** REQ-012 is the In-Depth submit action. Its first line says the button's visible label is "Send Request"; it becomes the send pill with no text label. What it sends is unchanged.

**What happens if you say no:** the entry keeps the retired label.

**Recommendation:** accept if you accepted REQ-132 as amended; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -168,3 +168,3 @@
 - Acceptance Criteria:
-  - the initial pre-submit action's **visible** label is **Send Request** (DEC-153 / REQ-132); the control's accessible name retains Decrypt Stack / Ask semantics
+  - the initial pre-submit action is the send pill inside the question box with no visible text label (REQ-132 as amended, REQ-206); the control's accessible name retains Decrypt Stack / Ask semantics
   - clicking the button sends `question` and `gameContext`
```

- Verdict: accept
- Reason:

## REQ-121 — The composer row's send control has no text label

**What this decides:** whether this entry's wording is updated to match REQ-132 as amended.

**In plain terms:** REQ-121 keeps the question box the widest part of its row and says the send keeps its screen-reader name "even when the visible label is Send Request". That clause becomes "the send pill, with no visible label"; the width rule stays.

**What happens if you say no:** the entry keeps referring to the retired label.

**Recommendation:** accept if you accepted REQ-132 as amended; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2926,3 +2926,3 @@
   - the placeholder and typed content are not clipped: the field's `scrollHeight` does not exceed its `clientHeight` at rest
-  - the submit control exposes its existing accessible name ("Ask TheJudge", "Decrypt Stack") even when the visible label is **Send Request**
+  - the submit control (the send pill, REQ-206) exposes its existing accessible name ("Ask TheJudge", "Decrypt Stack") with no visible text label
   - the submit control meets the 44px touch-target floor (NFR-001)
```

- Verdict: accept
- Reason:

## REQ-200 — Colour rules: the custom Colorless exemption becomes the readability lift

**What this decides:** whether this entry's wording is updated to match REQ-099 (custom Colorless kept readable).

**In plain terms:** REQ-200 sets the app's colour roles and contrast floors and exempts a custom Colorless colour from them on purpose. If REQ-099's lift is accepted, that exemption becomes "lifted to readable, hue kept", and the lift is named as the one allowed runtime colour adjustment.

**What happens if you say no:** REQ-200 keeps exempting custom Colorless, contradicting REQ-099 if that is accepted.

**Recommendation:** accept if you accepted REQ-099 (custom Colorless kept readable); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -4863,3 +4863,3 @@
     measured `#09090B` luminance, so the app survives a bright game store
-  - deliberately uncorrected custom Colorless RGB (REQ-099) stays exempt from the
+  - a custom Colorless colour is lifted to REQ-099's readability floors (as amended) while keeping its hue, so it no longer sits outside them
     contrast floors, exactly as it is today
@@ -4909,2 +4909,3 @@
     the redesign may not make any of the three worse than it is today
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the custom-Colorless exemption is replaced by REQ-099's readability lift, the one permitted runtime colour derivation — a fixed rule, not a contrast engine. REQ-207 is the code slice that ships this token set
 
```

- Verdict: accept
- Reason:

## FLOW-001 — In-depth flow steps use the four stations

**What this decides:** whether this entry's wording is updated to match REQ-209, REQ-017 and REQ-132.

**In plain terms:** FLOW-001 walks the In-Depth question start to finish. Its steps are renamed to the stations and describe the shelf, the context sheet, the review and the send pill. The request it sends is unchanged.

**What happens if you say no:** the flow keeps describing View all cards, the strip, and Send Request.

**Recommendation:** accept if you accepted REQ-209, REQ-017 and REQ-132; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -11,5 +11,5 @@
   2. Zone confirmation: app preselects likely zones from the turn phase; user adjusts the checklist; at least one zone is required to continue.
-  3. Per-zone collection: for each selected zone, user may add card identities from local search; non-stack cards capture owner; stack cards are ordered bottom-to-top. Added cards appear in a horizontal left-to-right strip in add order with horizontal region scroll. An available uncropped card image sizes to the container its host affords (DEC-160) rather than to a fixed compact cap; a corner detail control opens a dismissible popup that fetches oracle/metadata on demand by oracle id (FLOW-024). If the image is unavailable, the fallback shows the locally available identity (the card name) directly, and opening the popup still fetches the detail. Remove and stack position remain available. Each complete tile has a restrained ring derived from the card's existing colors, with a light silver-gray treatment for colorless/missing colors. While scan is open, search and the card list are hidden; user exits scan to return to manual search.
-  4. Enrichment: default card-by-card wizard (OK advances); optional **View all cards** for full-list edit with per-zone internal scrolling; user may add caster, targets, notes, and mana spent where relevant. In both modes, the same container-relative image + corner detail popup presentation appears above full-width enrichment fields (DEC-160); the popup's descriptive fields load on demand (FLOW-024). The complete image-bearing or fallback card row uses the same identity-ring treatment as zone collection.
-  5. Submit: user enters an optional question, clicks **Send Request** on the initial decrypt control, and the frontend sends `question` plus `gameContext` to the backend.
+  3. Cards: for each selected zone, user may add card identities by search or scan, and cards carried from Ask a Question are placed into a zone one at a time (or left out); non-stack cards capture owner; stack cards are ordered bottom-to-top, appended on add and reorderable by drag or Down / Up / To top (REQ-005, REQ-209). Cards appear on a lit horizontal shelf per zone tab with horizontal region scroll; an available uncropped card image sizes to the container its host affords (DEC-160); a tap opens the card's menu (Move to · order · Card details · Remove), and its detail opens in the shared sheet with descriptive fields fetched on demand by oracle id (FLOW-024). If the image is unavailable, the fallback shows the card name. Each complete tile keeps a restrained ring derived from the card's colors, light silver-gray for colorless/missing colors. While scan is open, search and the shelf are hidden; the user exits scan with its ✕ to return.
+  4. Context: one compact sheet per card (REQ-017) — owner, cast by, mana spent where relevant, one Targets picker, and a folded note — then a review listing each card's context in words with ✎ to jump back. The card's image uses the container-relative presentation with the corner detail control, and the complete image-bearing or fallback card row keeps the same identity-ring treatment as the shelf.
+  5. Submit: user enters an optional question and taps the send pill inside the question box (REQ-132, REQ-206), and the frontend sends `question` plus `gameContext` to the backend.
   6. Backend builds the prompt and returns a plain-text answer.
@@ -42,2 +42,3 @@
   - desktop shell width (DEC-145, REQ-124), pre-submit composer composition (DEC-146 / DEC-153, REQ-121 / REQ-132), and card density (DEC-151, REQ-125 / REQ-128–130) are presentation-only and change no step logic or payload
+  - amended for the `ui-reimagining-build` pass (2026-09-30): steps 1–4 are In-depth details' stations Game · Zones · Cards · Context (REQ-209); step 1's players panel uses one shared "More details for all players" toggle (REQ-100 as amended)
 
```

- Verdict: accept
- Reason:

## FLOW-005 — Follow-up flow: the first question is shown

**What this decides:** whether this entry's wording is updated to match REQ-025 (your question opens the conversation).

**In plain terms:** FLOW-005 is the follow-up flow. Its note that the first question is hidden flips to shown, matching REQ-025.

**What happens if you say no:** the note keeps saying the first question is hidden.

**Recommendation:** accept if you accepted REQ-025 (your question opens the conversation); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -119,3 +119,3 @@
   - game context, zones, cards, and enrichment are frozen for the duration of the conversation; follow-ups are text-only in v1
-  - the initial user question (including fallback) is included in `conversationHistory` sent to the API but is not shown as a visible bubble in the thread
+  - the initial user question (including fallback) is included in `conversationHistory` sent to the API and is shown as the first, right-aligned bubble in the thread (REQ-025 as amended)
   - the answered-state screen keeps the top header slim and uses the compact context trigger plus adaptive overlay so the message log remains primary (DEC-118, REQ-097, REQ-098)
```

- Verdict: accept
- Reason:

## FLOW-007 — Theme flow: a six-cell band, custom Colorless kept readable

**What this decides:** whether this entry's wording is updated to match REQ-207 and REQ-099.

**In plain terms:** FLOW-007 is choosing a colour. It updates for the six-cell band with no visible names, the colour scene, Life Tracker's table staying as it is, and — if REQ-099 is accepted — the custom Colorless colour lifted to stay readable.

**What happens if you say no:** the flow keeps named swatches and the uncorrected custom colour.

**Recommendation:** accept if you accepted REQ-207 and REQ-099; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -166,7 +166,7 @@
   1. User opens the feature-portal Menu and finds its palette-only **Theme** section.
-  2. App shows White, Blue, Black, Red, Green, and Colorless in that order as named swatches, with the current profile indicated and Blue as the default.
+  2. App shows White, Blue, Black, Red, Green, and Colorless in that order as a six-cell Theme band — each cell its colour's wash and symbol, named by its hover title and accessible name rather than a visible label — with the current profile lit and Blue as the default (REQ-207).
   3. User selects a profile.
-  4. App immediately applies the selected profile to the whole surface — background wash, panel fills and edges, focus rings, the Ask AI waiting panel, and the card-detail popup — plus primary accents and the resting/hover/focus/current treatments on REQ-060's inventory, all without leaving the current workflow step (REQ-200). Player Life Tracker's own screens keep their present-day appearance; the shared chrome it inherits (menu rail, brand mark, theme section) picks up the profile like every other destination, reviewed by a screenshot pair rather than pinned (REQ-202).
+  4. App immediately applies the selected profile to the whole surface — the flat ground, the colour's ambient scene (REQ-207), panel fills and edges, focus rings, the Ask AI waiting panel, and the card-detail box — plus primary accents and the resting/hover/focus/current treatments on REQ-060's inventory, all without leaving the current workflow step (REQ-200). Player Life Tracker's table keeps its present-day appearance; the shared chrome and sheets it inherits pick up the profile like every other destination, reviewed by a screenshot pair rather than pinned (REQ-202).
   5. If the user selects Colorless, the Theme section exposes an inline full-spectrum color input and `Reset to gray`.
-  6. If the user chooses a custom color, app immediately applies the exact RGB without validation or contrast correction and remembers it independently; if the user selects Reset, app deletes only the custom value and restores fixed neutral gray.
+  6. If the user chooses a custom color, app immediately applies its hue, lifted only where it would fail readability (REQ-099 as amended), and remembers the exact pick independently; if the user selects Reset, app deletes only the custom value and restores fixed neutral gray.
   7. App stores the selected profile for the browser.
@@ -178,3 +178,3 @@
   - selecting the current fixed profile is a no-op and does not close or reset the main gameplay workflow unless the implemented control naturally closes after selection
-  - a low-contrast custom Colorless choice is applied as chosen; the app does not warn, reject, or repair it
+  - a low-contrast custom Colorless choice is lifted to REQ-099's readability floors while keeping its hue; the app does not warn or reject it
 - Notes:
```

- Verdict: accept
- Reason:

## FLOW-009 — Trade flow: piles and verdict update live

**What this decides:** whether this entry's wording is updated to match REQ-215.

**In plain terms:** FLOW-009 is building a trade. Its step about the totals updating adds the piles of gold and the verdict line updating with them.

**What happens if you say no:** the step keeps describing only the amount and higher side.

**Recommendation:** accept if you accepted REQ-215; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -202,3 +202,3 @@
   3. The added entry shows its printing (set/collector/image), its USD price, a **foil toggle** (non-foil ↔ `usd_foil`), and a **quantity** control; the same card may be added multiple times or carry a quantity ≥ 1.
-  4. Each side total updates live as `Σ qty × (foil ? usdFoil : usd)`, and the difference between the two sides updates with an amount and which side is higher (or equal).
+  4. Each side total updates live as `Σ qty × (foil ? usdFoil : usd)`, and the two piles of gold, the verdict line naming the side ahead (or "Even"), and the dollar difference update with them (REQ-215).
   5. The user adds cards to the other side the same way, adjusts foil/quantity, and removes entries as needed until the difference reflects the trade.
```

- Verdict: accept
- Reason:

## FLOW-010 — Switching destinations: the ☰ Menu and one question door

**What this decides:** whether this entry's wording is updated to match REQ-206, REQ-207 and REQ-213.

**In plain terms:** FLOW-010 is moving between screens. It still describes a top-middle Menu button and two question doors. It updates to the ☰ button and the four rows: Ask a Question, Question History, Life Tracker, Trade Balancer, then Send feedback and Theme.

**What happens if you say no:** the flow keeps its outdated button position and two question doors.

**Recommendation:** accept if you accepted REQ-206, REQ-207 and REQ-213; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -225,4 +225,4 @@
 - Main Flow:
-  1. User taps the icon-only portal Menu button in the **top-middle** of the current screen's header; it is the suite's only floating/attached app-chrome affordance.
-  2. The Menu opens and lists the registered destinations — **In-Depth Question**, **Quick Question**, **Trade Balancer**, and **Life Tracker** — with the current destination indicated. It also shows the palette-only **Theme** section and any registered action entries (v1: **Send feedback**).
+  1. User taps the ☰ Menu button at the left of the current screen's banner header (REQ-207); it is the suite's only app-navigation affordance.
+  2. The Menu tray slides in and lists **Ask a Question** (current also while In-depth details is open), **Question History**, **Life Tracker**, and **Trade Balancer**, with the current destination lit; below them sit **Send feedback** and the six-cell **Theme** band (REQ-206, REQ-213).
   3. User selects another destination.
```

- Verdict: accept
- Reason:

## FLOW-011 — Ask a Question flow

**What this decides:** whether this entry's wording is updated to match REQ-206 (one question door).

**In plain terms:** FLOW-011 is the Quick Question flow. It becomes the Ask a Question flow: up to the card cap on the stage, the one-pill box, Add in-depth details as the way into In-depth, your question shown first (if REQ-025 is accepted), the Cards strip, and Edit cards / Start over. Several of its lines were already out of date since multi-card questions shipped (REQ-167); this fixes them too.

**What happens if you say no:** the flow keeps describing the single-card Quick Question page.

**Recommendation:** accept if you accepted REQ-206 (one question door); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -242,4 +242,4 @@
 ### FLOW-011
-- Name: Ask a Quick Question with optional card context
-- Trigger: User opens **Quick Question** from the feature portal (FLOW-010) to ask about a single card, or ask a freeform Magic rules question, without staging any game state
+- Name: Ask a Question with optional card context
+- Trigger: User opens **Ask a Question** from the Menu (FLOW-010) to ask about one or more cards, or ask a freeform Magic rules question, without staging any game state
 - Preconditions:
@@ -249,13 +249,13 @@
 - Main Flow:
-  1. User selects Quick Question from the feature portal; the app switches to the lookup view (frontend-only, no reload).
-  2. The pre-submit view shows, top to bottom: an optional card-attach control (its "OPTIONAL CARD" label followed inline by the guidance copy "Add a card for context or ask any Magic related question.", dash-separated, DEC-113), the Question field, then a collapsed-by-default "General rules topics" outer disclosure. Its summary remains visible regardless of whether a card is attached or the Question field already has text; expanding it reveals a short list of core rules topics (the stack & priority, targeting, combat, layers) the user can read locally with no AI call.
-  3. User optionally resolves one card either by typed autocomplete search (reusing REQ-001/REQ-002 behavior) or by scanning it with the existing camera scanner (FLOW-006 engine); the result is a single oracle-level card, shown with name, image when available, oracle text, and full metadata. The user may instead skip card input.
+  1. User selects Ask a Question from the Menu; the app switches to the question page (frontend-only, no reload).
+  2. The pre-submit view shows, top to bottom: the title with **Add card** and **Scan** beside it, the card stage when any card is attached (the front card full size, one neighbour peeking each side), the one-pill question box (Add in-depth details · text · count · send), then a collapsed-by-default "General rules topics" outer disclosure whose summary stays visible whatever else is on the page; expanding it reveals a short list of core rules topics the user can read locally with no AI call.
+  3. User optionally attaches cards, up to the lookup cap (REQ-167), by typed autocomplete search (REQ-001/REQ-002 behavior) or by scanning (FLOW-006 engine); each is a single oracle-level card shown on the stage with its image when available. The user may instead skip card input, or tap **Add in-depth details** to carry the cards and any typed question into In-depth details (REQ-206, FLOW-001).
   4. After expanding the outer "General rules topics" disclosure, each topic row shows its title, a "Use this topic" button, and an expand/collapse toggle without needing to expand the row; expanding a row reveals that topic's rule numbers and excerpt and auto-collapses any other open topic (accordion). Tapping "Use this topic" locks that topic's phrase (`Tell me about {Topic}.`) into a non-editable pill next to the Question field's label (with its own remove control), smooth-scrolls the view to the Question field, and focuses the textarea; any text the user already typed in the textarea is preserved as optional supplementary context (REQ-091).
   5. User enters or continues a freeform question (subject to the same 300-character cap as the main flow, which measures the **raw editable textarea content** — the locked pill phrase and the silent card-name fallback are composed at submit time and do not consume that budget, REQ-091 as amended by REQ-134) and submits, with or without a card attached and with or without a locked topic pill.
-  6. Frontend sends `{ mode: "lookup", question, card? }` to `POST /api/ask-ai`; `question` is the client-composed string (the locked pill phrase plus any supplementary textarea text, the textarea alone when no pill is locked and it has text, or — when no pill is locked and the textarea is empty but a card is attached — a silent `Tell me about {Card Name}.` fallback, per REQ-091); `card` is present only if one was attached; no `gameContext` is sent.
+  6. Frontend sends `{ mode: "lookup", question, cards? }` to `POST /api/ask-ai`; `question` is the client-composed string (the locked pill phrase plus any supplementary text, the text alone when no pill is locked, or — when no pill is locked and the box is empty but cards are attached — the silent `Tell me about {Card Name}.` fallback, per REQ-091); `cards` is present only if any were attached; no `gameContext` is sent.
   7. Backend assembles one lookup-mode prompt: question-driven rules retrieval (MTG reference block, always-on core game-rules topics, System 3 supplemental) always runs; when a card is attached, per-card enrichment (WotC rulings, full metadata incl. oracle text, and a System 3 query extended with that card's name, type line, and keywords — not its oracle text, REQ-178) layers in; game-state-only sections are always omitted. Off-domain questions get the "confused rules lookup" persona response rather than a direct answer. Backend returns a plain-text answer.
   7a. While the request is in flight and no answer has arrived yet, the Question form is hidden and replaced in place by the waiting panel (live elapsed timer, escalating messages); the Optional card section and the General rules topics disclosure stay visible and interactive throughout (DEC-114).
-  8. Frontend replaces the waiting/pre-submit view with the shared chat-first workspace (first visible bubble is the assistant answer; the initial question is not shown). When a card was attached, a compact card-context trigger opens its read-only presentation in a mobile bottom sheet or desktop right drawer; without a card, no context trigger renders.
-  9. User may send text follow-ups from the reused composer; each follow-up sends `{ mode: "lookup", question, card: frozen (if one was attached), conversationHistory }` under the same conversation limits as the main flow.
-  10. User may start over, which clears the thread, any locked topic pill, and returns to the pre-ask state — with the looked-up card preserved if one was attached; the collapsed outer "General rules topics" summary remains visible either way.
+  8. Frontend replaces the waiting/pre-submit view with the shared chat-first workspace: the player's question as sent, then the assistant's answer (REQ-025 as amended); attached cards sit in a Cards strip at the top, and card names in the answer that match them are tappable chips opening the card's detail (REQ-206).
+  9. User may send text follow-ups from the reused composer; each follow-up sends `{ mode: "lookup", question, cards: frozen (if any were attached), conversationHistory }` under the same conversation limits as the main flow.
+  10. User may tap **✎ Edit cards** to return to the pre-submit page with the cards and question kept, or **↺ Start over** to clear the thread, the cards, the question and any locked topic pill and return to the empty page; the collapsed outer "General rules topics" summary remains visible either way.
 - Edge Cases:
@@ -271,3 +271,3 @@
 - Notes:
-  - Quick Lookup carries no zones, stack, phase, or multi-card setup (DEC-107); it is not a full Comprehensive Rules browser and not official judge authority (canonical rule: `goals-and-non-goals.md` Scope Notes; retired index DEC-002 / DEC-013)
+  - Ask a Question carries no zones, stack, phase, or other game state (DEC-107, REQ-167); it is not a full Comprehensive Rules browser and not official judge authority (canonical rule: `goals-and-non-goals.md` Scope Notes; retired index DEC-002 / DEC-013)
   - reuses existing search, scan, core-topics, and the shared conversation workspace; when a card is attached the conversation is frozen on it, otherwise there is no frozen context object; follow-ups are text-only in v1
```

- Verdict: accept
- Reason:

## FLOW-014 — Send feedback flow: the ☰ Menu and the shared sheet

**What this decides:** whether this entry's wording is updated to match REQ-207 and REQ-208.

**In plain terms:** FLOW-014 is sending feedback. Its first step still says "top-middle" menu; it becomes the ☰ Menu, and the form opens in the shared sheet.

**What happens if you say no:** the step keeps its outdated menu position.

**Recommendation:** accept if you accepted REQ-207 and REQ-208; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -315,3 +315,3 @@
 - Main Flow:
-  1. User opens the top-middle feature-portal menu and selects **Send feedback** (an action entry, DEC-104); the app opens the feedback modal over the current screen without switching the active destination or losing in-progress state.
+  1. User opens the Menu (☰) and selects **Send feedback** (an action entry, DEC-104); the app opens the feedback form in the shared sheet over the current screen without switching the active destination (REQ-208).
   2. User picks a category (Bug / Suggestion / Other) and writes a message; the message is required.
```

- Verdict: accept
- Reason:

## FLOW-016 — Resume from Question History

**What this decides:** whether this entry's wording is updated to match REQ-213.

**In plain terms:** FLOW-016 is reopening a saved conversation. It changes from "open the drawer on this screen" to "open Question History from the Menu": one list of both kinds, a tap reopens it on a phone, and from 600px wide a reading pane with Open conversation. Each conversation reopens in its own flow.

**What happens if you say no:** the flow keeps the per-screen drawer.

**Recommendation:** accept if you accepted REQ-213; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -360,3 +360,3 @@
 - Name: Resume a saved conversation from history
-- Trigger: User opens the shared conversation workspace's history drawer and selects a saved conversation
+- Trigger: User opens **Question History** from the Menu and selects a saved conversation
 - Preconditions:
@@ -364,7 +364,7 @@
 - Main Flow:
-  1. User opens the history drawer from the shared conversation workspace.
-  2. Drawer lists saved conversations most-recent-first, each showing flow, timestamp, and a preview of the first question.
-  3. User selects an entry.
+  1. User opens **Question History** from the Menu (REQ-213).
+  2. The shared sheet lists saved conversations of both question kinds most-recent-first, each showing a fan of its cards, the question, the ruling's first line, and a meta line (kind, cards, the game context for In-depth, follow-ups, when).
+  3. User selects an entry: below `600px` the tap reopens it; from `600px` it shows in the reading pane and **Open conversation** reopens it.
   4. If the currently active conversation has at least one successful answer, it is auto-saved to history first.
-  5. The selected entry's frozen context (game context or attached card), mode, and full message thread load into the workspace, replacing the previously active conversation.
+  5. The selected entry's frozen context (game context or attached cards), mode, and full message thread load into its own flow's workspace — an Ask a Question conversation on the Ask a Question page with "Reopened from your history" under the title, an In-depth conversation in In-depth details' chat — replacing the previously active conversation of that flow.
   6. The follow-up composer enables; the user can continue asking follow-ups under the same limits and frozen-context rules as a freshly-decrypted conversation.
@@ -376,4 +376,4 @@
   - user starts a brand-new conversation instead of resuming → existing Start Over / New conversation flow applies unchanged (DEC-040/REQ-029), with auto-save of the outgoing conversation per REQ-103; subsequent mid-flight staging after Start Over becomes/overwrites the Draft slot (REQ-108 / FLOW-017)
-  - the feature-portal Menu drawer is already open when the user opens the history drawer (or vice versa) → the previously open drawer closes first, so only one left-edge drawer is ever open at a time (DEC-125)
-  - History control is unavailable / missing after Start Over → defect; History must remain always visible on In-Depth Question and Quick Question (REQ-107 / DEC-129)
+  - choosing Question History from the Menu closes the Menu tray before the sheet opens, so the two never overlap
+  - Question History missing from the Menu → defect; it must be reachable on every destination (REQ-107, REQ-213)
 - Notes:
```

- Verdict: accept
- Reason:

## FLOW-017 — Draft flow: Question History instead of the rail

**What this decides:** whether this entry's wording is updated to match REQ-213.

**In plain terms:** FLOW-017 keeps unsent work safe as a Draft when a player leaves or reloads. That behaviour stays. Its mentions of the History rail become Question History in the Menu.

**What happens if you say no:** the flow keeps pointing at the retired rail.

**Recommendation:** accept if you accepted REQ-213; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -388,3 +388,3 @@
   - user is on (or returning to) In-Depth Question or Quick Question
-  - History rail is always visible on these destinations (REQ-107)
+  - Question History is reachable from the Menu on every destination (REQ-107, REQ-213)
 - Main Flow:
@@ -393,5 +393,5 @@
   3. Returning to that destination via Menu, or reloading while that destination mounts, auto-hydrates mid-flight UI from Draft (DEC-103-style) so staged work is not lost.
-  4. User may also open History from the corner rail (including from a pre-submit step) and select **Draft** or a completed conversation (FLOW-016).
+  4. User may also open Question History from the Menu (including from a pre-submit step) and select **Draft** or a completed conversation (FLOW-016).
   5. Selecting Draft restores that destination's mid-flight staged state so the user can continue toward submit.
-  5a. Selecting a *completed* conversation from a pre-submit step snapshots the current staging to the Draft slot first, then lands on that conversation (DEC-134). The staged attempt is immediately recoverable as the **Draft** row in the same drawer; no confirmation or notice interrupts the transition (DEC-138).
+  5a. Selecting a *completed* conversation from a pre-submit step snapshots the current staging to the Draft slot first, then lands on that conversation (DEC-134). The staged attempt is immediately recoverable as the **Draft** row in Question History; no confirmation or notice interrupts the transition (DEC-138).
   6. After Start Over from an answered conversation (completed auto-save per REQ-103), new mid-flight staging becomes/overwrites that destination's Draft (still one row). Start Over itself remains answered-only (REQ-029).
@@ -401,3 +401,3 @@
   - first successful submit while a Draft exists for the attempt → Draft cleared; conversation enters completed-history path
-  - switching to Life Tracker / Trade Balancer → those destinations have no History zone; returning to In-Depth / Quick Question restores always-on History and auto-hydrates Draft if present
+  - switching to Life Tracker / Trade Balancer → Question History stays reachable from the Menu there; returning to Ask a Question or In-depth details auto-hydrates Draft if present
   - selecting a completed conversation with no meaningful staging present → no Draft written, matching Menu-leave's empty-staging behavior
```

- Verdict: accept
- Reason:

## FLOW-018 — Delete flow: from Question History, confirmed in the shared sheet

**What this decides:** whether this entry's wording is updated to match REQ-213 and REQ-208.

**In plain terms:** FLOW-018 is deleting a saved conversation. It still asks first and never deletes a Draft. It now starts from Question History, uses the row's delete control on a phone or Delete this question in the reading pane from 600px, and confirms in the shared confirm sheet.

**What happens if you say no:** the flow keeps the drawer and rail wording.

**Recommendation:** accept if you accepted REQ-213 and REQ-208; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/user-flows.md
+++ b/PRD/sections/user-flows.md
@@ -411,10 +411,10 @@
 - Name: Delete a saved conversation from history
-- Trigger: User opens the History drawer and chooses to delete a completed conversation entry
+- Trigger: User opens Question History and chooses to delete a completed conversation entry
 - Preconditions:
   - at least one completed conversation exists in browser-local history (REQ-103)
-  - user is on In-Depth Question or Quick Question (History rail available)
-- Main Flow:
-  1. User opens Conversation history from the corner rail.
-  2. User activates delete on a completed entry (not Draft).
-  3. App presents an explicit confirmation step naming that the entry will be removed.
+  - Question History is open from the Menu (REQ-213)
+- Main Flow:
+  1. User opens Question History from the Menu.
+  2. User activates delete on a completed entry (not Draft) — the row's delete control below `600px`, or **Delete this question** in the reading pane from `600px`.
+  3. App asks first in the shared confirm sheet, naming the entry that will be removed (REQ-208).
   4. User confirms; app removes the entry from local storage and from the list.
@@ -423,4 +423,4 @@
 - Edge Cases:
-  - user cancels confirmation → entry remains; drawer stays open
-  - last completed entry deleted → drawer shows empty/zero-state (and Draft row if present)
+  - user cancels confirmation → entry remains; Question History stays open
+  - last completed entry deleted → Question History shows its empty state (and Draft rows if present)
   - storage write fails → app does not crash; user can retry; existing guarded persistence pattern applies
```

- Verdict: accept
- Reason:

## REQ-045 — The enrichment view-mode toggle is retired

**What this decides:** whether this entry's wording is updated to match REQ-017 (the compact context sheet).

**In plain terms:** REQ-045 keeps the "View all cards / Card-by-card" toggle in its own row on the context step. REQ-017 retires View all cards for the review list, so the toggle has nothing to switch; this adds a note saying so.

**What happens if you say no:** the entry keeps protecting a toggle that no longer exists.

**Recommendation:** accept if you accepted REQ-017 (the compact context sheet); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -926,2 +926,3 @@
   - amended by DEC-122: the step name moves out of the header row entirely into an eyebrow label above each step's own content heading; this requirement's step-name values, ordering, and per-step coverage stay valid, only the position clause is superseded
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the View all cards / Card-by-card toggle is retired with View all cards (REQ-017 as amended); the Context station shows one sheet per card and the review list replaces the list mode
 
```

- Verdict: accept
- Reason:

## REQ-056 — The View all cards row cap is retired

**What this decides:** whether this entry's wording is updated to match REQ-017 (the compact context sheet).

**In plain terms:** REQ-056 capped View all cards at four edit rows per zone. With that mode retired, the review list's own bound (about a third of the screen, then scroll) takes its place.

**What happens if you say no:** the entry keeps a cap for a mode that no longer exists.

**Recommendation:** accept if you accepted REQ-017 (the compact context sheet); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -1205,2 +1205,3 @@
   - amended for the `ui-reimagining` pass (2026-09-24): the Easter egg's trigger widens from the game-context step to every in-scope screen under one session-wide tap count (REQ-203). The session-only scope, the asset, and the hidden-on-initial-render behaviour are unchanged, and the egg is protected scope through the redesign.
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the View all cards 4-row criterion has no subject once REQ-017 retires that mode; the review list's bound (REQ-209) replaces it
 
```

- Verdict: accept
- Reason:

## REQ-058 — Card rings on the context sheet instead of two enrichment modes

**What this decides:** whether this entry's wording is updated to match REQ-017 (the compact context sheet).

**In plain terms:** REQ-058 keeps every card's colour ring and shared image on the context step, naming both of its old modes. The ring rule stays; the note points it at the one context sheet and the review.

**What happens if you say no:** the entry keeps naming the retired View all cards mode.

**Recommendation:** accept if you accepted REQ-017 (the compact context sheet); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -1282,2 +1282,3 @@
   - `CardSelectionPreview` participates in DEC-151 corner detail + compact image rules; identity-ring calibration remains shared
+  - amended for the `ui-reimagining-build` pass (2026-09-30): the enrichment modes become the one context sheet and the review (REQ-017, REQ-209); the shared presentation and identity ring apply there unchanged
 
```

- Verdict: accept
- Reason:

## REQ-116 — Top clearance no longer checks a History icon

**What this decides:** whether this entry's wording is updated to match REQ-213 (Question History).

**In plain terms:** REQ-116 keeps the answered view's View Context button close under the header without touching the History icon. With the icon gone, the check applies to the ☰ button.

**What happens if you say no:** the entry keeps testing a History icon that no longer exists.

**Recommendation:** accept if you accepted REQ-213 (Question History); reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -2824,3 +2824,3 @@
   - computed top clearance for `.adaptive-context-trigger` (or equivalent) is sized to the current side-by-side rail height, not the pre–DEC-137 stacked-rail clamp
-  - History icon/hit-target still does not overlap, clip into, or sit on the border of View Context (REQ-107)
+  - the ☰ Menu button's hit-target does not overlap, clip into, or sit on the border of View Context (REQ-107 as amended)
   - short-thread fill / Start Over reachability from REQ-109 remain satisfied
```

- Verdict: accept
- Reason:

## REQ-136 — View Context clearance is measured against the ☰ header

**What this decides:** whether this entry's wording is updated to match REQ-207 and REQ-213.

**In plain terms:** REQ-136 checks View Context never sits under the rail's tap area, measured with both Menu and History rail zones present. With the banner header, the same check is made against the ☰ button.

**What happens if you say no:** the entry keeps measuring rail zones that no longer exist.

**Recommendation:** accept if you accepted REQ-207 and REQ-213; reject if you rejected it.

Proposed `PRD/sections/` diff (amended in place):

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -3280,3 +3280,3 @@
   - the feature-portal corner rail occupies in-flow layout space rather than reserving it through `.adaptive-context-trigger`'s `margin-top: calc(2.75rem - var(--layout-panel-padding))`; that compensating margin is deleted, not merely reduced
-  - the View Context trigger never overlaps or sits beneath the rail's interactive area at 390×844 or 1440×900, verified live with both a Menu and a History rail zone present
+  - the View Context trigger never overlaps or sits beneath the ☰ Menu button's interactive area at 390×844 or 1440×900, verified live (REQ-207)
   - measured vertical distance between the destination heading and the View Context trigger shrinks at both viewport bands (baseline: 32px of applied compensating margin, against a rail whose measured in-flow height is 0px)
```

- Verdict: accept
- Reason:

## Blocker questions

None. Every open matter was settled by the conservative assumption ladder (see `DESIGN-BRIEF.md` → Assumptions) or is posed as a block above.
