import { describe, expect, it } from "vitest";
import { gameRuleSelectionQuestion, ruleSelectionQuestion } from "./ruleSelectionQuestion.js";

describe("ruleSelectionQuestion (REQ-246)", () => {
  it("is the request's own question when there is no history", () => {
    expect(ruleSelectionQuestion({ question: "How does trample work?" })).toBe("How does trample work?");
    expect(ruleSelectionQuestion({ question: "How does trample work?", conversationHistory: undefined })).toBe("How does trample work?");
  });

  it("is the first history turn, as sent, on a follow-up", () => {
    expect(
      ruleSelectionQuestion({
        question: "I don't think that's right.",
        conversationHistory: [
          { role: "user", content: "How  does trample\nwork?" },
          { role: "assistant", content: "It works like this." }
        ]
      })
    ).toBe("How  does trample\nwork?");
  });

  it("ignores later turns however deep the conversation is", () => {
    expect(
      ruleSelectionQuestion({
        question: "And now?",
        conversationHistory: [
          { role: "user", content: "Opening." },
          { role: "assistant", content: "A1." },
          { role: "user", content: "Second." },
          { role: "assistant", content: "A2." }
        ]
      })
    ).toBe("Opening.");
  });

  it("gives an In-Depth request back its context's own question when there is no history, fallback included", () => {
    expect(gameRuleSelectionQuestion({ question: "  " }, { finalQuestion: "Resolve the stack" })).toBe("Resolve the stack");
    expect(gameRuleSelectionQuestion({ question: "ignored here" }, { finalQuestion: "ignored here" })).toBe("ignored here");
  });

  it("normalises an In-Depth opening question the way a context does, and falls back when it is blank", () => {
    const history = (content: string) => [
      { role: "user" as const, content },
      { role: "assistant" as const, content: "A." }
    ];
    expect(gameRuleSelectionQuestion({ question: "check", conversationHistory: history("How  does\n copying   work?") }, { finalQuestion: "check" })).toBe(
      "How does copying work?"
    );
    expect(gameRuleSelectionQuestion({ question: "check", conversationHistory: history(" \n ") }, { finalQuestion: "check" })).toBe("check");
  });
});
