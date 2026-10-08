import { describe, expect, it } from "vitest";
import {
  citedRuleIds,
  computeDeterministicAssertions,
  findUnknownRuleIds,
  namesGoldRuleId,
  namesRuleId
} from "./assertions.js";

describe("Backend - Eval - Answer quality - assertions (REQ-186 layer 1)", () => {
  describe("namesRuleId", () => {
    it("detects a rule id mentioned as a bare token", () => {
      expect(namesRuleId("This follows rule 603.7a exactly.", "603.7a")).toBe(true);
    });

    it("detects a rule id surrounded by punctuation", () => {
      expect(namesRuleId("See (603.7a) for the ruling.", "603.7a")).toBe(true);
      expect(namesRuleId("Per rule 603.7a, the trigger never fires.", "603.7a")).toBe(true);
    });

    it("does not false-positive on a prefix of a longer rule id", () => {
      expect(namesRuleId("This is about rule 603.7 broadly.", "603.7a")).toBe(false);
    });

    it("does not false-positive when the id is a substring of a longer token", () => {
      expect(namesRuleId("The number 1603.7a9 appears here.", "603.7a")).toBe(false);
    });

    it("returns false when the answer never mentions the id", () => {
      expect(namesRuleId("The delayed trigger never fires once the creature is gone.", "603.7a")).toBe(false);
    });

    it("returns false for an empty rule id", () => {
      expect(namesRuleId("anything", "")).toBe(false);
    });
  });

  describe("namesGoldRuleId", () => {
    it("is true when the answer names any one of multiple expected rule ids", () => {
      expect(namesGoldRuleId("This cites 704.8 among others.", ["613.9", "704.8"])).toBe(true);
    });

    it("is false when the answer names none of the expected rule ids", () => {
      expect(namesGoldRuleId("No rule numbers here.", ["613.9", "704.8"])).toBe(false);
    });

    it("is false for an empty expected list", () => {
      expect(namesGoldRuleId("Cites 613.9.", [])).toBe(false);
    });
  });

  describe("computeDeterministicAssertions", () => {
    it("computes namesGoldRuleId, nonEmpty, and length together", () => {
      const result = computeDeterministicAssertions("Per rule 603.7a, the delayed trigger never fires.", ["603.7a"]);
      expect(result).toEqual({
        namesGoldRuleId: true,
        nonEmpty: true,
        length: "Per rule 603.7a, the delayed trigger never fires.".length
      });
    });

    it("reports nonEmpty false and namesGoldRuleId false for an empty answer", () => {
      const result = computeDeterministicAssertions("   ", ["603.7a"]);
      expect(result.nonEmpty).toBe(false);
      expect(result.namesGoldRuleId).toBe(false);
      expect(result.length).toBe(3);
    });

    it("reports namesGoldRuleId false when the rule id is missing from an otherwise real answer", () => {
      const result = computeDeterministicAssertions("The delayed ability never triggers.", ["603.7a"]);
      expect(result.namesGoldRuleId).toBe(false);
      expect(result.nonEmpty).toBe(true);
    });
  });

  describe("unknown rule ids (the free made-up-rule-number check)", () => {
    const known = new Set(["603.7a", "613.9", "702.19b", "100.1"]);

    it("lists a cited rule id the committed index lacks, and records an empty list for ids that all exist", () => {
      const withUnknown = computeDeterministicAssertions(
        "Per rule 613.9 and rule 999.9z, the creature is white.",
        ["613.9"],
        known
      );
      expect(withUnknown.unknownRuleIds).toEqual(["999.9z"]);

      const allKnown = computeDeterministicAssertions("Per rule 613.9 (and 702.19b), the creature is white.", ["613.9"], known);
      expect(allKnown.unknownRuleIds).toEqual([]);
    });

    it("leaves the field off when the caller supplies no rule index", () => {
      expect(computeDeterministicAssertions("Cites 999.9z.", ["613.9"])).not.toHaveProperty("unknownRuleIds");
    });

    it("finds each distinct cited id once, in order, including one ending a sentence", () => {
      expect(citedRuleIds("See 603.7a, then 603.7a again, and finally 702.19b.")).toEqual(["603.7a", "702.19b"]);
      expect(findUnknownRuleIds("See 603.7a, 888.1 and 888.1.", known)).toEqual(["888.1"]);
    });

    it("does not read a longer number, a decimal or a further dotted number as a rule id", () => {
      expect(citedRuleIds("It costs 1603.7 and 0.603 and 603.7.1 mana and 603.7a9.")).toEqual([]);
    });
  });
});
