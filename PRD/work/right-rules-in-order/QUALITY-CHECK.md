# Quality check — right-rules-in-order

**Verdict: PASS.** Graph-controlled run (`graph-20261011-234114`, node `gate-qc`, attempt 1). No findings. The package stays at `STATUS.refined`.

Checked: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (39 slots, verdicts blank by design), `evidence/amendment-grep.md`, `intake/GRAPH-BRIEF-search-and-prompt.md`. The probe folder was not opened. No network or paid calls.

## Requested checks

| # | Check | Result |
| --- | --- | --- |
| 1 | Every removed and context diff line matches current `PRD/sections/` | Pass. One script over all 39 diffs checked 344 removed and context lines against the target file (`functional-requirements.md`, `non-functional-requirements.md`, `user-flows.md`, or the named section doc). 0 mismatches. |
| 2 | Plain-language block and complete diff in every slot | Pass. All 39 slots carry "What this decides", "In plain terms", "What happens if you say no", a closed `diff` fence, and an empty `- Verdict:` / `- Reason:`. New-requirement slots carry the whole entry as added lines. |
| 3 | Amendment grep re-runs to the same count, every hit has a disposition | Pass. The recorded pattern re-run over `PRD/sections` gives 100 hits in 12 files. The table has 100 rows with the same file:line set (no missing, no extra): 70 amend, 5 build, 25 no change. Every amend/build row names an existing slot. |
| 4 | Acceptance targets measurable and numerically consistent | Pass. Brief targets 1-3 and 5 match the intake gates exactly (473/159/5/351/305; check >= 430, tuning >= 410, every-rule >= 140, hard 25 >= 15; corpus >= 410 and >= 355; bench@5 >= 118; 17 of 30). Each is a count or threshold. Size: intake 4.9k against 7.5k is search-excerpt characters and is report-only; the 12,000-character list budget covers any two of the largest lists (2 x 5,359 = 10,718). The always-on lists add 916 + 2,833 = 3,749, matching "about 3,750" in the slot and "3.7k" in the brief. |
| 5 | REQ-233 to REQ-245 unused; no DEC added | Pass. No hit for these ids in `PRD/sections` on `main` or `origin/main`. No `DEC-###` entry is added in any slot (DEC mentions are citations only). |
| 6 | Privacy | Pass. A local scan of 50-character windows from every practice-suite question and answer against every package `.md` found 0 matches (count only). No suite ids or per-question results. The corpus case ids named (Necropotence, 702.3a, 113.7a, 615.12 cases) are already committed in `functional-requirements.md`. `git ls-files` lists no `.onnx`, `.safetensors` or checkpoints; the only `.bin` files are pre-existing frontend fixtures. |
| 7 | `git diff --stat 61d32c76 HEAD -- PRD/sections apps scripts docs .gitignore` | Pass. Empty. |

## Skill checklist

- Current-state contradictions: none found. The brief reconciles REQ-095/REQ-190 (assumption 1), REQ-220's recorded rejection (assumption 2), and REQ-232 (assumption 3) as explicit slots.
- Stack ordering preserved: REQ-243 keeps bottom-to-top semantics and only unifies the prompt wording to 1-based "Stack item N".
- Technical design rules: no endpoint, request, response or frontend change; no new npm dependency; no rules engine.
- Screen layout: no user-visible screen change, so no `screen-layout.md` row is needed.
- Open questions: none; each open choice passed the preparation-contract ladder and is listed as a material assumption. Two (assumptions 2 and 3) are surfaced as gate slots.
- Package state: exactly one marker, `STATUS.refined`. `GRAPH-RUN.md` and `README.md` untouched.
