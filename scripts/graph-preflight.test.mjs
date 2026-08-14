import { test } from "node:test";
import assert from "node:assert/strict";

import {
  classifyWorkingTree,
  DEFAULT_THRESHOLDS,
  SECRET_PATTERNS,
} from "./graph-preflight.mjs";

test("graph-preflight - classifier - clean tree needs no resolution", () => {
  const result = classifyWorkingTree([]);
  assert.equal(result.action, "clean");
  assert.equal(result.fileCount, 0);
  assert.equal(result.changedLines, 0);
});

test("graph-preflight - classifier - small change is committed", () => {
  const result = classifyWorkingTree([
    { path: "PRD/sections/overview.md", changedLines: 12 },
    { path: "PRD/sections/personas.md", changedLines: 3 },
  ]);
  assert.equal(result.action, "commit");
  assert.equal(result.fileCount, 2);
  assert.equal(result.changedLines, 15);
});

test("graph-preflight - classifier - too many files is stashed", () => {
  const entries = Array.from({ length: 11 }, (_, i) => ({
    path: `PRD/sections/file-${i}.md`,
    changedLines: 1,
  }));
  const result = classifyWorkingTree(entries);
  assert.equal(result.action, "stash");
  assert.match(result.reason, /file count/);
});

test("graph-preflight - classifier - too many lines is stashed", () => {
  const result = classifyWorkingTree([
    { path: "PRD/sections/functional-requirements.md", changedLines: 201 },
  ]);
  assert.equal(result.action, "stash");
  assert.match(result.reason, /changed lines/);
});

test("graph-preflight - classifier - secrets are blocked, never auto-committed", () => {
  const result = classifyWorkingTree([
    { path: ".secrets/openai-dev.env", changedLines: 1 },
  ]);
  assert.equal(result.action, "blocked");
  assert.match(result.reason, /secret/i);
});

test("graph-preflight - classifier - secret detection survives a small-change tree", () => {
  const result = classifyWorkingTree([
    { path: "PRD/sections/overview.md", changedLines: 2 },
    { path: "apps/backend/.env", changedLines: 1 },
  ]);
  assert.equal(result.action, "blocked");
});

test("graph-preflight - classifier - live 2026-08-14 checkout state stashes", () => {
  // Measured from the real repo: 13 tracked files, 574 insertions + 183
  // deletions, plus 4 untracked files under PRD/work/.
  const entries = [
    { path: "PRD/sections/decisions/combo-retrieval.md", changedLines: 3 },
    { path: "PRD/sections/functional-requirements.md", changedLines: 29 },
    { path: "PRD/sections/integrations-and-data.md", changedLines: 8 },
    { path: "PRD/sections/user-flows.md", changedLines: 1 },
    { path: "PRD/work/commander-spellbook-combos/DESIGN-BRIEF.md", changedLines: 68 },
    { path: "PRD/work/commander-spellbook-combos/GAMEPLAN.md", changedLines: 189 },
    { path: "PRD/work/commander-spellbook-combos/README.md", changedLines: 86 },
    { path: "PRD/work/commander-spellbook-combos/slice-a-corpus-build-pipeline.md", changedLines: 120 },
    { path: "PRD/work/commander-spellbook-combos/slice-b-catalog-loader-and-config.md", changedLines: 57 },
    { path: "PRD/work/commander-spellbook-combos/slice-c-intent-and-matching.md", changedLines: 30 },
    { path: "PRD/work/commander-spellbook-combos/slice-d-prompt-integration.md", changedLines: 77 },
    { path: "PRD/work/commander-spellbook-combos/slice-e-eval-fixtures-and-goldens.md", changedLines: 28 },
    { path: "PRD/work/commander-spellbook-combos/slice-f-answer-quality-comparison.md", changedLines: 61 },
  ];
  const result = classifyWorkingTree(entries);
  assert.equal(result.action, "stash");
  assert.equal(result.fileCount, 13);
});

test("graph-preflight - classifier - thresholds are overridable", () => {
  const entries = [{ path: "a.md", changedLines: 500 }];
  const result = classifyWorkingTree(entries, { maxFiles: 10, maxLines: 1000 });
  assert.equal(result.action, "commit");
});

test("graph-preflight - defaults - documented thresholds are stable", () => {
  assert.deepEqual(DEFAULT_THRESHOLDS, { maxFiles: 10, maxLines: 200 });
  assert.ok(SECRET_PATTERNS.length > 0);
});
