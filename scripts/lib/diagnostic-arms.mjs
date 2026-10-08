// Diagnostic prompt arms (REQ-230): evaluation-only, test-only variants of the
// production prompt, to tell "the AI never got the rule" from "the AI got it
// and the prompt was confusing".
//
//   A  the production prompt of the checkout the run executes from, untouched
//   B  presentation only: the same evidence units, regrouped, reordered and
//      headed -- none added, removed or reworded
//   C  A plus the case's deciding-rule bundle (each deciding rule, its parent,
//      its lettered subrules, as rule-index text in A's format), de-duplicated
//   D  C's evidence in B's presentation
//   P  A with one named preamble sentence replaced by an owner-approved
//      correction held in a committed file (refused until it is approved)
//
// Each arm is a pure function from the prompt the checkout prepared (its text)
// and committed data (the rule index) to a prompt string, with a revision id
// recorded on every record. Nothing under `apps/backend/src/prompt/`, routes or
// providers changes, and a case's reference answer never reaches an arm: the
// builder takes the deciding rule ids and nothing else about the case. C and D
// use those labels, so they answer "would complete evidence rescue this
// answer?", never "how good is the product?", and run only on the committed
// diagnostic manifest.
//
// An "evidence unit" is one curated rules-topic block, one supplemental rule
// excerpt block, one card's oracle-text block, or one card ruling line. The
// production lookup prompt is parsed into its known sections (the same headers
// `promptAssembly.ts` prints), so an unrecognised prompt shape is refused, not
// guessed at. Plain JavaScript over strings: runs under `node --test`.

import { letteredSubrules, parentRuleId } from "./rule-availability.mjs";

export const DIAGNOSTIC_MANIFEST_RELATIVE_PATH = "apps/backend/src/eval/answer-quality/manifests/diagnostic.json";
export const HELD_OUT_MANIFEST_RELATIVE_PATH = "apps/backend/src/eval/answer-quality/manifests/held-out.json";
export const ARM_P_CORRECTION_RELATIVE_PATH = "apps/backend/src/eval/answer-quality/arm-p-correction.json";

/**
 * Arm registry. `frozen` means the arm's revision id is fixed and may be used by
 * a live run and, for B and P, on a held-out case (REQ-230). B.1 was chosen from
 * what the production prompt does with its evidence across the diagnostic cases
 * (`node --import tsx scripts/diagnostic-arms-check.mjs --observations`, recorded in
 * docs/eval/answer-quality-investigation/OFFLINE-FINDINGS.md) and frozen on
 * 2026-10-07: any later change to its grouping is a new revision id (B.2), never an
 * edit of B.1. D inherits B's status; P is frozen only while its approved
 * correction file exists. `usesDecidingRules` marks the arms that read a case's
 * deciding-rule labels (C and D): diagnostic manifest only.
 */
export const ARM_REGISTRY = {
  A: { id: "A", revision: "A.1", title: "production prompt, untouched", frozen: true, usesDecidingRules: false },
  B: { id: "B", revision: "B.1", title: "same evidence, regrouped and headed", frozen: true, usesDecidingRules: false },
  C: { id: "C", revision: "C.1", title: "production prompt plus the deciding-rule bundle", frozen: true, usesDecidingRules: true },
  D: { id: "D", revision: "D.1", title: "the bundle's evidence in B's presentation", frozen: true, usesDecidingRules: true },
  P: { id: "P", revision: "P.1", title: "preamble sentence corrected", frozen: false, usesDecidingRules: false }
};

export const ARM_IDS = Object.keys(ARM_REGISTRY);

export function describeArm(armId, registry = ARM_REGISTRY) {
  const arm = registry[armId];
  if (!arm) throw new Error(`Unknown arm "${armId}": the arms are ${Object.keys(registry).join(", ")}.`);
  // D is B's presentation: it can be no firmer than B.
  const frozen = armId === "D" ? Boolean(arm.frozen && registry.B?.frozen) : Boolean(arm.frozen);
  return { ...arm, frozen };
}

// ---------------------------------------------------------------------------
// Parsing the production lookup prompt
// ---------------------------------------------------------------------------

/** The section headers `promptAssembly.ts` prints, in the order it prints them. */
const SECTION_HEADERS = [
  "GAME RULES (reference)",
  "ADDITIONAL RELEVANT RULE EXCERPTS",
  "CARD (looked up)",
  "OFFICIAL RULINGS (WotC reference)",
  "COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED",
  "CONVERSATION HISTORY",
  "QUESTION"
];

// Printed by promptFormatting.ts; used only when a prompt carries no excerpt section for an arm to extend.
const SUPPLEMENTAL_RULES_DISCLAIMER =
  "Use these additional official rule excerpts as reference. They do not override the user's submitted game state, stack order, zones, targets, notes, or card oracle text.";
const EXCERPT_HEADER = "ADDITIONAL RELEVANT RULE EXCERPTS";

const RULE_BLOCK_ID = /^(\d+\.\d+[a-z]*)\. /;

// Where one block ends and the next begins. A block may hold blank lines (a rule's "Example:" paragraph),
// so a blank line splits only when what follows has the shape of a block's first lines.
const BLOCK_BOUNDARY = {
  topics: /\n\n(?=(?!Example)[^\n]{1,80}[^.\n]\n\d+\.\d+[a-z]*\. )/,
  excerpts: /\n\n(?=\d+\.\d+[a-z]*\. )/,
  cards: /\n\n(?=name: )/,
  rulings: /\n\n(?=[^\n]+\n- \d{4}-\d{2}-\d{2}: )/
};

/** Splits a section body into its blocks: `kind` is topics, excerpts, cards or rulings. */
export function splitBlocks(kind, body) {
  return body.length > 0 ? body.split(BLOCK_BOUNDARY[kind]) : [];
}

function blocksAfterIntro(kind, sectionText, introLines) {
  // header + intro lines, a blank line, then blocks joined by blank lines.
  const lines = sectionText.split("\n");
  const introEnd = introLines;
  const intro = lines.slice(0, introEnd).join("\n");
  const rest = lines.slice(introEnd);
  if (rest[0] !== "") throw new Error(`Unrecognised prompt section "${lines[0]}": expected a blank line after its introduction.`);
  const body = rest.slice(1).join("\n");
  return { intro, blocks: splitBlocks(kind, body) };
}

/**
 * Splits a production lookup prompt into its static head, its known sections
 * and the question. `renderOriginal(parsed)` reproduces the prompt exactly.
 * Refuses an In-Depth prompt or any shape it does not recognise.
 */
export function parseLookupPrompt(promptText) {
  if (!promptText.startsWith("SYSTEM ROLE PREAMBLE\n")) throw new Error("Arms are defined for the production lookup prompt, which starts with SYSTEM ROLE PREAMBLE.");
  const positions = [];
  let cursor = 0;
  for (const header of SECTION_HEADERS) {
    const at = promptText.indexOf(`\n\n${header}\n`, cursor);
    if (at < 0) continue;
    positions.push({ header, start: at + 2 });
    cursor = at + 2;
  }
  if (!positions.some((p) => p.header === "QUESTION")) throw new Error("The prompt has no QUESTION section: not a production lookup prompt.");
  if (promptText.includes("\nZONE: ") || promptText.includes("\nSCOPE\n")) {
    throw new Error("Arms are defined for lookup prompts; this is an In-Depth (game) prompt.");
  }
  const head = promptText.slice(0, positions[0].start - 2);
  const sections = positions.map((position, index) => {
    const end = index + 1 < positions.length ? positions[index + 1].start - 2 : promptText.length;
    return { header: position.header, text: promptText.slice(position.start, end) };
  });

  const parsed = { head, sections: [], topics: null, excerpts: null, cards: null, rulings: null };
  for (const section of sections) {
    if (section.header === "GAME RULES (reference)") {
      const { intro, blocks } = blocksAfterIntro("topics", section.text, 2);
      parsed.topics = { intro, blocks };
    } else if (section.header === EXCERPT_HEADER) {
      const { intro, blocks } = blocksAfterIntro("excerpts", section.text, 2);
      for (const block of blocks) {
        if (!RULE_BLOCK_ID.test(block)) throw new Error(`An excerpt block does not start with a rule id: "${block.slice(0, 40)}".`);
      }
      parsed.excerpts = { intro, blocks };
    } else if (section.header === "CARD (looked up)") {
      parsed.cards = { blocks: splitBlocks("cards", section.text.slice("CARD (looked up)\n".length)) };
    } else if (section.header === "OFFICIAL RULINGS (WotC reference)") {
      const { intro, blocks } = blocksAfterIntro("rulings", section.text, 2);
      parsed.rulings = { intro, blocks };
    }
    parsed.sections.push(section.header);
  }
  parsed.rawSections = Object.fromEntries(sections.map((section) => [section.header, section.text]));
  return parsed;
}

/** Rebuilds the prompt from the parsed form in its original order. */
export function renderOriginal(parsed) {
  const parts = [parsed.head];
  for (const header of parsed.sections) {
    if (header === "GAME RULES (reference)") parts.push([parsed.topics.intro, "", parsed.topics.blocks.join("\n\n")].join("\n"));
    else if (header === EXCERPT_HEADER) parts.push([parsed.excerpts.intro, "", parsed.excerpts.blocks.join("\n\n")].join("\n"));
    else if (header === "CARD (looked up)") parts.push(["CARD (looked up)", parsed.cards.blocks.join("\n\n")].join("\n"));
    else if (header === "OFFICIAL RULINGS (WotC reference)") parts.push([parsed.rulings.intro, "", parsed.rulings.blocks.join("\n\n")].join("\n"));
    else parts.push(parsed.rawSections[header]);
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Evidence units
// ---------------------------------------------------------------------------

/**
 * The evidence units of a prompt, as `{ kind, text }`: each curated topic block,
 * each supplemental excerpt block, each card's oracle block, and each ruling
 * line (with its card's name, so two cards' identical lines stay distinct).
 */
export function evidenceUnits(parsed) {
  const units = [];
  for (const text of parsed.topics?.blocks ?? []) units.push({ kind: "topic", text });
  for (const text of parsed.excerpts?.blocks ?? []) units.push({ kind: "excerpt", text });
  for (const text of parsed.cards?.blocks ?? []) units.push({ kind: "card", text });
  for (const block of parsed.rulings?.blocks ?? []) {
    const [name, ...lines] = block.split("\n");
    const rulings = [];
    for (const line of lines) {
      if (line.startsWith("- ") || rulings.length === 0) rulings.push(line);
      else rulings[rulings.length - 1] += `\n${line}`; // a ruling's continuation line stays with it
    }
    for (const ruling of rulings) units.push({ kind: "ruling", text: `${name}\n${ruling}` });
  }
  return units;
}

/** Units as a sorted list of `kind:text`, so two prompts' units compare as multisets. */
export function unitMultiset(units) {
  return units.map((unit) => `${unit.kind}\u0000${unit.text}`).sort();
}

// ---------------------------------------------------------------------------
// Arm B: presentation
// ---------------------------------------------------------------------------

export const ARM_B_HEADINGS = {
  cards: "THE CARDS AND THEIR RULINGS",
  excerpts: "THE RULES FOR THIS QUESTION, IN RULE-NUMBER ORDER",
  topics: "BACKGROUND RULES"
};

function ruleSortKey(block) {
  const id = RULE_BLOCK_ID.exec(block)?.[1] ?? "0.0";
  const match = /^(\d+)\.(\d+)([a-z]*)$/.exec(id);
  return match ? [Number(match[1]), Number(match[2]), match[3]] : [0, 0, ""];
}

function compareRuleBlocks(a, b) {
  const [a1, a2, a3] = ruleSortKey(a);
  const [b1, b2, b3] = ruleSortKey(b);
  return a1 - b1 || a2 - b2 || (a3 < b3 ? -1 : a3 > b3 ? 1 : 0);
}

/** The ruling block that belongs to a card block: its first line is the card's name. */
function rulingBlockFor(cardBlock, rulingBlocks) {
  const name = /^name: (.*)$/m.exec(cardBlock)?.[1];
  return rulingBlocks.find((block) => block.split("\n")[0] === name) ?? null;
}

/**
 * Arm B (revision B.1): the same evidence units, regrouped into three headed
 * groups. Each card's oracle block is followed by its own rulings; the rule
 * excerpts follow in rule-number order, so a rule sits beside its lettered
 * exception; the curated background rules come last. Section introductions are
 * kept once, verbatim, under their group; combo, history and question sections
 * keep their text and their place before the question.
 */
export function renderArmB(parsed) {
  const parts = [parsed.head];

  const cardBlocks = parsed.cards?.blocks ?? [];
  const rulingBlocks = parsed.rulings?.blocks ?? [];
  if (cardBlocks.length > 0 || rulingBlocks.length > 0) {
    const group = [ARM_B_HEADINGS.cards];
    if (parsed.rulings) group.push(parsed.rulings.intro.split("\n").slice(1).join("\n"));
    const usedRulings = new Set();
    for (const cardBlock of cardBlocks) {
      group.push("", cardBlock);
      const rulingBlock = rulingBlockFor(cardBlock, rulingBlocks);
      if (rulingBlock) {
        usedRulings.add(rulingBlock);
        group.push("", rulingBlock);
      }
    }
    for (const rulingBlock of rulingBlocks) {
      if (!usedRulings.has(rulingBlock)) group.push("", rulingBlock); // a ruling block with no card block keeps its place in the group
    }
    parts.push(group.join("\n"));
  }

  if (parsed.excerpts && parsed.excerpts.blocks.length > 0) {
    const ordered = [...parsed.excerpts.blocks].sort(compareRuleBlocks);
    parts.push([ARM_B_HEADINGS.excerpts, parsed.excerpts.intro.split("\n").slice(1).join("\n"), "", ordered.join("\n\n")].join("\n"));
  }

  if (parsed.topics && parsed.topics.blocks.length > 0) {
    parts.push([ARM_B_HEADINGS.topics, parsed.topics.intro.split("\n").slice(1).join("\n"), "", parsed.topics.blocks.join("\n\n")].join("\n"));
  }

  for (const header of parsed.sections) {
    if (["GAME RULES (reference)", EXCERPT_HEADER, "CARD (looked up)", "OFFICIAL RULINGS (WotC reference)"].includes(header)) continue;
    parts.push(parsed.rawSections[header]);
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Arm C: the deciding-rule bundle
// ---------------------------------------------------------------------------

/** Rule ids a prompt already carries: its excerpt blocks and the rule lines of its curated topics. */
export function carriedRuleIds(parsed) {
  const ids = new Set();
  for (const block of parsed.excerpts?.blocks ?? []) ids.add(RULE_BLOCK_ID.exec(block)[1]);
  for (const block of parsed.topics?.blocks ?? []) {
    for (const line of block.split("\n")) {
      const match = RULE_BLOCK_ID.exec(line);
      if (match) ids.add(match[1]);
    }
  }
  return ids;
}

/**
 * The deciding-rule bundle: each deciding rule, its parent and its lettered
 * subrules, in first-seen order, de-duplicated, restricted to rules the
 * committed rule index holds. Mechanical: no new labelling (REQ-230).
 */
export function decidingRuleBundle({ decidingRuleIds, ruleIndex }) {
  const byId = new Map(ruleIndex.map((entry) => [entry.ruleId, entry]));
  const indexIds = [...byId.keys()];
  const ordered = [];
  const seen = new Set();
  const add = (ruleId) => {
    if (ruleId && !seen.has(ruleId) && byId.has(ruleId)) {
      seen.add(ruleId);
      ordered.push(ruleId);
    }
  };
  for (const ruleId of decidingRuleIds) {
    add(parentRuleId(ruleId));
    add(ruleId);
    for (const sub of letteredSubrules(ruleId, indexIds)) add(sub);
  }
  return ordered;
}

/** Arm C's parsed form: A's evidence plus the bundle rules A does not already carry, appended to the excerpts section in A's format. */
export function addBundleToParsed(parsed, { decidingRuleIds, ruleIndex }) {
  const carried = carriedRuleIds(parsed);
  const byId = new Map(ruleIndex.map((entry) => [entry.ruleId, entry]));
  const bundleRuleIds = decidingRuleBundle({ decidingRuleIds, ruleIndex }).filter((ruleId) => !carried.has(ruleId));
  if (bundleRuleIds.length === 0) return { parsed, bundleRuleIds };

  const added = bundleRuleIds.map((ruleId) => `${ruleId}. ${byId.get(ruleId).text}`);
  const next = { ...parsed, sections: [...parsed.sections] };
  if (parsed.excerpts) {
    next.excerpts = { intro: parsed.excerpts.intro, blocks: [...parsed.excerpts.blocks, ...added] };
  } else {
    next.excerpts = { intro: `${EXCERPT_HEADER}\n${SUPPLEMENTAL_RULES_DISCLAIMER}`, blocks: added };
    const after = next.sections.indexOf("GAME RULES (reference)");
    next.sections.splice(after + 1, 0, EXCERPT_HEADER);
  }
  return { parsed: next, bundleRuleIds };
}

// ---------------------------------------------------------------------------
// Arm P: the owner-approved preamble correction
// ---------------------------------------------------------------------------

/**
 * P refuses to run until its correction file exists and carries the owner's
 * approval date. The file: `{ "replaces": "<one sentence of the preamble>",
 * "correction": "<its replacement>", "approvedOn": "YYYY-MM-DD" }`.
 */
export function assertCorrectionApproved(correction) {
  if (!correction) {
    throw new Error(`Arm P is built but refused: its correction text file ${ARM_P_CORRECTION_RELATIVE_PATH} does not exist yet. The owner approves the wording first.`);
  }
  for (const field of ["replaces", "correction"]) {
    if (typeof correction[field] !== "string" || correction[field].trim().length === 0) {
      throw new Error(`Arm P is refused: the correction file has no "${field}" text.`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(correction.approvedOn ?? ""))) {
    throw new Error("Arm P is refused: the correction file carries no owner approval date (approvedOn: YYYY-MM-DD).");
  }
}

export function applyCorrection(promptText, correction) {
  assertCorrectionApproved(correction);
  const first = promptText.indexOf(correction.replaces);
  if (first < 0 || promptText.indexOf(correction.replaces, first + 1) >= 0) {
    throw new Error("Arm P is refused: the sentence it replaces must appear exactly once in the prompt.");
  }
  return promptText.slice(0, first) + correction.correction + promptText.slice(first + correction.replaces.length);
}

// ---------------------------------------------------------------------------
// The one entry point
// ---------------------------------------------------------------------------

/**
 * Builds an arm's prompt from the prompt the checkout prepared. The case's
 * reference answer is not an input: only its deciding rule ids are, and only
 * arms C and D read them. Returns `{ promptText, bundleRuleIds }`.
 */
export function buildArmPrompt({ arm, promptText, ruleIndex, decidingRuleIds = [], correction = null }) {
  if (arm === "A") return { promptText, bundleRuleIds: [] };
  if (arm === "P") return { promptText: applyCorrection(promptText, correction), bundleRuleIds: [] };
  const parsed = parseLookupPrompt(promptText);
  if (arm === "B") return { promptText: renderArmB(parsed), bundleRuleIds: [] };
  if (arm === "C") {
    const { parsed: withBundle, bundleRuleIds } = addBundleToParsed(parsed, { decidingRuleIds, ruleIndex });
    return { promptText: renderOriginal(withBundle), bundleRuleIds };
  }
  if (arm === "D") {
    const { parsed: withBundle, bundleRuleIds } = addBundleToParsed(parsed, { decidingRuleIds, ruleIndex });
    return { promptText: renderArmB(withBundle), bundleRuleIds };
  }
  throw new Error(`Unknown arm "${arm}": the arms are ${ARM_IDS.join(", ")}.`);
}

// ---------------------------------------------------------------------------
// Where an arm may run
// ---------------------------------------------------------------------------

/**
 * Refuses an arm on a case it may not run on (REQ-230), naming the case.
 * C and D (which read deciding-rule labels) run only on the diagnostic
 * manifest. B and P run elsewhere only on a held-out case and only under a
 * frozen revision. A runs anywhere. A live run needs every non-A arm frozen.
 */
export function validateArmUse({ armIds, caseIds, diagnosticIds, heldOutIds, live = false, registry = ARM_REGISTRY, correction = null }) {
  const problems = [];
  for (const armId of armIds) {
    const described = describeArm(armId, registry);
    if (armId === "A") continue;
    let { frozen } = described;
    if (armId === "P") {
      try {
        assertCorrectionApproved(correction);
        frozen = true; // P's revision is fixed by the owner's approval of its correction text
      } catch (error) {
        problems.push(error.message);
        continue;
      }
    }
    const arm = { ...described, frozen };
    if (live && !arm.frozen) {
      problems.push(`arm ${armId} (${arm.revision}) is not frozen under its revision id yet; a live run needs a frozen arm.`);
    }
    for (const caseId of caseIds) {
      if (diagnosticIds.has(caseId)) continue;
      if (arm.usesDecidingRules) {
        problems.push(`${caseId}: arm ${armId} reads deciding-rule labels and runs only on the diagnostic manifest, and this case is not in it.`);
      } else if (!heldOutIds.has(caseId)) {
        problems.push(`${caseId}: arm ${armId} runs only on the diagnostic manifest or, once frozen, the held-out manifest, and this case is in neither.`);
      } else if (!arm.frozen) {
        problems.push(`${caseId}: arm ${armId} (${arm.revision}) may run on a held-out case only under a frozen revision id.`);
      }
    }
  }
  if (problems.length > 0) throw new Error(`The arms refuse this run (${problems.length}):\n  ${problems.join("\n  ")}`);
}

/** A record's flags from where its case sits: `diagnostic` for every non-A arm, `heldOut` for a held-out case. */
export function armRecordFlags({ armId, caseId, heldOutIds }) {
  return { diagnostic: armId !== "A", heldOut: heldOutIds.has(caseId) };
}
