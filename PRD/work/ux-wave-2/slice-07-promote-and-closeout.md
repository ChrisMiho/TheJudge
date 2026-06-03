# Slice 07 — Promote and closeout

status: pending

**Prerequisites:** [slice-06-ui-enrichment-and-submit.md](./slice-06-ui-enrichment-and-submit.md)  
**Next slice:** None — delete this work folder

## Goal

Promote durable docs to `PRD/sections/`, merge feature branch, remove ephemeral planning files.

## Tasks

### PRD promotion

- [ ] Add **DEC-021+** to `PRD/sections/decisions.md`:
  - GameContext parent model
  - Turn phase enum (combined combat)
  - Zone selection + phase defaults
  - Zero cards allowed; empty zones omitted from payload
  - MTG reference block + scope sentence in prompt
  - ContextTarget model
- [ ] Update `PRD/sections/user-flows.md` — new 5-step flow
- [ ] Update `PRD/sections/functional-requirements.md` — new requirements or amend REQ-015+
- [ ] Update `PRD/sections/integrations-and-data.md` — new `AskAiRequest` / `GameContext` shapes

### Git

- [ ] Open PR `workflow/ux-wave-2` → `main`
- [ ] Merge after review + CI

### Cleanup

- [ ] Delete entire `PRD/work/ux-wave-2/` folder
- [ ] Do **not** link work folder from root README (per doc-lifecycle)

## Validation gate

```bash
npm run quality:check
git status   # clean after delete
```

Manual:

- [ ] `PRD/sections/` reflects shipped behavior
- [ ] No references to old top-level `stack` / `battlefieldContext` in integration docs
- [ ] `PRD/work/ux-wave-2/` does not exist on `main`

## Done when

- Feature on `main`, product truth updated, ephemeral work folder removed

## Optional follow-ups (new issues, not this slice)

- Trim remaining `App.tsx` debt if any
- Archive remote `skills/workflow-acceleration`
- OpenAI prompt tuning based on real usage
