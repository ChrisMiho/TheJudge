# Slice G evidence

## G10 — no provider call in the slice

2026-10-06: slice G made no provider or model call. Nothing in it ran `--confirm-live-calls`; the only embedding work was the in-process local model through `npm run eval:build-rules-gate-vectors`, which refuses any provider but `local` and reads no API key. No network call was made.

For the record, across the whole build one call did reach a provider: in slice A a plain `npm run eval:answer-quality` dry run found the owner's key in the main checkout's `.secrets/` (the command fills it in from a linked worktree's main checkout) and, because a key was present, ran its documented models-list access check (`client.models.list()`, no completion, no cost). It was caught at once, and every later dry run used a stand-in environment loader that reads no key file, so no further request was made. Slices B to G made none.

## The 120 hard-area cases

- 60 `cr-example` cases (tier 1, answer is the Example text verbatim): combat 4, triggered abilities 6, resolution 4, continuous effects 4, layers 5, replacement and prevention 7, state-based actions 1, copies 10, double-faced cards 5, multiplayer 6, Two-Headed Giant 4, Commander 4.
- 58 `two-card-ruling` cases (tier 2, ruling text verbatim, both cards attached): counted by each case's first deciding rule: replacement and prevention 16, triggers 6, resolution 5, copies 5, combat 4, double-faced cards 3, layers 2, Commander 2, state-based actions 1, and 14 more whose first deciding rule sits in a neighbouring section (113, 118, 305, 404, 502, 601, 610, 701, 702). All twelve areas are represented by the 60 `Example:` cases alone (the `cr-example` counts above). The brief's weighting toward cleanup-step timing could not be met from two-card rulings: no committed ruling that names a second card matches the cleanup step once the false matches are removed, so cleanup-step timing is covered by the tester case Q2.
- 2 `tester` cases (tier 3, drafts): `academy-manufactor-esix-treasure` (614.1a, 616.1, 616.1e, 616.1f) and `necropotence-silence-borne-upon-a-wind-cleanup` (514.1, 514.2, 514.3a; all three cards attached; `source.research` names Jon's Rulemancer app in words; Jon's two-step wording in `layers.variants`).
- 63 of the 120 are `does-not-work` (29 + 34 + 0), against the 40 required.
- The ratchet baseline was re-recorded for all 393 cases: 290 with every deciding rule reaching the prompt, 103 with a miss. No case failed the card, state or vector checks.
