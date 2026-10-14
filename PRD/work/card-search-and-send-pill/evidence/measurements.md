# Measurements — card-search-and-send-pill (define, 2026-10-13)

**What happened:** refinement re-measured both problems on this branch (`cbecdc4e`,
code identical to main `181b829f`). Both reproduce. **What it means for you:**
nothing to do here; the brief and the gate questions cite these numbers.

## 1. Card search — the real functions against the real card list

Method: `tsx` (from the main checkout's `node_modules`) imported this worktree's
`apps/frontend/src/lib/search.ts` and `apps/frontend/src/components/trade/oracleSearch.ts`
unchanged and ran them over `apps/frontend/public/data/cardMetadata.json` (34,639
cards). "min3" is `getSuggestions(cards, q)` (In-depth details' Cards step);
"min1" is the same with threshold 1 (Ask a Question's Add card, REQ-167);
"trade" is `searchOracleIndex(buildOracleSearchIndex(cards), q)` (a Trade Balancer
side, list of 8).

| Typed | Ask a Question / In-depth (list of 3) today | Trade Balancer (list of 8) today |
| --- | --- | --- |
| `urborg` | Urborg, Urborg Elf, Urborg Drake | Urborg, Urborg Drake, Urborg Elf, Urborg Emissary, Urborg Justice, Urborg Lhurgoyf, Urborg Mindsucker, Urborg Panther |
| `urborg tomb` | (none) | (none) |
| `urborg tomb of` | (none) | (none) |
| `urborg tomb of yawgmoth` | Urborg, Tomb of Yawgmoth | Urborg, Tomb of Yawgmoth |
| `urborg, tomb` | Urborg, Tomb of Yawgmoth | Urborg, Tomb of Yawgmoth |
| `tomb of yawg` | Urborg, Tomb of Yawgmoth | Urborg, Tomb of Yawgmoth |
| `yawgmoth` | Yawgmoth Demon, Yawgmoth's Will, Yawgmoth's Edict | 8 Yawgmoth names |
| `yawgmoths will` | Yawgmoth's Will | Yawgmoth's Will |
| `jace the mind` | (none) | (none) |
| `jace the mind sculptor` | Jace, the Mind Sculptor | Jace, the Mind Sculptor |
| `will o the wisp` | (none) | (none) |
| `lim dul` | (none) | (none) |
| `fire ice` | Fire Imp | Fire Imp |
| `sol ring` | Sol Ring, Sol Ring // Sol Ring, Soaring | same 3 |
| `lightning bolt` | Lightning Bolt, Emeritus of Conflict // Lightning Bolt, Lightning Colt | same + Lightning Wolf |

Why: matching is exact substring on the lower-cased name, so a comma, apostrophe,
hyphen, `//` or accent between the typed words breaks it. A whole name typed
without punctuation often still gets in, through the two-mistake typo allowance
(`yawgmoths will`, `jace the mind sculptor`); a partial one never does.

### Corpus-wide

- 7,339 of 34,639 names hold a character other than a letter, digit or space:
  comma 3,180 · apostrophe 2,454 · hyphen 1,219 · `//` 1,018 · accent 102 · other
  (`. : ! ? " & ( )`) 276.
- Typing the **whole name without punctuation or accents** (7,324 names, the two
  blank-named Un-cards excluded): the card is in today's list of 3 for 6,200;
  under the prototype rule below, 7,324 (all).
- Typing **the first two words without punctuation or accents** (7,288 names):
  in today's list of 3 for 3,380; under the prototype rule, 7,052.
- 18 names start with `urborg`. Urborg, Tomb of Yawgmoth ranks last of them on
  every search (longest name), so no list length short of 18 shows it for a bare
  `urborg`.

### The prototype rule (measurement only, not shipped)

Lower-case; strip accents (Unicode NFD, drop combining marks); hyphen and slash
become a space; drop every other character that is not a letter, digit or space;
collapse spaces. Same ranking tiers as `lib/search.ts`.

| Typed | Today (list of 3) | Prototype (list of 3) |
| --- | --- | --- |
| `urborg` | Urborg, Urborg Elf, Urborg Drake | unchanged |
| `urborg t` | Nevinyrral, Urborg Tyrant; Urborg | **Urborg, Tomb of Yawgmoth**; Nevinyrral, Urborg Tyrant; Urborg |
| `urborg to` | (none) | Urborg, Tomb of Yawgmoth |
| `urborg tomb` | (none) | Urborg, Tomb of Yawgmoth |
| `yawgmoths` | (none) | Yawgmoth's Will, Yawgmoth's Edict, Yawgmoth's Agenda |
| `jace the mind` | (none) | Jace, the Mind Sculptor |
| `atraxa praetors` | (none) | Atraxa, Praetors' Voice |
| `lim dul` | (none) | Lim-Dûl's Hex, Lim-Dûl's Vault, Lim-Dûl's Cohort |
| `fire ice` | Fire Imp | Fire // Ice, Fire Imp |
| `will o the wisp` | (none) | Will-o'-the-Wisp |
| `jotun` | Johan, Joven, Lotus | Jötun Grunt, Jötun Owl Keeper, Surtr, Fiery Jötun |
| `seance` | Séance, Lance, Penance | Séance, Séance Board, Lance |
| `sol ring`, `lightning bolt`, `urborg, tomb`, `lim-dûl` | as above | unchanged |
| `_____` | _____, ______, _____ Goblin | **(none)** — the prototype drops underscores |

The last row is why the proposed rule keeps underscores: two Un-set cards are
named only with blanks (`_____`, `______`) and become unfindable if underscores
are dropped.

## 2. Card search in the browser — what the player sees

Vite dev server from this worktree on port 5391 (mock provider), Chromium via
Playwright, 1100×800. Screenshots (gitignored, local only) under
`PRD/work/card-search-and-send-pill/.playwright-mcp/`.

| Surface | `urborg` | `urborg tomb` |
| --- | --- | --- |
| Ask a Question → Add card (`Card search`) | Urborg, Urborg Elf, Urborg Drake | "No matching card found" |
| In-depth details → Cards step (`Battlefield search input`) | Urborg, Urborg Elf, Urborg Drake | **nothing at all** — no list, no message (`in-depth-cards-search-urborg-tomb.png`) |
| Trade Balancer → Side A (`Side A card search`) | the 8 above | "No matching card found" |

The blank In-depth result is a second defect: `ZoneCollectionStep.tsx` shows its
list only while `useAutocompleteKeyboard`'s `isOpen` is true, and that hook closes
whenever there are zero suggestions, so the picker's own no-match branch
(`ZoneCardPicker.tsx`) never renders. REQ-002 already requires the message.

## 3. Send pill without speech recognition

Chromium with `window.SpeechRecognition` and `window.webkitSpeechRecognition`
defined as `undefined` by an init script before page load (confirmed
`typeof === "undefined"` in the page) — the code path Firefox takes, since the
mic half renders only when `useDictation().isSupported` is true. `/api/ask-ai`
was answered by a Playwright route stub to reach the follow-up boxes. Text typed
in each box before measuring.

| Question box | `.send-wrap` | `.send-pair` | arrow (`.send`) | mic |
| --- | --- | --- | --- | --- |
| Ask a Question | 88×44 | 88×44 | 44×44 at the left edge | absent |
| Ask a Question follow-up | 88×44 | 88×44 | 44×44 at the left edge | absent |
| In-depth details question | 88×44 | 88×44 | 44×44 at the left edge | absent |
| In-depth details follow-up | 88×44 | 88×44 | 44×44 at the left edge | absent |
| Control: Ask a Question, speech available | 88×44 | 88×44 | 44×44 at the right | 44×44 at the left |

The budget ring is drawn from `SEND_RING_PATH` (`M44 4 H64 A20 20 0 0 1 64 44 H24
A20 20 0 0 1 24 4 Z`, viewBox 0 0 88 48) — the two-half stadium, starting at the
seam — in every case. So without speech recognition the player sees the arrow in
the left half and an empty gradient right half with the ring round both.
Screenshots: `no-speech-ask-question.png`, `no-speech-ask-question-followup.png`,
`no-speech-in-depth-question.png`, `no-speech-in-depth-followup.png`,
`control-speech-ask-question.png`.

Not observed in a real Firefox binary (Playwright's Firefox is not installed).

The dev server was stopped and the browser closed after measuring.
