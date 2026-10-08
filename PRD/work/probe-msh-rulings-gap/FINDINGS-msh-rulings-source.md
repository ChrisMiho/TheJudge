# Findings: the MSH "missing rules" are not missing; the gap is rulings, and the fix needs no new source

## 1. The rule text is in our data

The committed rule index on PR #273's branch carries all three mechanics, verbatim from the 2026-09-25 Comprehensive Rules:

- 701.69a — To heal damage already dealt to a permanent, remove that marked damage from that permanent. If an effect states that damage already dealt to a permanent "is healed," that permanent's controller removes all marked damage from that permanent.
- 702.193a — Power-up is a keyword that adds additional rules to the activated ability that follows it. "Power-up — [Cost]: [Effect]" means "[Cost]: [Effect]. If this permanent entered this turn, this ability's cost is reduced by this permanent's mana cost. Activate this ability only once."
- 702.193b — Generic mana in the permanent's mana cost reduces generic mana in the cost to activate its power-up ability. Colored and colorless mana in the permanent's mana cost reduces mana of the same type, and any excess reduces that much generic mana.
- 702.194a — Teamwork represents a static ability that functions while the spell with teamwork is on the stack. "Teamwork N" means "As an additional cost to cast this spell, you may tap any number of creatures you control with total power N or more." …
- 702.194b / 702.194c — "cast using teamwork" wording; targets chosen only if teamwork was used.

So "rules missing from the Scryfall data" conflates two things. Scryfall never carries the Comprehensive Rules (integrations-and-data.md: "Scryfall does not host Comprehensive Rules"); the rules come from Wizards' CR download and are present. What Scryfall supplies is per-card **rulings** (the short Q&A notes Wizards publishes per card), and for the Marvel Super Heroes set it has none.

## 2. The exclusion was unnecessary under REQ-185 as written

REQ-185 tier 1 allows two sources: a CR `Example:` line, **or the rule's own text when the question asks exactly what that rule states**. REQ-223's measurement note already applied this to two mechanics with no example and no ruling (701.32 Set in Motion, 702.59 Recover), and both cases are approved on main:

- `set-in-motion-rule-text.case.json` — Q: "Can a player who is not the archenemy set a scheme card in motion?" A: 701.32a verbatim.
- `recover-rule-text.case.json` — Q: "Does recover work while the card with recover is on the battlefield?" A: 702.59a verbatim.

The reconciliation commit on PR #273 framed heal / Power-up / Teamwork as "no official text a case can quote". That framing was wrong: the rule's own text is official text, and the precedent exists. The owner's exclusion decision on 2026-10-07 rested on that wrong framing. Three tier-1 rule-text drafts can be authored today from committed data alone, e.g.:

- heal (701.69a): "A Wolverine effect says damage already dealt to him is healed. Who removes the damage, and how much?" → all marked damage, by the permanent's controller.
- Power-up (702.193a): "I activate a creature's power-up ability the turn it entered and the targets become illegal, so it fizzles. Can I activate it again?" → the rule says activate only once; note the Release Notes also answer this explicitly (see §4), but the rule text alone supports "no" only via "Activate this ability only once" — the fizzling angle is better left to a tier-2 source.
- Power-up (702.193b): "My {3}{R} creature entered this turn. Its power-up costs {5}{R/G}{R/G}. What does it cost now?" → the mana-type reduction rule, read exactly as 702.193b states it.
- Teamwork (702.194a / 702.194c): "If I don't pay teamwork, do I still choose the targets for the teamwork-only part?" → no, 702.194c.

Caveat: the tier-1 "rule's own text" branch is explicitly for a question that asks exactly what the rule states. A scenario-shaped question needs a ruling or example, which is where §4 comes in.

## 3. What Scryfall actually has (live, 2026-10-07)

| check | result |
|---|---|
| MSH cards on Scryfall (`set:msh`) | 281 |
| Power-up cards (`keyword:power-up`, all sets) | 37 |
| Teamwork cards (`keyword:teamwork`) | 17 |
| rulings on Abomination, Terrifying Titan / Captain Marvel, Earth's Protector / Atlantis Attacks | 0 / 0 / 0 |
| rulings on Theorist's Proxy (set released 2026-10-02, five days ago) | present, dated 2026-08-21 |

A set released five days ago has rulings; a set released 2026-06-26 has none across all 281 cards. This is a Wizards/Scryfall publication gap specific to MSH, not a staleness problem in our refresh. Every MSH card on Scryfall also lacks a Gatherer multiverse id (0 of the first 175), which is consistent with Wizards not having loaded the set's rulings into the feed Scryfall mirrors. The Gatherer card page itself could not be fetched here (redirected to the homepage), so whether Gatherer shows rulings is **unverified**.

Product-side consequence: a player who attaches any MSH card today gets no OFFICIAL RULINGS block in their prompt, for the whole set. The rule text for the mechanics does reach the prompt (REQ-182 retrieval over the refreshed index), so the model is not blind, only ruling-less.

## 4. The official Wizards fallback exists and is rich

The Marvel Super Heroes Release Notes (magic.wizards.com, article dated 2026-06-12, also a PDF) are official Wizards text. They carry:

- Power-up: the reminder-text definition plus two rulings, including "since the power-up ability was already activated, it can't be activated again" after a fizzle.
- Teamwork: seven rulings (copies are "cast using teamwork"; can't pay teamwork when a permanent is put onto the battlefield without casting; tapping an attacking creature to pay doesn't remove it from combat; teamwork is payable under "without paying its mana cost"; etc.).
- Heal: a card-specific note under Wolverine, Fierce Fighter: "To heal damage from a permanent, remove all damage currently marked on it."
- Card-specific notes for roughly 130+ cards in the middle third of the article alone.

Gatherer/Scryfall rulings are normally derived from exactly this document, so for MSH the release notes are the text that would have been the rulings.

What stops us using it today is product truth, not availability. REQ-185 states "the corpus commits only WotC text the project already ships (the committed rulings and Comprehensive Rules)", and tier 3 allows outside sources as research links, never copied text. Release-notes text is neither committed nor shipped. So "start with Scryfall, fall back to official Wizards" is possible, but it is an amendment:

- Option A (recommended): add a tier-2 authority `wotc-release-notes` to REQ-185 — citation = article URL + article date + mechanic or card heading; licence line parallel to the card-ruling one; `source.pool` unchanged. The answer is still verbatim WotC text, so the tier-2 contract ("tests whether the model honours official text") holds. The product-side prompt would NOT attach release-notes text, so the tier-2 rationale "the ruling the prompt already attaches" is weaker for these cases; record that on the case.
- Option B: keep REQ-185 as is, write scenario cases as tier 3 with the release notes listed as research, owner approves. Honest but scores on the separate tier-3 line and never pools.
- Option C (bigger, product-side): ingest release notes into the rulings artifact so MSH cards get an OFFICIAL RULINGS block in live prompts. Needs an HTML/PDF parser for Wizards articles and a licensing decision for serving the text; out of scope for a corpus question.

## 5. Recommendation

1. On PR #273 (or a follow-up on the same branch): un-exclude the three mechanics and add three tier-1 rule-text drafts (same shape as `recover-rule-text`). No new source, no PRD change. The excluded-list test pins five entries today and must go back to two.
2. If the owner wants scenario-shaped MSH cases (fizzle-then-reactivate, teamwork on copies), kick off Option A as its own small spec: REQ-185 amendment + authoring note in the worked-solutions README + the cases. That is a `/graph-kickoff` candidate, not part of the refresh PR.
3. Keep "revisit each refresh" for Scryfall rulings; when they appear, nothing changes except richer tier-2 options.

Sources: https://magic.wizards.com/en/news/feature/marvel-super-heroes-release-notes ; https://media.wizards.com/2026/downloads/MSH_Release_Notes_N6hMZoes90/zfGb4BJ8Bf_EN_MTGMSH_ReleaseNotes_20260513.pdf ; https://api.scryfall.com (queries listed in PROBE.md)
