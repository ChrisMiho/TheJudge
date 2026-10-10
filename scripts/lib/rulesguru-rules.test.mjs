import assert from "node:assert/strict";
import test from "node:test";

import { mapCitedRules, ruleIdsOf } from "./rulesguru-rules.mjs";

const ruleIndex = ["100.1", "613.1a", "702.16a", "702.16b", "702.160", "702.17", "702.17a", "704.5g"].map((ruleId) => ({ ruleId, text: "x" }));
const ids = ruleIdsOf(ruleIndex);

test("a cited id present in the index maps to itself, even when it is a bare header with subrules", () => {
  assert.deepEqual(mapCitedRules(["100.1", "702.17"], ids), { groups: [["100.1"], ["702.17"]], unknown: [] });
});

test("a bare header absent from the index maps to its lettered subrules only, never to 702.160", () => {
  const { groups, unknown } = mapCitedRules(["702.16"], ids);
  assert.deepEqual(groups, [["702.16a", "702.16b"]]);
  assert.deepEqual(unknown, []);
});

test("an id with no index entry and no subrules is unknown and leaves an empty group", () => {
  const { groups, unknown } = mapCitedRules(["999.9", "613.1a"], ids);
  assert.deepEqual(groups, [[], ["613.1a"]]);
  assert.deepEqual(unknown, ["999.9"]);
});

test("each cited id is its own rule group, in the order cited", () => {
  const { groups } = mapCitedRules(["704.5g", "702.16", "100.1"], ids);
  assert.deepEqual(groups, [["704.5g"], ["702.16a", "702.16b"], ["100.1"]]);
});
