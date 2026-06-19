import { describe, expect, it } from "vitest";
import { getPromptDiagnostics } from "./promptDiagnostics.js";
import { MAX_PROMPT_CHAR_BUDGET } from "./normalization.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { GameRulesTopic } from "../gameRules.js";

const sampleGameRulesTopics: GameRulesTopic[] = [
  {
    id: "stack-basics",
    title: "The Stack",
    ruleNumbers: ["405.1"],
    excerpt: "405.1. When a spell is cast, the physical card is put on the stack."
  },
  {
    id: "zone-change",
    title: "Zone Changes",
    ruleNumbers: ["400.1"],
    excerpt: "400.1. A zone is a place where objects can be during a game."
  }
];

describe("getPromptDiagnostics supplemental rules", () => {
  it("includes supplemental diagnostic fields when rules present", () => {
    const rules: RetrievedGameRule[] = [
      { ruleId: "116.1", sectionTitle: "Timing", text: "Some text.", score: 10 },
      { ruleId: "116.2", sectionTitle: "Timing", text: "More text.", score: 5 }
    ];
    const diagnostics = getPromptDiagnostics("test prompt", {
      supplementalRules: rules,
      supplementalRulesSectionChars: 200
    });
    expect(diagnostics.supplementalRuleCount).toBe(2);
    expect(diagnostics.supplementalRulesSectionChars).toBe(200);
    expect(diagnostics.supplementalRuleIds).toEqual(["116.1", "116.2"]);
  });

  it("omits supplemental diagnostic fields when no supplemental rules", () => {
    const diagnostics = getPromptDiagnostics("test prompt");
    expect(diagnostics.supplementalRuleCount).toBeUndefined();
    expect(diagnostics.supplementalRulesSectionChars).toBeUndefined();
    expect(diagnostics.supplementalRuleIds).toBeUndefined();
  });

  it("omits supplemental diagnostic fields when supplemental rules array is empty", () => {
    const diagnostics = getPromptDiagnostics("test prompt", { supplementalRules: [] });
    expect(diagnostics.supplementalRuleCount).toBeUndefined();
    expect(diagnostics.supplementalRuleIds).toBeUndefined();
  });
});

describe("getPromptDiagnostics conversation history", () => {
  it("includes conversationHistoryChars as 0 when no history provided", () => {
    const diagnostics = getPromptDiagnostics("test prompt");
    expect(diagnostics.conversationHistoryChars).toBe(0);
  });

  it("includes conversationHistoryChars as 0 when empty options passed", () => {
    const diagnostics = getPromptDiagnostics("test prompt", {});
    expect(diagnostics.conversationHistoryChars).toBe(0);
  });

  it("includes positive conversationHistoryChars when history chars provided", () => {
    const diagnostics = getPromptDiagnostics("test prompt", { conversationHistoryChars: 350 });
    expect(diagnostics.conversationHistoryChars).toBe(350);
  });
});

describe("getPromptDiagnostics", () => {
  it("reports budget diagnostics and near-limit status", () => {
    const shortDiagnostics = getPromptDiagnostics("hello");
    expect(shortDiagnostics.promptChars).toBe(5);
    expect(shortDiagnostics.exceedsBudget).toBe(false);
    expect(shortDiagnostics.nearLimit).toBe(false);

    const nearLimitPrompt = "x".repeat(MAX_PROMPT_CHAR_BUDGET - 400);
    const nearLimitDiagnostics = getPromptDiagnostics(nearLimitPrompt);
    expect(nearLimitDiagnostics.nearLimit).toBe(true);
    expect(nearLimitDiagnostics.exceedsBudget).toBe(false);

    const exceededPrompt = "y".repeat(MAX_PROMPT_CHAR_BUDGET + 5);
    const exceededDiagnostics = getPromptDiagnostics(exceededPrompt);
    expect(exceededDiagnostics.exceedsBudget).toBe(true);
    expect(exceededDiagnostics.remainingChars).toBe(-5);
  });

  it("includes gameRulesSectionChars and gameRulesTopicCount when game rules topics present", () => {
    const diagnostics = getPromptDiagnostics("test prompt", {
      gameRulesTopics: sampleGameRulesTopics,
      gameRulesSectionChars: 500
    });
    expect(diagnostics.gameRulesTopicCount).toBe(2);
    expect(diagnostics.gameRulesSectionChars).toBe(500);
  });

  it("omits game rules diagnostics fields when no topics provided", () => {
    const diagnostics = getPromptDiagnostics("test prompt");
    expect(diagnostics.gameRulesTopicCount).toBeUndefined();
    expect(diagnostics.gameRulesSectionChars).toBeUndefined();
  });
});
