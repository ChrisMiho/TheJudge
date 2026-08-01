import { describe, expect, it } from "vitest";
import type { GameRulesTopic } from "../gameRules.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import { buildRelevanceReport, type RelevanceReportInput } from "./contextEvaluationHarness.js";

function topic(id: string): GameRulesTopic {
  return { id, title: id, ruleNumbers: [], excerpt: "" };
}

function rule(ruleId: string, score: number): RetrievedGameRule {
  return { ruleId, sectionTitle: `Section ${ruleId}`, text: `Text ${ruleId}`, score };
}

describe("Backend - Eval", () => {
  describe("buildRelevanceReport", () => {
    it("renders a passing scenario with recall hits and excluded noise", () => {
      const inputs: RelevanceReportInput[] = [
        {
          fixtureId: "stack-scenario",
          selectedTopics: [topic("stack-and-priority"), topic("targets-basics")],
          supplementalRules: [rule("608.2", 12.4), rule("609.3", 10.1)],
          expected: {
            expectedSystem2TopicIds: ["stack-and-priority", "targets-basics"],
            expectedSupplementalRuleIds: ["608.2", "609.3"],
            forbiddenSupplementalRuleIds: ["100.1"]
          }
        }
      ];

      const report = buildRelevanceReport(inputs);

      expect(report.allPassed).toBe(true);
      expect(report.text).toBe(
        [
          "=== stack-scenario ===",
          "System 2 topics (2): stack-and-priority, targets-basics",
          "System 3 top-5:",
          "  608.2  score=12.40  [RECALL HIT]",
          "  609.3  score=10.10  [RECALL HIT]",
          "Expected supplemental: 608.2, 609.3 — all hit",
          "Forbidden supplemental: 100.1 — all excluded",
          "Scenario: PASS",
          "",
          "=== Summary: 1/1 scenarios passed ==="
        ].join("\n")
      );
    });

    it("renders an unlabeled scenario with no expectations as a trivially passing section", () => {
      const inputs: RelevanceReportInput[] = [
        {
          fixtureId: "empty-scenario",
          selectedTopics: [],
          supplementalRules: []
        }
      ];

      const report = buildRelevanceReport(inputs);

      expect(report.allPassed).toBe(true);
      expect(report.text).toBe(
        [
          "=== empty-scenario ===",
          "System 2 topics (0): (none)",
          "System 3 top-5:",
          "  (none)",
          "Scenario: PASS",
          "",
          "=== Summary: 1/1 scenarios passed ==="
        ].join("\n")
      );
    });

    it("flags missing recall, present noise, and System 2 mismatch as a failing scenario", () => {
      const inputs: RelevanceReportInput[] = [
        {
          fixtureId: "broken-scenario",
          selectedTopics: [topic("zones-basics")],
          supplementalRules: [rule("100.1", 5), rule("702.85", 3)],
          expected: {
            expectedSystem2TopicIds: ["stack-and-priority"],
            expectedSupplementalRuleIds: ["608.2"],
            forbiddenSupplementalRuleIds: ["100.1"]
          }
        }
      ];

      const report = buildRelevanceReport(inputs);

      expect(report.allPassed).toBe(false);
      expect(report.text).toBe(
        [
          "=== broken-scenario ===",
          "System 2 topics (1): zones-basics",
          "  System 2 MISMATCH — missing: [stack-and-priority]; unexpected: [zones-basics]",
          "System 3 top-5:",
          "  100.1  score=5.00  [NOISE FAIL]",
          "  702.85  score=3.00",
          "Expected supplemental: 608.2 — MISSING: 608.2",
          "Forbidden supplemental: 100.1 — PRESENT: 100.1",
          "Scenario: FAIL",
          "",
          "=== Summary: 0/1 scenarios passed ==="
        ].join("\n")
      );
    });
  });
});
