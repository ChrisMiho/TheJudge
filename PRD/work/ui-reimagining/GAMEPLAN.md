# Gameplan — ui-reimagining

## What a player experiences

Nothing in the shipped app changes yet. A player still sees today's Menu,
Quick Question, In-Depth Question, Trade Balancer, and Life Tracker exactly as
they are now. What this package produces is something the **owner** clicks
through: one HTML mockup per in-scope flow, each showing the arcane,
colour-driven theme direction 1 proposes, paired with a screenshot of today's
screen so the owner can compare old against new before any code changes. A
Life Tracker before/after screenshot pair proves the redesign's shared chrome
would not disturb Life Tracker's own screen if it shipped. Separately, the
approved product truth (`REQ-200`–`REQ-205` and eleven amendments) lands in
`PRD/sections/` so the next package builds against settled requirements
instead of a proposal.

## The honest headline, restated for the builder

**This package ships no app code.** `apps/frontend` and `apps/backend` are
untouched. The deliverable is (1) durable PRD truth and (2) a folder of
static, self-contained HTML/CSS/JS mockup pages plus screenshots, committed
under `docs/design/ui-reimagining/` — a durable design-candidate tree outside
the package folder, mirroring `docs/design/tab-icon/`'s precedent, since
`thejudge-cleanup` deletes `PRD/work/ui-reimagining/` on close and the owner
must still be able to open direction 1 after that. `PRD/work/ui-reimagining/`
itself holds only the process artifacts (this GAMEPLAN, the slice docs, the
gate history) that cleanup removes. Do not let any slice's acceptance
criteria, commit message, or the final receipt imply a shipped visual change —
direction 2/3 and the real redesign are named follow-on packages in
`DESIGN-BRIEF.md`.

## Architecture / data flow

```
PRD/work/ui-reimagining/            (process artifacts only; deleted at close)
  |
  +-- PRD/sections/ (slice A, independent)
        functional-requirements.md  + REQ-200..REQ-205 (new)
                                     amend REQ-044/046/056/060/099/124/129/130/167
        non-functional-requirements.md  amend NFR-011
        user-flows.md                amend FLOW-007 (+ FLOW-001 step-1 wording)
        goals-and-non-goals.md        amend two bullets
        system-map.md                 amend Theme settings summary
        -- applied by intent from the finalized GATE-QUESTIONS.md diffs --
        -- no feature README `Built:` line touched: no code ships here --

docs/design/ui-reimagining/         (committed deliverables; durable, survives close)
  |
  +-- README.md              <- slice B: names direction 1, what each file is
  +-- direction-1/           (slice B: shared foundation; slices C-F: per-flow pages)
  |     tokens.css        <- single source: 6 profiles x REQ-200 surface roles
  |     motifs/            <- REQ-201 original per-colour motif assets (svg/css)
  |     shell.css           <- shared chrome/page-shell rules every page imports
  |     shared-chrome-menu.html   (slice C) -- also produces the Life Tracker pair
  |     quick-question.html      (slice D)
  |     in-depth-question.html   (slice E)
  |     trade-balancer.html      (slice F)
  +-- before/*.png            <- today's live app, captured once (slice B)
  +-- after/life-tracker-*.png <- slice C: the REQ-202 proof pair's "after" half
  +-- index.html               (slice G) <- gallery linking every page above
```

Every per-flow page (`shared-chrome-menu.html`, `quick-question.html`,
`in-depth-question.html`, `trade-balancer.html`) is a real, openable,
resizable HTML file: viewing it at 390px and at 1440px wide **is** the phone
and desktop mockup — there is no separate "after" screenshot for those four,
because the page itself is what the owner clicks through. The one place a
screenshot stands in for a live page is Life Tracker, which is out of scope
for its own redesign (`REQ-202`): slice C composes Life Tracker's real screen
content inside the new shared chrome and captures that as the "after" half of
a before/after **screenshot pair**, since there is no clickable Life Tracker
mockup to open.

`tokens.css` and `motifs/` are the one authoritative source every per-flow
page consumes (`REQ-200`'s "one authoritative frontend source... no
duplicated colour constants" carried into the mockup layer even though this
is not app code) — slices C-F read them, never redefine a palette value
locally, which is why they all depend on slice B and not on each other. All
of `direction-1/`'s files live in one flat folder, so each page's own imports
stay simple relative references (`tokens.css`, `shell.css`, `motifs/...`); a
page's reference to a screenshot one level up in `before/` or `after/` is the
only relative path a slice needs to write as `../before/...` or
`../after/...`.

## Slices

| Slice | Goal | Status | Dependencies |
| --- | --- | --- | --- |
| [A — prd-truth-application](slice-a-prd-truth-application.md) | Apply the finalized `GATE-QUESTIONS.md` diffs (`REQ-200`-`REQ-205` new; `REQ-044/046/056/060/099/124/129/130/167`, `NFR-011`, `FLOW-007` amended) to `PRD/sections/` by intent, exactly once. No app code, no `Built:` line touched. | planned | parallel-ready — no dependency |
| [B — design-system-and-baselines](slice-b-design-system-and-baselines.md) | Build the shared token/motif CSS every mockup page consumes (`REQ-200`, `REQ-201`), and capture "before" screenshots of today's live app for every in-scope destination plus Life Tracker at 390x844 and 1440x900 | planned | parallel-ready — no dependency |
| [C — shared-chrome-and-menu-mockup](slice-c-shared-chrome-and-menu-mockup.md) | Clickable HTML mockup of shared chrome and the Menu (theme picker, brand mark, overlays); produces the Life Tracker before/after screenshot pair proving `REQ-202` inheritance causes no drift | planned | sequential — B |
| [D — quick-question-mockup](slice-d-quick-question-mockup.md) | Clickable HTML mockup of Quick Question, fixing `REQ-129` (Send Request stays in the first viewport at up to 5 attached cards) and `REQ-205` touch floors | planned | sequential — B |
| [E — in-depth-question-mockup](slice-e-in-depth-question-mockup.md) | Clickable HTML mockup covering every In-Depth Question step, fixing `REQ-130` (>=3 zone tiles visible) and `REQ-205` touch floors, demonstrating the `REQ-203` cross-screen Easter-egg entry point | planned | sequential — B |
| [F — trade-balancer-mockup](slice-f-trade-balancer-mockup.md) | Clickable HTML mockup of Trade Balancer, implementing `REQ-204` (phone: two sides as tabs; desktop unchanged) and `REQ-205` touch floors | planned | sequential — B |
| [G — gallery-and-ship-gates](slice-g-gallery-and-ship-gates.md) | `docs/design/ui-reimagining/index.html` gallery linking every page and the Life Tracker pair; confirms slice A's PRD truth is complete and no app code changed; carries the Ship gates block | planned | sequential — A, C, D, E, F |

A and B are parallel-ready: A only touches `PRD/sections/`, B only touches
`docs/design/ui-reimagining/`. C, D, E, and F are parallel-ready with
each other once B exists — each writes its own page and reads B's shared
`tokens.css`/`motifs/`/`shell.css` and `before/` captures, with no file
overlap between them. G is sequential on every other slice because its
gallery links pages C-F produce and its promotion checklist confirms slice
A's output.

## Verification checklist

- Slice A: `npm run quality:check` (regression only — the edits are
  `PRD/sections/*.md`; nothing in the app build should move).
- Slices B-F carry browser-observable risk (responsive geometry, touch-target
  sizing, viewport containment) per `PRD/instructions/runtime-process-hygiene.md`
  — each slice's acceptance criteria name the exact scenarios, viewports
  (390x844 phone, 1440x900 desktop, 768px the Trade Balancer tab/side-by-side
  boundary), and measurements to check, plus a cleanup-evidence criterion
  (browser closed, the dev server this slice started stopped, ports released,
  capture path recorded under `PRD/work/ui-reimagining/.playwright-mcp/`).
- "Before" screenshots and the Life Tracker "after" pair are **committed
  deliverables**, not disposable captures — `PRD/instructions/runtime-process-
  hygiene.md`'s "captures are disposable, do not copy them out of the package
  folder" rule governs only in-session Playwright evidence, and does not
  apply to them. They live under `docs/design/ui-reimagining/before/` and
  `docs/design/ui-reimagining/after/`, outside `PRD/work/ui-reimagining/`
  entirely, so they survive `thejudge-cleanup`'s deletion of the package
  folder and remain the artifact the owner reviews after close — mirroring
  `docs/design/tab-icon/`'s precedent for committed design candidates. Raw
  Playwright captures used only as in-session evidence stay in the
  git-ignored `PRD/work/ui-reimagining/.playwright-mcp/` folder and are not
  committed.
- Slice G: `npm run quality:check` (final regression) plus a `git status`/`git
  diff` scope check confirming no path under `apps/frontend` or `apps/backend`
  changed.
- No slice runs `npm run data:refresh`, touches `.secrets/`, or edits a
  `thejudge-*` skill — none of this package's work needs any of them.

## Next step

`/thejudge-implement PRD/work/ui-reimagining/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/ui-reimagining/ slice A` (Codex) — A and B are
both valid starting points since neither depends on the other. For one
unattended agent completing every slice,
`/thejudge-implement-all PRD/work/ui-reimagining/`.
