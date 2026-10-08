import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
