# Measurements — Ask box pre-filled text and shrunk In-depth button

**Nothing (FYI).** This is the evidence record behind `DESIGN-BRIEF.md`.

Measured 2026-10-14 (UTC 2026-10-15 03:49–03:58) with Playwright (Chromium) in
two builds:

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
| A | Type `test`, select all, delete, click away | dev 1440 | `""` | 0 | shown | no |
| A | same, still focused | dev 1440 | `""` | 0 | hidden (focus) | no — by design while focused |
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
answer (line ~153), or a Menu-leave or card change while the box and stage are
both empty (`snapshotMidFlightDraft`, line ~222). An answer in In-depth clears
only In-depth's own Draft (`MtgAssistantApp.tsx` ~359). So a carried question
stays in Ask a Question until the player sends it from there or deletes it by
hand.

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
