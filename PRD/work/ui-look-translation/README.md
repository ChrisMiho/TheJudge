status: refining

# ui-look-translation

Translate the approved direction-1 mockup into the app faithfully. See `IDEA.md`.

Request (verbatim intake, evidence not authority): `intake/GRAPH-BRIEF-2-look-translation.md`
Supersession note: the intake's "Base: `origin/main` after PR #239 merges" is superseded by the owner's decision to stack this run on PR #239's branch (`origin/thejudge-auto/ui-reimagining-build-work`); the intake's "DEC-092" helper-text rule is proposed for amendment where it now lives, REQ-070 (see `DESIGN-BRIEF.md`).

Design: `DESIGN-BRIEF.md`. Proposal for the define gate: `GATE-QUESTIONS.md` (14 blocks, verdict slots blank).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ui-reimagining-build-work

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/ui-look-translation/DESIGN-BRIEF.md`
- Findings:
  1. REQ-216 block and brief acceptance item 5(a): the hard-coded-colour grep demands zero hits outside the ported layers, but names no home or exemption for colours that legitimately live in TS/TSX today — `components/trade/TradePile.tsx` (GOLD/GOLD_DARK/BRONZE/GEM pile-art hex constants), `components/ScanCardOutline.tsx` and `components/ScanDebugOverlay.tsx` (canvas/SVG stroke hex), `components/EnrichmentStep.tsx:752` (`color: "#e2e8f0"`), the per-profile colour values the ported canvas renderer in `AmbientScene.tsx` will carry, and the card-derived identity-ring value (REQ-058). Resolve: state in the brief and the REQ-216 block where such values go (token-layer variables, or a named allowlist of files with reasons, each of canvas scene / pile artwork / scanner overlays / identity-ring derivation dispositioned), and make the grep command match.
  2. REQ-214 block (GATE-QUESTIONS.md ~969–1030) adds a hint line under the scanner viewfinder, changing the scanner screen's shape, but proposes no `screen-layout.md` edit; the Chrome row for the scan camera surface (~line 212) would not list the hint. Resolve: add a `screen-layout.md` Chrome-row clause to the REQ-214 diff, or a disposition row stating why the row stays.
  3. Brief acceptance item 2 requires a pixel-comparison script but never names which slice creates it, its path, inputs, outputs, or mask format, so map-out cannot emit a command-bearing criterion for it. Resolve: assign it to the frame slice with a path (e.g. under `scripts/`), a usage signature, a named-mask file format, and the recorded output location.
  - Minor: the screens table's Gate-blocks column lists REQ-216 only on the Frame row while the text says every slice cites it; add it to every row or state in the header that it is implicit on all.
