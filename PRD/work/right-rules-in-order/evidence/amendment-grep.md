# Amendment-set grep — right-rules-in-order

What this is: the one line-level grep that enumerates every current-truth line
this change could contradict, and one disposition row per hit. Run at `define`,
2026-10-11, on branch `thejudge-auto/right-rules-in-order` (base `61d32c76` plus
the two kickoff docs commits; `PRD/sections/` identical to `61d32c76`).

## Command

```sh
P='all-MiniLM|Hugging Face|model cache|models/Xenova|HYBRID_BLEND_ALPHA|alpha = 0\.60|name, type line, and keyword|compact per-card signal|compact signal|PHASE GUIDANCE|OFFICIAL RULINGS|ADDITIONAL RELEVANT RULE EXCERPTS|shared vocabulary|reference vocabulary|the following rules|Card names and keywords never|card names and keywords never|ascending rule ID|model to S3|moved to S3|power, toughness|phrasing glossary\)|keyword vocabulary|Delayed Triggered|EMBEDDING_PROVIDER=openai|stack\[0\]|game-state-gated|`supertypes`, `subtypes`|supertypes/subtypes'
grep -rnE "$P" PRD/sections | sort -t: -k1,1 -k2,2n
```

Result: **100 hits** in 12 files. Each pattern names one invariant the change
touches: the shipped model's name and cache path, the blend weight, the compact
query signal, phase guidance, rulings placement, the excerpt section, the
"shared vocabulary" framing, lead-in lists, the card-names/keywords rule for
curated topics, the tie-break, the S3 constraint, card power/toughness, the
glossary pointer, the keyword vocabulary, the delayed-trigger topic, the OpenAI
seam, stack numbering, zone-gated topics, and the card-field lists.

Dispositions: **70 amend**, **5 build**, **25 no change**.

- *amend* — the line is rewritten by a slot in `GATE-QUESTIONS.md` (named in the row).
- *build* — the line is a dated verification record that `build` re-runs and rewrites from real output; the slot gives the expected result.
- *no change* — the line stays true after this change, for the reason given.

## Hit list and dispositions

| # | File:line (under `PRD/sections/`) | Hit (trimmed) | Disposition | Slot / reason |
| --- | --- | --- | --- | --- |
| 1 | decisions.md:45 | DEC-004 retired — stack ordering bottom-to-top, `stack[0]` as bottom | no change | Retired historical index; never edited (decision log retired). The request array convention is unchanged. |
| 2 | decisions.md:77 | DEC-036 retired — every prompt includes a `PHASE GUIDANCE` block | no change | Retired historical index; the live truth is REQ-024, amended. |
| 3 | decisions.md:86 | DEC-045 retired — always-on core plus card-agnostic game-state-gated expansion | no change | Retired historical index; the live truth is REQ-022, amended. |
| 4 | functional-requirements.md:81 | REQ-006 — `stack[0]` is the bottom of the stack | no change | Request-array convention, unchanged. REQ-243 only makes the prompt's own wording use one (1-based) numbering. |
| 5 | functional-requirements.md:366 | REQ-022 — topics selected per DEC-045 (always-on core plus game-state-gated expansion) and REQ-220 | amend | REQ-022 (In-Depth topic choice by card wording and question, REQ-242). |
| 6 | functional-requirements.md:368 | REQ-022 — section appears after populated zone sections and before `OFFICIAL RULINGS` | amend | REQ-022 (rulings move under each card, REQ-241). |
| 7 | functional-requirements.md:369 | REQ-022 — disclaimer that rules are shared vocabulary | amend | REQ-022 (rules framed as binding, one shared statement, REQ-243). |
| 8 | functional-requirements.md:377 | REQ-022 — `ADDITIONAL RELEVANT RULE EXCERPTS` with up to 10 rules | amend | REQ-022 (2 of the 10 reserved for per-card search; list items outside the 10). |
| 9 | functional-requirements.md:379 | REQ-022 — supplemental section before `OFFICIAL RULINGS` | amend | REQ-022 (REQ-241). |
| 10 | functional-requirements.md:382 | REQ-022 — query is question plus compact per-card signal | amend | REQ-022 (concept terms, In-Depth turn step, per-card search). |
| 11 | functional-requirements.md:388 | REQ-022 — no per-request external call; bundled local model | amend | REQ-022 (packaged trained model; still no per-request call). |
| 12 | functional-requirements.md:389 | REQ-022 — System 2 uses game-state signals plus exactly one card signal | amend | REQ-022 (REQ-242). |
| 13 | functional-requirements.md:430 | REQ-024 — Description: every prompt includes `PHASE GUIDANCE` | amend | REQ-024 (Quick Lookup gets the step summary; facts corrected; REQ-238). |
| 14 | functional-requirements.md:432 | REQ-024 — `PHASE GUIDANCE` between `GENERAL GAME CONTEXT` and zones | amend | REQ-024. |
| 15 | functional-requirements.md:565 | REQ-030 — every card block includes `oracleText` … `subtypes`, `targets`, `contextNotes` | amend | REQ-030 (power/toughness/loyalty lines; oracle line breaks kept; REQ-245). |
| 16 | functional-requirements.md:584 | REQ-031 — `ADDITIONAL GAME STATE` before `PHASE GUIDANCE` | no change | In-Depth section order before the zones is unchanged. |
| 17 | functional-requirements.md:1783 | REQ-074 — attached card: metadata, rulings, compact signal | amend | REQ-074 (rulings under the card; concept terms; per-card search). |
| 18 | functional-requirements.md:1784 | REQ-074 — lookup omits zone sections, `PHASE GUIDANCE` | amend | REQ-074 (step summary when the question names a step, REQ-238). |
| 19 | functional-requirements.md:3924 | REQ-167 — lookup card entries carry identity only | no change | Request shape unchanged. |
| 20 | functional-requirements.md:3927 | REQ-167 — System 3 scores question plus compact signal; no longer scores full oracle text | amend | REQ-167 (per-card search reads each card's own text for 2 reserved slots). |
| 21 | functional-requirements.md:3970 | REQ-168 note — mechanic-definition corpus is not built here | no change | Historical note; REQ-168's instruction stays satisfied after REQ-243 removes the dangling glossary pointer. |
| 22 | functional-requirements.md:4094 | REQ-174 — frontend card metadata carries only tile fields | no change | Power/toughness/loyalty stay backend-only; the up-front payload gains nothing. |
| 23 | functional-requirements.md:4123 | REQ-175 — card-detail map values carry `oracleText` … `subtypes` | no change | The route's block is unchanged; backend-only extras are specified by the requirement that adds them (REQ-245), as REQ-180 did for `keywords`. |
| 24 | functional-requirements.md:4154 | REQ-176 — backend resolves `oracleText` … `subtypes` by `cardId` | amend | REQ-176 (also resolves power, toughness, loyalty). |
| 25 | functional-requirements.md:4192 | REQ-177 note — unwarmed model cache printed the lexical figure | no change | Historical measurement; the silent-substitution guard stays. |
| 26 | functional-requirements.md:4197 | REQ-178 — Description: query is question plus compact per-card signal | amend | REQ-178 (concept terms and turn step allowed; raw card text still banned from the main query). |
| 27 | functional-requirements.md:4199 | REQ-178 — query carries question and name, type line, keyword list | amend | REQ-178. |
| 28 | functional-requirements.md:4208 | REQ-178 — keyword lists come from the vocabulary, later REQ-180 | no change | Historical sequencing statement; S1 is carried by REQ-180's amendment. |
| 29 | functional-requirements.md:4248 | REQ-179 note — out of scope: expanding a rule that ends "the following rules:" | amend | REQ-179 (note records that REQ-240 now takes this up). |
| 30 | functional-requirements.md:4275 | REQ-180 note — power, toughness, loyalty dropped, out of scope | amend | REQ-180 (note points to REQ-245). |
| 31 | functional-requirements.md:4286 | REQ-181 — `EMBEDDING_PROVIDER=openai` seam-selectable | amend | REQ-181 (a dimension mismatch is loud, never a silent lexical fallback). |
| 32 | functional-requirements.md:4300 | REQ-181 — shipped provider is `all-MiniLM-L6-v2` | amend | REQ-181 (the Magic-trained MiniLM, REQ-236/237). |
| 33 | functional-requirements.md:4345 | REQ-182 note — alpha 0.60 chosen | amend | REQ-182 (weight 0.65; history kept). |
| 34 | functional-requirements.md:4364 | REQ-183 — the model is not moved to S3 or fetched at cold start | amend | REQ-183 (model stored in private S3, fetched at packaging, never at cold start). |
| 35 | functional-requirements.md:4372 | REQ-183 note — moving the model to S3 frees the warmed cache | no change | Historical measurement note; the constraint amendment carries the change. |
| 36 | functional-requirements.md:4383 | REQ-184 — packaging refuses without `models/Xenova/all-MiniLM-L6-v2/...` | amend | REQ-184 (guard points at the trained model; S3 fetch with hash check). |
| 37 | functional-requirements.md:4386 | REQ-184 — local dev with no warmed cache answers lexically | no change | Still true; the unset default stays `mock`. |
| 38 | functional-requirements.md:4396 | REQ-184 note — empty model cache returned lexical numbers | no change | Historical measurement. |
| 39 | functional-requirements.md:5815 | REQ-220 — added alongside game-state-gated topics | amend | REQ-220 (alongside the topics REQ-242 selects). |
| 40 | functional-requirements.md:5817 | REQ-220 — System 3 query never oracle text | amend | REQ-220 (concept terms and per-card search now read card wording). |
| 41 | functional-requirements.md:5822 | REQ-220 — card wording selects this one topic only | amend | REQ-220 (REQ-242 selects In-Depth topics by card wording too). |
| 42 | in-depth/README.md:181 | `stack[0]` is the bottom (UI stack order) | no change | Stack-building UI unchanged. |
| 43 | in-depth/README.md:353 | ordered sections … `PHASE GUIDANCE` → zones → `GAME RULES` → | amend | In-Depth feature spec slot. |
| 44 | in-depth/README.md:354 | `ADDITIONAL RELEVANT RULE EXCERPTS` → `OFFICIAL RULINGS` → combo | amend | In-Depth feature spec slot (rulings under each card). |
| 45 | in-depth/README.md:360 | `PHASE GUIDANCE` sits between general context and zones | amend | In-Depth feature spec slot (corrected step facts). |
| 46 | in-depth/README.md:377 | System 2 gated on `turnPhase`, `combatStep`, populated zones | amend | In-Depth feature spec slot (REQ-242). |
| 47 | in-depth/README.md:380 | card names and keywords never select a topic | amend | In-Depth feature spec slot. |
| 48 | in-depth/README.md:383 | `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 10 | amend | In-Depth feature spec slot. |
| 49 | in-depth/README.md:390 | query: name, type line, keywords, not full oracle text | amend | In-Depth feature spec slot. |
| 50 | in-depth/README.md:394 | `OFFICIAL RULINGS` carries rulings for submitted cards | amend | In-Depth feature spec slot. |
| 51 | in-depth/README.md:537 | rejected alternative: all-topics baseline replaced by game-state-gated expansion | no change | Historical rejected alternative; still rejected. |
| 52 | integrations-and-data.md:17 | Embedding Provider: `local` → bundled `all-MiniLM-L6-v2` | amend | integrations-and-data slot. |
| 53 | integrations-and-data.md:53 | `ZoneCardItem`: descriptive block no longer in the request | no change | Request unchanged. |
| 54 | integrations-and-data.md:128 | `stack[0]` represents the bottom of the stack | no change | Request-array convention unchanged. |
| 55 | integrations-and-data.md:148 | `GET /api/cards/:oracleId` serves the descriptive block | no change | Route block unchanged. |
| 56 | integrations-and-data.md:251 | card-detail map value fields | amend | integrations-and-data slot: a backend-only power/toughness/loyalty bullet is added beside the `keywords` bullet; this line itself is unchanged. |
| 57 | integrations-and-data.md:273 | per-rule embeddings produced by a quantised `all-MiniLM-L6-v2` | amend | integrations-and-data slot. |
| 58 | integrations-and-data.md:355 | `ADDITIONAL GAME STATE` before `PHASE GUIDANCE` | no change | Unchanged. |
| 59 | integrations-and-data.md:356 | `PHASE GUIDANCE` always present for a valid phase | amend | integrations-and-data slot (Quick Lookup gets it when a step is named). |
| 60 | integrations-and-data.md:358 | populated zone card block field list | amend | integrations-and-data slot (power/toughness/loyalty, line breaks, rulings under the card). |
| 61 | integrations-and-data.md:363 | curated topics per DEC-045 game-state-gated expansion | amend | integrations-and-data slot. |
| 62 | integrations-and-data.md:364 | up to 10 supplemental excerpts, compact query | amend | integrations-and-data slot. |
| 63 | integrations-and-data.md:373 | general game rules only as reference vocabulary | amend | integrations-and-data slot (binding framing). |
| 64 | integrations-and-data.md:400 | game rules: topics per DEC-045 game-state-gated expansion | amend | integrations-and-data slot. |
| 65 | integrations-and-data.md:402 | game rules appear before `OFFICIAL RULINGS` | amend | integrations-and-data slot. |
| 66 | integrations-and-data.md:435 | follow-up prompt includes phase guidance | no change | Still true. |
| 67 | non-functional-requirements.md:295 | NFR-017 note — onnxruntime platforms, warmed model cache | no change | Historical measurement; model size unchanged. |
| 68 | non-functional-requirements.md:297 | NFR-017 note — not by moving the model to S3 | amend | NFR-017 (model now stored in private S3, fetched at packaging; size unchanged). |
| 69 | open-questions.md:4 | Q-001 question — keyword vocabulary | no change | Answered question; history. |
| 70 | open-questions.md:5 | Q-001 context — curated keyword vocabulary | no change | History; the vocabulary's trim to 14 words is REQ-233. |
| 71 | quick-lookup/README.md:208 | rulings under one `CARD (looked up)` / `OFFICIAL RULINGS` heading per section | amend | Quick Lookup feature spec slot. |
| 72 | quick-lookup/README.md:210 | query signal: name, type line, keywords | amend | Quick Lookup feature spec slot. |
| 73 | quick-lookup/README.md:286 | query: name, type line, keywords, not oracle text | amend | Quick Lookup feature spec slot. |
| 74 | quick-lookup/README.md:354 | measured bounds: query composition | amend | Quick Lookup feature spec slot. |
| 75 | system-map.md:81 | System 2 summary: game-state-gated topics | amend | system-map.md slot. |
| 76 | system-map.md:88 | System 3 summary: compact signal, hybrid ranking | amend | system-map.md slot. |
| 77 | system-map/game-rules-retrieval.md:10 | System 1 emits `OFFICIAL RULINGS` | amend | game-rules-retrieval slot. |
| 78 | system-map/game-rules-retrieval.md:19 | Card names and keywords never affect System 2 | amend | game-rules-retrieval slot. |
| 79 | system-map/game-rules-retrieval.md:25 | compact per-card signal | amend | game-rules-retrieval slot. |
| 80 | system-map/game-rules-retrieval.md:42 | ties: highest signal, then ascending rule ID | amend | game-rules-retrieval slot (rule-book order comparator). |
| 81 | system-map/game-rules-retrieval.md:46 | never printed in both rules sections | no change | Exact-number deduplication unchanged. |
| 82 | system-map/game-rules-retrieval.md:52 | bundled `all-MiniLM-L6-v2` in about 2ms | amend | game-rules-retrieval slot. |
| 83 | system-map/game-rules-retrieval.md:116 | prompt omits `OFFICIAL RULINGS` when no match | amend | game-rules-retrieval slot. |
| 84 | system-map/game-rules-retrieval.md:140 | only `EMBEDDING_PROVIDER=openai` adds a per-request call | amend | game-rules-retrieval slot (dimension mismatch is loud). |
| 85 | system-map/prompt-assembly.md:23 | order: `PHASE GUIDANCE` → zones … | amend | prompt-assembly slot. |
| 86 | system-map/prompt-assembly.md:25 | → `OFFICIAL RULINGS` / System 1 → | amend | prompt-assembly slot. |
| 87 | system-map/prompt-assembly.md:77 | worked example order | amend | prompt-assembly slot (the paragraph's rulings sentence). |
| 88 | system-map/prompt-layout-spec.md:33 | row 5 `PHASE GUIDANCE` — game mode only | amend | prompt-layout-spec slot. |
| 89 | system-map/prompt-layout-spec.md:36 | row 8 `ADDITIONAL RELEVANT RULE EXCERPTS` | amend | prompt-layout-spec slot. |
| 90 | system-map/prompt-layout-spec.md:38 | row 10 `OFFICIAL RULINGS` | amend | prompt-layout-spec slot. |
| 91 | system-map/prompt-layout-spec.md:57 | matrix `PHASE GUIDANCE` row | amend | prompt-layout-spec slot. |
| 92 | system-map/prompt-layout-spec.md:60 | matrix excerpts row | amend | prompt-layout-spec slot. |
| 93 | system-map/prompt-layout-spec.md:62 | matrix `OFFICIAL RULINGS` row | amend | prompt-layout-spec slot. |
| 94 | system-map/prompt-layout-spec.md:76 | 2026-08-30 verification: game mode order | build | Re-run `npm run prompt:preview` at build; rewrite the dated record from real output (REQ-169). |
| 95 | system-map/prompt-layout-spec.md:77 | 2026-08-30 verification: … → `SCOPE` → `QUESTION` | build | As row 94. |
| 96 | system-map/prompt-layout-spec.md:84 | 2026-08-30 verification: lookup order | build | As row 94. |
| 97 | system-map/prompt-layout-spec.md:88 | 2026-08-30 verification: combo and rulings position | build | As row 94. |
| 98 | system-map/prompt-layout-spec.md:89 | 2026-08-30 verification: after excerpts / `CARD` | build | As row 94. |
| 99 | user-flows.md:257 | FLOW-011 step 7 — lookup prompt: name, type line, keywords, not oracle text | amend | FLOW-011. |
| 100 | user-flows.md:527 | FLOW-023 step 5 — lookup prompt: rulings, compact query | amend | FLOW-023. |

## Lines amended that the grep did not catch

Found while writing the diffs, recorded so the set is complete:

- `PRD/sections/in-depth/README.md` lines 365–371 — the per-card field list wraps across lines, so the `supertypes`, `subtypes` pattern missed it. Amended in the In-Depth slot.
- `PRD/sections/system-map/prompt-layout-spec.md` row 1 (`SYSTEM ROLE PREAMBLE`), row 2 (`INSTRUCTIONS`), row 3 (`MTG REFERENCE`) and the matching matrix rows — "identical text on every path" stops being true (REQ-243). Amended in the prompt-layout-spec slot.
- `PRD/sections/system-map/game-rules-retrieval.md` invariants bullet on System 2 (line 122–125) — amended with line 19 in the same slot.
- `PRD/sections/integrations-and-data.md` "WotC rulings prompt enrichment must" list (lines 396–399) — placement bullet amended in the same slot.
- `PRD/sections/functional-requirements.md`, other lines inside requirements the grep already reached: REQ-022's Description and its "fixed on/off switch" constraint; REQ-074's MTG-reference criterion; REQ-178's Notes; REQ-179's Description and criteria; REQ-180's union criterion; REQ-181's artifact criterion; REQ-182's `mock` byte-identical criterion. Each is in that requirement's slot.
- `PRD/sections/functional-requirements.md` REQ-190 — its larger-cap criterion assumes one ranked list; per-card reserved slots (REQ-235) need a rule. Amended in its own slot.
- `PRD/sections/quick-lookup/README.md` lines 200–203 (always-run bullet naming the static reference block) and 359–361 (measured bound for the reference block); `PRD/sections/in-depth/README.md` lines 358–359 (static reference block) and 493–494 (supplemental bound); `PRD/sections/integrations-and-data.md` line 366 (static reference block) and line 372 (rulings framing). Amended in their files' slots.
- `PRD/sections/functional-requirements.md` REQ-232 — the suite constraints ("nothing from the suite enters a player's prompt", "never a build gate") are touched by training on the suite; no pattern names them. Amended in its own slot.
