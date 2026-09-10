# Design brief — rule-excerpt-cap-ten

**What this is:** raising the number of official rule excerpts the app attaches to
an Ask AI rules question from five to ten.

**What you need to do:** answer the 14 verdict slots in `GATE-QUESTIONS.md`, then
merge the docs PR. That merge is the build signal.

**What it changes:** on hard rules questions the deciding rule now reaches the
model instead of falling just outside the top five, so the deployed model answers
correctly where it used to miss.

## What the player gets

A player asks Ask AI a rules question. Before the model answers, the app searches
the Comprehensive Rules and attaches the most relevant rule excerpts to the
prompt — that search is called **System 3**. Today it attaches at most five
excerpts. This raises that to ten.

Nothing else about the answer changes. The five excerpts a player's question
already gets stay the same five, in the same order; five more are added beneath
them. The player sees no new UI, no new setting, and no slower answer.

## Why ten

Both figures below are already recorded as product truth in `PRD/sections/`, so
this package consumes a measurement rather than making one.

- On the 18-case worked-solution gold set, the deployed model `gpt-4.1` answered
  16 of 18 fully correctly at cap 5 and **18 of 18 at cap 10**; the deciding rule
  reached the prompt for 14 of 18 cases at cap 5 and 16 of 18 at cap 10. The two
  cases that flip are combat damage assignment order (rule 510.1c, which ranked
  7th) and Sensei's Divining Top leaving the battlefield (rule 113.7a).
  (REQ-190's measured note, `functional-requirements.md:4483`; REQ-188's run-3
  note, `:4432`.)
- Answer latency for `gpt-4.1` is unchanged: 3.4 s at cap 5, 3.5 s at cap 10
  (same notes).

## Scope

One constant in the backend flips, and every place `PRD/sections/` asserts the
number five for this cap moves to ten.

- **Code.** `apps/backend/src/prompt/preparation.ts` exports one constant,
  `DEFAULT_SUPPLEMENTAL_RULE_CAP`, read at all four production call sites
  (REQ-190, `functional-requirements.md:4466`). Its value moves `5` → `10`. The
  cap assertions in `preparation.test.ts` move with it.
- **Product truth.** 32 lines across 7 `PRD/sections/` files. The complete
  enumeration and per-line disposition is the appendix below; the proposed edits
  are in `GATE-QUESTIONS.md`, one slot per stable ID.
- **Eval instrument.** The answer-quality run's excerpt-cap legs default to
  `[5, 10]` today. They become `[10, 15]`, so the instrument keeps asking "does
  attaching even more help?" against the new production baseline instead of
  re-measuring a settled question.

## Non-goals

- No new retrieval or ranking work. The hybrid ranking that ships today
  (REQ-181/REQ-182) is untouched — this change slices the same scored list deeper.
- No change to the Commander Spellbook **combo-variant** cap of five
  (REQ-094/095). That is a different number in a different system and is left
  alone everywhere it appears.
- No reopening of the answer-quality instrument itself (REQ-185–REQ-190, shipped).
  This package consumes its measurement and updates the legs it runs; it does not
  change how it measures.
- No end-to-end production latency sample. Model answer latency is measured and
  unchanged; sampling real production request latency against NFR-002's
  three-second target stays a separate parked package.
- No per-surface cap. In-Depth Question and Quick Question keep sharing one value.

## Decisions

### Amend the existing requirements in place; mint no new REQ

The cap is asserted in a dozen places, so an owning requirement — one REQ that
holds the number and is cited everywhere else — is tempting. It is rejected.

The code already has that single owner: `DEFAULT_SUPPLEMENTAL_RULE_CAP`, one
constant read at all four call sites (REQ-190). A new REQ would not remove a
single amendment from this package: every site that says "up to 5 excerpts" says
it inside its own sentence about its own surface, so each still has to be
rewritten to point at the new REQ. The result is the same 32 edits plus one more
ID and one more place for the number to drift. The decision log is retired, so no
`DEC-` is proposed either.

### The eval instrument's cap legs become `[10, 15]`

REQ-190 exists to observe what attaching more excerpts does to the answer. With
production at ten, a `[5, 10]` run re-measures a decided question. `[10, 15]`
keeps the instrument pointed at the open one, and the run is confirmation-gated
and explicitly invoked, so nothing is spent until someone asks for it. The owner
can override this at the gate — it is called out in REQ-190's slot.

### The recall harness follows production to top-10

REQ-032's two System 3 harness checks measure the top 5 today. Both move to
top 10, because both exist to model what production actually attaches:

- `system3-expected-recall` (an expected rule must be retrieved) gets **looser** —
  a rule at rank 8 now passes, and it should, because production now shows it.
- `system3-noise-excluded` (a forbidden rule must not be retrieved) gets
  **stricter** — a forbidden rule at rank 8 now fails, and it should, because
  production now shows it.

Implementation risk, recorded for the build slice: a forbidden rule may already
sit at ranks 6–10 in an existing fixture, which would fail `npm run test:eval` on
the first run. That is a genuine signal about what the deeper cap attaches and
gets recorded, never suppressed by relaxing the check.

### The smaller-model regression is recorded, not acted on

At cap 10 the smaller models got **worse** on the same gold set: `gpt-4.1-mini`
17 → 15, `gpt-5-nano` 15 → 13 (REQ-190's measured note). We deploy `gpt-4.1`,
which gains, so this does not bite today. It is recorded as a new note on
REQ-182: if the deployed answer model ever changes to a smaller one, the cap
decision is revisited.

### Ship without a production latency sample

Model answer latency is measured and unchanged (3.4 → 3.5 s for `gpt-4.1`).
End-to-end request latency was never measured at either cap, so gating this
change on a fresh production sample would block a measured win on an unmeasured
concern. The cap ships; the NFR-002 sampling package stays parked and separate.

## Cost and budget

Five extra excerpts at roughly 70 tokens each is about **+350 input tokens per
request**. At `gpt-4.1`'s recorded list price of $2.00 per million input tokens
(REQ-188, `functional-requirements.md:4430`), that is about **$0.0007 per
request** — well under a tenth of a cent.

The prompt character budget is not a constraint: `MAX_PROMPT_CHAR_BUDGET` is set
to `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042's amendment to DEC-030
(REQ-022, `functional-requirements.md:361`).

## Material assumptions

Every assumption below resolves at rung 1 or 2 of the assumption ladder in
`PRD/instructions/preparation-contract.md` — active product truth in
`PRD/sections/`, or existing tested behavior. None needed intake to be taken on
faith, and no cited document outside `PRD/sections/` was opened.

| # | Assumption | Evidence | Ladder rung |
| --- | --- | --- | --- |
| A1 | The deployed answer model is `gpt-4.1`. | REQ-188's measured note: "The deployed model is `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`)" (`functional-requirements.md:4432`). | 1 — active product truth |
| A2 | Cap 10 gains two cases for `gpt-4.1` and regresses none. | REQ-190's measured note, run 3: `gpt-4.1` 16 → 18 fully correct; gold rule in prompt 14/18 → 16/18 (`functional-requirements.md:4483`). | 1 — active product truth |
| A3 | Raising the cap adds excerpts and never reorders the ones already shown. | REQ-190 criterion: `retrieveRulesForQueryWithDebug` returns `runnerUp` as ranks 6–15 of the same scored list, so a cap-10 call's top 5 is identical to the cap-5 call's — "proven directly, not assumed, in `preparation.test.ts`" (`functional-requirements.md:4468`). | 2 — existing tested behavior |
| A4 | Answer latency is unchanged at cap 10. | REQ-188 run-3 note: `gpt-4.1` mean latency 3.4–3.5 s across both caps (`functional-requirements.md:4432`). | 1 — active product truth |
| A5 | The prompt character budget is not a constraint. | REQ-022: `MAX_PROMPT_CHAR_BUDGET` = `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) per DEC-042 (`functional-requirements.md:361`). | 1 — active product truth |
| A6 | One shared cap serves both In-Depth Question and Quick Question; no per-surface value. | REQ-190: one exported constant `DEFAULT_SUPPLEMENTAL_RULE_CAP` used at all four production call sites (`functional-requirements.md:4466`). | 2 — existing tested behavior |
| A7 | An excerpt averages about 70 tokens, used only for the order-of-magnitude cost note. | REQ-190's note recording the driver context measurement, which that note itself marks as cited evidence and explicitly "not adopted as a measurement of this repository's product truth" (`functional-requirements.md:4484`). Used for a cost estimate, never as an acceptance figure. | 4 — smallest reversible scope; no acceptance criterion depends on it |

## Blocker questions

None. Every uncertainty resolved on the assumption ladder. The two judgement
calls that could have gone another way — the eval instrument's new comparison leg
and whether to gate on a production latency sample — both fail condition 2 of the
genuine-blocker test: `PRD/sections/` gives an authoritative basis for choosing,
and each is surfaced in a verdict slot the owner can edit.

## Requirement and flow references

- Amended: REQ-022, REQ-032, REQ-178, REQ-181, REQ-182, REQ-185, REQ-188,
  REQ-190, NFR-018.
- Amended non-requirement truth: `system-map.md`, `integrations-and-data.md`,
  `in-depth/README.md`, `quick-lookup/README.md`,
  `system-map/game-rules-retrieval.md`.
- Read, unchanged: REQ-094/REQ-095 (the combo-variant cap of five — a different
  number), REQ-167 (the 5-card attach limit), REQ-177, REQ-179, REQ-183,
  REQ-186, REQ-187, REQ-189, NFR-002, DEC-042, DEC-046.

## Likely slices

- **A** — flip `DEFAULT_SUPPLEMENTAL_RULE_CAP` to `10`, update the cap
  assertions in `preparation.test.ts`, apply the REQ-181/REQ-182/REQ-190 truth.
- **B** — apply the remaining product-truth amendments across the eight files.
- **C** — move the eval instrument's cap legs to `[10, 15]` and update REQ-032's
  harness checks to top-10, running `npm run test:eval` and recording whatever
  the deeper noise check surfaces.

## Appendix — amendment-set enumeration

The cap's spelling varies ("five excerpts", "up to 5 excerpts", "capped at five",
"top-5", "the deployed cap stays 5"), so the set was enumerated by one grep wide
enough to catch any of them, and every hit carries a disposition.

```
grep -rniE 'excerpt|caps?\b|capped|\bfive\b|\bten\b|top-?\s?(5|10|five|ten)|DEFAULT_SUPPLEMENTAL_RULE_CAP' PRD/sections/
```

**266 hits. 32 amended (each in a `GATE-QUESTIONS.md` slot); 234 not this cap.**

A narrower spelling-only grep was tried first and missed two real hits —
`functional-requirements.md:4470` ("the deployed cap stays 5") and `:4473`
(NFR-002's "the larger cap exists only inside an offline evaluation run") — which
is why the wide pattern above is the recorded one.

| Line | Text (truncated) | Disposition |
| --- | --- | --- |
| `PRD/sections/user-flows.md:12` | 3. Per-zone collection: for each selected zone, user may add card identities from local se… | not this cap — layout/size cap |
| `PRD/sections/user-flows.md:35` | - on narrow/mobile viewports, the card-detail view reached from zone search must keep its … | not this cap — layout/size cap |
| `PRD/sections/user-flows.md:135` | 5. To remove a wrong auto-add, the user taps the scanned-cards bubble in the top-right. It… | not this cap — layout/size cap |
| `PRD/sections/user-flows.md:209` | - the same card may appear more than once on a side; the stack duplicate-block (FLOW-004) … | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/user-flows.md:252` | 4. After expanding the outer "General rules topics" disclosure, each topic row shows its t… | not this cap — layout/size cap |
| `PRD/sections/user-flows.md:253` | 5. User enters or continues a freeform question (subject to the same 300-character cap as … | not this cap — question/notes character cap |
| `PRD/sections/user-flows.md:264` | - if history chars exceed the shared cap, oldest turns are truncated first (REQ-027) | not this cap — conversation-history retention cap |
| `PRD/sections/user-flows.md:343` | 5. The matcher annotates compatible present, wrong-zone, missing exact, matched-template, … | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/user-flows.md:499` | - intake is large → it is copied whole and read by node 2 within its existing tool-call ca… | not this cap — graph per-node tool-call cap |
| `PRD/sections/user-flows.md:518` | 3. User adds each card they want to discuss by typed autocomplete search (REQ-001/REQ-002)… | not this cap — layout/size cap |
| `PRD/sections/user-flows.md:525` | - user tries to add beyond the cap → the add is blocked with a stated limit, mirroring exi… | not this cap — unrelated bound |
| `PRD/sections/user-flows.md:527` | - AI failure, follow-up failure, or history over the shared cap → same shared handling as … | not this cap — conversation-history retention cap |
| `PRD/sections/screen-layout.md:30` | - **Outer shell width** sizes as a **% of the viewport**, with rem/`min()` caps so ultra-w… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:34` | - **tablet/desktop:** shell ≈ **92%** of viewport width, capped at `min(48rem, 92vw)` (DEC… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:48` | - Prefer tuning a row’s % / cap over inventing a one-off full-bleed layout mid-bugfix. | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:62` | \| Desktop/tablet \| Width ≈ 92% viewport, cap `min(48rem, 92vw)`; height follows content … | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:89` | \| Phone / Desktop \| Rail: corner band (hit box capped per DEC-137) when tray closed. Ope… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:118` | \| Phone \| Bottom sheet / overlay within workspace rules (DEC-118); surface height caps s… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:131` | \| Desktop/tablet \| Shell 92%/48rem cap; content-sized vertically; card images grow with … | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:132` | \| Fit \| No page scroll for primary submit path — this bounds card image growth (REQ-129)… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/screen-layout.md:151` | \| Desktop/tablet \| Shell 92%/48rem cap; **content-sized vertically** — do not stretch th… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:181` | \| Fit \| Composer growth must not force page scroll or clip chrome below the field (REQ-1… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:198` | \| Phone \| Camera frame grows to fill **available viewport height** in the scan chrome (D… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:201` | \| Notes \| DEC-090, DEC-160, REQ-129, DEC-052 family — do not re-layout scanner internals… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:220` | \| Printing picker \| Region-scrolls inside the side at about 5-6 rows, capped near `40vh`… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:229` | \| Phone / Desktop \| Modal centered within viewport; width capped for readability (not fu… | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:243` | \| Phone \| <shell/region % of viewport or shell; key caps> \| | not this cap — layout/size cap |
| `PRD/sections/screen-layout.md:244` | \| Desktop/tablet \| <shell/region %; key caps> \| | not this cap — layout/size cap |
| `PRD/sections/system-map.md:88` | - Summary: Selects up to 5 supplemental rule excerpts per request. The query is the player… | **amend** — slot `system-map.md` |
| `PRD/sections/system-map.md:200` | - Summary: Zone collection, expanded scan review, enrichment, and other suite card-image s… | not this cap — layout/size cap |
| `PRD/sections/system-map.md:291` | - Summary: Offline build that generates `cardhashes.bin` + manifest from Scryfall images u… | not this cap — layout/size cap |
| `PRD/sections/system-map.md:309` | - Detector robustness (shipped 2026-06-25, `scan-detector-foil-robustness`): the recall fi… | not this cap — layout/size cap |
| `PRD/sections/system-map.md:388` | - Summary: Browser-local, single-device conversation history (capped at 20 completed entri… | not this cap — conversation-history retention cap |
| `PRD/sections/system-map.md:493` | - Summary: Digestible before/after report (System 2 topics, System 3 top-5 with scores, re… | **amend** — slot `system-map.md` |
| `PRD/sections/system-map.md:500` | - Summary: On-demand, confirmation-gated run that asks each model in a configured lineup e… | **amend** — slot `system-map.md` |
| `PRD/sections/system-map.md:528` | - Summary: Gates every main-branch deploy on `quality:check`, skips the deploy job on merg… | not this cap — deploy/infra limit |
| `PRD/sections/system-map.md:549` | - Summary: Backend-only, static Commander Spellbook prompt enrichment shared by In-Depth Q… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/integrations-and-data.md:62` | - `gameStateNotes?: string` — optional freeform annotation for cross-card, transient game-… | not this cap — question/notes character cap |
| `PRD/sections/integrations-and-data.md:265` | - topic rule numbers and excerpts are curated and human-signed-off during implementation; … | not this cap — System 2 curated topic excerpts, which carry no per-request count |
| `PRD/sections/integrations-and-data.md:347` | - history chars are capped at `MAX_CONVERSATION_HISTORY_CHARS` (`EFFECTIVELY_UNLIMITED_CHA… | not this cap — conversation-history retention cap |
| `PRD/sections/integrations-and-data.md:362` | - verbatim WotC Comprehensive Rules excerpts for curated general game-rules topics selecte… | not this cap — System 2 curated topic excerpts, which carry no per-request count |
| `PRD/sections/integrations-and-data.md:363` | - up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule… | **amend** — slot `integrations-and-data.md` |
| `PRD/sections/integrations-and-data.md:395` | - use per-card and whole-section caps so `MAX_PROMPT_CHAR_BUDGET` remains authoritative | not this cap — layout/size cap |
| `PRD/sections/decisions.md:49` | \| DEC-008 \| retired \| The stack is capped at 10 cards in the core product. \| | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/decisions.md:71` | \| DEC-030 \| retired \| Backend prompts include a curated library of verbatim WotC Compre… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/decisions.md:73` | \| DEC-032 \| retired \| Backend prompts include up to 5 supplemental WotC Comprehensive R… | not this cap — retired `DEC-032` in the demoted historical decision index; a retired entry records what was decided then and is never restated |
| `PRD/sections/decisions.md:117` | \| DEC-076 \| retired \| Staged-flow presentation compaction: game-context layout, enrichm… | not this cap — layout/size cap |
| `PRD/sections/decisions.md:140` | \| DEC-099 \| retired \| Rules Lookup is a reuse-first Ask AI entry for general rules ques… | not this cap — conversation-history retention cap |
| `PRD/sections/decisions.md:157` | \| DEC-116 \| retired \| Commander Spellbook supplies a static community combo corpus for … | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/decisions.md:165` | \| DEC-124 \| retired \| Conversation history becomes persistent, resumable, browser-local… | not this cap — conversation-history retention cap |
| `PRD/sections/decisions.md:168` | \| DEC-127 \| retired \| The conversation thread becomes a full-bleed chat surface within … | not this cap — conversation-history retention cap |
| `PRD/sections/decisions.md:178` | \| DEC-137 \| retired \| Suite chrome's interactive box may not exceed the affordance it p… | not this cap — layout/size cap |
| `PRD/sections/decisions.md:189` | \| DEC-148 \| retired \| Superseded by DEC-151. Was: narrow-viewport card detail caps prev… | not this cap — layout/size cap |
| `PRD/sections/decisions.md:192` | \| DEC-151 \| retired \| Card density: compact images for first-viewport fit, suite-wide c… | not this cap — layout/size cap |
| `PRD/sections/decisions.md:207` | \| DEC-166 \| retired \| Graph boundaries move from the launch-flag permission profile int… | not this cap — layout/size cap |
| `PRD/sections/scan/README.md:108` | this-session adds and expands to a viewport-capped 320px panel listing each | not this cap — layout/size cap |
| `PRD/sections/scan/README.md:281` | capped at 320px and region-scrolls; review images size to their list-row | not this cap — layout/size cap |
| `PRD/sections/scan/README.md:282` | width under DEC-160 (no longer pixel-capped at 92×128px). (DEC-090, DEC-160, | not this cap — layout/size cap |
| `PRD/sections/scan/README.md:304` | replaced the capped selectable list with a single non-selectable "locking on: | not this cap — unrelated bound |
| `PRD/sections/functional-requirements.md:138` | - Description: The core product must cap the stack at 10 cards. | not this cap — unrelated bound |
| `PRD/sections/functional-requirements.md:162` | - "up to 300 characters" means **what the user types**: REQ-091 as amended (`ui-review`, 2… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:352` | - Description: Every backend AI prompt must include a curated library of verbatim WotC Com… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:356` | - excerpts are verbatim WotC CR prose for rule numbers listed in `apps/backend/data/gameRu… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:366` | - every assembled prompt may include an `ADDITIONAL RELEVANT RULE EXCERPTS` section with u… | **amend** — slot `REQ-022` |
| `PRD/sections/functional-requirements.md:390` | - System 3's scoring mechanism moves from lexical-only to semantic-primary with lexical fa… | **amend** — slot `REQ-022` |
| `PRD/sections/functional-requirements.md:488` | - history chars budget is capped at `MAX_CONVERSATION_HISTORY_CHARS` (`EFFECTIVELY_UNLIMIT… | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:565` | - backend Zod schema validates `gameStateNotes` when present: trimmed, same control-charac… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:572` | - capped at 2000 characters; control-character guardrails | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:586` | - harness check `system3-expected-recall` passes when every `expectedSupplementalRuleIds` … | **amend** — slot `REQ-032` |
| `PRD/sections/functional-requirements.md:587` | - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` ent… | **amend** — slot `REQ-032` |
| `PRD/sections/functional-requirements.md:589` | - a digestible before/after relevance report is available for tuning review (one table per… | **amend** — slot `REQ-032` |
| `PRD/sections/functional-requirements.md:1182` | - tests cover representative cases for game-context Easter egg, zone strip scroll, scan ch… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:1185` | - enrichment scroll cap (4 rows per zone) applies across automatic responsive widths; zone… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:1199` | - automatic responsive presentation (REQ-096 / DEC-117) adjusts surrounding spacing withou… | not this cap — unrelated bound |
| `PRD/sections/functional-requirements.md:1246` | - expanded `ScanReviewBubble` uses a 320px width with a viewport-safe cap and retains its … | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:1479` | - a trade side is a value list, not the stack: the duplicate-block (REQ-009/FLOW-004) and … | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/functional-requirements.md:1697` | - `question` character cap and control-character guardrails are identical across modes | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:1698` | - `conversationHistory` is optional in both modes and validated by the existing DEC-038 ru… | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:1723` | - a freeform question field accepts up to the same character cap as the main flow question… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:1751` | - the prompt instructs the model to quote only from the provided rule excerpts and to pres… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:1836` | - Description: Quick Lookup must offer a small always-local list of core rules topics (lab… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:1841` | - expanding a row reveals that topic's rule numbers and excerpt; opening one topic auto-co… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:1842` | - the topic content is a committed frontend subset of the same curated `gameRulesByTopic` … | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:2125` | - the shared 300-character cap (REQ-011) and the visible character counter both measure th… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:2137` | - **amended during the `ui-review` pass (2026-08-06)**: the cap/counter criterion original… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:2211` | - for `mode: "lookup"`, combo retrieval runs only when combo intent is explicit and at lea… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:2216` | - at most five variants are selected, ordered by: complete contextual match; required-anch… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:2230` | - the `mode: "lookup"` criterion is amended by REQ-167: the single attached card generaliz… | not this cap — 5-card attach limit (REQ-167) |
| `PRD/sections/functional-requirements.md:2262` | - the five-variant retrieval cap is a relevance/noise boundary independent of DEC-042's ef… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:2383` | - no per-player themes, Magic mana symbols/logos/card art, customization of the five fixed… | not this cap — unrelated bound |
| `PRD/sections/functional-requirements.md:2493` | - the list is capped at the 20 most recent conversations; saving a 21st entry prunes the o… | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:2544` | - Description: The shared conversation thread must fill the workspace's available vertical… | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:2546` | - the message thread expands to use the conversation workspace's available height instead … | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:2624` | - Draft does not count toward the 20 completed-conversation retention cap | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:2672` | - no Ask AI contract change; existing character caps unchanged | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:2754` | - Description: Suite chrome must not accept taps outside the affordance it visibly paints.… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:2858` | - the 20-entry auto-prune cap still applies to remaining completed entries | not this cap — conversation-history retention cap |
| `PRD/sections/functional-requirements.md:2901` | - frontend-only; no Ask AI contract change; character caps unchanged | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:2919` | - submit gating, character caps, and the zone-aware blank-question fallback are unchanged | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:2974` | - Title: Desktop shell width cap | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:2976` | - Description: The desktop shell scales past the fixed `42rem` column to a modest fluid ca… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:2979` | - the cap still binds on ultra-wide viewports: at 2560px wide the shell does not exceed 48… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3101` | - Description: However card images are sized, the hosting screen's primary chrome and CTA … | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3107` | - where container-relative sizing (DEC-160) would violate any criterion above on a given s… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:3144` | - **amended during the `ui-review` pass (2026-08-06)**: DEC-160 replaces the shared `max-h… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3172` | - accessible names retain Ask/Decrypt semantics; character caps and blank-question fallbac… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3191` | - card image renders visibly larger than the current `max-h-32` cap (measured baseline: 92… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3215` | - the composer cannot reach a state where the field is at its own `maxLength` yet submissi… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3220` | - presentation/state-bug fix only; the 300-character limit itself and the blank-question f… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3222` | - the composed string sent in `AskAiRequest.question` may exceed 300 characters by the len… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3223` | - **corrected on ship (2026-08-11)**: the reasoning above originally read "no downstream l… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3230` | - root cause confirmed live during `ui-review` refinement, not merely suspected: `QuickLoo… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3241` | - at 390×844 with content long enough to hit the surface's height cap, the scrim region th… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3252` | - the ≥25% scrim floor is recorded on `screen-layout.md`'s *View Context / adaptive contex… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3253` | - amended during the `ui-review` live sweep: outside-click was reported broken, but Playwr… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3298` | - Description: In the In-Depth Game Context commander-damage section, tighten the arrangem… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3301` | - the field remains a free-typed numeric input (no dropdown, no min/max cap) since command… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3371` | - Description: Card images size relative to their container rather than to a fixed pixel c… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3373` | - `CardPresentation` no longer applies a fixed pixel height cap to the card image; the ima… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3378` | - REQ-129's criteria still hold and are the binding ceiling: at 390×844 the zone-collectio… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3379` | - exactly one sizing rule lives in the shared component — no per-screen fork, no size vari… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:3397` | - measured live during `ui-review` refinement; `CardPresentation.tsx:158` caps the image w… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3398` | - **corrected during quality-check (2026-08-06)**: this requirement originally named three… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3584` | - the existing loop cap is unchanged: `review` may return to `build` at most twice, and a … | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3593` | - Title: Per-node tool-call cap enforced by the hook | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3595` | - Description: Each node in the graph node table carries a maximum tool-call count for one… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3597` | - the node table gains a cap column, and every node has a value. The value is a budget for… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3600` | - the hook increments a counter keyed by run id, node, and attempt on each tool call, and … | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3601` | - exceeding a cap parks the package at `owner-action` with the node, the cap, and the obse… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3604` | - the cap adds no third loop limit: the contract's existing loop caps — at most three FAIL… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3605` | - the cap is not a fifth terminal state; an overrun uses the existing `PARKED` state | not this cap — unrelated bound |
| `PRD/sections/functional-requirements.md:3607` | - the cap is tool calls, not spend: the Agent SDK's `max_turns` and `max_budget_usd` are n… | not this cap — unrelated bound |
| `PRD/sections/functional-requirements.md:3610` | - a missing or unparseable run-state file means the hook cannot attribute the call to a no… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3669` | - the heartbeat is unavailable when the cap is degraded — a missing or unparseable `.workt… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:3696` | - the node table, models, per-node caps, loop limits, the `define` gate trigger, and every… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3859` | - The pre-submit view lets the player add, preview, and remove more than one card; an expl… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:3862` | - When an eligible candidate is **complete** — every ingredient slot filled by an exact or… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:3879` | - Screen-layout's "Quick Question — pre-submit" row records a **single-card** image cap (R… | not this cap — 5-card attach limit (REQ-167) |
| `PRD/sections/functional-requirements.md:3881` | - Gate review (2026-08-30) tightened the add cap from a suggested ~6 to a fixed 5, and dir… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:3900` | - This also resolves the **symptom** half of the mechanic-keyword observation: a mechanic … | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:3956` | - a build that parks (a gate blocker, a per-node cap, a `gate-qc`/`review` loop-limit) sen… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3977` | - Description: `graph-implement` runs unattended, so the stop sentinel, the hook-liveness … | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:3981` | - the per-node tool-call caps apply per build exactly as for a single run; a cap overrun p… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:4131` | - the assembled prompt text is unchanged by this requirement: card oracle text still rende… | **amend** — slot `REQ-178` |
| `PRD/sections/functional-requirements.md:4151` | - Description: The committed Comprehensive Rules index excludes the source document's tabl… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:4158` | - `npm run test:eval` stays green; any golden prompt change is an intentional, reviewed co… | not this cap — layout/size cap |
| `PRD/sections/functional-requirements.md:4199` | - Description: System 3 supplemental rule retrieval ranks Comprehensive Rules excerpts by … | **amend** — slot `REQ-181` |
| `PRD/sections/functional-requirements.md:4208` | - on any embedding failure — model load, inference error, missing artifact, provider error… | **amend** — slot `REQ-181` |
| `PRD/sections/functional-requirements.md:4210` | - System 3 remains capped at 5 excerpts, still deduplicated against the curated System 2 s… | **amend** — slot `REQ-181` |
| `PRD/sections/functional-requirements.md:4221` | - lexical retrieval is retained and never removed: it is the retrieval path under `EMBEDDI… | not this cap — historical 2026-09-05 benchmark measurement; recall@5 is a benchmark metric, not the production cap |
| `PRD/sections/functional-requirements.md:4240` | - Description: System 3 ranks supplemental rule excerpts by one blended score that combine… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/functional-requirements.md:4250` | - System 3 remains capped at 5 excerpts, still deduplicated against the curated System 2 s… | **amend** — slot `REQ-182` |
| `PRD/sections/functional-requirements.md:4264` | - measured at build, 2026-09-05, with the cross-reference boost in place (`npm run test:ev… | not this cap — historical 2026-09-05 benchmark measurement; recall@5 is a benchmark metric, not the production cap |
| `PRD/sections/functional-requirements.md:4325` | - the ten labelled eval fixtures (`cascade-keyword`, `combat-deathtouch`, `counterspell-st… | not this cap — question/notes character cap |
| `PRD/sections/functional-requirements.md:4337` | - measured 2026-09-07: the gold set holds 18 cases (6 pre-existing plus 12 seeded at build… | **amend** — slot `REQ-185` |
| `PRD/sections/functional-requirements.md:4339` | - measured 2026-09-07 (answer-quality run 3, cards attached): every tier-2 prompt carried … | not this cap — dated measured record of a past run; left as history |
| `PRD/sections/functional-requirements.md:4351` | - layer 2b, the blind ranking (`judgeBlindRanking`): for each gold case at each excerpt ca… | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4358` | - the judge never sees which excerpt-cap leg or which answer model produced an answer, in … | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4377` | - **Grounding (0–2)** — 2: the answer's reasoning uses the supplemental rule excerpts the … | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4380` | - the headline figure a run reports is the count of gold cases scoring Correctness 2, out … | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4400` | - Description: The answer-quality baseline is an explicitly invoked command, never schedul… | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4404` | - the answer models are a lineup, given as a repeatable `--model` option; the first-ship l… | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4405` | - the prompt is the one a player's lookup would get: `preparePromptInput` receives the com… | not this cap — deploy/infra limit |
| `PRD/sections/functional-requirements.md:4414` | - every run records, in the artifact (REQ-189): gold-set case ids, tiers, and count, the a… | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4427` | - REQ-190 (the excerpt-cap legs it runs) | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4430` | - measured 2026-09-07, offline, over the actual 18-case gold set (REQ-185) through the rea… | not this cap — dated measured record of a past run; left as history |
| `PRD/sections/functional-requirements.md:4432` | - measured 2026-09-07 (three live runs, $0.67 / $0.69 / $0.63 actual against the ≈$2.50 es… | **amend** — slot `REQ-188` |
| `PRD/sections/functional-requirements.md:4440` | - it carries: the run metadata REQ-188 requires (gold-set case ids, tier-1/tier-2 counts, … | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4442` | - the full transcripts — assembled prompt, the cards attached to the lookup, what System 3… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/functional-requirements.md:4458` | - measured 2026-09-07 (build): `artifact.test.ts` (15 tests) proves the round-trip, the no… | not this cap — dated measured record of a past run; left as history |
| `PRD/sections/functional-requirements.md:4461` | - Title: The System 3 excerpt cap is a parameter of the answer-quality run | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4463` | - Description: An answer-quality run may answer the same gold case at more than one System… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4465` | - the run accepts a repeatable `--excerpt-cap` option, defaulting to `[5, 10]`; each cap v… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4466` | - `apps/backend/src/prompt/preparation.ts` exports one named constant, `DEFAULT_SUPPLEMENT… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4468` | - a larger cap reuses the identical production ranking rather than re-ranking: `retrieveRu… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4469` | - the run artifact records the model and cap per leg and reports the headline correctness … | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4470` | - the deployed cap stays 5. Changing it requires a recorded run showing a larger cap score… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4473` | - NFR-002's under-three-second answer target is untouched: the larger cap exists only insi… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4474` | - the judge is not told which cap or which model produced an answer (REQ-186) | not this cap — cap-agnostic wording in the eval instrument; true at any cap value |
| `PRD/sections/functional-requirements.md:4477` | - REQ-181 (the five-excerpt cap and the retrieval seam) | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4481` | - measured 2026-09-07 (build): `preparation.ts` lines 228, 272, 317, and 355 each held the… | not this cap — dated measured record of a past run; left as history |
| `PRD/sections/functional-requirements.md:4482` | - the design brief's earlier measurement (2026-09-06, six committed CR cases only) found t… | not this cap — dated measured record of a past run; left as history |
| `PRD/sections/functional-requirements.md:4483` | - measured 2026-09-07 (run 3 of the answer-quality baseline, semantic ranking, tier-2 card… | **amend** — slot `REQ-190` |
| `PRD/sections/functional-requirements.md:4484` | - the driver's context note (`PRD/work/ai-answer-quality-baseline/intake/answer-quality-co… | not this cap — dated measured record of a past run; left as history |
| `PRD/sections/functional-requirements.md:4502` | - `OPERATOR.md` carries a recipe for starting a second idea while the first waits, and sta… | not this cap — graph per-node tool-call cap |
| `PRD/sections/functional-requirements.md:4573` | - the node table reads 8 `close` (`thejudge-cleanup`, sonnet, cap 120, advances to `land`)… | not this cap — graph per-node tool-call cap |
| `PRD/sections/system-map/prompt-assembly.md:25` | `ADDITIONAL RELEVANT RULE EXCERPTS` / System 3 -> `OFFICIAL RULINGS` / System 1 -> | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-assembly.md:32` | supplemental relevant rule excerpts, and System 1 provides WotC Oracle rulings for | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-assembly.md:50` | infrastructure remains visible while current caps avoid dropping full card metadata. | not this cap — layout/size cap |
| `PRD/sections/system-map/prompt-assembly.md:78` | populated non-stack zones. It adds curated rules, supplemental excerpts, and official | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-layout-spec.md:35` | \| 7 \| `GAME RULES (reference)` \| Curated core-rules excerpts (System 2) — state-gated b… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-layout-spec.md:36` | \| 8 \| `ADDITIONAL RELEVANT RULE EXCERPTS` \| Supplemental rule excerpts (System 3), rank… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-layout-spec.md:60` | \| `ADDITIONAL RELEVANT RULE EXCERPTS` \| conditional — present when System 3 retrieves ≥1… | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-layout-spec.md:77` | `ADDITIONAL RELEVANT RULE EXCERPTS` → `SCOPE` → `QUESTION`. | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-layout-spec.md:84` | `ADDITIONAL RELEVANT RULE EXCERPTS` → `CARD (looked up)` (both attached | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/prompt-layout-spec.md:89` | `ADDITIONAL RELEVANT RULE EXCERPTS` / `CARD`, before the next section) were | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/goals-and-non-goals.md:49` | - stack size is capped at 10 cards to reduce token use and abuse risk | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/goals-and-non-goals.md:61` | - **Mitigation (planned):** context-driven System 2 topic selection (DEC-045) reduces base… | not this cap — layout/size cap |
| `PRD/sections/goals-and-non-goals.md:71` | - saved sessions outside the narrowly scoped browser-local conversation history (DEC-124; … | not this cap — conversation-history retention cap |
| `PRD/sections/system-map/game-rules-retrieval.md:25` | ranks official rule excerpts and selects at most five. Ranking is hybrid: when the | **amend** — slot `system-map/game-rules-retrieval.md` |
| `PRD/sections/system-map/game-rules-retrieval.md:42` | and `ADDITIONAL RELEVANT RULE EXCERPTS`. | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/game-rules-retrieval.md:61` | curated game-rules topics, the rule excerpt index, token statistics, and keyword | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/game-rules-retrieval.md:73` | already in the System 2 set, and returns the top five excerpts plus debug data when | **amend** — slot `system-map/game-rules-retrieval.md` |
| `PRD/sections/system-map/game-rules-retrieval.md:75` | as curated rules, then supplemental excerpts, then official rulings. | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/game-rules-retrieval.md:97` | System 3 then retrieves more specific rule excerpts. It builds the query from the | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/game-rules-retrieval.md:100` | committed rule embeddings, so the excerpts that actually address deathtouch and | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/system-map/game-rules-retrieval.md:105` | supplemental block uses its five slots for additional relevant context rather than | **amend** — slot `system-map/game-rules-retrieval.md` |
| `PRD/sections/system-map/game-rules-retrieval.md:121` | - System 3 is capped at five supplemental excerpts per request. | **amend** — slot `system-map/game-rules-retrieval.md` |
| `PRD/sections/decisions/deployment.md:15` | - Lambda reserved concurrency is set when the account quota permits; otherwise the account… | not this cap — deploy/infra limit |
| `PRD/sections/decisions/deployment.md:31` | - Context: The committed Commander Spellbook combo artifacts (DEC-162) grow with the upstr… | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/trade-balancer/README.md:94` | stack: the stack duplicate-block (REQ-009 / FLOW-004) and the 10-card cap | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/trade-balancer/README.md:159` | - Printing picker: **region-scrolls** at about five to six rows, capped near | not this cap — layout/size cap |
| `PRD/sections/non-functional-requirements.md:23` | - **Mitigation (shipped):** context-driven System 2 topic selection (DEC-045) plus System … | not this cap — names System 3 relevance scoring with no count |
| `PRD/sections/non-functional-requirements.md:103` | - default run uses curated success fixtures: `full-context`, `cascade-keyword`, `state-bas… | not this cap — unrelated bound |
| `PRD/sections/non-functional-requirements.md:309` | - Measured 2026-09-07 (build): the gold set grew from 6 to 18 committed cases (REQ-185) wh… | **amend** — slot `NFR-018` |
| `PRD/sections/in-depth/README.md:118` | prompt-facing only, capped and control-character-guarded, and omitted from the | not this cap — question/notes character cap |
| `PRD/sections/in-depth/README.md:160` | "not supported yet" notice, and the stack is capped at 10 cards. The stack icon | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/in-depth/README.md:178` | card through the same add path (owner, duplicate-stack block, stack cap, | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/in-depth/README.md:291` | - Built: `gameStateNotes` is optional, trimmed, control-character-guarded, capped | not this cap — question/notes character cap |
| `PRD/sections/in-depth/README.md:302` | `ADDITIONAL RELEVANT RULE EXCERPTS` → `OFFICIAL RULINGS` → combo context (when | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/in-depth/README.md:324` | excerpts from committed artifacts, selected by DEC-045's always-on core plus | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/in-depth/README.md:329` | - Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules | **amend** — slot `in-depth/README.md` |
| `PRD/sections/in-depth/README.md:400` | - Stack cap: 10 cards; the 11th add is blocked (token-use/abuse guard). (DEC-008, | not this cap — 10-card stack cap (DEC-008) |
| `PRD/sections/in-depth/README.md:414` | - `gameStateNotes`: capped at 2000 characters, control-character-guarded. (REQ-031, | not this cap — question/notes character cap |
| `PRD/sections/in-depth/README.md:432` | - Supplemental rules: up to 5 excerpts (System 3), deduplicated against System 2. | **amend** — slot `in-depth/README.md` |
| `PRD/sections/in-depth/README.md:434` | - Combo variants: at most 5 selected per prompt — a relevance/noise cap | not this cap — Commander Spellbook combo-variant cap of five (REQ-094/095), a different number |
| `PRD/sections/in-depth/README.md:453` | per `screen-layout.md`'s five In-Depth rows. (DEC-145 via shared chrome, NFR-001) | not this cap — layout/size cap |
| `PRD/sections/in-depth/README.md:502` | - **Fixed `max-h-32` card-image cap and image-box-bound (`absolute inset-0`) | not this cap — layout/size cap |
| `PRD/sections/in-depth/README.md:553` | the full file lists, `PRD/sections/screen-layout.md`'s five `#### In-Depth —` rows | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:56` | state before submit, and can be removed individually. An add attempted past the cap is blo… | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:74` | excerpts the prompt uses — one source of truth, no hand-authored second copy. | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/quick-lookup/README.md:78` | expanding one row reveals its rule numbers and excerpt and auto-collapses any | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:79` | other open topic (accordion — at most one excerpt visible at a time). Reading a | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/quick-lookup/README.md:112` | available before bottom chrome, capped so the page itself never scrolls from | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:183` | per-message cap). The `question` character bound and control-character | not this cap — question/notes character cap |
| `PRD/sections/quick-lookup/README.md:214` | provided rule-excerpt sections and to present the relevant ones verbatim with | not this cap — names the supplemental section or excerpts with no count |
| `PRD/sections/quick-lookup/README.md:270` | carry, and returning a small capped set of the best-ranked rules. IDF-scored | not this cap — describes the capped set with no count |
| `PRD/sections/quick-lookup/README.md:276` | labelled fixtures lost their expected rule from the top five (REQ-181, | not this cap — historical 2026-09-05 benchmark measurement; "top five" there names the benchmark depth, not the production cap |
| `PRD/sections/quick-lookup/README.md:318` | This carries the composed string — the raw textarea is capped at the product | not this cap — unrelated bound |
| `PRD/sections/quick-lookup/README.md:322` | - Frontend display cap: the visible counter, textarea `maxLength`, and submit | not this cap — question/notes character cap |
| `PRD/sections/quick-lookup/README.md:327` | ending with assistant, per-message cap — shared with the main flow, not a | not this cap — unrelated bound |
| `PRD/sections/quick-lookup/README.md:329` | - Retrieval: System 3 returns a small capped best-ranked set (top 5), curated | **amend** — slot `quick-lookup/README.md` |
| `PRD/sections/quick-lookup/README.md:337` | - Card attach cap: the pre-submit card-attach strip accepts at most 5 cards | not this cap — 5-card attach limit (REQ-167) |
| `PRD/sections/quick-lookup/README.md:338` | (REQ-167); an add attempted past the cap is blocked with a stated limit | not this cap — unrelated bound |
| `PRD/sections/quick-lookup/README.md:343` | - Pre-submit card image fit: the shared card-shell image is capped at | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:349` | stacked image still holds the same per-image cap — confirmed unchanged by | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:352` | cap value. (DEC-160, REQ-129, REQ-141, REQ-167, `screen-layout.md`) | not this cap — layout/size cap |
| `PRD/sections/quick-lookup/README.md:382` | - **Cap and counter measured against the composed question string (original | not this cap — question/notes character cap |
| `PRD/sections/quick-lookup/README.md:385` | unreachable `323/300` submit state; REQ-134 moved the cap and counter to the | not this cap — question/notes character cap |
| `PRD/sections/shared-chrome/README.md:37` | Shared chrome is the sixth Phase A spec on purpose. The first five each had to | not this cap — unrelated bound |
| `PRD/sections/shared-chrome/README.md:221` | a browser-local, single-device history list, capped at the **20 most recent** | not this cap — conversation-history retention cap |
| `PRD/sections/shared-chrome/README.md:242` | Draft does not count toward the 20-entry cap. Opening a saved conversation from | not this cap — conversation-history retention cap |
| `PRD/sections/shared-chrome/README.md:248` | thread. The prune-at-20 cap is preserved; Draft rows are not deletable via this | not this cap — conversation-history retention cap |
| `PRD/sections/shared-chrome/README.md:295` | **relative to its container** (not a fixed pixel cap), so each surface grows to what its | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:300` | `screen-layout.md` row records a bounded cap — never a component fork or size prop. | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:344` | caps so ultra-wide screens produce no content-less bands; inner panels/workspaces | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:346` | of viewport width (minus page padding); tablet/desktop shell ≈ 92%, capped at | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:360` | % / cap over inventing a one-off full-bleed layout mid-bugfix. (DEC-149) | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:370` | column), and the cap still binds on ultra-wide displays. (DEC-145, REQ-124, | not this cap — unrelated bound |
| `PRD/sections/shared-chrome/README.md:382` | full-height at every viewport, no `max-height` cap. Completed-history retention: 20 | not this cap — conversation-history retention cap |
| `PRD/sections/shared-chrome/README.md:385` | - View Context overlay: phone bottom sheet caps so a dismissible scrim of **≥25% of | not this cap — unrelated bound |
| `PRD/sections/shared-chrome/README.md:400` | no `max-h-32` pixel cap; shell-column surfaces render ~300px at 390×844 (REQ-141's | not this cap — question/notes character cap |
| `PRD/sections/shared-chrome/README.md:403` | records a bounded cap on its own catalog row. (DEC-160, REQ-141) | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:431` | Menu mid-game). DEC-137 capped the interactive box to the painted affordance and made hit-… | not this cap — unrelated bound |
| `PRD/sections/shared-chrome/README.md:453` | - **A bordered-panel chat thread capped at `max-h-96`; a fixed-viewport composer — closed … | not this cap — layout/size cap |
| `PRD/sections/shared-chrome/README.md:459` | - **A fixed `max-h-32` pixel cap on the shared card image — closed door.** It produced an … | not this cap — layout/size cap |
