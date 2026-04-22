import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPromptContext } from "../promptContext.js";
import { buildPromptText } from "../promptNormalization.js";
import type { AskAiRequest } from "../types.js";
import {
  buildChecklistReport,
  evaluateScenario,
  type EvaluationFixture,
  type EvaluationResult
} from "./contextEvaluationHarness.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(currentDir, "fixtures");
const shouldUpdateGoldenFiles = process.env.UPDATE_CONTEXT_EVAL_FIXTURES === "1";

async function readJsonFixture(fileName: string): Promise<EvaluationFixture> {
  const fixturePath = path.join(fixtureDir, fileName);
  const content = await readFile(fixturePath, "utf8");
  return JSON.parse(content) as EvaluationFixture;
}

async function readFixtures(): Promise<EvaluationFixture[]> {
  const fileNames = await readdir(fixtureDir);
  const fixtureFiles = fileNames.filter((fileName) => fileName.endsWith(".fixture.json")).sort();
  const fixtures = await Promise.all(fixtureFiles.map((fileName) => readJsonFixture(fileName)));

  return fixtures;
}

async function assertGoldenFile(fileName: string, actualContent: string): Promise<void> {
  const goldenPath = path.join(fixtureDir, fileName);

  if (shouldUpdateGoldenFiles) {
    await writeFile(goldenPath, actualContent, "utf8");
    return;
  }

  let expectedContent: string;
  try {
    expectedContent = await readFile(goldenPath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `Missing golden file "${fileName}". Run with UPDATE_CONTEXT_EVAL_FIXTURES=1 to generate snapshots.`
      );
    }
    throw error;
  }

  expect(actualContent).toBe(expectedContent);
}

function formatContextSnapshot(request: AskAiRequest): string {
  const context = buildPromptContext(request);
  return `${JSON.stringify(context, null, 2)}\n`;
}

function formatPromptSnapshot(request: AskAiRequest): string {
  const context = buildPromptContext(request);
  const prompt = buildPromptText(context);
  return `${prompt}\n`;
}

describe("context evaluation harness", () => {
  it("validates golden scenarios and checklist report", async () => {
    const fixtures = await readFixtures();
    expect(fixtures.length).toBeGreaterThan(0);

    const results: EvaluationResult[] = [];

    for (const fixture of fixtures) {
      const context = buildPromptContext(fixture.request);
      const promptText = buildPromptText(context);
      const result = evaluateScenario(fixture, context, promptText);

      results.push(result);

      await assertGoldenFile(`${fixture.id}.context.golden.json`, formatContextSnapshot(fixture.request));
      await assertGoldenFile(`${fixture.id}.prompt.golden.txt`, formatPromptSnapshot(fixture.request));
    }

    const checklistReport = `${buildChecklistReport(results)}\n`;
    await assertGoldenFile("checklist-report.golden.txt", checklistReport);
    expect(results.every((result) => result.passed), `Evaluation report:\n${checklistReport}`).toBe(true);
  });

  it("detects ordering and guardrail regressions", () => {
    const fixture: EvaluationFixture = {
      id: "regression-sample",
      description: "Synthetic fixture used to prove regression detection",
      request: {
        question: "How does this resolve?",
        gameContext: {
          playerCount: 2,
          players: [
            { label: "Player 1", lifeTotal: 20 },
            { label: "Player 2", lifeTotal: 20 }
          ]
        },
        battlefieldContext: [],
        stack: [
          {
            cardId: "bottom",
            name: "Bottom Spell",
            oracleText: "Bottom text",
            imageUrl: "",
            manaCost: "{U}",
            manaValue: 1,
            typeLine: "Instant",
            colors: ["U"],
            supertypes: [],
            subtypes: [],
            caster: "Player 1",
            targets: []
          },
          {
            cardId: "top",
            name: "Top Spell",
            oracleText: "Top text",
            imageUrl: "",
            manaCost: "{1}{R}",
            manaValue: 2,
            typeLine: "Instant",
            colors: ["R"],
            supertypes: [],
            subtypes: [],
            caster: "Player 2",
            targets: [{ kind: "stack", targetCardId: "bottom", targetCardName: "Bottom Spell" }]
          }
        ]
      }
    };

    const context = buildPromptContext(fixture.request);
    const brokenContext = {
      ...context,
      orderedStack: [...context.orderedStack].reverse()
    };
    const brokenPrompt = [
      "INSTRUCTIONS",
      "- Explain reasoning clearly and concisely.",
      "",
      "QUESTION",
      context.finalQuestion,
      "",
      "ORDERED STACK (BOTTOM TO TOP)",
      "Card 1 (top)",
      "cardId: top"
    ].join("\n");

    const result = evaluateScenario(fixture, brokenContext, brokenPrompt);
    const failedCheckIds = result.checks.filter((check) => !check.passed).map((check) => check.id);

    expect(result.passed).toBe(false);
    expect(failedCheckIds).toEqual(
      expect.arrayContaining(["stack-order-preserved", "required-guardrails-present"])
    );
  });
});
