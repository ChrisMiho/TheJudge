# Gameplan — ui-reimagining-build

Mapped by node 5 (`plan`) of graph run `graph-20260930-055958`, orchestrated
(`graph is controlling`). Quality-check PASS recorded in `README.md` (attempt
3) was verified there, not re-certified here.

## What a player gets, slice by slice

A player picks a mana colour and the whole app — header, menu, every sheet —
becomes that colour's place (A). Every pop-up (card detail, history,
printings, feedback, confirm) opens from one shared shell (B). Quick Question
and In-Depth Question become one **Ask a Question** door with a pill composer
(C), whose cards carry into a four-station **In-depth details** flow: first
the stations/shelf/card menu (D), then the per-card context sheet and review
(E), with the judge's answer inking itself into place while the player waits
(F). Trade Balancer weighs two piles of gold with a verdict line (G). The
card scanner holds scanned cards in its own list until the player closes it
(H). Question History becomes one list for both kinds of question (I). Life
Tracker's back menus take the same look; its table stays pixel-untouched (J).
Last, two owner-approved extras — speaking a question and marking Copies on a
Stack card — land once everything they build on already exists (K).

## Build order and dependencies

| Slice | Title | Design-brief step | Depends on |
| --- | --- | --- | --- |
| A | Frame: tokens, ambient scene, banner header, Menu tray, Theme band, font | 1 | — |
| B | Shared sheet shell + confirm sheet | 2 | A |
| C | Ask a Question: door, stage, pill composer, ruling view, carry hand-off | 3 | A, B |
| D | In-depth details: stations rail, Cards shelf, card menu, placement, Stack reorder | 4a | A, B, C |
| E | In-depth details: context sheet, Targets, Mana spent, review | 4b | D |
| F | Wait inscription | 5 | C, E |
| G | Trade Balancer: piles, verdict, New trade, rename, picker pills | 6 | A, B |
| H | Card scan chrome, with a holding list | 7 | A, B, D, G |
| I | Question History: one list, reopened live | 8 | A, B, C, D |
| J | Life Tracker's sheets take the look | 9 | A, B |
| K | Late slices: dictation, Copies on a Stack card | 10 | C, E |

Slices run sequentially in this order in `build`, one agent, 1200-tool-call
budget for the whole node. D/E are the two-part split of design-brief step 4
(In-depth details) — the page is large enough (stations + shelf + card menu +
placement on one side, context sheet + Targets + review on the other) that one
slice would carry 15 acceptance ids against a sprawling file list; splitting
keeps each half to one primary objective.

## GATE-QUESTIONS.md id → slice assignment (57 of 57)

Every id below is a `## <STABLE-ID>` block in `GATE-QUESTIONS.md`. Verdict is
`accept` unless marked `edit`. Assignment is "the slice whose code realises
it" — each id appears exactly once.

| Slice | Id | Verdict | Title |
| --- | --- | --- | --- |
| A | REQ-207 | accept | The new frame: banner header, Menu, Theme band, and the colour's scene |
| A | REQ-099 | accept | A custom Colorless colour is kept readable |
| A | REQ-113 | accept | The Menu tray floats as a card on desktop |
| A | REQ-114 | accept | The ☰ button's tap area matches what it paints |
| A | REQ-115 | accept | Menu-over-History occlusion has nothing left to cover |
| A | REQ-127 | accept | The open Menu hides the ☰ button and closes three ways |
| A | REQ-131 | accept | Theme orbs become the six-cell Theme band |
| A | REQ-067 | accept | The feature portal lists the one question door |
| A | REQ-200 | accept | Colour rules: the custom Colorless exemption becomes the readability lift |
| A | REQ-116 | accept | Top clearance no longer checks a History icon |
| A | FLOW-007 | accept | Theme flow: a six-cell band, custom Colorless kept readable |
| A | FLOW-010 | accept | Switching destinations: the ☰ Menu and one question door |
| B | REQ-208 | accept | One pop-up shape for card detail, history, printings, feedback and "are you sure?" |
| B | REQ-087 | accept | Send feedback: type as three pills, snapshot folded |
| B | REQ-128 | accept | The card detail opens in the centre on desktop |
| B | FLOW-014 | accept | Send feedback flow: the ☰ Menu and the shared sheet |
| C | REQ-167 | accept | Ask a Question holds up to 10 cards, not 5 |
| C | REQ-025 | accept | Your own question opens the conversation |
| C | REQ-206 | edit | Ask a Question: one door for every question |
| C | REQ-029 | accept | Start over lands on a clean Ask a Question page |
| C | REQ-075 | accept | Ask a Question's ruling view: your question first, cards in a strip |
| C | REQ-132 | accept | No separate Send Request button: send from inside the box |
| C | REQ-012 | accept | The submit action is the send pill |
| C | REQ-121 | accept | The composer row's send control has no text label |
| C | FLOW-005 | accept | Follow-up flow: the first question is shown |
| C | FLOW-011 | accept | Ask a Question flow |
| D | REQ-209 | accept | In-depth details: four stations, the Cards shelf and the card menu |
| D | REQ-005 | accept | Players can reorder the Stack |
| D | REQ-006 | accept | Stack order stays bottom-to-top when players reorder |
| D | REQ-007 | accept | The Stack's count lives on its zone tab |
| D | REQ-008 | accept | Stack details live on the shelf and the card menu |
| D | REQ-018 | accept | Card collection keeps bottom-to-top order and places carried cards |
| D | REQ-056 | accept | The View all cards row cap is retired |
| D | FLOW-001 | accept | In-depth flow steps use the four stations |
| E | REQ-017 | accept | The per-card context form becomes one compact sheet |
| E | REQ-021 | accept | One Targets list that sends exactly what today's form sends |
| E | REQ-100 | accept | One "More details for all players" toggle |
| E | REQ-045 | accept | The enrichment view-mode toggle is retired |
| E | REQ-058 | accept | Card rings on the context sheet instead of two enrichment modes |
| E | REQ-210 | edit | Mana spent can be set on any zone's card (every zone) |
| E | REQ-136 | accept | View Context clearance is measured against the ☰ header |
| F | REQ-023 | accept | The wait inks itself in, inside the judge's bubble |
| F | NFR-006 | accept | Motion rule: the new wait and the colour scene stay CSS-only |
| G | REQ-215 | accept | Trade Balancer: piles of gold, a verdict line, New trade, named sides |
| G | REQ-064 | accept | Trade Balancer's difference gets a verdict and New trade |
| G | REQ-065 | accept | The printing picker gets a price pill per finish |
| G | FLOW-009 | accept | Trade flow: piles and verdict update live |
| H | REQ-214 | edit | The card scanner in the new frame, with a holding list |
| I | REQ-213 | accept | Question History: one list for every question, reopened live |
| I | REQ-103 | accept | History: one list in the shared sheet, opened from the Menu |
| I | REQ-107 | accept | History is always one tap away in the Menu |
| I | FLOW-016 | accept | Resume from Question History |
| I | FLOW-017 | accept | Draft flow: Question History instead of the rail |
| I | FLOW-018 | accept | Delete flow: from Question History, confirmed in the shared sheet |
| J | REQ-202 | accept | Life Tracker's back menus take the new look; the table stays untouched |
| K | REQ-212 | accept | Speak a question into the box |
| K | REQ-211 | accept | Copies on a Stack card |

Count check: A 12, B 4, C 10, D 8, E 7, F 2, G 4, H 1, I 6, J 1, K 2 = 57.
Every id above is unique across the table — none applied twice, none
unassigned.

## Deliverable locations

- **Reviewable screenshot pairs** (the REQ-202 Life Tracker before/after pair,
  and each slice's mockup-paired screenshot) go under
  `docs/design/ui-reimagining/build-screenshots/<slice-letter>/` — the same
  tree the mockup run's pairs live in, reviewable after this package closes.
- **Disposable captures** (anything else a slice's Playwright pass produces —
  scratch views, failed-attempt shots) go under
  `PRD/work/ui-reimagining-build/.playwright-mcp/` inside this worktree
  (create it if absent). This folder is deleted with the package at close.
- Every slice doc below names which of its captures is which.

## Verification checklist (whole package)

- `npm run quality:check` green at the end of every slice.
- `npm --workspace apps/frontend run test` green; new/updated specs named per
  slice below.
- Byte-identical golden prompts for every untouched form (A9 in
  `DESIGN-BRIEF.md`): asserted in slice E (Mana spent) and slice D (Stack
  order) tests, since those are the two prompt-adjacent changes besides
  REQ-167's cap (slice C) and REQ-211's copies field (slice K).
- The REQ-202 Life Tracker 390×844 / 1440×900 before/after pair on every
  slice that touches shared chrome, the token set, or the shared stylesheet —
  named per slice below.
- Mock mode works on every screen touched by a slice (manual, Playwright).
- `PRD/sections/` carries every accepted/edited id's intent by the end of the
  slice that owns it (never written by this `plan` node).

## Architecture notes

- One component tree, structural media queries only at the existing 640/768px
  boundaries plus the new 600px boundary (sheet family only) — DEC-117 /
  NFR-011, carried from `DESIGN-BRIEF.md`.
- The ambient scene, wait inscription and Theme band are CSS-only motion
  (`transform`/`opacity`), honouring `prefers-reduced-motion` — NFR-006.
- No new runtime dependency: drag reorder (slice D) uses pointer events
  (`A20`), the shared sheet (slice B) is new React composition, not a modal
  library.
- Carry hand-off (slice C → D) extends the existing
  `apps/frontend/src/lib/portal/seedContext.tsx` cross-destination pattern
  (`A4`), not a new store.
- Every slice applies its assigned `GATE-QUESTIONS.md` ids to `PRD/sections/`
  by intent, together with its code, per
  `PRD/instructions/graph-workflow-contract.md` `## Propose / apply / close` —
  re-derived against current truth, not a blind patch replay.

## Look-matching pass

Mapped by node 5 (`plan`), attempt 3, graph run `graph-20260930-055958`
(orchestrated, `graph is controlling`), appended after slices A–K shipped
(PR #239, held `IN PROGRESS`). Slices A–K and their criteria files are
untouched by this append.

**Why.** The owner compared the running build against the approved
direction-1 mockup and found the screens look nothing alike: no slice named
its mockup page as a visual source, and none saved a mockup-paired capture.
`PRD/work/ui-reimagining-build/LOOK-GAPS.md` records every gap, screen by
screen, with the mockup's exact CSS file and line to reuse, plus 92
look-gap capture pairs already saved under
`docs/design/ui-reimagining/build-screenshots/look-gaps/`.

**What a player gets, screen by screen.** The frame, Menu, Theme band and
every shared sheet take the mockup's glass and glow (L) — every other
screen sits inside that frame. Ask a Question collapses to a stage, a pill
composer and a sealed ruling view (M). In-depth details becomes one lit
plate per step with its own "Continue ›" foot, instead of several bordered
panels (N). Trade Balancer fits one screen with a single scale band instead
of a 2,900px scroll (O). The card scanner keeps its header and gets a real
lock-on guide and round shutter (P). Life Tracker's menus get the mockup's
stepper and seat-tile shapes, with the table re-confirmed untouched (Q).

**The rule that resolves every mockup/requirement conflict.** Where the
mockup's look disagrees with an already-accepted requirement, the
requirement wins on behaviour; the look pass copies the mockup's styling to
whatever the requirement already decided. Five such conflicts are carried
into the relevant slice as an "Owner questions — the build follows the
accepted requirement until answered" block, quoted verbatim from
`LOOK-GAPS.md`, and never resolved by this plan or by the slices that build
on it.

### The six slices, in the owner's order

| Slice | Title | Mockup page | Depends on |
| --- | --- | --- | --- |
| L | Frame: tokens, Menu, Theme band, shared sheets take the look | `shared-chrome-menu.html` + `shell.css`, `tokens.css`, `flow.css`, `ambience.css` | A, B |
| M | Ask a Question takes the look | `quick-question.html` | L, C |
| N | In-depth details takes the look | `in-depth-question.html` | L, D, E |
| O | Trade Balancer takes the look | `trade-balancer.html` | L, G |
| P | Card scanner takes the look | `card-scan.html` | L, H |
| Q | Life Tracker menus take the look | `life-tracker-menus.html` | L, J |

L is first: it restyles the shared chrome (header, Menu, Theme band,
ambient scene, shared sheet shell, card detail) that every other
look-matching slice sits inside. M, N, O, P and Q each restyle one screen
built by an earlier slice (C/D+E/G/H/J respectively) and otherwise have no
dependency on one another — they could build in any order once L lands, but
run in the owner's listed order (L → M → N → O → P → Q) for one agent,
sequential, matching A–K's build pattern.

No slice in this pass raises a new `GATE-QUESTIONS.md` id. Each closes one
`LOOK-GAPS.md` section and lists the exact mockup selectors, tokens and
values it ports (file and line, no approximations). Q is the last slice: it
carries the Ship gates block for L–Q and this pass's own PRD promotion
checklist (no new ids; nothing to apply to `PRD/sections/`) — unlike K's
checklist, which still covers the whole package's product truth.

### Extended build order and dependencies

A → B → C → D → E → F → G → H → I → J → K → **L → M → N → O → P → Q**, one
agent, sequential, continuing the same 1200-tool-call build-node budget.

### Extended verification checklist (whole package)

- `npm run quality:check` green at the end of every slice, L through Q
  included.
- `npm --workspace apps/frontend run test` green on every look-matching
  slice; no slice in this pass touches `apps/backend`.
- No new `AskAiRequest`/prompt/backend-route/card-data/data-pipeline
  change in this pass — it is look-only. The three named changes in
  `DESIGN-BRIEF.md` `## What it changes` (REQ-167, REQ-210, REQ-211) stay
  slices C/E/K's, not this pass's.
- The REQ-202 Life Tracker 390×844 / 1440×900 before/after pair on slice L
  (it touches shared chrome, the token set and the shared stylesheet); slice
  Q additionally re-captures the Life Tracker table itself to confirm L
  through P left it untouched, though Q does not itself touch shared
  chrome/tokens/stylesheet and so does not carry a second mandatory
  REQ-202 pair.
- Every look-matching slice's side-by-side build/mockup capture pairs,
  saved under `docs/design/ui-reimagining/build-screenshots/<letter>/`
  (`l` through `q`), one pair per state named in the corresponding
  `LOOK-GAPS.md` section's pairs list — the slice doc names the exact file
  paths.
- Mock mode works on every screen touched by a slice (manual, Playwright),
  using the exact `VITE_ASK_AI_PROVIDER=mock ... node scripts/dev.mjs`
  launch form slice L names (`scripts/dev.mjs` never sets that variable on
  its own).
- Every carried-forward owner question (slices M, N, O, P, Q) stays open at
  the end of this pass — named in the receipt, not answered by any slice.

## Next step

`$thejudge-implement-all PRD/work/ui-reimagining-build/` — first slice `A`
(A–K are already `done`; the next slice this resumes at is `L`).
