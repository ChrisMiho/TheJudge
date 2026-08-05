# Session handoff — responsive-containment-and-density

Written 2026-08-05 for a fresh session picking up tweaks after product-owner review of
PR #75.

**Read order: [`issues.md`](./issues.md) → this file → `README.md`.** `issues.md` is the
work list; this file is the context needed to work it safely. Slice docs hold per-slice
detail.

## Where things stand

| | |
| --- | --- |
| Branch | `feature/responsive-containment-and-density` @ `d4ef683` |
| PR | [#75](https://github.com/ChrisMiho/TheJudge/pull/75) → `feature/automated-refinement` (**not** `main`) |
| Package status | `refined` (`STATUS.refined`) after 2026-08-05 re-refinement of `issues.md` — QC → map-out before more implement |
| Working tree | clean at time of writing |
| Dev server | started for review: frontend `:5173`, backend `:3000`, `ASK_AI_PROVIDER=mock` |

The PR is open for review, not merged. Do not merge or run `thejudge-cleanup` — both are
human-controlled.

## Slice status

| Slice | Status | One-line outcome |
| --- | --- | --- |
| A | done | Composer no longer pins `height: 0px`; 20px of typed text recovered |
| B | done | Composer field 40% → 66% of its row at 390px |
| C | **blocked** | Tray opaque + label clears rail; 2 of 7 criteria conflict with DEC-140/DEC-135 |
| D | done | Banner clears every destination header |
| E | done | Shell width cap 670 → 768px |
| F | **blocked** | Card detail 1286 → 1153px; add action still 112px below fold |
| G | done | Roster rows contained in their panel |
| H | done | Full-flow re-verification at both viewports |

Blocked slices carry a `### Handoff` block under their status line
(`PRD/instructions/workflow-reference.md` convention) with the concrete next action.

## Read this before running anything

**`npm run quality:check` is red, and was red before this branch's first commit.** Verified
by stashing all changes and re-running. Do not try to "fix" these as part of this package
and do not treat them as regressions:

1. **`lint` — 902 errors.** `.claude/worktrees/agent-a4c9b03d9142f4cff` and
   `agent-ae4a622c95c07ac17` are registered git worktrees inside the repo, so ESLint sees
   multiple candidate `tsconfigRootDir`s and refuses to parse. They belong to other
   sessions — check `git worktree list` before removing anything.
2. **`format:check` — 42 files.** All 42 are inside those same two worktrees. Zero real
   formatting issues in tracked source.
3. **`test` — `App.feedback.test.tsx`** "keeps submit a no-op with a hint when no form id
   is configured" fails because `apps/frontend/.env:7` sets `VITE_FEEDBACK_FORMSPREE_ID`
   and Vite loads `.env` during tests. The test depends on ambient env instead of stubbing
   the unconfigured state. Unrelated to this package.

Working verification for this package: `npm run typecheck` + targeted workspace tests +
Playwright MCP measurement. Frontend suite is **1187/1188** with only #3 failing.

## Product truth this package owns

New in `PRD/sections/`:

- `DEC-145` (ui-presentation) — desktop shell width cap `min(48rem, 92vw)`; vertical dead
  space explicitly accepted. **Rewritten mid-implementation** — see "Decisions changed" below.
- `DEC-146` (conversation-ux) — pre-submit composers adopt `FollowUpComposer`'s composition
- `DEC-147` (navigation) — open tray opaque against all destination content; first row's
  hit area clears the rail band
- `DEC-148` (ui-presentation) — narrow-viewport card detail caps image, drops duplicate text
- `REQ-120`–`REQ-125` in `functional-requirements.md`

Amended: `FLOW-001` edge cases and notes; `DEC-131` Notes (supersession pointer);
`system-map.md` mock-mode-banner entry. Inherited unchanged: `DEC-128` / `REQ-106`.

The former `PRD/work/mobile-player-details-overflow/` package was **absorbed and deleted**
by user decision; its defect shipped as slice G.

## Decisions changed during implementation

`DEC-145` and `REQ-124` originally specified a `90rem` cap and vertical fill on both axes.
Both were built, reviewed by the product owner, and rejected: at 1325px every control
became a band (1277px "Confirm game context"), and stretching the card vertically framed an
empty region rather than removing it. To-scale mocks of all five candidate widths were
built at [`mocks/width-options.html`](./mocks/width-options.html) and **48rem was chosen**,
with rendered CTA width as the deciding measure rather than percentage of viewport filled.
Both documents were rewritten to match. If a tweak revisits desktop width, start from those
mocks — they are still accurate.

## Files this package touched

| Area | Path |
| --- | --- |
| Auto-grow hook | `apps/frontend/src/hooks/useAutoGrowTextarea.ts` (+ test) |
| Shared submit control | `apps/frontend/src/components/ComposerSubmitButton.tsx` (new) |
| Pre-submit composers | `EnrichmentStep.tsx`, `portal/quick-lookup/QuickLookupApp.tsx` |
| Banner | `MockModeBanner.tsx` (publishes `--mock-banner-height`) |
| Shell / tray / banner CSS | `apps/frontend/src/index.css` |
| Tray | `portal/FeaturePortalMenu.tsx` |
| Card detail | `CardSelectionPreview.tsx` |
| Roster | `PlayerRosterEditor.tsx` |

**Deliberately not modified**, used as reference patterns — keep it that way unless a tweak
says otherwise: `ConversationHistoryDrawer.tsx` (opaque + scrim, the target for DEC-147) and
`FollowUpComposer.tsx` (the target composition for DEC-146; only its local `SendIcon` moved
to the shared module, rendered output unchanged).

## Gotchas

- **Playwright MCP screenshots default to the repo root.** Pass a
  `.playwright-mcp/<name>.png` filename — that directory is gitignored. Absolute paths
  outside the repo are rejected.
- Call `browser_close` when browser verification finishes (`CLAUDE.md`).
- Inactive portal destinations stay mounted with zero-size boxes. Several
  `.mock-mode-banner` nodes and several composer textareas exist at once; filter by
  measured height before asserting on counts. This is what caused the slice A bug.
- The `sm` breakpoint is **viewport** width (640px), not container width, so it is active
  at every desktop shell setting.
- `git status` may look clean while `PRD/work/STATUS.md` disagrees with `STATUS.*` markers
  on disk — the board drifted once already this session.

## The work list lives in `issues.md`

[`issues.md`](./issues.md) is the product owner's brain dump of everything found while
reviewing this package — free-form, unordered, written as noticed. **It is the
authoritative list of what to investigate and fix in the next session.** Read it before
anything else in this folder.

Rules for the agent working it:

1. **Read the whole file first.** Entries are written as they came to mind, not grouped or
   prioritized. Two entries may describe the same underlying cause, and one entry may
   cover several surfaces.
2. **Reproduce and measure before fixing.** Every fix in this package landed against a
   measured before/after at 390×844 and 1440×900 using Playwright MCP; hold the same bar.
   An entry that cannot be reproduced gets recorded as such, not quietly skipped.
3. **Fix the cause, not the symptom.** The three most valuable fixes here came from finding
   a mechanical cause (`scrollHeight` read from an unrendered element, a hardcoded `2rem`
   against a 56px banner, `flex-1` without `min-w-0`) rather than nudging CSS until the
   screenshot looked right.
4. **Check the entry against existing decisions first.** Several findings in this package
   turned out to be violations of confirmed truth (`DEC-085`, `DEC-131`, `DEC-140`) rather
   than new scope — those need no new decision, just enforcement. Others conflicted with a
   decision and needed a product call. Establish which before writing code.
5. **Anything that changes an acceptance criterion or a decision routes through
   refinement**, not a direct edit — see below.
6. **Mark each entry resolved in `issues.md` as you go**, with the measurement or the
   reason it was not actionable, so the file stays an accurate record rather than a stale
   wish list.

Entries that turn out to be substantial enough to need their own slices should be mapped
into this package's existing GAMEPLAN rather than a new package — this one is still
`active` with two blocked slices.

## Suggested first move

```
/thejudge-kickoff
```

then point it at `PRD/work/responsive-containment-and-density/issues.md`.

For any tweak that changes an acceptance criterion or a decision, route through
`/thejudge-refinement PRD/work/responsive-containment-and-density/` so `PRD/sections/`
stays truthful — three criteria in this package turned out to be proxies that fought the
design, and editing code without editing the criterion is how that drift started.
