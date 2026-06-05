import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractRuleExcerpt,
  normalizeGameRulesManifest,
  transformGameRules
} from "../../../../scripts/build-game-rules.mjs";

const manifestPath = path.resolve("../../apps/backend/data/gameRulesTopicManifest.json");
const artifactPath = path.resolve("../../apps/backend/data/gameRulesByTopic.json");

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
});
