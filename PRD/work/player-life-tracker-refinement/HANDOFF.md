# Handoff — player-life-tracker-refinement

Written 2026-08-03 at the end of a session, for whoever picks this up next.

## Where things stand

This session (tenth) implemented four pieces of direct user feedback on the shipped tracker. Read `DESIGN-BRIEF.md`'s newest addendum ("confirm-before-destroy, flat card style, typed life entry, day/night") before touching any of it — in particular the reasoning for why day/night is **not** auto-derived.

1. **Reset / New Game confirm**: `GameSetupPanel` now requires a confirming second press for each; the first press swaps that button for Confirm/Cancel and fills a `role="status"` live region naming exactly what will be lost. One pending confirm at a time; closing Game Setup unmounts the panel and drops it.
2. **Card style**: new persisted `cardStyle: "gradient" | "flat"` (default `"gradient"`, so nothing changes without opting in). Flat replaces the ombre's near-white `via-*-50` mid stop with one solid tint per life state; same states, same border/text colors. Control is the "Card style" pill pair in Game Setup's Layout section.
3. **Typed life entry**: the life number on each card is a button that opens an inline numeric input (Enter/blur commits, Escape cancels), wired to the new `setPlayerLife`. Accepts negative and very large values; cancels rather than writing on empty/NaN. Sits under the +/− bands' z-layer, so bands still take their own taps.
4. **Day/night**: new persisted `dayNightEnabled` (default off) + `dayNightPhase` ("day"/"night", one game-wide value). When enabled, a compact ☀/☾ control appears in the tracker header next to ⚙ and flips on tap. Never auto-derived — there is no turn/spell data in this app to derive from.

Files touched: `lib/lifeTracker/{types,state,persistence,useLifeTracker}.ts` (+ their tests), `components/portal/life-tracker/{PlayerLifeCard,GameSetupPanel,PlayerLifeTrackerApp}.tsx` (+ their tests). Persisted state stays backward compatible: `isValidTrackerState` intentionally does not validate the three new fields, and `loadTrackerState` normalizes them to defaults — an old snapshot loads with its game intact. Verified this session: `typecheck` clean, full frontend suite **1057/1057** passing, scoped `eslint` clean on all thirteen touched files. Not verified live in a browser this session.

### Earlier sessions

Branch: `feature/life-tracker-more`. PR: [#59](https://github.com/ChrisMiho/TheJudge/pull/59) (**open, not merged** — leave it that way unless the user explicitly says to merge).

The ninth session replaced the "list" layout mode's underlying seat-arrangement algorithm. The user flagged that the old single-column `listSeatArrangement` (one full-width, unrotated row per player) is "basically un-usable on phones" at higher player counts, and pointed back at `references/IMG_9509.PNG`'s Layout selector icon: the second icon depicts three rows (full-width bar / paired tiles / full-width bar) — the same "symmetric rows, ends turned toward the group's edges" idea `seatArrangement` already uses for 2 and 3 players, just not generalized past that. Full reasoning is in `DESIGN-BRIEF.md`'s newest addendum ("list layout replaced with the row-based 'turned ends' pattern") — read it before touching this area again.

Files touched:
1. `apps/frontend/src/lib/lifeTracker/seatArrangement.ts` — rewrote `listSeatArrangement`: seat 1 is always a full-width "head" seat (rotation 180); remaining players fill side-by-side pair rows (rotation 0); even counts get a full-width "foot" seat (rotation 0) for the last player. `count === 2`/`3` produce the exact same shape as `seatArrangement`'s own `twoPlayerLayout`/`threePlayerLayout`. `seatArrangement()` (grid mode) itself is untouched.
2. `apps/frontend/src/lib/lifeTracker/seatArrangement.test.ts` — replaced the old single-column `listSeatArrangement` tests with exact-shape assertions (2, 3, 4, 5, 8 players) plus an invariant suite (no overlaps, only top/bottom sides, only 0/180deg rotation) for all of 2-8.
3. `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.tsx` — added an `isWideSeat` prop; life-adjustment bands are left/right only when `layoutMode === "list"` **and** the seat is a full-width head/foot row. Narrow pair-row seats (and everything in grid mode) keep top/bottom bands.
4. `apps/frontend/src/components/portal/life-tracker/PlayerLifeTrackerApp.tsx` — added an `isWideSeat` helper (compares a seat's `gridColumn` span to the layout's total `columns`) and threads it into `PlayerLifeCard`.
5. `apps/frontend/src/components/portal/life-tracker/PlayerLifeCard.test.tsx` / `PlayerLifeTrackerApp.test.tsx` — updated to cover the new shape and the wide/narrow band-placement split.

## Verified before handing off

- `npm --workspace apps/frontend run typecheck` — clean
- `npm --workspace apps/frontend run test` — 860/860 passing
- Scoped `eslint` on all six touched files — clean (one real `no-useless-assignment` catch fixed along the way — a dead final increment in the new `listSeatArrangement`)
- Verified live in a running Chrome tab (via the Claude-in-Chrome plugin) at a 390px-wide viewport (same temporary root-wrapper-width CSS-injection workaround documented in prior sessions' handoffs, since `resize_window` still doesn't reliably stick) for 4, 5, and 6 players in list mode: row count/shape matched the design at each count, bands sat left/right on the wide head/foot seats and top/bottom on the narrow pair seats, and grid mode's 90/270deg sideways rotation was confirmed unchanged
- Left the dev app's persisted state back the way it was found (cleared the `sessionStorage` active-destination key this session set for testing, removed the injected temporary CSS, left the persisted game back at 4 players / list mode / 50 life, matching what was there on load)

## What's still open / intentionally deferred

Not bugs — documented non-goals or explicitly parked follow-ups, carried forward from earlier addenda:

- **Automatic day/night derivation** is deliberately not built — it needs turn structure, turn ownership, and a spell log, none of which exist in this app. The header control is a manual flip. Revisit only if a turn tracker ever lands.
- **Card style is two options, not a theming system** — per-player colors/pastels stay deferred per the original non-goals; the user asked for "basic customization until we get more built out".
- **Counter panel tab bar** stays horizontal (Player/Counters tabs); converting it to the reference's vertical right-edge layout is still a real, un-started follow-up.
- **Gameplay-section toggles** from `IMG_9509.PNG` (Planechase, Archenemy, Bounty, Auto-KO, Turn timer, Game history) are still explicitly out of scope — those map to features that don't exist in this app.
- **No dedicated full-screen Settings route** — Game Setup is a modal now (not inline), but still not real navigation. Revisit only if the user asks for it explicitly.
- Per-player custom theming/pastel colors, saved profiles, game history, mana counter, dice & misc, full auto-KO — all still deferred per the original brief's non-goals, untouched this session.
- The life card's own on-card commander-damage preview grid (`PlayerLifeCard.tsx`) is unchanged this session, beyond the new `isWideSeat` band-placement prop.
- The Grid/List toggle's labels ("Grid"/"List") and glyph icons in `GameSetupPanel` are unchanged — "List" no longer means a flat single-column stack, but nobody's asked for a rename/re-icon yet; flagged here in case it's worth revisiting.

## Possible next steps (not started, no decision made either way)

- A PR comment summarizing this session's change was posted to #59 — the title/description still predates several sessions' worth of work and might be worth a refresh before merge, but that's the user's call.
- If the user considers the Game Setup visual-refinement scope fully closed, this package is a candidate for the `thejudge-cleanup` skill (promote durable outcomes, write the receipt, delete `PRD/work/player-life-tracker-refinement/`) — don't do this unprompted, confirm with the user first since there are still open follow-ups listed above.
