import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { compareRuleIds } from "./gameRulesRetrieval.js";

/**
 * REQ-179 exact-id exclusion drops a candidate rule only when a selected
 * curated topic lists its number. That is lossless only while each topic's
 * excerpt carries exactly the rules it lists: a listed rule missing from the
 * excerpt would vanish from the prompt, and an unlisted rule printed in the
 * excerpt would be shown twice. This test holds that condition over the
 * committed data (plain substring match on the full index text, ignoring
 * trailing spaces at line ends: the rule-index builder appends the next
 * chapter heading to a chapter's last rule, and a refreshed source can carry a
 * stray non-breaking space on the blank line before it, as 616.2 did on
 * 2026-09-25).
 */

type TopicData = { id: string; ruleNumbers: string[]; excerpt: string };
type IndexRule = { ruleId: string; text: string };

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, "../data");
const topics = JSON.parse(readFileSync(path.join(dataDir, "gameRulesByTopic.json"), "utf8")) as TopicData[];
const rules = JSON.parse(readFileSync(path.join(dataDir, "gameRulesRuleIndex.json"), "utf8")) as IndexRule[];

export type TopicExcerptMismatch = {
  /** Listed numbers with no entry in the rule index. */
  unknownListed: string[];
  /** Listed rules whose full index text is not inside the excerpt. */
  missing: string[];
  /** Unlisted rules whose full index text is inside the excerpt. */
  extra: string[];
};

/** Pure check: does this topic's excerpt carry exactly the rules it lists? */
const stripLineEndSpaces = (text: string) => text.replace(/[ \t\u00a0]+$/gm, "");

export function checkTopicExcerpt(topic: TopicData, index: IndexRule[]): TopicExcerptMismatch {
  const byId = new Map(index.map((rule) => [rule.ruleId, rule]));
  const listed = new Set(topic.ruleNumbers);
  const excerpt = stripLineEndSpaces(topic.excerpt);
  const carries = (rule: IndexRule) => excerpt.includes(stripLineEndSpaces(rule.text));
  const unknownListed = topic.ruleNumbers.filter((ruleNumber) => !byId.has(ruleNumber));
  const missing = topic.ruleNumbers.filter((ruleNumber) => {
    const rule = byId.get(ruleNumber);
    return rule !== undefined && !carries(rule);
  });
  const extra = index.filter((rule) => !listed.has(rule.ruleId) && carries(rule)).map((rule) => rule.ruleId);
  return { unknownListed, missing, extra };
}

const EMPTY = { unknownListed: [], missing: [], extra: [] };

describe("curated topic excerpts carry exactly the rules they list (REQ-179 safety)", () => {
  it("covers all 24 committed topics", () => {
    expect(topics).toHaveLength(24);
  });

  it.each(topics.map((topic) => [topic.id, topic] as const))("%s: excerpt has every listed rule and no unlisted rule", (_id, topic) => {
    expect(checkTopicExcerpt(topic, rules)).toEqual(EMPTY);
  });

  describe("the check itself", () => {
    const synthetic: IndexRule[] = [
      { ruleId: "603.1", text: "603.1. Triggered abilities have a trigger condition." },
      { ruleId: "603.1a", text: "603.1a A lettered sub-rule of 603.1 about triggers." },
      { ruleId: "117.1", text: "117.1. Which player receives priority." }
    ];

    it("passes a topic whose excerpt carries exactly its listed rules", () => {
      const topic = { id: "ok", ruleNumbers: ["603.1", "117.1"], excerpt: `${synthetic[0]!.text}\n${synthetic[2]!.text}` };
      expect(checkTopicExcerpt(topic, synthetic)).toEqual(EMPTY);
    });

    it("fails a topic that carries an unlisted rule's text", () => {
      const topic = { id: "extra", ruleNumbers: ["603.1"], excerpt: `${synthetic[0]!.text}\n${synthetic[1]!.text}` };
      expect(checkTopicExcerpt(topic, synthetic).extra).toEqual(["603.1a"]);
    });

    it("fails a topic that omits a listed rule's text", () => {
      const topic = { id: "missing", ruleNumbers: ["603.1", "117.1"], excerpt: synthetic[0]!.text };
      expect(checkTopicExcerpt(topic, synthetic).missing).toEqual(["117.1"]);
    });

    it("fails a topic that lists a number absent from the rule index", () => {
      const topic = { id: "unknown", ruleNumbers: ["999.9"], excerpt: "" };
      expect(checkTopicExcerpt(topic, synthetic).unknownListed).toEqual(["999.9"]);
    });
  });
});

describe("curated topics deliver a lead-in with its list, in rule-book order (REQ-239, REQ-240)", () => {
  const manifest = JSON.parse(readFileSync(path.join(dataDir, "gameRulesTopicManifest.json"), "utf8")) as Array<{
    id: string;
    ruleNumbers: string[];
  }>;
  const byId = new Map(rules.map((rule) => [rule.ruleId, rule]));
  const isLeadIn = (text: string) => {
    const body = text
      .split("\n")
      .filter((line) => !/^\s*Example/.test(line))
      .join(" ")
      .trim();
    return /:$/.test(body) || /following (?:exceptions?|rules)\.$/.test(body);
  };

  it("lists every topic's rule numbers in rule-book order, so the excerpt prints them in that order", () => {
    for (const topic of manifest) {
      expect(topic.ruleNumbers, topic.id).toEqual([...topic.ruleNumbers].sort(compareRuleIds));
      const positions = topic.ruleNumbers.map((ruleNumber) => topics.find((t) => t.id === topic.id)!.excerpt.indexOf(byId.get(ruleNumber)!.text.slice(0, 40)));
      expect(positions, topic.id).toEqual([...positions].sort((a, b) => a - b));
    }
  });

  it("every curated rule that introduces a list lists every item of that list in the same topic", () => {
    for (const topic of manifest) {
      for (const ruleNumber of topic.ruleNumbers) {
        const rule = byId.get(ruleNumber);
        if (!rule || !isLeadIn(rule.text)) continue;
        const items = rules.filter((r) => new RegExp(`^${ruleNumber.replace(/\./g, "\\.")}[a-z]{1,2}$`).test(r.ruleId)).map((r) => r.ruleId);
        expect(topic.ruleNumbers, `${topic.id} ${ruleNumber}`).toEqual(expect.arrayContaining(items));
      }
    }
  });

  it("carries the lists and rules REQ-240 names", () => {
    const listed = (id: string) => manifest.find((topic) => topic.id === id)!.ruleNumbers;
    expect(listed("stack-and-priority")).toEqual(expect.arrayContaining(["117.3a", "117.3b", "117.3c", "117.3d"]));
    expect(listed("zones-basics")).toEqual(
      expect.arrayContaining(["400.7a", "400.7b", "400.7c", "400.7d", "400.7e", "400.7f", "400.7g", "400.7h", "400.7i", "400.7j", "400.7k", "400.7m"])
    );
    expect(listed("layers-power-toughness")).toContain("613.4d");
    expect(listed("layers-timestamps-dependencies")).toContain("613.8b");
    expect(listed("abilities-delayed-triggers")).toEqual(["603.7", "603.7a", "603.7b", "603.7c"]);
  });
});
