// REQ-239 / REQ-240 / REQ-244: the rules sections of a prompt in rule-book order, grouped and labelled,
// with lead-ins carried with their lists and "see rule X" pointers carrying what they point at.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { GameRulesRuleIndexEntry, RetrievedGameRule } from "../gameRulesRetrieval.js";
import {
  firstSentence,
  isLeadIn,
  LIST_ITEM_CHAR_BUDGET,
  MAX_RESOLVED_POINTERS,
  layoutPromptRuleSections,
  POINTER_SENTENCE_MAX_CHARS
} from "./ruleLayout.js";

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data");
const ruleIndex = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleIndex.json"), "utf8")) as GameRulesRuleIndexEntry[];
const byId = new Map(ruleIndex.map((entry) => [entry.ruleId, entry]));

const picked = (...ids: string[]): RetrievedGameRule[] =>
  ids.map((ruleId) => ({ ruleId, sectionTitle: byId.get(ruleId)!.sectionTitle, text: byId.get(ruleId)!.text, score: 1 }));

const layout = (supplemental: RetrievedGameRule[], extra: Partial<Parameters<typeof layoutPromptRuleSections>[0]> = {}) =>
  layoutPromptRuleSections({ topics: [], supplementalRules: supplemental, ruleIndex, ...extra });

describe("REQ-239 excerpt order, groups and labels", () => {
  it("prints the excerpts in rule-book order, not score order", () => {
    const text = layout(picked("703.4p", "514.3", "514.1", "724.1f")).supplementalRulesSection;
    const at = (id: string) => text.indexOf(`\n${id}`);
    expect(at("514.1")).toBeGreaterThan(0);
    expect(at("514.1")).toBeLessThan(at("514.3"));
    expect(at("514.3")).toBeLessThan(at("703.4p"));
    expect(at("703.4p")).toBeLessThan(at("724.1f"));
  });

  it("groups rules sharing a three-digit section under '<part title> › <section title>'", () => {
    const text = layout(picked("514.1", "514.2")).supplementalRulesSection;
    expect(text).toContain("Turn Structure › Cleanup Step\n514.1.");
    expect(text.match(/Turn Structure › Cleanup Step/g)).toHaveLength(1);
  });

  it("labels a section titled General with its part, never 'General' alone", () => {
    const general = ruleIndex.find((entry) => entry.sectionTitle === "General" && entry.ruleId.startsWith("5"))!;
    const text = layout([{ ruleId: general.ruleId, sectionTitle: "General", text: general.text, score: 1 }]).supplementalRulesSection;
    expect(text).toContain("Turn Structure › General");
    expect(text).not.toMatch(/^General$/m);
  });

  it("prints each rule id once: never '514.3a. 514.3a'", () => {
    const text = layout(picked("514.3a")).supplementalRulesSection;
    expect(text).not.toContain("514.3a. 514.3a");
    expect(text.match(/514\.3a/g)?.length).toBe(1);
  });

  it("treats keyword-set pieces (score 0) like any excerpt for grouping and order", () => {
    const pieces: RetrievedGameRule[] = ["702.2b", "702.2a"].map((ruleId) => ({
      ruleId,
      sectionTitle: byId.get(ruleId)!.sectionTitle,
      text: byId.get(ruleId)!.text,
      score: 0
    }));
    const text = layout([...picked("514.1"), ...pieces]).supplementalRulesSection;
    expect(text.indexOf("\n702.2a")).toBeLessThan(text.indexOf("\n702.2b"));
    expect(text.indexOf("\n514.1")).toBeLessThan(text.indexOf("\n702.2a"));
  });

  it("returns no section for no excerpts", () => {
    expect(layout([]).supplementalRulesSection).toBe("");
  });
});

describe("REQ-239 a sub-rule that cannot stand alone gets its parent's lead-in sentence", () => {
  it("514.3a alone is preceded by 514.3's lead-in sentence; with 514.3 delivered it is not", () => {
    const alone = layout(picked("514.3a")).supplementalRulesSection;
    expect(alone).toContain("514.3 … However, this rule is subject to the following exception:\n514.3a At this point");
    const together = layout(picked("514.3")).supplementalRulesSection;
    expect(together).not.toContain("514.3 …");
  });

  it("a piece that opens with 'First' or says 'this rule' gets it too, once per parent", () => {
    const first = ruleIndex.find((entry) => /^\d{3}\.\d+[a-z]\s+First,/.test(entry.text) && byId.has(entry.parentRuleIds[0]!))!;
    const text = layout(picked(first.ruleId)).supplementalRulesSection;
    expect(text).toContain(`${first.parentRuleIds[0]} …`);
    expect(text.match(new RegExp(`${first.parentRuleIds[0]!.replace(".", "\\.")} \\u2026`, "g"))).toHaveLength(1);
  });
});

describe("REQ-240 a rule that introduces a list arrives with its list", () => {
  it("recognises a lead-in by its ending", () => {
    expect(isLeadIn("514.3. Normally, no priority. However, this rule is subject to the following exception:")).toBe(true);
    expect(isLeadIn("x subject to the following exceptions.")).toBe(true);
    expect(isLeadIn("x determined by the following rules.")).toBe(true);
    expect(isLeadIn("A plain rule.")).toBe(false);
    expect(isLeadIn("A lead-in:\nExample: something.")).toBe(true);
  });

  it("a delivered lead-in brings every item, using no search slot", () => {
    const result = layout(picked("514.3"));
    expect(result.supplementalRulesSection).toContain("514.3a At this point");
    expect(result.stats.listItemsAdded).toBe(1);
    expect(result.stats.listOverflows).toBe(0);
  });

  it("does not repeat an item already delivered by the search or by a curated topic", () => {
    const both = layout(picked("514.3", "514.3a"));
    expect(both.stats.listItemsAdded).toBe(0);
    expect(both.supplementalRulesSection.match(/514\.3a At this point/g)).toHaveLength(1);
    const curated = layout(picked("514.3"), {
      topics: [{ id: "t", title: "T", ruleNumbers: ["514.3a"], excerpt: byId.get("514.3a")!.text }]
    });
    expect(curated.stats.listItemsAdded).toBe(0);
    expect(curated.supplementalRulesSection).not.toContain("514.3a At this point");
  });

  it("adds the missing items of a curated topic's lead-in, as a safety net", () => {
    const result = layout([], { topics: [{ id: "t", title: "T", ruleNumbers: ["117.3"], excerpt: byId.get("117.3")!.text }] });
    expect(result.stats.listItemsAdded).toBe(4);
    expect(result.supplementalRulesSection).toContain("117.3a");
  });

  it("never cuts a list that does not fit the budget: it names the omitted range", () => {
    const longItem = "x".repeat(LIST_ITEM_CHAR_BUDGET / 2 + 100);
    const index: GameRulesRuleIndexEntry[] = [
      { ruleId: "900.1", sectionTitle: "Big", text: "900.1. A rule determined by the following rules:", searchText: "", parentRuleIds: ["900"] },
      { ruleId: "900.1a", sectionTitle: "Big", text: `900.1a ${longItem}`, searchText: "", parentRuleIds: ["900.1", "900"] },
      { ruleId: "900.1b", sectionTitle: "Big", text: `900.1b ${longItem}`, searchText: "", parentRuleIds: ["900.1", "900"] }
    ];
    const result = layoutPromptRuleSections({
      topics: [],
      supplementalRules: [{ ruleId: "900.1", sectionTitle: "Big", text: index[0]!.text, score: 1 }],
      ruleIndex: index,
      partTitles: { "9": "Casual Variants" }
    });
    expect(result.stats.listOverflows).toBe(1);
    expect(result.stats.listItemsAdded).toBe(0);
    expect(result.supplementalRulesSection).toContain("[List items 900.1a to 900.1b are not shown here: the list is too long for this prompt.]");
    expect(result.supplementalRulesSection).not.toContain("xxxx");
  });

  it("a list shorter than the budget fits: 704.5's 24 items are the largest list in the rule book", () => {
    const result = layout(picked("704.5"));
    expect(result.stats.listOverflows).toBe(0);
    expect(result.stats.listItemChars).toBeLessThanOrEqual(LIST_ITEM_CHAR_BUDGET);
    expect(result.stats.listItemsAdded).toBeGreaterThanOrEqual(24);
  });
});

describe("REQ-244 pointers carry what they point at", () => {
  const index: GameRulesRuleIndexEntry[] = [
    { ruleId: "500.1", sectionTitle: "Sec", text: "500.1. See rule 501.1 and rule 502.1. Also see rule 503.1.", searchText: "", parentRuleIds: ["500"] },
    { ruleId: "501.1", sectionTitle: "Sec", text: "501.1. The target's first sentence. A second sentence.", searchText: "", parentRuleIds: ["501"] },
    { ruleId: "502.1", sectionTitle: "Sec", text: `502.1. ${"Long ".repeat(80)}ends here. Another.`, searchText: "", parentRuleIds: ["502"] },
    { ruleId: "503.1", sectionTitle: "Sec", text: "503.1. Third.", searchText: "", parentRuleIds: ["503"] }
  ];
  const run = (text: string, extraDelivered: string[] = []) =>
    layoutPromptRuleSections({
      topics: [],
      supplementalRules: [{ ruleId: "500.1", sectionTitle: "Sec", text, score: 1 }, ...extraDelivered.map((ruleId) => ({ ruleId, sectionTitle: "Sec", text: index.find((e) => e.ruleId === ruleId)!.text, score: 1 }))],
      ruleIndex: index,
      partTitles: { "5": "Part" }
    });

  it("follows a pointer to a rule absent from the prompt with its first sentence, in brackets", () => {
    const result = run("500.1. See rule 501.1.");
    expect(result.supplementalRulesSection).toContain("See rule 501.1 [The target's first sentence.].");
    expect(result.stats.pointersResolved).toBe(1);
  });

  it("leaves a pointer whose target is already in the prompt as written", () => {
    const result = run("500.1. See rule 501.1.", ["501.1"]);
    expect(result.supplementalRulesSection).toContain("500.1. See rule 501.1.");
    expect(result.stats.pointersFound).toBe(0);
  });

  it("resolves each rule in 'see rules X and Y'", () => {
    const result = run("500.1. See rules 501.1 and 503.1.");
    expect(result.supplementalRulesSection).toContain("See rules 501.1 [The target's first sentence.] and 503.1 [Third.].");
  });

  it("caps an attached first sentence at 250 characters", () => {
    const sentence = firstSentence(index[2]!.text);
    expect(sentence.length).toBeLessThanOrEqual(POINTER_SENTENCE_MAX_CHARS);
    expect(sentence.endsWith("…")).toBe(true);
  });

  it("resolves at most ten pointers per prompt, in order; the rest stay as written", () => {
    const many = Array.from({ length: 14 }, () => "See rule 501.1.").join(" ");
    const result = run(`500.1. ${many}`);
    expect(result.stats.pointersResolved).toBe(MAX_RESOLVED_POINTERS);
    expect(result.stats.pointersFound).toBe(14);
    expect(result.supplementalRulesSection.match(/\[The target's first sentence\.\]/g)).toHaveLength(MAX_RESOLVED_POINTERS);
    expect(result.supplementalRulesSection.match(/See rule 501\.1\./g)).toHaveLength(4);
  });

  it("leaves a pointer alone when the text already gives the title", () => {
    const result = run("500.1. See rule 501.1, “Title.”");
    expect(result.stats.pointersFound).toBe(0);
  });

  it("works over the committed index: 120.4a's pointer to 120.6 gains 120.6's first sentence", () => {
    const result = layout(picked("120.4a"));
    expect(result.stats.pointersResolved).toBeGreaterThan(0);
    expect(result.supplementalRulesSection).toMatch(/See rule 120\.6 \[/);
  });
});
