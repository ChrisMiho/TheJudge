# GATE-QUESTIONS: resilient-weekly-data-refresh

Proposed product truth for the `define` gate. Each block carries a plain-language
question, the complete proposed `PRD/sections/` diff, and an accept/edit/reject
slot. New ids are **named and reserved here**, not written into live section files
— implementation applies the approved proposal alongside the code.

The JSONL bulk fix (Scryfall retired `download_uri` for `jsonl_download_uri`) and
the combo retry-backoff/pacing hardening are implementation-only and carry no gate
block — the PRD names neither the download field nor the retry mechanics.

---

## REQ-195 (amend)

**What this decides.** Whether the weekly refresh (`npm run data:refresh-pr`)
(a) hard-fails with no pull request when it cannot download fresh cards, and
(b) stops rebuilding the Commander Spellbook combo corpus on every run.

**In plain terms.** Today REQ-195 says a failed or missing upstream source is
tolerated — the run keeps the prior artifact and simply commits whatever else
changed. That is exactly what let two runs open pull requests with stale June-5
prices after the card download silently failed. This change makes fresh card
prices the headline: if the card/rulings download fails, the whole run fails
visibly (no branch, no PR) so you retry, rather than shipping a misleading PR. It
also stops re-running the throttle-prone combo refresh every week — combos are
reused unless their upstream data changed (the mechanism is REQ-196).

**What happens if you say no.** The weekly run keeps its current "tolerate a
failed source, open a PR anyway" behavior, so a failed card download keeps
producing stale-price PRs; and combos keep rebuilding every week, re-hitting the
Scryfall rate limits each time.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-195

Description, final sentence:
```diff
   moves the player-visible `Prices as of <date>` freshness line (REQ-145)
-  forward.
+  forward. Fresh card prices are the headline: if the upstream card/rulings
+  bulk download fails, the run is a hard failure that opens no pull request
+  rather than a misleading one. The Commander Spellbook combo corpus — which
+  changes only when new cards release or a new combo template appears, while
+  prices change weekly — is refreshed only when the card-identity set or the
+  combo template set changed; otherwise the run reuses the committed combo
+  artifact and skips the combo rebuild (REQ-196).
```

Acceptance Criteria, replace the graceful-degradation bullet:
```diff
-  - preserves graceful degradation — a failed or missing upstream source keeps
-    the prior committed artifact (REQ-066) and the wrapper never commits an
-    empty or broken refresh
+  - a failed `default_cards`/`rulings` bulk download is a hard failure: the run
+    exits non-zero, cuts no branch, commits nothing, and opens no pull request
+    (never a stale or misleading one)
+  - reuses the committed Commander Spellbook combo artifact when neither the
+    card-identity set nor the combo template set changed, refreshing combos only
+    when one of them did (REQ-196); the wrapper still never commits an empty or
+    broken refresh
+  - runtime graceful degradation is unchanged — the running app still fails open
+    on a missing or malformed committed artifact (REQ-066)
```

Notes, append one bullet:
```diff
     more new code, drops rulings/combos/rules from the cadence). Written for
     full refresh
+  - the original "every corpus fresh weekly" scope is amended by REQ-196: cards,
+    rulings, and rules still refresh every run, but combos are hash-gated (reused
+    unless the card-identity set or the combo template set changed) to avoid
+    re-running the throttle-prone Scryfall template expansion every week
```

**Answer:** accept / edit / reject →

---

## REQ-196 (new — reserved, not written live)

**What this decides.** Whether to add a requirement for hash-gated combo reuse: the
weekly refresh reuses the committed combo artifact unless the card-identity set or
the combo template set changed.

**In plain terms.** Rebuilding combos means firing ~200 individual Scryfall search
queries (one per "template" category like "any mana dork"), which repeatedly hits
Scryfall's rate limit. Those queries' results only change when new cards release
(new cards can join an existing category) or when Commander Spellbook adds a brand
new category. So the run stores two small hashes in a committed marker — one of the
set of card identities (`oracle_id`s) in the download, one of the set of combo
templates — and only does the expensive combo rebuild when one of them changed;
otherwise it leaves the committed combo files untouched. Prices moving never flips
either hash, so ordinary weekly churn does not trigger a rebuild. The export's own
`version`/`timestamp` were evaluated and rejected: `timestamp` changes on every
regeneration (would never skip) and `version` is a schema version that rarely moves
(would skip even when combos changed). When the rebuild does run, it re-expands
*every* template, old and new, because existing categories gain new cards.

**What happens if you say no.** There is no product-truth backing for skipping
combos, so the weekly run must keep rebuilding them every time (and keep hitting
the rate limits) to stay within spec.

### Proposed diff — `PRD/sections/functional-requirements.md` (append after REQ-195)

```diff
+### REQ-196
+- Title: Hash-gated Commander Spellbook combo reuse in the weekly refresh
+- Priority: medium
+- Description: The weekly data refresh (REQ-195) refreshes the Commander
+  Spellbook combo corpus only when its build inputs changed, detected by two
+  content hashes stored in a committed marker: (1) a card-identity hash over the
+  sorted set of Scryfall `oracle_id`s in the freshly downloaded `default_cards`,
+  and (2) a template-set hash over the sorted set of distinct combo templates
+  (id + Scryfall query) in the variant export. Both are byproducts of data the
+  run already downloads. When both hashes match the marker, the run reuses the
+  committed combo artifacts unchanged and skips the Scryfall template expansion
+  and combo rebuild entirely; when either differs, it runs a full re-expansion of
+  every template — old and new, because existing templates gain new cards — then
+  rebuilds the combo artifacts and rewrites the marker. Volatile fields (prices,
+  popularity, the export timestamp) are excluded from both hashes, so weekly price
+  churn never triggers a rebuild. Cards, rulings, and Comprehensive Rules still
+  refresh every run; only combos are gated. Mirrors the rule-embeddings "rebuild
+  only when a content hash differs" behavior. No runtime change (NFR-013).
+- Acceptance Criteria:
+  - a committed marker records the card-identity hash and the template-set hash
+    the committed combo artifacts were built from
+  - when both hashes match the freshly downloaded inputs, the run performs no
+    Scryfall template expansion and no combo rebuild, and leaves
+    `commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`
+    byte-unchanged (so nothing is staged for them)
+  - when either hash differs, the run performs a full re-expansion of every
+    template (not an incremental subset) and rewrites the marker
+  - a price-only card update (same `oracle_id` set) does not trigger a combo
+    rebuild; a new set (new `oracle_id`s) or a new template does
+  - the hashes exclude volatile fields (prices, popularity, regeneration
+    timestamp); the gate never skips on a wall-clock interval
+  - refreshing combos remains an explicit human-approved network operation
+    (REQ-093, DEC-162)
+- Constraints:
+  - touches no runtime code path; runtime combo matching is unchanged
+  - the marker is a committed sidecar; the raw export and template-expansion
+    responses stay gitignored (DEC-162)
+  - if either hash cannot be computed, treat it as changed and run the full
+    refresh — never skip on missing or unreadable inputs
+- Dependencies:
+  - REQ-195 (the weekly refresh this gates a step within)
+  - DEC-162 (Commander Spellbook bulk-export sourcing and human approval)
+- Notes:
+  - the throttle motivation: a full combo rebuild fires ~200 per-template
+    Scryfall search calls and is rate-limited; gating avoids paying that weekly
+  - the card-identity hash is the true determinant of template-expansion output
+    (the searches run against the Scryfall card pool); the template-set hash
+    covers Commander Spellbook adding a category without new cards
```

**Answer:** accept / edit / reject →

---

## integrations-and-data.md (amend)

**What this decides.** Whether the "Commander Spellbook Combo Data Strategy"
product truth records that the combo refresh is hash-gated (reused when the combo
build inputs are unchanged), matching REQ-196.

**In plain terms.** One line currently says invoking `data:refresh` always runs
the combo download in the refresh chain. This updates it to say the combo refresh
is hash-gated and reuses the committed artifact when both the card-identity and
template-set hashes are unchanged, so the durable data-strategy doc matches the
new behavior.

**What happens if you say no.** REQ-196 (if accepted) would contradict this
section, which still asserts the combo download always runs in the chain.

### Proposed diff — `PRD/sections/integrations-and-data.md`, "Commander Spellbook Combo Data Strategy"

```diff
-- network refresh is an explicit human-approved operation; invoking `data:refresh` is that approval, so the combo download runs in that chain beside the Scryfall and Comprehensive Rules refreshes (DEC-162). The raw bulk export and template-expansion responses stay gitignored under `apps/backend/data/commander-spellbook/`
+- network refresh is an explicit human-approved operation; invoking `data:refresh` is that approval, so the combo download runs in that chain beside the Scryfall and Comprehensive Rules refreshes (DEC-162). The combo refresh is hash-gated (REQ-196): the cadence compares a card-identity hash (the set of Scryfall `oracle_id`s in the fresh `default_cards`) and a template-set hash (the distinct combo templates in the variant export) to a committed marker (`apps/backend/data/commanderSpellbookComboSource.meta.json`), and reuses the committed combo artifact — skipping the Scryfall template expansion — when both match, running a full re-expansion of every template only when one changed. Volatile fields (prices, popularity, export timestamp) are excluded, so weekly price churn does not trigger it. The raw bulk export and template-expansion responses stay gitignored under `apps/backend/data/commander-spellbook/`
```

**Answer:** accept / edit / reject →

---

## Blocker questions

None — the three material decisions were resolved with the owner at refinement
(combo trigger = auto-detect, bundled, by card-identity + template-set hashes with
a full re-expansion on a mismatch; failed card download = hard-abort, no PR; combo
retry path = hardened for 100%).
