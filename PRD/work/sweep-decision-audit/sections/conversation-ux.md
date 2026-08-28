# Sweep finding — conversation-ux

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/conversation-ux.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 22

## DEC-031 — absorbed
In-Depth README states the waiting panel replaces the submit form with a live elapsed timer and 0s/3s/8s/15s/25s/40s `aria-live` thresholds while card list/wizard context stays visible, citing DEC-031 directly.

## DEC-038 — absorbed
In-Depth README's follow-up request line (`{ question, gameContext: frozen, conversationHistory }`, backend validation rules, unchanged response shapes) cites DEC-038 directly and matches the decision's Impact bullets.

## DEC-039 — absorbed
In-Depth README states history is "ephemeral — no server-side session store — though the workspace's browser-local history drawer (shared chrome) can persist and resume completed conversations," correctly reflecting DEC-039's own note that it is narrowly reopened by DEC-124/DEC-130 while otherwise standing.

## DEC-040 — absorbed
In-Depth README covers frozen game context, text-only follow-ups, and Start Over's exact preserve/clear split (player roster preserved; zones/cards/question/phase cleared), citing DEC-040 directly.

## DEC-041 — absorbed
In-Depth README states the docked composer "shows an inline processing spinner while in flight (never the full waiting panel)," matching DEC-041 exactly and citing it.

## DEC-118 — absorbed
Shared-chrome README's "The shared answered-conversation workspace" section restates the one-workspace-for-both-flows design, stable rows, auto-scroll/New-response behavior, and frozen-context read-only rule; In-Depth and Quick Lookup both cite DEC-118 for their consumption of it.

## DEC-123 — absorbed
Shared-chrome README states assistant turns render as "sanitized structured markdown (GFM; no raw HTML execution)" with the wire contract unchanged, matching DEC-123 and citing it.

## DEC-124 — absorbed
Shared-chrome README's "Conversation history drawer" section covers auto-save on first answer, the 20-entry cap with oldest-pruned, per-entry stored fields, guarded-read corruption handling, and resume semantics — matching DEC-124's Impact list.

## DEC-125 — absorbed
Its specifically-superseded clauses (full-width in-body trigger, sub-768px bottom sheet) are correctly not restated — shared-chrome instead documents the DEC-126/DEC-134 successor state — but DEC-125 is still cited alongside them for the surviving mutual-exclusivity/drawer mechanics that persist unchanged.

## DEC-126 — absorbed
Shared-chrome README documents the icon-only History zone integrated into the corner rail (distinct accessible name, non-overlap rules) and cites DEC-126 in both the rail-geometry and history-drawer passages; the stacked/`clamp()` geometry DEC-126 itself flagged as superseded is correctly represented via DEC-137 instead.

## DEC-127 — absorbed
Shared-chrome README's workspace section states the thread "fills the available workspace height," a docked rounded-pill composer, and stronger turn contrast (plain flowing assistant text, solid right-aligned user bubbles), citing DEC-127.

## DEC-129 — absorbed
Shared-chrome README states the History zone is "always present — including empty history, every pre-submit step, and immediately after Start Over — and must not overlap View Context," near-verbatim from DEC-129's decision line.

## DEC-130 — absorbed
Shared-chrome README's third history-drawer bullet covers the one-Draft-slot-per-destination model, auto-hydrate on mount, clear-on-first-submit, and exclusion from the 20-entry cap — matching DEC-130's Impact list in full.

## DEC-131 — partial
Missing: the decision's pre-submit composer clause is explicitly stated only for In-Depth's Enrichment field ("the pre-submit composer presents the field as the dominant row element... grows with typed content without forcing page scroll," DEC-131 cited) — quick-lookup/README.md's "Composing and submitting the question" section never restates the grow-with-content behavior for Quick Question's own question field, and DEC-131 is absent from quick-lookup's Backed-by list even though the decision text names both destinations. The answered-workspace half of DEC-131 (short-thread fill, Start Over reachability) is fully absorbed via the shared component in shared-chrome/README.md.

## DEC-134 — absorbed
Shared-chrome README states selecting a history entry "on In-Depth from any staged step lands the flow on the answered workspace in the same action" and that the drawer "presents as a left-edge, full-height drawer at every viewport" — both of DEC-134's two corrections, matching exactly.

## DEC-138 — absorbed
Shared-chrome README states "Opening a saved conversation from mid-flight staging silently snapshots Draft first, in both destinations," matching DEC-138 exactly including the both-destinations scope.

## DEC-141 — absorbed
Shared-chrome README's workspace section and Measured Bounds both describe the retargeted `--layout-surface-gap` clearance (post-DEC-137 rail footprint, no rail-sized compensating constant, History↔View Context non-overlap preserved), matching DEC-141's Impact precisely.

## DEC-142 — absorbed
Shared-chrome README states "View Context, the History drawer, and the Menu tray all dismiss on outside/scrim click in addition to Close and Escape," matching DEC-142's core scope (View Context + History) exactly.

## DEC-143 — absorbed
Shared-chrome README's history-drawer section states each completed row has a delete control with confirmation, that deleting the active conversation returns to a clean state without re-saving, that the 20-cap is preserved, and that Draft rows aren't covered — matching DEC-143's Impact list in full.

## DEC-144 — absorbed
Shared-chrome README states View Context on a resumed lookup card "never white-screens the app — CardSelectionPreview tolerates missing/undefined colors / supertypes / subtypes... falling back to N/A-style empty handling," and that persistence prefers the full `CardMetadataItem` shape — matching DEC-144 exactly.

## DEC-146 — partial
Missing: the decision governs both "Enrichment (optional question) and Quick Question" composers, and in-depth/README.md fully states the Enrichment side (full-width field, inline counter, compact submit, DEC-146 cited) — but quick-lookup/README.md's composing section never describes the submit control's row composition (field-dominant row, compact circular submit) for Quick Question, and DEC-146 does not appear in quick-lookup's Backed-by list at all.

## DEC-153 — partial
Missing: the decision applies to both "Quick Question first ask and In-Depth Enrichment decrypt," and in-depth/README.md has an explicit Built line for the visible **Send Request** label (DEC-153 cited) — but quick-lookup/README.md never states this as a Built behavior; "Send Request" appears only incidentally in a Measured Bounds footnote about image-fit sizing, not as a stated label/accessible-name requirement, and DEC-153 is absent from quick-lookup's Backed-by list.
