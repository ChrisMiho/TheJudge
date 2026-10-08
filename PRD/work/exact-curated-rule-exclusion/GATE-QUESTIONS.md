# Gate questions — exact-curated-rule-exclusion

**Decide:** five items. Answer each verdict slot below (accept, edit, or
reject; a reason is required for edit or reject), then merge the docs PR to
start the build.

- `REQ-179` (amended) — the fix. The rule search stops hiding a curated rule's
  sub-rules. It skips only the exact rules a curated topic prints. A data test
  keeps that safe, and the slot records what this does not do.
- `REQ-022` (amended) — the rules-in-every-prompt requirement stops saying
  "prefix".
- `REQ-181` (amended) — the meaning-based rule search requirement stops saying
  "prefix".
- `REQ-182` (amended) — the blended rule-search requirement stops saying
  "prefix".
- `REQ-220` (amended) — the replacement-effects topic's rationale stops
  describing the old prefix rule. The topic itself is unchanged.

Recommendation: accept all five. The last four are wording that follows from
`REQ-179`; rejecting `REQ-179` means rejecting them too.

Full evidence, every decision with its source, and the line-level amendment
set (47 rows): `DESIGN-BRIEF.md` in this folder.

## REQ-179 — the rule search stops hiding sub-rules the prompt never shows

**What this decides:** whether the rule search may show a sub-rule (such as
603.2e) when a curated rules topic lists only its parent rule (603.2) and
prints only the parent's one sentence.

**In plain terms:** every prompt carries two kinds of official rules text.
System 2 is a small set of curated rules topics, picked by the game situation;
four of them are always on. System 3 is a scored search that adds up to ten
more rule excerpts that fit the question. So no rule prints twice, System 3
skips rules a selected topic already carries. REQ-179 says today that it skips
by "rule-number prefix": when a topic lists 603.2, System 3 also skips 603.2a
through 603.2h. That assumed the topic prints those sub-rules. It does not.
Every one of the 24 curated topics prints exactly the rules it lists and
nothing else. The always-on triggered-ability topic lists 603.1, 603.2 and
603.3 and prints only those three sentences.

So today 41 sub-rules can never reach the AI on any card-lookup question,
by either route — 603.1a–b, 603.2a–h, 603.3a–d, 117.1a–d, 117.3a–d,
115.1a–e, 115.10a–b, 400.7a–k and 400.7m. Across all 24 topics the count is
125 different sub-rules, those 41 included: each is barred whenever the topic
listing its parent is picked, and no topic prints any of them. A player who
asks "does a 'becomes tapped' trigger fire when the permanent enters tapped?"
gets an AI that never sees 603.2e, the one rule that says it doesn't.

This change makes System 3 skip only the exact rule numbers a selected topic
lists. A sub-rule the topic does not print competes like any other rule. Both
search paths change the same way: the blended search the app ships, and the
word-match search used offline and as the fallback. Lookup and game questions
change alike. A new data test checks that every topic prints exactly the rules
it lists, so if a topic ever starts printing an unlisted rule, the test fails
and this rule gets revisited before anything prints twice.

Measured offline on today's code and data (the probe behind this package,
2026-10-07): in the blended search the app ships, ranked the way the rules gate
ranks it, 603.2e ranks first for the "becomes tapped" case and 603.2g first
for the "prevented damage doesn't trigger" case. That is the check this slot
sets. The word-match search was not measured for these two cases; the build
records how it does on them, without making it a pass/fail check. Rules test cases with every
deciding rule in the prompt go 293 → 295 of 392. No rule that reaches the
prompt today is lost. Three of the 31 stored test prompts change, each by one
rule swapped. The prompt's typical size doesn't move (largest growth 465
characters).

The slot also records what this does not do, decided here. There is no
keyword-to-defining-rule lookup: in 62 of the 63 keyword cases it would help
on, the official ruling the case was written from already answers the
question. Rules that end "…the following rules:" are not expanded into their
sub-rules. The ten-excerpt cap stays. No curated topic is added or changed.
That includes the always-on stack topic, whose rule 117.3 ends "determined by
the following rules:" with nothing after it. This change lets 117.3a–d
compete in the search, but adding them to the topic would cost 884 characters
on every prompt, so that stays a follow-up.

If the open data refresh (PR #273, new rules text) merges first, the build
re-measures every number here on the new text and records those instead. The
"two cases close, nothing lost" checks stay the gate either way.

**What happens if you say no:** System 3 keeps skipping every sub-rule of a
curated parent. The two trigger questions keep reaching the AI without their
deciding rule, and the four amendments below have nothing to follow.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-179`:

```diff
-- Description: The committed Comprehensive Rules index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule text; and System 3's exclusion of rules already shown in the curated baseline matches by rule-number prefix rather than exact id, so a curated parent rule no longer lets its own lettered sub-rules reappear as supplemental excerpts.
+- Description: The committed Comprehensive Rules index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule text; and System 3 excludes from its supplemental excerpts exactly the rule numbers the selected curated topics list — the rules whose text those topics print — so a lettered sub-rule whose parent a curated topic lists, but which the topic does not print, competes for System 3's slots like any other rule.
```

```diff
-  - System 3 excludes a candidate rule when its id or any of its parent rule ids is already selected by the curated baseline, replacing today's exact-id-only exclusion
+  - System 3 excludes a candidate rule only when its own id is one of the rule numbers a selected curated topic lists in `gameRulesTopicManifest.json`; a candidate whose parent rule a selected topic lists, but which that topic does not list itself, is ranked and selected like any other rule. The same rule holds on the hybrid path and on the lexical path (the mock/offline default and the embedding-failure fallback), in lookup mode and in game mode, through the one shared retrieval path
+  - a test over the committed game-rules data asserts that every curated topic's excerpt in `gameRulesByTopic.json` carries the full text of each rule it lists and the full text of no other rule in `gameRulesRuleIndex.json`, so a topic that ever carries a rule it does not list fails the test and this exclusion is revisited, rather than the prompt printing that rule twice
+  - the offline evidence trace's report that System 3 skipped a deciding rule because a curated topic carries it (REQ-229) applies the same exact-id rule
+  - for the approved rules test cases `triggers-becomes-tapped-not-entering-tapped` (deciding rule 603.2e: an ability that triggers when a permanent "becomes tapped" doesn't trigger if it enters the battlefield tapped) and `triggers-damage-prevented-no-trigger` (deciding rule 603.2g), the deciding rule is a System 3 excerpt in the prompt under hybrid ranking from the case's committed frozen query vector, as the rules gate (REQ-222) ranks it; under lexical ranking (the mock/offline default) the two cases' result is recorded at build, not gated
+  - no rule that reached the prompt before this change is lost: the rules gate (REQ-222) passes with no regression, and its baseline is raised in the same change with `npm run eval:rules-gate:baseline`, without `--allow-regressions`
+  - measured targets, from the 2026-10-07 measurement on commit `f98b8feb` (offline, committed frozen query vectors, local embedder for the hybrid rows): rules test cases with every deciding rule reaching the prompt as a System 3 excerpt or through a curated topic 293 → 295 of 392; `npm run eval:worked-solutions` 287 → 289 of 392; first-ship cases in System 3 under hybrid ranking 16/18 → 16/18, the same two misses; under lexical ranking 14/18 before (REQ-220's 2026-10-07 record), the after-value recorded at build, not targeted; the context-evaluation harness's labelled System 3 checks 14/14 semantic and 14/14 lexical, unchanged; exactly three of the 31 prompt goldens change — `commander-spellbook-lookup-attached-intent` (614.10a out, 115.1b in), `commander-spellbook-wrong-zone` (500.10a out, 117.3a in), `upkeep-trigger` (609.7a out, 603.3b in) — each regenerated as a reviewed consequence of admitting a sub-rule, never a silent update; the retrieval benchmark's recall@5 is unchanged (both of its scorers rank with an empty curated exclusion set). If the Comprehensive Rules text in the committed index changes before this ships, these values are re-measured on the new index and recorded instead; the two criteria above stay the gate
```

and the last `- Acceptance Criteria:` bullet:

```diff
-  - `npm run test:eval` stays green; any golden prompt change is an intentional, reviewed consequence of removing a junk excerpt, never a silent update
+  - `npm run test:eval` stays green; any golden prompt change is an intentional, reviewed consequence of removing a junk excerpt or of admitting a sub-rule that a curated topic lists the parent of but does not print, never a silent update
```

and under `- Constraints:`, as the last bullet:

```diff
+  - the exact-rule-id, parent-rule-id and cross-reference ranking boosts (REQ-181, REQ-182) are unchanged, and no curated topic's rule numbers or text change
```

and under `- Dependencies:`, after `  - REQ-022 (the System 3 enrichment requirement whose corpus this cleans)`:

```diff
+  - REQ-222 (the rules gate whose baseline holds the exclusion change)
+  - REQ-229 (the evidence trace that mirrors the exclusion rule)
```

and as the last bullets of `- Notes:`:

```diff
+  - amended by `exact-curated-rule-exclusion`: the exclusion originally matched by rule-number prefix — a candidate was excluded when its id or any of its parent rule ids was selected by the curated baseline — on the premise that a curated topic carries its listed parent's lettered sub-rules. It does not: measured 2026-10-07 on `f98b8feb` over all 24 curated topics, every topic carries exactly the rules it lists, none missing and none extra (the always-on `abilities-trigger-basics` topic lists 603.1, 603.2 and 603.3 and prints only those three parent sentences, an 803-character excerpt). Prefix exclusion therefore kept 41 sub-rules out of every lookup prompt by any route — 603.1a–b, 603.2a–h, 603.3a–d, 117.1a–d, 117.3a–d, 115.1a–e, 115.10a–b, 400.7a–k and 400.7m — and, across all 24 topics, 125 distinct sub-rules that no topic lists (those 41 included), each barred whenever the topic listing its parent was selected (127 counted topic by topic: 120.3f and 614.1a are each barred by one topic and listed by another). Excluding exactly the rules whose text a topic carries selects the same set on today's data; the data test above keeps the two equal. Whole-prompt size change over the corpus: median 0, p95 +79, max +465, mean −30 characters (median prompt 14,306). 58 cases' System 3 picks change (76 picks displaced, none a deciding rule)
+  - out of scope, decided at the `exact-curated-rule-exclusion` define gate: a keyword → defining-rule lookup (measured: in 62 of the 63 keyword cases whose deciding rule never reaches the prompt, the verbatim official ruling the case was written from already answers it); expanding a rule that ends "the following rules:" into its sub-rules; rules-corpus label hygiene; raising the System 3 cap; any new curated topic. The always-on `stack-and-priority` topic prints 117.3, which ends "determined by the following rules:" with nothing after it; this change lets 117.3a–d compete in System 3 but does not add them to the topic (884 characters on every prompt) — a recorded follow-up
```

**Proposed diff** — `PRD/sections/system-map/game-rules-retrieval.md`, `## How it works` (lines 42–45):

```diff
-signal, then ascending rule ID. Before output is selected, System 3 excludes rule IDs already selected by
-System 2 — by rule-number prefix, so a curated parent rule also excludes its lettered
-sub-rules — and the prompt does not print the same rule in both `GAME RULES (reference)`
-and `ADDITIONAL RELEVANT RULE EXCERPTS`.
+signal, then ascending rule ID. Before output is selected, System 3 excludes rule IDs already selected by
+System 2 — exactly the rule numbers the selected topics list, because a topic prints only
+the rules it lists; a lettered sub-rule of a listed parent that the topic does not list
+competes like any other rule (REQ-179) — and the prompt does not print the same rule in
+both `GAME RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS`.
```

`## Data flow` (lines 75–76):

```diff
-exact-rule-ID boost merged in, drops entries whose rule IDs or parent rule IDs are
-already in the System 2 set, and returns the top ten excerpts plus debug data when
+exact-rule-ID boost merged in, drops entries whose own rule ID is already in the
+System 2 set (a listed parent rule ID does not drop its sub-rules), and returns the
+top ten excerpts plus debug data when
```

`## Worked example` (lines 106–109):

```diff
-through the merged boost. If a combat damage rule is already present in the System 2
-topic set, that rule ID and its lettered sub-rules are excluded from System 3 so the
-supplemental block uses its ten slots for additional relevant context rather than
-duplicating the baseline.
+through the merged boost. If a combat damage rule is already listed in the System 2
+topic set, that exact rule ID is excluded from System 3 so the supplemental block uses
+its ten slots for additional relevant context rather than duplicating the baseline; the
+rule's lettered sub-rules, which the topic does not print, still compete for those slots.
```

`## Invariants / gotchas` (lines 124–125):

```diff
-- System 3 is deduplicated against the System 2 selection, so the same rule ID never
-  appears once as curated baseline and again as supplemental retrieval.
+- System 3 is deduplicated against the System 2 selection by exact rule ID, so the same
+  rule ID never appears once as curated baseline and again as supplemental retrieval.
+  Exact matching is enough only because each curated topic prints exactly the rules it
+  lists; a test over the committed game-rules data holds every topic to that and fails
+  if a topic ever carries a rule it does not list (REQ-179).
```

**Proposed diff** — `PRD/sections/system-map.md`, `### Supplemental retrieval (System 3)`, the `- Summary:` line's last sentence:

```diff
-- Summary: Selects up to 10 supplemental rule excerpts per request (raised from 5 on 2026-09-09, REQ-190). The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings blended with normalised lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by rule-number prefix.
+- Summary: Selects up to 10 supplemental rule excerpts per request (raised from 5 on 2026-09-09, REQ-190). The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is a hybrid score — normalised cosine over committed per-rule embeddings blended with normalised lexical IDF overlap — with the exact-rule-id boost merged in; lexical scoring alone is retained as the mock/offline default and the failure fallback. Deduplicated against the System 2 selection by exact rule number: only the rules the selected topics list are excluded.
```

**Proposed diff** — `PRD/sections/integrations-and-data.md`, `### Prompt assembly (ordered sections)` (line 364):

```diff
-- up to 10 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
+- up to 10 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked by a hybrid blend of normalised cosine against the committed per-rule embeddings and normalised lexical IDF overlap, with the exact-rule-id boost merged into the blended score and lexical scoring alone retained as the mock/offline default and failure fallback (DEC-046, REQ-181, REQ-182), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by exact rule number against the rule numbers the selected System 2 topics list, so a listed parent's unlisted sub-rules still compete (REQ-179)
```

**Proposed diff** — `PRD/sections/in-depth/README.md`, `### Prompt assembly (ordered sections)` (line 391):

```diff
-  deduplicated against the System 2 selection by rule-number prefix (REQ-179) —
+  deduplicated against the System 2 selection by exact rule number (REQ-179) —
```

**Proposed diff** — `PRD/sections/quick-lookup/README.md`, `### Retrieval` (lines 276–278):

```diff
-  table of contents and heading-only entries stripped (REQ-179), excluding by
-  rule-number prefix the curated rule numbers the selected curated topics already
-  carry, and returning a small capped set of the best-ranked rules. IDF-scored
+  table of contents and heading-only entries stripped (REQ-179), excluding
+  exactly the curated rule numbers the selected curated topics already carry,
+  and returning a small capped set of the best-ranked rules. IDF-scored
```

`## Measured bounds` (line 345):

```diff
-  core-topic rule numbers excluded by prefix; ranking is a hybrid blend of
+  core-topic rule numbers excluded by exact number; ranking is a hybrid blend of
```

- Verdict: accept
- Reason:

## REQ-022 — the rules-in-every-prompt requirement stops saying "prefix" (amended)

**What this decides:** whether the requirement that puts official rules text
in every prompt describes the rule search's duplicate-skipping the new way.

**In plain terms:** REQ-022 is the requirement behind both kinds of rules text
in a prompt: the curated topics (System 2) and the scored search (System 3).
One of its checks says System 3 skips curated rules "by rule-number prefix, so
a curated parent rule also excludes its lettered sub-rules". With `REQ-179`
amended, that sentence would be false. This rewrites it to say System 3 skips
exactly the rules a selected topic lists, and the sub-rules a topic doesn't
print compete normally. It also relabels REQ-022's pointer to REQ-179. Nothing
else in REQ-022 changes.

**What happens if you say no:** REQ-022 keeps describing the old prefix rule
and contradicts `REQ-179` once it ships. Say no only if you also reject
`REQ-179`.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-022`:

```diff
-  - supplemental rules are excluded from the curated baseline set (deduplicated against selected System 2 topic rule numbers by rule-number prefix, so a curated parent rule also excludes its lettered sub-rules — REQ-179)
+  - supplemental rules are excluded from the curated baseline set (deduplicated against selected System 2 topic rule numbers by exact rule number: a rule a selected topic lists never repeats as a supplemental excerpt, while a listed parent's lettered sub-rules that the topic does not list compete like any other rule — REQ-179)
```

and under `- Dependencies:`:

```diff
-  - REQ-179 (rule-index hygiene and prefix-based curated exclusion)
+  - REQ-179 (rule-index hygiene and exact-number curated exclusion)
```

- Verdict: accept
- Reason:

## REQ-181 — the meaning-based rule search stops saying "prefix" (amended)

**What this decides:** whether the requirement for System 3's meaning-based
search describes its duplicate-skipping the new way. System 3 is the scored
rule search that adds up to ten rule excerpts to each prompt; System 2 is the
small set of curated rules topics it skips duplicates of.

**In plain terms:** REQ-181 is the requirement that made the rule search rank
rules by meaning, using stored per-rule vectors (lists of numbers that capture
what a rule is about), not just shared words. One of its checks says System 3
is "capped at 10 excerpts, still deduplicated against the curated System 2
selection by rule-number prefix". This changes "by rule-number prefix" to "by
exact rule number", to match `REQ-179`. The cap, the ranking and everything
else stay as they are.

**What happens if you say no:** REQ-181 keeps describing the old prefix rule
and contradicts `REQ-179` once it ships. Say no only if you also reject
`REQ-179`.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-181`:

```diff
-  - System 3 is capped at 10 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179)
+  - System 3 is capped at 10 excerpts, still deduplicated against the curated System 2 selection by exact rule number (REQ-179)
```

- Verdict: accept
- Reason:

## REQ-182 — the blended rule search stops saying "prefix" (amended)

**What this decides:** whether the requirement for System 3's blended ranking
describes its duplicate-skipping the new way. System 3 is the scored rule
search that adds up to ten rule excerpts to each prompt; System 2 is the small
set of curated rules topics it skips duplicates of.

**In plain terms:** REQ-182 is the requirement for the ranking the app ships.
It blends the meaning score with the shared-words score, so short card-lookup
questions still find the exact rule. One of its checks says System 3 is
"capped at 10 excerpts, still deduplicated against the curated System 2
selection by rule-number prefix", with the prompt's section order unchanged.
This changes "by rule-number prefix" to "by exact rule number", to match
`REQ-179`. The blend formula, its weights and its boosts don't change.

**What happens if you say no:** REQ-182 keeps describing the old prefix rule
and contradicts `REQ-179` once it ships. Say no only if you also reject
`REQ-179`.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-182`:

```diff
-  - System 3 is capped at 10 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179), and the prompt's section placement is unchanged
+  - System 3 is capped at 10 excerpts, still deduplicated against the curated System 2 selection by exact rule number (REQ-179), and the prompt's section placement is unchanged
```

- Verdict: accept
- Reason:

## REQ-220 — the replacement-effects topic's rationale stops describing the prefix rule (amended)

**What this decides:** whether the replacement-effects topic's background note
is corrected to match the new duplicate-skipping rule. The topic itself does
not change.

**In plain terms:** REQ-220 is the curated topic that switches on when two or
more cards say "instead" or "prevent". It prints the rules for how replacement
and prevention effects interact: 614.1a, 616.1, 616.1a through 616.1g, and
616.2. Its note explains why it ships the whole 616.1 family. Part of that
reason was that "listing 616.1 bars System 3 from every 616.1 sub-rule" —
System 3 being the scored rule search that adds up to ten more rule excerpts
and skips any rule a selected topic already carries. With `REQ-179` amended,
that is no longer true. The topic still lists each 616.1
sub-rule itself, so exactly the same rules are skipped and every prompt
carrying it is unchanged. This rewrites that clause as history and relabels
REQ-220's pointer to REQ-179.

**What happens if you say no:** REQ-220's note keeps stating a rule the search
no longer follows. Nothing a player sees changes either way.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-220`, under `- Dependencies:`:

```diff
-  - REQ-179 (prefix-based curated exclusion)
+  - REQ-179 (exact-number curated exclusion)
```

and in `- Notes:`:

```diff
-  - the full 616.1 family is shipped rather than a minimal subset because rule 616.1 directs the player through "the steps listed in rules 616.1a–f", and listing 616.1 bars System 3 from every 616.1 sub-rule; 614.1a is included because the approved case names it as deciding and System 3 ranks it beyond 400th for this question. The topic adds 3,898 characters to a prompt when it fires (3,837 of rule text plus the title line and line breaks; about 27% on the tester's Manufactor + Esix prompt). 4.8% of cards carry the wording (matched as whole words in any letter case), so two random attached cards both carry it about 0.2% of the time; in the 392 approved rules test cases it fires on 6
+  - the full 616.1 family is shipped rather than a minimal subset because rule 616.1 directs the player through "the steps listed in rules 616.1a–f", and, under the prefix exclusion REQ-179 applied when this topic shipped, listing 616.1 barred System 3 from every 616.1 sub-rule (REQ-179 now excludes exact rule numbers only; this topic lists each 616.1 sub-rule it prints, so what it excludes is unchanged); 614.1a is included because the approved case names it as deciding and System 3 ranks it beyond 400th for this question. The topic adds 3,898 characters to a prompt when it fires (3,837 of rule text plus the title line and line breaks; about 27% on the tester's Manufactor + Esix prompt). 4.8% of cards carry the wording (matched as whole words in any letter case), so two random attached cards both carry it about 0.2% of the time; in the 392 approved rules test cases it fires on 6
```

- Verdict: accept
- Reason:

## Blocker questions

None. Every question was resolved from the PRD, tested behavior, or the
smallest reversible scope; the decisions and their sources are in
`DESIGN-BRIEF.md`, `## Decisions and material assumptions`.
