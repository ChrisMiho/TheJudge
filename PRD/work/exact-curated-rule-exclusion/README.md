status: refined

# exact-curated-rule-exclusion

Rule search stops hiding curated parents' sub-rules: exclude only the exact rule numbers a curated topic carries (REQ-179).

- Idea: [IDEA.md](IDEA.md)
- Intake (verbatim, evidence only): [intake/GRAPH-BRIEF.md](intake/GRAPH-BRIEF.md)
- Design brief: [DESIGN-BRIEF.md](DESIGN-BRIEF.md)
- Proposal (owner verdict slots: REQ-179, REQ-022, REQ-181, REQ-182, REQ-220): [GATE-QUESTIONS.md](GATE-QUESTIONS.md)
- Next: `thejudge-quality-check` (graph run `graph-20261008-053030`, node 4 `gate-qc`).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/exact-curated-rule-exclusion

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/exact-curated-rule-exclusion/DESIGN-BRIEF.md`
- Findings: (attempt 1 of 3; full report `QUALITY-CHECK.md`)
  - F1 (must fix): the REQ-179 Notes bullet in `GATE-QUESTIONS.md` says the `abilities-trigger-basics` excerpt is 926 characters; the committed excerpt is 803 characters (819 UTF-8 bytes) and 926 appears in no measurement output — use 803 or drop the number.
  - F2 (must fix): "127 across all 24 topics" (REQ-179 plain-language text and Notes bullet) is a per-topic sum but reads as a count of sub-rules; distinct sub-rules no topic itself lists = 125 (19 of 144 prefix-blocked sub-rules are listed by another topic) — say 125 distinct or "127 counted once per topic", and use the same definition in the brief's build-time condition.
  - F3 (must fix): the closing-case acceptance bullet (`triggers-becomes-tapped-not-entering-tapped`, `triggers-damage-prevented-no-trigger`) does not name the ranking path; only the rules-gate hybrid/frozen-vector path is measured, no lexical rank is recorded, and lexical is the mock/offline default — bind the criterion to the hybrid path and record lexical ranks at build, or measure them now; also name the provider for the `eval:evidence-trace` verification line.
  - M1 (minor): D10 omits that the PRD already records the lexical first-ship before-value as 14/18 (`functional-requirements.md:5801`, `:5817`).
  - M2 (minor): the REQ-181, REQ-182 and REQ-220 plain-language blocks use "System 3" without defining it in-block.
  - M3 (minor): REQ-179's acceptance line at `functional-requirements.md:4228` says goldens change by "removing a junk excerpt", which now reads narrower than the truth.
  - M4 (minor): "400.7a–m" is 12 rules (there is no 400.7l); the total of 41 is right.
