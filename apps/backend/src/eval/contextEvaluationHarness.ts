import type {
  AskAiRequest,
  LookupPromptContext,
  PromptContext,
  PromptInputContext
} from "../types/index.js";
import type { GameRulesTopic } from "../gameRules.js";
import type { RetrievedGameRule } from "../gameRulesRetrieval.js";
import type { ComboCatalog, ComboVariant } from "../commanderSpellbook/catalog.js";
import { MAX_PROMPT_CHAR_BUDGET, normalizeQuestion } from "../prompt/normalization.js";

const FALLBACK_QUESTION = "Resolve the stack";

const REQUIRED_GUARDRAIL_LINES = [
  "- Explain reasoning clearly and concisely.",
  "- State uncertainty when context is incomplete.",
  "- Do not invent hidden state, targets, or board conditions."
] as const;

type EvaluationCheckId =
  | "stack-order-preserved"
  | "final-question-behavior"
  | "required-guardrails-present"
  | "mtg-reference-present"
  | "general-game-context-section"
  | "populated-zones-section"
  | "scope-sentence-present"
  | "prompt-section-order"
  | "mana-spent-output"
  | "llm-prompt-omits-cardid"
  | "game-rules-section-present"
  | "game-rules-before-rulings"
  | "supplemental-rules-section-present"
  | "supplemental-rules-after-game-rules"
  | "supplemental-rules-before-rulings"
  | "prompt-under-budget"
  | "system2-conditional-selection"
  | "system3-expected-recall"
  | "system3-noise-excluded"
  | "lookup-guardrails-present"
  | "lookup-game-state-sections-omitted"
  | "lookup-card-enrichment"
  | "lookup-prompt-section-order";

/**
 * Optional human-labeled relevance expectations (DEC-047, REQ-032). Each field is
 * independent — a check runs only when its field is present, so legacy fixtures
 * without an `expected` block keep their original structural-only score.
 */
export type EvaluationFixtureExpected = {
  /** Exact set of System 2 topic ids `selectGameRulesTopics` should choose. */
  expectedSystem2TopicIds?: string[];
  /** Rule ids that must all appear in the System 3 supplemental top-5. */
  expectedSupplementalRuleIds?: string[];
  /** Rule ids that must NOT appear in the System 3 supplemental top-5. */
  forbiddenSupplementalRuleIds?: string[];
};

export type EvaluationFixture = {
  id: string;
  description: string;
  request: AskAiRequest;
  expected?: EvaluationFixtureExpected;
  /**
   * Set for the degraded scenario: the fixture is evaluated with no combo
   * catalog at all, proving the request is still answered normally and no combo
   * section appears.
   */
  disableComboEnrichment?: boolean;
};

/**
 * Build a `ComboCatalog` from the committed eval catalog fixture.
 *
 * The eval corpus is deliberately independent of
 * `apps/backend/data/commanderSpellbookCombos.json`, so refreshing the
 * production corpus can never churn a prompt golden. Membership is derived from
 * the variants rather than duplicated in the fixture, so the two cannot drift.
 */
export function buildEvalComboCatalog(variants: ComboVariant[]): ComboCatalog {
  const byOracleId = new Map<string, string[]>();
  const byTemplateOracleId = new Map<string, string[]>();

  const append = (membership: Map<string, string[]>, key: string, variantId: string) => {
    const existing = membership.get(key);
    if (existing) {
      if (!existing.includes(variantId)) existing.push(variantId);
    } else {
      membership.set(key, [variantId]);
    }
  };

  for (const variant of variants) {
    for (const ingredient of variant.cardIngredients) {
      append(byOracleId, ingredient.cardId, variant.variantId);
    }
    for (const ingredient of variant.templateIngredients) {
      for (const oracleId of ingredient.oracleIds) {
        append(byTemplateOracleId, oracleId, variant.variantId);
      }
    }
  }

  const byId = new Map(variants.map((variant) => [variant.variantId, variant]));

  return {
    byOracleId,
    byTemplateOracleId,
    variantCount: variants.length,
    getVariant: (variantId) => byId.get(variantId)
  };
}

/** Slice A/B outputs needed to evaluate the labeled relevance checks. */
export type ScenarioRelevance = {
  selectedTopics: GameRulesTopic[];
  supplementalRules: RetrievedGameRule[];
};

export type EvaluationCheckResult = {
  id: EvaluationCheckId;
  passed: boolean;
  details: string;
};

export type EvaluationResult = {
  fixtureId: string;
  passed: boolean;
  score: number;
  maxScore: number;
  checks: EvaluationCheckResult[];
};

function checkStackOrder(fixture: EvaluationFixture, context: PromptContext): EvaluationCheckResult {
  const expectedOrder = (
    "gameContext" in fixture.request ? fixture.request.gameContext.zones?.stack ?? [] : []
  ).map((card) => card.cardId);
  const actualOrder = context.orderedStack.map((card) => card.cardId);
  const passed = expectedOrder.join("|") === actualOrder.join("|");

  return {
    id: "stack-order-preserved",
    passed,
    details: passed
      ? "Stack card IDs remain in original bottom-to-top order."
      : `Expected order [${expectedOrder.join(", ")}], received [${actualOrder.join(", ")}].`
  };
}

function checkFinalQuestionBehavior(fixture: EvaluationFixture, context: PromptInputContext): EvaluationCheckResult {
  const normalizedInput = normalizeQuestion(fixture.request.question);
  const expectedQuestion =
    fixture.request.mode === "lookup"
      ? normalizedInput
      : normalizedInput.length > 0
        ? normalizedInput
        : FALLBACK_QUESTION;
  const passed = context.finalQuestion === expectedQuestion;

  return {
    id: "final-question-behavior",
    passed,
    details: passed
      ? `Final question resolved correctly to "${context.finalQuestion}".`
      : `Expected final question "${expectedQuestion}", received "${context.finalQuestion}".`
  };
}

function checkLookupGuardrails(promptText: string): EvaluationCheckResult {
  const required = [
    "quote rule text only from the provided GAME RULES / ADDITIONAL RELEVANT RULE EXCERPTS sections",
    "not found in the rules corpus",
    "never answer the off-domain question directly"
  ];
  const missing = required.filter((line) => !promptText.includes(line));
  return {
    id: "lookup-guardrails-present",
    passed: missing.length === 0,
    details:
      missing.length === 0
        ? "Lookup verbatim-fidelity and off-domain guardrails are present."
        : `Missing lookup guardrails: ${missing.join(" | ")}`
  };
}

function checkLookupGameStateSectionsOmitted(promptText: string): EvaluationCheckResult {
  const forbidden = ["GENERAL GAME CONTEXT", "PHASE GUIDANCE", "ZONE:", "\nSCOPE\n"];
  const present = forbidden.filter((section) => promptText.includes(section));
  return {
    id: "lookup-game-state-sections-omitted",
    passed: present.length === 0,
    details:
      present.length === 0
        ? "Lookup prompt omits every game-state-only section."
        : `Lookup prompt contains game-state-only sections: ${present.join(", ")}`
  };
}

function checkLookupCardEnrichment(
  fixture: EvaluationFixture,
  context: LookupPromptContext,
  promptText: string
): EvaluationCheckResult {
  const expectsCards =
    fixture.request.mode === "lookup" && (fixture.request.cards?.length ?? 0) > 0;
  const hasCardSection = promptText.includes("CARD (looked up)");
  const hasOfficialRulings = promptText.includes("OFFICIAL RULINGS");
  const cardMetadataPresent =
    !expectsCards ||
    (context.cards !== undefined &&
      context.cards.length > 0 &&
      context.cards.every(
        (card) => promptText.includes(`name: ${card.name}`) && promptText.includes(`oracleText: ${card.oracleText}`)
      ));
  const passed = expectsCards
    ? hasCardSection && hasOfficialRulings && cardMetadataPresent
    : !hasCardSection && !hasOfficialRulings;
  return {
    id: "lookup-card-enrichment",
    passed,
    details: passed
      ? expectsCards
        ? "Attached lookup card metadata and official rulings are present for every attached card."
        : "Card-only sections are omitted when lookup has no card."
      : "Lookup card/rulings section presence does not match the fixture request."
  };
}

function checkLookupPromptSectionOrder(promptText: string): EvaluationCheckResult {
  const orderedHeaders = [
    "SYSTEM ROLE PREAMBLE\n",
    "\nINSTRUCTIONS\n",
    "\nMTG REFERENCE\n",
    "\nGAME RULES (reference)\n",
    "\nQUESTION\n"
  ];
  const indexes = orderedHeaders.map((header) => promptText.indexOf(header));
  const passed = indexes.every((index) => index !== -1) && indexes.every((index, position) =>
    position === 0 || indexes[position - 1]! < index
  );
  return {
    id: "lookup-prompt-section-order",
    passed,
    details: passed
      ? "Lookup prompt sections appear in deterministic order."
      : "Expected lookup section order SYSTEM ROLE -> INSTRUCTIONS -> MTG REFERENCE -> GAME RULES -> QUESTION."
  };
}

function checkRequiredGuardrails(promptText: string): EvaluationCheckResult {
  const missingLines = REQUIRED_GUARDRAIL_LINES.filter((line) => !promptText.includes(line));
  const passed = missingLines.length === 0;

  return {
    id: "required-guardrails-present",
    passed,
    details: passed
      ? "All required guardrail instructions are present."
      : `Missing guardrail lines: ${missingLines.join(" | ")}`
  };
}

function checkMtgReferencePresent(promptText: string): EvaluationCheckResult {
  const hasMtgReference = promptText.includes("MTG REFERENCE");
  const hasLayerSystem = promptText.includes("layer system");
  const passed = hasMtgReference && hasLayerSystem;

  return {
    id: "mtg-reference-present",
    passed,
    details: passed
      ? "MTG reference block is present with expected rules content."
      : "MTG reference block or expected layer-system content is missing."
  };
}

function checkPromptSectionOrder(promptText: string): EvaluationCheckResult {
  const mtgReferenceIndex = promptText.indexOf("MTG REFERENCE");
  const gameContextIndex = promptText.indexOf("GENERAL GAME CONTEXT");
  const scopeIndex = promptText.indexOf("SCOPE");
  const questionIndex = promptText.indexOf("QUESTION");
  const passed =
    mtgReferenceIndex !== -1 &&
    gameContextIndex !== -1 &&
    scopeIndex !== -1 &&
    questionIndex !== -1 &&
    mtgReferenceIndex < gameContextIndex &&
    gameContextIndex < scopeIndex &&
    scopeIndex < questionIndex;

  return {
    id: "prompt-section-order",
    passed,
    details: passed
      ? "Prompt sections appear in deterministic order."
      : "Expected section order MTG REFERENCE -> GENERAL GAME CONTEXT -> SCOPE -> QUESTION."
  };
}

function checkGeneralGameContextSection(context: PromptContext, promptText: string): EvaluationCheckResult {
  const hasHeader = promptText.includes("GENERAL GAME CONTEXT");
  const hasTurnPhase = promptText.includes(`turnPhase: ${context.gameContext.turnPhase}`);
  const hasPlayerCount = promptText.includes(`playerCount: ${context.gameContext.playerCount}`);
  const missingPlayerLines = context.gameContext.players.filter(
    (player) => !promptText.includes(`${player.label}: lifeTotal=${player.lifeTotal}`)
  );
  const passed = hasHeader && hasTurnPhase && hasPlayerCount && missingPlayerLines.length === 0;

  return {
    id: "general-game-context-section",
    passed,
    details: passed
      ? "General game context section is present with deterministic turnPhase and player lines."
      : "Missing GENERAL GAME CONTEXT header and/or expected turnPhase/playerCount/player life-total lines."
  };
}

function checkPopulatedZonesSections(context: PromptContext, promptText: string): EvaluationCheckResult {
  const stackExpected = context.orderedStack.length > 0;
  const stackPresent = promptText.includes("ZONE: STACK (BOTTOM TO TOP)");
  const stackOk = stackExpected === stackPresent;

  const zoneSectionsMissing = context.populatedZones
    .filter((zone) => !promptText.includes(`ZONE: ${zone.zoneId.toUpperCase()}`))
    .map((zone) => zone.zoneId);

  const passed = stackOk && zoneSectionsMissing.length === 0;

  return {
    id: "populated-zones-section",
    passed,
    details: passed
      ? "Populated zone sections appear with correct headers."
      : `Zone section issues: stack expected=${String(stackExpected)} present=${String(stackPresent)}; missing zones: ${zoneSectionsMissing.join(", ")}`
  };
}

function checkScopeSentencePresent(promptText: string): EvaluationCheckResult {
  const passed = promptText.includes("SCOPE\n");

  return {
    id: "scope-sentence-present",
    passed,
    details: passed
      ? "Scope sentence section (SCOPE) is present."
      : "Scope sentence section (SCOPE) is missing from the prompt."
  };
}

function checkManaSpentOutput(context: PromptContext, promptText: string): EvaluationCheckResult {
  const missing = context.orderedStack.filter((item) => typeof item.manaSpent !== "number");
  const missingPromptLines = context.orderedStack.filter(
    (item) => !promptText.includes(`manaSpent: ${item.manaSpent ?? item.manaValue}`)
  );
  const passed = missing.length === 0;
  const promptPassed = missingPromptLines.length === 0;

  return {
    id: "mana-spent-output",
    passed: passed && promptPassed,
    details:
      passed && promptPassed
        ? "Every stack item has deterministic manaSpent value and prompt output line."
        : `Missing deterministic manaSpent context for: ${[
            ...missing.map((item) => item.cardId),
            ...missingPromptLines.map((item) => `${item.cardId}:prompt-line`)
          ].join(", ")}`
  };
}

function checkPromptOmitsCardId(promptText: string): EvaluationCheckResult {
  const hasCardIdField = promptText.includes("cardId:");
  const hasStackTargetWithId = /stack:[^\n]+\s\([^)]+\)/.test(promptText);
  const passed = !hasCardIdField && !hasStackTargetWithId;

  return {
    id: "llm-prompt-omits-cardid",
    passed,
    details: passed
      ? "LLM-facing prompt text omits internal cardId references."
      : "Prompt still contains cardId field lines or stack-target ID suffixes."
  };
}

function checkGameRulesSectionPresent(promptText: string): EvaluationCheckResult {
  const passed = promptText.includes("GAME RULES (reference)");

  return {
    id: "game-rules-section-present",
    passed,
    details: passed
      ? "GAME RULES (reference) section is present in the prompt."
      : "GAME RULES (reference) section is missing from the prompt."
  };
}

function checkGameRulesBeforeRulings(promptText: string): EvaluationCheckResult {
  const gameRulesIndex = promptText.indexOf("GAME RULES (reference)");
  const officialRulingsIndex = promptText.indexOf("OFFICIAL RULINGS");
  const hasGameRules = gameRulesIndex !== -1;
  const hasOfficialRulings = officialRulingsIndex !== -1;
  const passed = hasGameRules && (!hasOfficialRulings || gameRulesIndex < officialRulingsIndex);

  return {
    id: "game-rules-before-rulings",
    passed,
    details: passed
      ? "GAME RULES (reference) appears before OFFICIAL RULINGS (or no OFFICIAL RULINGS present)."
      : "GAME RULES (reference) is absent or appears after OFFICIAL RULINGS."
  };
}

function checkSupplementalRulesSectionPresent(promptText: string): EvaluationCheckResult {
  const hasSupplemental = promptText.includes("\nADDITIONAL RELEVANT RULE EXCERPTS\n");
  const disclaimerOk = !hasSupplemental || promptText.includes("Use these additional official rule excerpts");
  const passed = disclaimerOk;

  return {
    id: "supplemental-rules-section-present",
    passed,
    details: passed
      ? hasSupplemental
        ? "ADDITIONAL RELEVANT RULE EXCERPTS section is present with expected disclaimer."
        : "No supplemental rules retrieved; section correctly omitted."
      : "ADDITIONAL RELEVANT RULE EXCERPTS section is present but missing expected disclaimer text."
  };
}

function checkSupplementalRulesAfterGameRules(promptText: string): EvaluationCheckResult {
  const gameRulesIndex = promptText.indexOf("\nGAME RULES (reference)\n");
  const supplementalIndex = promptText.indexOf("\nADDITIONAL RELEVANT RULE EXCERPTS\n");
  const hasGameRules = gameRulesIndex !== -1;
  const hasSupplemental = supplementalIndex !== -1;
  const passed = !hasSupplemental || !hasGameRules || supplementalIndex > gameRulesIndex;

  return {
    id: "supplemental-rules-after-game-rules",
    passed,
    details: passed
      ? hasSupplemental && hasGameRules
        ? "ADDITIONAL RELEVANT RULE EXCERPTS appears after GAME RULES (reference)."
        : "Supplemental-to-game-rules ordering not applicable (one or both sections absent)."
      : "ADDITIONAL RELEVANT RULE EXCERPTS appears before GAME RULES (reference)."
  };
}

function checkSupplementalRulesBeforeRulings(promptText: string): EvaluationCheckResult {
  const supplementalIndex = promptText.indexOf("\nADDITIONAL RELEVANT RULE EXCERPTS\n");
  const officialRulingsIndex = promptText.indexOf("\nOFFICIAL RULINGS");
  const hasSupplemental = supplementalIndex !== -1;
  const hasOfficialRulings = officialRulingsIndex !== -1;
  const passed = !hasSupplemental || !hasOfficialRulings || supplementalIndex < officialRulingsIndex;

  return {
    id: "supplemental-rules-before-rulings",
    passed,
    details: passed
      ? hasSupplemental && hasOfficialRulings
        ? "ADDITIONAL RELEVANT RULE EXCERPTS appears before OFFICIAL RULINGS."
        : "Supplemental-to-rulings ordering not applicable (one or both sections absent)."
      : "ADDITIONAL RELEVANT RULE EXCERPTS appears after OFFICIAL RULINGS."
  };
}

function checkPromptUnderBudget(promptText: string): EvaluationCheckResult {
  const chars = promptText.length;
  const passed = chars < MAX_PROMPT_CHAR_BUDGET;

  return {
    id: "prompt-under-budget",
    passed,
    details: passed
      ? `Prompt is ${chars} chars, within ${MAX_PROMPT_CHAR_BUDGET} char budget.`
      : `Prompt is ${chars} chars, exceeds ${MAX_PROMPT_CHAR_BUDGET} char budget.`
  };
}

function checkSystem2ConditionalSelection(
  selectedTopicIds: Set<string>,
  expectedTopicIds: string[]
): EvaluationCheckResult {
  const expectedSet = new Set(expectedTopicIds);
  const missing = [...expectedSet].filter((id) => !selectedTopicIds.has(id)).sort();
  const unexpected = [...selectedTopicIds].filter((id) => !expectedSet.has(id)).sort();
  const passed = missing.length === 0 && unexpected.length === 0;

  return {
    id: "system2-conditional-selection",
    passed,
    details: passed
      ? "Selected System 2 topics exactly match the expected set."
      : `System 2 selection mismatch. Missing: [${missing.join(", ")}]; unexpected: [${unexpected.join(", ")}].`
  };
}

function checkSystem3ExpectedRecall(
  retrievedRuleIds: Set<string>,
  expectedRuleIds: string[]
): EvaluationCheckResult {
  const missing = expectedRuleIds.filter((id) => !retrievedRuleIds.has(id));
  const passed = missing.length === 0;

  return {
    id: "system3-expected-recall",
    passed,
    details: passed
      ? "All expected supplemental rule ids appear in the System 3 top-5."
      : `Missing expected supplemental rule ids from top-5: [${missing.join(", ")}].`
  };
}

function checkSystem3NoiseExcluded(
  retrievedRuleIds: Set<string>,
  forbiddenRuleIds: string[]
): EvaluationCheckResult {
  const present = forbiddenRuleIds.filter((id) => retrievedRuleIds.has(id));
  const passed = present.length === 0;

  return {
    id: "system3-noise-excluded",
    passed,
    details: passed
      ? "No forbidden noise rule ids appear in the System 3 top-5."
      : `Forbidden noise rule ids present in top-5: [${present.join(", ")}].`
  };
}

export function evaluateScenario(
  fixture: EvaluationFixture,
  context: PromptInputContext,
  promptText: string,
  relevance?: ScenarioRelevance
): EvaluationResult {
  const isLookup = fixture.request.mode === "lookup";
  const checks = isLookup
    ? [
        checkFinalQuestionBehavior(fixture, context),
        checkRequiredGuardrails(promptText),
        checkLookupGuardrails(promptText),
        checkMtgReferencePresent(promptText),
        checkLookupGameStateSectionsOmitted(promptText),
        checkLookupCardEnrichment(fixture, context as LookupPromptContext, promptText),
        checkLookupPromptSectionOrder(promptText),
        checkPromptOmitsCardId(promptText),
        checkGameRulesSectionPresent(promptText),
        checkGameRulesBeforeRulings(promptText),
        checkSupplementalRulesSectionPresent(promptText),
        checkSupplementalRulesAfterGameRules(promptText),
        checkSupplementalRulesBeforeRulings(promptText),
        checkPromptUnderBudget(promptText)
      ]
    : [
        checkStackOrder(fixture, context as PromptContext),
        checkFinalQuestionBehavior(fixture, context),
        checkRequiredGuardrails(promptText),
        checkMtgReferencePresent(promptText),
        checkGeneralGameContextSection(context as PromptContext, promptText),
        checkPopulatedZonesSections(context as PromptContext, promptText),
        checkScopeSentencePresent(promptText),
        checkPromptSectionOrder(promptText),
        checkManaSpentOutput(context as PromptContext, promptText),
        checkPromptOmitsCardId(promptText),
        checkGameRulesSectionPresent(promptText),
        checkGameRulesBeforeRulings(promptText),
        checkSupplementalRulesSectionPresent(promptText),
        checkSupplementalRulesAfterGameRules(promptText),
        checkSupplementalRulesBeforeRulings(promptText),
        checkPromptUnderBudget(promptText)
      ];

  // Labeled relevance checks (DEC-047) only run when the fixture supplies the
  // corresponding `expected` field and the harness passes Slice A/B outputs.
  if (relevance && fixture.expected) {
    const { expected } = fixture;
    if (expected.expectedSystem2TopicIds) {
      const selectedTopicIds = new Set(relevance.selectedTopics.map((topic) => topic.id));
      checks.push(checkSystem2ConditionalSelection(selectedTopicIds, expected.expectedSystem2TopicIds));
    }
    if (expected.expectedSupplementalRuleIds || expected.forbiddenSupplementalRuleIds) {
      const retrievedRuleIds = new Set(relevance.supplementalRules.map((rule) => rule.ruleId));
      if (expected.expectedSupplementalRuleIds) {
        checks.push(checkSystem3ExpectedRecall(retrievedRuleIds, expected.expectedSupplementalRuleIds));
      }
      if (expected.forbiddenSupplementalRuleIds) {
        checks.push(checkSystem3NoiseExcluded(retrievedRuleIds, expected.forbiddenSupplementalRuleIds));
      }
    }
  }

  const score = checks.filter((check) => check.passed).length;

  return {
    fixtureId: fixture.id,
    passed: score === checks.length,
    score,
    maxScore: checks.length,
    checks
  };
}

/**
 * Per-scenario inputs for the relevance report (Slice D, REQ-032). Carries the
 * Slice A selection and Slice B top-5 retrieval so the report mirrors production
 * scoring rather than a legacy all-topics / flat scorer.
 */
export type RelevanceReportInput = {
  fixtureId: string;
  selectedTopics: GameRulesTopic[];
  supplementalRules: RetrievedGameRule[];
  expected?: EvaluationFixtureExpected;
};

export type RelevanceReport = {
  text: string;
  allPassed: boolean;
};

function renderRelevanceScenario(input: RelevanceReportInput): { text: string; passed: boolean } {
  const { fixtureId, selectedTopics, supplementalRules, expected } = input;
  const lines: string[] = [`=== ${fixtureId} ===`];
  let passed = true;

  const topicIds = selectedTopics.map((topic) => topic.id);
  lines.push(`System 2 topics (${topicIds.length}): ${topicIds.length > 0 ? topicIds.join(", ") : "(none)"}`);

  if (expected?.expectedSystem2TopicIds) {
    const expectedSet = new Set(expected.expectedSystem2TopicIds);
    const selectedSet = new Set(topicIds);
    const missing = [...expectedSet].filter((id) => !selectedSet.has(id)).sort();
    const unexpected = [...selectedSet].filter((id) => !expectedSet.has(id)).sort();
    if (missing.length > 0 || unexpected.length > 0) {
      passed = false;
      lines.push(`  System 2 MISMATCH — missing: [${missing.join(", ")}]; unexpected: [${unexpected.join(", ")}]`);
    }
  }

  const expectedRuleIds = new Set(expected?.expectedSupplementalRuleIds ?? []);
  const forbiddenRuleIds = new Set(expected?.forbiddenSupplementalRuleIds ?? []);

  lines.push("System 3 top-5:");
  if (supplementalRules.length === 0) {
    lines.push("  (none)");
  } else {
    for (const rule of supplementalRules) {
      let tag = "";
      if (expectedRuleIds.has(rule.ruleId)) tag = "  [RECALL HIT]";
      else if (forbiddenRuleIds.has(rule.ruleId)) tag = "  [NOISE FAIL]";
      lines.push(`  ${rule.ruleId}  score=${rule.score.toFixed(2)}${tag}`);
    }
  }

  const retrievedRuleIds = new Set(supplementalRules.map((rule) => rule.ruleId));

  if (expected?.expectedSupplementalRuleIds) {
    const missing = expected.expectedSupplementalRuleIds.filter((id) => !retrievedRuleIds.has(id));
    if (missing.length > 0) passed = false;
    lines.push(
      `Expected supplemental: ${expected.expectedSupplementalRuleIds.join(", ")} — ${missing.length > 0 ? `MISSING: ${missing.join(", ")}` : "all hit"}`
    );
  }

  if (expected?.forbiddenSupplementalRuleIds) {
    const present = expected.forbiddenSupplementalRuleIds.filter((id) => retrievedRuleIds.has(id));
    if (present.length > 0) passed = false;
    lines.push(
      `Forbidden supplemental: ${expected.forbiddenSupplementalRuleIds.join(", ")} — ${present.length > 0 ? `PRESENT: ${present.join(", ")}` : "all excluded"}`
    );
  }

  lines.push(`Scenario: ${passed ? "PASS" : "FAIL"}`);

  return { text: lines.join("\n"), passed };
}

/**
 * Build a digestible before/after relevance report (Slice D, REQ-032, DEC-047):
 * one section per labeled scenario with System 2 topic ids, System 3 top-5 with
 * scores, recall hit/miss per expected id, and forbidden exclusion status.
 */
export function buildRelevanceReport(inputs: RelevanceReportInput[]): RelevanceReport {
  const sections = inputs.map((input) => renderRelevanceScenario(input));
  const passedCount = sections.filter((section) => section.passed).length;
  const summary = `=== Summary: ${passedCount}/${sections.length} scenarios passed ===`;
  const text = [...sections.map((section) => section.text), summary].join("\n\n");

  return { text, allPassed: passedCount === sections.length };
}

export function buildChecklistReport(results: EvaluationResult[]): string {
  const header = "fixtureId | score | checks";
  const divider = "---|---|---";
  const lines = results.map((result) => {
    const failingChecks = result.checks
      .filter((check) => !check.passed)
      .map((check) => check.id)
      .join(", ");
    const checkSummary = failingChecks.length > 0 ? `FAIL: ${failingChecks}` : "PASS";

    return `${result.fixtureId} | ${result.score}/${result.maxScore} | ${checkSummary}`;
  });

  return [header, divider, ...lines].join("\n");
}
