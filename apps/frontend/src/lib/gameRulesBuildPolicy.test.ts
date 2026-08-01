import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { describe, expect, it } from "vitest";
import {
  CORE_TOPIC_IDS,
  buildCoreTopics,
  extractRuleExcerpt,
  normalizeGameRulesManifest,
  parseRuleIndex,
  transformGameRules
} from "../../../../scripts/build-game-rules.mjs";
import { ALWAYS_ON_TOPIC_IDS } from "../../../backend/src/gameRulesTopicSelection.js";

const manifestPath = path.resolve("../../apps/backend/data/gameRulesTopicManifest.json");
const artifactPath = path.resolve("../../apps/backend/data/gameRulesByTopic.json");
const indexPath = path.resolve("../../apps/backend/data/gameRulesRuleIndex.json");

const crIndexFixture = [
  "1. Game Concepts",
  "100. General",
  "100.1. These Magic rules apply to any Magic game with two or more players.",
  "100.1a A two-player game is a game that begins with only two players.",
  "405. Stack",
  "405.1. When a spell is cast, the physical card is put on the stack.",
  "405.2. The stack keeps track of the order.",
  "Glossary",
  "Additional Glossary. This line is after the Glossary and must not appear in the index."
].join("\n");

const crFixture = [
  "100.1. These Magic rules apply to any Magic game with two or more players.",
  "100.2. To play, each player needs their own deck.",
  "405.1. When a spell is cast, the physical card is put on the stack.",
  "405.2. The stack keeps track of the order that spells and abilities were added to it.",
  "613.1a Layer 1: Rules and effects that modify copiable values are applied.",
  "613.1b Layer 2: Control-changing effects are applied.",
  "700.1. Anything that happens in a game is an event."
].join("\n");

describe("game rules build policy", () => {
  it("builds the signed-off core topics in fixed order from the curated source", () => {
    expect(CORE_TOPIC_IDS).toEqual([...ALWAYS_ON_TOPIC_IDS, "combat-phase-structure", "layers-order"]);

    const sourceTopics = [...CORE_TOPIC_IDS]
      .reverse()
      .map((id, index) => ({
        id,
        title: `Topic ${id}`,
        ruleNumbers: [`${index + 100}.1`],
        excerpt: `${index + 100}.1. Source excerpt for ${id}.`,
        ignored: "not part of the frontend artifact"
      }));

    const result = buildCoreTopics(sourceTopics);

    expect(result.warnings).toEqual([]);
    expect(result.topics.map((topic: { id: string }) => topic.id)).toEqual(CORE_TOPIC_IDS);
    expect(result.topics).toEqual(
      CORE_TOPIC_IDS.map((id) => {
        const source = sourceTopics.find((topic) => topic.id === id)!;
        return {
          id: source.id,
          title: source.title,
          ruleNumbers: source.ruleNumbers,
          excerpt: source.excerpt
        };
      })
    );
  });

  it("skips a missing signed-off core topic and reports a build warning", () => {
    const presentTopic = {
      id: CORE_TOPIC_IDS[0],
      title: "Present topic",
      ruleNumbers: ["100.1"],
      excerpt: "100.1. Present source excerpt."
    };

    const result = buildCoreTopics([presentTopic], CORE_TOPIC_IDS.slice(0, 2));

    expect(result.topics).toEqual([presentTopic]);
    expect(result.warnings).toEqual([
      `Core rules topic ${CORE_TOPIC_IDS[1]} not found in generated topic artifact; skipped.`
    ]);
  });

  it("extracts exact Comprehensive Rules excerpts by rule number", () => {
    expect(extractRuleExcerpt(crFixture, "405.1")).toBe(
      "405.1. When a spell is cast, the physical card is put on the stack."
    );
    expect(extractRuleExcerpt(crFixture, "613.1a")).toBe(
      "613.1a Layer 1: Rules and effects that modify copiable values are applied."
    );
    expect(extractRuleExcerpt(crFixture, "999.1")).toBeNull();
  });

  it("normalizes manifest topics into stable id order", () => {
    expect(
      normalizeGameRulesManifest([
        { id: "stack-basics", title: "The Stack", ruleNumbers: ["405.2", "405.1"] },
        { id: "game-start", title: "Starting the Game", ruleNumbers: ["100.1"] }
      ])
    ).toEqual([
      { id: "game-start", title: "Starting the Game", ruleNumbers: ["100.1"] },
      { id: "stack-basics", title: "The Stack", ruleNumbers: ["405.2", "405.1"] }
    ]);
  });

  it("builds topic artifacts and preserves prior excerpts for incomplete topics", () => {
    const result = transformGameRules({
      crText: crFixture,
      manifest: [
        { id: "stack-basics", title: "The Stack", ruleNumbers: ["405.1", "405.2"] },
        { id: "missing-topic", title: "Missing Topic", ruleNumbers: ["999.1"] }
      ],
      previousTopics: [
        {
          id: "missing-topic",
          title: "Missing Topic",
          ruleNumbers: ["999.1"],
          excerpt: "999.1. Prior committed wording."
        }
      ]
    });

    expect(result.topics).toEqual([
      {
        id: "missing-topic",
        title: "Missing Topic",
        ruleNumbers: ["999.1"],
        excerpt: "999.1. Prior committed wording."
      },
      {
        id: "stack-basics",
        title: "The Stack",
        ruleNumbers: ["405.1", "405.2"],
        excerpt: [
          "405.1. When a spell is cast, the physical card is put on the stack.",
          "405.2. The stack keeps track of the order that spells and abilities were added to it."
        ].join("\n")
      }
    ]);
    expect(result.warnings).toContain("Missing CR excerpt for missing-topic rule 999.1; preserved prior topic excerpt.");
  });

  it("parses individual rules into index entries with correct shape", () => {
    const entries = parseRuleIndex(crIndexFixture);
    const ids = entries.map((e: { ruleId: string }) => e.ruleId);

    expect(ids).toContain("100");
    expect(ids).toContain("100.1");
    expect(ids).toContain("100.1a");
    expect(ids).toContain("405.1");

    const entry100_1a = entries.find((e: { ruleId: string }) => e.ruleId === "100.1a");
    assert(entry100_1a !== undefined, "expected 100.1a entry");
    expect(entry100_1a.text).toBe("100.1a A two-player game is a game that begins with only two players.");
    expect(entry100_1a.sectionTitle).toBe("General");
    expect(entry100_1a.parentRuleIds).toEqual(["100.1", "100"]);
    expect(entry100_1a.searchText).toContain("100.1a");
    expect(entry100_1a.searchText).toContain("general");
    expect(entry100_1a.searchText).toContain("two-player");
  });

  it("parseRuleIndex stops at the Glossary section and excludes glossary content", () => {
    const entries = parseRuleIndex(crIndexFixture);
    const texts = entries.map((e: { text: string }) => e.text).join(" ");
    expect(texts).not.toContain("Additional Glossary");
  });

  it("keeps the committed curated topic artifact inside the slice B budget", () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Array<{
      id: string;
      title: string;
      ruleNumbers: string[];
    }>;
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as Array<{
      id: string;
      title: string;
      ruleNumbers: string[];
      excerpt: string;
    }>;

    const artifactIds = artifact.map((topic) => topic.id);
    const sortedArtifactIds = [...artifactIds].sort((a, b) => a.localeCompare(b));
    const excerptChars = artifact.reduce((total, topic) => total + topic.excerpt.length, 0);

    expect(manifest).toHaveLength(23);
    expect(artifact).toHaveLength(manifest.length);
    expect(artifactIds).toEqual(sortedArtifactIds);
    expect(excerptChars).toBeGreaterThanOrEqual(18000);
    expect(excerptChars).toBeLessThanOrEqual(22000);

    for (const topic of artifact) {
      expect(topic.excerpt.trim().length).toBeGreaterThan(0);
      for (const ruleNumber of topic.ruleNumbers) {
        expect(topic.excerpt).toMatch(new RegExp(`^${ruleNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\.|\\s)`, "m"));
      }
    }
  });

  it("keeps the committed rule index artifact within expected bounds", () => {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as Array<{
      ruleId: string;
      sectionTitle: string;
      text: string;
      searchText: string;
      parentRuleIds: string[];
    }>;

    expect(Array.isArray(index)).toBe(true);
    expect(index.length).toBeGreaterThanOrEqual(2000);
    expect(index.length).toBeLessThanOrEqual(5000);

    for (const entry of index.slice(0, 50)) {
      expect(typeof entry.ruleId).toBe("string");
      expect(entry.ruleId.length).toBeGreaterThan(0);
      expect(typeof entry.sectionTitle).toBe("string");
      expect(typeof entry.text).toBe("string");
      expect(entry.text.length).toBeGreaterThan(0);
      expect(typeof entry.searchText).toBe("string");
      expect(entry.searchText).toBe(entry.searchText.toLowerCase());
      expect(Array.isArray(entry.parentRuleIds)).toBe(true);
    }

    const entry704_5 = index.find((e) => e.ruleId === "704.5");
    expect(entry704_5).toBeDefined();
    expect(entry704_5!.sectionTitle).toMatch(/state.based/i);
  });
});
