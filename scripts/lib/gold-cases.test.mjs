import assert from "node:assert/strict";
import test from "node:test";

import { CASES_DIR, REQUIRED_SIX_CASE_IDS, loadGoldCases, validateGoldCase } from "./gold-cases.mjs";

function validTier1Case(overrides = {}) {
  return {
    id: "sample-tier-1",
    tier: 1,
    question: "Sample question?",
    workedSolution: "Sample worked solution text.",
    expectedSupplementalRuleIds: ["100.1"],
    whyHard: "Sample reason this is hard.",
    source: {
      publisher: "Wizards of the Coast",
      license: "Reproduced under the Wizards of the Coast Fan Content Policy.",
      ruleId: "100.1"
    },
    ...overrides
  };
}

function validTier2Case(overrides = {}) {
  return {
    id: "sample-tier-2",
    tier: 2,
    question: "Sample question?",
    workedSolution: "Sample worked solution text.",
    expectedSupplementalRuleIds: ["100.1"],
    whyHard: "Sample reason this is hard.",
    source: {
      publisher: "Wizards of the Coast",
      license: "Reproduced from official card-ruling text.",
      cardName: "Sample Card",
      oracleId: "00000000-0000-0000-0000-000000000000",
      rulingDate: "2020-01-01"
    },
    ...overrides
  };
}

test("validateGoldCase accepts a well-formed tier-1 case", () => {
  const result = validateGoldCase(validTier1Case());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateGoldCase accepts a well-formed tier-2 case", () => {
  const result = validateGoldCase(validTier2Case());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateGoldCase rejects a missing non-empty question", () => {
  const result = validateGoldCase(validTier1Case({ question: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"question"')));
});

test("validateGoldCase rejects a missing non-empty workedSolution", () => {
  const result = validateGoldCase(validTier1Case({ workedSolution: undefined }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"workedSolution"')));
});

test("validateGoldCase rejects a tier that is not 1 or 2", () => {
  const result = validateGoldCase(validTier1Case({ tier: 3 }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"tier"')));
});

test("validateGoldCase rejects an empty expectedSupplementalRuleIds", () => {
  const result = validateGoldCase(validTier1Case({ expectedSupplementalRuleIds: [] }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("expectedSupplementalRuleIds")));
});

test("validateGoldCase rejects a missing source block", () => {
  const result = validateGoldCase(validTier1Case({ source: undefined }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"source"')));
});

test("validateGoldCase rejects a tier-1 source with no ruleId citation", () => {
  const result = validateGoldCase(validTier1Case({ source: { publisher: "WotC", license: "x" } }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("ruleId")));
});

test("validateGoldCase rejects a tier-2 source missing card citation fields", () => {
  const result = validateGoldCase(
    validTier2Case({ source: { publisher: "WotC", license: "x" } })
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("cardName")));
  assert.ok(result.errors.some((e) => e.includes("oracleId")));
  assert.ok(result.errors.some((e) => e.includes("rulingDate")));
});

test("validateGoldCase rejects a missing whyHard", () => {
  const result = validateGoldCase(validTier1Case({ whyHard: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("whyHard")));
});

test("loadGoldCases reads and validates every committed *.case.json file", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  assert.ok(cases.length >= 18, `expected at least 18 gold cases, got ${cases.length}`);
  for (const caseEntry of cases) {
    const { valid, errors } = validateGoldCase(caseEntry);
    assert.equal(valid, true, `case ${caseEntry.id} failed validation: ${errors.join("; ")}`);
  }
});

test("the gold set holds at least the six named worked-solution cases, each tier 1", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  const byId = new Map(cases.map((c) => [c.id, c]));
  for (const requiredId of REQUIRED_SIX_CASE_IDS) {
    const found = byId.get(requiredId);
    assert.ok(found, `missing required gold case ${requiredId}`);
    assert.equal(found.tier, 1, `${requiredId} must be tier 1`);
  }
});

test("the gold set holds at least 18 cases total, each with a non-empty whyHard", async () => {
  const cases = await loadGoldCases(CASES_DIR);
  assert.ok(cases.length >= 18, `expected at least 18 cases, got ${cases.length}`);
  for (const caseEntry of cases) {
    assert.ok(
      typeof caseEntry.whyHard === "string" && caseEntry.whyHard.trim().length > 0,
      `${caseEntry.id} needs a non-empty whyHard`
    );
  }
});

test("loadGoldCases throws naming every problem for an invalid case, without silently scoring it as a miss", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gold-cases-"));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(dir, "good.case.json"), JSON.stringify(validTier1Case({ id: "good" })), "utf8");
  fs.writeFileSync(path.join(dir, "bad.case.json"), JSON.stringify({ id: "bad" }), "utf8");

  await assert.rejects(() => loadGoldCases(dir), /Invalid gold case\(s\)[\s\S]*bad\.case\.json/);
});
