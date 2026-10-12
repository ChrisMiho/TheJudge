# Slice C — Trained-model tooling, manifest, fetch, identity

## Status: planned

## Goal

Everything needed to train, package, fetch and verify the private search model exists, is tested offline, and holds no weights in git.

## Requirements

1. Port the probe's tooling into `scripts/` (read from `PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/`): training (`train.py` to `scripts/train-rule-search-model.py`, run through `uv` with Python 3.12, dev-only), `export-training.mjs` (uses the shipped query builder from B and rule text from A, plus the shared stemmer), `leak-check.mjs`, `latency-q8check.mjs`. Recipe and export follow REQ-236: `all-MiniLM-L6-v2` fine-tuned on the committed corpus, the rule book's worked examples and the local practice suite; 5-fold cross-validation; the shipped model trains on 100% of the data.
2. Training pairs, checkpoints, the trained model folder and per-question results live only under git-ignored folders (extend `.gitignore`; test with `git check-ignore`). The public base model is read from `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/probe-pft/output/models-probe/`; nothing is downloaded.
3. Packaging script writes `apps/backend/data/embeddingModel.manifest.json`: model id, file list with SHA-256 hashes and sizes (names may be renamed at map-out; propose in the evidence log if changed). It also prints the exact S3 upload commands for `models/<model-id>/` (profile `thejudge-admin`) for the PR body. It runs nothing against AWS.
4. `scripts/fetch-embedding-model.mjs` fetches the model from a source (S3 URL in production, a local directory in tests), verifies every hash against the manifest, and refuses on any mismatch or missing file (REQ-237, REQ-183, REQ-184). Lambda packaging (`scripts/package-lambda.sh`, `lambda-package-budget.test.mjs`) refuses without the verified model; NFR-017's budget test still passes with the folder at about 23.0 MB.
5. Identity (REQ-181, target 9): every committed vector file records the model id that built it. Tests prove a model-id mismatch between a vector file and the runtime model is refused loudly, and an OpenAI-sized query vector against 384-dimension rule vectors is refused loudly. Runtime: disable the semantic path with one error-level diagnostic naming both sides (lexical fallback, never a silent mixed ranking); packaging, eval harnesses, benchmark and rules gate refuse outright.
6. A committed test asserts `git ls-files` lists no `*.onnx`, `*.safetensors` or checkpoint files and the model folder paths are git-ignored (target 12).
7. Mention CI: the new tests run offline with a tiny fake model directory; CI never needs Python, `uv` or S3.
8. Apply by intent to `PRD/sections/`: REQ-236 (tooling parts), REQ-237, REQ-181 (trained model, loud mismatch), REQ-183, REQ-184, REQ-232 (the suite may train the shipped model; weights shipped from private storage), NFR-017, `integrations-and-data.md`. Slot REQ-236's re-baseline text lands in D.
9. No network writes. Do not upload, bootstrap AWS or deploy.

## Acceptance criteria

- [ ] The ported scripts exist under `scripts/` and none contains practice-suite text; `scripts/privacy-scan.mjs` still reports 0
- [ ] Tooling paths for pairs, checkpoints and model folders are git-ignored (`git check-ignore` passes for each)
- [ ] The manifest writer produces a manifest with model id and per-file SHA-256 from a fake model directory, and prints the upload commands
- [ ] The fetch script passes against a local directory and refuses on a changed byte, a missing file and a wrong manifest
- [ ] Lambda packaging refuses without the verified model and the budget test (NFR-017) passes
- [ ] Identity tests: model-id mismatch refused loudly; OpenAI-sized vector against 384-dimension rule vectors refused loudly; runtime falls back to lexical with one named diagnostic
- [ ] The committed no-weights test passes and `git ls-files` shows no weight files
- [ ] REQ-236 (tooling), 237, 181, 183, 184, 232, NFR-017 and `integrations-and-data.md` are applied by intent
- [ ] `npm run quality:check` passes
- [ ] Nothing in the slice touched the network or AWS (dated evidence-log line)

## Verification

```bash
npm run test:scripts
npm --workspace apps/backend run test
node scripts/privacy-scan.mjs
git ls-files | grep -E '\.(onnx|safetensors)$|checkpoint' || echo none
npm run quality:check
```

## Files touched

- `scripts/train-rule-search-model.py`, `scripts/export-rule-search-training.mjs`, `scripts/leak-check.mjs`, `scripts/latency-q8check.mjs`, `scripts/package-embedding-model.mjs`, `scripts/fetch-embedding-model.mjs` and tests
- `apps/backend/data/embeddingModel.manifest.json` (written in D)
- `apps/backend/src/` embedder loader and identity checks, `scripts/build-rule-embeddings.mjs`, `scripts/package-lambda.sh`
- `.gitignore`
- `PRD/sections/functional-requirements.md`, `non-functional-requirements.md`, `integrations-and-data.md`
