# Sweep finding — scanning

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/scanning.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 23

## DEC-050 — absorbed
`scan/README.md` "What it is" states scanning is optional, frontend-only, zero network calls, never the only way to add a card, and sits outside the core loop (cites DEC-050 directly).

## DEC-051 — absorbed
"Identifying a card" describes the single authoritative TS recipe used both on-device and by the offline library build so parity holds by construction, matching the decision's core claim.

## DEC-052 — absorbed
"The camera surface" bullet covers continuous auto-scan + always-available manual capture; card-back and low-confidence handling (as refined by DEC-076) are covered under "Identifying a card" and the "Rejected alternatives" closed-door notes.

## DEC-053 — absorbed
"Identifying a card" bullet 2 states the bridge (printing id → oracle_id → CardMetadataItem), duplicate-oracle collapse by best distance, and drop of unresolvable candidates, oracle-level identity unchanged.

## DEC-054 — partial
Missing: the resumable/budget-bounded build mechanics (default resumable behavior, non-destructive `--fresh`, checkpointing, per-image skip-list/parking, npm aliases, required run docs) appear nowhere in the 7 scored specs — `scan/README.md` explicitly delegates all fingerprint-library build detail to `data/cardhashes.md` ("documented separately as a `data/` concern and not inlined here"), which is out of the scored set. Only the higher-level fact that TheJudge owns/refreshes the library (DEC-051) survives in-spec.

## DEC-055 — absorbed
"Locking and hands-free auto-add" bullet 1 describes the temporal-stabilizer vote (`searching`→`locking`→`locked`); card-back descope is covered under "Identifying a card" ("card-back detection is descoped from the shipped UX").

## DEC-056 — absorbed
"Locking and hands-free auto-add" bullet 1 states a confident lock auto-adds with no Accept tap and auto-scan immediately resumes; the mechanism this decision introduced is intact even though its strict-threshold framing is superseded in-spec by DEC-059.

## DEC-057 — absorbed
Thumbs-up popup + ding covered in "Confirmation, review, and correction" bullet 1; the single non-selectable "locking on: <name>" indicator replacing the top-3 list is named explicitly in "Rejected alternatives."

## DEC-058 — absorbed
"Confirmation, review, and correction" bullet 2 describes the top-right scanned-cards review bubble, expand-to-list, and single-tap no-confirmation Remove.

## DEC-059 — absorbed
"Locking and hands-free auto-add" bullet 2 states lock thresholds are tuned toward ease-of-lock with the runner-up margin as the primary guard and one-tap removal as the safety net.

## DEC-060 — absorbed
"Diagnostics and the debug overlay" bullet 1 covers the opt-in, default-off overlay showing detected region, art-crop read region, and match/convergence metrics.

## DEC-061 — absorbed
"Confirmation, review, and correction" bullet 1 covers the ding (on by default), mute-toggle-suppresses-audio-only, and localStorage persistence with graceful fallback.

## DEC-062 — absorbed
"Real-world robustness" bullets 1 and 3 cover query-only conditioning, best-frame selection, finger occlusion as a frame-quality-only penalty, and the lock gate staying held as the non-lever.

## DEC-065 — absorbed
"Diagnostics" bullet 1 ("toggle sits outside the top-right review/remove hit area") and "Scan-screen layout" bullet 1 ("non-overlapping bounds and hit areas") both capture the separation.

## DEC-069 — absorbed
"Real-world robustness" bullet 2 covers corpus targeting every paper gameplay printing including non-English-only alt-art, and coverage being observable from the build.

## DEC-070 — absorbed
"Confirmation, review, and correction" bullet 3 and the "How scan feeds each destination" intro state the scanned printing's art is shown as presentation only, with oracle-level identity unchanged.

## DEC-072 — absorbed
"Identifying a card" bullet 3 (clutter-resistant, guide-biased detection) and "Diagnostics" bullet 2 (acquisition diagnostics chain) capture the product-facing substance; fixture-corpus test methodology is dev-process detail reasonably left out of a product spec.

## DEC-073 — absorbed
"Identifying a card" bullet 3 ("biased toward the on-screen guide") and "Real-world robustness" bullet 3 (detector nudge) capture the guide-as-detection-prior substance.

## DEC-074 — absorbed
"The camera surface" bullet 2 and the "Measured bounds" Capture line both cover the higher-resolution `getUserMedia` request with graceful `ideal`-only fallback.

## DEC-077 — absorbed
"Diagnostics" bullet 2 covers the acquisition-diagnostics chain (capture→detector→frame selector→quality→identity distance→vote reason) validated against the two-condition matrix as a QA device, not a user mode.

## DEC-083 — absorbed
"Real-world robustness" bullet 4 covers the affirmative alignment outline during `locking`, reusing existing detector geometry with no new threshold.

## DEC-090 — absorbed
"Scan-screen layout and theming" bullet 1 covers the responsive viewport-height frame and non-overlapping overlay placement (debug toggle, mute, watermark, Exit scan row, review bubble).

## DEC-093 — absorbed
"Real-world robustness" bullet 3, final sentence, states the generic "Searching for a card…" label was removed to keep the indicator box small.
