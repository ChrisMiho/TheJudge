// The built-prompt checks (right-rules-in-order target 4), over the committed corpus and free to run: every
// case built as a Quick Lookup prompt (and as an In-Depth prompt when it has a game state) prints its
// excerpts in rule-book order with no rule id twice (REQ-239), delivers every lead-in with its list and never
// fires the omitted-range line (REQ-240), resolves its pointers (REQ-244), names no section absent from its
// mode (REQ-243), carries the step summary whenever the question names a step (REQ-238), and still carries
// every 613.x / 510.x deciding rule it carried before the change (REQ-242). It reads no practice-suite data.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadGoldCases, type GoldCase } from "../../../../scripts/lib/gold-cases.mjs";
import { buildCaseRequest, loadPromptResources, type PromptResources } from "../../../../scripts/lib/prompt-fidelity.mjs";
import { checkReFreeze, loadFrozenVectors, type FrozenVectorFile } from "../eval/rules-gate/frozenVectors.js";
import { compareRuleIds, type GameRulesRuleIndexEntry } from "../gameRulesRetrieval.js";
import { askAiRequestSchema } from "../validation/askAiRequest.js";
import { preparePromptInput } from "./preparation.js";
import { describeTurnSteps, namedTurnSteps } from "./phaseGuidance.js";
import { isLeadIn } from "./ruleLayout.js";

vi.mock("../providers/localEmbeddingProvider.js", () => ({
  localEmbeddingProvider: { embed: async () => { throw new Error("offline"); } },
  LOCAL_MODEL_ID: "mock",
  LOCAL_MODEL_CACHE_DIR: "mock"
}));

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../data");
const ruleIndex = JSON.parse(readFileSync(resolve(dataDir, "gameRulesRuleIndex.json"), "utf8")) as GameRulesRuleIndexEntry[];

type Built = {
  id: string;
  kind: "lookup" | "game";
  /** True for the request the rules gate builds for the case (a game-state case as In-Depth, any other as Quick Lookup). */
  natural: boolean;
  question: string;
  promptText: string;
  ruleChars: { curated: number; excerpts: number };
  stats: NonNullable<ReturnType<typeof preparePromptInput>["enrichmentDebug"]>["ruleLayout"];
};

const built: Built[] = [];

beforeAll(async () => {
  const resources: PromptResources = await loadPromptResources();
  const cases: GoldCase[] = (await loadGoldCases()).filter((c) => c.review.status !== "rejected");
  const vectors: FrozenVectorFile = loadFrozenVectors();
  for (const caseEntry of cases) {
    const variants: Array<["lookup" | "game", GoldCase]> = [["lookup", { ...caseEntry, gameState: null }]];
    if (caseEntry.gameState) variants.push(["game", caseEntry]);
    for (const [kind, variant] of variants) {
      const request = askAiRequestSchema.parse(buildCaseRequest(variant));
      // The frozen vectors were made for the request the rules gate builds: the case as it is. The other
      // variant (a game-state case asked as a Quick Lookup) ranks by words alone.
      const natural = (caseEntry.gameState === null) === (kind === "lookup");
      const freeze = natural ? checkReFreeze(caseEntry.id, request, resources.cardDetailIndex, vectors) : null;
      const fresh = freeze?.state === "fresh";
      const prepared = preparePromptInput(request, {
        ...resources,
        queryEmbedding: fresh && freeze ? freeze.vector : null,
        cardEmbeddings: fresh && freeze ? freeze.cardEmbeddings : undefined,
        collectEnrichmentDebug: true
      });
      built.push({
        id: caseEntry.id,
        kind,
        natural,
        question: caseEntry.question,
        promptText: prepared.promptText,
        ruleChars: {
          curated: prepared.diagnostics.gameRulesSectionChars ?? 0,
          excerpts: prepared.diagnostics.supplementalRulesSectionChars ?? 0
        },
        stats: prepared.enrichmentDebug?.ruleLayout
      });
    }
  }
}, 120_000);

/** A rule is in the prompt when a line opens with its number. */
function printed(promptText: string, ruleId: string): boolean {
  return new RegExp(`^${ruleId.replace(/\./g, "\\.")}(?:\\.|\\s(?!\u2026))`, "m").test(promptText);
}

function excerptSection(promptText: string): string {
  const start = promptText.indexOf("ADDITIONAL RELEVANT RULE EXCERPTS\n");
  if (start < 0) return "";
  const rest = promptText.slice(start);
  const end = rest.search(/\n\n(?:CARD \(looked up\)|OFFICIAL RULINGS|QUESTION|SCOPE|CONVERSATION|COMMANDER SPELLBOOK)/);
  return end < 0 ? rest : rest.slice(0, end);
}

describe("rules layout over the committed corpus", () => {
  it("builds a Quick Lookup prompt for every case, and an In-Depth prompt for every case with a game state", () => {
    expect(built.filter((b) => b.kind === "lookup").length).toBeGreaterThan(400);
    expect(built.filter((b) => b.kind === "game").length).toBeGreaterThan(0);
  });

  it("REQ-239: every excerpt is in rule-book order and no rule id is printed twice", () => {
    const failures: string[] = [];
    for (const { id, kind, promptText } of built) {
      const ids = [...excerptSection(promptText).matchAll(/^(\d{3}(?:\.\d+)*[a-z]{0,2})(?:\.| )/gm)].map((m) => m[1]!);
      const sorted = [...ids].sort(compareRuleIds);
      if (ids.join(" ") !== sorted.join(" ")) failures.push(`${id} (${kind}): out of order ${ids.join(" ")}`);
      if (new Set(ids).size !== ids.length) failures.push(`${id} (${kind}): an id printed twice`);
    }
    expect(failures).toEqual([]);
  });

  it("REQ-240: a delivered lead-in always arrives with its whole list, and the omitted-range line never fires", () => {
    const leadIns = ruleIndex
      .filter((entry) => isLeadIn(entry.text))
      .map((entry) => ({
        entry,
        items: ruleIndex.filter((item) => new RegExp(`^${entry.ruleId.replace(/\./g, "\\.")}[a-z]{1,2}$`).test(item.ruleId))
      }))
      .filter(({ items }) => items.length > 0);
    expect(leadIns.length).toBeGreaterThanOrEqual(17);
    const failures: string[] = [];
    for (const { id, kind, promptText } of built) {
      for (const { entry, items } of leadIns) {
        if (!printed(promptText, entry.ruleId)) continue;
        for (const item of items) {
          if (!printed(promptText, item.ruleId)) failures.push(`${id} (${kind}): ${entry.ruleId} without ${item.ruleId}`);
        }
      }
      if (promptText.includes("are not shown here: the list is too long")) failures.push(`${id} (${kind}): omitted-range line fired`);
    }
    expect(failures).toEqual([]);
  });

  it("REQ-244: reports the share of pointers resolved, never more than ten per prompt", () => {
    let found = 0;
    let resolved = 0;
    for (const { stats } of built) {
      if (!stats) continue;
      expect(stats.pointersResolved).toBeLessThanOrEqual(10);
      found += stats.pointersFound;
      resolved += stats.pointersResolved;
    }
    expect(found).toBeGreaterThan(0);
    console.info(`pointers resolved over the corpus prompts: ${resolved} of ${found} (${((100 * resolved) / found).toFixed(1)}%)`);
  });
});

describe("REQ-243 over the committed corpus", () => {
  const HEADINGS = ["GENERAL GAME CONTEXT", "PHASE GUIDANCE", "GAME RULES (reference)", "ADDITIONAL RELEVANT RULE EXCERPTS", "CARD (looked up)", "OFFICIAL RULINGS", "SCOPE", "CONVERSATION HISTORY"];

  it("no preamble, instruction or reference line refers to a section absent from the prompt's mode", () => {
    const failures: string[] = [];
    for (const { id, kind, promptText } of built) {
      const firstSection = ["\nGENERAL GAME CONTEXT\n", "\nPHASE GUIDANCE\n", "\nGAME RULES (reference)\n", "\nZONE:", "\nCARD (looked up)\n", "\nQUESTION\n"]
        .map((heading) => promptText.indexOf(heading))
        .filter((at) => at >= 0)
        .reduce((min, at) => Math.min(min, at), Number.MAX_SAFE_INTEGER);
      const head = promptText.slice(0, firstSection);
      for (const heading of HEADINGS) {
        if (head.includes(heading) && !promptText.includes(`\n${heading}\n`)) failures.push(`${id} (${kind}): the framing names ${heading}`);
      }
      if (kind === "lookup") {
        for (const absent of ["turnPhase", "scope note", "Zones (app model)", "Stack item", "stack[0]", "phrasing glossary"]) {
          if (head.includes(absent)) failures.push(`${id} (${kind}): the framing mentions "${absent}"`);
        }
      }
      if (promptText.includes("stack[0]")) failures.push(`${id} (${kind}): stack[0] wording`);
      if (promptText.includes("OFFICIAL RULINGS")) failures.push(`${id} (${kind}): a standalone rulings section`);
    }
    expect(failures).toEqual([]);
  });

  it("rulings print once per card and only under a card", () => {
    const failures: string[] = [];
    for (const { id, kind, promptText } of built) {
      const frames = [...promptText.matchAll(/^Rulings for (.+) \(published by Wizards of the Coast;/gm)].map((m) => m[1]!);
      if (new Set(frames).size !== frames.length) failures.push(`${id} (${kind}): rulings printed twice for one card`);
    }
    expect(failures).toEqual([]);
  });
});

describe("REQ-238 the step summary over the committed corpus", () => {
  it("a Quick Lookup prompt carries the summary of every step its question names", () => {
    const failures: string[] = [];
    let named = 0;
    for (const { id, kind, question, promptText } of built) {
      if (kind !== "lookup") continue;
      const steps = namedTurnSteps([question]);
      if (steps.length === 0) continue;
      named += 1;
      if (!promptText.includes("\nPHASE GUIDANCE\n")) failures.push(`${id}: the question names a step but there is no PHASE GUIDANCE`);
      for (const line of describeTurnSteps(steps)) if (!promptText.includes(line)) failures.push(`${id}: missing ${line.slice(0, 30)}`);
    }
    expect(named).toBeGreaterThan(5);
    expect(failures).toEqual([]);
  });

  it("the Necropotence case's Quick Lookup prompt carries the cleanup summary", () => {
    const necro = built.find((b) => b.id === "necropotence-silence-borne-upon-a-wind-cleanup" && b.kind === "lookup");
    expect(necro, "the Necropotence case is in the corpus").toBeDefined();
    expect(necro!.promptText).toContain("\nCleanup step: ");
  });
});

describe("REQ-242 the layer and combat-damage rules that reached the prompt before the change", () => {
  // The cases whose deciding 613.x / 510.x rule reached the prompt under origin/main's code, recorded from main's
  // committed rules-gate baseline (search excerpts or a curated topic) as reach-613-510-before.json.
  const before = JSON.parse(readFileSync(resolve(dataDir, "../src/eval/rules-gate/reach-613-510-before.json"), "utf8")) as Record<string, string[]>;
  it("still reaches the prompt, with no exceptions", () => {
    const failures: string[] = [];
    for (const [id, ruleIds] of Object.entries(before)) {
      const prompt = built.find((candidate) => candidate.id === id && candidate.natural);
      expect(prompt, `${id} is a corpus case`).toBeDefined();
      for (const ruleId of ruleIds) {
        const present = printed(prompt!.promptText, ruleId);
        if (!present) failures.push(`${id}: ${ruleId} reached the prompt before and no longer does`);
      }
    }
    expect(failures).toEqual([]);
    expect(Object.keys(before)).toHaveLength(14);
  });
});

describe("rule characters per prompt over the committed corpus", () => {
  it("reports the size of the two rules sections and keeps them bounded", () => {
    const average = (kind: "lookup" | "game") => {
      const rows = built.filter((b) => b.kind === kind);
      const sum = (pick: (b: Built) => number) => Math.round(rows.reduce((total, b) => total + pick(b), 0) / rows.length);
      return { prompts: rows.length, curated: sum((b) => b.ruleChars.curated), excerpts: sum((b) => b.ruleChars.excerpts) };
    };
    const lookup = average("lookup");
    const game = average("game");
    console.info(`rule characters per prompt, corpus average -- Quick Lookup (${lookup.prompts}): curated topics ${lookup.curated}, search excerpts ${lookup.excerpts}; In-Depth (${game.prompts}): curated topics ${game.curated}, search excerpts ${game.excerpts}`);
    // Search excerpts (with keyword sets and list items) stay under the roughly 7,500 characters shipped before the work.
    expect(lookup.excerpts).toBeLessThan(7500);
  });
});
