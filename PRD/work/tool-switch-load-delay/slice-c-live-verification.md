# Slice C — Live timing check and ship gates

## Status: done

Evidence: `slice-c.evidence.md` (one scheduler fix came out of the run: the download now starts after the landing destination renders).

## Goal

Prove on a production build that tools open with no "Loading…" frame and the first screen is no slower, then close the package.

## Requirements

Depends on slices A and B. No product code unless a check fails (then fix in the owning slice's files and rerun). Measure with an rAF-timed tap script against `npm --workspace apps/frontend run build` plus `vite preview`, first visit, cache cleared. Follow `PRD/instructions/runtime-process-hygiene.md`; captures go under `PRD/work/tool-switch-load-delay/.playwright-mcp/`. Record results in `evidence/`.

## Acceptance criteria

- [ ] Quick Question landing, wait 3 s, tap Life Tracker: no "Loading…" frame, tool on screen within 100 ms, at Fast 4G + CPU 4x and Slow 4G + CPU 4x
- [ ] Continuing: Trade Balancer, In-Depth, Quick Question each with no "Loading…" frame within 100 ms; the Trade Balancer shows no "Loading card list…" frame
- [ ] Tier order by Resource Timing on Quick Question and Life Tracker landings: every tier-2 chunk `startTime` is after the landing marker ("Ask a Question" text; the "-player life table") and before the tier-3 `/data/cardMetadata.json` request on the Life Tracker landing
- [ ] Life Tracker landing on Fast 4G + CPU 4x, after the card list `responseEnd`: Quick Question, In-Depth, Trade Balancer each within 100 ms with no "Loading…" frame; the card list is requested exactly once; no "Loading card list…" frame
- [ ] First screen not slower: "Ask a Question" time versus the pre-change build over three runs each, no consistent slowdown over 50 ms
- [ ] No `GET /api/health` before the balancer opens; the card list is requested exactly once per page load on every landing; no tool mounted by the download
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/tool-switch-load-delay/.playwright-mcp/`
- [ ] PRD promotion checklist: Diffs 1-4 are present in `PRD/sections/` (cleanup confirms; nothing is re-written)
- [ ] Ship gates below are met

## Verification

```bash
npm --workspace apps/frontend run build
npm run quality:check
```

## Files touched

- `PRD/work/tool-switch-load-delay/evidence/` (timing results)
- No product code expected

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/tool-switch-load-delay/` ready to delete
