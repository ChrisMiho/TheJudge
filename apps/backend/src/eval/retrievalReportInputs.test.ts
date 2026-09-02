import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadGameRulesTopics, type GameRulesTopic } from "../gameRules.js";
import { loadGameRulesRuleIndex, type GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import { buildRetrievalReportInputs, type LabeledFixture } from "./retrievalReportInputs.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(currentDir, "fixtures");
const gameRulesTopics: GameRulesTopic[] = loadGameRulesTopics(
  path.resolve(currentDir, "../../data/gameRulesByTopic.json")
);
const gameRulesRuleIndex: GameRulesRuleIndexEntry[] = loadGameRulesRuleIndex(
  path.resolve(currentDir, "../../data/gameRulesRuleIndex.json")
);

async function loadLabeledFixtures(): Promise<LabeledFixture[]> {
  const fileNames = await readdir(fixtureDir);
  const fixtureFiles = fileNames.filter((name) => name.endsWith(".fixture.json")).sort();
  const fixtures = await Promise.all(
    fixtureFiles.map(async (name) => JSON.parse(await readFile(path.join(fixtureDir, name), "utf8")) as LabeledFixture)
  );
  return fixtures.filter((fixture) => fixture.expected);
}

describe("Backend - Eval - retrieval report inputs", () => {
  it("builds inputs for every labeled fixture without throwing, across both request modes", async () => {
    const fixtures = await loadLabeledFixtures();
    expect(fixtures.length).toBeGreaterThan(0);

    // The report regressed precisely because lookup-mode fixtures with an
    // `expected` block were routed through the game-mode context builder, which
    // reads `gameContext.playerCount` off a request that has no gameContext.
    // Guard that a lookup-mode labeled fixture actually exists, so this test is
    // exercising the fixed path rather than passing vacuously.
    const lookupFixtures = fixtures.filter((fixture) => fixture.request.mode === "lookup");
    expect(lookupFixtures.length).toBeGreaterThan(0);

    const inputs = buildRetrievalReportInputs(fixtures, { gameRulesTopics, gameRulesRuleIndex });

    expect(inputs).toHaveLength(fixtures.length);
    for (const input of inputs) {
      expect(typeof input.fixtureId).toBe("string");
      expect(Array.isArray(input.selectedTopics)).toBe(true);
      expect(Array.isArray(input.supplementalRules)).toBe(true);
    }
  });

  it("routes a lookup-mode fixture through the preparation pipeline instead of crashing", async () => {
    const fixtures = await loadLabeledFixtures();
    const lookup = fixtures.find((fixture) => fixture.request.mode === "lookup");
    expect(lookup, "expected at least one lookup-mode labeled fixture").toBeDefined();

    // Isolating a single lookup fixture reproduces the original crash input; it
    // must now build cleanly and carry the fixture id through.
    const [input] = buildRetrievalReportInputs([lookup as LabeledFixture], { gameRulesTopics, gameRulesRuleIndex });
    expect(input.fixtureId).toBe((lookup as LabeledFixture).id);
    expect(Array.isArray(input.supplementalRules)).toBe(true);
  });
});
