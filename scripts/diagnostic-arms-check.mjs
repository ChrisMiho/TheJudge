// Offline check of the diagnostic arms over the committed diagnostic manifest
// (REQ-230), against the real prompts this checkout prepares. For every case
// in `diagnostic.json` it builds arm A and arms B, C and D (lookup cases only; an
// In-Depth game case is not a lookup prompt) and proves, for every case, game
// cases included, that arm R's target paragraph appears in A exactly once and
// that R changes nothing else. For a lookup case it proves:
//   - parsing then rendering A reproduces it byte for byte;
//   - B's evidence units equal A's as a multiset, and B changes nothing but
//     order and headings;
//   - C adds only deciding-rule bundle rules to A (none that A already carries);
//   - D's evidence units equal C's;
//   - no arm's prompt contains the case's reference answer or its short answer.
// Prints one JSON object (`{ cases, problems }`) and exits 1 on any problem.
// With `--observations` it prints instead what arm B's grouping was chosen from
// (REQ-230): how the production prompt orders and repeats its evidence across the
// diagnostic cases. Nothing in it reads a reference answer.
// No provider, no network. Run via tsx (it prepares prompts with the backend):
//
//   node --import tsx scripts/diagnostic-arms-check.mjs

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARM_B_HEADINGS,
  ARM_R_RECIPE_RELATIVE_PATH,
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
import { parentRuleId } from "./lib/rule-availability.mjs";
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

/** Problems with arm R on one prompt: its target must appear once, and R must change nothing else. */
export function checkArmR({ id, promptText, recipe, ruleIndex }) {
  const occurrences = promptText.split(recipe.replaces).length - 1;
  if (occurrences !== 1) return [`${id}: arm R's target paragraph appears ${occurrences} times in arm A, not exactly once`];
  const r = buildArmPrompt({ arm: "R", promptText, ruleIndex, recipe }).promptText;
  if (r !== promptText.replace(recipe.replaces, () => recipe.recipe)) return [`${id}: arm R changed text other than the target paragraph`];
  return [];
}

export async function checkDiagnosticArms({ cases, manifest, resources, prepare, parseRequest, freezeCheck, recipe }) {
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

    // R (REQ-230) substitutes without parsing, so it is checked on every case, In-Depth game cases included:
    // the layers paragraph appears exactly once in A, and R's prompt is A with only that paragraph replaced.
    problems.push(...checkArmR({ id: entry.id, promptText: a, recipe, ruleIndex: resources.gameRulesRuleIndex }));

    // B, C and D parse the lookup prompt's sections and refuse an In-Depth prompt, so a game case stops here.
    if (caseEntry.gameState) continue;
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

/** What the production prompt does with its evidence, measured over the given arm-A prompts (no reference answers involved). */
export function observeArmAPrompts(prompts) {
  const stats = {
    prompts: prompts.length,
    meanChars: 0,
    meanExcerpts: 0,
    excerptsInRuleNumberOrder: 0,
    excerptsNotInRuleNumberOrder: 0,
    promptsWithRuleAndExceptionBothAttached: 0,
    ruleExceptionPairs: 0,
    pairsAdjacentInA: 0,
    pairsAdjacentInB: 0,
    duplicateUnitsAcrossSections: 0,
    excerptsAlsoInCuratedTopics: 0,
    promptsWithRulingsFarFromTheirCard: 0,
    cardRulingDistanceMeanCharsA: 0,
    cardRulingDistanceMeanCharsB: 0
  };
  let distanceA = 0;
  let distanceB = 0;
  let distanceCount = 0;
  for (const a of prompts) {
    const parsed = parseLookupPrompt(a);
    const b = buildArmPrompt({ arm: "B", promptText: a, ruleIndex: [] }).promptText;
    stats.meanChars += a.length;
    const blocks = parsed.excerpts?.blocks ?? [];
    stats.meanExcerpts += blocks.length;
    const ids = blocks.map((block) => /^(\d+\.\d+[a-z]*)\. /.exec(block)[1]);
    const sortedIds = [...ids].sort((x, y) => x.localeCompare(y, "en", { numeric: true }));
    if (JSON.stringify(ids) === JSON.stringify(sortedIds)) stats.excerptsInRuleNumberOrder += 1;
    else stats.excerptsNotInRuleNumberOrder += 1;
    let hadPair = false;
    for (const id of ids) {
      const parent = parentRuleId(id);
      if (!parent || !ids.includes(parent)) continue;
      hadPair = true;
      stats.ruleExceptionPairs += 1;
      if (Math.abs(ids.indexOf(id) - ids.indexOf(parent)) === 1) stats.pairsAdjacentInA += 1;
      const idsB = (parseBExcerptIds(b));
      if (Math.abs(idsB.indexOf(id) - idsB.indexOf(parent)) === 1) stats.pairsAdjacentInB += 1;
    }
    if (hadPair) stats.promptsWithRuleAndExceptionBothAttached += 1;
    const topicRuleIds = new Set((parsed.topics?.blocks ?? []).flatMap((block) => block.split("\n").map((line) => /^(\d+\.\d+[a-z]*)\. /.exec(line)?.[1]).filter(Boolean)));
    stats.excerptsAlsoInCuratedTopics += ids.filter((id) => topicRuleIds.has(id)).length;
    const units = unitMultiset(evidenceUnits(parsed));
    stats.duplicateUnitsAcrossSections += units.length - new Set(units).size;
    const names = (parsed.cards?.blocks ?? []).map((block) => /^name: (.*)$/m.exec(block)?.[1]);
    for (const name of names) {
      const cardAt = (text) => text.indexOf(`name: ${name}\n`);
      const rulingAt = (text) => text.indexOf(`\n${name}\n- `);
      if (cardAt(a) < 0 || rulingAt(a) < 0) continue;
      distanceCount += 1;
      distanceA += Math.abs(rulingAt(a) - cardAt(a));
      distanceB += Math.abs(rulingAt(b) - cardAt(b));
    }
  }
  const mean = (total, n) => (n === 0 ? 0 : Math.round((total / n) * 10) / 10);
  stats.meanChars = mean(stats.meanChars, prompts.length);
  stats.meanExcerpts = mean(stats.meanExcerpts, prompts.length);
  stats.cardRulingDistanceMeanCharsA = mean(distanceA, distanceCount);
  stats.cardRulingDistanceMeanCharsB = mean(distanceB, distanceCount);
  stats.promptsWithRulingsFarFromTheirCard = prompts.length; // in arm A the rulings always sit in a separate section after every card
  return stats;
}

function parseBExcerptIds(b) {
  const start = b.indexOf(`\n${ARM_B_HEADINGS.excerpts}\n`);
  const stop = b.indexOf(`\n${ARM_B_HEADINGS.topics}\n`);
  const body = b.slice(start, stop < 0 ? undefined : stop);
  return [...body.matchAll(/^(\d+\.\d+[a-z]*)\. /gm)].map((match) => match[1]);
}

async function main() {
  // Registers the TypeScript loader itself, so `node scripts/diagnostic-arms-check.mjs` runs without `--import tsx`.
  const { register } = await import("tsx/esm/api");
  register();
  const { preparePromptInput } = await import("../apps/backend/src/prompt/preparation.ts");
  const { loadFrozenVectors, checkReFreeze } = await import("../apps/backend/src/eval/rules-gate/frozenVectors.ts");
  const { parseCaseRequest } = await import("./lib/rules-gate-inputs.mjs");
  const resources = await loadPromptResources();
  const vectors = loadFrozenVectors();
  const manifest = JSON.parse(await readFile(resolve(repoRoot, DIAGNOSTIC_MANIFEST_RELATIVE_PATH), "utf8"));
  if (process.argv.includes("--observations")) {
    const casesById = new Map((await loadGoldCases()).map((caseEntry) => [caseEntry.id, caseEntry]));
    const prompts = [];
    for (const entry of manifest.cases) {
      const caseEntry = casesById.get(entry.id);
      const request = await parseCaseRequest(caseEntry);
      const freeze = checkReFreeze(caseEntry.id, request, resources.cardDetailIndex, vectors);
      prompts.push(preparePromptInput(request, { ...resources, queryEmbedding: freeze.state === "fresh" ? freeze.vector : null, supplementalRuleCap: 10 }).promptText);
    }
    console.log(JSON.stringify(observeArmAPrompts(prompts), null, 2));
    return;
  }
  const result = await checkDiagnosticArms({
    cases: await loadGoldCases(),
    manifest,
    resources,
    prepare: preparePromptInput,
    parseRequest: parseCaseRequest,
    freezeCheck: (caseId, request) => checkReFreeze(caseId, request, resources.cardDetailIndex, vectors),
    recipe: JSON.parse(await readFile(resolve(repoRoot, ARM_R_RECIPE_RELATIVE_PATH), "utf8"))
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
