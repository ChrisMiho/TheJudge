// REQ-183: the int8 quantisation this script uses to shrink the committed
// rule-embeddings artifact. Tested here as pure functions, offline — no
// model load, no network.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEmbeddingText, computeInt8Scale, hashRuleIndex, quantizeToInt8 } from "./build-rule-embeddings.mjs";

test("buildEmbeddingText joins sectionTitle and text, truncated at 2000 chars", () => {
  const short = buildEmbeddingText({ sectionTitle: "Deathtouch", text: "702.2b Deathtouch damage rule." });
  assert.equal(short, "Deathtouch: 702.2b Deathtouch damage rule.");

  const longText = "x".repeat(3000);
  const truncated = buildEmbeddingText({ sectionTitle: "Long", text: longText });
  assert.equal(truncated.length, 2000);
});

test("hashRuleIndex is deterministic and sensitive to content changes", () => {
  const a = hashRuleIndex('[{"ruleId":"100.1"}]');
  const b = hashRuleIndex('[{"ruleId":"100.1"}]');
  const c = hashRuleIndex('[{"ruleId":"100.2"}]');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("computeInt8Scale scales so the largest |component| maps to 127", () => {
  const scale = computeInt8Scale([0.2719, -0.15, 0.01, -0.2, 0.2584]);
  assert.equal(Math.round(0.2719 * scale), 127);
});

test("computeInt8Scale returns 1 for an all-zero input (never divides by zero)", () => {
  assert.equal(computeInt8Scale([0, 0, 0]), 1);
});

test("quantizeToInt8 round-trips within one quantisation step at the computed scale", () => {
  const values = [0.2719, -0.2719, 0, 0.1, -0.15, 0.2584];
  const scale = computeInt8Scale(values);
  for (const value of values) {
    const q = quantizeToInt8(value, scale);
    const dequantized = q / scale;
    assert.ok(Math.abs(dequantized - value) < 1 / scale, `${value} round-tripped to ${dequantized} (scale ${scale})`);
  }
});

test("quantizeToInt8 clamps to the signed int8 range even if a value exceeds the assumed bound", () => {
  assert.equal(quantizeToInt8(10, 127), 127);
  assert.equal(quantizeToInt8(-10, 127), -128);
});
