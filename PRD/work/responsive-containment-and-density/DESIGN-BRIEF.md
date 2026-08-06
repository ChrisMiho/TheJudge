# DESIGN-BRIEF: responsive-containment-and-density

Status: approved (re-refinement after PR #75 review, explicit user approval 2026-08-05).

## Problem

The first pass of this package closed most measured containment defects, but product-owner
review of PR #75 found remaining tray, density, composer, roster, Theme, and submit-label
issues. Two slices stayed blocked because their acceptance criteria fought confirmed
decisions (C) or outran what DEC-148 authorized (F). `issues.md` is the authoritative
post-review work list.

## Outcome

Product truth and this brief authorize the adjustments needed so an agent can finish the
package: tray rail icons hide while open (outside-click / Escape close), card surfaces get
compact images plus a suite-wide detail popup and a horizontal In-Depth zone strip, composer
growth respects chrome below the field, Theme orbs fit one row, initial submit reads
**Send Request**, and Game Context expanded player details align on phone and desktop.
Verification stays Playwright MCP measurement at 390×844 and 1440×900 plus targeted unit
tests — no new `@playwright/test` CI harness.

## Confirmed choices (re-refinement)

| Question | Choice |
| --- | --- |
| Open Menu tray + rail | Hide Menu and History (not visible/clickable). Close via **outside click** and Escape. Amends DEC-140's "Menu trigger stays interactive." |
| Card density | Shrink images so primary chrome + CTA fit the first viewport; oracle/detail behind a **corner icon → popup with X**; In-Depth zone cards **horizontal L→R scroller**. Info icon on **every card image in the suite**. |
| Composer growth | Ceiling is chrome below the field staying on-screen / no page scroll from growth (REQ-110 intent). |
| Desktop shell width | Keep DEC-145 `min(48rem, 92vw)`. |
| Theme orbs | One row for all six; Colorless options centered under that row. |
| Initial submit label | Visible **Send Request** on first Decrypt/Ask; follow-up stays arrow. Concise Enrichment ready-copy points at the button when the optional message is empty. |
| Player details | Fix expanded secondary-details alignment on mobile **and** desktop (DEC-128 / REQ-106). |
| Package ownership | This package owns the tray-rail amendment in product truth; do not implement `chrome-tray-conversation-history-ux` here. |

## Product truth

| ID | Role |
| --- | --- |
| DEC-150 | New — open tray hides rail icons; outside-click / Escape close; revises DEC-140 / DEC-147 proxy criteria |
| DEC-151 | New — compact card images + suite-wide detail popup + horizontal zone strip; supersedes DEC-148; amends DEC-078 |
| DEC-152 | New — Theme orb single-row layout + centered Colorless options |
| DEC-153 | New — initial **Send Request** label + Enrichment ready-copy; amends DEC-146; carves out DEC-092 / REQ-070 preserve for that visible label |
| REQ-127 | New — open-tray rail hide + outside dismiss |
| REQ-128 | New — suite-wide card detail popup |
| REQ-129 | New — compact card images / first-viewport fit |
| REQ-130 | New — horizontal In-Depth zone-card strip |
| REQ-131 | New — Theme orb row |
| REQ-132 | New — Send Request label + ready copy |
| REQ-110 / REQ-122 / REQ-125 / REQ-115 / REQ-058 / REQ-106 | Amended to match |
| DEC-140 / DEC-147 / DEC-148 / DEC-078 / DEC-146 / DEC-128 / DEC-131 / DEC-092 | Amended or superseded as noted in bodies |
| FLOW-001 / screen-layout.md | Amended for tray, cards, composer, Theme, submit |
| DEC-145 / REQ-124 | Unchanged (48rem shell) |
| DEC-128 / REQ-106 (roster containment) | Still in force; alignment fix is enforcement + desktop coverage |

## Issues → requirements

| issues.md # | Lands on |
| --- | --- |
| 1 tray icons clickable through tray | DEC-150, REQ-127 (amends DEC-140/147, REQ-115/122) |
| 2 player details misaligned | DEC-128 / REQ-106 (amended) |
| 3 oracle icon + popup | DEC-151, REQ-128 |
| 4 shrink images / no stranded scroll | DEC-151, REQ-129 (unblocks F / REQ-125) |
| 5 horizontal zone cards | DEC-151, REQ-130 |
| 6 Theme orb row | DEC-152, REQ-131 |
| 7 Send Request + ready copy | DEC-153, REQ-132 |
| 8 composer growth ceiling | REQ-110 / DEC-131 notes |

## Unblocks

- **Slice C:** opacity already met; retire box-bottom and trigger∩row proxy criteria; replace with rail-hide + outside-click close.
- **Slice F:** DEC-148 levers alone cannot hit REQ-125; DEC-151 / REQ-128–130 provide the authorized density path.

## Non-goals

- Theme, typography, or brand redesign beyond Theme orb layout (DEC-152).
- Any change to Ask AI behavior, prompt assembly, payload shape, stack ordering,
  `GameContext`, Zod schemas, providers, or backend routes.
- A new `@playwright/test` CI harness.
- Implementing or absorbing `chrome-tray-conversation-history-ux` slices.
- Merging this package or running cleanup (human-controlled).
- Revisiting the DEC-145 48rem shell width.

## Implementation pointers (non-normative)

- Prefer shared `CardPresentation` (or equivalent) for the corner detail control so every
  card image surface stays consistent.
- Tray open-state: hide/disable rail controls rather than fighting z-index so History and
  Menu cannot receive hits; keep Escape and outside-click paths that already exist.
- Composer: growth ceiling must account for UI **below** the textarea (submit row /
  destination chrome), not only the field's bottom vs viewport bottom.
- Measure before/after at 390×844 and 1440×900 with Playwright MCP; call `browser_close`
  when done.
- `npm run quality:check` may be red for pre-existing worktree/env reasons — see
  `HANDOFF.md`; do not treat those as this package's regressions.
