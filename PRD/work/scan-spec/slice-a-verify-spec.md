# Slice A — Verify the committed scan spec and two corpus docs against their sources

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: done

## Goal

Confirm `PRD/sections/scan/README.md` (already committed at `7cd4f41`, 337
lines), `PRD/sections/scan/data/cardhashes.md` (already committed at
`7cd4f41`, 108 lines), and `PRD/sections/scan/data/cardScanMap.md` (already
committed at `7cd4f41`, 95 lines) are complete and correct against their
cited sources, the DEC-168 template, and — for each corpus doc's measured
figures — the committed artifact itself, read directly. Close any confirmed,
sourced gap with a bounded additive correction only — this slice verifies; it
does not author.

## Requirements

1. Read the cited sources before checking a line: `PRD/sections/decisions/scanning.md`
   (DEC-050 through DEC-093, the scan domain, including DEC-078 and DEC-082
   which live in this same domain file); the cross-domain decisions the spec
   cites — DEC-068 and DEC-076 in `PRD/sections/decisions/personalization.md`;
   DEC-087 in `PRD/sections/decisions/trade-balancer.md`; DEC-107 in
   `PRD/sections/decisions/lookup-suite.md`; DEC-151, DEC-158, DEC-160 in
   `PRD/sections/decisions/capture-and-stack.md`; DEC-157 in
   `PRD/sections/decisions/navigation.md`. Confirm each home file at read
   time rather than trusting this list — it is a map-out pre-scout, not
   ground truth. `PRD/sections/functional-requirements.md` (the
   REQ-034–REQ-129 subset named in the spec's `Backed by:` line);
   `PRD/sections/user-flows.md` (FLOW-006, FLOW-009, FLOW-011);
   `PRD/sections/non-functional-requirements.md` (NFR-001, NFR-006, NFR-010,
   NFR-014); `PRD/sections/system-map.md` (the `## Card scanning` block and
   its Quick Lookup / Trade Balancer scan-reuse citations);
   `PRD/sections/screen-layout.md` (the `#### Scan camera surface` row, the
   zone collection `Search / scan` row, the shared card-image-presentation
   row). (`intake/` in this package is evidence, never authority — do not
   open the documents it cites.)
2. Confirm the spec's header carries the DEC-168 shape: a `Status:` line
   stating the file is a draft, derived, non-authoritative view, naming the
   cited `DEC`/`REQ`/`FLOW` as the winner on conflict; a `Backed by:` line
   citing exactly the ID set recorded in the committed file's header — no
   more, no fewer. Confirm `cardhashes.md`'s header carries the same
   `Status:` shape and a `Backed by:` line citing exactly DEC-051, DEC-054,
   DEC-069, REQ-035, REQ-039, REQ-047, NFR-010. Confirm `cardScanMap.md`'s
   header carries the same `Status:` shape and a `Backed by:` line citing
   exactly DEC-053, DEC-070, REQ-036, REQ-048, NFR-010.
3. Confirm the spec's five DEC-168 template sections are present, in order:
   **What it is**, **How it works**, **Measured bounds**, **Rejected
   alternatives and deferred scope**, **Where it lives** — plus the sixth,
   distinctive top-level section this spec carries because scan feeds three
   destinations: **How scan feeds each destination**, positioned between
   **How it works** and **Measured bounds**. No other top-level section.
   Neither corpus doc is itself a DEC-168 behavior doc (each doc's own header
   says so) — do not require the same section set of them; instead confirm
   each covers, at minimum, why it is a corpus (the four-clause `data/`
   bucket test), where the artifact comes from and how it is built, its
   shape, its measured figures, its runtime posture, and where it lives.
4. Confirm every **How it works** bullet in the spec is traceable to its
   cited source's actual text: the shared camera surface and capture
   request (DEC-052, DEC-074, REQ-037, REQ-053), the identification engine
   and oracle-level bridging (DEC-051, DEC-053, REQ-034, REQ-036), the
   detector and card-back descoping (DEC-072, DEC-073, DEC-055, REQ-050,
   REQ-052), locking and hands-free auto-add (DEC-055–059, REQ-040), the
   stack duplicate-block/limit interaction (DEC-056, REQ-040), confirmation/
   review/removal and scanned-printing art (DEC-057, DEC-058, DEC-061,
   DEC-070, DEC-078, DEC-151, REQ-040, REQ-042, REQ-048), real-world
   robustness (DEC-062, DEC-069, DEC-073, DEC-074, DEC-083, DEC-093, REQ-043,
   REQ-047, REQ-054, REQ-062, REQ-071), the debug overlay and acquisition
   diagnostics (DEC-060, DEC-065, DEC-072, DEC-077, REQ-041, REQ-051,
   REQ-057), and scan-screen layout/theming (DEC-065, DEC-068, DEC-076,
   DEC-090, REQ-046, REQ-056, REQ-068, NFR-001) — no capability invented
   beyond what those IDs state.
5. Confirm the **How scan feeds each destination** section correctly
   describes all three destinations and the identity boundary held across
   them:
   - In-Depth zone collection (DEC-050, DEC-052, DEC-056, DEC-082, REQ-038,
     REQ-125, FLOW-006) — the Scan entry point beside manual search, the
     batch/hands-free loop, `ZoneCardItem` production, `instanceId`-keyed
     independent instances.
   - Quick Question / Quick Lookup (DEC-053, DEC-107, REQ-073, FLOW-011) —
     scan as one of two resolution paths, single active card, no zones or
     stack.
   - Trade Balancer (DEC-050, DEC-070, DEC-087, REQ-065, FLOW-009) — scan as
     one of two add paths, scanned printing as default entry printing,
     printing choice as a pricing/display layer only.
   - The closing **One engine, three destinations** subsection's NFR-014
     claim: confirm the `manualChunks` `scan` group in
     `apps/frontend/vite.config.ts` is wider than `src/lib/scan/**`, and
     confirm `useScanCapture.ts` is actually reachable from more than one
     destination and `ScanCameraSurface.tsx` from more than one destination,
     by grepping for their imports/usages across
     `apps/frontend/src/components/ZoneCardPicker.tsx`,
     `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`,
     and `apps/frontend/src/components/trade/useTradeScan.ts` /
     `apps/frontend/src/components/trade/TradeSide.tsx` — never assume the
     map-out pre-scout is correct.
6. Confirm the spec's **Where it lives** paragraph and each corpus doc's own
   **Where it lives** section name every file that both `system-map.md` and
   the actual repository tree confirm belongs to the feature. Check
   directly: `find apps/frontend/src/lib/scan -maxdepth 1 -type f` and
   `find apps/frontend/src/components -maxdepth 1 -iname "Scan*" -o -iname "ZoneCard*" -o -iname "ZoneCollection*"`
   against the files named in the spec, and confirm
   `apps/frontend/src/hooks/useScanCapture.ts`,
   `scripts/build-card-hashes.mjs`, `scripts/build-card-scan-map.mjs`, and
   `apps/frontend/public/assets/scanSuccess.wav` exist. Map-out time found no
   gap here — verify this independently rather than trusting that finding.
7. Confirm each corpus doc's "Why it is a corpus, not a feature spec" section
   states all four `data/` bucket-test clauses (external upstream source,
   build/refresh command, committed artifact, describes Magic not TheJudge)
   and that each clause is factually accurate: `cardhashes.md` against
   `scripts/build-card-hashes.mjs`, `npm run data:scan-fingerprints` /
   `data:scan-fingerprints:fresh` wiring, and
   `apps/frontend/public/data/cardhashes.bin`; `cardScanMap.md` against
   `scripts/build-card-scan-map.mjs` and
   `apps/frontend/public/data/cardScanMap.json`.
8. Confirm `cardhashes.md`'s "Measured bounds" figures against the committed
   artifact, read directly (never by running
   `npm run data:scan-fingerprints` or any Scryfall network refresh):
   - File size: read `apps/frontend/public/data/cardhashManifest.json`'s
     `byteSize` field and independently confirm with `ls -la
     apps/frontend/public/data/cardhashes.bin`. Map-out time found this file
     is 13,047,744 bytes (~13.0 MB SI / ~12.4 MiB) — **not** the ~14 MB the
     doc currently states. Independently re-confirm this figure. If it
     holds, apply a bounded correction to the one "~14 MB" figure in
     `cardhashes.md`'s "Measured bounds" section (for example to "~13 MB")
     — this is inside the package's licensed scope (the corpus doc itself).
   - Corpus status: confirm the manifest's `version`, `count`,
     `coverage.targetCount`, `coverage.fingerprintedTargetCount`,
     `coverage.missingCount`, `coverage.parkedCount`, and
     `coverage.corpusStatus` fields match the doc's "partial at closeout:
     97311/97323" claim exactly.
9. Confirm `cardScanMap.md`'s artifact-shape description (`{ oracleId, name,
   imageUrl }` per entry, keyed by Scryfall printing id) against the
   committed `apps/frontend/public/data/cardScanMap.json`, read directly
   (Python's stdlib `json` module or `jq`) — entry count and at least one
   spot-checked entry's shape.
10. Confirm the spec's **Rejected alternatives and deferred scope** section
    matches the cited DECs' Context and Notes language (DEC-056/058 one-tap
    Accept/Rescan, DEC-057 selectable top-3 list, DEC-076 in-scan escalation
    prompt, DEC-055 card-back prompt/cues, DEC-062/072/074 lock-gate-loosening
    rejection, DEC-069 all-cards bulk rejection, DEC-088 cardScanMap
    pricing-overload rejection) — nothing invented, nothing omitted.
11. Confirm no new stable ID token (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or
    `Q-` token followed by digits) appears in any of the three files that
    does not already resolve to a real, pre-existing ID in its home file —
    cross-reference IDs beyond each file's own `Backed by:` set are expected
    and fine as long as each one is real; no ID may be minted.
12. Touch no file besides `PRD/sections/scan/README.md`,
    `PRD/sections/scan/data/cardhashes.md`, and
    `PRD/sections/scan/data/cardScanMap.md`, and only for a bounded additive
    correction if a requirement above genuinely surfaces one (for example
    the file-size figure in requirement 8) — no other edit, no DEC/REQ/FLOW/NFR
    body edit, no `system-map.md`/`screen-layout.md`/`goals-and-non-goals.md`
    edit, no `apps/` change, no new decision.

## Acceptance criteria

- [ ] A1 — The spec's header carries a `Status:` line naming the file draft,
      derived, non-authoritative, with the cited `DEC`/`REQ`/`FLOW` winning
      any conflict, and a `Backed by:` line citing exactly the ID set
      recorded in the committed file's header — every one of those IDs
      confirmed to exist in its named home file.
- [ ] A2 — `cardhashes.md`'s header carries the same `Status:` shape and a
      `Backed by:` line citing exactly DEC-051, DEC-054, DEC-069, REQ-035,
      REQ-039, REQ-047, NFR-010; `cardScanMap.md`'s header carries the same
      `Status:` shape and a `Backed by:` line citing exactly DEC-053,
      DEC-070, REQ-036, REQ-048, NFR-010.
- [ ] A3 — The spec's six top-level sections are present in order: What it
      is, How it works, How scan feeds each destination, Measured bounds,
      Rejected alternatives and deferred scope, Where it lives.
- [ ] A4 — Every cited ID in all three files' `Backed by:` lines actually
      exists in its named home file.
- [ ] A5 — Every **How it works** bullet in the spec is confirmed traceable
      to its cited source's text — no invented capability.
- [ ] A6 — The **How scan feeds each destination** section's three
      destination subsections and its closing NFR-014 `manualChunks` proof
      are confirmed accurate — `useScanCapture.ts` and
      `ScanCameraSurface.tsx` independently re-confirmed reachable from more
      than one destination each, not assumed from map-out.
- [ ] A7 — All three files' **Where it lives** content names every file
      `system-map.md` and the repository tree confirm belongs to the
      feature; independently re-verified, not assumed from map-out.
- [ ] A8 — Each corpus doc's "Why it is a corpus" four-clause test is
      confirmed factually accurate against its build script and committed
      artifact.
- [ ] A9 — `cardhashes.md`'s measured-bounds figures (file size, corpus
      status counters) are confirmed against the committed
      `cardhashes.bin` / `cardhashManifest.json`, read directly (no
      rebuild); the ~14 MB vs. ~13 MB file-size discrepancy is confirmed
      and, if it holds, corrected with a bounded edit to that one figure.
- [ ] A10 — `cardScanMap.md`'s artifact-shape and entry-count description is
      confirmed against the committed `cardScanMap.json`, read directly (no
      rebuild).
- [ ] A11 — The spec's **Rejected alternatives and deferred scope** matches
      its cited DECs' Context/Notes language, with nothing invented or
      omitted.
- [ ] A12 — No new (minted) stable ID token appears in any of the three
      files — every ID token present resolves to a real, pre-existing ID in
      its home file — and the slice's diff touches only
      `PRD/sections/scan/README.md`,
      `PRD/sections/scan/data/cardhashes.md`, and
      `PRD/sections/scan/data/cardScanMap.md`, and only for bounded additive
      correction where genuinely needed — no `apps/` change, no edit to any
      existing `DEC`/`REQ`/`FLOW`/`NFR` body, no
      `system-map.md`/`screen-layout.md`/`goals-and-non-goals.md` edit.

## Verification

```bash
grep -nE "Status:|Backed by:|^## " PRD/sections/scan/README.md
grep -nE "Status:|Backed by:" PRD/sections/scan/data/cardhashes.md
grep -nE "Status:|Backed by:" PRD/sections/scan/data/cardScanMap.md
grep -n "## Card scanning" PRD/sections/system-map.md
grep -n "Scan camera surface\|Search / scan" PRD/sections/screen-layout.md
find apps/frontend/src/lib/scan -maxdepth 1 -type f
find apps/frontend/src/components -maxdepth 1 \( -iname "Scan*" -o -iname "ZoneCard*" -o -iname "ZoneCollection*" \)
grep -n "scan" apps/frontend/vite.config.ts
grep -rn "useScanCapture" apps/frontend/src/components/ZoneCardPicker.tsx apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx apps/frontend/src/components/trade/useTradeScan.ts apps/frontend/src/components/trade/TradeSide.tsx
grep -rn "ScanCameraSurface" apps/frontend/src/components/ZoneCardPicker.tsx apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx apps/frontend/src/components/trade/useTradeScan.ts apps/frontend/src/components/trade/TradeSide.tsx
ls -la apps/frontend/public/data/cardhashes.bin
python3 -c "
import json
with open('apps/frontend/public/data/cardhashManifest.json') as f:
    print(json.load(f))
"
python3 -c "
import json
with open('apps/frontend/public/data/cardScanMap.json') as f:
    d = json.load(f)
print('entries', len(d))
k = next(iter(d))
print(k, d[k])
"
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/scan/README.md | sort -u
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/scan/data/cardhashes.md | sort -u
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/scan/data/cardScanMap.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/scan/README.md` (verify; bounded additive correction only if
  genuinely needed)
- `PRD/sections/scan/data/cardhashes.md` (verify; bounded additive
  correction only if genuinely needed — likely the ~14 MB figure)
- `PRD/sections/scan/data/cardScanMap.md` (verify; bounded additive
  correction only if genuinely needed)
