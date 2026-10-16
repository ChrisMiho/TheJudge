# Quality check — tool-switch-load-delay

**Verdict: PASS.** Package stays at `STATUS.refined`. No blocking findings.
Mode: graph controlling, attempt 1. Checked: `DESIGN-BRIEF.md`,
`GATE-QUESTIONS.md`, `evidence/measurements.md` against `PRD/sections/` and
`PRD/instructions/{technical-design-rules,preparation-contract,plain-language-standard}.md`.

## What was checked

- Diffs apply to current text. NFR-014 constraint line (non-functional-requirements.md:239),
  the Suspense line (:246) and the Dependencies list match the hunks. The shared-chrome
  "Built" paragraph (shared-chrome/README.md:91-100) and the screen-layout Notes cell
  (screen-layout.md:73) match character for character.
- Amend in place, no contradiction. The new warm-up rule narrows the "never
  downloads" constraint to "initial payload" and keeps the rest of NFR-014 (lazy
  boundary, function-form `manualChunks`, keep-alive, NFR-012). Two other
  statements stay true unedited: "at most once per destination per session"
  (shared-chrome/README.md:494) and the system-map routing paragraph
  (system-map.md:573).
- Plain-language block opens the one slot with all three labels (What this
  decides / In plain terms / What happens if you say no), leads with the player
  experience, inlines REQ-064 and the rule it amends. The Verdict/Reason lines
  are empty as required.
- No new stable ID, no `PRD/sections/` edit, one endpoint and no rules engine
  untouched (technical-design-rules respected). NFR-013 reasoning (code, not
  prices) holds. No new screen, so the screen-layout row only needs its Notes
  amendment, which Diff 3 provides.
- Measurements support the scope. Live first-open fallback 0.2-0.7 s per tool;
  the local build reproduces live within 15 ms; prefetch approximation drops it
  to 34-42 ms; the card list (9.7 s Slow 4G) is correctly kept out of core.

## Findings (advisory, none blocking)

1. Symptom gap, disclosed. `DESIGN-BRIEF.md:129-154` (A9) and
   `evidence/measurements.md:131-138`: the owner reported "a few seconds"; the
   fix removes 0.2-0.7 s per tool. The only multi-second wait measured is the
   balancer's card list on Slow 4G (F1, `DESIGN-BRIEF.md:204-210`), deliberately
   out of scope. The brief's line "holds either way" (`DESIGN-BRIEF.md:153-154`)
   is true for the code download only. The owner may still see seconds on the
   balancer after this ships; the gate text states it
   (`GATE-QUESTIONS.md:30-32`). Recommend the owner reads F1 before accepting.
2. Dependencies hunk ordering. `GATE-QUESTIONS.md:54-60` adds `REQ-064` right
   after `NFR-012`; current text continues `NFR-013`, `REQ-066`
   (non-functional-requirements.md, Dependencies of NFR-014). It applies, but
   the hunk shows no trailing context, so the implementer should append after
   `REQ-066`, not mid-list.
3. Acceptance measure script is gitignored. `DESIGN-BRIEF.md:169` points at
   `.playwright-mcp/measure.js`; the "or an equivalent rAF-timed tap" clause
   covers a missing file. Criterion 3 (`DESIGN-BRIEF.md:178-181`, "within 50 ms
   of the pre-change build") is noise-sensitive; treat as a trend, not a hard
   gate.
4. Not-yet-measured claim, correctly labelled. "No fallback frame" for a
   `preload()`-warmed tool (`evidence/measurements.md:109-115`) is an
   acceptance check at build, covered by criteria 1-2 and 6.
