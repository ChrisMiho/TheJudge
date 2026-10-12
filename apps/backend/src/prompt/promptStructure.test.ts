// right-rules-in-order slice F: each prompt reads in one clear order (REQ-241, REQ-243, REQ-245).
import { describe, expect, it } from "vitest";
import type { CardDetailEntry } from "../cardDetail.js";
import type { ResolvedRulings } from "../cardRulings.js";
import { buildLookupPromptContext, buildPromptContext } from "./context.js";
import { buildLookupPromptText, buildPromptText } from "./promptAssembly.js";
import {
  LOOKUP_ROLE_PREAMBLE_LINES,
  SHARED_INSTRUCTION_LINES,
  SYSTEM_ROLE_PREAMBLE_LINES,
  formatZoneCardMetadataLines
} from "./promptFormatting.js";
import { MTG_LOOKUP_REFERENCE, MTG_PROMPT_REFERENCE } from "./mtgReference.js";
import type { GameAskAiRequest, LookupAskAiRequest } from "../types/index.js";

const BEAST: CardDetailEntry = {
  oracleText: "Vigilance, deathtouch, haste\nQuesting Beast can't be blocked by creatures with power 2 or less.",
  typeLine: "Legendary Creature — Beast",
  manaCost: "{2}{G}{G}",
  manaValue: 4,
  colors: ["G"],
  supertypes: ["Legendary"],
  subtypes: ["Beast"],
  keywords: ["Vigilance", "Deathtouch", "Haste"],
  power: "4",
  toughness: "4"
};
const WALKER: CardDetailEntry = {
  oracleText: "+1: Draw a card.\n−3: Destroy target creature.",
  typeLine: "Legendary Planeswalker — Test",
  manaCost: "{3}{U}",
  manaValue: 4,
  colors: ["U"],
  supertypes: ["Legendary"],
  subtypes: ["Test"],
  keywords: [],
  loyalty: "4"
};
const TWO_FACED: CardDetailEntry = {
  oracleText: "Front.\n// Back.",
  typeLine: "Creature — Human // Creature — Werewolf",
  manaCost: "{1}{G}",
  manaValue: 2,
  colors: ["G"],
  supertypes: [],
  subtypes: ["Human"],
  keywords: [],
  power: "2 // 3",
  toughness: "2 // 3"
};
const index = new Map<string, CardDetailEntry>([
  ["beast", BEAST],
  ["walker", WALKER],
  ["moon", TWO_FACED]
]);

const rulings: ResolvedRulings = {
  sectionChars: 40,
  cards: [{ cardId: "beast", name: "Questing Beast", rulings: [{ publishedAt: "2019-10-04", comment: "Only for blockers." }] }]
};

function gameRequest(): GameAskAiRequest {
  return {
    mode: "game",
    question: "What happens at cleanup?",
    gameContext: {
      playerCount: 2,
      players: [
        { label: "Player 1", lifeTotal: 20 },
        { label: "Player 2", lifeTotal: 20 }
      ],
      turnPhase: "cleanup",
      activePlayer: "Player 1",
      selectedZones: ["stack", "battlefield"],
      zones: {
        stack: [{ cardId: "beast", name: "Questing Beast", caster: "Player 1", targets: [] }],
        battlefield: [{ cardId: "beast", name: "Questing Beast", owner: "Player 1", targets: [] }]
      }
    }
  } as unknown as GameAskAiRequest;
}

function lookupRequest(): LookupAskAiRequest {
  return {
    mode: "lookup",
    question: "What does it do in the cleanup step?",
    cards: [
      { cardId: "beast", name: "Questing Beast" },
      { cardId: "walker", name: "Walker" },
      { cardId: "moon", name: "Moon" }
    ]
  } as unknown as LookupAskAiRequest;
}

const order = (text: string, headings: string[]) => headings.map((heading) => text.indexOf(`\n${heading}\n`) >= 0 ? text.indexOf(`\n${heading}\n`) : text.indexOf(heading));

describe("REQ-241 / REQ-243 section order", () => {
  it("In-Depth: preamble, instructions, reference, general context, phase guidance, zones (each card with its rulings), rules, excerpts, scope, history, question", () => {
    const context = buildPromptContext(gameRequest(), index);
    const prompt = buildPromptText(context, {
      rulings,
      gameRulesTopics: [{ id: "t", title: "Topic", ruleNumbers: ["117.1"], excerpt: "117.1. A rule." }],
      supplementalRules: [{ ruleId: "514.1", sectionTitle: "Cleanup Step", text: "514.1. First.", score: 1 }],
      conversationHistory: [
        { role: "user", content: "Earlier" },
        { role: "assistant", content: "Reply" }
      ]
    });
    const positions = order(prompt, [
      "SYSTEM ROLE PREAMBLE",
      "INSTRUCTIONS",
      "MTG REFERENCE",
      "GENERAL GAME CONTEXT",
      "PHASE GUIDANCE",
      "ZONE: STACK (BOTTOM TO TOP)",
      "ZONE: BATTLEFIELD",
      "GAME RULES (reference)",
      "ADDITIONAL RELEVANT RULE EXCERPTS",
      "SCOPE",
      "CONVERSATION HISTORY",
      "QUESTION"
    ]);
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    // The rulings follow the card's first appearance (the stack item), once, and there is no separate section.
    expect(prompt.match(/Rulings for Questing Beast/g)).toHaveLength(1);
    expect(prompt.indexOf("Rulings for Questing Beast")).toBeLessThan(prompt.indexOf("ZONE: BATTLEFIELD"));
    expect(prompt).not.toContain("OFFICIAL RULINGS");
  });

  it("Quick Lookup: preamble, instructions, reference, phase guidance (only when a step is named), rules, excerpts, cards (each with its rulings), history, question", () => {
    const context = buildLookupPromptContext(
      {
        ...lookupRequest(),
        conversationHistory: [
          { role: "user", content: "Earlier" },
          { role: "assistant", content: "Reply" }
        ]
      },
      index
    );
    const prompt = buildLookupPromptText(context, {
      rulings,
      namedSteps: ["cleanup"],
      gameRulesTopics: [{ id: "t", title: "Topic", ruleNumbers: ["117.1"], excerpt: "117.1. A rule." }],
      supplementalRules: [{ ruleId: "514.1", sectionTitle: "Cleanup Step", text: "514.1. First.", score: 1 }]
    });
    const positions = order(prompt, [
      "SYSTEM ROLE PREAMBLE",
      "INSTRUCTIONS",
      "MTG REFERENCE",
      "PHASE GUIDANCE",
      "GAME RULES (reference)",
      "ADDITIONAL RELEVANT RULE EXCERPTS",
      "CARD (looked up)",
      "CONVERSATION HISTORY",
      "QUESTION"
    ]);
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(prompt.indexOf("Rulings for Questing Beast")).toBeGreaterThan(prompt.indexOf("CARD (looked up)"));
    expect(prompt.indexOf("Rulings for Questing Beast")).toBeLessThan(prompt.indexOf("name: Walker"));
    expect(prompt).not.toContain("OFFICIAL RULINGS");
    // No phase guidance without a named step.
    expect(buildLookupPromptText(context, { rulings })).not.toContain("PHASE GUIDANCE");
  });
});

describe("REQ-243 one instruction list, a reference block per mode, one stack numbering", () => {
  const gamePrompt = () => buildPromptText(buildPromptContext(gameRequest(), index));
  const lookupPrompt = () => buildLookupPromptText(buildLookupPromptContext(lookupRequest(), index));

  it("both modes build their instructions from the one shared list; only the off-domain and follow-up lines differ", () => {
    for (const line of SHARED_INSTRUCTION_LINES) {
      expect(gamePrompt()).toContain(line);
      expect(lookupPrompt()).toContain(line);
    }
    expect(lookupPrompt()).toContain("not found in the rules corpus");
    expect(gamePrompt()).not.toContain("not found in the rules corpus");
    const withHistory = buildPromptText(buildPromptContext(gameRequest(), index), {
      conversationHistory: [{ role: "user", content: "x" }]
    });
    expect(withHistory).toContain("frozen game state and prior answers");
    expect(lookupPrompt()).not.toContain("frozen game state and prior answers");
  });

  it("the rules are framed once as binding, with one line that they never override the game state or a card's text", () => {
    const prompt = gamePrompt();
    expect(prompt.match(/binding rules of the game/g)).toHaveLength(1);
    expect(prompt.match(/never override the submitted game state/g)).toHaveLength(1);
    expect(prompt).not.toContain("shared vocabulary");
    expect(prompt).not.toContain("They do not override");
  });

  it("the stack is numbered one way (Stack item 1 is the bottom), and only In-Depth says so", () => {
    expect(SYSTEM_ROLE_PREAMBLE_LINES.join("\n")).toContain("Stack item 1 is the bottom of the stack");
    expect(LOOKUP_ROLE_PREAMBLE_LINES.join("\n")).not.toContain("Stack item");
    expect(gamePrompt()).not.toContain("stack[0]");
    expect(lookupPrompt()).not.toContain("stack[0]");
    expect(MTG_PROMPT_REFERENCE).not.toContain("stack[0]");
    expect(gamePrompt()).toContain("Stack item 1 (");
  });

  it("the Quick Lookup reference names no section, field or note a lookup prompt lacks; the In-Depth block keeps them", () => {
    for (const absent of ["turnPhase", "phase guidance", "scope note", "Zones (app model)", "turn-phase field", "stack —"]) {
      expect(MTG_LOOKUP_REFERENCE).not.toContain(absent);
    }
    expect(MTG_LOOKUP_REFERENCE).toContain("layer system");
    expect(MTG_LOOKUP_REFERENCE).toContain("items resolve top to bottom");
    expect(MTG_PROMPT_REFERENCE).toContain("turn phase as one of");
    expect(MTG_PROMPT_REFERENCE).toContain("Zones (app model)");
    expect(MTG_PROMPT_REFERENCE).not.toContain("shared vocabulary");
  });

  it("the lookup off-domain line drops the phrasing-glossary pointer and keeps REQ-168's meaning", () => {
    const prompt = lookupPrompt();
    expect(prompt).not.toContain("phrasing glossary");
    expect(prompt).toContain("as in-domain and answer it normally");
    expect(prompt).toContain("combo, infinite combo, aggro, control, ramp, tempo, stax, wheel, mill, blink, sacrifice outlet");
  });
});

describe("REQ-245 card blocks", () => {
  it("print power, toughness and loyalty when the card has them, and no line when it does not", () => {
    const prompt = buildLookupPromptText(buildLookupPromptContext(lookupRequest(), index));
    expect(prompt).toContain("subtypes: Beast\npower: 4\ntoughness: 4\noracleText: Vigilance");
    expect(prompt).toContain("subtypes: Test\nloyalty: 4\noracleText: +1: Draw a card.");
    // A card with none has no stat line at all.
    const none = buildLookupPromptText(buildLookupPromptContext({ ...lookupRequest(), cards: [{ cardId: "x", name: "Nothing" }] } as unknown as LookupAskAiRequest, new Map()));
    expect(none).not.toMatch(/^(?:power|toughness|loyalty):/m);
  });

  it("a multi-face card shows its faces' values joined with ' // '", () => {
    const prompt = buildLookupPromptText(buildLookupPromptContext(lookupRequest(), index));
    expect(prompt).toContain("power: 2 // 3\ntoughness: 2 // 3");
  });

  it("keep oracle text's line breaks in both modes, while the retrieval text stays one line", () => {
    const lookupContext = buildLookupPromptContext(lookupRequest(), index);
    expect(buildLookupPromptText(lookupContext)).toContain(
      "oracleText: Vigilance, deathtouch, haste\nQuesting Beast can't be blocked by creatures with power 2 or less."
    );
    expect(lookupContext.cards?.[0]?.oracleText).toBe("Vigilance, deathtouch, haste Questing Beast can't be blocked by creatures with power 2 or less.");
    const gameContext = buildPromptContext(gameRequest(), index);
    const game = buildPromptText(gameContext);
    expect(game).toContain("power: 4\ntoughness: 4\ntargets: (none)");
    expect(game).toContain("oracleText: Vigilance, deathtouch, haste\nQuesting Beast can't be blocked");
    expect(gameContext.orderedStack[0]?.oracleText).not.toContain("\n");
  });

  it("keep the stack's caster / manaSpent / copies lines in their places with the new lines present", () => {
    const context = buildPromptContext(gameRequest(), index);
    context.orderedStack[0]!.copies = 2;
    const stack = buildPromptText(context).split("ZONE: STACK (BOTTOM TO TOP)")[1]!.split("\n\n")[0]!;
    const lines = stack.split("\n").map((line) => line.split(":")[0]);
    const at = (name: string) => lines.indexOf(name);
    expect(at("subtypes")).toBeLessThan(at("power"));
    expect(at("toughness")).toBeLessThan(at("caster"));
    expect(at("caster")).toBeLessThan(at("targets"));
    expect(at("targets")).toBeLessThan(at("manaSpent"));
    expect(at("manaSpent")).toBeLessThan(at("copies"));
    expect(at("copies")).toBeLessThan(at("contextNotes"));
  });

  it("formatZoneCardMetadataLines falls back to the single-line oracle text", () => {
    const lines = formatZoneCardMetadataLines(
      { manaCost: "", manaValue: 0, typeLine: "", colors: [], supertypes: [], subtypes: [], targets: [], oracleText: "One line" },
      {} as never
    );
    expect(lines[lines.length - 1]).toBe("oracleText: One line");
  });
});
