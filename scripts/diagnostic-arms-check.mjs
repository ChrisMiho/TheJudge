// Offline check of the diagnostic arms over the committed diagnostic manifest
// (REQ-230), against the real prompts this checkout prepares. For every case
// in `diagnostic.json` it builds arm A and arms B, C and D and proves:
//   - parsing then rendering A reproduces it byte for byte;
//   - B's evidence units equal A's as a multiset, and B changes nothing but
//     order and headings;
//   - C adds only deciding-rule bundle rules to A (none that A already carries);
//   - D's evidence units equal C's;
//   - no arm's prompt contains the case's reference answer or its short answer.
// Prints one JSON object (`{ cases, problems }`) and exits 1 on any problem.
// No provider, no network. Run via tsx (it prepares prompts with the backend):
//
//   node --import tsx scripts/diagnostic-arms-check.mjs

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARM_B_HEADINGS,
  DIAGNOSTIC_MANIFEST_RELATIVE_PATH,
  buildArmPrompt,
  decidingRuleBundle,
  evidenceUnits,
  parseLookupPrompt,
  renderOriginal,
  splitBlocks,
  unitMultiset
} from "./lib/diagnostic-arms.mjs";
import { loadGoldCases } from "./lib/gold-cases.mjs";
import { loadPromptResources } from "./lib/prompt-fidelity.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The non-blank lines of a prompt as a sorted list, headings removed. Two prompts whose bags are equal
 * hold exactly the same text line for line, differing at most in order, blank lines and headings.
 */
export function lineBag(promptText, headings) {
  const skip = new Set(headings);
  return promptText
    .split("\n")
    .filter((line) => line.trim().length > 0 && !skip.has(line))
    .sort();
}

/** Lines in `bigger` beyond those in `smaller` (multiset difference); null when `smaller` is not contained in `bigger`. */
export function lineBagExtra(bigger, smaller) {
  const counts = new Map();
  for (const line of bigger) counts.set(line, (counts.get(line) ?? 0) + 1);
  for (const line of smaller) {
    const left = (counts.get(line) ?? 0) - 1;
    if (left < 0) return null;
    counts.set(line, left);
  }
  return [...counts].flatMap(([line, count]) => Array(count).fill(line));
}

export const A_HEADINGS = ["GAME RULES (reference)", "ADDITIONAL RELEVANT RULE EXCERPTS", "CARD (looked up)", "OFFICIAL RULINGS (WotC reference)"];

export async function checkDiagnosticArms({ cases, manifest, resources, prepare, parseRequest, freezeCheck }) {
  const byId = new Map(cases.map((caseEntry) => [caseEntry.id, caseEntry]));
  const problems = [];
  for (const entry of manifest.cases) {
    const caseEntry = byId.get(entry.id);
    if (!caseEntry) {
      problems.push(`${entry.id}: not in the corpus`);
      continue;
    }
    const request = await parseRequest(caseEntry);
    const freeze = freezeCheck(caseEntry.id, request);
    const prepared = prepare(request, { ...resources, queryEmbedding: freeze.state === "fresh" ? freeze.vector : null, supplementalRuleCap: 10 });
    const a = prepared.promptText;
    const parsedA = parseLookupPrompt(a);
    if (renderOriginal(parsedA) !== a) problems.push(`${entry.id}: parse then render does not reproduce arm A`);

    const decidingRuleIds = caseEntry.expected.decidingRuleIds;
    const args = { promptText: a, ruleIndex: resources.gameRulesRuleIndex, decidingRuleIds };
    const b = buildArmPrompt({ arm: "B", ...args }).promptText;
    const c = buildArmPrompt({ arm: "C", ...args });
    const d = buildArmPrompt({ arm: "D", ...args }).promptText;

    const unitsA = unitMultiset(evidenceUnits(parsedA));
    const parsedB = parseBPrompt(b, parsedA);
    if (JSON.stringify(unitMultiset(evidenceUnits(parsedB))) !== JSON.stringify(unitsA)) problems.push(`${entry.id}: arm B's evidence units differ from arm A's`);
    const bagA = lineBag(a, A_HEADINGS);
    if (JSON.stringify(lineBag(b, Object.values(ARM_B_HEADINGS))) !== JSON.stringify(bagA)) {
      problems.push(`${entry.id}: arm B changed text other than order and headings`);
    }

    const parsedC = parseLookupPrompt(c.promptText);
    const unitsC = unitMultiset(evidenceUnits(parsedC));
    const added = unitsC.filter((unit) => !unitsA.includes(unit));
    const bundle = new Set(decidingRuleBundle({ decidingRuleIds, ruleIndex: resources.gameRulesRuleIndex }));
    const addedIds = added.map((unit) => /^(\d+\.\d+[a-z]*)\. /.exec(unit.split("\u0000")[1])?.[1]);
    if (unitsC.length !== unitsA.length + added.length || addedIds.some((id) => !id || !bundle.has(id))) {
      problems.push(`${entry.id}: arm C added something other than bundle rules`);
    }
    if (JSON.stringify(addedIds.sort()) !== JSON.stringify([...c.bundleRuleIds].sort())) problems.push(`${entry.id}: arm C's reported bundle differs from what it added`);
    // Line for line, C holds all of A plus only the bundle blocks' lines (a new excerpts section brings its own header and introduction).
    const extraLines = lineBagExtra(lineBag(c.promptText, []), lineBag(a, []));
    const bundleLines = added.flatMap((unit) => unit.split("\u0000")[1].split("\n")).filter((line) => line.trim().length > 0);
    const introLines = parsedA.excerpts ? [] : ["ADDITIONAL RELEVANT RULE EXCERPTS", parsedC.excerpts?.intro.split("\n")[1]].filter(Boolean);
    const unexplained = extraLines && lineBagExtra(extraLines, [...bundleLines, ...introLines].sort());
    if (!extraLines || !unexplained || unexplained.length > 0) problems.push(`${entry.id}: arm C holds text beyond A and the bundle rules`);

    const parsedD = parseBPrompt(d, parseLookupPrompt(c.promptText));
    if (JSON.stringify(unitMultiset(evidenceUnits(parsedD))) !== JSON.stringify(unitsC)) problems.push(`${entry.id}: arm D's evidence units differ from arm C's`);

    // The reference answer of a tier 1 or 2 case is often a Comprehensive Rules or ruling sentence, so the
    // production prompt itself quotes it once the rule is retrieved. What an arm may never do is add it.
    for (const [armId, text] of [["B", b], ["C", c.promptText], ["D", d]]) {
      for (const [label, value] of [["answer", caseEntry.expected.answer], ["short answer", caseEntry.expected.shortAnswer]]) {
        if (text.includes(value) && !a.includes(value)) problems.push(`${entry.id}: arm ${armId} added the case's reference ${label} to the prompt`);
      }
    }
  }
  return { cases: manifest.cases.length, problems };
}

/**
 * Reads an arm B/D prompt back into units for the check: the group headings are ours, the blocks
 * beneath them are the originals. `like` is the arm-A parse it must be a rearrangement of.
 */
function parseBPrompt(promptText, like) {
  const lines = promptText.split("\n");
  const find = (heading) => lines.indexOf(heading);
  const parsed = { cards: { blocks: [] }, rulings: { blocks: [] }, excerpts: { blocks: [] }, topics: { blocks: [] } };
  const headingIndexes = [
    ["cards", find(ARM_B_HEADINGS.cards)],
    ["excerpts", find(ARM_B_HEADINGS.excerpts)],
    ["topics", find(ARM_B_HEADINGS.topics)]
  ].filter(([, index]) => index >= 0).sort((x, y) => x[1] - y[1]);
  const endOfGroups = (() => {
    const questionAt = lines.lastIndexOf("QUESTION");
    return questionAt >= 0 ? questionAt : lines.length;
  })();
  headingIndexes.forEach(([kind, start], i) => {
    const stop = i + 1 < headingIndexes.length ? headingIndexes[i + 1][1] : endOfGroups;
    const body = lines.slice(start + 1, stop).join("\n").trim();
    const introLine = kind === "cards" ? like.rulings?.intro.split("\n")[1] : kind === "excerpts" ? like.excerpts?.intro.split("\n")[1] : like.topics?.intro.split("\n")[1];
    const withoutIntro = introLine && body.startsWith(introLine) ? body.slice(introLine.length).trim() : body;
    if (kind === "cards") {
      // Each card block is followed by its own ruling block: split the group into paragraphs by block shape.
      for (const block of splitBlocks("cards", withoutIntro).flatMap((chunk) => chunk.split(/\n\n(?=[^\n]+\n- \d{4}-\d{2}-\d{2}: )/))) {
        (block.startsWith("name: ") ? parsed.cards.blocks : parsed.rulings.blocks).push(block);
      }
    } else {
      parsed[kind].blocks.push(...splitBlocks(kind, withoutIntro));
    }
  });
  return parsed;
}

async function main() {
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { loadFrozenVectors, checkReFreeze } = await import("../apps/backend/src/eval/rules-gate/frozenVectors.ts");
  const { parseCaseRequest } = await import("./lib/rules-gate-inputs.mjs");
  const resources = await loadPromptResources();
  const vectors = loadFrozenVectors();
  const manifest = JSON.parse(await readFile(resolve(repoRoot, DIAGNOSTIC_MANIFEST_RELATIVE_PATH), "utf8"));
  const result = await checkDiagnosticArms({
    cases: await loadGoldCases(),
    manifest,
    resources,
    prepare: preparePromptInput,
    parseRequest: parseCaseRequest,
    freezeCheck: (caseId, request) => checkReFreeze(caseId, request, resources.cardDetailIndex, vectors)
  });
  console.log(JSON.stringify(result));
  if (result.problems.length > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? new URL(`file://${resolve(process.argv[1])}`).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
