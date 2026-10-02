# Slice E — Card scanner: pair results

Screen: the card scanner, hosted on Ask a Question ("Scan a card", the ✕ exit, the viewfinder, the credit and the hint). Visual source: `docs/design/ui-reimagining/direction-1/card-scan.html`.

Slice threshold: differing fraction at most 0.04 per pair (below the 0.05 ceiling). Measured maximum 0.0154 (locking on at 390x844), so the planner's 0.04 is kept. Tolerance 12 per channel on every pair.

How the pairs are made: the same as `translation/frame/DIFF-RESULTS.md` (build in mock mode on 5411, the seeded-scene mockup copy on 5413, reduced motion, Blue, Playwright). Neither side has a real camera, so both show the same still: a 1080x1440 picture (the mockup's table and Lightning Bolt lying on it, rotated 3 degrees), drawn on the mockup side as the viewfinder's background and handed to the app as the camera stream (the capture replaces the browser's `getUserMedia` with a canvas stream of that picture; nothing in the app is changed for it). The app then reads the still with its own detector and matcher and really locks on Lightning Bolt. The build is captured the moment the lock outline first shows, with the pointer away from the controls; the mockup is the page's own "locking on" state with its two demo held cards removed (the app draws the count pill only once a card is held).

| Pair | Mask file | Tolerance | Differing fraction (pixels / compared) | Threshold | Result |
| --- | --- | --- | --- | --- | --- |
| locking-on 390x844 | locking-on-mask-390x844.json | 12 | 0.01535 (2239 / 145832) | 0.04 | PASS |
| locking-on 1440x900 | locking-on-mask-1440x900.json | 12 | 0.00669 (7002 / 1047009) | 0.04 | PASS |
| camera-unavailable 390x844 (reference only, not diffed against the threshold) | camera-unavailable-mask-390x844.json | 12 | 0.4363 | n/a | reference |
| camera-unavailable 1440x900 (reference only, not diffed against the threshold) | camera-unavailable-mask-1440x900.json | 12 | 0.1770 | n/a | reference |

Pairs live beside this file as `<state>-build-<viewport>.png`, `<state>-mockup-<viewport>.png` and `<state>-mask-<viewport>.json`.

## Camera unavailable: reference only (E13)

The mockup's camera-unavailable state is captured as reference only (`camera-unavailable-mockup-*.png`, with the app's own natural no-camera state beside it in `camera-unavailable-build-*.png`) and is not held to the threshold. The mockup shows a centred message ("Camera unavailable / Allow camera access, or exit and add the card by search.") that the app does not draw: the scanner's own `camera-error` copy is pinned byte for byte (REQ-052, REQ-071) and carries only the indicator's "Camera unavailable". The mockup capture also still shows the demo card behind it (a capture artefact). The fractions above are shown for completeness only.

## Named mask regions (every one has its reason in the mask file)

- closed tray shadow and closed bottom sheets glow: as in `frame`.
- mock-mode banner copy: the mockup page's banner reads "the camera feed is a still ..."; the app's is the shared mock-mode line.
- lock progress (`.indicator`): live scan state; the app's matcher reports its own vote count (n of 3) where the mockup shows 3 of 5 on Lightning Bolt.
- lock outline: the marching outline follows the detected card; the app draws its own detection's quad, the mockup a fixed one.
- caution triangle (the mockup side only): the mockup always draws it; the app draws it together with the count pill once a card is held (REQ-214).

## Behaviour that wins over the mockup, and where the build differs on purpose

- REQ-214: the holding list and close-commit are unchanged. The count pill and the caution triangle appear once a card is held; the mockup draws the triangle always. A tap on a held card's thumbnail opens the shared card-detail popup (DEC-151), as before.
- The scanner's own copy is unchanged: "Locking on <card>", the cause hints, "Camera unavailable", "Added this session", "Joins <destination> when you close the scanner"; the mockup's "Searching ..." line and its centred camera message are not added.
- The mockup's debug panel and fixed lock outline are not built; the Debug overlay (`ScanDebugOverlay`) and the lock outline (`ScanCardOutline`) keep their own drawing (exempt, behaviour untouched).
- The hint line (E11): "Auto-scan is on: a confident match adds the card and keeps scanning. The shutter reads one frame by hand." sits under the credit, as in the mockup, on every host that scans (Ask a Question, In-depth's zones, Trade Balancer's sides).
- REQ-205: the mockup's 44px exit, shutter and pill are kept; the mute and Debug buttons (30px tall in the mockup) are unchanged from the mockup's look.

## E6 and E7 — REQ-216 audit (the brief's verbatim command, as in `translation/frame/DIFF-RESULTS.md`)

`BASE` is `65bf293` (the commit this slice started from). `FILES`: `ScanCameraSurface.tsx`, `ScanReviewBubble.tsx`, `ScanDebugOverlay.tsx` (exempt) and `ScanCardOutline.tsx` (exempt), all under `apps/frontend/src/components/`.

(a1) printed 0 (the two exempt files are skipped by the command's own list). (a2) printed 0 over the working tree against `BASE` before the milestone commit. `ScanCameraSurface.tsx` carries no `rgba(` (grep count 0, E12): the dimmed surround is the `--cs-shadow-2` token in `lib/theme/glows.css`, with the viewfinder ground, the caution yellow and the other literal shadows named there too. `git diff` of `ScanCameraSurface.tsx` shows only markup, class names and the state attribute: detection, lock, the stabilizer and the ding are untouched.

## E8 — profile-switch pair

`locking-on-profile-red-build-390x844.png` and `locking-on-profile-green-build-390x844.png` (the mockup's own capture beside each): the guide's glow and corner ticks, the indicator's border and vote bar, the lock outline, the shutter ring and disc, the exit box's hover colour, the scene and the header recolour; nothing is left on Blue. Differing fractions against the mockup (masked, tolerance 12): red 0.0108, green 0.0149.

## E9 — Life Tracker table (REQ-202)

`translation/life-tracker-table/after-build-<viewport>.png` re-captured after this slice: pixel-identical to the previous capture (0 differing pixels at both widths).

## E10 — cleanup evidence

- Playwright browser closed with `browser_close` (result: no open tabs).
- Servers this slice started and stopped: the build server (`VITE_ASK_AI_PROVIDER=mock PORT=3411 FRONTEND_PORT=5411 node scripts/dev.mjs`), the mockup server (`python3 -m http.server 5413` on the scratch copy of the mockup folder) and the capture collector on 5414.
- Ports released: `lsof -i :5411`, `:3411`, `:5413`, `:5414` each printed nothing in the listening state. Ports 5273, 3100 and 5300 were never touched.
- Capture path: `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-ui-look-translation/docs/design/ui-reimagining/build-screenshots/translation/card-scanner/`.
