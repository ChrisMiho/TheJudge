# Measurements — Ask box pre-filled text and shrunk In-depth button

**Nothing (FYI).** This is the evidence record behind `DESIGN-BRIEF.md`.

Sections 1–4 measured 2026-10-14 (UTC 2026-10-15 03:49–03:58); section 5 (the
clear-then-reload report) measured 04:07–04:12. Playwright (Chromium), two
builds:

- **Dev:** this worktree at `4b6817f5` (code identical to `origin/main`
  `97c8ea8a`; the branch adds only docs), served by Vite on port 5391, first
  frontend-only, then with the mock backend on port 3391 (`npm run dev:mock`)
  for the paths that need an answer.
- **Live:** `https://mtgjudge.gg`, bundle `assets/index-CGZiOZPC.js`.

Widths: desktop 1440x900, phone 390x844. "Clean" means `localStorage` and
`sessionStorage` cleared, then a reload. Screenshots are in
`PRD/work/ask-box-prefilled-text/.playwright-mcp/` (git-ignored, local only).

## What each column means

- **value** — the text actually inside the Ask box (the `textarea` value).
- **hint** — the faint hint text (the `placeholder` attribute).
- **focus** — whether the Ask box has keyboard focus.
- **data-fill** — `0` when the box is empty, `some` when it holds text. The
  In-depth label hides whenever this is not `0`.
- **label** — whether the word "In-depth" shows beside the ◈ glyph
  (`block` = shown, `none` = hidden), with the button's width.

Colours were the same in every row: typed text `rgb(226, 232, 240)` (#e2e8f0),
hint `rgb(161, 161, 170)` at 80% opacity (#a1a1aa, the one `--text-muted`
token in `apps/frontend/src/styles/tokens.css:134`; every theme shares it). So
the hint is clearly dimmer than typed text in every theme.

## 1. Clean first visit and reload — does not reproduce

| Build | Width | Load | value | hint | focus | data-fill | label |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dev | 1440 | clean | `""` | What would you like to know? | no (body) | 0 | shown, 96px |
| dev | 1440 | reload | `""` | What would you like to know? | no | 0 | shown, 96px |
| dev | 390 | clean | `""` | Your question… | no | 0 | hidden, 35px |
| dev | 390 | reload | `""` | Your question… | no | 0 | hidden, 35px |
| live | 1440 | clean | `""` | What would you like to know? | no | 0 | shown, 96px |
| live | 1440 | reload | `""` | What would you like to know? | no | 0 | shown, 96px |
| live | 390 | clean | `""` | Your question… | no | 0 | hidden, 35px |
| live | 390 | reload | `""` | Your question… | no | 0 | hidden, 35px |

On a clean load the box is empty, shows only the faint hint, is not focused,
and on desktop the In-depth button shows its full label. Screenshots:
`dev-desktop-clean.png`, `dev-phone-clean.png`, `live-desktop-clean.png`,
`live-phone-clean.png`.

The phone's ◈-only button at rest is not part of this bug. REQ-206 says the
label hides on every screen narrower than 480px, whatever the box holds (its
"`<480px` always-icon-only rule"), via `flow.css` line 281.

Live and dev measured identically on every row in this file, so the deployed
bundle and `origin/main` behave the same here. No version comparison was needed.

## 2. Player paths — what produces it

| # | Path | Build / width | value | data-fill | label | Reproduces? |
| --- | --- | --- | --- | --- | --- | --- |
| A | Type `test`, select all, delete, click away (no reload) | dev 1440 | `""` | 0 | shown | no |
| A | same, still focused | dev 1440 | `""` | 0 | hidden (focus) | no — by design while focused |

Row A stops before a reload. Section 5 below shows that once a Draft exists,
clearing the box and then reloading **does** bring the old question back.
| B | Type `How does ward work?`, tap In-depth, tap Back | dev 1440 | `How does ward work?` | some | hidden, 35px | **yes** |
| B | then reload | dev 1440 | `How does ward work?` | some | hidden | **yes** |
| B | same path | live 1440 | `How does ward work?` | some | hidden, 35px | **yes** |
| B | then reload | live 1440 | `How does ward work?` | some | hidden | **yes** |
| B | same path | live 390 | `How does ward work?` | some | hidden, 35px | **yes** |
| B | then reload | live 390 | `How does ward work?` | some | hidden | **yes** |
| C | Type the question, tap In-depth, walk Game → Zones → Cards (add Sol Ring) → Context → Finish, send in In-depth, get the answer, Menu → Ask a Question | dev 1440 (mock backend) | `How does ward work?` | some | hidden | **yes** |
| C | then reload | dev 1440 | `How does ward work?` | some | hidden | **yes** |

In every "yes" row the box is not focused and the text is real text in typed
text colour, not the hint. Screenshots: `dev-desktop-back-from-indepth.png`,
`dev-desktop-reload-with-draft.png`, `live-desktop-reload-with-draft.png`,
`live-phone-reload-with-draft.png`, `dev-desktop-ask-after-indepth-answer.png`.

The text survives because it is saved as Ask a Question's **Draft** — the
browser-local copy of an unsent question that REQ-108 restores on every return
and reload. Stored value after path C, key
`thejudge.conversationDraft.lookup`:

```json
{"mode":"lookup","selectedCards":[],"question":"How does ward work?","updatedAt":"2026-10-15T03:57:00.858Z"}
```

Question History showed it as a Draft row above the In-depth answer
(`dev-desktop-history-draft-row.png`):

```text
Resume where you left off
DRAFT  Ask a Question  just now
Explain the interaction with the provided game state  MOCK RESPONSE  IN-DEPTH  1 card ...
```

### Path C detail: the carried question never reached In-depth

When the In-depth question box opened (Context → Finish), it was **empty**
(hint `How does this resolve?`, `data-fill="0"`) even though the player had
typed `How does ward work?` before tapping In-depth
(`dev-desktop-indepth-composer-carried.png`). The answer that came back was
for the silent In-depth fallback question, "Explain the interaction with the
provided game state". So the question was neither delivered to In-depth nor
removed from Ask a Question.

Code cause, `apps/frontend/src/components/portal/MtgAssistantApp.tsx` ~236:

```ts
const carry = consumeLookupCarry();
if (!carry || carry.cards.length === 0) {
  return;
}
```

A carry with no card attached is dropped whole, question included. REQ-206
says the pill carries "every attached card and the typed question".

### What clears the Ask a Question Draft today

Only two things (`QuickLookupApp.tsx`): Ask a Question's own first successful
answer (line ~153), or a snapshot taken while the box and stage are both empty
(`snapshotMidFlightDraft`, line ~214, which removes the Draft at line ~222).
That snapshot runs only on Menu-leave (line ~229), on opening a saved
conversation from Question History (line ~183), and on attaching or removing a
card (line ~247). Typing in the box or emptying it runs none of them, and there
is no page-hide or before-unload save anywhere in the frontend. An answer in
In-depth clears only In-depth's own Draft (`MtgAssistantApp.tsx` ~359). So a
carried question stays in Ask a Question until the player sends it from there,
or empties the box and then leaves by the Menu.

## 3. Where the owner's text could come from

On desktop the In-depth label hides only when the box is focused or holds text
(`flow.css` 284-289). Nothing focuses the box on load (no `autoFocus`, no
`.focus()` on the question box). So a desktop report of the shrunk button
means the box held real text.

The only things that put text in the Ask box are the player (typing or
dictation) and a restore: the Draft auto-restore on load (`QuickLookupApp.tsx`
~165), opening the Draft from History (~197), or **✎ Edit cards** after an
answer. The owner's own browsers were not inspected; Question History on the
owner's device will show an **Ask a Question · Draft** row if this is the
cause.

## 4. Other finding (out of scope): In-depth Context step spacing

Raised by the owner while watching this session. Recorded as evidence only.

**Steps:** open In-depth details (`/in-depth`) with clean storage → Continue
(Game) → Continue (Zones, default Battlefield + Hand) → Add a card to
Battlefield → search `Sol Ring` → pick it → Add card → Continue → the Context
station (adding context to a card) → tap **＋ Add a note**.

Screenshots: `dev-desktop-enrichment-step.png`,
`dev-desktop-enrichment-note-open.png`, `dev-phone-enrichment-step.png`,
`dev-phone-enrichment-note-open.png`, `live-desktop-enrichment-note-open.png`,
`live-phone-enrichment-note-open.png`.

| Element | Measurement (dev and live identical, 1440 and 390) | What a player sees |
| --- | --- | --- |
| Card counter pill `.counter` (`EnrichmentStep.tsx:333`, CSS `apps/frontend/src/index.css:1783`) | box 30px tall (`min-height: 30px`, `align-items: baseline`); its `1 / 1` text sits 1px from the top and 14px from the bottom | "1 / 1 cards" hugs the pill's top edge instead of sitting centred |
| Note field (textarea, `EnrichmentStep.tsx` ~515, `rows={2}`) | `clientHeight` 54px vs `scrollHeight` 108px; `min-height` 42px, `max-height` 96px; letter-spacing 1.088px | the hint's third line is cut through the middle of the letters |
| `.ctx-head` at 390 | `scrollWidth` 223 vs `clientWidth` 219 (4px) | no visible effect measured |
| Page | `scrollWidth` = `clientWidth` at both widths | no sideways scroll |

This session's screenshots do not show a badly broken layout. The two
defects above are the visible spacing faults at both widths, on dev and live.
The owner may have seen a moment this session did not capture (for example,
mid-transition between stations).

## 5. Clear (or replace) the question, then reload — the owner's second report

The owner reported from the live site: type a question, clear it, refresh, and
the old message comes back. Measured 2026-10-14 (UTC 2026-10-15 04:07–04:12)
with Playwright (Chromium), each path from clean storage:

- **Dev:** this worktree at `23563364` (code identical to `origin/main`
  `97c8ea8a`; the branch adds only docs), Vite frontend-only on port 5391.
- **Live:** `https://mtgjudge.gg`, bundle `assets/index-CGZiOZPC.js`.
- Widths: desktop 1440x900, phone 390x844.

**All four runs (dev 1440, dev 390, live 1440, live 390) gave identical values
in every row below.** So the table is written once.

Columns: **value** is the Ask box's textarea value; **cards** is the cards on
the stage; **Draft** is the stored `thejudge.conversationDraft.lookup` entry
(its `question` and card names), or *absent*. Typed text in every path:
`How does ward work?`.

| # | Path | Moment | value | cards | Draft |
| --- | --- | --- | --- | --- | --- |
| P1 | Type, Menu → Life Tracker → Menu → Ask a Question (a Menu-leave saves the Draft), clear the box (select all, delete, click away), reload | after return | `How does ward work?` | none | `How does ward work?`, no cards |
| P1 | | box cleared, before reload | `""` (`data-fill="0"`) | none | `How does ward work?`, no cards (**stale**) |
| P1 | | after reload | `How does ward work?` (`data-fill="some"`) | none | `How does ward work?`, no cards |
| P2 | Type, attach Sol Ring (attaching saves the Draft), remove Sol Ring, clear the box, reload | card attached | `How does ward work?` | Sol Ring | `How does ward work?`, Sol Ring |
| P2 | | card removed | `How does ward work?` | none | `How does ward work?`, no cards |
| P2 | | box cleared, before reload | `""` | none | `How does ward work?`, no cards (**stale**) |
| P2 | | after reload | `How does ward work?` | none | `How does ward work?`, no cards |
| P2b | Type, attach Sol Ring, clear the box (card stays), reload | box cleared, before reload | `""` | Sol Ring | `How does ward work?`, Sol Ring (**stale**) |
| P2b | | after reload | `How does ward work?` | Sol Ring | `How does ward work?`, Sol Ring |
| P3 | Type, clear, reload, no Draft ever saved | typed | `How does ward work?` | none | absent |
| P3 | | box cleared, before reload | `""` | none | absent |
| P3 | | after reload | `""` (`data-fill="0"`) | none | absent |
| P4 | Type, reload without clearing, no Draft ever saved | before reload | `How does ward work?` | none | absent |
| P4 | | after reload | `""` | none | absent (**typed question lost**) |
| P5 | Type, Menu-leave and return (Draft saved), select all and type `What does hexproof stop?`, click away, reload | before reload | `What does hexproof stop?` | none | `How does ward work?`, no cards (**stale**) |
| P5 | | after reload | `How does ward work?` | none | `How does ward work?`, no cards |

What this shows, in player terms:

- **P1, P2, P2b reproduce the owner's report.** Once anything has saved a
  Draft (a Menu-leave, or attaching or removing a card), emptying the box does
  not touch the saved copy. A reload restores the old question, real text in
  typed-text colour, with the In-depth button folded to ◈.
- **P3 does not reproduce.** Type, clear, reload with no Draft ever saved comes
  back empty. The owner's path therefore had a Draft behind it, from any of the
  saves above or from an In-depth tap (section 2, path B).
- **P5 is the same fault without clearing.** Replacing the question and
  reloading brings back the older question, not the new one.
- **P4 is the mirror image.** A question typed and reloaded without any Menu
  trip or card is lost, although REQ-108 lists reload as an exit the Draft
  covers ("Draft is written/updated as mid-flight staging changes enough to
  resume meaningfully after Menu leave, reload, or opening a saved
  conversation").

Code cause: the Draft is a snapshot taken only at Menu-leave, opening a saved
conversation, and a card change (section 2, "What clears the Ask a Question
Draft today"). Nothing writes or removes it when the question text changes, and
nothing snapshots at page hide.

Screenshots (after reload): `dev-desktop-p1-clear-reload.png`,
`dev-phone-p1-clear-reload.png`, `live-desktop-p1-clear-reload.png`,
`live-phone-p1-clear-reload.png`, the matching `-p2-card-clear-reload.png` and
`-p5-replace-reload.png` for each build and width.

### 5a. In-depth details has the same gap: a reload mid-walk loses the walk

Dev 1440 only. Type `How does ward work?`, attach Sol Ring, tap In-depth.

| Moment | URL | In-depth screen | `…conversationDraft.game` | `…conversationDraft.lookup` |
| --- | --- | --- | --- | --- |
| after tapping In-depth | `/in-depth` | Game context | absent | `How does ward work?`, 1 card |
| after reload | `/in-depth` | Game context, nothing carried | absent | `How does ward work?`, 1 card |

In-depth's own Draft (key `thejudge.conversationDraft.game`) uses the same
snapshot points as Ask a Question (`MtgAssistantApp.tsx` ~372, called only at
Menu-leave ~413 and on opening a saved conversation ~795). So a reload during
the walk drops the carried card and question from In-depth; only Ask a
Question's copy survives. REQ-206 already promises "every carried card ... is
written into the Draft slot, so the whole request survives a reload", and
`in-depth/README.md` says "a reload mid-placement resumes exactly where it left
off". Screenshot: `dev-desktop-indepth-midwalk-reload.png`.

In-depth's question box (the Finish station) was not walked to for a
clear-then-reload test. By the same code, once a Menu-leave has saved
In-depth's Draft, a question cleared there would come back on reload. That is
inferred from code, not measured.
