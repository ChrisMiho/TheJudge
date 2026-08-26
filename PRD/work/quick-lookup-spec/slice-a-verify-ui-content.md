# Slice A — Verify the spec's UI-facing content against its cited sources

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm `PRD/sections/quick-lookup/README.md` (already written, 321 lines,
not yet committed) is complete and correct — for its header, **What it is**,
all five **How it works** subsections, **Measured bounds**, **Rejected
alternatives and deferred scope**, and the frontend-facing portion of
**Where it lives** — against the cited sources and the DEC-168 template.
This slice does not touch **The full backend path** section (slice B owns
that) or the `PRD/README.md` row / diff-scope proof (slice C owns that).
This slice verifies; it does not author. Close any confirmed, sourced gap
with a bounded additive correction only.

## Requirements

1. Read the cited sources before checking a line: `PRD/sections/decisions/lookup-suite.md`
   (DEC-107, DEC-108, DEC-112, DEC-113, DEC-114; DEC-097/DEC-099 as the
   rejected two-destination design); `PRD/sections/decisions/providers-and-contract.md`
   (DEC-020, DEC-106; DEC-096/DEC-098 as rejected wire-mode design);
   `PRD/sections/decisions/prompt-assembly.md` (DEC-025, DEC-042, only as
   background for "How it works" claims that reference them — the backend
   detail itself is slice B's scope); `PRD/sections/decisions/rules-retrieval.md`
   (DEC-029, DEC-045, DEC-046, DEC-100, background only, same caveat);
   `PRD/sections/decisions/navigation.md` (DEC-095); `PRD/sections/decisions/conversation-ux.md`
   (DEC-118); `PRD/sections/decisions/scanning.md` (DEC-053);
   `PRD/sections/decisions/ui-presentation.md` (DEC-160). Confirm each home
   file at read time rather than trusting this list — it is a map-out
   pre-scout, not ground truth.
2. Read `PRD/sections/functional-requirements.md` for REQ-072 (mode/wire
   contract, background only), REQ-073, REQ-074 (background only), REQ-075,
   REQ-079, REQ-091 (and REQ-134's amendment), REQ-092, REQ-097, REQ-098,
   REQ-011, REQ-030 (background only), REQ-129, REQ-141. Read
   `PRD/sections/user-flows.md` FLOW-011 in full. Read
   `PRD/sections/system-map.md`'s `## Quick Lookup` block, `## Ask AI
   conversation workspace`, `## Adaptive context overlay`, and `## Feature
   portal (app navigation)` entries. Read `PRD/sections/screen-layout.md`'s
   `#### Quick Question — pre-submit` and `#### Quick Question — answered
   workspace` rows. Read `PRD/sections/open-questions.md` Q-003 and Q-004.
3. Confirm the header carries the DEC-168 shape: a `Status:` line stating
   the file is a draft, derived, non-authoritative view naming the cited
   `DEC`/`REQ`/`FLOW` as the winner on conflict and `PRD/sections/decisions.md`
   as precedence #1; a `Backed by:` line citing exactly the ID set the file's
   header currently records (DEC-020, DEC-025, DEC-029, DEC-042, DEC-045,
   DEC-046, DEC-095, DEC-106, DEC-107, DEC-108, DEC-112, DEC-113, DEC-114,
   DEC-118, DEC-017, DEC-033, DEC-053, DEC-160, DEC-096, DEC-097, DEC-098,
   DEC-099, DEC-100, REQ-072, REQ-073, REQ-074, REQ-075, REQ-079, REQ-091,
   REQ-092, REQ-097, REQ-098, REQ-011, REQ-022, REQ-024, REQ-030, REQ-129,
   REQ-134, REQ-141, FLOW-006, FLOW-011, NFR-001) — no more, no fewer, unless
   slice B's combo-retrieval correction lands first and adds DEC-116,
   REQ-094, REQ-095 (coordinate via a fresh `git diff` read before finishing,
   not by assuming slice B has or has not run).
4. Confirm the six top-level sections are present, in order: **What it is**,
   **How it works**, **The full backend path...**, **Measured bounds**,
   **Rejected alternatives and deferred scope**, **Where it lives**. (Slice B
   owns the backend-path section's content; this requirement only confirms
   its heading exists in the right position.)
5. Confirm **What it is** accurately summarizes the single-destination,
   optional-card, plain-text-answer shape against DEC-107, REQ-073, FLOW-011,
   and that it correctly states the off-domain persona behavior (DEC-108)
   and the "not a full rules browser / not judge authority" scope line —
   without inventing capability beyond those sources.
6. Confirm each **How it works** subsection against its cited sources, with
   no invented capability and no omission of a stated behavior:
   - **Entry and pre-submit layout** — DEC-095 (portal registration),
     DEC-107/REQ-073/FLOW-011 (frontend-only view switch), DEC-112 (layout
     order), DEC-113 (inline guidance copy on the "OPTIONAL CARD" label,
     verbatim wording), FLOW-006 (scan resolving to one oracle-level card),
     DEC-053 (scan is presentation-only at the printing level).
   - **General rules topics browse** — REQ-079 and DEC-112 (collapsed-by-
     default outer disclosure staying visible in every pre-submit state,
     accordion topic rows, client-side-only reading, locked non-editable
     pill with the fixed phrase `Tell me about {Topic}.`).
   - **Composing and submitting the question** — REQ-091 and DEC-112 (pill/
     textarea composition rules, submit-enable conditions, the silent
     `Tell me about {Card Name}.` fallback) and REQ-091 as amended by
     REQ-134 and REQ-011 (raw-textarea-only cap/counter/`maxLength`
     measurement, not the composed string).
   - **Initial submit wait** — DEC-114 and REQ-092 (form hidden and replaced
     in place by `AskAiWaitingPanel`, optional-card and topics sections stay
     visible/interactive, error reverts to the form, success swaps to the
     conversation workspace).
   - **Answered conversation workspace** — REQ-075, DEC-118, REQ-097, REQ-098
     (shared `ConversationWorkspace`, first bubble is the answer not the
     question, follow-up wire shape, frozen-card adaptive-context trigger
     placement, Start Over behavior).
7. Confirm **Measured bounds** figures against their cited sources —
   `screen-layout.md`'s pre-submit image-fit row (390×844 / 1440×900 figures,
   the "not met" REQ-141 consequence DEC-160 anticipates), the four always-on
   core topics and the ≤2500-char static reference block (DEC-045, DEC-025 —
   confirm against `PRD/sections/decisions/rules-retrieval.md` and
   `PRD/sections/decisions/prompt-assembly.md` directly; the retrieval
   implementation detail itself is slice B's territory, this slice only
   confirms the figure matches the decision text), and NFR-001. The two
   character-cap figures (600 wire / 300 display) may be cited here as
   background but their authoritative verification against
   `askAiRequest.ts` is slice B's job — do not duplicate that check, only
   confirm this section does not contradict slice B's section.
8. Confirm **Rejected alternatives and deferred scope** matches its cited
   DECs' Context/Notes language exactly: DEC-097/DEC-099 (two-destination
   design, framed by DEC-107's Context per the package README's explicit
   instruction that this is a real measured rejection, not a superseded-
   decision footnote), DEC-096/DEC-098 (two wire modes), DEC-107 (forked
   enrichment), DEC-112/REQ-091 (pre-filled editable textarea → locked pill),
   REQ-134 (composed-string cap/counter defect and fix), DEC-113 (standalone
   guidance paragraph), DEC-100/Q-004 (answer-seeded second-pass, deferred),
   Q-003 (game-context field, deferred) — nothing invented, nothing omitted.
9. Confirm the frontend-facing portion of **Where it lives** — the
   `apps/frontend/src/components/portal/quick-lookup/` destination,
   `destinationRegistry.tsx` registration, the shared
   `ConversationWorkspace`/`AdaptiveContextDialog` components, the
   `useAskAiSubmitOrchestration.ts` hook, and the committed
   `gameRulesCoreTopics.json` artifact — against `system-map.md`'s `##
   Quick Lookup` block and the actual repository tree. Confirm each named
   file exists (`find`/`ls`), and confirm `QuickLookupApp.tsx` is actually
   registered in `destinationRegistry.tsx` (grep). Do not check the backend
   file list in this same paragraph — slice B owns that half.
10. Confirm no new stable ID token (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or
    `Q-` token followed by digits) appears anywhere in the file, outside
    slice B's licensed combo-ID addition, that does not already resolve to
    a real, pre-existing ID in its home file.
11. Touch only `PRD/sections/quick-lookup/README.md`, and only for a
    bounded additive correction confined to the sections this slice owns
    (header, What it is, How it works, Measured bounds, Rejected
    alternatives and deferred scope, the frontend half of Where it lives) —
    no edit to The full backend path section, no other file, no DEC/REQ/
    FLOW/NFR body edit, no `system-map.md`/`screen-layout.md`/
    `open-questions.md`/`goals-and-non-goals.md` edit, no `apps/` change, no
    new decision.

## Acceptance criteria

- [ ] A1 — The header carries a `Status:` line naming the file draft,
      derived, non-authoritative, with the cited `DEC`/`REQ`/`FLOW` winning
      any conflict and `PRD/sections/decisions.md` as precedence #1, and a
      `Backed by:` line whose ID set matches what the file's header actually
      records at check time — every one of those IDs confirmed to exist in
      its named home file.
- [ ] A2 — The six top-level sections are present in order: What it is, How
      it works, The full backend path (heading only), Measured bounds,
      Rejected alternatives and deferred scope, Where it lives.
- [ ] A3 — **What it is** is confirmed accurate against DEC-107, REQ-073,
      FLOW-011, and DEC-108 — no invented capability, no omitted scope line.
- [ ] A4 — Each of the five **How it works** subsections is confirmed
      traceable to its cited sources' actual text (requirement 6's per-
      subsection list) — no invented capability, no dropped behavior.
- [ ] A5 — **Measured bounds** figures are confirmed against
      `screen-layout.md`, DEC-045, DEC-025, and NFR-001 — the pre-submit
      image-fit figures and the four-topic/≤2500-char figures match their
      sources exactly.
- [ ] A6 — **Rejected alternatives and deferred scope** matches its cited
      DECs' Context/Notes language, with nothing invented or omitted,
      including DEC-097/DEC-099 framed as a real measured rejection per
      DEC-107's Context (not a bare "superseded" footnote).
- [ ] A7 — The frontend-facing portion of **Where it lives** names every
      file `system-map.md`'s `## Quick Lookup` block and the actual
      repository tree confirm belongs to the feature; `QuickLookupApp.tsx`
      is confirmed registered in `destinationRegistry.tsx`.
- [ ] A8 — No new (minted) stable ID token appears in the file outside
      slice B's licensed combo-ID addition — every ID token present resolves
      to a real, pre-existing ID in its home file — and this slice's diff
      touches only `PRD/sections/quick-lookup/README.md`, confined to the
      sections this slice owns, and only for bounded additive correction
      where genuinely needed — no `apps/` change, no edit to any existing
      DEC/REQ/FLOW/NFR body, no `system-map.md`/`screen-layout.md`/
      `open-questions.md`/`goals-and-non-goals.md` edit.

## Verification

```bash
grep -nE "^Status:|^- Status:|Backed by:|^## " PRD/sections/quick-lookup/README.md
grep -n "^### DEC-107\|^### DEC-108\|^### DEC-112\|^### DEC-113\|^### DEC-114\|^### DEC-097\|^### DEC-099" PRD/sections/decisions/lookup-suite.md
grep -n "^### DEC-020\|^### DEC-106\|^### DEC-096\|^### DEC-098" PRD/sections/decisions/providers-and-contract.md
grep -n "^### DEC-025\|^### DEC-042" PRD/sections/decisions/prompt-assembly.md
grep -n "^### DEC-029\|^### DEC-045\|^### DEC-046\|^### DEC-100" PRD/sections/decisions/rules-retrieval.md
grep -n "^### DEC-095" PRD/sections/decisions/navigation.md
grep -n "^### DEC-118" PRD/sections/decisions/conversation-ux.md
grep -n "^### DEC-053" PRD/sections/decisions/scanning.md
grep -n "^### DEC-160" PRD/sections/decisions/ui-presentation.md
grep -n "^### REQ-072\|^### REQ-073\|^### REQ-074\|^### REQ-075\|^### REQ-079\|^### REQ-091\|^### REQ-092\|^### REQ-097\|^### REQ-098\|^### REQ-011\|^### REQ-030\|^### REQ-129\|^### REQ-134\|^### REQ-141" PRD/sections/functional-requirements.md
grep -n "^### FLOW-011" PRD/sections/user-flows.md
grep -n "^## Quick Lookup\|^## Ask AI conversation workspace\|^## Adaptive context overlay\|^## Feature portal" PRD/sections/system-map.md
grep -n "Quick Question" PRD/sections/screen-layout.md
grep -n "^### Q-003\|^### Q-004" PRD/sections/open-questions.md
find apps/frontend/src/components/portal/quick-lookup -maxdepth 1 -type f
grep -n "quick-lookup\|QuickLookupApp" apps/frontend/src/components/portal/destinationRegistry.tsx
ls apps/frontend/public/data/gameRulesCoreTopics.json
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/quick-lookup/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/quick-lookup/README.md` (verify; bounded additive
  correction only if genuinely needed, confined to the sections this slice
  owns)
